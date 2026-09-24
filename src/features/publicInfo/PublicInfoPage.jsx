import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import Logo from '../../components/Logo';
import Icon from '../../components/icons';
import AlertsCard from '../../components/AlertsCard';
import ThemeToggle from '../../components/ThemeToggle';
import AssemblyAreas from './AssemblyAreas';
import { useInstallPrompt } from '../../lib/install';
import { GUIDES, NATIONAL_HOTLINES, PARENT_GUIDE } from './guides';

const REFRESH_MS = 30000;

const telHref = (n) => `tel:${String(n).replace(/[^\d+]/g, '')}`;

// Live data is at most ~45s old (server cache 15s + our 30s poll). Anything older
// than this came from the offline cache and must not be presented as the current status.
const STALE_AFTER_MS = 2 * 60 * 1000;

function useLiveInfo() {
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

// Open every guide when printing so the printout is a complete poster.
function usePrintOpensAll() {
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const before = () => setPrinting(true);
    const after = () => setPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); };
  }, []);
  return printing;
}

function formatSaved(iso) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return d.toDateString() === new Date().toDateString() ? time : `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`;
}

function StatusBanner({ status, data, updatedAt, stale }) {
  if (status === 'loading') {
    return (
      <div role="status" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-surface px-4 py-3 text-slate-700">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" aria-hidden="true" />
        <span className="text-sm">Checking the school's live status…</span>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
        <Icon name="hazard" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="text-sm">
          <div className="font-semibold">Live status is unavailable right now</div>
          <div className="text-amber-800">This does not mean there is no emergency. In an emergency, call 911 and follow your teachers' instructions. The guides below still work.</div>
        </div>
      </div>
    );
  }

  const active = data.emergency?.active;
  const saved = formatSaved(data.generatedAt);

  // A saved copy (offline or a failing connection) is never shown as the current status.
  if (stale && active) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-900">
        <Icon name="siren" className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
        <div className="text-sm">
          <div className="text-base font-semibold">An emergency was in progress: {data.emergency.alertType}</div>
          <div className="text-red-800">
            This is a saved copy from {saved} and may be out of date. Follow your teachers' instructions and call 911 if you are in danger.
          </div>
        </div>
      </div>
    );
  }
  if (stale) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
        <Icon name="hazard" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="text-sm">
          <div className="font-semibold">Showing information saved at {saved}</div>
          <div className="text-amber-800">You appear to be offline, so the current status can't be confirmed. This does not mean there is no emergency. If you are in danger, call 911. The guides below work offline.</div>
        </div>
      </div>
    );
  }
  if (active) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-900">
        <Icon name="siren" className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
        <div className="text-sm">
          <div className="text-base font-semibold">Emergency in progress: {data.emergency.alertType}</div>
          <div className="text-red-800">
            Started {new Date(data.emergency.since).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}. Follow the instructions of teachers and the DRRM team. Parents and guardians: please wait for official announcements before coming to school.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-green-900">
      <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
      <div className="text-sm">
        <div className="font-semibold">No active emergency reported</div>
        <div className="text-green-800">
          Checked {updatedAt?.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}. This page updates automatically.
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon, children, className = '' }) {
  return (
    <section className={`break-inside-avoid rounded-xl border border-slate-200 bg-surface p-5 ${className}`}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        {icon && <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon name={icon} className="h-4 w-4" /></span>}
        {title}
      </h2>
      {children}
    </section>
  );
}

function CallLink({ number, className = '' }) {
  return (
    <a href={telHref(number)} className={`font-semibold text-brand-700 hover:underline ${className}`}>{number}</a>
  );
}

function Skeleton() {
  return <div className="space-y-2" aria-hidden="true"><div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" /><div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" /></div>;
}

