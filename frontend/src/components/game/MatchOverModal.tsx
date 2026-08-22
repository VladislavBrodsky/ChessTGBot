'use client';

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaRedo, FaShareAlt, FaTrophy, FaShieldAlt, FaBalanceScale } from "react-icons/fa";
import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { telegramHaptic } from "@/lib/telegram";

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
  xpGained?: number;
  isBotGame?: boolean;
}

export default function MatchOverModal({
  matchResultLabel,
  eloChange,
  netPayout,
  wagerAmount,
  rematchStatus,
  onShowRematchChoice,
  onShareGame,
  newElo,
  copied = false,
  xpGained,
  isBotGame = false,
}: MatchOverModalProps) {
  const locale = useLocale();
  const tg = useTranslations('Game');

  const [animatedElo, setAnimatedElo] = useState<number>(0);
  const [animatedPayout, setAnimatedPayout] = useState<number>(0);

  // Extract ELO change number
  const changeVal = parseInt(eloChange.replace('+', '')) || 0;
  const startElo = (newElo ?? 1000) - changeVal;

  useEffect(() => {
    // ELO rollup animation
    let eloStartTimestamp: number | null = null;
    const duration = 1200; // 1.2s

    const stepElo = (timestamp: number) => {
      if (!eloStartTimestamp) eloStartTimestamp = timestamp;
      const progress = Math.min((timestamp - eloStartTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setAnimatedElo(Math.round(startElo + eased * changeVal));
      if (progress < 1) {
        requestAnimationFrame(stepElo);
      }
    };
    requestAnimationFrame(stepElo);

    // Payout rollup animation
    let payoutStartTimestamp: number | null = null;
    const stepPayout = (timestamp: number) => {
      if (!payoutStartTimestamp) payoutStartTimestamp = timestamp;
      const progress = Math.min((timestamp - payoutStartTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPayout(eased * netPayout);
      if (progress < 1) {
        requestAnimationFrame(stepPayout);
      }
    };
    if (netPayout > 0) {
      requestAnimationFrame(stepPayout);
    } else {
      setAnimatedPayout(0);
    }
  }, [newElo, eloChange, netPayout, startElo, changeVal]);

  // Determine game outcome type for themed styling
  const labelLower = matchResultLabel.toLowerCase();
  const isWin = labelLower.includes('victory') || labelLower.includes('won') || labelLower.includes('побед');
  const isLoss = labelLower.includes('defeat') || labelLower.includes('lost') || labelLower.includes('пораж');

  // Theme configuration mapping
  const theme = isWin 
    ? {
        ambientGlow: "bg-emerald-500/10",
        radialBorder: "border-emerald-500/30",
        shadow: "shadow-[0_0_50px_rgba(16,185,129,0.25)]",
        titleClass: "text-emerald-400 font-black tracking-widest uppercase drop-shadow-[0_2px_12px_rgba(16,185,129,0.3)]",
        icon: <FaTrophy className="text-5xl text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-bounce mt-1" />
      }
    : isLoss 
      ? {
          ambientGlow: "bg-rose-500/10",
          radialBorder: "border-rose-500/30",
          shadow: "shadow-[0_0_50px_rgba(239,68,68,0.25)]",
          titleClass: "text-rose-400 font-black tracking-widest uppercase drop-shadow-[0_2px_12px_rgba(239,68,68,0.3)]",
          icon: <FaShieldAlt className="text-5xl text-rose-500/70 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)] rotate-12 mt-1" />
        }
      : {
          ambientGlow: "bg-cyan-500/10",
          radialBorder: "border-cyan-500/30",
          shadow: "shadow-[0_0_50px_rgba(6,182,212,0.25)]",
          titleClass: "text-cyan-400 font-black tracking-widest uppercase drop-shadow-[0_2px_12px_rgba(6,182,212,0.3)]",
          icon: <FaBalanceScale className="text-5xl text-cyan-400/80 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)] mt-1" />
        };

  // Rendered through a portal to document.body: a `fixed` overlay inside the
  // page tree silently scopes to any transformed/filtered ancestor (the trap
  // that once broke the leaderboard modal). Presence context crosses portals,
  // so AnimatePresence exit animations still work.
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85">
      {/* Backdrop fading in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0" style={{ touchAction: 'none' }}
      />

      {/* Full-Screen Premium Modal container */}
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        transition={{ type: "spring", duration: 0.4 }}
        className={`relative overflow-hidden w-full max-w-[300px] bg-brand-surface border rounded-[32px] p-6 flex flex-col items-center text-center space-y-6 z-10 transform-gpu will-change-transform ${theme.radialBorder} ${theme.shadow}`}
      >
        {/* Ambient neon radial glows in background */}
        <div className={`absolute -top-20 -left-20 w-44 h-44 rounded-full ${theme.ambientGlow} blur-3xl pointer-events-none`} />
        <div className={`absolute -bottom-20 -right-20 w-44 h-44 rounded-full ${theme.ambientGlow} blur-3xl pointer-events-none`} />

        {/* Visual Outcome Header */}
        <div className="flex flex-col items-center space-y-1 relative z-10 w-full mt-2">
          <div className="mb-2">
            {theme.icon}
          </div>
          <h2 className={`text-xl ${theme.titleClass}`}>
            {matchResultLabel}
          </h2>
          <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.25em]">
            {tg('verification_complete')}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="w-full bg-brand-void/40 rounded-2xl p-4.5 border border-brand-border-opacity-10 space-y-3.5 shadow-inner-glow relative z-10">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest">{tg('global_elo')}</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-xs font-black text-brand-primary tracking-wider">{animatedElo} ELO</span>
              <span className={`text-[10px] font-black tracking-widest ${changeVal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {changeVal >= 0 ? `+${changeVal}` : changeVal}
              </span>
            </div>
          </div>
          
          <div className="h-px w-full bg-brand-border-opacity-5" />
          
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest">{tg('net_payout')}</span>
            <div className="flex flex-col items-end">
              <span className={`text-xs font-black tracking-wider font-mono ${netPayout > 0 ? 'text-emerald-400' : 'text-brand-muted'}`}>
                {netPayout > 0 ? `+$${animatedPayout.toFixed(2)}` : '$0.00'} USDT
              </span>
              {wagerAmount > 0 && isWin && (
                <span className="text-[10px] text-brand-muted uppercase tracking-widest mt-0.5">
                  {tg('platform_rake')} (3%)
                </span>
              )}
            </div>
          </div>

          {xpGained !== undefined && xpGained > 0 && (
            <>
              <div className="h-px w-full bg-brand-border-opacity-5" />
              <div className="flex justify-between items-center animate-fade-in">
                <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest">
                  {tg('xp_reward')}
                </span>
                <span className="text-xs font-black text-amber-400 tracking-wider font-mono flex items-center gap-1">
                  +{xpGained} XP ⭐
                </span>
              </div>
            </>
          )}
        </div>

        {/* Buttons / Actions */}
        <div className="w-full flex flex-col gap-2.5 relative z-10">
          {rematchStatus === 'waiting' ? (
            <div className="w-full bg-brand-void py-3.5 rounded-2xl flex items-center justify-center gap-3 text-[10px] uppercase font-black tracking-[0.2em] border border-brand-border text-brand-muted animate-pulse select-none">
              <span>{isBotGame ? tg('creating_match') : tg('pending_opponent')}</span>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { telegramHaptic('selection'); onShowRematchChoice(); }}
              className="w-full bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-[10px] uppercase font-black tracking-[0.2em] cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.45)] transition-all duration-300"
            >
              <span>{tg('revenge_match')}</span>
            </motion.button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <Link href={`/${locale}/game`} className="w-full" onClick={() => telegramHaptic('selection')}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-brand-surface hover:bg-brand-bg-opacity-5 border border-brand-border-opacity-10 py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-sm transition-all"
              >
                <FaRedo size={10} className="text-brand-muted" />
                <span>{tg('to_lobby')}</span>
              </motion.button>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { telegramHaptic('selection'); onShareGame(); }}
              className="w-full bg-brand-surface hover:bg-brand-bg-opacity-5 border border-brand-border-opacity-10 py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-sm transition-all"
            >
              <FaShareAlt size={10} className="text-brand-muted" />
              <span>{copied ? tg('copied_success') : tg('share_ledger')}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
