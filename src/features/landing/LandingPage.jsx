import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../components/Logo';
import Icon from '../../components/icons';
import ThemeToggle from '../../components/ThemeToggle';
import BrandBackdrop from '../../components/BrandBackdrop';
import PartnerLogos, { GovBar } from '../../components/PartnerLogos';
import { SCHOOL } from '../../lib/school';
import { useLiveInfo } from '../../lib/useLiveInfo';
import { useInstallPrompt } from '../../lib/install';
import { NATIONAL_HOTLINES } from '../publicInfo/guides';

const telHref = (n) => `tel:${String(n).replace(/[^\d+]/g, '')}`;

// The four thematic areas of Philippine DRRM, and what this system does for each.
const AREAS = [
  { icon: 'shield', title: 'Prevention & Mitigation', text: 'Keep a register of campus hazards, rate their risk and track what is being done about them.' },
  { icon: 'training', title: 'Preparedness', text: 'Plan and record drills, inspections, training and emergency equipment so the school is ready.' },
  { icon: 'siren', title: 'Response', text: 'Start a live emergency, alert phones, run headcounts and log incidents as they happen.' },
  { icon: 'recovery', title: 'Recovery & Rehabilitation', text: 'Assess damage, follow recovery work and keep the records that come after an event.' },
];

const PUBLIC_POINTS = [
  'Emergency numbers, one tap to call',
  'Assembly areas on a map',
  'Step-by-step guides: earthquake, fire, flood and more',
  'Works offline once opened',
];
const STAFF_POINTS = [
  'Hazard register and campus map',
  'Drills, inspections and training records',
  'Emergency Mode with headcount',
  'Incident, damage and recovery reports',
];

