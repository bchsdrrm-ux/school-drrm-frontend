import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveInfo } from '../../lib/useLiveInfo';
import BrandBackdrop from '../../components/BrandBackdrop';
import PartnerLogos, { GovBar } from '../../components/PartnerLogos';
import { SCHOOL } from '../../lib/school';
import Logo from '../../components/Logo';
import Icon from '../../components/icons';
import AlertsCard from '../../components/AlertsCard';
import ThemeToggle from '../../components/ThemeToggle';
import AssemblyAreas from './AssemblyAreas';
import { useInstallPrompt } from '../../lib/install';
import { GUIDES, NATIONAL_HOTLINES, PARENT_GUIDE } from './guides';

const telHref = (n) => `tel:${String(n).replace(/[^\d+]/g, '')}`;

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
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white print:bg-none print:text-slate-900">
        <BrandBackdrop className="print:hidden" />
        <GovBar />
        <div className="hidden items-center gap-3 border-b border-slate-300 px-4 py-3 print:flex">
          <img src="/brand/deped-seal.png" alt="" width="48" height="48" className="h-12 w-12" />
          <div className="leading-tight text-slate-900">
            <div className="text-xs">Republic of the Philippines</div>
            <div className="text-sm font-bold">Department of Education</div>
            <div className="text-xs font-semibold">{SCHOOL.name}</div>
          </div>
        </div>
        <header className="relative mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 rounded-lg" aria-label="BCHS DRRM home">
            <Logo size={38} />
            <div className="whitespace-nowrap leading-tight">
              <div className="text-sm font-semibold">BCHS DRRM</div>
              <div className="text-xs text-blue-100 print:text-slate-600">Emergency information</div>
            </div>
          </Link>
          <div className="flex items-center gap-2 print:hidden">
            <ThemeToggle />
            {canInstall && (
              <button onClick={install} className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20">
                Install app
              </button>
            )}
            <button onClick={() => window.print()} className="hidden rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 sm:inline-flex">
              Print
            </button>
            <Link to="/login" className="whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-[#1e40af] shadow-sm hover:bg-white/90"><span className="sm:hidden">Sign in</span><span className="hidden sm:inline">Staff sign in</span></Link>
          </div>
        </header>

        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50 print:hidden">
            <Icon name="shield" className="h-3.5 w-3.5" /> For learners, staff, parents and guardians
          </p>
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">Know what to do before it happens</h1>
          <p className="mt-3 max-w-2xl text-sm text-blue-100 sm:text-base print:text-slate-700">
            Emergency numbers, assembly areas and simple step-by-step guides. Always follow the instructions of your teachers and the school's DRRM team.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
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

        <footer className="flex flex-col gap-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl">General guidance only. Your school's own DRRM plan and the instructions given by teachers and the DRRM team come first.</p>
          <PartnerLogos compact className="self-start" />
        </footer>
      </main>
    </div>
  );
}
