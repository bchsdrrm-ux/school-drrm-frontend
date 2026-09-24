import React, { useState } from 'react';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { api } from '../lib/apiClient';
import { useFeedback } from '../components/Toast';

function PasswordInput({ label, value, onChange, autoComplete, hint }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export default function ChangePasswordModal({ onClose }) {
  const { toast } = useFeedback();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 8) return setError('New password must be at least 8 characters.');
    if (form.newPassword !== form.confirm) return setError('New password and confirmation do not match.');

    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password updated.');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Change password" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput label="Current password" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" />
        <PasswordInput
          label="New password"
          value={form.newPassword}
          onChange={set('newPassword')}
          autoComplete="new-password"
          hint="At least 8 characters. A longer passphrase is stronger."
        />
        <PasswordInput label="Confirm new password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />

        {error && (
          <div className="text-sm text-risk-critical bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Update password'}</Button>
        </div>
      </form>
    </Modal>
  );
}
