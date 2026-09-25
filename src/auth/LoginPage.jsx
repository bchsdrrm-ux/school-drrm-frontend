import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import AuthShell from './AuthShell';
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
    <AuthShell title="Welcome back" subtitle="Sign in to continue">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-surface p-6 shadow-sm">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
            placeholder="you@your-school.edu.ph"
          />
        </div>
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
            {canReset && <Link to="/forgot-password" className="text-xs font-medium text-brand-700 hover:underline">Forgot password?</Link>}
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="text-sm text-risk-critical bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {!canReset && (
        <p className="mt-4 text-center text-xs text-slate-500">
          Forgot your password? Ask your school's system administrator to reset it.
        </p>
      )}
      <p className="mt-3 text-center text-sm">
        <Link to="/info" className="font-medium text-brand-700 hover:underline">Emergency information for everyone</Link>
      </p>
    </AuthShell>
  );
}
