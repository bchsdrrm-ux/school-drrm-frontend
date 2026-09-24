import React from 'react';

/**
 * Switch that controls whether a record appears on the public (no-login)
 * information page. Read-only badge for users who can't manage the record.
 */
export default function PublicToggle({ value, onChange, canManage, label }) {
  if (!canManage) {
    return (
      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${value ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
        {value ? 'Public' : 'Staff only'}
      </span>
    );
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className="inline-flex items-center gap-2 text-xs font-medium text-slate-600"
    >
      <span className={`relative h-5 w-9 rounded-full transition-colors ${value ? 'bg-brand-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${value ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      {value ? 'Public' : 'Staff only'}
    </button>
  );
}
