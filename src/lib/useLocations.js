import { useEffect, useState } from 'react';
import { api } from './apiClient';

/**
 * Shared hook for populating a "Location" <select> across Hazards,
 * Equipment, and Evacuation Areas forms — avoids each page duplicating the
 * same fetch + label-formatting logic.
 */
export function useLocations() {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/locations')
      .then(setLocations)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { locations, isLoading, error };
}

export function locationLabel(loc) {
  return [loc.building, loc.floor, loc.room_area].filter(Boolean).join(' / ');
}

/**
 * Same formatting as locationLabel, but for table rows where the location
 * fields arrive flattened (r.building, r.floor, r.room_area from a SQL
 * JOIN) rather than nested under a `location` object. Used by every list
 * table (Hazards, Equipment, Evacuation Areas) so "no location set" and
 * multi-part labels render identically everywhere.
 */
export function formatLocation(row) {
  const parts = [row.building, row.floor, row.room_area].filter(Boolean);
  return parts.length ? parts.join(' / ') : '—';
}
