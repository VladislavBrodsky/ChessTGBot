'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionPreference } from '@/context/ReducedMotionContext';
import { useLocale } from 'next-intl';
import { formatGramNano } from '@/lib/gram';

/** The official native-coin mark (local asset). Decorative: the amount or label next to it carries the meaning. */
export function GramMark({ className = 'h-4 w-4 shrink-0' }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/images/leaderboard-preview/gram.svg" width={20} height={20} alt="" aria-hidden="true" className={className} />;
}

/** Local official native-coin mark, with exact reward precision and isolated bidi. */
export function GramAmount({ nano, estimate, className = '', plus = false }: { nano?: string | null; estimate?: number; className?: string; plus?: boolean }) {
  const locale = useLocale();
  const { reducedMotion } = useReducedMotionPreference();
  const previous = useRef<string | null>(null);
  const [gained, setGained] = useState(false);
  useEffect(() => {
    if (nano != null && /^\d+$/.test(nano)) {
      if (previous.current !== null && BigInt(nano) > BigInt(previous.current) && !reducedMotion) setGained(true);
      previous.current = nano;
    }
  }, [nano, reducedMotion]);
  const value = nano != null ? formatGramNano(nano, locale) : Number.isFinite(estimate) && Number(estimate) >= 0
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Number(estimate)) : null;
  return <motion.span initial={false} animate={gained && !reducedMotion ? { scale: [1, 1.035, 1], opacity: [0.7, 1] } : { scale: 1, opacity: 1 }} transition={{ duration: 0.3 }} onAnimationComplete={() => setGained(false)} className={`inline-flex min-w-0 items-center gap-1.5 tabular-nums ${className}`}>
    <GramMark />
    <bdi>{value === null ? '—' : estimate !== undefined ? `≈ ${value}` : `${plus ? "+" : ""}${value}`} GRAM</bdi>
  </motion.span>;
}
