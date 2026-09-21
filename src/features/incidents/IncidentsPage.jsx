import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const EMPTY_FORM = {
  occurredAt: '', incidentType: '', description: '', personsAffected: '',
  injuries: '', propertyDamage: '', immediateActions: '', emergencyServices: '',
};

// Matches the spec's Section 14 workflow exactly (minus "Incident Reported"
// itself, which is the act of creating the incident record) — order here
// is also the suggested order responders would typically log them in,
// though nothing enforces that server-side since real emergencies don't
// always go in a straight line.
const RESPONSE_STEPS = [
  { value: 'initial_assessment', label: 'Initial Assessment' },
  { value: 'team_activated', label: 'Response Team Activated' },
  { value: 'services_contacted', label: 'Emergency Services Contacted' },
  { value: 'evacuation_action', label: 'Evacuation / Protective Action' },
  { value: 'headcount', label: 'Headcount Taken' },
  { value: 'medical_assistance', label: 'Medical / Safety Assistance' },
  { value: 'incident_resolved', label: 'Incident Resolved' },
  { value: 'damage_assessment', label: 'Damage Assessment' },
  { value: 'recovery', label: 'Recovery Actions' },
  { value: 'post_incident_report', label: 'Post-Incident Report Filed' },
];
const STEP_LABELS = Object.fromEntries(RESPONSE_STEPS.map((s) => [s.value, s.label]));

const NEXT_MANUAL_STATUS = { open: 'responding', responding: 'resolved', resolved: 'closed' };

export default function IncidentsPage() {
  const { user } = useAuth();
  const canManage = hasRole(user, [...ROLE_GROUPS.DRRM_OPERATIONAL, 'school_head']);

  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const [detail, setDetail] = useState(null); // full incident detail incl. actions timeline
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionForm, setActionForm] = useState({ step: RESPONSE_STEPS[0].value, description: '' });

  const load = () => {
    setIsLoading(true);
    api.get('/incidents').then(setIncidents).catch((e) => setError(e.message)).finally(() => setIsLoading(false));
  };
  useEffect(load, []);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/incidents', { ...form, occurredAt: new Date(form.occurredAt).toISOString() });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openDetail = async (incident) => {
    try {
      setDetail(await api.get(`/incidents/${incident.id}`));
    } catch (err) {
      setError(err.message);
    }
  };

  const refreshDetail = async () => {
    if (!detail) return;
    setDetail(await api.get(`/incidents/${detail.id}`));
    load();
  };

  const advanceStatus = async () => {
    const next = NEXT_MANUAL_STATUS[detail.status];
    if (!next) return;
    try {
      await api.put(`/incidents/${detail.id}`, { status: next });
      refreshDetail();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/incidents/${detail.id}/actions`, actionForm);
      setShowActionForm(false);
      setActionForm({ step: RESPONSE_STEPS[0].value, description: '' });
      refreshDetail();
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'incident_code', header: 'ID' },
    { key: 'incident_type', header: 'Type', render: (r) => <span className="capitalize">{r.incident_type}</span> },
    { key: 'location', header: 'Location', render: (r) => r.building ? `${r.building}${r.room_area ? ' / ' + r.room_area : ''}` : '—' },
    { key: 'occurred_at', header: 'Occurred', render: (r) => new Date(r.occurred_at).toLocaleString() },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'view', header: '', render: (r) => (
        <button onClick={() => openDetail(r)} className="text-xs font-medium text-brand-700 hover:underline">View / Manage</button>
      ) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Incident Reporting & Monitoring</h1>
        {/* Anyone can file an incident report, per spec Section 1 */}
        <Button onClick={() => setShowForm(true)}>+ Report Incident</Button>
      </div>

      {error && !showForm && !detail && <div className="text-sm text-risk-critical mb-3">{error}</div>}
      <Table columns={columns} rows={incidents} isLoading={isLoading} emptyMessage="No incidents reported." />

      {showForm && (
        <Modal title="Report an Incident" onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField type="datetime-local" label="Date/Time Occurred" required value={form.occurredAt} onChange={handleChange('occurredAt')} />
              <FormField label="Incident Type" required value={form.incidentType} onChange={handleChange('incidentType')} placeholder="Fire, medical emergency, accident…" />
            </div>
            <FormField as="textarea" rows={2} label="Description" value={form.description} onChange={handleChange('description')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Persons Affected" value={form.personsAffected} onChange={handleChange('personsAffected')} />
              <FormField label="Injuries" value={form.injuries} onChange={handleChange('injuries')} />
            </div>
            <FormField label="Property Damage" value={form.propertyDamage} onChange={handleChange('propertyDamage')} />
            <FormField as="textarea" rows={2} label="Immediate Actions Taken" value={form.immediateActions} onChange={handleChange('immediateActions')} />
            <FormField label="Emergency Services Contacted" value={form.emergencyServices} onChange={handleChange('emergencyServices')} />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Submit Report</Button>
            </div>
          </form>
        </Modal>
      )}

      {detail && (
        <Modal title={`${detail.incident_code} — ${detail.incident_type}`} onClose={() => setDetail(null)} wide>
          <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Status:</span>
                <StatusBadge value={detail.status} />
              </div>
              {canManage && NEXT_MANUAL_STATUS[detail.status] && (
                <button onClick={advanceStatus} className="text-xs font-medium text-brand-700 hover:underline">
                  Advance to "{NEXT_MANUAL_STATUS[detail.status]}"
                </button>
              )}
            </div>

            {detail.description && (
              <div>
                <div className="text-sm font-medium text-slate-700 mb-1">Description</div>
                <p className="text-sm text-slate-600">{detail.description}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-700">Response Timeline</div>
              {canManage && <Button variant="secondary" onClick={() => setShowActionForm(true)}>+ Log Action</Button>}
            </div>

            {!detail.actions?.length ? (
              <div className="text-sm text-slate-400">No response actions logged yet.</div>
            ) : (
              <ol className="relative border-l border-slate-200 pl-4 space-y-4">
                {detail.actions.map((a) => (
                  <li key={a.id}>
                    <div className="absolute w-2 h-2 bg-brand-600 rounded-full -translate-x-[21px] mt-1.5" />
                    <div className="text-sm font-medium text-slate-800">{STEP_LABELS[a.step] || a.step}</div>
                    {a.description && <p className="text-sm text-slate-600 mt-0.5">{a.description}</p>}
                    <div className="text-xs text-slate-400 mt-1">
                      {a.first_name} {a.last_name} · {new Date(a.performed_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {showActionForm && (
            <div className="mt-5 pt-5 border-t border-slate-200">
              <form onSubmit={handleActionSubmit} className="space-y-3">
                <FormField as="select" label="Response Step" value={actionForm.step} onChange={(e) => setActionForm((f) => ({ ...f, step: e.target.value }))}>
                  {RESPONSE_STEPS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </FormField>
                <FormField as="textarea" rows={2} label="Details" value={actionForm.description} onChange={(e) => setActionForm((f) => ({ ...f, description: e.target.value }))} placeholder="What happened at this step" />
                {actionForm.step === 'incident_resolved' && (
                  <p className="text-xs text-slate-500">Logging this will also set the incident's status to Resolved.</p>
                )}
                {error && <div className="text-sm text-risk-critical">{error}</div>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setShowActionForm(false)}>Cancel</Button>
                  <Button type="submit">Log Action</Button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
