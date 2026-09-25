import React from 'react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const FEATURES = [
  'Hazard inventory and risk assessment',
  'Drills, inspections and training records',
  'Incident reporting and live Emergency Mode',
  'Headcount, damage assessment and recovery',
];

/** Shared frame for the signed-out screens (sign in, forgot password, reset password). */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-dvh flex">
      <aside className="hidden lg:flex lg:w-[46%] flex-col justify-between bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-12 text-white">
        <div className="flex items-center gap-3">
          <Logo size={44} />
          <div className="leading-tight">
            <div className="text-lg font-semibold">BCHS DRRM</div>
            <div className="text-sm text-blue-100">Management System</div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-semibold leading-tight">Prepared schools are safer schools.</h2>
          <p className="mt-3 max-w-md text-blue-100">
            One place to plan, drill, respond and recover: built around the school's Disaster Risk Reduction and Management program.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs" aria-hidden="true">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-blue-200">Authorized school personnel only.</p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center bg-slate-50 px-4 py-10">
        <div className="absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))]">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={40} />
            <div className="leading-tight">
              <div className="text-base font-semibold text-slate-900">BCHS DRRM</div>
              <div className="text-xs text-slate-500">Management System</div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-slate-500">{subtitle}</p>

          {children}
        </div>
      </main>
    </div>
  );
}
