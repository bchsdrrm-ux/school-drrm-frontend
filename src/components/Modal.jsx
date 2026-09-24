import React, { useEffect, useId, useRef } from 'react';
import useScrollLock from '../lib/useScrollLock';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog: a bottom sheet on phones, a centered card from `sm` up.
 * Escape closes it, Tab stays inside it, the page behind does not scroll,
 * and focus returns to whatever opened it.
 */
export default function Modal({ title, onClose, children, wide = false }) {
  const titleId = useId();
  const panelRef = useRef(null);
  useScrollLock(true);

  useEffect(() => {
    const opener = document.activeElement;
    const panel = panelRef.current;
    // Focus the first field (not the close button) so the keyboard opens on the form.
    const first = panel?.querySelector('input, select, textarea') || panel?.querySelector(FOCUSABLE);
    first?.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // No tap-outside-to-close: a stray tap must not discard a half-filled form.
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full overflow-y-auto overscroll-contain bg-surface shadow-lg rounded-t-2xl sm:rounded-xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[92dvh] sm:max-h-[90dvh] pb-[env(safe-area-inset-bottom)]`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-surface px-5 py-4">
          <h2 id={titleId} className="text-sm font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="px-1 text-lg leading-none text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
