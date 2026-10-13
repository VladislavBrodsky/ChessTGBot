'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FaWallet } from 'react-icons/fa';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { telegramHaptic } from '@/lib/telegram';
import { LiveStrip } from './LiveStrip';

/** One stable account/activity group, separate from wager selection and its primary action. */
export function LobbyHero({ balance, balanceLoading, balanceError, activityLoading, activityError, searching, games24h, onTopUp, onRetry }: {
  balance: number; balanceLoading: boolean; balanceError: boolean; activityLoading: boolean; activityError?: boolean;
  searching: number; games24h: number; onTopUp: () => void; onRetry: () => void;
}) {
  const tw = useTranslations('Wallet'), tg = useTranslations('Game');
  const locale = useLocale();
  return <Card variant="solid" className="ui-hero-card lobby-hero w-full">
    <div className="lobby-hero__balance">
      <div className="min-w-0 space-y-1">
        <h2 className="t-caption text-brand-muted">{tw('available_balance')}</h2>
        <Link href={`/${locale}/wallet`} className="lobby-hero__amount" aria-label={tw('available_balance')} onClick={() => telegramHaptic('selection')}>
          {balanceLoading ? <Skeleton textRole="numeric-lg" width="var(--size-stat-min)" /> : <bdi className="t-numeric-lg">{balanceError || !Number.isFinite(balance) ? '—' : `$${(balance / 100).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</bdi>}
          <span className="t-caption text-brand-muted">USDT</span>
        </Link>
      </div>
      <Button variant="secondary" leftIcon={<FaWallet />} onClick={balanceError ? onRetry : onTopUp}>
        {balanceError ? tw('retry_btn') : tw('top_up')}
      </Button>
    </div>
    <LiveStrip searching={searching} games24h={games24h} loading={activityLoading} unavailable={activityError} t={tg} />
  </Card>;
}
