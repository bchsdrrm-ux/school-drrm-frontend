import { useCallback, useEffect, useState } from 'react';
import { api } from './apiClient';

// Statuses:
//   checking     still working out what this device supports
//   unavailable  the school has not switched phone alerts on (hide the UI)
//   unsupported  this browser/device cannot receive them
//   denied       the user blocked notifications for this site
//   available    can be turned on
//   subscribed   on for this device
//   busy         enabling/disabling in progress

const browserSupportsPush = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function currentRegistration() {
  // getRegistration() resolves to undefined when there is no service worker
  // (e.g. the dev server), whereas .ready would wait forever.
  return navigator.serviceWorker.getRegistration();
}

async function detectStatus() {
  if (!browserSupportsPush()) return { status: 'unsupported' };
  const key = await api.get('/public/push/key').catch(() => null);
  if (!key?.enabled) return { status: 'unavailable' };
  if (Notification.permission === 'denied') return { status: 'denied', publicKey: key.publicKey };
  const reg = await currentRegistration();
  if (!reg) return { status: 'unsupported' };
  const sub = await reg.pushManager.getSubscription();
  return { status: sub ? 'subscribed' : 'available', publicKey: key.publicKey };
}

export function usePushAlerts() {
  const [state, setState] = useState({ status: 'checking', publicKey: null });
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    detectStatus().then(setState).catch(() => setState({ status: 'unavailable', publicKey: null }));
  }, []);
  useEffect(refresh, [refresh]);

  const enable = useCallback(async () => {
    setError('');
    const previous = state.status;
    setState((s) => ({ ...s, status: 'busy' }));
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState((s) => ({ ...s, status: permission === 'denied' ? 'denied' : previous }));
        return;
      }
      const reg = await currentRegistration();
      if (!reg) throw new Error('Alerts need the app to finish loading. Reload the page and try again.');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(state.publicKey),
      });
      try {
        await api.post('/public/push/subscribe', sub.toJSON());
      } catch (err) {
        // Don't leave a browser subscription the server doesn't know about.
        await sub.unsubscribe().catch(() => {});
        throw err;
      }
      await reg.showNotification('Emergency alerts are on', {
        body: "You'll be notified when the school starts an emergency and when it is all clear.",
        icon: '/pwa-192.png',
        tag: 'drrm-alerts-enabled',
      });
      setState((s) => ({ ...s, status: 'subscribed' }));
    } catch (err) {
      setError(err.message || 'Could not turn on alerts.');
      setState((s) => ({ ...s, status: previous === 'busy' ? 'available' : previous }));
    }
  }, [state.publicKey, state.status]);

  const disable = useCallback(async () => {
    setError('');
    setState((s) => ({ ...s, status: 'busy' }));
    try {
      const reg = await currentRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await api.post('/public/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => {});
        await sub.unsubscribe();
      }
      setState((s) => ({ ...s, status: 'available' }));
    } catch (err) {
      setError(err.message || 'Could not turn off alerts.');
      setState((s) => ({ ...s, status: 'subscribed' }));
    }
  }, []);

  return { status: state.status, error, enable, disable };
}