/** Small live-status chip for the hero. Never presents a saved copy as the current status. */
function StatusChip({ status, data, stale }) {
  let tone = 'bg-slate-300';
  let text = 'Checking live status…';
  let alert = false;
  if (status === 'error') { tone = 'bg-amber-300'; text = 'Live status unavailable right now'; }
  else if (status === 'ready') {
    const active = data.emergency?.active;
    if (stale) { tone = 'bg-amber-300'; text = active ? 'An emergency was in progress (saved copy)' : 'Saved status, live check unavailable'; alert = !!active; }
    else if (active) { tone = 'bg-red-400'; text = `Emergency in progress: ${data.emergency.alertType}`; alert = true; }
    else { tone = 'bg-green-400'; text = 'No active emergency reported'; }
  }
  return (
    <Link
      to="/info"
      role={alert ? 'alert' : 'status'}
      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20 sm:text-sm ${alert ? 'border-red-300/60 bg-red-500/25' : 'border-white/25 bg-white/10'}`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
        {status === 'ready' && !stale && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${tone}`} />}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${tone}`} />
      </span>
      <span className="min-w-0 truncate">{text}</span>
      <Icon name="arrow" className="h-3.5 w-3.5 opacity-80" />
    </Link>
  );
}

function Checklist({ items }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Icon name="check" className="h-3.5 w-3.5" /></span>
          {i}
        </li>
      ))}
    </ul>
  );
}

export default function LandingPage() {
  const live = useLiveInfo();
  const { canInstall, install } = useInstallPrompt();

  useEffect(() => { document.title = 'BCHS DRRM | Disaster Risk Reduction and Management'; }, []);

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
        <BrandBackdrop />
        <GovBar />
        <header className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 rounded-lg" aria-label="BCHS DRRM home">
            <Logo size={40} />
            <div className="whitespace-nowrap leading-tight">
              <div className="text-base font-semibold">BCHS DRRM</div>
              <div className="text-xs text-blue-100">Management System</div>
            </div>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Main">
            <ThemeToggle />
            {canInstall && (
              <button onClick={install} className="hidden rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 sm:inline-flex">Install app</button>
            )}
            <Link to="/info" className="hidden rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 md:inline-flex">Emergency information</Link>
            <Link to="/login" className="whitespace-nowrap rounded-lg bg-white px-3.5 py-1.5 text-sm font-semibold text-[#1e40af] shadow-sm hover:bg-white/90">Staff sign in</Link>
          </nav>
        </header>

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-14 lg:grid-cols-[1.25fr_1fr] lg:gap-14 lg:pb-28">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-blue-100">{SCHOOL.name}</p>
            <StatusChip {...live} />
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">Prepared schools are safer schools.</h1>
            <p className="mt-5 max-w-xl text-base text-blue-100 sm:text-lg">
              The school's Disaster Risk Reduction and Management system: keeping learners, staff and families ready before, during and after an emergency.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/info" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#1e40af] shadow-lg shadow-brand-900/30 hover:bg-white/90">
                <Icon name="siren" className="h-4 w-4" /> Emergency information
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20">
                <Icon name="lock" className="h-4 w-4" /> Staff sign in
              </Link>
            </div>
          </div>

          {/* In an emergency */}
          <section aria-labelledby="sos-heading" className="rounded-2xl bg-surface p-5 text-slate-800 shadow-2xl shadow-brand-900/40 sm:p-6">
            <h2 id="sos-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600"><Icon name="phone" className="h-4 w-4" /></span>
              In an emergency, call
            </h2>
            <ul className="mt-4 space-y-3">
              {NATIONAL_HOTLINES.map((h) => (
                <li key={h.number}>
                  <a href={telHref(h.number)} className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:border-brand-600 hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900">{h.name}</span>
                      <span className="block text-xs text-slate-500">{h.note}</span>
                    </span>
                    <span className="text-3xl font-semibold tracking-tight text-brand-700">{h.number}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">Follow your teachers' instructions and move to your assembly area.</p>
          </section>
        </div>
      </div>

      <main>
        {/* Four DRRM areas */}
        <section className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:px-6" aria-labelledby="areas-heading">
          <div className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-xl shadow-slate-900/5 sm:p-8">
            <h2 id="areas-heading" className="text-xl font-semibold text-slate-900 sm:text-2xl">Built around the four DRRM thematic areas</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">Everything the school does to reduce risk, in one place.</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {AREAS.map((a, i) => (
                <li key={a.title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon name={a.icon} className="h-5 w-5" /></span>
                    <span className="text-xs font-semibold text-slate-400" aria-hidden="true">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">{a.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{a.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Who it is for */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="who-heading">
          <h2 id="who-heading" className="text-xl font-semibold text-slate-900 sm:text-2xl">Who is it for?</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <article className="flex flex-col rounded-2xl border border-slate-200 bg-surface p-6 sm:p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon name="team" className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Learners, parents and guardians</h3>
              <p className="mt-1 text-sm text-slate-600">No account needed. Know what to do and where to go.</p>
              <Checklist items={PUBLIC_POINTS} />
              <Link to="/info" className="btn-brand mt-6 !w-auto self-start">Open emergency information <Icon name="arrow" className="h-4 w-4" /></Link>
            </article>
            <article className="flex flex-col rounded-2xl border border-slate-200 bg-surface p-6 sm:p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon name="lock" className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Teachers, staff and the DRRM team</h3>
              <p className="mt-1 text-sm text-slate-600">Sign in to manage the program and lead the response.</p>
              <Checklist items={STAFF_POINTS} />
              <Link to="/login" className="mt-6 inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-surface px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Staff sign in <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </section>

        {/* Always ready */}
        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6" aria-labelledby="ready-heading">
          <h2 id="ready-heading" className="sr-only">Always ready</h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: 'bell', title: 'Alerts on your phone', text: 'Turn on notifications on the emergency page to be told when an alert starts or ends.' },
              { icon: 'wifioff', title: 'Works without signal', text: 'The guides and contacts stay available offline after the first visit.' },
              { icon: 'phone', title: 'Install it', text: 'Add it to your home screen and open it like any other app.' },
            ].map((f) => (
              <li key={f.title} className="flex gap-4 rounded-xl border border-slate-200 bg-surface p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon name={f.icon} className="h-5 w-5" /></span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-surface pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 text-sm text-slate-600 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Logo size={32} />
              <div className="leading-tight">
                <div className="font-semibold text-slate-900">BCHS DRRM</div>
                <div className="text-xs text-slate-500">{SCHOOL.name}. General guidance only: the school's DRRM plan and your teachers' instructions come first.</div>
              </div>
            </div>
            <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2 font-medium">
              <Link to="/info" className="text-brand-700 hover:underline">Emergency information</Link>
              <Link to="/login" className="text-brand-700 hover:underline">Staff sign in</Link>
              <a href="tel:911" className="text-brand-700 hover:underline">Emergency: 911</a>
            </nav>
          </div>
          <div className="border-t border-slate-100 pt-6">
            <PartnerLogos />
          </div>
        </div>
      </footer>
    </div>
  );
}
