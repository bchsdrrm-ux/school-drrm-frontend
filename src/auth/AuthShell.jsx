import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Icon from '../components/icons';
import ThemeToggle from '../components/ThemeToggle';
import BrandBackdrop from '../components/BrandBackdrop';
import PartnerLogos from '../components/PartnerLogos';
import { SCHOOL } from '../lib/school';

// The four thematic areas of Philippine DRRM, which the system is organised around.
const AREAS = [
  { icon: 'shield', title: 'Prevention & Mitigation', text: 'Hazard inventory and risk assessment' },
  { icon: 'training', title: 'Preparedness', text: 'Drills, inspections and training' },
  { icon: 'siren', title: 'Response', text: 'Incident reports and live Emergency Mode' },
  { icon: 'recovery', title: 'Recovery', text: 'Headcount, damage and rehabilitation' },
];

const GRADIENT = 'bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700';

function Brand({ size = 40 }) {
  return (
    <div className="flex items-center gap-3">
      <Logo size={size} />
      <div className="leading-tight">
        <div className="text-base font-semibold">BCHS DRRM</div>
        <div className="text-xs text-blue-100">Management System</div>
      </div>
    </div>
  );
}

/** Shared frame for the signed-out screens (sign in, forgot password, reset password). */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop: brand panel */}
      <aside className={`relative hidden overflow-hidden ${GRADIENT} p-12 text-white lg:flex lg:w-[46%] lg:flex-col lg:justify-between xl:w-1/2`}>
        <BrandBackdrop />
        <div className="relative"><Brand size={46} /></div>

        <div className="relative">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50">
            <Icon name="shield" className="h-3.5 w-3.5" /> {SCHOOL.name} · DRRM
          </p>
          <h2 className="max-w-lg text-4xl font-semibold leading-tight">Prepared schools are safer schools.</h2>
          <p className="mt-4 max-w-md text-blue-100">
            One place to plan, drill, respond and recover, built around the school's DRRM program.
          </p>
          <ul className="mt-9 grid max-w-xl grid-cols-2 gap-3">
            {AREAS.map((a) => (
              <li key={a.title} className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15"><Icon name={a.icon} className="h-5 w-5" /></span>
                <div className="text-sm font-semibold">{a.title}</div>
                <div className="mt-0.5 text-xs text-blue-100">{a.text}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative space-y-4">
          <PartnerLogos />
          <p className="flex items-center gap-2 text-xs text-blue-100">
            <Icon name="lock" className="h-3.5 w-3.5" /> Authorized school personnel only
          </p>
        </div>
      </aside>

      <main className="relative flex min-h-dvh flex-1 flex-col bg-slate-50 lg:min-h-0">
        {/* Desktop: theme switch sits in the corner of the form side */}
        <div className="absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] z-20 hidden lg:block">
          <ThemeToggle />
        </div>

        {/* Phone/tablet: compact brand band, the card overlaps its bottom edge */}
        <header className={`relative overflow-hidden ${GRADIENT} px-5 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))] text-white lg:hidden`}>
          <BrandBackdrop ringsX={88} ringsY={10} />
          <div className="relative flex items-center justify-between gap-3">
            <Brand size={38} />
            <ThemeToggle />
          </div>
        </header>

        <div className="relative z-10 mx-auto -mt-9 flex w-full max-w-md flex-1 flex-col px-4 pb-[max(2rem,env(safe-area-inset-bottom))] lg:mt-0 lg:justify-center lg:py-12">
          <div className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-xl shadow-slate-900/10 sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>
            {children}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 text-sm">
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Icon name="lock" className="h-3.5 w-3.5" /> Secure sign-in for authorized school personnel
            </p>
            <PartnerLogos compact className="mt-2 lg:hidden" />
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link to="/" className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"><Icon name="back" className="h-4 w-4" /> Back to home</Link>
              <Link to="/info" className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"><Icon name="siren" className="h-4 w-4" /> Emergency information</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
