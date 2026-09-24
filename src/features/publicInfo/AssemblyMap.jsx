import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TEAL = '#0d9488';

// areas: [{ number, name, latitude, longitude }]. `me` is the visitor's position, kept in the browser only.
export default function AssemblyMap({ areas, me, activeNumber, onSelect }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const areaLayerRef = useRef(null);
  const meLayerRef = useRef(null);
  const fittedRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const map = L.map(elRef.current, { zoomControl: true, scrollWheelZoom: false });
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
    areaLayerRef.current = L.layerGroup().addTo(map);
    meLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; fittedRef.current = false; };
  }, []);

  // Area pins: numbered to match the list under the map (only integers go into this HTML).
  useEffect(() => {
    const map = mapRef.current;
    const layer = areaLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    areas.forEach((a) => {
      const selected = a.number === activeNumber;
      const icon = L.divIcon({
        className: 'drrm-pin-wrap',
        html: `<div class="drrm-pin${selected ? ' drrm-pin--selected' : ''}" style="background:${TEAL};color:#fff">${Number(a.number)}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      L.marker([a.latitude, a.longitude], { icon, title: `${a.number}. ${a.name}`, keyboard: true })
        .on('click', () => onSelectRef.current?.(a.number))
        .addTo(layer);
    });
    if (!fittedRef.current && areas.length) {
      map.fitBounds(L.latLngBounds(areas.map((a) => [a.latitude, a.longitude])), { padding: [40, 40], maxZoom: 18 });
      fittedRef.current = true;
    }
  }, [areas, activeNumber]);

  // The visitor's own position, drawn as a blue dot; the view widens to include it.
  useEffect(() => {
    const map = mapRef.current;
    const layer = meLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!me) return;
    L.circleMarker([me.latitude, me.longitude], { radius: 8, color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 })
      .bindTooltip('You are here')
      .addTo(layer);
    const points = [[me.latitude, me.longitude], ...areas.map((a) => [a.latitude, a.longitude])];
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 18 });
  }, [me, areas]);

  return <div ref={elRef} className="h-64 w-full sm:h-72" role="application" aria-label="Map of assembly areas" />;
}
