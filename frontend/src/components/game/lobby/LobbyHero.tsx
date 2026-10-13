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
  return (
    <Card variant="solid" className="ui-hero-card lobby-hero w-full p-4 sm:p-5">
      <div className="lobby-hero__balance">
        <div className="min-w-0 space-y-1">
          <h2 className="ui-eyebrow text-brand-muted">{tw('available_balance')}</h2>
          <Link
            href={`/${locale}/wallet`}
            className="lobby-hero__amount group inline-flex items-baseline gap-2 transition-opacity hover:opacity-90 active:scale-[0.99]"
            aria-label={tw('available_balance')}
            onClick={() => telegramHaptic('selection')}
          >
            {balanceLoading ? (
              <Skeleton textRole="numeric-lg" width="var(--size-stat-min)" />
            ) : (
              <bdi className="t-numeric-lg text-brand-primary">
                {balanceError || !Number.isFinite(balance)
                  ? '—'
                  : `$${(balance / 100).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </bdi>
            )}
            <span className="inline-flex items-center rounded-md border border-brand-border/60 bg-brand-elevated px-1.5 py-0.5 text-caption font-bold text-brand-muted">
              USDT
            </span>
          </Link>
        </div>
      </div>
      <div className="lobby-hero__live">
        <LiveStrip searching={searching} games24h={games24h} loading={activityLoading} unavailable={activityError} t={tg} />
      </div>
      <div className="lobby-hero__action">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<FaWallet className="text-emerald-400" />}
          className="shrink-0 font-semibold hover:border-brand-primary/40 active:scale-95"
          onClick={balanceError ? onRetry : onTopUp}
        >
          {balanceError ? tw('retry_btn') : tw('top_up')}
        </Button>
      </div>
    </Card>
  );
}
