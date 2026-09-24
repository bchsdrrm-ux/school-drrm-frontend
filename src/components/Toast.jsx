import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import useScrollLock from '../lib/useScrollLock';

const FeedbackContext = createContext(null);

const TOAST_STYLES = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-slate-200 bg-surface text-slate-800',
};

/**
 * Provides toast notifications and a promise-based confirm dialog:
 *   const { toast, confirm } = useFeedback();
 *   toast.success('Saved');
 *   if (await confirm({ title, message, confirmLabel, danger })) { ... }
 */
export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const nextId = useRef(1);
  useScrollLock(!!dialog);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((type, message) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => dismiss(id), type === 'error' ? 7000 : 4000);
  }, [dismiss]);

  const toast = useRef({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }).current;

  const confirm = useCallback((options) => new Promise((resolve) => setDialog({ ...options, resolve })), []);

  const settle = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  useEffect(() => {
    if (!dialog) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { dialog.resolve(false); setDialog(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog]);

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[60] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${TOAST_STYLES[t.type]}`}>
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100 leading-none" aria-label="Dismiss">✕</button>
          </div>
        ))}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 pb-[env(safe-area-inset-bottom)]" onClick={() => settle(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="text-base font-semibold text-slate-900">{dialog.title || 'Are you sure?'}</h2>
            {dialog.message && <p className="mt-2 text-sm text-slate-600">{dialog.message}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => settle(false)}
                className="rounded-lg border border-slate-300 bg-surface px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {dialog.cancelLabel || 'Cancel'}
              </button>
              <button
                autoFocus
                onClick={() => settle(true)}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${dialog.danger ? 'bg-risk-critical hover:bg-red-700' : 'bg-brand-700 hover:bg-brand-800'}`}
              >
                {dialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider');
  return ctx;
}
