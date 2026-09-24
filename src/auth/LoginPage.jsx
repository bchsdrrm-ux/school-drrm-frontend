import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Logo from '../components/Logo';

const FEATURES = [
  'Hazard inventory and risk assessment',
  'Drills, inspections and training records',
  'Incident reporting and live Emergency Mode',
  'Headcount, damage assessment and recovery',
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex lg:w-[46%] flex-col justify-between bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-12 text-white">
        <div className="flex items-center gap-3">
          <Logo size={44} />
          <div className="leading-tight">
            <div className="text-lg font-semibold">BCHS DRRM</div>
            <div className="text-sm text-blue-100">Management System</div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-semibold leading-tight">Prepared schools are safer schools.</h2>
          <p className="mt-3 max-w-md text-blue-100">
            One place to plan, drill, respond and recover: built around the school's Disaster Risk Reduction and Management program.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs" aria-hidden="true">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-blue-200">Authorized school personnel only.</p>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={40} />
            <div className="leading-tight">
              <div className="text-base font-semibold text-slate-900">BCHS DRRM</div>
              <div className="text-xs text-slate-500">Management System</div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-1 mb-6 text-sm text-slate-500">Sign in to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
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

          <p className="mt-4 text-center text-xs text-slate-500">
            Forgot your password? Ask your school's system administrator to reset it.
          </p>
        </div>
      </main>
    </div>
  );
}
