import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import Button from '../../components/Button';
import { useFeedback } from '../../components/Toast';

const ALERT_TYPES = ['Earthquake', 'Fire', 'Evacuation', 'Lockdown', 'Weather Suspension', 'Other'];

// Generic safety guidance by alert type — NOT admin-configurable data like
// contacts/ratings/buildings (those stay in the database per the spec's
// "never hard-code" rule). This is instructional copy, the same category
// as a static help page, so it's fine to ship as sensible defaults.
const INSTRUCTIONS = {
  Earthquake: ['Drop, Cover, and Hold On.', 'Stay away from windows and heavy furniture.', 'After shaking stops, evacuate calmly using the nearest safe route.', 'Proceed to the designated assembly area.'],
  Fire: ['Activate the nearest fire alarm if not already sounding.', 'Do not use elevators.', 'Stay low if there is smoke.', 'Evacuate immediately to the assembly area and await headcount.'],
  Evacuation: ['Leave belongings behind unless instructed otherwise.', 'Move calmly and quickly to your assigned evacuation route.', 'Proceed to the assembly area for headcount.'],
  Lockdown: ['Move away from doors and windows.', 'Lock or barricade the door if possible.', 'Stay silent and out of sight.', 'Wait for an official all-clear before moving.'],
  'Weather Suspension': ['Stay indoors, away from windows.', 'Follow announcements for pickup/dismissal instructions.', 'Do not attempt to leave campus until cleared.'],
  Other: ['Follow instructions from DRRM Team members and school officials.', 'Stay calm and await further updates on this screen.'],
};

