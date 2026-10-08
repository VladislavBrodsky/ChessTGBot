'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaFlag, FaHandshake } from 'react-icons/fa';

export interface GameActionBarProps {
  isTelegramWeb: boolean;
  onResign: () => void;
  onOfferDraw: () => void;
  tResign: string;
  tOfferDraw: string;
}

export function GameActionBar({
  isTelegramWeb,
  onResign,
  onOfferDraw,
  tResign,
  tOfferDraw,
}: GameActionBarProps) {
  return (
    <motion.div
      initial={{ x: "-50%", y: 80, opacity: 0 }}
      animate={{ x: "-50%", y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{
        bottom: `calc(${isTelegramWeb ? '66px' : '16px'} + var(--app-safe-bottom))`
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
