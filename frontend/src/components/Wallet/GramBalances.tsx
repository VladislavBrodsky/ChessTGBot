'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '@/context/UserContext';
import { useGramQuote } from '@/hooks/useGramQuote';
import { GramAmount } from '@/components/ui/GramAmount';
import { Skeleton } from '@/components/ui/Skeleton';

export function GramBalances() {
  const t = useTranslations('Gram');
  const locale = useLocale();
  const { walletBalance, gramRewardsNano, loadingBalance, balanceError } = useUser();
  const { quote, loading } = useGramQuote();
  return <div className="space-y-3 border-t border-brand-border pt-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="t-caption text-brand-muted">{t('equivalent')}</span>
      {loadingBalance || loading ? <Skeleton width={120} height={20} /> : balanceError || !quote ? <span className="t-caption text-brand-muted">{t('rate_unavailable')}</span>
        : <GramAmount estimate={walletBalance / 100 * Number(quote.gram_per_usdt)} className="t-label" />}
    </div>
    {quote && <p className="t-caption text-brand-muted">{t(quote.stale ? 'rate_stale' : 'rate_updated', { provider: quote.provider, time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(quote.fetched_at)) })}</p>}
    <div className="ui-stat ui-stat--accent space-y-1">
      <span className="t-caption text-brand-muted">{t('earned')}</span>
      {loadingBalance ? <Skeleton width={120} height={24} /> : <GramAmount nano={balanceError ? null : gramRewardsNano} className="t-title-3 text-brand-action" />}
      <p className="t-caption text-brand-muted">{t('separate')}</p>
    </div>
  </div>;
}
