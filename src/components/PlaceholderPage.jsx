import React from 'react';

// Used for nav items that map to Phase 2+ modules not yet built, so the
// full Information Architecture is navigable from day one without dead links.
export default function PlaceholderPage({ title, phase }) {
  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold text-slate-900 mb-1">{title}</h1>
      <p className="text-sm text-slate-500">
        {phase ? `Planned for ${phase} — not yet built.` : 'Not yet built.'}
      </p>
    </div>
  );
}