function formatDuration(startIso) {
  const ms = Date.now() - new Date(startIso).getTime();
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function EmergencyModePage() {
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const canManage = hasRole(user, ROLE_GROUPS.DRRM_OPERATIONAL);
  const canAllClear = hasRole(user, ROLE_GROUPS.DRRM_MANAGERS);

  const [activation, setActivation] = useState(undefined); // undefined = loading, null = none active
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [, forceTick] = useState(0); // re-render every 30s so the duration display stays live

  // Reference data shown during an active emergency — fetched once the
  // console is up, not on the plain activate screen (no need to load it
  // before there's even an emergency).
  const [contacts, setContacts] = useState([]);
  const [evacuationAreas, setEvacuationAreas] = useState([]);
  const [teams, setTeams] = useState([]);
  const [openIncidents, setOpenIncidents] = useState([]);

  const [activateForm, setActivateForm] = useState({ alertType: 'Earthquake', notes: '', incidentId: '' });
  const [activating, setActivating] = useState(false);

  const [headcountForm, setHeadcountForm] = useState({ totalPersons: '', evacuated: '', accountedFor: '', missing: '', injured: '' });
  const [announcementForm, setAnnouncementForm] = useState({ message: '', channel: 'announcement', recipientGroup: '' });

  const loadActive = () => {
    api.get('/emergency-mode/active')
      .then((a) => setActivation(a))
      .catch((e) => setError(e.message));
  };
  useEffect(loadActive, []);

  useEffect(() => {
    if (activation) {
      api.get(`/emergency-mode/${activation.id}`).then(setDetail).catch((e) => setError(e.message));
      Promise.all([
        api.get('/emergency-contacts').catch(() => []),
        api.get('/evacuation/areas').catch(() => []),
        api.get('/drrm-teams').catch(() => []),
      ]).then(([c, a, t]) => { setContacts(c); setEvacuationAreas(a); setTeams(t); });
    } else if (activation === null) {
      api.get('/incidents?status=open').then(setOpenIncidents).catch(() => {});
    }
  }, [activation]);

  useEffect(() => {
    if (!activation) return;
    const interval = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(interval);
  }, [activation]);

  const refreshDetail = async () => {
    const a = await api.get('/emergency-mode/active');
    setActivation(a);
    if (a) setDetail(await api.get(`/emergency-mode/${a.id}`));
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    setActivating(true);
    setError('');
    try {
      await api.post('/emergency-mode/activate', {
        alertType: activateForm.alertType,
        notes: activateForm.notes || undefined,
        incidentId: activateForm.incidentId || undefined,
      });
      await refreshDetail();
    } catch (err) {
      setError(err.message);
    } finally {
      setActivating(false);
    }
  };

  const handleAllClear = async () => {
    const ok = await confirm({
      title: 'Declare All Clear?',
      message: 'This ends the active emergency for everyone. Make sure all persons are accounted for first.',
      confirmLabel: 'Declare All Clear',
    });
    if (!ok) return;
    try {
      await api.put(`/emergency-mode/${activation.id}/all-clear`);
      setActivation(null);
      setDetail(null);
      toast.success('All Clear declared. Emergency Mode has ended.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleHeadcountSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/emergency-mode/${activation.id}/headcount`, {
        totalPersons: headcountForm.totalPersons === '' ? undefined : Number(headcountForm.totalPersons),
        evacuated: headcountForm.evacuated === '' ? undefined : Number(headcountForm.evacuated),
        accountedFor: headcountForm.accountedFor === '' ? undefined : Number(headcountForm.accountedFor),
        missing: headcountForm.missing === '' ? undefined : Number(headcountForm.missing),
        injured: headcountForm.injured === '' ? undefined : Number(headcountForm.injured),
      });
      setHeadcountForm({ totalPersons: '', evacuated: '', accountedFor: '', missing: '', injured: '' });
      setDetail(await api.get(`/emergency-mode/${activation.id}`));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/emergency-mode/${activation.id}/announcements`, announcementForm);
      setAnnouncementForm({ message: '', channel: 'announcement', recipientGroup: '' });
      setDetail(await api.get(`/emergency-mode/${activation.id}`));
    } catch (err) {
      setError(err.message);
    }
  };

  if (activation === undefined) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }

  // ---------- NOT ACTIVE: minimal activation screen ----------
  if (!activation) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-lg font-semibold text-slate-900 mb-1">Emergency Mode</h1>
        <p className="text-sm text-slate-500 mb-6">No active emergency. Use this only for a real situation requiring an immediate, school-wide response.</p>

        <form onSubmit={handleActivate} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type of Emergency</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALERT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActivateForm((f) => ({ ...f, alertType: type }))}
                  className={`text-sm font-medium px-3 py-3 rounded-lg border ${
                    activateForm.alertType === type ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {openIncidents.length > 0 && (
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1">Link to an open incident (optional)</span>
              <select
                value={activateForm.incidentId}
                onChange={(e) => setActivateForm((f) => ({ ...f, incidentId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {openIncidents.map((i) => <option key={i.id} value={i.id}>{i.incident_code} — {i.incident_type}</option>)}
              </select>
            </label>
          )}

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</span>
            <textarea
              rows={2}
              value={activateForm.notes}
              onChange={(e) => setActivateForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Anything responders should know immediately"
            />
          </label>

          {error && <div className="text-sm text-risk-critical">{error}</div>}

          <button
            type="submit"
            disabled={activating}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-base font-bold py-4 rounded-xl transition-colors"
          >
            {activating ? 'Activating…' : '🚨 ACTIVATE EMERGENCY MODE'}
          </button>
        </form>
      </div>
    );
  }

  // ---------- ACTIVE: full command console ----------
  const instructions = INSTRUCTIONS[activation.alert_type] || INSTRUCTIONS.Other;
  const latestHeadcount = detail?.headcounts?.[0];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-red-600 text-white rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wide text-red-100 font-medium">Emergency Mode Active</div>
            <div className="text-2xl font-bold">{activation.alert_type}</div>
            <div className="text-sm text-red-100 mt-1">
              Activated by {activation.activated_by_first_name} {activation.activated_by_last_name} · {formatDuration(activation.activated_at)} ago
            </div>
            {detail?.incident_code && <div className="text-sm text-red-100 mt-0.5">Linked incident: {detail.incident_code} — {detail.incident_type}</div>}
            {activation.notes && <div className="text-sm text-red-50 mt-2 bg-red-700/40 rounded-lg px-3 py-2">{activation.notes}</div>}
          </div>
          {canAllClear && (
            <button onClick={handleAllClear} className="bg-white text-red-700 font-bold text-sm px-5 py-3 rounded-lg hover:bg-red-50 shrink-0">
              Declare All Clear
            </button>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-risk-critical">{error}</div>}

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">What to Do</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
          {instructions.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Emergency Contacts</h2>
        {!contacts.length ? (
          <div className="text-sm text-slate-400">No contacts on file yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {contacts.slice(0, 8).map((c) => (
              <a key={c.id} href={`tel:${c.contact_number}`} className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2.5 text-sm">
                <span className="text-slate-700 font-medium">{c.organization}</span>
                <span className="text-brand-700">{c.contact_number}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Evacuation Areas</h2>
        {!evacuationAreas.length ? (
          <div className="text-sm text-slate-400">No evacuation areas on file yet.</div>
        ) : (
          <ul className="space-y-1.5">
            {evacuationAreas.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-slate-700">{a.name}</span>
                <span className="text-slate-500">Capacity {a.capacity}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Assigned Response Teams</h2>
        {!teams.length ? (
          <div className="text-sm text-slate-400">No teams set up yet.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => (
              <span key={t.id} className="text-xs font-medium bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full">
                {t.name} ({t.active_member_count})
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Headcount / Accountability</h2>
        {latestHeadcount ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 text-center">
            {[
              ['Total', latestHeadcount.total_persons],
              ['Evacuated', latestHeadcount.evacuated],
              ['Accounted For', latestHeadcount.accounted_for],
              ['Missing', latestHeadcount.missing],
              ['Injured', latestHeadcount.injured],
            ].map(([label, value]) => (
              <div key={label} className="bg-slate-50 rounded-lg py-2.5">
                <div className="text-lg font-bold text-slate-900">{value ?? '—'}</div>
                <div className="text-[11px] text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400 mb-4">No headcount recorded yet.</div>
        )}

        {canManage && (
          <form onSubmit={handleHeadcountSubmit} className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              ['totalPersons', 'Total'], ['evacuated', 'Evacuated'], ['accountedFor', 'Accounted'],
              ['missing', 'Missing'], ['injured', 'Injured'],
            ].map(([key, label]) => (
              <input
                key={key}
                type="number"
                min="0"
                placeholder={label}
                value={headcountForm[key]}
                onChange={(e) => setHeadcountForm((f) => ({ ...f, [key]: e.target.value }))}
                className="text-sm rounded-lg border border-slate-300 px-2 py-2 text-center"
              />
            ))}
            <div className="col-span-5">
              <Button type="submit" className="w-full justify-center">Update Headcount</Button>
            </div>
          </form>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Emergency Communications</h2>
        <p className="text-xs text-slate-400 mb-3">Logged in-system for this activation. SMS/email delivery isn't wired in yet — that's Phase 5.</p>

        {canManage && (
          <form onSubmit={handleAnnouncementSubmit} className="space-y-2 mb-4">
            <textarea
              rows={2}
              required
              value={announcementForm.message}
              onChange={(e) => setAnnouncementForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Announcement message"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
            />
            <div className="flex gap-2">
              <select
                value={announcementForm.channel}
                onChange={(e) => setAnnouncementForm((f) => ({ ...f, channel: e.target.value }))}
                className="text-sm rounded-lg border border-slate-300 px-2 py-2"
              >
                <option value="announcement">School Announcement</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="in_system">In-System Only</option>
              </select>
              <input
                type="text"
                placeholder="Recipient group (e.g. All Staff)"
                value={announcementForm.recipientGroup}
                onChange={(e) => setAnnouncementForm((f) => ({ ...f, recipientGroup: e.target.value }))}
                className="flex-1 text-sm rounded-lg border border-slate-300 px-3 py-2"
              />
              <Button type="submit">Send</Button>
            </div>
          </form>
        )}

        {!detail?.announcements?.length ? (
          <div className="text-sm text-slate-400">No announcements logged yet.</div>
        ) : (
          <ul className="space-y-2">
            {detail.announcements.map((a) => (
              <li key={a.id} className="text-sm bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-slate-700">{a.message}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {a.channel} · {a.recipient_group || 'No group specified'} · {a.first_name} {a.last_name} · {new Date(a.sent_at).toLocaleTimeString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
