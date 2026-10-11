'use client';

import React from "react";
import { FaArrowDown, FaArrowUp, FaRobot, FaGamepad, FaHistory } from "react-icons/fa";
import { useTranslations, useLocale } from "next-intl";
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
  /** True when the fetch failed — renders a retry state instead of the
   *  misleading "no entries" empty state. */
  error?: boolean;
  onRetry?: () => void;
}

export default function TransactionLedger({
  loading,
  transactions,
  error,
  onRetry
}: TransactionLedgerProps) {
  const tw = useTranslations('Wallet');
  const locale = useLocale();

  return (
    <section aria-labelledby="tx-history-heading" className="w-full space-y-2">
      {/* Ledger Header */}
      <SectionHeader id="tx-history-heading" title={tw('ledger')} />

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
          {[...transactions].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).map((tx) => {
            const isPositive = tx.amount > 0;
            const isZero = tx.amount === 0;
            const formattedAmt = `$${(Math.abs(tx.amount) / 100).toFixed(2)}`;
            const formattedFee = tx.fee > 0 ? tw('tx_fee', { amount: new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(tx.fee / 100) }) : "";

            return (
              <li 
                key={tx.id}
                className="ui-list-row list-item-contain"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
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
                      <time dateTime={tx.created_at}>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(tx.created_at))}</time>
                    </span>
                    {tx.status !== 'completed' && <span className="text-caption text-brand-muted">{tw(tx.status === 'failed' ? 'tx_failed' : 'tx_pending')}</span>}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 ps-2">
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
