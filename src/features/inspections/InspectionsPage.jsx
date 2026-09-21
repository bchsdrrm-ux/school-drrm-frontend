import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import { useLocations, locationLabel, formatLocation } from '../../lib/useLocations';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const EMPTY_INSPECTION_FORM = { category: '', locationId: '', inspectionDate: '', finding: '', riskLevel: '', remarks: '' };
const EMPTY_ACTION_FORM = { actionDescription: '', responsibleUserId: '', targetDate: '' };

const ACTION_STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', pending_verification: 'Pending Verification', closed: 'Closed' };
const NEXT_STATUS = { open: 'in_progress', in_progress: 'pending_verification', pending_verification: 'closed' };

export default function InspectionsPage() {
  const { user } = useAuth();
  const { locations } = useLocations();
  const canEdit = hasRole(user, ROLE_GROUPS.DRRM_OPERATIONAL);

  const [inspections, setInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [inspectionForm, setInspectionForm] = useState(EMPTY_INSPECTION_FORM);

  const [detailInspection, setDetailInspection] = useState(null); // full detail incl. correctiveActions, shown in the side panel modal
  const [users, setUsers] = useState([]);
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionForm, setActionForm] = useState(EMPTY_ACTION_FORM);

  const load = () => {
    setIsLoading(true);
    api.get('/inspections').then(setInspections).catch((e) => setError(e.message)).finally(() => setIsLoading(false));
  };
  useEffect(load, []);

  useEffect(() => {
    if (canEdit) api.get('/users').then(setUsers).catch(() => {});
  }, [canEdit]);

  const handleInspectionChange = (field) => (e) => setInspectionForm((f) => ({ ...f, [field]: e.target.value }));

  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inspections', { ...inspectionForm, locationId: inspectionForm.locationId || undefined, riskLevel: inspectionForm.riskLevel || undefined });
      setShowInspectionForm(false);
      setInspectionForm(EMPTY_INSPECTION_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openDetail = async (inspection) => {
    try {
      setDetailInspection(await api.get(`/inspections/${inspection.id}`));
    } catch (err) {
      setError(err.message);
    }
  };

  const refreshDetail = async () => {
    if (!detailInspection) return;
    setDetailInspection(await api.get(`/inspections/${detailInspection.id}`));
    load();
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/inspections/${detailInspection.id}/corrective-actions`, actionForm);
      setShowActionForm(false);
      setActionForm(EMPTY_ACTION_FORM);
      refreshDetail();
    } catch (err) {
      setError(err.message);
    }
  };

  const advanceActionStatus = async (action) => {
    const next = NEXT_STATUS[action.status];
    if (!next) return;
    try {
      await api.put(`/inspections/corrective-actions/${action.id}`, { status: next });
      refreshDetail();
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'inspection_code', header: 'ID' },
    { key: 'category', header: 'Category' },
    { key: 'location', header: 'Location', render: formatLocation },
    { key: 'inspection_date', header: 'Date', render: (r) => new Date(r.inspection_date).toLocaleDateString() },
    { key: 'risk_level', header: 'Risk Level', render: (r) => r.risk_level ? <StatusBadge value={r.risk_level} type="risk" /> : '—' },
    { key: 'actions_status', header: 'Corrective Actions', render: (r) => (
        r.action_count === 0 ? <span className="text-xs text-slate-400">None yet</span> :
        r.open_action_count === 0 ? <span className="text-xs font-medium text-green-700">All closed ({r.action_count})</span> :
        <span className="text-xs font-medium text-orange-700">{r.open_action_count} open of {r.action_count}</span>
      ) },
    { key: 'view', header: '', render: (r) => (
        <button onClick={() => openDetail(r)} className="text-xs font-medium text-brand-700 hover:underline">View / Manage</button>
      ) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Inspections & Corrective Actions</h1>
        {canEdit && <Button onClick={() => setShowInspectionForm(true)}>+ Record Inspection</Button>}
      </div>

      {error && !showInspectionForm && !showActionForm && <div className="text-sm text-risk-critical mb-3">{error}</div>}
      <Table columns={columns} rows={inspections} isLoading={isLoading} emptyMessage="No inspections recorded yet." />

      {showInspectionForm && (
        <Modal title="Record Inspection" onClose={() => setShowInspectionForm(false)} wide>
          <form onSubmit={handleInspectionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Category" required value={inspectionForm.category} onChange={handleInspectionChange('category')} placeholder="Fire safety, Electrical, Structural, BFP…" />
              <FormField type="date" label="Inspection Date" required value={inspectionForm.inspectionDate} onChange={handleInspectionChange('inspectionDate')} />
            </div>
            <FormField as="select" label="Location" value={inspectionForm.locationId} onChange={handleInspectionChange('locationId')}>
              <option value="">Not specified</option>
              {locations.map((loc) => <option key={loc.id} value={loc.id}>{locationLabel(loc)}</option>)}
            </FormField>
            <FormField as="textarea" rows={3} label="Finding" required value={inspectionForm.finding} onChange={handleInspectionChange('finding')} />
            <FormField as="select" label="Risk Level" value={inspectionForm.riskLevel} onChange={handleInspectionChange('riskLevel')}>
              <option value="">Not assessed</option>
              <option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="critical">Critical</option>
            </FormField>
            <FormField as="textarea" rows={2} label="Remarks" value={inspectionForm.remarks} onChange={handleInspectionChange('remarks')} />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowInspectionForm(false)}>Cancel</Button>
              <Button type="submit">Save Inspection</Button>
            </div>
          </form>
        </Modal>
      )}

      {detailInspection && (
        <Modal title={`${detailInspection.inspection_code} — ${detailInspection.category}`} onClose={() => setDetailInspection(null)} wide>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">Finding</div>
              <p className="text-sm text-slate-600">{detailInspection.finding}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-700">Corrective Actions</div>
              {canEdit && <Button variant="secondary" onClick={() => setShowActionForm(true)}>+ Add Action</Button>}
            </div>

            {!detailInspection.correctiveActions?.length ? (
              <div className="text-sm text-slate-400">No corrective actions logged yet.</div>
            ) : (
              <div className="space-y-2">
                {detailInspection.correctiveActions.map((a) => (
                  <div key={a.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-slate-700">{a.action_description}</p>
                      <StatusBadge value={a.status} />
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5">
                      {a.responsible_first_name && <>Responsible: {a.responsible_first_name} {a.responsible_last_name} · </>}
                      {a.target_date && <>Target: {new Date(a.target_date).toLocaleDateString()}</>}
                    </div>
                    {canEdit && a.status !== 'closed' && (
                      <button onClick={() => advanceActionStatus(a)} className="text-xs font-medium text-brand-700 hover:underline mt-2">
                        Advance to "{ACTION_STATUS_LABELS[NEXT_STATUS[a.status]]}"
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {showActionForm && (
            <div className="mt-5 pt-5 border-t border-slate-200">
              <form onSubmit={handleActionSubmit} className="space-y-3">
                <FormField as="textarea" rows={2} label="Action Description" required value={actionForm.actionDescription} onChange={(e) => setActionForm((f) => ({ ...f, actionDescription: e.target.value }))} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField as="select" label="Responsible Person" value={actionForm.responsibleUserId} onChange={(e) => setActionForm((f) => ({ ...f, responsibleUserId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                  </FormField>
                  <FormField type="date" label="Target Date" value={actionForm.targetDate} onChange={(e) => setActionForm((f) => ({ ...f, targetDate: e.target.value }))} />
                </div>
                {error && <div className="text-sm text-risk-critical">{error}</div>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setShowActionForm(false)}>Cancel</Button>
                  <Button type="submit">Save Action</Button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
