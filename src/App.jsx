import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequireAuth from './auth/RequireAuth';
import LoginPage from './auth/LoginPage';
import AppShell from './layouts/AppShell';
import PlaceholderPage from './components/PlaceholderPage';
import PublicInfoPage from './features/publicInfo/PublicInfoPage';

import DashboardPage from './features/dashboard/DashboardPage';
import HazardsPage from './features/hazards/HazardsPage';
import EmergencyContactsPage from './features/emergencyContacts/EmergencyContactsPage';
import EvacuationPage from './features/evacuation/EvacuationPage';
import EquipmentPage from './features/equipment/EquipmentPage';
import IncidentsPage from './features/incidents/IncidentsPage';
import ReportsPage from './features/reports/ReportsPage';
import DocumentsPage from './features/documents/DocumentsPage';
import SettingsPage from './features/settings/SettingsPage';
import HazardMapPage from './features/hazardMap/HazardMapPage';
import DrrmTeamsPage from './features/drrmTeams/DrrmTeamsPage';
import DrillsPage from './features/drills/DrillsPage';
import InspectionsPage from './features/inspections/InspectionsPage';
import TrainingPage from './features/training/TrainingPage';
import EmergencyModePage from './features/emergencyMode/EmergencyModePage';
import AccountabilityPage from './features/accountability/AccountabilityPage';
import RecoveryPage from './features/recovery/RecoveryPage';
import ActionPlanPage from './features/actionPlans/ActionPlanPage';
import EmergencyPlansPage from './features/emergencyPlans/EmergencyPlansPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/info" element={<PublicInfoPage />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        {/* --- Phase 1: fully implemented --- */}
        <Route index element={<DashboardPage />} />
        <Route path="/hazards" element={<HazardsPage />} />
        <Route path="/emergency-contacts" element={<EmergencyContactsPage />} />
        <Route path="/evacuation" element={<EvacuationPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/hazard-map" element={<HazardMapPage />} />
        <Route path="/drrm-teams" element={<DrrmTeamsPage />} />
        <Route path="/drills" element={<DrillsPage />} />
        <Route path="/inspections" element={<InspectionsPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/emergency-mode" element={<EmergencyModePage />} />
        <Route path="/accountability" element={<AccountabilityPage />} />
        <Route path="/recovery" element={<RecoveryPage />} />

        {/* --- Later phases: routed so the nav has no dead links, --- */}
        {/* --- replace each with a real page as that module is built --- */}
        <Route path="/emergency-plans" element={<EmergencyPlansPage />} />
        <Route path="/action-plan" element={<ActionPlanPage />} />

        <Route path="*" element={<PlaceholderPage title="Page not found" />} />
      </Route>
    </Routes>
  );
}
