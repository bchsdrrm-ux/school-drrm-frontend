import React from 'react';
import { useTheme } from '../lib/theme';

const OPTIONS = [
  { value: 'system', label: 'System', icon: <path d="M4 5h16v11H4zM9 20h6M12 16v4" /> },
  { value: 'light', label: 'Light', icon: <path d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66l1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14l-1.41-1.41M16 12a4 4 0 11-8 0 4 4 0 018 0z" /> },
  { value: 'dark', label: 'Dark', icon: <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" /> },
];

function Glyph({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      {children}
    </svg>
  );
}

// Segmented System / Light / Dark control.
export default function ThemeToggle({ className = '' }) {
  const { preference, setPreference } = useTheme();
  return (
    <div role="radiogroup" aria-label="Color theme" className={`inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 ${className}`}>
      {OPTIONS.map((o) => {
        const selected = preference === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPreference(o.value)}
            title={o.label}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              selected ? 'bg-surface text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Glyph>{o.icon}</Glyph>
            <span className="hidden sm:inline">{o.label}</span>
            <span className="sr-only sm:hidden">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
