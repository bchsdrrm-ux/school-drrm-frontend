import React, { useState } from 'react';
import { api } from '../../lib/apiClient';
import { downloadPdf } from '../../lib/pdfExport';
import Button from '../../components/Button';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';

function formatCurrency(value) {
  if (value === null || value === undefined) return '—';
  return `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Each report either hits a dedicated /reports/<key> endpoint (the
// original Phase 1 four, which do their own filtered/joined query) or
// reuses an existing module's list endpoint directly (everything added
// since — no need to duplicate query logic that already exists and is
// already tested on its own page).
//
// Grouped to match how the spec's Section 23 list reads, so the dropdown
// doesn't feel like an arbitrary flat pile of 13 options.
const REPORT_GROUPS = [
  {
    label: 'Risk Management',
    reports: {
      'hazard-inventory': {
        label: 'Hazard Inventory',
        endpoint: '/reports/hazard-inventory',
        columns: [
          { key: 'hazard_code', header: 'ID' },
          { key: 'hazard_name', header: 'Hazard' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
          { key: 'date_identified', header: 'Date Identified', render: (r) => new Date(r.date_identified).toLocaleDateString() },
        ],
      },
      'risk-assessment': {
        label: 'Risk Assessment',
        endpoint: '/reports/risk-assessment',
        columns: [
          { key: 'hazard_code', header: 'ID' },
          { key: 'hazard_name', header: 'Hazard' },
          { key: 'risk_level', header: 'Risk Level', render: (r) => <StatusBadge value={r.risk_level} type="risk" /> },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
        ],
      },
    },
  },
  {
    label: 'Preparedness',
    reports: {
      'equipment-inventory': {
        label: 'Emergency Equipment Inventory',
        endpoint: '/reports/equipment-inventory',
        columns: [
          { key: 'equipment_code', header: 'ID' },
          { key: 'equipment_type', header: 'Type' },
          { key: 'condition', header: 'Condition', render: (r) => <StatusBadge value={r.condition} /> },
        ],
      },
      'evacuation': {
        label: 'Evacuation Report',
        endpoint: '/evacuation/areas',
        columns: [
          { key: 'name', header: 'Area' },
          { key: 'building', header: 'Location', render: (r) => r.building ? `${r.building}${r.floor ? ' / ' + r.floor : ''}` : '—' },
          { key: 'capacity', header: 'Capacity' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
        ],
      },
      'training': {
        label: 'Training Report',
        endpoint: '/training',
        columns: [
          { key: 'training_code', header: 'ID' },
          { key: 'title', header: 'Title' },
          { key: 'training_date', header: 'Date', render: (r) => new Date(r.training_date).toLocaleDateString() },
          { key: 'training_hours', header: 'Hours', render: (r) => r.training_hours ?? '—' },
          { key: 'participant_count', header: 'Participants' },
        ],
      },
    },
  },
  {
    label: 'Drills & Inspections',
    reports: {
      'drills': {
        label: 'Drill Report',
        endpoint: '/drills',
        columns: [
          { key: 'drill_code', header: 'ID' },
          { key: 'drill_type', header: 'Type' },
          { key: 'scheduled_at', header: 'Scheduled', render: (r) => new Date(r.scheduled_at).toLocaleString() },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
          { key: 'evaluation_rating', header: 'Rating', render: (r) => r.evaluation_rating ? r.evaluation_rating.replaceAll('_', ' ') : '—' },
        ],
      },
      'inspections': {
        label: 'Inspection Report',
        endpoint: '/inspections',
        columns: [
          { key: 'inspection_code', header: 'ID' },
          { key: 'category', header: 'Category' },
          { key: 'inspection_date', header: 'Date', render: (r) => new Date(r.inspection_date).toLocaleDateString() },
          { key: 'risk_level', header: 'Risk Level', render: (r) => r.risk_level ? <StatusBadge value={r.risk_level} type="risk" /> : '—' },
          { key: 'open_action_count', header: 'Open Actions' },
        ],
      },
      'corrective-actions': {
        label: 'Corrective Action Report',
        endpoint: '/inspections/corrective-actions',
        columns: [
          { key: 'inspection_code', header: 'Inspection' },
          { key: 'action_description', header: 'Action', render: (r) => <span className="line-clamp-1">{r.action_description}</span> },
          { key: 'target_date', header: 'Target', render: (r) => r.target_date ? new Date(r.target_date).toLocaleDateString() : '—' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
        ],
      },
    },
  },
  {
    label: 'Incidents',
    reports: {
      incidents: {
        label: 'Incident Report',
        endpoint: '/reports/incidents',
        columns: [
          { key: 'incident_code', header: 'ID' },
          { key: 'incident_type', header: 'Type' },
          { key: 'occurred_at', header: 'Occurred', render: (r) => new Date(r.occurred_at).toLocaleString() },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
        ],
      },
      'emergency-response': {
        label: 'Emergency Response Report',
        endpoint: '/incidents/actions',
        columns: [
          { key: 'incident_code', header: 'Incident' },
          { key: 'step', header: 'Step', render: (r) => r.step.replaceAll('_', ' ') },
          { key: 'performed_at', header: 'When', render: (r) => new Date(r.performed_at).toLocaleString() },
          { key: 'performed_by_first_name', header: 'By', render: (r) => r.performed_by_first_name ? `${r.performed_by_first_name} ${r.performed_by_last_name}` : '—' },
        ],
      },
    },
  },
  {
    label: 'Recovery',
    reports: {
      'damage-assessment': {
        label: 'Damage Assessment Report',
        endpoint: '/damage-assessments',
        columns: [
          { key: 'assessment_code', header: 'ID' },
          { key: 'category', header: 'Category' },
          { key: 'damage_type', header: 'Type' },
          { key: 'severity', header: 'Severity', render: (r) => r.severity ? <StatusBadge value={r.severity} type="risk" /> : '—' },
          { key: 'estimated_cost', header: 'Est. Cost', render: (r) => formatCurrency(r.estimated_cost) },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
        ],
      },
    },
  },
  {
    label: 'Action Plan & Budget',
    reports: {
      'action-plan': {
        label: 'DRRM Action Plan',
        endpoint: '/action-plans',
        columns: [
          { key: 'plan_code', header: 'ID' },
          { key: 'activity', header: 'Activity' },
          { key: 'responsible_party', header: 'Responsible', render: (r) => r.responsible_party || '—' },
          { key: 'target_date', header: 'Target Date', render: (r) => r.target_date ? new Date(r.target_date).toLocaleDateString() : '—' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
        ],
      },
      'budget-utilization': {
        label: 'DRRM Budget Utilization',
        endpoint: '/action-plans',
        columns: [
          { key: 'plan_code', header: 'ID' },
          { key: 'activity', header: 'Activity' },
          { key: 'allocated_budget', header: 'Allocated', render: (r) => formatCurrency(r.allocated_budget) },
          { key: 'utilized_budget', header: 'Utilized', render: (r) => formatCurrency(r.utilized_budget) },
          { key: 'remaining_budget', header: 'Remaining', render: (r) => formatCurrency(r.remaining_budget) },
        ],
      },
    },
  },
  {
    label: 'Overview & Compliance',
    reports: {
      accomplishment: { label: 'DRRM Accomplishment Report', endpoint: '/reports/accomplishment', type: 'summary' },
      annual: { label: 'Annual DRRM Report', endpoint: '/reports/annual', type: 'summary' },
      compliance: { label: 'Compliance Report', endpoint: '/reports/compliance', type: 'summary' },
    },
  },
];

// Flatten for lookup-by-key convenience.
const REPORT_DEFS = Object.fromEntries(REPORT_GROUPS.flatMap((g) => Object.entries(g.reports)));

// Client-side CSV export keeps this dependency-free; swap for a PDF/Word
// export lib (or a backend-generated file) if that's ever prioritized —
// not built here, this is CSV only.
function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [activeKey, setActiveKey] = useState('hazard-inventory');
  const [rows, setRows] = useState([]);
  const [summaryData, setSummaryData] = useState(null); // set instead of `rows` for the 3 summary-style reports
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isSummary = REPORT_DEFS[activeKey]?.type === 'summary';

  const runReport = (key) => {
    setActiveKey(key);
    setIsLoading(true);
    setError('');
    const isSum = REPORT_DEFS[key].type === 'summary';
    api.get(REPORT_DEFS[key].endpoint)
      .then((data) => {
        if (isSum) { setSummaryData(data); setRows([]); }
        else { setRows(data); setSummaryData(null); }
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  };

  React.useEffect(() => runReport('hazard-inventory'), []);

  // Summary reports export as a flattened Section / Metric / Value list —
  // the on-screen view groups stats into sections with tiles, but CSV/PDF
  // need a flat row shape, same as every other report's export.
  const summaryExportColumns = [{ key: 'section', header: 'Section' }, { key: 'label', header: 'Metric' }, { key: 'value', header: 'Value' }];
  const summaryExportRows = summaryData?.sections.flatMap((s) => s.stats.map((stat) => ({ section: s.title, label: stat.label, value: stat.value }))) || [];

  const exportColumns = isSummary ? summaryExportColumns : REPORT_DEFS[activeKey].columns;
  const exportRows = isSummary ? summaryExportRows : rows;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Reports</h1>
        <select
          value={activeKey}
          onChange={(e) => runReport(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white min-w-[260px]"
        >
          {REPORT_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {Object.entries(group.reports).map(([key, def]) => (
                <option key={key} value={key}>{def.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 mb-3">
        <Button variant="secondary" onClick={() => downloadCsv(`${activeKey}.csv`, exportRows)} disabled={!exportRows.length}>
          Export CSV
        </Button>
        <Button variant="secondary" onClick={() => downloadPdf(`${activeKey}.pdf`, REPORT_DEFS[activeKey].label, exportColumns, exportRows)} disabled={!exportRows.length}>
          Export PDF
        </Button>
      </div>

      {error && <div className="text-sm text-risk-critical mb-3">{error}</div>}

      {isLoading ? (
        <div className="text-sm text-slate-500 py-8 text-center">Loading…</div>
      ) : isSummary ? (
        summaryData && <SummaryReportView data={summaryData} />
      ) : (
        <Table columns={REPORT_DEFS[activeKey].columns} rows={rows} isLoading={false} emptyMessage="No data for this report yet." />
      )}
    </div>
  );
}

// Generic renderer for the 3 multi-section summary reports (Accomplishment,
// Annual, Compliance) — pulls stats from many tables at once, so it can't
// reuse the flat-row <Table> component the other 13 reports use.
function SummaryReportView({ data }) {
  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500">
        {data.subtitle} · Generated {new Date(data.generatedAt).toLocaleString()}
      </div>

      {data.sections.map((section, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">{section.title}</h3>

          {section.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-1">
              {section.stats.map((stat, j) => (
                <div key={j} className="bg-slate-50 rounded-lg px-3 py-2.5">
                  <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500 capitalize">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {section.rows?.length > 0 && section.columns && (
            <div className="mt-3">
              <Table
                columns={section.columns.map((c) => ({
                  ...c,
                  render: (r) => {
                    const v = r[c.key];
                    if (typeof v === 'string' && (c.key.includes('date') || c.key.endsWith('_at'))) {
                      return new Date(v).toLocaleDateString();
                    }
                    return v ?? '—';
                  },
                }))}
                rows={section.rows}
                isLoading={false}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
