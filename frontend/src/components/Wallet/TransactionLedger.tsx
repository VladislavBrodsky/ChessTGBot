'use client';

import React from "react";
import { FaArrowDown, FaArrowUp, FaRobot, FaGamepad, FaHistory } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

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
  balance?: number;
  /** True when the fetch failed — renders a retry state instead of the
   *  misleading "no entries" empty state. */
  error?: boolean;
  onRetry?: () => void;
}

function BalanceHistoryChart({ transactions, balance = 0 }: { transactions: Transaction[]; balance?: number }) {
  if (!transactions || transactions.length === 0) return null;

  let currentVal = balance;
  const historyPoints: { amount: number; date: string }[] = [];
  
  historyPoints.unshift({
    amount: currentVal / 100,
    date: 'Now'
  });

  for (const tx of transactions) {
    currentVal = currentVal - tx.amount;
    historyPoints.unshift({
      amount: currentVal / 100,
      date: new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
    });
  }

  const maxPoints = historyPoints.slice(-15);

  const WIDTH = 300;
  const HEIGHT = 90;
  const PAD = 8;

  const minAmt = Math.min(...maxPoints.map(p => p.amount));
  const maxAmt = Math.max(...maxPoints.map(p => p.amount));
  const amtRange = maxAmt - minAmt || 0.001;

  const pts = maxPoints.map((p, i) => {
    const x = PAD + (i / (maxPoints.length - 1)) * (WIDTH - PAD * 2);
    const y = PAD + (1 - (p.amount - minAmt) / amtRange) * (HEIGHT - PAD * 2);
    return { x, y, ...p };
  });

  const pathD = pts
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(' ');

  const areaD = `${pathD} L ${pts[pts.length - 1].x},${HEIGHT - PAD} L ${pts[0].x},${HEIGHT - PAD} Z`;

  return (
    <div className="w-full rounded-2xl border border-brand-border bg-brand-surface overflow-hidden p-3.5 space-y-2 mt-1 mb-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest">
          Balance Trend (USDT)
        </span>
        <span className="text-[10px] font-mono text-emerald-400 font-bold">
          ${minAmt.toFixed(2)} - ${maxAmt.toFixed(2)}
        </span>
      </div>

      <div className="w-full relative px-1 py-1">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }}>
          <defs>
            <linearGradient id="walletChartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#walletChartGrad)" />
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === pts.length - 1 ? 3.5 : 2}
              fill={i === pts.length - 1 ? '#10b981' : '#a7f3d0'}
              stroke="#000"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function TransactionLedger({
  loading,
  transactions,
  balance,
  error,
  onRetry
}: TransactionLedgerProps) {
  const tw = useTranslations('Wallet');

  return (
    <div className="w-full space-y-3">
      {/* Ledger Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-black uppercase tracking-wider text-brand-primary flex items-center gap-2">
          <FaHistory className="text-brand-muted text-xs" />
          {tw('tx_history_title')}
        </span>
        {transactions && transactions.length > 0 && (
          <span className="text-[10px] font-bold text-brand-muted">
            {transactions.length} records
          </span>
        )}
      </div>

      {/* Sparkline chart */}
      {!loading && !error && transactions && transactions.length > 0 && (
        <BalanceHistoryChart transactions={transactions} balance={balance} />
      )}

      {/* Ledger List */}
      {loading ? (
        <SkeletonList count={4} />
      ) : error ? (
        <ErrorState
          title={tw('tx_load_failed')}
          onRetry={onRetry}
          retryLabel={tw('retry_btn')}
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<FaHistory className="h-6 w-6 text-brand-muted" />}
          title={tw('no_entries')}
          description="Your deposits, withdrawals, and game settlements will appear here."
        />
      ) : (
        <div className="w-full flex flex-col space-y-2">
          {transactions.map((tx) => {
            const isPositive = tx.amount > 0;
            const isZero = tx.amount === 0;
            const formattedAmt = `$${(Math.abs(tx.amount) / 100).toFixed(2)}`;
            const formattedFee = tx.fee > 0 ? `($${(tx.fee / 100).toFixed(2)} fee)` : "";

            return (
              <div 
                key={tx.id}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-brand-surface border border-brand-border hover:border-brand-border-opacity-20 transition-all"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs shrink-0 border ${
                    tx.type === 'game_against_ai' || tx.type === 'game_free_pvp'
                      ? 'bg-brand-elevated border-brand-border text-brand-muted' :
                    isPositive
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    tx.type === 'deposit'
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                    'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    {tx.type === 'game_against_ai' ? <FaRobot className="text-sm" /> :
                     tx.type === 'game_free_pvp' ? <FaGamepad className="text-sm" /> :
                     isPositive ? <FaArrowDown className="text-xs" /> : <FaArrowUp className="text-xs" />}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-brand-primary truncate">
                      {tx.type === 'deposit' ? tw('tx_deposit') :
                      tx.type === 'withdrawal' ? tw('tx_withdrawal') :
                      tx.type === 'game_against_ai' ? tw('tx_game_against_ai') :
                      tx.type === 'game_free_pvp' ? tw('tx_game_free_pvp') :
                      (tx.type === 'game_wager' || tx.type === 'game_win' || tx.type === 'game_refund' || tx.type === 'refund') ? tw('tx_game_paid') :
                      tx.type === 'referral_commission' ? tw('tx_referral') :
                      tx.type === 'subscription_commission' ? tw('tx_subscription') :
                      tx.type === 'game_rake' ? tw('tx_rake') : 
                      tx.type}
                    </span>
                    <span className="text-[10px] text-brand-muted">
                      {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-3">
                  <span className={`text-xs font-bold font-mono ${isZero ? 'text-brand-muted' : isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isZero ? '' : isPositive ? '+' : '-'}{formattedAmt}
                  </span>
                  {tx.fee > 0 && (
                    <span className="text-[10px] text-brand-muted font-mono">
                      {formattedFee}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
