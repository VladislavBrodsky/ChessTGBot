'use client';

import { motion } from "framer-motion";
import { FaHistory, FaArrowDown, FaArrowUp, FaRobot, FaGamepad } from "react-icons/fa";
import { useTranslations } from "next-intl";

interface Transaction {
  id: number;
  type: string;
  amount: number;
  fee: number;
  status: string;
  reference_id: string;
  created_at: string;
}

interface TransactionLedgerProps {
  loading: boolean;
  transactions: Transaction[];
}

const TransactionSkeleton = () => (
  <div className="w-full flex flex-col space-y-2">
    {[1, 2, 3].map((n) => (
      <div key={n} className="w-full p-3 rounded-xl glass-panel border border-brand-border-opacity-5 flex items-center justify-between bg-brand-surface animate-pulse">
        <div className="flex items-center space-x-3 w-2/3">
          <div className="w-8 h-8 rounded-lg bg-brand-bg-opacity-5 border border-brand-border-opacity-5 shrink-0" />
          <div className="flex flex-col space-y-1.5 w-full">
            <div className="h-2.5 bg-brand-primary opacity-10 rounded w-1/3" />
            <div className="h-1.5 bg-brand-primary opacity-5 rounded w-1/2" />
          </div>
        </div>
        <div className="h-3 bg-brand-primary opacity-10 rounded w-12" />
      </div>
    ))}
  </div>
);

export default function TransactionLedger({ loading, transactions }: TransactionLedgerProps) {
  const tw = useTranslations('Wallet');

  return (
    <div className="w-full flex flex-col space-y-3 pt-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2 text-brand-primary opacity-80">
          <FaHistory className="text-xs" />
          <h3 className="text-xs font-black uppercase tracking-widest">{tw('ledger')}</h3>
        </div>
        <span className="text-[9px] font-bold text-brand-primary opacity-40 uppercase tracking-widest">{tw('sorted_recent')}</span>
      </div>

      {loading ? (
        <TransactionSkeleton />
      ) : transactions.length === 0 ? (
        <div className="w-full glass-panel rounded-xl p-8 text-center text-xs font-bold text-brand-primary opacity-30 uppercase tracking-widest">
          {tw('no_entries')}
        </div>
      ) : (
        <div className="w-full flex flex-col space-y-2 max-h-72 overflow-y-auto">
          {transactions.map((tx) => {
            const isPositive = tx.amount > 0;
            const isZero = tx.amount === 0;
            const formattedAmt = `$${(Math.abs(tx.amount) / 100).toFixed(2)}`;
            const formattedFee = tx.fee > 0 ? `($${(tx.fee / 100).toFixed(2)} fee)` : "";
            
            return (
              <motion.div 
                key={tx.id}
                layout
                whileHover={{ scale: 1.015, y: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="w-full p-3 rounded-2xl glass-panel border border-brand-border-opacity-5 flex items-center justify-between bg-brand-surface shadow-sm hover:shadow-md transition-all select-none"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 border border-brand-border-opacity-5 shadow-inner ${
                    tx.type === 'game_against_ai' || tx.type === 'game_free_pvp'
                      ? 'bg-brand-bg-opacity-10 text-brand-primary opacity-80' :
                    tx.type === 'game_win' || tx.type === 'referral_commission' || tx.type === 'subscription_commission' || tx.type === 'refund' || tx.type === 'game_refund'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    tx.type === 'deposit' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' :
                    tx.type === 'game_wager' || tx.type === 'game_rake' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                    'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {tx.type === 'game_against_ai' ? <FaRobot className="text-[13px]" /> :
                     tx.type === 'game_free_pvp' ? <FaGamepad className="text-[13px]" /> :
                     isPositive ? <FaArrowDown className="text-[11px]" /> : <FaArrowUp className="text-[11px]" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10.5px] font-black uppercase tracking-wide text-brand-primary truncate">
                      {tx.type === 'deposit' ? tw('tx_deposit') :
                      tx.type === 'withdrawal' ? tw('tx_withdrawal') :
                      tx.type === 'game_against_ai' ? (tw.has('tx_game_against_ai') ? tw('tx_game_against_ai') : 'Game against AI') :
                      tx.type === 'game_free_pvp' ? (tw.has('tx_game_free_pvp') ? tw('tx_game_free_pvp') : 'Free game against other players') :
                      (tx.type === 'game_wager' || tx.type === 'game_win' || tx.type === 'game_refund' || tx.type === 'refund') ? (tw.has('tx_game_paid') ? tw('tx_game_paid') : 'Paid game against other players') :
                      tx.type === 'referral_commission' ? tw('tx_referral') :
                      tx.type === 'subscription_commission' ? tw('tx_subscription') :
                      tx.type === 'game_rake' ? tw('tx_rake') : 
                      tx.type}
                    </span>
                    <span className="text-[8px] font-bold text-brand-primary opacity-45 uppercase tracking-widest mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className={`text-[11px] font-black ${isZero ? 'text-brand-primary opacity-60' : isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {isZero ? '' : isPositive ? '+' : '-'}{formattedAmt}
                  </span>
                  {tx.fee > 0 && (
                    <span className="text-[7.5px] font-bold text-brand-primary opacity-40 uppercase tracking-widest mt-0.5">
                      {formattedFee}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
