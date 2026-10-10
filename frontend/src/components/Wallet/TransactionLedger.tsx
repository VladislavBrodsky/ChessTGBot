'use client';

import React from "react";
import { FaArrowDown, FaArrowUp, FaRobot, FaGamepad, FaHistory } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeader } from "@/components/ui/PageHeader";

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

function BalanceHistoryChart({ transactions, balance }: { transactions: Transaction[]; balance: number }) {
  const tw = useTranslations('Wallet');
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
    <div className="ui-hero-card w-full rounded-2xl p-3.5 space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="ui-eyebrow">
          {tw('balance_trend')}
        </span>
        <span className="text-caption font-semibold tabular-nums text-brand-success">
          ${minAmt.toFixed(2)} – ${maxAmt.toFixed(2)}
        </span>
      </div>

      <div className="w-full relative px-1 py-1">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={tw('balance_trend')} className="w-full" style={{ height: HEIGHT }}>
          <defs>
            <linearGradient id="walletChartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-success)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--brand-success)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#walletChartGrad)" />
          <path d={pathD} fill="none" stroke="var(--brand-success)" strokeWidth="2" strokeLinecap="round" />
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === pts.length - 1 ? 3.5 : 2}
              fill={i === pts.length - 1 ? 'var(--brand-success)' : 'var(--text-muted)'}
              stroke="var(--bg-surface)"
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
    <section aria-labelledby="tx-history-heading" className="w-full space-y-3">
      {/* Ledger Header */}
      <SectionHeader id="tx-history-heading" title={tw('ledger')} />

      {/* Sparkline chart */}
      {!error && balance !== undefined && transactions && transactions.length > 0 && (
        <BalanceHistoryChart transactions={transactions} balance={balance} />
      )}

      {/* Ledger List */}
      {loading && transactions.length === 0 ? (
        <SkeletonList count={4} />
      ) : error && transactions.length === 0 ? (
        <ErrorState
          title={tw('tx_load_failed')}
          onRetry={onRetry}
          retryLabel={tw('retry_btn')}
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<FaHistory className="h-6 w-6 text-brand-muted" />}
          title={tw('no_entries')}
        />
      ) : (
        <ol role="list" className="w-full flex flex-col space-y-2 list-none m-0 p-0">
          {transactions.map((tx) => {
            const isPositive = tx.amount > 0;
            const isZero = tx.amount === 0;
            const formattedAmt = `$${(Math.abs(tx.amount) / 100).toFixed(2)}`;
            const formattedFee = tx.fee > 0 ? `($${(tx.fee / 100).toFixed(2)} fee)` : "";

            return (
              <li 
                key={tx.id}
                className="ui-list-row list-item-contain"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`ui-icon-tile ${
                    tx.type === 'game_against_ai' || tx.type === 'game_free_pvp' || isZero
                      ? '' :
                    isPositive
                      ? 'ui-icon-tile--success' :
                    tx.type === 'deposit'
                      ? 'ui-icon-tile--info' :
                    'ui-icon-tile--danger'
                  }`}>
                    {tx.type === 'game_against_ai' ? <FaRobot className="text-sm" aria-hidden="true" /> :
                     tx.type === 'game_free_pvp' ? <FaGamepad className="text-sm" aria-hidden="true" /> :
                     isPositive ? <FaArrowDown className="text-sm" aria-hidden="true" /> : <FaArrowUp className="text-sm" aria-hidden="true" />}
                  </span>

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-brand-primary">
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
                    <span className="text-caption text-brand-muted">
                      {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className={`text-sm font-semibold tabular-nums ${
                    isZero ? 'text-brand-muted' :
                    isPositive ? 'text-brand-success' :
                    'text-brand-danger'
                  }`}>
                    {isZero ? '$0.00' : `${isPositive ? '+' : '-'}${formattedAmt}`}
                  </span>
                  {formattedFee && (
                    <span className="text-caption text-brand-muted">
                      {formattedFee}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
