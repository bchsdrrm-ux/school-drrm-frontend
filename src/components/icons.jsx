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
