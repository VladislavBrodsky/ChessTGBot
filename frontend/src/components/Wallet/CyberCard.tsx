'use client';

import { motion } from "framer-motion";
import { FaCoins, FaWallet, FaRedoAlt } from "react-icons/fa";
import { useTranslations } from "next-intl";

interface CyberCardProps {
  balance: number;
  walletAddress: string;
  /** Last balance fetch failed — show "unavailable" instead of a false $0.00. */
  balanceError?: boolean;
  onRetry?: () => void;
}

export default function CyberCard({ balance, walletAddress, balanceError = false, onRetry }: CyberCardProps) {
  const tw = useTranslations('Wallet');

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full relative overflow-hidden rounded-3xl p-6 glass-panel border border-brand-border-opacity-10 bg-cyber-card shadow-premium flex flex-col justify-between h-48 select-none"
    >
      {/* Ambient glowing blobs */}
      <motion.div 
        animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }} 
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" 
      />
      <motion.div 
        animate={{ opacity: [0.05, 0.15, 0.05], scale: [1, 1.15, 1] }} 
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none" 
      />

      {/* Card Top */}
      <div className="flex justify-between items-start z-10">
        <div className="flex flex-col">
          {/* Status must reflect the ACTUAL connection state — this card previously
              always said "TON Wallet Connected" while the footer said the opposite. */}
          <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-[0.25em] mb-1.5">
            {walletAddress ? tw('connected_status') : tw('no_wallet')}
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/10">
              <FaCoins className="text-emerald-500 text-[10px]" />
            </div>
            <span className="text-[10px] font-black text-brand-primary opacity-90 uppercase tracking-widest">{tw('usdt_balance')}</span>
          </div>
        </div>

        {/* Right Corner indicator (pulsing green dot if connected, red if not) */}
        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-brand-bg-opacity-5 border border-brand-border-opacity-10 shadow-sm shrink-0">
          <FaWallet size={11} className="text-brand-primary opacity-60" />
          <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${walletAddress ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'} animate-pulse`} />
        </div>
      </div>

      {/* Card Middle Balance */}
      <div className="z-10 my-auto flex flex-col justify-center">
        {balanceError ? (
          <button
            onClick={onRetry}
            className="flex flex-col items-start gap-1.5 text-left active:scale-95 transition-transform"
            aria-label={tw('balance_unavailable')}
          >
            <div className="flex items-baseline space-x-1.5">
              <span className="text-4xl font-black text-brand-primary opacity-30 tracking-tighter leading-none">— .—</span>
              <span className="text-[10px] font-black text-brand-primary opacity-40 uppercase tracking-widest leading-none">USDT</span>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 uppercase tracking-widest">
              <FaRedoAlt className="text-[10px]" />
              {tw('balance_unavailable')}
            </span>
          </button>
        ) : (
          <div className="flex items-baseline space-x-1.5">
            <span className="text-[20px] font-extrabold text-brand-primary leading-none">$</span>
            <h2 className="text-4xl font-black text-brand-primary tracking-tighter leading-none bg-clip-text">
              {(balance / 100).toFixed(2)}
            </h2>
            <span className="text-[10px] font-black text-brand-primary opacity-40 uppercase tracking-widest leading-none">USDT</span>
          </div>
        )}
      </div>

      {/* Card Bottom Linked Wallet */}
      <div className="flex justify-between items-center z-10 pt-3 border-t border-brand-border-opacity-5">
        <div className="flex items-center space-x-2">
          <span className={`w-1.5 h-1.5 rounded-full ${walletAddress ? 'bg-emerald-500' : 'bg-rose-500'} shrink-0`} />
          <span className="text-[10px] font-black text-brand-primary opacity-60 uppercase tracking-widest font-mono">
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : tw('link_wallet_hint')}
          </span>
        </div>
        <span className="text-[10px] font-black text-brand-primary opacity-20 uppercase tracking-widest">{tw('version')}</span>
      </div>
    </motion.div>
  );
}
