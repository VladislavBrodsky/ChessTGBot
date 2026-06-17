'use client';

import { motion } from "framer-motion";
import { FaCoins, FaWallet } from "react-icons/fa";
import { useTranslations } from "next-intl";

interface CyberCardProps {
  balance: number;
  walletAddress: string;
}

export default function CyberCard({ balance, walletAddress }: CyberCardProps) {
  const tw = useTranslations('Wallet');

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full relative overflow-hidden rounded-2xl p-6 glass-panel border border-brand-border-opacity-20 bg-cyber-card shadow-2xl flex flex-col justify-between h-48"
    >
      {/* Matrix cyber grid overlay */}
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
      
      {/* Card Top */}
      <div className="flex justify-between items-start z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-brand-primary opacity-40 uppercase tracking-widest mb-0.5">{tw('connected_status')}</span>
          <div className="flex items-center space-x-2">
            <FaCoins className="text-brand-primary text-sm animate-pulse" />
            <span className="text-xs font-bold text-brand-primary opacity-80 uppercase tracking-wider">{tw('usdt_balance')}</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-brand-bg-opacity-10 flex items-center justify-center border border-brand-border-opacity-20">
          <FaWallet className="text-brand-primary text-sm" />
        </div>
      </div>

      {/* Card Middle Balance */}
      <div className="z-10 my-auto">
        <h2 className="text-3xl font-black text-brand-primary tracking-tighter uppercase">
          ${(balance / 100).toFixed(2)}
        </h2>
      </div>

      {/* Card Bottom Linked Wallet */}
      <div className="flex justify-between items-center z-10 pt-2 border-t border-brand-border-opacity-5">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute" />
          <span className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-widest">
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : tw('no_wallet')}
          </span>
        </div>
        <span className="text-[9px] font-black text-brand-primary opacity-20 uppercase tracking-widest">{tw('version')}</span>
      </div>
    </motion.div>
  );
}
