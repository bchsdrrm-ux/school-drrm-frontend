import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useFeedback } from './Toast';

const CHECK_EVERY_MS = 60 * 60 * 1000;

// Tells the user when a new version is ready instead of reloading by itself:
// a surprise reload could interrupt an emergency headcount or a half-filled form.
export default function PwaUpdatePrompt() {
  const { toast } = useFeedback();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Long-lived tabs and installed apps should still notice new versions.
      if (registration) setInterval(() => registration.update().catch(() => {}), CHECK_EVERY_MS);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast.info('Ready for offline use: the emergency information page will open without a connection.');
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady, toast]);

  if (!needRefresh) return null;
  return (
    <div role="status" className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-[75] flex max-w-sm items-center gap-3 rounded-xl border border-slate-200 bg-surface px-4 py-3 text-sm shadow-lg">
      <span className="text-slate-700">A new version is available.</span>
      <button onClick={() => updateServiceWorker(true)} className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-800">Refresh</button>
      <button onClick={() => setNeedRefresh(false)} className="text-xs font-medium text-slate-500 hover:text-slate-800">Later</button>
    </div>
  );
}
