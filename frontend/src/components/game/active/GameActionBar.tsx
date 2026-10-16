'use client';

import React, { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaFlag, FaHandshake } from 'react-icons/fa';

export interface GameActionBarProps {
  isTelegramWeb: boolean;
  onResign: () => void;
  onOfferDraw: () => void;
  tResign: string;
  tOfferDraw: string;
  /**
   * Reports how much of the viewport bottom the tray covers, in px, excluding --app-safe-bottom (bottom offset + the
   * tray's own height). The page pads its content by this so nothing scrolls to a resting place underneath the tray.
   */
  onFootprintChange?: (px: number) => void;
}

export function GameActionBar({
  isTelegramWeb,
  onResign,
  onOfferDraw,
  tResign,
  tOfferDraw,
  onFootprintChange,
}: GameActionBarProps) {
  const bottomOffset = isTelegramWeb ? 66 : 16;
  const trayRef = useRef<HTMLDivElement>(null);

  // offsetHeight ignores the slide-in transform, so the footprint is the resting one from the first frame.
  // ResizeObserver catches font loading and labels that wrap in longer locales.
  useLayoutEffect(() => {
    const tray = trayRef.current;
    if (!tray || !onFootprintChange) return;
    const report = () => onFootprintChange(bottomOffset + tray.offsetHeight);
    report();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(report);
    observer.observe(tray);
    return () => observer.disconnect();
  }, [bottomOffset, onFootprintChange]);

  return (
    <motion.div
      ref={trayRef}
      initial={{ x: "-50%", y: 80, opacity: 0 }}
      animate={{ x: "-50%", y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{
        bottom: `calc(${bottomOffset}px + var(--app-safe-bottom))`
      }}
      className="fixed left-1/2 w-[92%] max-w-md z-50 flex gap-3 bg-brand-surface border border-brand-border p-3 rounded-2xl shadow-premium"
    >
      {/* Resign Button */}
      <motion.button type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onResign}
        className="ui-tap-target flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all cursor-pointer text-sm font-semibold normal-case tracking-normal shadow-sm"
      >
        <FaFlag size={12} />
        <span>{tResign}</span>
      </motion.button>

      {/* Offer Draw Button */}
      <motion.button type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onOfferDraw}
        className="ui-tap-target flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-brand-border-opacity-10 bg-brand-surface hover:bg-brand-bg-opacity-5 hover:border-brand-border-opacity-25 text-brand-primary transition-all cursor-pointer text-sm font-semibold normal-case tracking-normal shadow-sm"
      >
        <FaHandshake size={14} />
        <span>{tOfferDraw}</span>
      </motion.button>
    </motion.div>
  );
}
