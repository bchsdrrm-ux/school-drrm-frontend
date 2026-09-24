import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import StatusBadge from '../../components/StatusBadge';

const RISK_ORDER = ['critical', 'high', 'moderate', 'low'];
const INCIDENT_STATUS_ORDER = ['open', 'responding', 'resolved', 'closed'];

function SummaryCard({ title, children, to }) {
  const content = (
    <div className="bg-white rounded-xl border border-slate-200 p-5 h-full">
      <div className="text-sm font-medium text-slate-500 mb-3">{title}</div>
      {children}
    </div>
  );
  return to ? <Link to={to} className="block hover:shadow-sm transition-shadow rounded-xl">{content}</Link> : content;
}

function countFor(rows, key, value) {
  return rows?.find((r) => r[key] === value)?.count ?? 0;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/summary').then(setSummary).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="text-sm text-risk-critical">{error}</div>;
  }
  if (!summary) {
    return (
      <div role="status" aria-label="Loading dashboard">
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Hazards by Risk Level" to="/hazards">
          <div className="space-y-1.5">
            {RISK_ORDER.map((level) => (
              <div key={level} className="flex items-center justify-between">
                <StatusBadge value={level} type="risk" />
                <span className="text-sm font-semibold text-slate-800">{countFor(summary.riskStatus, 'risk_level', level)}</span>
              </div>
            ))}
          </div>
        </SummaryCard>

        <SummaryCard title="Incidents" to="/incidents">
          <div className="space-y-1.5">
            {INCIDENT_STATUS_ORDER.map((status) => (
              <div key={status} className="flex items-center justify-between">
                <StatusBadge value={status} />
                <span className="text-sm font-semibold text-slate-800">{countFor(summary.incidents, 'status', status)}</span>
              </div>
            ))}
          </div>
        </SummaryCard>

        <SummaryCard title="Equipment Alerts" to="/equipment">
          {summary.equipmentAlerts?.length ? (
            <div className="space-y-1.5">
              {summary.equipmentAlerts.map((a) => (
                <div key={a.alert_type} className="flex items-center justify-between">
                  <StatusBadge value={a.alert_type} type="alert" />
                  <span className="text-sm font-semibold text-slate-800">{a.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-400">No active alerts</div>
          )}
        </SummaryCard>

        <SummaryCard title="Evacuation Capacity" to="/evacuation">
          <div className="text-2xl font-semibold text-slate-900">
            {summary.evacuationCapacity?.total_capacity ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            across {summary.evacuationCapacity?.area_count ?? 0} active area(s)
          </div>
        </SummaryCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard title="Upcoming DRRM Activities" to="/drills">
          {!summary.upcomingActivities?.length ? (
            <div className="text-sm text-slate-400">Nothing scheduled.</div>
          ) : (
            <ul className="space-y-2">
              {summary.upcomingActivities.map((a) => (
                <li key={a.code} className="flex items-center justify-between text-sm">
                  <div>
                    <span className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mr-2 ${a.type === 'Drill' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                      {a.type}
                    </span>
                    <span className="text-slate-700">{a.label}</span>
                  </div>
                  <span className="text-slate-500">{new Date(a.date).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </SummaryCard>

        <SummaryCard title="Document Status" to="/documents">
          {!summary.documentStatus ? (
            <div className="text-sm text-slate-400">No documents recorded yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {[
                ['current', 'Current', 'text-green-700'],
                ['expiring_soon', 'Expiring Soon', 'text-yellow-700'],
                ['expired', 'Expired', 'text-red-700'],
                ['missing', 'No File', 'text-slate-500'],
              ].map(([key, label, colorClass]) => (
                <div key={key}>
                  <div className={`text-lg font-bold ${colorClass}`}>{summary.documentStatus[key]}</div>
                  <div className="text-[11px] text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          )}
        </SummaryCard>
      </div>
    </div>
  );
}
