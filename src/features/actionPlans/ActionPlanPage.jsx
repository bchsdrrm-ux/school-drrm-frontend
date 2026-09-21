import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const STATUS_LABELS = { planned: 'Planned', ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled' };

const EMPTY_FORM = { activity: '', objective: '', responsibleParty: '', targetDate: '', allocatedBudget: '', remarks: '' };
const EMPTY_EXPENSE_FORM = { description: '', amount: '', expenseDate: '' };

function formatCurrency(value) {
  if (value === null || value === undefined) return '—';
  return `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ActionPlanPage() {
  const { user } = useAuth();
  const canManage = hasRole(user, ROLE_GROUPS.DRRM_MANAGERS);

  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [summary, setSummary] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [detail, setDetail] = useState(null); // full plan detail incl. expenses
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE_FORM);

  const load = () => {
    setIsLoading(true);
    const query = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/action-plans${query}`).then(setPlans).catch((e) => setError(e.message)).finally(() => setIsLoading(false));
  };
  useEffect(load, [statusFilter]);

  useEffect(() => {
    if (canManage) api.get('/action-plans/summary').then(setSummary).catch(() => {});
  }, [canManage, plans]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/action-plans', { ...form, allocatedBudget: form.allocatedBudget === '' ? undefined : Number(form.allocatedBudget) });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const setStatus = async (plan, status) => {
    try {
      await api.put(`/action-plans/${plan.id}`, { status });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openDetail = async (plan) => {
    try {
      setDetail(await api.get(`/action-plans/${plan.id}`));
    } catch (err) {
      setError(err.message);
    }
  };

  const refreshDetail = async () => {
    if (!detail) return;
    setDetail(await api.get(`/action-plans/${detail.id}`));
    load();
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/action-plans/${detail.id}/expenses`, { ...expenseForm, amount: Number(expenseForm.amount) });
      setShowExpenseForm(false);
      setExpenseForm(EMPTY_EXPENSE_FORM);
      refreshDetail();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeExpense = async (expense) => {
    try {
      await api.delete(`/action-plans/expenses/${expense.id}`);
      refreshDetail();
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'plan_code', header: 'ID' },
    { key: 'activity', header: 'Activity' },
    { key: 'responsible_party', header: 'Responsible', render: (r) => r.responsible_party || '—' },
    { key: 'target_date', header: 'Target Date', render: (r) => r.target_date ? new Date(r.target_date).toLocaleDateString() : '—' },
    { key: 'allocated_budget', header: 'Budget', render: (r) => formatCurrency(r.allocated_budget) },
    { key: 'utilized_budget', header: 'Utilized', render: (r) => formatCurrency(r.utilized_budget) },
    { key: 'status', header: 'Status', render: (r) => (
        canManage ? (
          <select
            value={r.status}
            onChange={(e) => setStatus(r, e.target.value)}
            className="text-xs font-medium border border-slate-300 rounded-full px-2 py-1 bg-white"
          >
            {Object.entries(STATUS_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        ) : <StatusBadge value={r.status} />
      ) },
    { key: 'view', header: '', render: (r) => (
        <button onClick={() => openDetail(r)} className="text-xs font-medium text-brand-700 hover:underline">View / Manage</button>
      ) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Annual DRRM Action Plan & Budget</h1>
        {canManage && <Button onClick={() => setShowForm(true)}>+ Add Activity</Button>}
      </div>

      {canManage && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Total Allocated</div>
            <div className="text-lg font-bold text-slate-900">{formatCurrency(summary.totalAllocated)}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Total Utilized</div>
            <div className="text-lg font-bold text-slate-900">{formatCurrency(summary.totalUtilized)}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Remaining</div>
            <div className={`text-lg font-bold ${summary.totalRemaining < 0 ? 'text-risk-critical' : 'text-slate-900'}`}>{formatCurrency(summary.totalRemaining)}</div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        {['', 'planned', 'ongoing', 'completed', 'cancelled'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              statusFilter === s ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {s ? STATUS_LABELS[s] : 'All'}
          </button>
        ))}
      </div>

      {error && !showForm && !detail && <div className="text-sm text-risk-critical mb-3">{error}</div>}
      <Table columns={columns} rows={plans} isLoading={isLoading} emptyMessage="No activities planned yet." />

      {showForm && (
        <Modal title="Add Activity" onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Activity" required value={form.activity} onChange={handleChange('activity')} placeholder="e.g. Earthquake Drill, Fire Inspection" />
            <FormField as="textarea" rows={2} label="Objective" value={form.objective} onChange={handleChange('objective')} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Responsible Party" value={form.responsibleParty} onChange={handleChange('responsibleParty')} placeholder="e.g. DRRM Team" />
              <FormField type="date" label="Target Date" value={form.targetDate} onChange={handleChange('targetDate')} />
              <FormField type="number" min="0" step="0.01" label="Allocated Budget (₱)" value={form.allocatedBudget} onChange={handleChange('allocatedBudget')} />
            </div>
            <FormField as="textarea" rows={2} label="Remarks" value={form.remarks} onChange={handleChange('remarks')} />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save Activity</Button>
            </div>
          </form>
        </Modal>
      )}

      {detail && (
        <Modal title={`${detail.plan_code} — ${detail.activity}`} onClose={() => setDetail(null)} wide>
          <div className="space-y-4">
            {detail.objective && (
              <div>
                <div className="text-sm font-medium text-slate-700 mb-1">Objective</div>
                <p className="text-sm text-slate-600">{detail.objective}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">Allocated</div>
                <div className="text-sm font-bold text-slate-900">{formatCurrency(detail.allocated_budget)}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">Utilized</div>
                <div className="text-sm font-bold text-slate-900">{formatCurrency(detail.utilized_budget)}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">Remaining</div>
                <div className={`text-sm font-bold ${detail.remaining_budget < 0 ? 'text-risk-critical' : 'text-slate-900'}`}>{formatCurrency(detail.remaining_budget)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-700">Expenses</div>
              {canManage && <Button variant="secondary" onClick={() => setShowExpenseForm(true)}>+ Log Expense</Button>}
            </div>

            {!detail.expenses?.length ? (
              <div className="text-sm text-slate-400">No expenses logged yet.</div>
            ) : (
              <div className="space-y-2">
                {detail.expenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                    <div>
                      <div className="text-sm text-slate-700">{e.description}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(e.expense_date).toLocaleDateString()} · {e.first_name} {e.last_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-900">{formatCurrency(e.amount)}</span>
                      {canManage && (
                        <button onClick={() => removeExpense(e)} className="text-xs font-medium text-risk-critical hover:underline">Remove</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showExpenseForm && (
            <div className="mt-5 pt-5 border-t border-slate-200">
              <form onSubmit={handleExpenseSubmit} className="space-y-3">
                <FormField label="Description" required value={expenseForm.description} onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField type="number" min="0.01" step="0.01" label="Amount (₱)" required value={expenseForm.amount} onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))} />
                  <FormField type="date" label="Expense Date" required value={expenseForm.expenseDate} onChange={(e) => setExpenseForm((f) => ({ ...f, expenseDate: e.target.value }))} />
                </div>
                {error && <div className="text-sm text-risk-critical">{error}</div>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setShowExpenseForm(false)}>Cancel</Button>
                  <Button type="submit">Save Expense</Button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
