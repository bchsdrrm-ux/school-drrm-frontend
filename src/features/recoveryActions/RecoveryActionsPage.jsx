import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import { useLocations, locationLabel, formatLocation } from '../../lib/useLocations';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const STATUS_LABELS = { pending: 'Pending', ongoing: 'Ongoing', completed: 'Completed', for_monitoring: 'For Monitoring' };
const CATEGORY_SUGGESTIONS = [
  'Cleaning', 'Repair', 'Replacement', 'Temporary Relocation', 'Utility Restoration',
  'Learner Support', 'Personnel Support', 'Psychosocial Support', 'Class Resumption',
  'Documentation', 'Agency Coordination', 'Other',
];

const EMPTY_FORM = {
  category: 'Repair', description: '', damageAssessmentId: '', locationId: '',
  responsibleOffice: '', targetDate: '', classResumptionDate: '', remarks: '',
};

export default function RecoveryActionsPage() {
  const { user } = useAuth();
  const { locations } = useLocations();
  const canEdit = hasRole(user, ROLE_GROUPS.DRRM_OPERATIONAL);

  const [actions, setActions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [damageAssessments, setDamageAssessments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => {
    setIsLoading(true);
    const query = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/recovery-actions${query}`).then(setActions).catch((e) => setError(e.message)).finally(() => setIsLoading(false));
  };
  useEffect(load, [statusFilter]);

  useEffect(() => {
    api.get('/damage-assessments').then(setDamageAssessments).catch(() => {});
  }, []);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/recovery-actions', {
        ...form,
        damageAssessmentId: form.damageAssessmentId || undefined,
        locationId: form.locationId || undefined,
        targetDate: form.targetDate || undefined,
        classResumptionDate: form.classResumptionDate || undefined,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const setStatus = async (action, status) => {
    try {
      await api.put(`/recovery-actions/${action.id}`, { status });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'recovery_code', header: 'ID' },
    { key: 'category', header: 'Category' },
    { key: 'description', header: 'Description', render: (r) => <span className="line-clamp-1">{r.description}</span> },
    { key: 'location', header: 'Location', render: formatLocation },
    { key: 'damage', header: 'Linked Damage', render: (r) => r.assessment_code ? `${r.assessment_code} — ${r.damage_type}` : '—' },
    { key: 'target_date', header: 'Target Date', render: (r) => r.target_date ? new Date(r.target_date).toLocaleDateString() : '—' },
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
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Recovery Actions</h1>
        {canEdit && <Button onClick={() => setShowForm(true)}>+ Log Recovery Action</Button>}
      </div>

      <div className="flex items-center gap-2 mb-4">
        {['', 'pending', 'ongoing', 'completed', 'for_monitoring'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              statusFilter === s ? 'bg-brand-700 text-white border-brand-700' : 'bg-surface text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {s ? STATUS_LABELS[s] : 'All'}
          </button>
        ))}
      </div>

      {error && !showForm && <div className="text-sm text-risk-critical mb-3">{error}</div>}
      <Table columns={columns} rows={actions} isLoading={isLoading} emptyMessage="No recovery actions logged yet." />

      {showForm && (
        <Modal title="Log Recovery Action" onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField as="select" label="Category" required value={form.category} onChange={handleChange('category')}>
                {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </FormField>
              <FormField as="select" label="Linked Damage Assessment (optional)" value={form.damageAssessmentId} onChange={handleChange('damageAssessmentId')}>
                <option value="">None</option>
                {damageAssessments.map((d) => <option key={d.id} value={d.id}>{d.assessment_code} — {d.damage_type}</option>)}
              </FormField>
            </div>

            <FormField as="textarea" rows={2} label="Description" required value={form.description} onChange={handleChange('description')} />

            <FormField as="select" label="Location" value={form.locationId} onChange={handleChange('locationId')}>
              <option value="">Not specified</option>
              {locations.map((loc) => <option key={loc.id} value={loc.id}>{locationLabel(loc)}</option>)}
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Responsible Office" value={form.responsibleOffice} onChange={handleChange('responsibleOffice')} />
              <FormField type="date" label="Target Date" value={form.targetDate} onChange={handleChange('targetDate')} />
              <FormField type="date" label="Class Resumption Date" value={form.classResumptionDate} onChange={handleChange('classResumptionDate')} />
            </div>

            <FormField as="textarea" rows={2} label="Remarks" value={form.remarks} onChange={handleChange('remarks')} />

            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save Recovery Action</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