function Guide({ guide, open }) {
  return (
    <details open={open || undefined} className="group rounded-xl border border-slate-200 bg-surface [&_summary::-webkit-details-marker]:hidden print:break-inside-avoid">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{guide.title}</h3>
          <p className="text-xs text-slate-500">{guide.summary}</p>
        </div>
        <Icon name="arrow" className="h-4 w-4 shrink-0 rotate-90 text-slate-400 transition-transform group-open:-rotate-90 print:hidden" />
      </summary>
      <div className="space-y-4 border-t border-slate-100 px-5 py-4">
        {guide.sections.map((s) => (
          <div key={s.heading}>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{s.heading}</h4>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
              {s.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function PublicInfoPage() {
  const live = useLiveInfo();
  const printing = usePrintOpensAll();
  const { canInstall, showIosHint, install } = useInstallPrompt();
  const { status, data } = live;

  useEffect(() => { document.title = 'Emergency information | BCHS DRRM'; }, []);

  const contacts = data?.contacts || [];
  const areas = data?.evacuationAreas || [];

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-surface pt-[env(safe-area-inset-top)] print:border-0">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div className="whitespace-nowrap leading-tight">
              <div className="text-sm font-semibold text-slate-900">BCHS DRRM</div>
              <div className="text-xs text-slate-500">Emergency information</div>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <ThemeToggle />
            {canInstall && (
              <button onClick={install} className="rounded-lg border border-slate-300 bg-surface px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Install app
              </button>
            )}
            <button onClick={() => window.print()} className="hidden rounded-lg border sm:inline-flex border-slate-300 bg-surface px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Print
            </button>
            <Link to="/login" className="whitespace-nowrap rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800"><span className="sm:hidden">Sign in</span><span className="hidden sm:inline">Staff sign in</span></Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Know what to do before it happens</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Emergency numbers, assembly areas and simple step-by-step guides for learners, staff, parents and guardians. Always follow the instructions of your teachers and the school's DRRM team.
          </p>
        </div>

        <StatusBanner {...live} />

        <AlertsCard />

        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Emergency numbers" icon="phone">
            <ul className="divide-y divide-slate-100">
              {NATIONAL_HOTLINES.map((h) => (
                <li key={h.number} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{h.name}</div>
                    <div className="text-xs text-slate-500">{h.note}</div>
                  </div>
                  <CallLink number={h.number} className="text-2xl" />
                </li>
              ))}
            </ul>

            <h3 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">School and local contacts</h3>
            {status === 'loading' && <Skeleton />}
            {status === 'error' && <p className="text-sm text-slate-500">Could not load local contacts.</p>}
            {status === 'ready' && contacts.length === 0 && (
              <p className="text-sm text-slate-500">The school has not published local contacts yet.</p>
            )}
            {contacts.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {contacts.map((c) => (
                  <li key={`${c.organization}-${c.contact_number}`} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800">{c.organization}</div>
                      <div className="text-xs text-slate-500">
                        {[c.contact_person, c.position].filter(Boolean).join(', ')}
                        {c.availability && <span>{c.contact_person || c.position ? ' · ' : ''}{c.availability}</span>}
                      </div>
                      {c.address && <div className="text-xs text-slate-500">{c.address}</div>}
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      <CallLink number={c.contact_number} />
                      {c.alt_number && <div><CallLink number={c.alt_number} className="text-xs font-medium" /></div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Assembly areas" icon="exit">
            <AssemblyAreas status={status} areas={areas} online={live.online} />
          </Card>
        </div>

        <section aria-labelledby="guides-heading">
          <h2 id="guides-heading" className="mb-3 text-lg font-semibold text-slate-900">What to do</h2>
          <div className="space-y-3">
            {GUIDES.map((g, i) => <Guide key={g.id} guide={g} open={printing || i === 0} />)}
          </div>
        </section>

        <Card title={PARENT_GUIDE.title} icon="team">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
            {PARENT_GUIDE.steps.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </Card>

        {showIosHint && (
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 print:hidden">
            Keep this page on your phone: tap the Share button in Safari, then "Add to Home Screen". It will open even without a signal.
          </p>
        )}

        <footer className="pb-[max(1.5rem,env(safe-area-inset-bottom))] text-xs text-slate-500">
          General guidance only. Your school's own DRRM plan and the instructions given by teachers and the DRRM team come first.
        </footer>
      </main>
    </div>
  );
}
