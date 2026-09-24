/** @type {import('tailwindcss').Config} */

// The gray scale is driven by CSS variables (see src/index.css), so every
// existing `text-slate-*`, `bg-slate-*` and `border-slate-*` class follows the
// light/dark theme without touching the components.
const slate = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, `rgb(var(--slate-${n}) / <alpha-value>)`])
);

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate,
        // Card and panel surfaces (was `white`, which must stay white for text on colored buttons).
        surface: 'rgb(var(--surface) / <alpha-value>)',
        // Tooltips and banners are dark in both themes.
        tip: { DEFAULT: '#0f172a', muted: '#cbd5e1' },
        // Calm, professional public-sector palette per the spec's UX
        // guidelines — reds/oranges are reserved for active-alert states
        // (see StatusBadge / EmergencyBar), not general UI chrome.
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        risk: {
          low: '#16a34a',
          moderate: '#ca8a04',
          high: '#ea580c',
          critical: '#dc2626',
        },
      },
    },
  },
  plugins: [],
};
