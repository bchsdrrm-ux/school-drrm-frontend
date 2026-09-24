import React, { useRef, useState } from 'react';

// Neutral chrome shared by the charts (slate, matching the rest of the app).
const GRID = 'var(--chart-grid)';
const BASELINE = 'var(--chart-baseline)';
const INK_SECONDARY = 'var(--chart-ink)';
const INK_MUTED = 'var(--chart-ink-muted)';
const ACCENT = 'var(--chart-accent)'; // brand-600: the one highlighted series
const CONTEXT = 'var(--chart-context)'; // de-emphasis gray for everything that isn't the story

// Risk levels are an ordinal *status*, so they keep the app's risk colors (same as
// StatusBadge). Hue alone can't separate orange/red/yellow for every reader, so every
// place that uses these also shows the level as text (letter, legend, tooltip, table).
export const RISK_LEVELS = {
  low: { label: 'Low', letter: 'L', solid: '#15803d', tint: 'var(--tint-low)', ink: '#ffffff' },
  moderate: { label: 'Moderate', letter: 'M', solid: '#ca8a04', tint: 'var(--tint-moderate)', ink: '#1c1917' },
  high: { label: 'High', letter: 'H', solid: '#c2410c', tint: 'var(--tint-high)', ink: '#ffffff' },
  critical: { label: 'Critical', letter: 'C', solid: '#dc2626', tint: 'var(--tint-critical)', ink: '#ffffff' },
};
export const RISK_ORDER = ['critical', 'high', 'moderate', 'low'];

/** Tooltip anchored to the hovered/focused element, so hover and keyboard focus behave the same. */
function useChartTooltip() {
  const containerRef = useRef(null);
  const [tip, setTip] = useState(null);

  const show = (event, content) => {
    const container = containerRef.current;
    if (!container) return;
    const c = container.getBoundingClientRect();
    const r = event.currentTarget.getBoundingClientRect();
    setTip({ x: r.left - c.left + r.width / 2, y: r.top - c.top, content });
  };
  const hide = () => setTip(null);

  const tooltip = tip && (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-tip px-3 py-2 text-xs text-white shadow-lg"
      style={{ left: tip.x, top: tip.y - 6 }}
    >
      {tip.content}
    </div>
  );
  return { containerRef, show, hide, tooltip };
}

