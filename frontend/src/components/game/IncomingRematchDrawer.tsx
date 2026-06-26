'use client';

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { FaChessKnight } from "react-icons/fa";

interface IncomingRematchDrawerProps {
  incomingRematch: {
    challenger_name: string;
    wager: number;
    double_stakes: boolean;
  };
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingRematchDrawer({
  incomingRematch,
  onAccept,
  onDecline,
}: IncomingRematchDrawerProps) {
  const tg = useTranslations('Game');

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-6 pointer-events-auto modal-backdrop">
      {/* Backdrop with visual blur & dim */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onDecline}
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        style={{ touchAction: 'none' }}
      />
      
      {/* Center Pop-Up Dialog Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 15 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 15 }} 
        transition={{ type: "spring", damping: 25, stiffness: 380 }}
        className="relative w-full max-w-[290px] bg-[#FFFFFF]/95 dark:bg-[#0A0A0A]/90 border border-zinc-200/50 dark:border-zinc-800/40 rounded-3xl p-5 shadow-[0_24px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_24px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col items-center text-center space-y-4"
      >
        {/* Brand/Chess icon badge */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_2px_8px_rgba(245,158,11,0.08)]">
          <FaChessKnight className="text-amber-500 text-xl" />
        </div>

        {/* Text Headers */}
        <div className="space-y-1.5 w-full">
          <h3 className="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-[0.2em]">
            {tg('rematch_dialog_title')}
          </h3>
          <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed px-1">
            {tg('challenger_offered_rematch', { name: incomingRematch.challenger_name })}
          </p>
        </div>

        {/* Proposed Wager Detail Box */}
        <div className="w-full bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl py-3 px-4 border border-zinc-200/50 dark:border-zinc-800/50 text-center shadow-inner-glow">
          <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-0.5">
            {tg('proposed_wager')}
          </span>
          <span className="text-xl font-black text-zinc-800 dark:text-zinc-200">
            ${((incomingRematch.wager) / 100).toFixed(2)} USDT
          </span>
          {incomingRematch.double_stakes && (
            <span className="text-[9px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest block mt-0.5 animate-pulse">
              {tg('double_stakes_active')}
            </span>
          )}
        </div>

        {/* Accept/Reject Buttons */}
        <div className="w-full flex gap-2.5 pt-1">
          {/* Reject button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onDecline}
            className="flex-1 py-3 rounded-xl border border-red-500/20 dark:border-red-500/25 bg-red-500/10 text-red-500 text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Reject ❌</span>
          </motion.button>
          
          {/* Accept button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onAccept}
            className="flex-1 py-3 rounded-xl bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(245,158,11,0.2)]"
          >
            <span>Accept ✅</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
