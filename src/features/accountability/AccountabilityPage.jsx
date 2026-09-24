import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { formatLocation } from '../../lib/useLocations';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const STATUS_STYLES = {
  unknown: { label: 'Unknown', color: 'bg-slate-100 text-slate-500 border-slate-200' },
  present: { label: 'Present', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  absent: { label: 'Absent', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  safe: { label: 'Safe', color: 'bg-green-50 text-green-700 border-green-200' },
  injured: { label: 'Injured', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  missing: { label: 'Missing', color: 'bg-red-50 text-red-700 border-red-200' },
  evacuated: { label: 'Evacuated', color: 'bg-teal-50 text-teal-700 border-teal-200' },
};
const QUICK_STATUSES = ['safe', 'evacuated', 'injured', 'missing', 'absent'];
const SUMMARY_ORDER = ['present', 'safe', 'evacuated', 'missing', 'injured', 'absent', 'unknown'];

const LEARNER_FIELDS = [
  ['present', 'Present'], ['absent', 'Absent'], ['safe', 'Safe'],
  ['injured', 'Injured'], ['missing', 'Missing'], ['evacuated', 'Evacuated'],
];
const EMPTY_LEARNER_FORM = { present: '', absent: '', safe: '', injured: '', missing: '', evacuated: '', notes: '' };

export default function AccountabilityPage() {
  const [activation, setActivation] = useState(undefined); // undefined = loading, null = none active
  const [tab, setTab] = useState('personnel'); // 'personnel' | 'learners'
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/emergency-mode/active').then(setActivation).catch((e) => setError(e.message));
  }, []);

  if (activation === undefined) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }

  if (!activation) {
    return (
      <div className="max-w-md">
        <h1 className="text-lg font-semibold text-slate-900 mb-2">Accountability / Headcount</h1>
        <p className="text-sm text-slate-500 mb-4">
          Accountability tracking is tied to an active emergency — there's nothing to track right now.
        </p>
        <Link to="/emergency-mode" className="text-sm font-medium text-brand-700 hover:underline">
          Go to Emergency Mode →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-slate-900">Accountability / Headcount</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Tracking for the active <span className="font-medium text-red-600">{activation.alert_type}</span> emergency.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setTab('personnel'); setError(''); }}
          className={`text-sm font-medium px-4 py-2 rounded-lg border ${tab === 'personnel' ? 'bg-brand-700 text-white border-brand-700' : 'bg-surface text-slate-600 border-slate-300 hover:bg-slate-50'}`}
        >
          Personnel
        </button>
        <button
          onClick={() => { setTab('learners'); setError(''); }}
          className={`text-sm font-medium px-4 py-2 rounded-lg border ${tab === 'learners' ? 'bg-brand-700 text-white border-brand-700' : 'bg-surface text-slate-600 border-slate-300 hover:bg-slate-50'}`}
        >
          Learners
        </button>
      </div>

      {error && <div className="text-sm text-risk-critical mb-3">{error}</div>}

      {tab === 'personnel' && <PersonnelTab activationId={activation.id} onError={setError} />}
      {tab === 'learners' && <LearnersTab activationId={activation.id} onError={setError} />}
    </div>
  );
}

// ---------- Personnel tab (individually-named staff roster — PII-restricted on the backend) ----------
function PersonnelTab({ activationId, onError }) {
  const [roster, setRoster] = useState([]);
  const [summary, setSummary] = useState([]);
  const [search, setSearch] = useState('');
  const [savingUserId, setSavingUserId] = useState(null);

  const load = () => {
    api.get(`/accountability/${activationId}/roster`).then(setRoster).catch((e) => onError(e.message));
    api.get(`/accountability/${activationId}/summary`).then(setSummary).catch(() => {});
  };
  useEffect(load, [activationId]);

  const countFor = (status) => summary.find((s) => s.status === status)?.count ?? 0;

  const setStatus = async (userId, status) => {
    setSavingUserId(userId);
    try {
      await api.post(`/accountability/${activationId}/status`, { userId, status });
      load();
    } catch (err) {
      onError(err.message);
    } finally {
      setSavingUserId(null);
    }
  };

  const filteredRoster = roster.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${r.first_name} ${r.last_name} ${r.position || ''}`.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-5">
        {SUMMARY_ORDER.map((status) => (
          <div key={status} className={`rounded-lg border px-2 py-2.5 text-center ${STATUS_STYLES[status].color}`}>
            <div className="text-lg font-bold">{countFor(status)}</div>
            <div className="text-[11px]">{STATUS_STYLES[status].label}</div>
          </div>
        ))}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or position…"
        className="w-full sm:w-80 text-sm rounded-lg border border-slate-300 px-3 py-2 mb-3"
      />

      <div className="bg-surface border border-slate-200 rounded-lg divide-y divide-slate-100">
        {!filteredRoster.length ? (
          <div className="text-sm text-slate-400 p-6 text-center">No matching personnel.</div>
        ) : (
          filteredRoster.map((person) => (
            <div key={person.user_id} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-800">{person.first_name} {person.last_name}</div>
                <div className="text-xs text-slate-500">{person.position || person.role.replaceAll('_', ' ')}</div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_STYLES[person.status].color}`}>
                  {STATUS_STYLES[person.status].label}
                </span>
                {QUICK_STATUSES.filter((s) => s !== person.status).map((status) => (
                  <button
                    key={status}
                    disabled={savingUserId === person.user_id}
                    onClick={() => setStatus(person.user_id, status)}
                    className="text-xs font-medium text-slate-600 border border-slate-300 rounded-full px-2.5 py-1 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Mark {STATUS_STYLES[status].label}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---------- Learners tab (per-classroom aggregate tallies — no individual student records) ----------
function LearnersTab({ activationId, onError }) {
  const [roster, setRoster] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editingClassroom, setEditingClassroom] = useState(null); // classroom row currently open in the tally modal
  const [form, setForm] = useState(EMPTY_LEARNER_FORM);

  const load = () => {
    api.get(`/accountability/${activationId}/learner-roster`).then(setRoster).catch((e) => onError(e.message));
    api.get(`/accountability/${activationId}/learner-summary`).then(setSummary).catch(() => {});
  };
  useEffect(load, [activationId]);

  const openTallyForm = (classroom) => {
    setEditingClassroom(classroom);
    setForm({
      present: classroom.present ?? '', absent: classroom.absent ?? '', safe: classroom.safe ?? '',
      injured: classroom.injured ?? '', missing: classroom.missing ?? '', evacuated: classroom.evacuated ?? '',
      notes: classroom.notes || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/accountability/${activationId}/learner-headcount`, {
        classroomId: editingClassroom.classroom_id,
        present: form.present === '' ? undefined : Number(form.present),
        absent: form.absent === '' ? undefined : Number(form.absent),
        safe: form.safe === '' ? undefined : Number(form.safe),
        injured: form.injured === '' ? undefined : Number(form.injured),
        missing: form.missing === '' ? undefined : Number(form.missing),
        evacuated: form.evacuated === '' ? undefined : Number(form.evacuated),
        notes: form.notes || undefined,
      });
      setEditingClassroom(null);
      load();
    } catch (err) {
      onError(err.message);
    }
  };

  if (!roster.length) {
    return (
      <div className="text-sm text-slate-500 bg-surface border border-slate-200 rounded-lg p-6 text-center">
        No classrooms have been set up yet — add classroom-to-route assignments under{' '}
        <Link to="/evacuation" className="text-brand-700 hover:underline">Evacuation → Classrooms</Link> first.
      </div>
    );
  }

  return (
    <div>
      {summary && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
          {LEARNER_FIELDS.map(([key, label]) => (
            <div key={key} className={`rounded-lg border px-2 py-2.5 text-center ${STATUS_STYLES[key]?.color || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              <div className="text-lg font-bold">{summary[key]}</div>
              <div className="text-[11px]">{label}</div>
            </div>
          ))}
        </div>
      )}
      {summary && (
        <div className="text-xs text-slate-500 mb-4">
          {summary.classrooms_reported} of {summary.classrooms_total} classroom(s) reported · {summary.total_expected} learners expected school-wide
        </div>
      )}

      <div className="bg-surface border border-slate-200 rounded-lg divide-y divide-slate-100">
        {roster.map((c) => {
          const reported = c.record_id != null;
          return (
            <div key={c.classroom_id} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-800">{formatLocation(c)}</div>
                <div className="text-xs text-slate-500">
                  {c.teacher_first_name ? `${c.teacher_first_name} ${c.teacher_last_name}` : 'No teacher assigned'}
                  {c.expected_count != null && ` · ${c.expected_count} learners expected`}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {reported ? (
                  <>
                    {LEARNER_FIELDS.filter(([key]) => c[key] != null).map(([key, label]) => (
                      <span key={key} className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_STYLES[key]?.color}`}>
                        {label}: {c[key]}
                      </span>
                    ))}
                  </>
                ) : (
                  <span className="text-xs text-slate-400">Not reported yet</span>
                )}
                <Button variant="secondary" onClick={() => openTallyForm(c)}>
                  {reported ? 'Update' : 'Record Headcount'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {editingClassroom && (
        <Modal title={`Headcount — ${formatLocation(editingClassroom)}`} onClose={() => setEditingClassroom(null)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LEARNER_FIELDS.map(([key, label]) => (
                <label key={key} className="block">
                  <span className="block text-xs font-medium text-slate-700 mb-1">{label}</span>
                  <input
                    type="number"
                    min="0"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
              ))}
            </div>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1">Notes</span>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditingClassroom(null)}>Cancel</Button>
              <Button type="submit">Save Headcount</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
