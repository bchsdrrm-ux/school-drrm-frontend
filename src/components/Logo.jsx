import React from 'react';

// Placeholder mark (shield + cross). To use the school's own logo, drop it in
// public/ and swap this component's body for an <img src="/your-logo.png" />.
export default function Logo({ size = 36, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="BCHS DRRM">
      <rect width="64" height="64" rx="14" fill="#1d4ed8" />
      <path d="M32 11l16 6v13c0 10.5-6.6 18.2-16 22-9.4-3.8-16-11.5-16-22V17l16-6z" fill="#ffffff" />
      <path d="M29 24h6v6h6v6h-6v6h-6v-6h-6v-6h6z" fill="#dc2626" />
    </svg>
  );
}