/** Card with a title and a Chart/Table switch, so every chart has a non-visual twin. */
export function ChartCard({ title, subtitle, chart, table, className = '' }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={`rounded-xl border border-slate-200 bg-surface p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <button
          onClick={() => setAsTable((v) => !v)}
          className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          aria-pressed={asTable}
        >
          {asTable ? 'View chart' : 'View table'}
        </button>
      </div>
      {asTable ? table : chart}
    </section>
  );
}

function DataTable({ head, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            {head.map((h) => <th key={h} className="px-2 py-1.5 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              {r.map((cell, j) => <td key={j} className="px-2 py-1.5 tabular-nums text-slate-700">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk heat map: likelihood (rows, highest at top) x impact (columns).
// Cell tint = the configured risk level for that cell; the dot = how many hazards sit there.
// ---------------------------------------------------------------------------
export function RiskHeatMap({ matrix }) {
  const { containerRef, show, hide, tooltip } = useChartTooltip();
  const levelAt = new Map((matrix.levels || []).map((l) => [`${l.likelihood}:${l.impact}`, l.risk_level]));
  const countAt = new Map((matrix.cells || []).map((c) => [`${c.likelihood}:${c.impact}`, c.count]));
  const likelihood = [...(matrix.likelihoodScale || [])].sort((a, b) => b.value - a.value); // high -> low, top to bottom
  const impact = [...(matrix.impactScale || [])].sort((a, b) => a.value - b.value);
  const total = [...countAt.values()].reduce((a, b) => a + b, 0);

  const cellLabel = (l, i, level, count) =>
    `Likelihood ${l.label}, impact ${i.label}: ${RISK_LEVELS[level]?.label || 'Unrated'} risk, ${count} hazard${count === 1 ? '' : 's'}`;

  const chart = (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className="flex w-5 shrink-0 items-center justify-center">
          <span className="-rotate-90 whitespace-nowrap text-[11px] font-medium text-slate-500">Likelihood</span>
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="grid gap-[2px] grid-cols-[1.25rem_repeat(var(--n),minmax(0,1fr))] sm:grid-cols-[5.5rem_repeat(var(--n),minmax(0,1fr))]"
            style={{ '--n': impact.length }}
          >
            {likelihood.map((l) => (
              <React.Fragment key={l.value}>
                <div className="flex items-center justify-end pr-1 text-[11px] text-slate-500 sm:pr-2">
                  <span className="sm:hidden">{l.value}</span>
                  <span className="hidden sm:inline">{l.label}</span>
                </div>
                {impact.map((i) => {
                  const key = `${l.value}:${i.value}`;
                  const level = levelAt.get(key);
                  const count = countAt.get(key) || 0;
                  const style = RISK_LEVELS[level];
                  const text = cellLabel(l, i, level, count);
                  return (
                    <div
                      key={key}
                      tabIndex={0}
                      role="img"
                      aria-label={text}
                      onMouseEnter={(e) => show(e, <><div className="font-semibold">{count} hazard{count === 1 ? '' : 's'}</div><div className="text-tip-muted">Likelihood: {l.label} · Impact: {i.label}</div><div className="text-tip-muted">{style?.label || 'Unrated'} risk</div></>)}
                      onFocus={(e) => show(e, <><div className="font-semibold">{count} hazard{count === 1 ? '' : 's'}</div><div className="text-tip-muted">Likelihood: {l.label} · Impact: {i.label}</div><div className="text-tip-muted">{style?.label || 'Unrated'} risk</div></>)}
                      onMouseLeave={hide}
                      onBlur={hide}
                      className="relative flex h-11 items-end justify-center rounded pb-1 outline-none ring-slate-900 focus-visible:ring-2"
                      style={{ background: style?.tint || 'var(--tint-empty)' }}
                    >
                      <span className="absolute left-1 top-0.5 text-[9px] font-semibold" style={{ color: INK_SECONDARY }}>{style?.letter}</span>
                      {count > 0 && (
                        <span
                          className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-xs font-semibold"
                          style={{ background: style?.solid || INK_MUTED, color: style?.ink || '#fff' }}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
            <div />
            {impact.map((i) => (
              <div key={i.value} className="pt-1 text-center text-[11px] text-slate-500">
                <span className="sm:hidden">{i.value}</span>
                <span className="hidden sm:inline">{i.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-1 text-center text-[11px] font-medium text-slate-500">Impact</div>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500 sm:hidden">
        Likelihood: {[...likelihood].reverse().map((l) => `${l.value} ${l.label}`).join(', ')}. Impact: {impact.map((i) => `${i.value} ${i.label}`).join(', ')}.
      </p>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        {['low', 'moderate', 'high', 'critical'].map((level) => (
          <li key={level} className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: RISK_LEVELS[level].solid }} aria-hidden="true" />
            {RISK_LEVELS[level].label} ({RISK_LEVELS[level].letter})
          </li>
        ))}
      </ul>
      {tooltip}
    </div>
  );

  const rows = likelihood.flatMap((l) =>
    impact.map((i) => {
      const key = `${l.value}:${i.value}`;
      return [l.label, i.label, RISK_LEVELS[levelAt.get(key)]?.label || 'Unrated', countAt.get(key) || 0];
    })
  ).filter((r) => r[3] > 0);

  return (
    <ChartCard
      title="Risk matrix"
      subtitle={total ? `${total} active hazard${total === 1 ? '' : 's'} by likelihood and impact` : 'No hazards recorded yet'}
      chart={chart}
      table={rows.length
        ? <DataTable head={['Likelihood', 'Impact', 'Risk level', 'Hazards']} rows={rows} />
        : <p className="py-6 text-center text-sm text-slate-500">No hazards recorded yet.</p>}
    />
  );
}

// ---------------------------------------------------------------------------
// Incident trend: last six months, current month highlighted, prior months as context.
// ---------------------------------------------------------------------------
function niceScale(max) {
  if (max <= 4) return { top: Math.max(max, 1), step: 1 };
  const step = Math.ceil(max / 4);
  return { top: step * 4, step };
}

function monthDate(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

export function IncidentTrendChart({ trend }) {
  const { containerRef, show, hide, tooltip } = useChartTooltip();
  const W = 480;
  const H = 230;
  const pad = { top: 22, right: 8, bottom: 26, left: 30 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const max = Math.max(0, ...trend.map((t) => t.count));
  const { top, step } = niceScale(max);
  const total = trend.reduce((a, t) => a + t.count, 0);
  const band = plotW / Math.max(trend.length, 1);
  const barW = Math.min(24, band * 0.5);
  const y = (v) => pad.top + plotH - (v / top) * plotH;
  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);

  // 4px rounded data-end, square at the baseline.
  const barPath = (x, h) => {
    const r = Math.min(4, h);
    const yTop = pad.top + plotH - h;
    return `M${x},${pad.top + plotH} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + barW - r} Q${x + barW},${yTop} ${x + barW},${yTop + r} V${pad.top + plotH} Z`;
  };

  const label = (t) => monthDate(t.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const tipFor = (t) => (
    <>
      <div className="font-semibold">{t.count} incident{t.count === 1 ? '' : 's'}</div>
      <div className="text-tip-muted">{label(t)}</div>
    </>
  );

  const chart = (
    <div ref={containerRef} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Incidents per month, last ${trend.length} months: ${trend.map((t) => `${label(t)} ${t.count}`).join(', ')}`}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} style={{ stroke: v === 0 ? BASELINE : GRID }} strokeWidth="1" />
            <text x={pad.left - 6} y={y(v) + 3.5} textAnchor="end" fontSize="10" style={{ fill: INK_MUTED }}>{v}</text>
          </g>
        ))}
        {trend.map((t, idx) => {
          const cx = pad.left + band * idx + band / 2;
          const x = cx - barW / 2;
          const h = (t.count / top) * plotH;
          const current = idx === trend.length - 1;
          return (
            <g key={t.month}>
              {t.count > 0 && <path d={barPath(x, h)} style={{ fill: current ? ACCENT : CONTEXT }} />}
              {t.count > 0 && (
                <text x={cx} y={y(t.count) - 6} textAnchor="middle" fontSize="11" fontWeight="600" style={{ fill: INK_SECONDARY }}>{t.count}</text>
              )}
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fontWeight={current ? 600 : 400} style={{ fill: current ? INK_SECONDARY : INK_MUTED }}>
                {monthDate(t.month).toLocaleDateString(undefined, { month: 'short' })}
              </text>
              {/* Hit target: the whole band, far larger than the bar itself */}
              <rect
                x={pad.left + band * idx}
                y={pad.top}
                width={band}
                height={plotH + pad.bottom}
                fill="transparent"
                tabIndex={0}
                aria-label={`${label(t)}: ${t.count} incident${t.count === 1 ? '' : 's'}`}
                onMouseEnter={(e) => show(e, tipFor(t))}
                onFocus={(e) => show(e, tipFor(t))}
                onMouseLeave={hide}
                onBlur={hide}
                className="outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900"
              />
            </g>
          );
        })}
        {total === 0 && (
          <text x={pad.left + plotW / 2} y={pad.top + plotH / 2} textAnchor="middle" fontSize="12" style={{ fill: INK_MUTED }}>No incidents in this period</text>
        )}
      </svg>
      {tooltip}
    </div>
  );

  return (
    <ChartCard
      title="Incidents per month"
      subtitle={`${total} reported in the last ${trend.length} months`}
      chart={chart}
      table={<DataTable head={['Month', 'Incidents']} rows={trend.map((t) => [label(t), t.count])} />}
    />
  );
}

/** Part-to-whole bar for the hazard tile: segments separated by 2px gaps, each with a text equivalent. */
export function SeverityBar({ counts }) {
  const total = RISK_ORDER.reduce((sum, level) => sum + (counts[level] || 0), 0);
  if (!total) return <div className="h-2 rounded-full bg-slate-100" aria-hidden="true" />;
  return (
    <div className="flex h-2 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={RISK_ORDER.map((l) => `${RISK_LEVELS[l].label} ${counts[l] || 0}`).join(', ')}>
      {RISK_ORDER.filter((l) => counts[l]).map((level) => (
        <div
          key={level}
          title={`${RISK_LEVELS[level].label}: ${counts[level]}`}
          style={{ width: `${(counts[level] / total) * 100}%`, background: RISK_LEVELS[level].solid }}
        />
      ))}
    </div>
  );
}
