import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../components/Logo';
import Icon from '../components/icons';

// Mirrors the Navigation / Information Architecture from the master prompt.
const NAV_SECTIONS = [
  {
    label: null,
    items: [{ to: '/', label: 'Dashboard', icon: 'home' }],
  },
  {
    label: 'Risk Management',
    items: [
      { to: '/hazards', label: 'Hazard Inventory', icon: 'hazard' },
      { to: '/hazard-map', label: 'Hazard Map', icon: 'map' },
      { to: '/campus-map', label: 'Campus Map', icon: 'pin' },
    ],
  },
  {
    label: 'Preparedness',
    items: [
      { to: '/emergency-plans', label: 'Emergency Plans', icon: 'plans' },
      { to: '/evacuation', label: 'Evacuation Plans', icon: 'exit' },
      { to: '/emergency-contacts', label: 'Emergency Contacts', icon: 'phone' },
      { to: '/equipment', label: 'Emergency Equipment', icon: 'equipment' },
      { to: '/drrm-teams', label: 'DRRM Teams', icon: 'team' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/drills', label: 'Drills', icon: 'drill' },
      { to: '/incidents', label: 'Incidents', icon: 'incident' },
      { to: '/inspections', label: 'Inspections', icon: 'inspect' },
      { to: '/accountability', label: 'Headcount', icon: 'headcount' },
      { to: '/training', label: 'Training', icon: 'training' },
      { to: '/recovery', label: 'Damage & Recovery', icon: 'recovery' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/action-plan', label: 'Action Plan & Budget', icon: 'budget' },
      { to: '/documents', label: 'Documents', icon: 'documents' },
      { to: '/reports', label: 'Reports', icon: 'reports' },
      { to: '/settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

function readCollapsed() {
  try { return localStorage.getItem('drrm_sidebar_collapsed') === '1'; } catch { return false; }
}

/**
 * Off-canvas drawer on mobile/tablet (below `md`), sticky column on desktop.
 * On desktop it can be collapsed to an icon rail; the choice is remembered.
 * `isOpen`/`onClose` only apply below `md`.
 */
export default function Sidebar({ isOpen, onClose }) {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem('drrm_sidebar_collapsed', c ? '0' : '1'); } catch { /* storage unavailable */ }
      return !c;
    });
  };

  // `collapsed` only affects md+; on mobile the drawer always shows full labels.
  const labelClass = collapsed ? 'md:hidden' : '';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-white border-r border-slate-200
          overflow-y-auto transform transition-all duration-200 ease-in-out
          md:static md:translate-x-0 md:h-screen md:sticky md:top-0
          ${collapsed ? 'md:w-[68px]' : 'md:w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className={`px-4 py-4 border-b border-slate-200 flex items-center gap-3 ${collapsed ? 'md:justify-center md:px-2' : ''}`}>
          <Logo size={34} />
          <div className={`flex-1 min-w-0 ${labelClass}`}>
            <div className="text-sm font-semibold text-slate-900 leading-tight">BCHS DRRM</div>
            <div className="text-[11px] text-slate-500 leading-tight">Management System</div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-slate-600 text-xl leading-none px-1"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="px-2 py-3" aria-label="Main">
          {NAV_SECTIONS.map((section, i) => (
            <div key={i} className="mb-2">
              {section.label && (
                <div className={`px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 ${labelClass}`}>
                  {section.label}
                </div>
              )}
              {i > 0 && collapsed && <div className="hidden md:block mx-3 my-2 border-t border-slate-100" />}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-0.5 transition-colors ${collapsed ? 'md:justify-center' : ''} ${
                      isActive
                        ? 'bg-brand-50 text-brand-800 font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon name={item.icon} />
                  <span className={labelClass}>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="hidden md:block sticky bottom-0 bg-white border-t border-slate-200 p-2">
          <button
            onClick={toggleCollapsed}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 ${collapsed ? 'justify-center' : ''}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
