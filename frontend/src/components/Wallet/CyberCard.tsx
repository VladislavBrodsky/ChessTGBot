'use client';

import { FiCreditCard, FiLink } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
    <Card variant="solid" className="wallet-balance-card p-5 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-brand-muted">{tw('usdt_balance')}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-brand-elevated text-brand-success"><FiCreditCard size={21} aria-hidden="true" /></span>
      </div>
      {loading ? (
        <div role="status" aria-label={tw('usdt_balance')} className="space-y-2"><Skeleton width={160} height={40} /><Skeleton width={90} height={16} /></div>
      ) : balanceError ? (
        <div className="space-y-2">
          <p className="text-4xl font-semibold text-brand-muted">$ —</p>
          <Button variant="secondary" size="sm" onClick={onRetry}>{tw('balance_unavailable')}</Button>
        </div>
      ) : (
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="text-[40px] leading-tight font-semibold tracking-tight tabular-nums">${(balance / 100).toFixed(2)}</span>
          <span className="text-sm font-medium text-brand-muted">USDT</span>
        </p>
      )}
      <div className="flex items-start gap-3 border-t border-brand-border pt-4">
        <FiLink size={18} className="mt-0.5 shrink-0 text-brand-muted" aria-hidden="true" />
        <div className="min-w-0">
          {loading ? <Skeleton width={170} height={16} /> : <>
            <p className="text-sm font-medium">{walletAddress ? tw('connected_status') : tw('no_wallet')}</p>
            <p className="mt-1 text-caption text-brand-muted break-all">{walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : tw('link_wallet_hint')}</p>
          </>}
        </div>
      </div>
    </Card>
  );
}
