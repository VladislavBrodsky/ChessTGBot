'use client';

import { motion } from "framer-motion";
import { FaHistory, FaArrowDown, FaArrowUp } from "react-icons/fa";
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
            const formattedAmt = `$${(Math.abs(tx.amount) / 100).toFixed(2)}`;
            const formattedFee = tx.fee > 0 ? `($${(tx.fee / 100).toFixed(2)} fee)` : "";
            
            return (
              <motion.div 
                key={tx.id}
                layout
                className="w-full p-3 rounded-xl glass-panel border border-brand-border-opacity-5 flex items-center justify-between bg-brand-surface"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                    tx.type === 'game_win' ? 'bg-brand-emerald-opacity-10 text-emerald-500' :
                    tx.type === 'deposit' ? 'bg-brand-cyan-opacity-10 text-cyan-500' :
                    tx.type === 'game_wager' ? 'bg-brand-rose-opacity-10 text-rose-500' :
                    'bg-brand-amber-opacity-10 text-amber-500'
                  }`}>
                    {isPositive ? <FaArrowDown /> : <FaArrowUp />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide text-brand-primary">
                      {tx.type === 'deposit' ? tw('tx_deposit') :
                      tx.type === 'withdrawal' ? tw('tx_withdrawal') :
                      tx.type === 'game_wager' ? tw('tx_wager') :
                      tx.type === 'game_win' ? tw('tx_win') : tx.type}
                    </span>
                    <span className="text-[9px] font-bold text-brand-primary opacity-40 uppercase tracking-widest">
                      {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[12px] font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? '+' : '-'}{formattedAmt}
                  </span>
                  {tx.fee > 0 && (
                    <span className="text-[8px] font-bold text-brand-primary opacity-40 uppercase tracking-widest">
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
