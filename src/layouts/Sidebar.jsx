import React from 'react';
import { NavLink } from 'react-router-dom';

// Mirrors the Navigation / Information Architecture from the master prompt.
// Phase 1 items link to real pages; later-phase items are included now
// (pointing at placeholder pages) so the IA is visible end-to-end and
// modules can be filled in without restructuring the nav.
const NAV_SECTIONS = [
  {
    label: null,
    items: [{ to: '/', label: 'Dashboard' }],
  },
  {
    label: 'Risk Management',
    items: [
      { to: '/hazards', label: 'Hazard Inventory & Risk Assessment' },
      { to: '/hazard-map', label: 'Hazard Map' },
    ],
  },
  {
    label: 'Preparedness',
    items: [
      { to: '/emergency-plans', label: 'Emergency Plans' },
      { to: '/evacuation', label: 'Evacuation Plans' },
      { to: '/emergency-contacts', label: 'Emergency Contacts' },
      { to: '/equipment', label: 'Emergency Equipment' },
      { to: '/drrm-teams', label: 'DRRM Teams' },
    ],
  },
  {
    label: 'Drills & Exercises',
    items: [{ to: '/drills', label: 'Drill Calendar & Management' }],
  },
  {
    label: 'Incidents',
    items: [{ to: '/incidents', label: 'Report & Monitoring' }],
  },
  {
    label: 'Inspections',
    items: [{ to: '/inspections', label: 'Facility / Safety / BFP' }],
  },
  {
    label: 'Accountability',
    items: [{ to: '/accountability', label: 'Headcount' }],
  },
  {
    label: 'Training',
    items: [{ to: '/training', label: 'DRRM Training' }],
  },
  {
    label: 'Response & Recovery',
    items: [{ to: '/recovery', label: 'Damage & Recovery' }],
  },
  {
    label: null,
    items: [
      { to: '/action-plan', label: 'Action Plan & Budget' },
      { to: '/documents', label: 'Documents' },
      { to: '/reports', label: 'Reports' },
      { to: '/settings', label: 'Settings' },
    ],
  },
];

/**
 * Off-canvas drawer on mobile/tablet (below the `md` breakpoint), static
 * always-visible column on desktop — this is the one structural piece the
 * whole app's mobile usability depends on, since a fixed 256px panel with
 * no way to hide it would eat most of a phone screen.
 *
 * `isOpen`/`onClose` are only meaningful below `md`: at `md` and above,
 * `md:translate-x-0 md:static` unconditionally overrides them so the
 * sidebar is simply always shown, exactly as before this patch.
 */
export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Backdrop — mobile only, closes the drawer on tap outside it */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-white border-r border-slate-200
          overflow-y-auto transform transition-transform duration-200 ease-in-out
          md:static md:translate-x-0 md:h-screen md:sticky md:top-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="px-4 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900 leading-tight">School DRRM</div>
            <div className="text-xs text-slate-500">Management Module</div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-slate-600 text-xl leading-none px-1"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="px-2 py-3">
          {NAV_SECTIONS.map((section, i) => (
            <div key={i} className="mb-3">
              {section.label && (
                <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {section.label}
                </div>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose} // no-op on desktop (sidebar stays visible via md: override); closes the drawer on mobile
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm mb-0.5 transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-800 font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
