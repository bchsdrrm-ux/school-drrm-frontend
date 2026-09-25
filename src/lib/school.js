import L from 'leaflet';

// Where the school is. Coordinates are the campus centre from OpenStreetMap
// (Governor Pack Road, Baguio City); adjust here if the pin should sit elsewhere.
export const SCHOOL = {
  name: 'Baguio City National High School',
  latitude: 16.4069,
  longitude: 120.5972,
  zoom: 17,
};

export const SCHOOL_POINT = [SCHOOL.latitude, SCHOOL.longitude];

/** The fixed school marker shown on every map, beneath the hazard/assembly pins. */
export function addSchoolPin(layer) {
  const icon = L.divIcon({
    className: 'drrm-pin-wrap',
    html: '<div class="drrm-school-pin"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10l9-5 9 5-9 5-9-5zM7 12.5V16c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-3.5M21 10v5"/></svg></div>',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
  return L.marker(SCHOOL_POINT, { icon, title: SCHOOL.name, keyboard: true, zIndexOffset: -500 })
    .bindTooltip(SCHOOL.name, { permanent: true, direction: 'bottom', offset: [0, 14], className: 'drrm-school-tip' })
    .addTo(layer);
}
