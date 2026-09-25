import React from 'react';
import { SCHOOL } from '../lib/school';

const SEAL = '/brand/deped-seal.png';
const MATATAG = '/brand/deped-matatag.png';
const BAGONG = '/brand/bagong-pilipinas.png';

/** Slim government identity bar for the top of public pages (sits on the brand-blue hero). */
export function GovBar() {
  return (
    <div className="relative border-b border-white/10 bg-black/20 pt-[env(safe-area-inset-top)] text-blue-50 print:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-1.5 text-[11px] leading-tight sm:px-6 sm:text-xs">
        <img src={SEAL} alt="" width="20" height="20" className="h-5 w-5 rounded-full bg-white/90 p-px" />
        <span className="truncate">
          <span className="font-semibold">Republic of the Philippines</span>
          <span className="hidden sm:inline"> · Department of Education</span>
        </span>
        <span className="ml-auto hidden truncate sm:inline">{SCHOOL.name}</span>
      </div>
    </div>
  );
}

/**
 * The official marks. They are dark-on-transparent, so they always sit on a white plate,
 * which keeps them legible in dark mode and on the blue panels.
 */
export default function PartnerLogos({ className = '', compact = false }) {
  const h = compact ? 'h-10' : 'h-12 sm:h-14';
  return (
    <div className={`inline-flex flex-nowrap items-center justify-center gap-4 sm:gap-5 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-slate-900/5 ${className}`}>
      <img src={SEAL} alt="Kagawaran ng Edukasyon, Republika ng Pilipinas seal" width="56" height="56" loading="lazy" className={`${h} w-auto`} />
      <img src={MATATAG} alt="DepEd MATATAG: Bansang Makabata, Batang Makabansa" width="60" height="56" loading="lazy" className={`${h} w-auto`} />
      <img src={BAGONG} alt="Bagong Pilipinas" width="60" height="56" loading="lazy" className={`${h} w-auto`} />
    </div>
  );
}
