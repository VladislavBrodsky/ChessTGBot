'use client';

import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { useAnimationsEnabled } from '@/hooks/useAnimationsEnabled';

interface CountUpProps {
  value: number;
  /** Seconds. Kept short: the number is a readout, not a show. */
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

/**
 * Numeric readout that tweens when the value CHANGES (XP earned, balance
 * top-up). The first paint always shows the real value, so there is no
 * flash of 0 and nothing misleading while data loads.
 */
export function CountUp({ value, duration = 0.7, format, className }: CountUpProps) {
  const animations = useAnimationsEnabled();
  const [shown, setShown] = useState(value);
  const last = useRef(value);

  useEffect(() => {
    if (!Number.isFinite(value) || value === last.current) return;
    const start = last.current;
    last.current = value;
    if (!animations) { setShown(value); return; }
    const controls = animate(start, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setShown(latest),
      onComplete: () => setShown(value),
    });
    return () => controls.stop();
  }, [value, animations, duration]);

  const rounded = Math.round(shown);
  return <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>{format ? format(rounded) : rounded.toLocaleString()}</span>;
}
