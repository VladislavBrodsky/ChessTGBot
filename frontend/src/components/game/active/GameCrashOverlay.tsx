'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface GameCrashOverlayProps {
  show: boolean;
  tGameCrashed: string;
  tGameCrashedDesc: string;
  tReloadGameBtn: string;
}

export function GameCrashOverlay({
  show,
  tGameCrashed,
  tGameCrashedDesc,
  tReloadGameBtn,
}: GameCrashOverlayProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-void/80 p-6 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="game-crashed-title"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-2xl border border-brand-border-opacity-10 bg-brand-surface p-6 shadow-2xl flex flex-col items-center text-center gap-4"
      >
        {/* Warning Icon with pulse */}
        <div className="relative w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 animate-pulse">
          <span className="text-3xl font-semibold">⚠️</span>
        </div>

        <h2 id="game-crashed-title" className="text-lg font-semibold normal-case tracking-normal text-brand-primary">
          {tGameCrashed}
        </h2>

        <p className="text-sm text-brand-muted leading-relaxed px-2">
          {tGameCrashedDesc}
        </p>

        <motion.button type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.reload()}
          className="ui-tap-target w-full mt-2 py-3.5 rounded-xl bg-brand-primary text-brand-void font-semibold text-sm normal-case tracking-normal hover:opacity-90 shadow-md cursor-pointer transition-all"
        >
          {tReloadGameBtn}
        </motion.button>
      </motion.div>
    </div>
  );
}
