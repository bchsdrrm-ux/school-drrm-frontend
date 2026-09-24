import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const STATUS_LABELS = { draft: 'Draft', under_review: 'Under Review', approved: 'Approved', superseded: 'Superseded' };
const PLAN_TYPE_SUGGESTIONS = [
  'School DRRM Plan', 'Contingency Plan', 'Emergency Response Plan', 'Evacuation Plan',
  'Earthquake Plan', 'Fire Plan', 'Typhoon / Flood Plan', 'Lockdown / Security Plan', 'Other',
];

const EMPTY_FORM = {
  planType: 'School DRRM Plan', title: '', version: '', reviewedBy: '', approvedBy: '',
  effectiveDate: '', reviewDate: '', remarks: '', supersedesId: '',
};

export default function EmergencyPlansPage() {
  const { user } = useAuth();
  const canManage = hasRole(user, ROLE_GROUPS.DRRM_MANAGERS);

  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [fileModalPlan, setFileModalPlan] = useState(null);

  const load = () => {
    setIsLoading(true);
    const query = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/emergency-plans${query}`).then(setPlans).catch((e) => setError(e.message)).finally(() => setIsLoading(false));
  };
  useEffect(load, [statusFilter]);

  useEffect(() => {
    if (canManage) api.get('/users').then(setUsers).catch(() => {});
  }, [canManage]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const openNewVersionForm = (plan) => {
    setForm({
      ...EMPTY_FORM,
      planType: plan.plan_type,
      title: plan.title,
      version: '',
      supersedesId: plan.id,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/emergency-plans', {
        ...form,
        reviewedBy: form.reviewedBy || undefined,
        approvedBy: form.approvedBy || undefined,
        effectiveDate: form.effectiveDate || undefined,
        reviewDate: form.reviewDate || undefined,
        supersedesId: form.supersedesId || undefined,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const setStatus = async (plan, status) => {
    try {
      await api.put(`/emergency-plans/${plan.id}`, { status });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const personName = (first, last) => (first ? `${first} ${last}` : '—');

  const columns = [
    { key: 'plan_code', header: 'ID' },
    { key: 'plan_type', header: 'Type' },
    { key: 'title', header: 'Title' },
    { key: 'version', header: 'Version', render: (r) => r.version || '—' },
    { key: 'prepared_by', header: 'Prepared By', render: (r) => personName(r.prepared_by_first_name, r.prepared_by_last_name) },
    { key: 'approved_by', header: 'Approved By', render: (r) => personName(r.approved_by_first_name, r.approved_by_last_name) },
    { key: 'effective_date', header: 'Effective', render: (r) => r.effective_date ? new Date(r.effective_date).toLocaleDateString() : '—' },
    { key: 'status', header: 'Status', render: (r) => (
        canManage ? (
          <select
            value={r.status}
            onChange={(e) => setStatus(r, e.target.value)}
            className="text-xs font-medium border border-slate-300 rounded-full px-2 py-1 bg-surface"
          >
            {Object.entries(STATUS_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        ) : <StatusBadge value={r.status} />
      ) },
    { key: 'file', header: 'File', render: (r) => (
        r.file_url ? (
          <a href={r.file_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-700 hover:underline">View</a>
        ) : canManage ? (
          <button onClick={() => setFileModalPlan(r)} className="text-xs font-medium text-brand-700 hover:underline">📎 Attach</button>
        ) : <span className="text-xs text-slate-400">—</span>
      ) },
    { key: 'actions', header: '', render: (r) => (
        canManage && r.status === 'approved' ? (
          <button onClick={() => openNewVersionForm(r)} className="text-xs font-medium text-brand-700 hover:underline whitespace-nowrap">New Version</button>
        ) : null
      ) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Emergency Plans</h1>
          <p className="text-sm text-slate-500 mt-0.5">School DRRM Plan, contingency plans, and hazard-specific response plans.</p>
        </div>
        {canManage && <Button onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }}>+ Add Plan</Button>}
      </div>

      <div className="flex items-center gap-2 mb-4">
        {['', 'draft', 'under_review', 'approved', 'superseded'].map((s) => (
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
      <Table columns={columns} rows={plans} isLoading={isLoading} emptyMessage="No emergency plans recorded yet." />

      {showForm && (
        <Modal title={form.supersedesId ? `New Version — ${form.title}` : 'Add Plan'} onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            {form.supersedesId && (
              <div className="text-xs text-brand-700 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
                This will be recorded as a new version. Once you approve it, the previous version will automatically be marked Superseded.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField as="select" label="Plan Type" required value={form.planType} onChange={handleChange('planType')} disabled={!!form.supersedesId}>
                {PLAN_TYPE_SUGGESTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </FormField>
              <FormField label="Version" value={form.version} onChange={handleChange('version')} placeholder="e.g. v2, 2026 Rev A" />
            </div>
            <FormField label="Title" required value={form.title} onChange={handleChange('title')} placeholder="e.g. School DRRM Plan 2026" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField as="select" label="Reviewed By" value={form.reviewedBy} onChange={handleChange('reviewedBy')}>
                <option value="">Not specified</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
              </FormField>
              <FormField as="select" label="Approved By" value={form.approvedBy} onChange={handleChange('approvedBy')}>
                <option value="">Not specified</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField type="date" label="Effective Date" value={form.effectiveDate} onChange={handleChange('effectiveDate')} />
              <FormField type="date" label="Review Date" value={form.reviewDate} onChange={handleChange('reviewDate')} />
            </div>

            <FormField as="textarea" rows={2} label="Remarks" value={form.remarks} onChange={handleChange('remarks')} />

            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save Plan</Button>
            </div>
          </form>
        </Modal>
      )}

      {fileModalPlan && (
        <PlanFileModal
          plan={fileModalPlan}
          onClose={() => setFileModalPlan(null)}
          onUploaded={() => { setFileModalPlan(null); load(); }}
        />
      )}
    </div>
  );
}

function PlanFileModal({ plan, onClose, onUploaded }) {
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
      await api.upload(`/emergency-plans/${plan.id}/file`, formData);
      onUploaded();
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <Modal title={`Attach File — ${plan.title}`} onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Choose a file</span>
          <input
            type="file"
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
