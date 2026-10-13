"use client";

import { useEffect, useRef, useState } from "react";

/** One lifecycle for optional showcase motion: viewport, tab visibility, and preference. */
export function useShowcaseActivity() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(false);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const node = ref.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { setForeground(!document.hidden); setReduced(preference.matches); };
    sync();
    document.addEventListener("visibilitychange", sync);
    preference.addEventListener("change", sync);
    const observer = node && "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting)) : null;
    if (observer && node) observer.observe(node);
    else setVisible(true);
    return () => { observer?.disconnect(); document.removeEventListener("visibilitychange", sync); preference.removeEventListener("change", sync); };
  }, []);
  return { ref, visible, foreground, reduced, active: visible && foreground && !reduced };
}
