import { useEffect, useState } from 'react';
import { api } from './apiClient';

const REFRESH_MS = 30000;

// Live data is at most ~45s old (server cache 15s + our 30s poll). Anything older
// than this came from the offline cache and must not be presented as the current status.
const STALE_AFTER_MS = 2 * 60 * 1000;

/** Polls the public status endpoint. `stale` is true whenever the data can't be called current. */
export function useLiveInfo() {
  const [state, setState] = useState({ status: 'loading', data: null, updatedAt: null, failed: false });
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [, tick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api.get('/public/info')
        .then((data) => { if (!cancelled) setState({ status: 'ready', data, updatedAt: new Date(), failed: false }); })
        // Keep the last data if a refresh fails, but remember that it failed so we don't call it live.
        .catch(() => { if (!cancelled) setState((s) => (s.data ? { ...s, failed: true } : { status: 'error', data: null, updatedAt: null, failed: true })); });
    };
    const goOnline = () => { setOnline(true); load(); };
    const goOffline = () => setOnline(false);
    load();
    const poll = setInterval(load, REFRESH_MS);
    const clock = setInterval(() => tick((n) => n + 1), 15000); // re-evaluate staleness even when nothing else changes
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(clock);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const stale = state.status === 'ready' && (!online || state.failed || Date.now() - new Date(state.data.generatedAt).getTime() > STALE_AFTER_MS);
  return { ...state, online, stale };
}
