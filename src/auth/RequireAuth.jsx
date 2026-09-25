import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, hasRole } from './AuthContext';

/**
 * Wrap a route element: redirects to /login if not authenticated, or
 * (optionally) blocks by role. Usage:
 *   <RequireAuth><DashboardPage /></RequireAuth>
 *   <RequireAuth roles={ROLE_GROUPS.ADMIN_ONLY}><UsersPage /></RequireAuth>
 * `publicHome`: shown instead of the redirect when a signed-out visitor is at '/'.
 */
export default function RequireAuth({ children, roles, publicHome }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Signed-out visitors to the home address get the public landing page instead of a bare sign-in redirect.
    if (publicHome && location.pathname === '/') return publicHome;
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && !hasRole(user, roles)) {
    return (
      <div className="p-8 text-center text-slate-600">
        You don't have permission to view this page.
      </div>
    );
  }
  return children;
}
