import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import { locationLabel } from '../../lib/useLocations';
import { useFeedback } from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';

// Shown until at least one location has been placed (roughly the whole Philippines).
const DEFAULT_VIEW = { center: [12.88, 121.77], zoom: 5 };

const LAYERS = [
  { key: 'hazards', label: 'Hazards' },
  { key: 'incidents', label: 'Active incidents' },
  { key: 'evacuationAreas', label: 'Evacuation areas' },
  { key: 'equipment', label: 'Equipment' },
];

// Pin tone by what is at the location. Red wins over amber, and so on.
const TONES = {
  red: { color: '#dc2626', text: '#ffffff', label: 'Critical or high-risk hazard, or an active incident' },
  amber: { color: '#ca8a04', text: '#1c1917', label: 'Moderate-risk hazard or an equipment alert' },
  green: { color: '#15803d', text: '#ffffff', label: 'Low-risk hazards only' },
  teal: { color: '#0d9488', text: '#ffffff', label: 'Evacuation area only' },
  blue: { color: '#2563eb', text: '#ffffff', label: 'Equipment only, no alerts' },
  gray: { color: '#94a3b8', text: '#ffffff', label: 'Placed, nothing recorded for the selected layers' },
};

const round6 = (n) => Math.round(n * 1e6) / 1e6;

function visibleItems(group, layers) {
  return {
    hazards: layers.hazards ? group.hazards : [],
    incidents: layers.incidents ? group.incidents : [],
    evacuationAreas: layers.evacuationAreas ? group.evacuationAreas : [],
    equipment: layers.equipment ? group.equipment : [],
  };
}

function toneOf(v) {
  if (!v.hazards.length && !v.incidents.length && !v.evacuationAreas.length && !v.equipment.length) return 'gray';
  if (v.incidents.length || v.hazards.some((h) => h.risk_level === 'critical' || h.risk_level === 'high')) return 'red';
  if (v.hazards.some((h) => h.risk_level === 'moderate') || v.equipment.some((e) => e.alert_type)) return 'amber';
  if (v.hazards.length) return 'green';
  if (v.evacuationAreas.length) return 'teal';
  return 'blue';
}

const TONE_RANK = { red: 0, amber: 1, green: 2, teal: 3, blue: 4, gray: 5 };

function summarize(v) {
  const parts = [];
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  if (v.hazards.length) parts.push(plural(v.hazards.length, 'hazard'));
  if (v.incidents.length) parts.push(plural(v.incidents.length, 'active incident'));
  if (v.evacuationAreas.length) parts.push(plural(v.evacuationAreas.length, 'evacuation area'));
  if (v.equipment.length) parts.push(`${v.equipment.length} equipment`);
  return parts.length ? parts.join(' · ') : 'Nothing recorded';
}

function pinIcon(count, tone, hasArea, selected) {
  const t = TONES[tone];
  if (count === 0) {
    const dot = `<div class="drrm-pin drrm-pin--empty${selected ? ' drrm-pin--selected' : ''}" style="background:${t.color}"></div>`;
    return L.divIcon({ className: 'drrm-pin-wrap', html: dot, iconSize: [16, 16], iconAnchor: [8, 8] });
  }
  // Only numbers and fixed color codes go into this HTML, never user data.
  const html = `<div class="drrm-pin${selected ? ' drrm-pin--selected' : ''}" style="background:${t.color};color:${t.text}">${count}${hasArea ? '<span class="drrm-pin__badge">A</span>' : ''}</div>`;
  return L.divIcon({ className: 'drrm-pin-wrap', html, iconSize: [34, 34], iconAnchor: [17, 17] });
}

