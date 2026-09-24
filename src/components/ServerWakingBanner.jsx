import React, { useEffect, useState } from 'react';
import { onSlowChange } from '../lib/apiClient';

// The free hosting plan puts the API to sleep when idle; the first request
// afterwards can take up to a minute. Say so instead of leaving a blank screen.
export default function ServerWakingBanner() {
  const [slow, setSlow] = useState(false);
  useEffect(() => onSlowChange(setSlow), []);
  if (!slow) return null;

  return (
    <div role="status" className="fixed top-0 inset-x-0 z-[80] flex items-center justify-center gap-2 bg-amber-100 border-b border-amber-300 px-4 py-2 text-sm text-amber-900">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" aria-hidden="true" />
      Waking up the server — this can take up to a minute after a quiet period. Please wait…
    </div>
  );
}
