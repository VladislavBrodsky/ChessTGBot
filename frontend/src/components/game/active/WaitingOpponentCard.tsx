'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaChessKnight, FaCopy, FaCheck, FaShareAlt } from 'react-icons/fa';

export interface WaitingOpponentCardProps {
  gameState: any;
  userId?: number | null;
  gameId: string;
  inviteLink: string;
  copied: boolean;
  onCopyInvite: () => void;
  onShareInvite: () => void;
  onAbortGame: () => void;
  tWaitingOpponentTitle: string;
  tShareInviteHint: string;
  tWagerTier: string;
  tFreeMatch: string;
  tTimeControl: string;
  tInviteOnTelegram: string;
  tCancelRefundMatch: string;
  tWaitingKeepOpen: string;
}

export function WaitingOpponentCard({
  gameState,
  userId,
  inviteLink,
  copied,
  onCopyInvite,
  onShareInvite,
  onAbortGame,
  tWaitingOpponentTitle,
  tShareInviteHint,
  tWagerTier,
  tFreeMatch,
  tTimeControl,
  tInviteOnTelegram,
  tCancelRefundMatch,
  tWaitingKeepOpen,
}: WaitingOpponentCardProps) {
  return (
    <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl flex flex-col items-center gap-6 mx-auto px-1 animate-fade-in">
      <div className="w-full glass-panel p-6 rounded-3xl border border-brand-border-opacity-10 bg-brand-surface flex flex-col items-center text-center shadow-premium relative overflow-hidden">
        {/* Ambient corner backlights */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)] rounded-full -mr-6 -mt-6 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,transparent_70%)] rounded-full -ml-6 -mb-6 pointer-events-none" />

        {/* Radar / Sonar pulse loading widget */}
        <div className="relative w-28 h-28 flex items-center justify-center rounded-full border border-brand-border-opacity-10 bg-brand-void mb-5 shadow-inner-glow">
          <div className="absolute inset-0 rounded-full border border-brand-primary/20 animate-ping opacity-40" />
          <div className="absolute w-20 h-20 rounded-full border border-brand-primary/10 animate-pulse opacity-60" />
          <div className="absolute w-14 h-14 rounded-full bg-brand-surface border border-brand-border-opacity-10 flex items-center justify-center shadow-premium">
            <FaChessKnight className="text-xl text-brand-primary animate-bounce" />
          </div>
        </div>

        <div className="flex flex-col space-y-1.5 mb-6">
          <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest animate-pulse">
            {tWaitingOpponentTitle}
          </span>
          <span className="text-sm font-bold text-brand-primary uppercase tracking-wide">
            {tShareInviteHint}
          </span>
        </div>

        {/* Match details card */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6 bg-brand-void/50 border border-brand-border-opacity-5 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">
              {tWagerTier}
            </span>
            <span className="text-xs font-black text-emerald-400">
              {gameState?.bid_amount > 0 
                ? `$${(gameState.bid_amount / 100).toFixed(2)} USDT` 
                : tFreeMatch}
            </span>
          </div>
          <div className="flex flex-col items-end text-right border-l border-brand-border-opacity-10 pl-3">
            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">
              {tTimeControl}
            </span>
            <span className="text-xs font-black text-amber-400 uppercase">
              {gameState?.time_control_seconds >= 60 
                ? `${gameState.time_control_seconds / 60} MIN` 
                : `${gameState?.time_control_seconds || 600}s`}
            </span>
          </div>
        </div>

        {/* Share link widget */}
        <div className="w-full space-y-3">
          <div className="relative w-full flex items-center bg-brand-void/80 border border-brand-border-opacity-10 rounded-xl px-3.5 py-3 shadow-inner-glow overflow-hidden">
            <span className="text-[10px] font-mono text-brand-muted truncate select-all pr-8 w-full text-left">
              {inviteLink}
            </span>
            <button
              onClick={onCopyInvite}
              className="absolute right-2 text-brand-muted hover:opacity-100 p-2 cursor-pointer transition-all duration-150 active:scale-90"
            >
              {copied ? <FaCheck className="text-emerald-400 text-[11px]" /> : <FaCopy className="text-[11px]" />}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 w-full">
            <motion.button
              whileTap={{ scale: 0.985 }}
              onClick={onShareInvite}
              className="w-full bg-brand-primary text-brand-void py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-black tracking-[0.2em] cursor-pointer shadow-neon"
            >
              <FaShareAlt size={11} />
              <span>{tInviteOnTelegram}</span>
            </motion.button>

            {gameState?.white_player_id === userId && (
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={onAbortGame}
                className="w-full bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 hover:bg-brand-rose-opacity-20 text-rose-400 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-black tracking-widest cursor-pointer transition-all shadow-sm"
              >
                <span>{tCancelRefundMatch}</span>
              </motion.button>
            )}
          </div>
        </div>

      </div>
      
      <div className="w-full text-center px-4">
        <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wider leading-relaxed">
          {tWaitingKeepOpen}
        </p>
      </div>
    </div>
  );
}
