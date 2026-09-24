import { useCallback, useEffect, useState } from 'react';

// Preference is what the user picked ('system' follows the phone or computer);
// resolved is what is actually applied ('light' or 'dark').
const STORAGE_KEY = 'drrm_theme';
const META_COLORS = { light: '#1d4ed8', dark: '#0b1120' };

const listeners = new Set();
let printRestore = null;

function readPreference() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const resolve = (pref) => (pref === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : pref);

function apply(pref) {
  const resolved = resolve(pref);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  // Address bar / status bar color on phones.
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', META_COLORS[resolved]));
  listeners.forEach((fn) => fn());
  return resolved;
}

export function setThemePreference(pref) {
  try {
    if (pref === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch { /* storage unavailable: the choice lasts until reload */ }
  apply(pref);
}

// Follow the system setting live while the preference is "system".
if (typeof window !== 'undefined') {
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (readPreference() === 'system') apply('system');
  });
  // Printing is always on white paper, so drop the dark theme just for the printout.
  window.addEventListener('beforeprint', () => {
    printRestore = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
  });
  window.addEventListener('afterprint', () => {
    if (printRestore) document.documentElement.classList.add('dark');
    printRestore = null;
  });
  // The inline script in index.html already set the class before first paint; sync meta colors.
  apply(readPreference());
}

export function useTheme() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  const preference = readPreference();
  const set = useCallback((p) => setThemePreference(p), []);
  return { preference, resolved: resolve(preference), setPreference: set };
}
