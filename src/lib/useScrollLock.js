import { useEffect } from 'react';

// Several overlays can be open at once (e.g. a confirm dialog over a modal), so count them.
let locks = 0;
let previousOverflow = '';

/** While `active`, the page behind a modal or drawer cannot scroll (stops the "scroll bleed" on phones). */
export default function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    if (locks === 0) {
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
    }
    locks += 1;
    return () => {
      locks -= 1;
      if (locks === 0) document.documentElement.style.overflow = previousOverflow;
    };
  }, [active]);
}
