'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { FaRedo, FaShareAlt } from "react-icons/fa";
import { useLocale, useTranslations } from "next-intl";

interface MatchOverModalProps {
  matchResultLabel: string;
  resultColor: string;
  eloChange: string;
  netPayout: number;
  wagerAmount: number;
  rematchStatus: 'idle' | 'offered_by_me' | 'waiting';
  onShowRematchChoice: () => void;
  onShareGame: () => void;
  newElo?: number;
  copied?: boolean;
}

export default function MatchOverModal({
  matchResultLabel,
  resultColor,
  eloChange,
  netPayout,
  wagerAmount,
  rematchStatus,
  onShowRematchChoice,
  onShareGame,
  newElo,
  copied = false,
}: MatchOverModalProps) {
  const locale = useLocale();
  const tg = useTranslations('Game');

  return (
    <div className="bottom-drawer-backdrop z-[100]">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[rgba(0,0,0,0.4)]"
      />

      {/* Modal Content as slide-up drawer */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="bottom-drawer-sheet relative z-10"
      >
        <div className="bottom-drawer-handle" />
        
        <div className="flex flex-col items-center text-center mt-2">
          <h2 className={`text-2xl font-black uppercase tracking-widest mb-1 ${resultColor}`}>
            {matchResultLabel}
          </h2>
          <p className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-[0.3em] mb-6">
            {tg('verification_complete')}
          </p>
        </div>

        <div className="w-full bg-brand-surface rounded-2xl p-5 border border-brand-border-opacity-10 mb-2 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-brand-primary opacity-60 uppercase tracking-widest">{tg('global_elo')}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-black text-brand-primary tracking-widest">{newElo ?? 1000}</span>
              <span className={`text-[10px] font-black tracking-widest text-brand-primary`}>
                {eloChange}
              </span>
            </div>
          </div>
          <div className="h-px w-full bg-brand-border-opacity-10" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-brand-primary opacity-60 uppercase tracking-widest">{tg('net_payout')}</span>
            <div className="flex flex-col items-end">
              <span className="text-sm font-black tracking-widest text-brand-primary">
                {netPayout > 0 ? '+' : ''}{netPayout.toFixed(2)} USDT
              </span>
              {wagerAmount > 0 && matchResultLabel === tg('victory_secured') && (
                <span className="text-[8px] text-brand-primary opacity-40 uppercase tracking-widest mt-1">
                  {tg('platform_rake')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          {rematchStatus === 'waiting' ? (
            <div className="w-full bg-brand-surface py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] border border-brand-border-opacity-10 text-brand-primary animate-pulse select-none">
              <span>Pending Opponent...</span>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onShowRematchChoice}
              className="w-full bg-brand-primary text-brand-void py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] cursor-pointer shadow-sm"
            >
              <span>{tg('revenge_match')}</span>
            </motion.button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Link href={`/${locale}/home`} className="w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full action-button py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] cursor-pointer shadow-sm"
              >
                <FaRedo />
                <span>{tg('return_hub')}</span>
              </motion.button>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onShareGame}
              className="w-full glass-panel py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest cursor-pointer shadow-sm"
            >
              <FaShareAlt className="text-brand-primary opacity-60" />
              <span>{copied ? tg('copied_success') : tg('share_ledger')}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
