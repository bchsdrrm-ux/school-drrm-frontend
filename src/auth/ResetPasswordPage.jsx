import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from './AuthShell';
import { api } from '../lib/apiClient';

function PasswordField({ id, label, value, onChange, hint }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          autoComplete="new-password"
          value={value}
          onChange={onChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
        />
        <button type="button" onClick={() => setVisible((v) => !v)} className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-slate-800">
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function ResetPasswordPage() {
  // The token arrives in the URL fragment (#token=...), so it is never sent to a server or leaked in a
  // Referer header. Read it once, then remove it from the address bar and browser history.
  const [token] = useState(() => new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [linkProblem, setLinkProblem] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.title = 'Choose a new password | BCHS DRRM';
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Your new password must be at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setDone(true);
    } catch (err) {
      const message = err.message || 'Something went wrong. Please try again.';
      setError(message);
      if (/invalid or has expired|invalid/i.test(message)) setLinkProblem(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You can now sign in with your new password">
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
          Your password has been changed. Any lock on your account has been cleared.
        </div>
        <Link to="/login" className="mt-4 block w-full rounded-lg bg-brand-700 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-800">Go to sign in</Link>
      </AuthShell>
    );
  }

  if (!token || linkProblem) {
    return (
      <AuthShell title="This link can't be used" subtitle="It may have expired, or already been used">
        <div role="alert" className="rounded-xl border border-slate-200 bg-surface p-5 text-sm text-slate-700 shadow-sm">
          Reset links work for 60 minutes and only once, and only the newest link works. Please request a new one.
        </div>
        <Link to="/forgot-password" className="mt-4 block w-full rounded-lg bg-brand-700 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-800">Request a new link</Link>
        <p className="mt-3 text-center text-sm"><Link to="/login" className="font-medium text-brand-700 hover:underline">Back to sign in</Link></p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something long that only you would know">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-surface p-6 shadow-sm">
        <PasswordField id="new-password" label="New password" value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 8 characters. A longer passphrase is stronger." />
        <PasswordField id="confirm-password" label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

        {error && (
          <div role="alert" className="text-sm text-risk-critical bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          {loading ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </AuthShell>
  );
}
