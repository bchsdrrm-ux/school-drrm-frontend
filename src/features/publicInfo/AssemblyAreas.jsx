import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';

// Loaded on demand so the map library never slows the page for people who can't use a map.
const AssemblyMap = lazy(() => import('./AssemblyMap'));

const EARTH_RADIUS_M = 6371000;

function distanceMeters(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function formatDistance(m) {
  if (m < 1000) return `About ${Math.max(10, Math.round(m / 10) * 10)} m away`;
  return `About ${(m / 1000).toFixed(1)} km away`;
}

const mapsLink = (a) => `https://www.google.com/maps/search/?api=1&query=${a.latitude},${a.longitude}`;

function Skeleton() {
  return <div className="space-y-2" aria-hidden="true"><div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" /><div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" /></div>;
}

export default function AssemblyAreas({ status, areas, online }) {
  const [active, setActive] = useState(null);
  const [me, setMe] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const itemRefs = useRef({});

  // Areas that have a map position get a number, shared by the pin and the list entry.
  const items = useMemo(() => {
    let n = 0;
    return areas.map((a) => ({ ...a, number: a.latitude != null && a.longitude != null ? ++n : null }));
  }, [areas]);
  const mapped = items.filter((a) => a.number);

  const nearest = useMemo(() => {
    if (!me || !mapped.length) return null;
    return mapped.reduce((best, a) => {
      const d = distanceMeters(me, a);
      return !best || d < best.d ? { number: a.number, d } : best;
    }, null);
  }, [me, mapped]);

  useEffect(() => {
    if (active && itemRefs.current[active]) itemRefs.current[active].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [active]);

  const locate = () => {
    setLocError('');
    if (!navigator.geolocation) { setLocError("This browser can't share your location."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError('Could not get your location. Check that location access is allowed for this site.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <>
      <p className="mb-3 text-sm text-slate-600">After evacuating, go to the assembly area for your class and wait for the headcount.</p>
      {status === 'loading' && <Skeleton />}
      {status === 'error' && <p className="text-sm text-slate-500">Could not load assembly areas.</p>}
      {status === 'ready' && items.length === 0 && (
        <p className="text-sm text-slate-500">The school has not published its assembly areas yet. Ask your teacher where your class assembles.</p>
      )}

      {mapped.length > 0 && online && (
        <div className="mb-3 print:hidden">
          <div className="relative isolate overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-slate-500 sm:h-72">Loading map…</div>}>
              <AssemblyMap areas={mapped} me={me} activeNumber={active} onSelect={setActive} />
            </Suspense>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={locate}
              disabled={locating}
              className="rounded-lg border border-slate-300 bg-surface px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {locating ? 'Finding you…' : me ? 'Update my location' : 'Show my location'}
            </button>
            <span className="text-xs text-slate-500">Your location stays on your phone. It is never sent to the school or the server.</span>
          </div>
          {locError && <p className="mt-2 text-xs text-risk-critical">{locError}</p>}
        </div>
      )}

      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((a) => {
            const where = [a.building, a.floor, a.room_area].filter(Boolean).join(', ');
            const isActive = a.number && a.number === active;
            const isNearest = nearest && a.number === nearest.number;
            return (
              <li
                key={a.name}
                ref={(el) => { if (a.number) itemRefs.current[a.number] = el; }}
                className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${isActive ? 'bg-teal-50 ring-2 ring-teal-600' : 'bg-slate-50'}`}
              >
                {a.number && (
                  <button
                    onClick={() => setActive(a.number)}
                    aria-label={`Show ${a.name} on the map`}
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white"
                  >
                    {a.number}
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-800">{a.name}</div>
                  <div className="text-xs text-slate-500">
                    {where && <span>{where} · </span>}Holds about {Number(a.capacity).toLocaleString()} people
                  </div>
                  {a.accessibility && <div className="mt-0.5 text-xs text-slate-600">Accessibility: {a.accessibility}</div>}
                  {a.number && (
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                      {me && <span className="text-slate-600">{formatDistance(distanceMeters(me, a))}</span>}
                      {isNearest && <span className="rounded-full bg-teal-100 px-2 py-0.5 font-medium text-teal-800">Nearest to you</span>}
                      <a href={mapsLink(a)} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline print:hidden">Open in Maps</a>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
