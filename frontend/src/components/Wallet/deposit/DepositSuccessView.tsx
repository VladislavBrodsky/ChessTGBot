'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';

export interface DepositSuccessViewProps {
  showConfetti: boolean;
  windowDimensions: { width: number; height: number };
  successMessage: string;
  walletBalance?: number;
  onClose: () => void;
}

export function DepositSuccessView({
  showConfetti,
  windowDimensions,
  successMessage,
  walletBalance,
  onClose,
}: DepositSuccessViewProps) {
  return (
    <div className="bottom-drawer-backdrop z-[100] flex items-center justify-center p-4">
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
        />
      )}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-[24px] p-6 text-center relative border border-emerald-500/30 bg-brand-void shadow-2xl space-y-4 transform-gpu will-change-transform"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto text-3xl font-semibold animate-pulse">
          ✓
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-emerald-500 normal-case tracking-normal animate-pulse-slow">
            Top-Up Successful!
          </h2>
          <p className="text-sm text-brand-muted font-bold normal-case tracking-normal">
            {successMessage}
          </p>
        </div>
        <div className="p-3 bg-brand-surface/40 border border-brand-border-opacity-5 rounded-2xl">
          <span className="text-caption font-semibold normal-case tracking-normal text-brand-primary opacity-45">
            Updated Balance
          </span>
          <div className="text-2xl font-semibold text-emerald-400 mt-1">
            {typeof walletBalance === 'number' && Number.isFinite(walletBalance) ? `$${(walletBalance / 100).toFixed(2)}` : '—'} USDT
          </div>
        </div>
        <button type="button"
          onClick={onClose}
          className="ui-tap-target w-full py-3 rounded-xl bg-emerald-500 text-brand-void text-sm font-semibold normal-case tracking-normal shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          Acknowledge & Close
        </button>
      </motion.div>
    </div>
  );
}
