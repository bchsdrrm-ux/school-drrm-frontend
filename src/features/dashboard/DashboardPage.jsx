import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { useAuth } from '../../auth/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Icon from '../../components/icons';
import { RiskHeatMap, IncidentTrendChart, SeverityBar } from './charts';

const REFRESH_MS = 60000;

const countFor = (rows, key, value) => rows?.find((r) => r[key] === value)?.count ?? 0;
const sum = (rows) => (rows || []).reduce((total, r) => total + Number(r.count || 0), 0);
const fmt = (n) => Number(n || 0).toLocaleString();

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function relativeDay(dateLike) {
  const days = Math.round((startOfDay(new Date(dateLike)) - startOfDay(new Date())) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  return days > 0 ? `In ${days} days` : `${-days} days ago`;
}

function relativeTime(dateLike) {
  const minutes = Math.round((Date.now() - new Date(dateLike).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return relativeDay(dateLike);
}

function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function CardLink({ to, children }) {
  return <Link to={to} className="text-xs font-medium text-brand-700 hover:underline">{children}</Link>;
}

function EmptyNote({ icon = 'check', children }) {
  return (
    <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
      <Icon name={icon} className="h-4 w-4 text-green-600" />
      {children}
    </div>
  );
}

function StatTile({ to, icon, label, value, detail, footer }) {
  return (
    <Link to={to} className="group block rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm sm:p-5">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon name={icon} className="h-4 w-4" /></span>
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">{value}</div>
      <div className="mt-1 min-h-[1.25rem] text-xs text-slate-500">{detail}</div>
      {footer && <div className="mt-3">{footer}</div>}
    </Link>
  );
}

function StatusBanner({ emergency, attention }) {
  if (emergency) {
    return (
      <Link to="/emergency-mode" role="alert" className="mb-5 flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-900 hover:bg-red-100">
        <Icon name="siren" className="h-6 w-6 shrink-0 text-red-600" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Emergency active: {emergency.alert_type}</div>
          <div className="text-xs text-red-800">Open the console to follow instructions, submit headcounts and read announcements.</div>
        </div>
        <span className="hidden shrink-0 items-center gap-1 text-sm font-medium sm:inline-flex">Open console <Icon name="arrow" className="h-4 w-4" /></span>
      </Link>
    );
  }
  if (attention.length) {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
        <Icon name="hazard" className="h-6 w-6 shrink-0 text-amber-600" />
        <div className="min-w-0">
          <div className="text-sm font-semibold">No active emergency. Some items need attention.</div>
          <div className="text-xs text-amber-800">{attention.slice(0, 3).map((a) => `${fmt(a.count)} ${a.label.toLowerCase()}`).join(' · ')}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-green-900">
      <Icon name="check" className="h-6 w-6 shrink-0 text-green-600" />
      <div>
        <div className="text-sm font-semibold">All clear</div>
        <div className="text-xs text-green-800">No active emergency, open incident, critical hazard or overdue item.</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [emergency, setEmergency] = useState(null);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = (first) => {
      Promise.all([
        api.get('/dashboard/summary'),
        api.get('/emergency-mode/active').catch(() => null),
      ])
        .then(([s, e]) => {
          if (cancelled) return;
          setSummary(s);
          setEmergency(e);
          setError('');
          setUpdatedAt(new Date());
        })
        // A failed background refresh keeps the last good data on screen.
        .catch((err) => { if (!cancelled && first) setError(err.message); });
    };
    load(true);
    const id = setInterval(() => load(false), REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (error) {
    return <div className="text-sm text-risk-critical">{error}</div>;
  }
  if (!summary) {
    return (
      <div role="status" aria-label="Loading dashboard">
        <div className="mb-5 h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mb-5 h-16 animate-pulse rounded-xl bg-slate-200/70" />
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {[0, 1].map((i) => <div key={i} className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
        </div>
      </div>
    );
  }

  const riskCounts = Object.fromEntries((summary.riskStatus || []).map((r) => [r.risk_level, r.count]));
  const totalHazards = sum(summary.riskStatus);
  const critical = riskCounts.critical || 0;
  const high = riskCounts.high || 0;

  const activeIncidents = countFor(summary.incidents, 'status', 'open') + countFor(summary.incidents, 'status', 'responding');
  const totalIncidents = sum(summary.incidents);

  const equipmentTotal = sum(summary.equipmentAlerts);
  const doc = summary.documentStatus || {};
  const docExpired = Number(doc.expired || 0);
  const docExpiring = Number(doc.expiring_soon || 0);
  const docMissing = Number(doc.missing || 0);
  const docNeeding = docExpired + docExpiring + docMissing;
  const overdue = summary.overdueHazardActions || 0;

  const equipmentDetail = (summary.equipmentAlerts || [])
    .map((a) => `${a.count} ${String(a.alert_type).replaceAll('_', ' ').toLowerCase()}`)
    .join(' · ');

  const attention = [
    { count: critical, label: 'Critical hazards', to: '/hazards' },
    { count: overdue, label: 'Overdue hazard actions', to: '/hazards' },
    { count: activeIncidents, label: 'Active incidents', to: '/incidents' },
    { count: docExpired, label: 'Expired documents', to: '/documents' },
    { count: docExpiring, label: 'Documents expiring within 30 days', to: '/documents' },
    { count: equipmentTotal, label: 'Equipment alerts', to: '/equipment' },
    { count: docMissing, label: 'Documents without a file', to: '/documents' },
  ].filter((a) => a.count > 0);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{greeting()}, {user?.firstName}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            {updatedAt && <span className="text-slate-400"> · Updated {updatedAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/hazards?new=1" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-800">
            <Icon name="plus" className="h-4 w-4" /> Report hazard
          </Link>
          <Link to="/incidents?new=1" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Icon name="plus" className="h-4 w-4" /> Report incident
          </Link>
        </div>
      </div>

      <StatusBanner emergency={emergency} attention={attention} />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          to="/hazards" icon="hazard" label="Active hazards" value={fmt(totalHazards)}
          detail={totalHazards ? `${critical} critical · ${high} high` : 'None recorded yet'}
          footer={<SeverityBar counts={riskCounts} />}
        />
        <StatTile
          to="/incidents" icon="incident" label="Active incidents" value={fmt(activeIncidents)}
          detail={`${fmt(totalIncidents)} recorded in total`}
        />
        <StatTile
          to="/equipment" icon="equipment" label="Equipment alerts" value={fmt(equipmentTotal)}
          detail={equipmentTotal ? equipmentDetail : 'All equipment in order'}
        />
        <StatTile
          to="/documents" icon="documents" label="Documents to review" value={fmt(docNeeding)}
          detail={docNeeding ? `${docExpired} expired · ${docExpiring} expiring · ${docMissing} no file` : 'All documents current'}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {summary.riskMatrix?.likelihoodScale?.length > 0 && <RiskHeatMap matrix={summary.riskMatrix} />}
        {summary.incidentTrend?.length > 0 && <IncidentTrendChart trend={summary.incidentTrend} />}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Needs attention">
          {attention.length === 0 ? (
            <EmptyNote>Nothing needs attention right now.</EmptyNote>
          ) : (
            <ul className="space-y-1">
              {attention.map((a) => (
                <li key={a.label}>
                  <Link to={a.to} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                    <span className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-800">{fmt(a.count)}</span>
                    <span className="flex-1 text-sm text-slate-700">{a.label}</span>
                    <Icon name="arrow" className="h-4 w-4 text-slate-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Upcoming activities" action={<CardLink to="/drills">Drills</CardLink>}>
          {!summary.upcomingActivities?.length ? (
            <div className="py-3 text-sm text-slate-500">
              Nothing scheduled. <Link to="/drills" className="font-medium text-brand-700 hover:underline">Plan a drill</Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {summary.upcomingActivities.map((a) => (
                <li key={a.code} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <span className={`mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${a.type === 'Drill' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>{a.type}</span>
                    <span className="text-slate-700">{a.label}</span>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    <div className="font-medium text-slate-700">{relativeDay(a.date)}</div>
                    <div className="text-slate-500">{new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent incidents" action={<CardLink to="/incidents">View all</CardLink>}>
          {!summary.recentIncidents?.length ? (
            <EmptyNote>No incidents reported.</EmptyNote>
          ) : (
            <ul className="divide-y divide-slate-100">
              {summary.recentIncidents.map((i) => (
                <li key={i.code} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-800">{i.type}</div>
                    <div className="text-xs text-slate-500">{i.code} · {relativeTime(i.occurred_at)}</div>
                  </div>
                  <StatusBadge value={i.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Preparedness at a glance">
        <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Link to="/evacuation" className="rounded-lg p-2 hover:bg-slate-50">
            <dt className="text-xs text-slate-500">Evacuation capacity</dt>
            <dd className="mt-1 text-2xl font-semibold text-slate-900">{fmt(summary.evacuationCapacity?.total_capacity)}</dd>
            <dd className="text-xs text-slate-500">persons across {fmt(summary.evacuationCapacity?.area_count)} active area(s)</dd>
          </Link>
          <Link to="/drills" className="rounded-lg p-2 hover:bg-slate-50">
            <dt className="text-xs text-slate-500">Drills conducted</dt>
            <dd className="mt-1 text-2xl font-semibold text-slate-900">{fmt(summary.drillsConductedLast12Months)}</dd>
            <dd className="text-xs text-slate-500">in the last 12 months</dd>
          </Link>
          <Link to="/documents" className="rounded-lg p-2 hover:bg-slate-50">
            <dt className="text-xs text-slate-500">Documents up to date</dt>
            <dd className="mt-1 text-2xl font-semibold text-slate-900">{fmt(doc.current)}</dd>
            <dd className="text-xs text-slate-500">of {fmt(doc.total)} records</dd>
          </Link>
          <Link to="/hazards" className="rounded-lg p-2 hover:bg-slate-50">
            <dt className="text-xs text-slate-500">Low-risk hazards</dt>
            <dd className="mt-1 text-2xl font-semibold text-slate-900">{fmt(riskCounts.low)}</dd>
            <dd className="text-xs text-slate-500">lowest severity level</dd>
          </Link>
        </dl>
      </Card>
    </div>
  );
}
