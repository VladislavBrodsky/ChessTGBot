'use client';

import React, { useState } from 'react';
import { FiCreditCard, FiLink } from 'react-icons/fi';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GramBalances } from '@/components/Wallet/GramBalances';
import { Skeleton } from '@/components/ui/Skeleton';
import { telegramHaptic } from '@/lib/telegram';

interface CyberCardProps {
  balance: number;
  walletAddress: string;
  balanceError?: boolean;
  loading?: boolean;
  onRetry?: () => void;
  onConnect?: () => void;
}

/** Platform balance and a linked TON wallet are separate, explicit concepts. */
export default function CyberCard({
  balance,
  walletAddress,
  balanceError = false,
  loading = false,
  onRetry,
  onConnect,
}: CyberCardProps) {
  const tw = useTranslations('Wallet');
  const tc = useTranslations('Common');
  const [copied, setCopied] = useState(false);

  const handleCopyWallet = () => {
    if (!walletAddress) return;
    void navigator.clipboard.writeText(walletAddress);
    telegramHaptic('selection');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card variant="solid" className="ui-hero-card wallet-balance-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-brand-muted">{tw('usdt_balance')}</span>
        <span className="ui-icon-tile ui-icon-tile--success"><FiCreditCard size={18} aria-hidden="true" /></span>
      </div>
      {loading ? (
        <div role="status" aria-label={tw('usdt_balance')} className="flex min-h-11 items-baseline gap-2">
          <Skeleton textRole="numeric-xl" width="6ch" />
          <span className="t-body text-brand-muted">USDT</span>
        </div>
      ) : balanceError ? (
        <div className="space-y-2">
          <p className="t-numeric-xl text-brand-muted">$ —</p>
          <Button variant="secondary" size="sm" onClick={onRetry}>{tw('balance_unavailable')}</Button>
        </div>
      ) : (
        <p className="flex min-h-11 flex-wrap items-baseline gap-2">
          <span className="t-numeric-xl">${(balance / 100).toFixed(2)}</span>
          <span className="text-sm font-medium text-brand-muted">USDT</span>
        </p>
      )}
      <GramBalances />

      {/* ── Connected Web3 TON Wallet Tile ── */}
      <div className="border-t border-brand-border pt-3">
        {loading ? (
          <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-brand-surface border border-brand-border">
            <Skeleton variant="rectangular" width={32} height={44} className="rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton textRole="caption" width="14ch" />
              <Skeleton textRole="caption" width="20ch" />
            </div>
          </div>
        ) : walletAddress ? (
          <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-primary/30 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <FiLink size={15} aria-hidden="true" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-caption font-semibold text-brand-primary leading-tight">
                  {tw('connected_status')}
                </p>
                <p className="font-mono text-caption text-brand-muted select-all truncate pt-0.5" dir="ltr">
                  {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyWallet}
                aria-label={copied ? tc('copied') : tc('copy')}
                className="ui-tap-target flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-elevated border border-brand-border text-caption font-semibold text-brand-primary hover:border-emerald-500/40 hover:text-emerald-400 active:scale-95 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <FaCheck className="text-emerald-400 animate-pulse" size={10} aria-hidden="true" />
                    <span className="text-emerald-400 font-bold text-caption">{tc('copied')}</span>
                  </>
                ) : (
                  <>
                    <FaCopy className="text-brand-muted" size={10} aria-hidden="true" />
                    <span className="text-caption">{tc('copy')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl bg-brand-surface border border-brand-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-elevated border border-brand-border text-brand-muted shrink-0">
                <FiLink size={15} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-caption font-semibold text-brand-primary leading-tight">{tw('no_wallet')}</p>
                <p className="text-caption text-brand-muted truncate pt-0.5">{tw('link_wallet_hint')}</p>
              </div>
            </div>
            {onConnect && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onConnect}
                className="shrink-0 text-caption font-semibold"
              >
                {tw('link_ton')}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
