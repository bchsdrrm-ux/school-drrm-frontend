import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import { useLocations, locationLabel, formatLocation } from '../../lib/useLocations';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const CATEGORY_LABELS = { building: 'Building', utility: 'Utility', equipment: 'Equipment', other: 'Other' };
const STATUS_LABELS = { pending: 'Pending', ongoing: 'Ongoing', completed: 'Completed', for_monitoring: 'For Monitoring' };

const EMPTY_FORM = {
  category: 'building', damageType: '', locationId: '', description: '', severity: '',
  estimatedCost: '', immediateAction: '', recommendedRepair: '', responsibleOffice: '',
};

function formatCurrency(value) {
  if (value === null || value === undefined) return '—';
  return `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DamageAssessmentPage() {
  const { user } = useAuth();
  const { locations } = useLocations();
  const canEdit = hasRole(user, ROLE_GROUPS.DRRM_OPERATIONAL);
  const canSeeCostSummary = hasRole(user, ROLE_GROUPS.DRRM_MANAGERS);

  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [photoAssessmentId, setPhotoAssessmentId] = useState(null);
  const [costSummary, setCostSummary] = useState([]);

  const load = () => {
    setIsLoading(true);
    const query = categoryFilter ? `?category=${categoryFilter}` : '';
    api.get(`/damage-assessments${query}`).then(setAssessments).catch((e) => setError(e.message)).finally(() => setIsLoading(false));
  };
  useEffect(load, [categoryFilter]);

  useEffect(() => {
    if (canSeeCostSummary) api.get('/damage-assessments/cost-summary').then(setCostSummary).catch(() => {});
  }, [canSeeCostSummary, assessments]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/damage-assessments', {
        ...form,
        locationId: form.locationId || undefined,
        severity: form.severity || undefined,
        estimatedCost: form.estimatedCost === '' ? undefined : Number(form.estimatedCost),
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const setStatus = async (assessment, status) => {
    try {
      await api.put(`/damage-assessments/${assessment.id}`, { status });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const totalEstimatedCost = costSummary.reduce((sum, r) => sum + Number(r.total_estimated_cost || 0), 0);

  const columns = [
    { key: 'assessment_code', header: 'ID' },
    { key: 'category', header: 'Category', render: (r) => CATEGORY_LABELS[r.category] },
    { key: 'damage_type', header: 'Damage Type' },
    { key: 'location', header: 'Location', render: formatLocation },
    { key: 'severity', header: 'Severity', render: (r) => r.severity ? <StatusBadge value={r.severity} type="risk" /> : '—' },
    { key: 'estimated_cost', header: 'Est. Cost', render: (r) => formatCurrency(r.estimated_cost) },
    { key: 'status', header: 'Status', render: (r) => (
        canEdit ? (
          <select
            value={r.status}
            onChange={(e) => setStatus(r, e.target.value)}
            className="text-xs font-medium border border-slate-300 rounded-full px-2 py-1 bg-surface"
          >
            {Object.entries(STATUS_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        ) : <StatusBadge value={r.status} />
      ) },
    { key: 'photo', header: 'Photo', render: (r) => (
        r.photo_url ? (
          <a href={r.photo_url} target="_blank" rel="noreferrer">
            <img src={r.photo_url} alt={r.damage_type} className="w-10 h-10 object-cover rounded-md border border-slate-200" />
          </a>
        ) : canEdit ? (
          <button onClick={() => setPhotoAssessmentId(r.id)} className="text-xs font-medium text-brand-700 hover:underline">📷 Add</button>
        ) : <span className="text-xs text-slate-400">—</span>
      ) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Damage Assessment</h1>
        {canEdit && <Button onClick={() => setShowForm(true)}>+ Record Damage</Button>}
      </div>

      {canSeeCostSummary && costSummary.length > 0 && (
        <div className="bg-surface border border-slate-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <span className="text-sm text-slate-600">Total estimated repair cost (all open items)</span>
          <span className="text-lg font-bold text-slate-900">{formatCurrency(totalEstimatedCost)}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        {['', 'building', 'utility', 'equipment', 'other'].map((c) => (
          <button
            key={c || 'all'}
            onClick={() => setCategoryFilter(c)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              categoryFilter === c ? 'bg-brand-700 text-white border-brand-700' : 'bg-surface text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {c ? CATEGORY_LABELS[c] : 'All'}
          </button>
        ))}
      </div>

      {error && !showForm && <div className="text-sm text-risk-critical mb-3">{error}</div>}
      <Table columns={columns} rows={assessments} isLoading={isLoading} emptyMessage="No damage assessments recorded yet." />

      {showForm && (
        <Modal title="Record Damage Assessment" onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField as="select" label="Category" required value={form.category} onChange={handleChange('category')}>
                {Object.entries(CATEGORY_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </FormField>
              <FormField label="Damage Type" required value={form.damageType} onChange={handleChange('damageType')} placeholder="Roof, Electrical System, Computers, Fence…" />
            </div>

            <FormField as="select" label="Location" value={form.locationId} onChange={handleChange('locationId')}>
              <option value="">Not specified</option>
              {locations.map((loc) => <option key={loc.id} value={loc.id}>{locationLabel(loc)}</option>)}
            </FormField>

            <FormField as="textarea" rows={2} label="Description" value={form.description} onChange={handleChange('description')} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField as="select" label="Severity" value={form.severity} onChange={handleChange('severity')}>
                <option value="">Not assessed</option>
                <option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="critical">Critical</option>
              </FormField>
              <FormField type="number" min="0" step="0.01" label="Estimated Cost (₱)" value={form.estimatedCost} onChange={handleChange('estimatedCost')} />
            </div>

            <FormField as="textarea" rows={2} label="Immediate Action Taken" value={form.immediateAction} onChange={handleChange('immediateAction')} />
            <FormField as="textarea" rows={2} label="Recommended Repair" value={form.recommendedRepair} onChange={handleChange('recommendedRepair')} />
            <FormField label="Responsible Office" value={form.responsibleOffice} onChange={handleChange('responsibleOffice')} placeholder="e.g. Facilities/Maintenance Office" />

            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save Assessment</Button>
            </div>
          </form>
        </Modal>
      )}

      {photoAssessmentId && (
        <DamagePhotoModal
          assessmentId={photoAssessmentId}
          onClose={() => setPhotoAssessmentId(null)}
          onUploaded={() => { setPhotoAssessmentId(null); load(); }}
        />
      )}
    </div>
  );
}

function DamagePhotoModal({ assessmentId, onClose, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.upload(`/damage-assessments/${assessmentId}/photo`, formData);
      onUploaded();
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <Modal title="Damage Photo" onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Choose a photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:text-sm file:font-medium hover:file:bg-brand-100"
          />
          {uploading && <span className="text-xs text-slate-500 mt-1 block">Uploading…</span>}
        </label>
        {error && <div className="text-sm text-risk-critical">{error}</div>}
      </div>
    </Modal>
  );
}
