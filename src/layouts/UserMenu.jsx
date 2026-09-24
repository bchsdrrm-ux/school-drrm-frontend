import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import ChangePasswordModal from '../auth/ChangePasswordModal';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || '?';
  const role = user?.role?.replaceAll('_', ' ');

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">{initials}</span>
        <span className="hidden sm:block text-left leading-tight">
          <span className="block text-sm font-medium text-slate-900">{user?.firstName} {user?.lastName}</span>
          <span className="block text-xs text-slate-500 capitalize">{role}</span>
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden sm:block h-4 w-4 text-slate-400" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-30">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="text-sm font-medium text-slate-900">{user?.firstName} {user?.lastName}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            <div className="text-xs text-slate-500 capitalize">{role}</div>
          </div>
          <button
            role="menuitem"
            onClick={() => { setOpen(false); setShowPassword(true); }}
            className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            Change password
          </button>
          <button
            role="menuitem"
            onClick={logout}
            className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      )}

      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
    </div>
  );
}
