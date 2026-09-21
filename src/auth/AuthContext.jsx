import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../lib/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('drrm_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email, password) => {
    const result = await api.post('/auth/login', { email, password });
    localStorage.setItem('drrm_access_token', result.accessToken);
    localStorage.setItem('drrm_refresh_token', result.refreshToken);
    localStorage.setItem('drrm_user', JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('drrm_access_token');
    localStorage.removeItem('drrm_refresh_token');
    localStorage.removeItem('drrm_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Role groups mirrored from the backend's middleware/rbac.js ROLE_GROUPS so
// the UI can hide/disable actions the API would reject anyway. The API is
// still the real enforcement point — this is just for a cleaner UX.
export const ROLE_GROUPS = {
  ALL_STAFF: [
    'system_admin', 'school_head', 'drrm_coordinator',
    'drrm_team_member', 'teacher_employee', 'security_utility',
  ],
  DRRM_MANAGERS: ['system_admin', 'school_head', 'drrm_coordinator'],
  DRRM_OPERATIONAL: ['system_admin', 'drrm_coordinator', 'drrm_team_member'],
  ADMIN_ONLY: ['system_admin'],
};

export function hasRole(user, allowedRoles) {
  return !!user && allowedRoles.includes(user.role);
}
