import React from 'react';

// Color-codes risk levels and generic statuses at a glance, per the spec's
// dashboard requirement ("color-coded risk levels, badges for overdue/
// expiring items"). Keep this the single source of truth for badge colors
// so risk/status coloring stays consistent across every module.
const RISK_STYLES = {
  low: 'bg-green-50 text-green-700 border-green-200',
  moderate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

const ALERT_STYLES = {
  OVERDUE_INSPECTION: 'bg-orange-50 text-orange-700 border-orange-200',
  EXPIRING_SOON: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  EXPIRED: 'bg-red-50 text-red-700 border-red-200',
  MISSING: 'bg-red-50 text-red-700 border-red-200',
};

const GENERIC_STYLES = 'bg-slate-100 text-slate-600 border-slate-200';

export default function StatusBadge({ value, type = 'generic' }) {
  if (!value) return null;

  const styles =
    type === 'risk' ? RISK_STYLES[value] || GENERIC_STYLES :
    type === 'alert' ? ALERT_STYLES[value] || GENERIC_STYLES :
    GENERIC_STYLES;

  const label = String(value).replaceAll('_', ' ');

  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${styles}`}>
      {label.toLowerCase()}
    </span>
  );
}
