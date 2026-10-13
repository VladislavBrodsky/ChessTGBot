'use client';

import { FiCreditCard, FiLink } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GramBalances } from '@/components/Wallet/GramBalances';
import { Skeleton } from '@/components/ui/Skeleton';

interface CyberCardProps {
  balance: number;
  walletAddress: string;
  balanceError?: boolean;
  loading?: boolean;
  onRetry?: () => void;
}

/** Platform balance and a linked TON wallet are separate, explicit concepts. */
export default function CyberCard({ balance, walletAddress, balanceError = false, loading = false, onRetry }: CyberCardProps) {
  const tw = useTranslations('Wallet');
  return (
    <Card variant="solid" className="ui-hero-card wallet-balance-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-brand-muted">{tw('usdt_balance')}</span>
        <span className="ui-icon-tile ui-icon-tile--success"><FiCreditCard size={18} aria-hidden="true" /></span>
      </div>
      {loading ? (
        <div role="status" aria-label={tw('usdt_balance')} className="flex min-h-11 items-baseline gap-2"><Skeleton textRole="numeric-xl" width="6ch" /><span className="t-body text-brand-muted">USDT</span></div>
      ) : balanceError ? (
        <div className="space-y-2">
          <p className="t-numeric-xl text-brand-muted">$ —</p>
          <Button variant="secondary" size="sm" onClick={onRetry}>{tw('balance_unavailable')}</Button>
        </div>
      ) : (
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="t-numeric-xl">${(balance / 100).toFixed(2)}</span>
          <span className="text-sm font-medium text-brand-muted">USDT</span>
        </p>
      )}
      <GramBalances />
      <div className="flex items-start gap-3 border-t border-brand-border pt-3">
        <FiLink size={16} className="mt-0.5 shrink-0 text-brand-muted" aria-hidden="true" />
        <div className="min-w-0 min-h-11">
          {loading ? <div className="space-y-1"><Skeleton textRole="body" width="15ch" /><Skeleton textRole="caption" width="12ch" /></div> : <>
            <p className="text-sm font-medium">{walletAddress ? tw('connected_status') : tw('no_wallet')}</p>
            <p className="text-caption text-brand-muted break-all">{walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : tw('link_wallet_hint')}</p>
          </>}
        </div>
      </div>
    </Card>
  );
}
