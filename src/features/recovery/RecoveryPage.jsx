import React, { useState } from 'react';
import DamageAssessmentPage from '../damageAssessments/DamageAssessmentPage';
import RecoveryActionsPage from '../recoveryActions/RecoveryActionsPage';

// Tabbed shell matching the Settings/Evacuation pattern.
const TABS = [
  { key: 'damage', label: 'Damage Assessment', Component: DamageAssessmentPage },
  { key: 'recovery', label: 'Recovery Actions', Component: RecoveryActionsPage },
];

export default function RecoveryPage() {
  const [activeTab, setActiveTab] = useState('damage');
  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.Component;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-sm font-medium px-4 py-2 rounded-lg border ${
              activeTab === tab.key ? 'bg-brand-700 text-white border-brand-700' : 'bg-surface text-slate-600 border-slate-300 hover:bg-slate-50'
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
