'use client';

import { useEffect, useState } from 'react';

/**
 * True when decorative motion (count-ups, ring sweeps, staggered entrances)
 * may run. Honors both the OS "reduce motion" setting and the in-app switch,
 * which stamps `data-reduce-motion` on <html> before first paint. Defaults to
 * false on the server so first paint is always the final, static state.
 */
export function useAnimationsEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const read = () => {
      const inApp = document.documentElement.dataset.reduceMotion === 'true';
      const os = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      setEnabled(!inApp && !os);
    };
    read();
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    media?.addEventListener?.('change', read);
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduce-motion'] });
    return () => { media?.removeEventListener?.('change', read); observer.disconnect(); };
  }, []);
  return enabled;
}
