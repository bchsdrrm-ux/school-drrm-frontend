import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const EMPTY_DRILL_FORM = {
  drillType: '', scheduledAt: '', durationMinutes: '', scenario: '',
  buildingsIncluded: '', participants: '', leadOffice: '', observers: '', objectives: '',
};

const EMPTY_EVAL_FORM = {
  responseTimeSeconds: '', evacuationTimeSeconds: '',
  alarmActivated: '', proceduresFollowed: '', routeCompliance: '', assemblyCompliance: '',
  headcountNotes: '', communicationNotes: '', coordinationNotes: '', teamResponseNotes: '', safetyProceduresNotes: '',
  problemsEncountered: '', goodPractices: '', areasForImprovement: '', recommendations: '', rating: '',
};

const RATING_LABELS = { excellent: 'Excellent', very_good: 'Very Good', good: 'Good', needs_improvement: 'Needs Improvement' };

// Converts '' -> undefined (so optional fields are actually omitted) and
// 'true'/'false' strings from a <select> into real booleans for the
// tri-state (Yes/No/Not noted) compliance fields.
function toBoolOrUndefined(v) {
  if (v === '' || v === undefined) return undefined;
  return v === 'true';
}

export default function DrillsPage() {
  const { user } = useAuth();
  const canEdit = hasRole(user, ROLE_GROUPS.DRRM_OPERATIONAL);

  const [drills, setDrills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showDrillForm, setShowDrillForm] = useState(false);
  const [drillForm, setDrillForm] = useState(EMPTY_DRILL_FORM);

  const [evalDrill, setEvalDrill] = useState(null); // full drill detail (incl. evaluation) currently open in the eval modal
  const [evalForm, setEvalForm] = useState(EMPTY_EVAL_FORM);

  const load = () => {
    setIsLoading(true);
    const query = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/drills${query}`).then(setDrills).catch((e) => setError(e.message)).finally(() => setIsLoading(false));
  };
  useEffect(load, [statusFilter]);

  const handleDrillChange = (field) => (e) => setDrillForm((f) => ({ ...f, [field]: e.target.value }));

  const handleDrillSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/drills', {
        ...drillForm,
        scheduledAt: new Date(drillForm.scheduledAt).toISOString(),
        durationMinutes: drillForm.durationMinutes ? Number(drillForm.durationMinutes) : undefined,
      });
      setShowDrillForm(false);
      setDrillForm(EMPTY_DRILL_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const setDrillStatus = async (drill, status) => {
    try {
      await api.put(`/drills/${drill.id}`, { status });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEvaluation = async (drill) => {
    try {
      const detail = await api.get(`/drills/${drill.id}`);
      setEvalDrill(detail);
      const ev = detail.evaluation;
      setEvalForm(ev ? {
        responseTimeSeconds: ev.response_time_seconds ?? '',
        evacuationTimeSeconds: ev.evacuation_time_seconds ?? '',
        alarmActivated: ev.alarm_activated === null ? '' : String(ev.alarm_activated),
        proceduresFollowed: ev.procedures_followed === null ? '' : String(ev.procedures_followed),
        routeCompliance: ev.route_compliance === null ? '' : String(ev.route_compliance),
        assemblyCompliance: ev.assembly_compliance === null ? '' : String(ev.assembly_compliance),
        headcountNotes: ev.headcount_notes || '',
        communicationNotes: ev.communication_notes || '',
        coordinationNotes: ev.coordination_notes || '',
        teamResponseNotes: ev.team_response_notes || '',
        safetyProceduresNotes: ev.safety_procedures_notes || '',
        problemsEncountered: ev.problems_encountered || '',
        goodPractices: ev.good_practices || '',
        areasForImprovement: ev.areas_for_improvement || '',
        recommendations: ev.recommendations || '',
        rating: ev.rating || '',
      } : EMPTY_EVAL_FORM);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEvalChange = (field) => (e) => setEvalForm((f) => ({ ...f, [field]: e.target.value }));

  const handleEvalSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/drills/${evalDrill.id}/evaluation`, {
        ...evalForm,
        responseTimeSeconds: evalForm.responseTimeSeconds === '' ? undefined : Number(evalForm.responseTimeSeconds),
        evacuationTimeSeconds: evalForm.evacuationTimeSeconds === '' ? undefined : Number(evalForm.evacuationTimeSeconds),
        alarmActivated: toBoolOrUndefined(evalForm.alarmActivated),
        proceduresFollowed: toBoolOrUndefined(evalForm.proceduresFollowed),
        routeCompliance: toBoolOrUndefined(evalForm.routeCompliance),
        assemblyCompliance: toBoolOrUndefined(evalForm.assemblyCompliance),
        rating: evalForm.rating || undefined,
      });
      setEvalDrill(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'drill_code', header: 'ID' },
    { key: 'drill_type', header: 'Type' },
    { key: 'scheduled_at', header: 'Scheduled', render: (r) => new Date(r.scheduled_at).toLocaleString() },
    { key: 'lead_office', header: 'Lead Office', render: (r) => r.lead_office || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'evaluation', header: 'Evaluation', render: (r) => (
        r.has_evaluation ? (
          <span className="text-xs font-medium text-green-700">{RATING_LABELS[r.evaluation_rating] || 'Filled in'}</span>
        ) : (
          <span className="text-xs text-slate-400">Not evaluated</span>
        )
      ) },
    { key: 'actions', header: '', render: (r) => (
        canEdit && (
          <div className="flex gap-2 whitespace-nowrap">
            {r.status === 'planned' && (
              <>
                <button onClick={() => setDrillStatus(r, 'conducted')} className="text-xs font-medium text-green-700 hover:underline">Mark Conducted</button>
                <button onClick={() => setDrillStatus(r, 'cancelled')} className="text-xs font-medium text-risk-critical hover:underline">Cancel</button>
              </>
            )}
            {r.status === 'conducted' && (
              <button onClick={() => openEvaluation(r)} className="text-xs font-medium text-brand-700 hover:underline">
                {r.has_evaluation ? 'Edit Evaluation' : 'Evaluate'}
              </button>
            )}
          </div>
        )
      ) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Drills & Exercises</h1>
        {canEdit && <Button onClick={() => setShowDrillForm(true)}>+ Schedule Drill</Button>}
      </div>

      <div className="flex items-center gap-2 mb-4">
        {['', 'planned', 'conducted', 'cancelled'].map((s) => (
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

      {error && !showDrillForm && !evalDrill && <div className="text-sm text-risk-critical mb-3">{error}</div>}
      <Table columns={columns} rows={drills} isLoading={isLoading} emptyMessage="No drills scheduled yet." />

      {showDrillForm && (
        <Modal title="Schedule Drill" onClose={() => setShowDrillForm(false)} wide>
          <form onSubmit={handleDrillSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Drill Type" required value={drillForm.drillType} onChange={handleDrillChange('drillType')} placeholder="Earthquake, Fire, Evacuation, Lockdown…" />
              <FormField type="datetime-local" label="Date / Time" required value={drillForm.scheduledAt} onChange={handleDrillChange('scheduledAt')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField type="number" min="1" label="Duration (minutes)" value={drillForm.durationMinutes} onChange={handleDrillChange('durationMinutes')} />
              <FormField label="Lead Office" value={drillForm.leadOffice} onChange={handleDrillChange('leadOffice')} placeholder="e.g. DRRM Coordinator's Office" />
            </div>
            <FormField as="textarea" rows={2} label="Scenario" value={drillForm.scenario} onChange={handleDrillChange('scenario')} />
            <FormField label="Buildings Included" value={drillForm.buildingsIncluded} onChange={handleDrillChange('buildingsIncluded')} />
            <FormField label="Participants" value={drillForm.participants} onChange={handleDrillChange('participants')} placeholder="e.g. Grade 7-10, all teaching staff" />
            <FormField label="Observers" value={drillForm.observers} onChange={handleDrillChange('observers')} />
            <FormField as="textarea" rows={2} label="Objectives" value={drillForm.objectives} onChange={handleDrillChange('objectives')} />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowDrillForm(false)}>Cancel</Button>
              <Button type="submit">Save Drill</Button>
            </div>
          </form>
        </Modal>
      )}

      {evalDrill && (
        <Modal title={`Evaluate — ${evalDrill.drill_code}`} onClose={() => setEvalDrill(null)} wide>
          <form onSubmit={handleEvalSubmit} className="space-y-5">
            <fieldset>
              <legend className="text-sm font-semibold text-slate-800 mb-2">Timing</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField type="number" min="0" label="Response Time (seconds)" value={evalForm.responseTimeSeconds} onChange={handleEvalChange('responseTimeSeconds')} />
                <FormField type="number" min="0" label="Evacuation Time (seconds)" value={evalForm.evacuationTimeSeconds} onChange={handleEvalChange('evacuationTimeSeconds')} />
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-800 mb-2">Compliance</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField as="select" label="Alarm Activated" value={evalForm.alarmActivated} onChange={handleEvalChange('alarmActivated')}>
                  <option value="">Not noted</option><option value="true">Yes</option><option value="false">No</option>
                </FormField>
                <FormField as="select" label="Proper Procedures Followed" value={evalForm.proceduresFollowed} onChange={handleEvalChange('proceduresFollowed')}>
                  <option value="">Not noted</option><option value="true">Yes</option><option value="false">No</option>
                </FormField>
                <FormField as="select" label="Evacuation Route Compliance" value={evalForm.routeCompliance} onChange={handleEvalChange('routeCompliance')}>
                  <option value="">Not noted</option><option value="true">Yes</option><option value="false">No</option>
                </FormField>
                <FormField as="select" label="Assembly Area Compliance" value={evalForm.assemblyCompliance} onChange={handleEvalChange('assemblyCompliance')}>
                  <option value="">Not noted</option><option value="true">Yes</option><option value="false">No</option>
                </FormField>
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-800 mb-2">Notes</legend>
              <div className="space-y-3">
                <FormField as="textarea" rows={2} label="Headcount / Accountability" value={evalForm.headcountNotes} onChange={handleEvalChange('headcountNotes')} />
                <FormField as="textarea" rows={2} label="Communication" value={evalForm.communicationNotes} onChange={handleEvalChange('communicationNotes')} />
                <FormField as="textarea" rows={2} label="Coordination" value={evalForm.coordinationNotes} onChange={handleEvalChange('coordinationNotes')} />
                <FormField as="textarea" rows={2} label="Emergency Team Response" value={evalForm.teamResponseNotes} onChange={handleEvalChange('teamResponseNotes')} />
                <FormField as="textarea" rows={2} label="Safety Procedures" value={evalForm.safetyProceduresNotes} onChange={handleEvalChange('safetyProceduresNotes')} />
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-800 mb-2">Summary</legend>
              <div className="space-y-3">
                <FormField as="textarea" rows={2} label="Problems Encountered" value={evalForm.problemsEncountered} onChange={handleEvalChange('problemsEncountered')} />
                <FormField as="textarea" rows={2} label="Good Practices" value={evalForm.goodPractices} onChange={handleEvalChange('goodPractices')} />
                <FormField as="textarea" rows={2} label="Areas for Improvement" value={evalForm.areasForImprovement} onChange={handleEvalChange('areasForImprovement')} />
                <FormField as="textarea" rows={2} label="Recommendations" value={evalForm.recommendations} onChange={handleEvalChange('recommendations')} />
                <FormField as="select" label="Overall Rating" value={evalForm.rating} onChange={handleEvalChange('rating')}>
                  <option value="">Not rated</option>
                  {Object.entries(RATING_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </FormField>
              </div>
            </fieldset>

            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEvalDrill(null)}>Cancel</Button>
              <Button type="submit">Save Evaluation</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
