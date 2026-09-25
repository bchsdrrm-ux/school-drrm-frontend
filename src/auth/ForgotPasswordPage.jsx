import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from './AuthShell';
import AuthField from './AuthField';
import { api } from '../lib/apiClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [available, setAvailable] = useState(null); // null = still checking
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Forgot password | BCHS DRRM';
    api.get('/auth/reset-available').then((r) => setAvailable(!!r?.available)).catch(() => setAvailable(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSentTo(email.trim());
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <AuthShell title="Check your email" subtitle="Your reset link is on its way">
        <div className="space-y-4" role="status">
          <p className="text-sm text-slate-700">
            If an account exists for <span className="font-medium text-slate-900">{sentTo}</span>, we've sent a link to choose a new password. It works for 60 minutes and can be used once.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>It can take a minute or two to arrive.</li>
            <li>Check your spam or junk folder.</li>
            <li>Only the newest link works.</li>
          </ul>
          <button onClick={() => { setSentTo(''); }} className="text-sm font-medium text-brand-700 hover:underline">Use a different email</button>
        </div>
        <p className="mt-5 text-center text-sm"><Link to="/login" className="font-medium text-brand-700 hover:underline">Back to sign in</Link></p>
      </AuthShell>
    );
  }

  if (available === false) {
    return (
      <AuthShell title="Forgot your password?" subtitle="Reset by email isn't switched on yet">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Please ask your school's system administrator to reset your password for you.
        </div>
        <p className="mt-5 text-center text-sm"><Link to="/login" className="font-medium text-brand-700 hover:underline">Back to sign in</Link></p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your account email and we'll send you a reset link">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="email"
          label="Email"
          icon="mail"
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@your-school.edu.ph"
        />

        {error && (
          <div role="alert" className="text-sm text-risk-critical bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <button type="submit" disabled={loading || available === null} className="btn-brand">
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm"><Link to="/login" className="font-medium text-brand-700 hover:underline">Back to sign in</Link></p>
    </AuthShell>
  );
}
