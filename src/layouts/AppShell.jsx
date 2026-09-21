import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationsBell from './NotificationsBell';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/apiClient';

/**
 * Persistent shell: Sidebar (full IA) + top bar with the Emergency Mode /
 * Panic Button (spec Section 25 — must be reachable in minimal clicks from
 * anywhere in the app, so it lives in the shell, not a page).
 *
 * The button also reflects LIVE activation status from anywhere in the
 * app (polled every 20s) — so if a coordinator activates Emergency Mode
 * while a teacher is looking at, say, the Hazard Inventory page, that
 * teacher sees the alert without needing to already be on the Emergency
 * Mode page. This is what "minimal clicks" from the spec actually requires
 * in practice: the alert has to reach people who weren't already looking.
 *
 * Below the `md` breakpoint, the sidebar becomes an off-canvas drawer
 * (see Sidebar.jsx) controlled by `sidebarOpen` here, toggled by the
 * hamburger button that only renders on that same breakpoint.
 */
export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkActive = () => {
      api.get('/emergency-mode/active').then((a) => setIsActive(!!a)).catch(() => {});
    };
    checkActive();
    const interval = setInterval(checkActive, 20000);
    return () => clearInterval(interval);
  }, [location.pathname]); // also re-check on navigation, so returning from the Emergency Mode page updates it immediately

  // Safety net: if the sidebar was left open and navigation happens some
  // other way than tapping a NavLink (e.g. a redirect), close it anyway.
  useEffect(() => setSidebarOpen(false), [location.pathname]);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden shrink-0 p-2 -ml-1 rounded-lg hover:bg-slate-100 text-slate-600"
              aria-label="Open menu"
            >
              ☰
            </button>

            <Link
              to="/emergency-mode"
              className={`inline-flex items-center gap-1.5 sm:gap-2 text-white text-xs sm:text-sm font-semibold px-2.5 sm:px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                isActive ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-risk-critical hover:bg-red-700'
              }`}
            >
              🚨 <span className="hidden sm:inline">{isActive ? 'EMERGENCY ACTIVE — Open Console' : 'Emergency Mode'}</span>
              <span className="sm:hidden">{isActive ? 'ACTIVE' : 'Emergency'}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-sm shrink-0">
            <NotificationsBell />
            <div className="text-right leading-tight hidden sm:block">
              <div className="font-medium text-slate-900">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role?.replaceAll('_', ' ')}</div>
            </div>
            <button
              onClick={logout}
              className="text-slate-500 hover:text-slate-800 text-sm font-medium"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
