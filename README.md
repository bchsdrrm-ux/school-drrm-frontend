# School DRRM Management Module — Frontend (Phase 1 skeleton)

React (Vite) + Tailwind CSS. Talks to the backend at `/api` via Vite's dev
proxy (see `vite.config.js`) — no CORS config needed in development as long
as the backend's `CLIENT_ORIGIN` in `.env` is `http://localhost:5173`.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Make sure the backend is running first** (`npm run dev` in `../backend`,
   listening on port 4000) — this app has nothing to talk to otherwise.

3. **Run the dev server**
   ```bash
   npm run dev
   ```
   Opens on http://localhost:5173. Log in with the admin account you seeded
   on the backend.

4. **Production build** (verified working — 53 modules, builds clean):
   ```bash
   npm run build
   npm run preview   # serve the built dist/ locally to sanity-check it
   ```

## What's implemented

| Page | Status |
|---|---|
| Login (JWT auth, stored in localStorage) | Fully implemented |
| Dashboard (risk counts, incident counts, equipment alerts, evacuation capacity) | Fully implemented, live data |
| Hazard Inventory & Risk Assessment (list, filter by status, report new hazard) | Fully implemented |
| Emergency Contact Directory (list, add) | Fully implemented |
| Evacuation Areas (list, add) | Fully implemented — Routes UI not built yet, API-only |
| Emergency Equipment (list, add, live alert badges) | Fully implemented |
| Incident Reporting (list, file new report) | Fully implemented |
| Reports (Hazard Inventory / Risk Assessment / Equipment / Incidents, CSV export) | Fully implemented — PDF/Word export not wired yet |

Every other item in the sidebar (Hazard Map, Emergency Plans, Drills,
Inspections, Training, DRRM Teams, Documents, Accountability, Emergency Mode,
Recovery, Action Plan & Budget, Settings) routes to a placeholder page so the
full navigation from the spec is visible and clickable from day one — build
these out module by module as their backend endpoints land.

## Structure

```
src/
  auth/         — AuthContext (login/logout, JWT storage), RequireAuth route guard, LoginPage
  layouts/      — AppShell (top bar + Emergency Mode button), Sidebar (full IA)
  components/   — Table, Button, Modal, FormField, StatusBadge, PlaceholderPage
  features/<name>/  — one folder per module, e.g. features/hazards/HazardsPage.jsx
  lib/apiClient.js  — fetch wrapper: attaches JWT, handles 401 → redirect to /login
```

New modules follow the same pattern as `features/hazards/HazardsPage.jsx`:
a page component that loads via `api.get()`, a modal form using `FormField`,
submits via `api.post()`, and re-loads the list.

## Design notes

- Palette follows the spec's UX guidance: calm blues/slates for general UI,
  red (`risk-critical`) reserved for the Emergency Mode button and
  critical-risk/expired badges — not general chrome.
- `StatusBadge` centralizes all status/risk/alert coloring — extend it there,
  not per-page, so colors stay consistent as new modules are added.
- No client state library yet (Redux/Zustand) — each page manages its own
  fetch/state, which is fine at Phase 1 scale. Revisit if cross-page shared
  state (e.g. live Emergency Mode status in the top bar) is needed in Phase 3.

## Known gaps / next steps

- No automated tests yet.
- Evidence/photo upload UI (hazard evidence, equipment photos, incident
  files) isn't built — the backend endpoints exist (`multer`-backed), just
  needs a file input wired into each form.
- Evacuation Routes and Classroom Assignments need their own UI (API is done).
- PDF/Word report export is CSV-only for now; wire in a library (e.g.
  `jspdf` + `jspdf-autotable`, or a backend-generated file) when prioritized.
- Refresh-token rotation isn't wired into `apiClient.js` yet — on access-token
  expiry the user is currently just bounced to `/login` rather than silently
  refreshed. Fine for Phase 1, worth fixing before Phase 3 (Emergency Mode
  shouldn't log someone out mid-incident).
