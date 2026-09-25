import React from 'react';

// Small stroke-icon set (24x24 grid) so the sidebar isn't text-only.
const PATHS = {
  home: <path d="M3 11l9-8 9 8M5 9.5V20a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V9.5" />,
  hazard: <path d="M12 3L2 20h20L12 3zM12 10v4.5M12 17.5v.01" />,
  map: <path d="M9 4L3 6.5v14L9 18l6 2.5 6-2.5v-14L15 6.5 9 4zM9 4v14M15 6.5v14" />,
  plans: <path d="M7 3h7l5 5v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM14 3v5h5M9 13h6M9 17h6" />,
  exit: <path d="M14 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 8l-4 4 4 4M6 12h10" />,
  phone: <path d="M5 4h3l2 5-2.5 1.5a11 11 0 006 6L15 14l5 2v3a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  equipment: <path d="M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8" />,
  team: <path d="M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.87M15 4.13a3.5 3.5 0 010 6.74" />,
  drill: <path d="M4 21V4M4 5h13l-2.5 4L17 13H4" />,
  incident: <path d="M12 3a6 6 0 00-6 6v3l-2 4h16l-2-4V9a6 6 0 00-6-6zM10 20a2 2 0 004 0" />,
  inspect: <path d="M9 4h6v3H9V4zM7 5.5H6a1 1 0 00-1 1V20a1 1 0 001 1h12a1 1 0 001-1V6.5a1 1 0 00-1-1h-1M9 14l2 2 4-4.5" />,
  headcount: <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0M18 6l2 2 3-3.5" />,
  training: <path d="M12 4L2 9l10 5 10-5-10-5zM6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6" />,
  recovery: <path d="M20 12a8 8 0 11-2.6-5.9M20 4v5h-5M12 8v4l3 2" />,
  budget: <path d="M4 20h16M6 20V10M12 20V4M18 20v-7" />,
  documents: <path d="M4 6a1 1 0 011-1h4l2 2h8a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V6z" />,
  reports: <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" />,
  settings: <path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1M15 5v4M9 10v4M17 15v4" />,
  pin: <path d="M12 21s-6-5.6-6-11a6 6 0 1112 0c0 5.4-6 11-6 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  lock: <path d="M6 11h12a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8a1 1 0 011-1zM8 11V8a4 4 0 018 0v3M12 15v2" />,
  mail: <path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM3 7l9 6 9-6" />,
  shield: <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9.5C7.2 20 4 16.5 4 12V6l8-3zM9 12l2.2 2.2L15.5 10" />,
  bell: <path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15L6 16zM10 21h4" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  wifioff: <path d="M3 3l18 18M8.5 16.4a5 5 0 017 0M5 12.9a10 10 0 015-2.6M19 12.9a10 10 0 00-2.7-1.9M12 20h.01" />,
  book: <path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3V4zM5 17a3 3 0 013-3h10" />,
  siren: <path d="M12 3v2M4.5 6.5L6 8M19.5 6.5L18 8M7 19v-5a5 5 0 0110 0v5M5 19h14M10 12a2 2 0 012-2" />,
};

export default function Icon({ name, className = 'h-5 w-5' }) {
  const path = PATHS[name] || PATHS.documents;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
