import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import AuthShell from './AuthShell';
import AuthField from './AuthField';
import { api } from '../lib/apiClient';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [canReset, setCanReset] = useState(false);

  // The "Forgot password" link only appears once the school has switched on password-reset emails.
  useEffect(() => {
    api.get('/auth/reset-available').then((r) => setCanReset(!!r?.available)).catch(() => setCanReset(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to the DRRM management system">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="email"
          label="Email"
          icon="mail"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@your-school.edu.ph"
        />
        <AuthField
          id="password"
          label="Password"
          icon="lock"
          revealable
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          labelSlot={canReset && <Link to="/forgot-password" className="text-xs font-medium text-brand-700 hover:underline">Forgot password?</Link>}
        />

        {error && (
          <div role="alert" className="text-sm text-risk-critical bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-brand">
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {!canReset && (
        <p className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          Forgot your password? Ask your school's system administrator to reset it.
        </p>
      )}
    </AuthShell>
  );
}
