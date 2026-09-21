import React, { useState } from 'react';
import LocationsPage from '../locations/LocationsPage';
import UsersPage from '../users/UsersPage';
import AuditLogPage from '../auditLogs/AuditLogPage';

// Tabbed shell so future admin-configurable settings (e.g. the risk
// likelihood/impact matrix, notification thresholds) have a home without
// restructuring the nav. Users and Audit Log are only meaningfully usable
// by System Admin (per spec Section 1), but the tabs themselves are
// visible to anyone who can reach Settings — each page's own access
// control (canManage checks, or the backend's ADMIN_ONLY restriction for
// Audit Log) governs what actually shows, same pattern used throughout
// the app rather than hiding the tab itself.
const TABS = [
  { key: 'locations', label: 'Locations', Component: LocationsPage },
  { key: 'users', label: 'Users', Component: UsersPage },
  { key: 'audit', label: 'Audit Log', Component: AuditLogPage },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('locations');
  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.Component;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-sm font-medium px-4 py-2 rounded-lg border ${
              activeTab === tab.key ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {ActiveComponent && <ActiveComponent />}
    </div>
  );
}
