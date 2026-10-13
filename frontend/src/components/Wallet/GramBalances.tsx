'use client';
import { useTranslations } from 'next-intl';
import { useUser } from '@/context/UserContext';
import { useGramQuote } from '@/hooks/useGramQuote';
import { GramAmount } from '@/components/ui/GramAmount';
import { Skeleton } from '@/components/ui/Skeleton';

export function GramBalances() {
  const t = useTranslations('Gram');
  const { walletBalance, gramRewardsNano, loadingBalance, balanceError } = useUser();
  const { quote, loading } = useGramQuote();
  return (
    <div className="space-y-3 border-t border-brand-border pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="t-caption text-brand-muted">{t('equivalent')}</span>
        {loadingBalance || loading ? (
          <Skeleton width={120} height={20} />
        ) : balanceError || !quote ? (
          <span className="t-caption text-brand-muted">{t('rate_unavailable')}</span>
        ) : (
          <GramAmount estimate={(walletBalance / 100) * Number(quote.gram_per_usdt)} className="t-label font-semibold text-white" />
        )}
      </div>
      <div className="ui-stat ui-stat--accent space-y-2 p-3.5 rounded-2xl">
        <div className="flex items-center justify-between gap-3">
          <span className="t-caption font-semibold text-brand-primary">{t('earned')}</span>
          {loadingBalance ? (
            <Skeleton width={100} height={22} />
          ) : (
            <GramAmount nano={balanceError ? null : gramRewardsNano} className="t-title-3 font-bold text-brand-action" />
          )}
        </div>
        <p className="t-caption text-brand-muted leading-relaxed">{t('separate')}</p>
      </div>
    </div>
  );
}
