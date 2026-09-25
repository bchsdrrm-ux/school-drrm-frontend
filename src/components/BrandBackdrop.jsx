import React, { useId } from 'react';

// Decorative texture for the brand-blue panels: a soft dot grid, a glow and ripple rings
// (a nod to alert/shockwave maps). Purely visual, so hidden from assistive tech.
export default function BrandBackdrop({ className = '', ringsX = 78, ringsY = 18 }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={`dots-${uid}`} width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="#fff" fillOpacity="0.14" />
        </pattern>
        <radialGradient id={`glow-${uid}`} cx={`${ringsX}%`} cy={`${ringsY}%`} r="55%">
          <stop offset="0" stopColor="#60a5fa" stopOpacity="0.38" />
          <stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`fade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#0b1e5b" stopOpacity="0" />
          <stop offset="1" stopColor="#0b1e5b" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill={`url(#dots-${uid})`} />
      <rect width="800" height="600" fill={`url(#glow-${uid})`} />
      <g fill="none" stroke="#fff" strokeOpacity="0.11" strokeWidth="1.2">
        {[70, 130, 190, 250, 310, 370].map((r) => (
          <circle key={r} cx={(ringsX / 100) * 800} cy={(ringsY / 100) * 600} r={r} />
        ))}
      </g>
      <rect width="800" height="600" fill={`url(#fade-${uid})`} />
    </svg>
  );
}
