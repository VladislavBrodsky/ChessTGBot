'use client';

import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { FaChessKnight, FaCheck, FaTimes, FaRegClock } from "react-icons/fa";
import { useNavbarHideWhileMounted } from "@/context/NavbarContext";

interface IncomingRematchDrawerProps {
  incomingRematch: {
    challenger_name: string;
    wager: number;
    double_stakes: boolean;
  };
  timeControl?: number;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingRematchDrawer({
  incomingRematch,
  timeControl = 600,
  onAccept,
  onDecline,
}: IncomingRematchDrawerProps) {
  const tg = useTranslations('Game');
  useNavbarHideWhileMounted();

  // The result modal is also a body-level portal. Render the incoming offer in
  // the same top-level stacking context so it cannot be hidden by that modal.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-6 pointer-events-auto modal-backdrop">
      {/* Backdrop with visual blur & dim */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onDecline}
        className="absolute inset-0 bg-black/80" 
        style={{ touchAction: 'none' }}
      />
      
      {/* Center Pop-Up Dialog Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 15 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 15 }} 
        transition={{ type: "spring", damping: 25, stiffness: 380 }}
        className="relative w-full max-w-[290px] bg-brand-surface border border-brand-border-opacity-10 rounded-3xl p-5 shadow-premium flex flex-col items-center text-center space-y-4 transform-gpu will-change-transform"
      >
        {/* Brand/Chess icon badge */}
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_2px_8px_rgba(16,185,129,0.08)]">
          <FaChessKnight className="text-emerald-500 text-xl" />
        </div>

        {/* Text Headers */}
        <div className="space-y-1.5 w-full">
          <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
            {tg('rematch_dialog_title')}
          </h3>
          <p className="text-[12px] font-bold text-brand-primary leading-relaxed px-1">
            {tg('challenger_offered_rematch', { name: incomingRematch.challenger_name })}
          </p>
        </div>

        {/* Proposed Wager & Settings Detail Box */}
        <div className="w-full bg-brand-bg-opacity-5 rounded-2xl py-3.5 px-4 border border-brand-border-opacity-10 text-center shadow-inner-glow space-y-3">
          <div>
            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest block mb-0.5">
              {tg('proposed_wager')}
            </span>
            <span className="text-lg font-black text-brand-primary">
              ${((incomingRematch.wager) / 100).toFixed(2)} USDT
            </span>
            {incomingRematch.double_stakes && (
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mt-0.5 animate-pulse">
                {tg('double_stakes_active')}
              </span>
            )}
          </div>
          <div className="border-t border-brand-border-opacity-10 pt-2.5 flex items-center justify-between px-2">
            <div className="flex items-center gap-1 text-[10px] font-bold text-brand-muted uppercase tracking-widest">
              <FaRegClock className="text-[10px]" />
              <span>Time Control</span>
            </div>
            <span className="text-[11px] font-black text-brand-primary">
              {Math.round(timeControl / 60)} min
            </span>
          </div>
        </div>

        {/* Accept/Reject Buttons */}
        <div className="w-full flex gap-2.5 pt-1">
          {/* Reject button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onDecline}
            className="flex-1 py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <FaTimes className="text-[10px]" />
            <span>{tg('reject')}</span>
          </motion.button>
          
          {/* Accept button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onAccept}
            className="flex-1 py-3 rounded-xl bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(245,158,11,0.2)]"
          >
            <FaCheck className="text-[10px]" />
            <span>{tg('accept')}</span>
          </motion.button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