export default function CampusMapPage() {
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const canManage = hasRole(user, ROLE_GROUPS.DRRM_MANAGERS);

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [layers, setLayers] = useState({ hazards: true, incidents: true, evacuationAreas: true, equipment: true });
  const [selectedId, setSelectedId] = useState(null);
  const [placeId, setPlaceId] = useState('');
  const [placing, setPlacing] = useState(false);
  const [saving, setSaving] = useState(false);

  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const fittedRef = useRef(false);
  const placingRef = useRef({ active: false, id: '' });

  const load = useCallback(() => {
    api.get('/campus-map').then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const groups = useMemo(() => {
    if (!data) return [];
    const byId = new Map(data.locations.map((l) => [l.id, { location: l, hazards: [], incidents: [], evacuationAreas: [], equipment: [] }]));
    const add = (rows, key) => rows.forEach((r) => byId.get(r.location_id)?.[key].push(r));
    add(data.hazards, 'hazards');
    add(data.incidents, 'incidents');
    add(data.evacuationAreas, 'evacuationAreas');
    add(data.equipment, 'equipment');
    return [...byId.values()];
  }, [data]);

  const pinned = useMemo(
    () => groups
      .filter((g) => g.location.latitude != null && g.location.longitude != null)
      .map((g) => {
        const v = visibleItems(g, layers);
        const count = v.hazards.length + v.incidents.length + v.evacuationAreas.length + v.equipment.length;
        return { ...g, v, count, tone: toneOf(v) };
      }),
    [groups, layers]
  );

  const layerCounts = useMemo(() => ({
    hazards: data?.hazards.length || 0,
    incidents: data?.incidents.length || 0,
    evacuationAreas: data?.evacuationAreas.length || 0,
    equipment: data?.equipment.length || 0,
  }), [data]);

  const placedCount = groups.filter((g) => g.location.latitude != null).length;
  // Records whose location has no coordinates yet can't be drawn; say so instead of hiding them silently.
  const unplaced = groups
    .filter((g) => g.location.latitude == null)
    .map((g) => ({ location: g.location, count: g.hazards.length + g.incidents.length + g.evacuationAreas.length + g.equipment.length }))
    .filter((g) => g.count > 0);
  const unplacedTotal = unplaced.reduce((n, g) => n + g.count, 0);
  const selected = pinned.find((g) => g.location.id === selectedId) || null;

  // ---- Map lifecycle ----
  useEffect(() => {
    const map = L.map(mapEl.current, { zoomControl: true }).setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom);
    const street = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'map-street-tiles', // dimmed in dark mode (see index.css)
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    });
    street.addTo(map);
    L.control.layers({ Street: street, Satellite: satellite }, {}, { position: 'topright' }).addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on('click', (e) => {
      const p = placingRef.current;
      if (!p.active) return;
      placingRef.current = { active: false, id: '' };
      map.getContainer().style.cursor = '';
      setPlacing(false);
      savePosition(p.id, round6(e.latlng.lat), round6(e.latlng.lng));
    });

    return () => { map.remove(); mapRef.current = null; markerLayerRef.current = null; fittedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw pins whenever the data, layers or selection change.
  useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    pinned.forEach((g) => {
      const marker = L.marker([g.location.latitude, g.location.longitude], {
        icon: pinIcon(g.count, g.tone, g.v.evacuationAreas.length > 0, g.location.id === selectedId),
        title: `${locationLabel(g.location)}: ${summarize(g.v)}`,
        keyboard: true,
      });
      marker.on('click', () => setSelectedId(g.location.id));
      marker.addTo(layer);
    });
    if (!fittedRef.current && pinned.length) {
      const bounds = L.latLngBounds(pinned.map((g) => [g.location.latitude, g.location.longitude]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 18 });
      fittedRef.current = true;
    }
  }, [pinned, selectedId]);

  const focusLocation = (g) => {
    setSelectedId(g.location.id);
    mapRef.current?.flyTo([g.location.latitude, g.location.longitude], Math.max(mapRef.current.getZoom(), 17), { duration: 0.6 });
  };

  async function savePosition(id, latitude, longitude) {
    setSaving(true);
    try {
      await api.put(`/locations/${id}`, { latitude, longitude });
      toast.success(latitude === null ? 'Location removed from the map.' : 'Location placed on the map.');
      fittedRef.current = false; // re-fit so a newly placed location is in view
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const startPlacing = () => {
    if (!placeId) return;
    placingRef.current = { active: true, id: placeId };
    mapRef.current.getContainer().style.cursor = 'crosshair';
    setPlacing(true);
  };

  const cancelPlacing = () => {
    placingRef.current = { active: false, id: '' };
    if (mapRef.current) mapRef.current.getContainer().style.cursor = '';
    setPlacing(false);
  };

  const removeFromMap = async () => {
    const loc = groups.find((g) => g.location.id === placeId)?.location;
    if (!loc) return;
    const ok = await confirm({
      title: 'Remove from the map?',
      message: `"${locationLabel(loc)}" will no longer appear on the campus map. Its hazards, equipment and other records are not affected.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (ok) savePosition(loc.id, null, null);
  };

  const findMe = () => {
    if (!navigator.geolocation) { toast.error('This browser cannot share your location.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 18),
      () => toast.error('Could not get your location. Check that location access is allowed for this site.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const placeChoice = groups.find((g) => g.location.id === placeId);
  const placeChoiceIsPlaced = placeChoice && placeChoice.location.latitude != null;

  if (error) return <div className="text-sm text-risk-critical">{error}</div>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Campus Map</h1>
          <p className="mt-0.5 text-sm text-slate-500">Where hazards, active incidents, evacuation areas and equipment are on campus.</p>
        </div>
        <Button variant="secondary" onClick={findMe}>Find my location</Button>
      </div>

      {data?.needsSetup && (
        <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The map needs a one-time database update before locations can be placed (migration 026). Ask the system administrator to apply it.
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Map layers">
        {LAYERS.map((l) => (
          <button
            key={l.key}
            aria-pressed={layers[l.key]}
            onClick={() => setLayers((s) => ({ ...s, [l.key]: !s[l.key] }))}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${layers[l.key] ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-300 bg-surface text-slate-500 hover:bg-slate-50'}`}
          >
            {layers[l.key] ? '✓ ' : ''}{l.label} ({layerCounts[l.key]})
          </button>
        ))}
      </div>

      {unplacedTotal > 0 && (
        <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
          Not shown on the map: {unplacedTotal} record{unplacedTotal === 1 ? '' : 's'} at locations that haven't been placed yet
          {' '}({unplaced.map((g) => locationLabel(g.location)).join(', ')}).
          {canManage ? ' Use "Place a location" to add them.' : ' A DRRM coordinator can place them.'}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="relative isolate overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <div ref={mapEl} className="h-[55dvh] min-h-[360px] w-full" role="application" aria-label="Campus map" />
            {placing && (
              <div role="status" className="pointer-events-none absolute inset-x-0 top-3 z-[500] mx-auto w-fit max-w-[90%] rounded-lg bg-tip px-4 py-2 text-sm text-white shadow-lg">
                Click the map where this location is
              </div>
            )}
            {data && !data.needsSetup && placedCount === 0 && !placing && (
              <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center p-6">
                <div className="max-w-sm rounded-xl bg-surface/95 p-5 text-center text-sm text-slate-700 shadow-lg">
                  <div className="mb-1 font-semibold text-slate-900">No locations are on the map yet</div>
                  {canManage
                    ? 'Choose a location under "Place a location", then click its spot on the map. Once placed, its hazards, equipment and incidents appear here automatically.'
                    : 'A DRRM coordinator needs to place your school\'s buildings on the map first.'}
                </div>
              </div>
            )}
          </div>

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
            {Object.entries(TONES).map(([key, t]) => (
              <li key={key} className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: t.color }} aria-hidden="true" />
                {t.label}
              </li>
            ))}
            <li className="flex items-center gap-1.5"><span className="rounded-full bg-surface px-1 text-[9px] font-bold text-slate-700 ring-1 ring-slate-400">A</span> Has an evacuation area</li>
          </ul>
        </div>

        <aside className="space-y-4">
          {canManage && (
            <section className="rounded-xl border border-slate-200 bg-surface p-4">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">Place a location</h2>
              <label className="block text-xs text-slate-500" htmlFor="place-location">Location</label>
              <select
                id="place-location"
                value={placeId}
                onChange={(e) => { setPlaceId(e.target.value); cancelPlacing(); }}
                className="mb-2 mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-sm"
              >
                <option value="">Choose a location…</option>
                {groups.map((g) => (
                  <option key={g.location.id} value={g.location.id}>
                    {locationLabel(g.location)}{g.location.latitude == null ? ' (not on map)' : ''}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                {placing ? (
                  <Button variant="secondary" onClick={cancelPlacing}>Cancel</Button>
                ) : (
                  <Button onClick={startPlacing} disabled={!placeId || saving}>{placeChoiceIsPlaced ? 'Move on map' : 'Place on map'}</Button>
                )}
                {placeChoiceIsPlaced && !placing && <Button variant="danger" onClick={removeFromMap} disabled={saving}>Remove</Button>}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Tip: switch to Satellite (top right of the map) and zoom in to place buildings accurately.
                {' '}Add missing buildings under <Link to="/settings" className="font-medium text-brand-700 hover:underline">Settings</Link>.
              </p>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-surface p-4" aria-live="polite">
            {selected ? (
              <div>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">{locationLabel(selected.location)}</h2>
                    <p className="text-xs text-slate-500">{summarize(selected.v)}</p>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="text-xs font-medium text-slate-500 hover:text-slate-800">Close</button>
                </div>
                <DetailList group={selected.v} />
              </div>
            ) : (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-slate-900">Locations on the map</h2>
                {pinned.length === 0 ? (
                  <p className="text-sm text-slate-500">No locations have been placed yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {[...pinned].sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone]).map((g) => (
                      <li key={g.location.id}>
                        <button onClick={() => focusLocation(g)} className="flex w-full items-start gap-2 py-2 text-left hover:bg-slate-50">
                          <span className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: TONES[g.tone].color }} aria-hidden="true" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-800">{locationLabel(g.location)}</span>
                            <span className="block text-xs text-slate-500">{summarize(g.v)}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function DetailList({ group }) {
  const Section = ({ title, to, children }) => (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
        <Link to={to} className="text-xs font-medium text-brand-700 hover:underline">Open</Link>
      </div>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  );
  return (
    <div>
      {group.hazards.length > 0 && (
        <Section title="Hazards" to="/hazards">
          {group.hazards.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate text-slate-700">{h.hazard_name}</span>
              <StatusBadge value={h.risk_level} type="risk" />
            </li>
          ))}
        </Section>
      )}
      {group.incidents.length > 0 && (
        <Section title="Active incidents" to="/incidents">
          {group.incidents.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate text-slate-700">{i.incident_type} <span className="text-xs text-slate-400">{i.incident_code}</span></span>
              <StatusBadge value={i.status} />
            </li>
          ))}
        </Section>
      )}
      {group.evacuationAreas.length > 0 && (
        <Section title="Evacuation areas" to="/evacuation">
          {group.evacuationAreas.map((a) => (
            <li key={a.id} className="text-sm text-slate-700">
              {a.name} <span className="text-xs text-slate-500">holds about {Number(a.capacity).toLocaleString()}</span>
              {a.accessibility && <div className="text-xs text-slate-500">Accessibility: {a.accessibility}</div>}
            </li>
          ))}
        </Section>
      )}
      {group.equipment.length > 0 && (
        <Section title="Equipment" to="/equipment">
          {group.equipment.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate text-slate-700">{e.equipment_type} <span className="text-xs text-slate-400">{e.equipment_code}</span></span>
              {e.alert_type ? <StatusBadge value={e.alert_type} type="alert" /> : <StatusBadge value={e.condition} />}
            </li>
          ))}
        </Section>
      )}
    </div>
  );
}
