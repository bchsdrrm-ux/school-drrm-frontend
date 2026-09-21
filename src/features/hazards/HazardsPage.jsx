import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import { useLocations, locationLabel, formatLocation } from '../../lib/useLocations';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const LIKELIHOOD_LABELS = { 1: 'Rare', 2: 'Unlikely', 3: 'Possible', 4: 'Likely', 5: 'Almost Certain' };
const IMPACT_LABELS = { 1: 'Negligible', 2: 'Minor', 3: 'Moderate', 4: 'Major', 5: 'Catastrophic' };

const EMPTY_FORM = {
  hazardType: 'natural',
  hazardName: '',
  locationId: '',
  description: '',
  personsAffected: '',
  existingControls: '',
  likelihoodValue: 3,
  impactValue: 3,
  recommendedAction: '',
  targetDate: '',
  status: 'open',
  remarks: '',
};

export default function HazardsPage() {
  const { user } = useAuth();
  const { locations } = useLocations();
  const [hazards, setHazards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [evidenceHazardId, setEvidenceHazardId] = useState(null); // hazard currently open in the Evidence modal

  const canEdit = hasRole(user, [...ROLE_GROUPS.DRRM_OPERATIONAL, 'school_head']);

  const load = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (locationFilter) params.set('locationId', locationFilter);
    const query = params.toString() ? `?${params.toString()}` : '';
    api.get(`/hazards${query}`)
      .then(setHazards)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [statusFilter, locationFilter]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/hazards', {
        ...form,
        locationId: form.locationId || undefined,
        likelihoodValue: Number(form.likelihoodValue),
        impactValue: Number(form.impactValue),
        targetDate: form.targetDate || undefined,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'hazard_code', header: 'ID' },
    { key: 'hazard_name', header: 'Hazard' },
    { key: 'hazard_type', header: 'Type', render: (r) => <span className="capitalize">{r.hazard_type.replace('_', ' ')}</span> },
    { key: 'location', header: 'Location', render: formatLocation },
    { key: 'risk_level', header: 'Risk Level', render: (r) => <StatusBadge value={r.risk_level} type="risk" /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'target_date', header: 'Target Date', render: (r) => r.target_date ? new Date(r.target_date).toLocaleDateString() : '—' },
    { key: 'evidence', header: '', render: (r) => (
        <button
          onClick={() => setEvidenceHazardId(r.id)}
          className="text-xs font-medium text-brand-700 hover:underline"
        >
          📎 Evidence
        </button>
      ) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Hazard Inventory & Risk Assessment</h1>
        {/* Any staff member may report a hazard, per spec Section 1 permissions */}
        <Button onClick={() => setShowForm(true)}>+ Report Hazard</Button>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          {['', 'open', 'ongoing', 'monitoring', 'completed'].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                statusFilter === s ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {s ? s[0].toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
        >
          <option value="">All locations</option>
          {locations.map((loc) => <option key={loc.id} value={loc.id}>{locationLabel(loc)}</option>)}
        </select>
      </div>

      {error && !showForm && <div className="text-sm text-risk-critical mb-3">{error}</div>}

      <Table columns={columns} rows={hazards} isLoading={isLoading} emptyMessage="No hazards reported yet." />

      {showForm && (
        <Modal title="Report a Hazard" onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField as="select" label="Hazard Type" value={form.hazardType} onChange={handleChange('hazardType')}>
                <option value="natural">Natural</option>
                <option value="human_induced">Human-Induced</option>
              </FormField>
              <FormField label="Hazard Name" required value={form.hazardName} onChange={handleChange('hazardName')} placeholder="e.g. Cracked ceiling" />
            </div>

            <FormField as="select" label="Location" value={form.locationId} onChange={handleChange('locationId')}>
              <option value="">Not specified</option>
              {locations.map((loc) => <option key={loc.id} value={loc.id}>{locationLabel(loc)}</option>)}
            </FormField>

            <FormField as="textarea" rows={2} label="Description" value={form.description} onChange={handleChange('description')} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Persons Potentially Affected" value={form.personsAffected} onChange={handleChange('personsAffected')} placeholder="Learners, staff, visitors…" />
              <FormField label="Existing Controls" value={form.existingControls} onChange={handleChange('existingControls')} />
            </div>

            {/* Risk Level is system-calculated server-side from these two values —
                never entered directly, per the spec's acceptance criteria. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField as="select" label="Likelihood" value={form.likelihoodValue} onChange={handleChange('likelihoodValue')}>
                {Object.entries(LIKELIHOOD_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>{v} – {label}</option>
                ))}
              </FormField>
              <FormField as="select" label="Impact / Severity" value={form.impactValue} onChange={handleChange('impactValue')}>
                {Object.entries(IMPACT_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>{v} – {label}</option>
                ))}
              </FormField>
            </div>

            <FormField as="textarea" rows={2} label="Recommended Action" value={form.recommendedAction} onChange={handleChange('recommendedAction')} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField type="date" label="Target Date" value={form.targetDate} onChange={handleChange('targetDate')} />
              <FormField as="select" label="Status" value={form.status} onChange={handleChange('status')}>
                <option value="open">Open</option>
                <option value="ongoing">Ongoing</option>
                <option value="monitoring">Monitoring</option>
                <option value="completed">Completed</option>
              </FormField>
            </div>

            <FormField as="textarea" rows={2} label="Remarks" value={form.remarks} onChange={handleChange('remarks')} />

            {error && <div className="text-sm text-risk-critical">{error}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save Hazard'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {evidenceHazardId && (
        <HazardEvidenceModal hazardId={evidenceHazardId} onClose={() => setEvidenceHazardId(null)} />
      )}
    </div>
  );
}

/**
 * Separate small component (rather than inlining) because it needs its own
 * fetch of the single hazard's evidence list — the main table listing
 * doesn't include evidence to keep that query light.
 */
function HazardEvidenceModal({ hazardId, onClose }) {
  const [hazard, setHazard] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.get(`/hazards/${hazardId}`).then(setHazard).catch((e) => setError(e.message));
  };
  useEffect(load, [hazardId]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.upload(`/hazards/${hazardId}/evidence`, formData);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = ''; // allow re-selecting the same file if needed
    }
  };

  return (
    <Modal title={hazard ? `Evidence — ${hazard.hazard_code}` : 'Evidence'} onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Upload photo or file</span>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            disabled={uploading}
            className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:text-sm file:font-medium hover:file:bg-brand-100"
          />
          {uploading && <span className="text-xs text-slate-500 mt-1 block">Uploading…</span>}
        </label>

        {error && <div className="text-sm text-risk-critical">{error}</div>}

        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">Uploaded evidence</div>
          {!hazard ? (
            <div className="text-sm text-slate-400">Loading…</div>
          ) : !hazard.evidence?.length ? (
            <div className="text-sm text-slate-400">No evidence uploaded yet.</div>
          ) : (
            <ul className="space-y-1.5">
              {hazard.evidence.map((ev) => (
                <li key={ev.id} className="text-sm">
                  <a href={ev.file_url} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                    {ev.file_url.split('/').pop()}
                  </a>
                  <span className="text-xs text-slate-400 ml-2">{new Date(ev.uploaded_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
