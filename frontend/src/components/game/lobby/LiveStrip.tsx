'use client';

import { useLocale } from 'next-intl';
import { Skeleton } from '@/components/ui/Skeleton';

/** Measured counts retain their geometry across loading, quiet, and unavailable states. */
export function LiveStrip({ searching, games24h, loading = false, unavailable = false, t }: {
  searching: number; games24h: number; loading?: boolean; unavailable?: boolean; t: (key: string) => string;
}) {
  const locale = useLocale();
  const counts = [{ value: searching, label: t('lobby_waiting') }, { value: games24h, label: t('lobby_games_24h') }];
  return <dl className="lobby-live" aria-busy={loading || undefined}>
    {counts.map(({ value, label }, index) => <div className="lobby-live__metric" key={index}>
      <dt className="t-caption text-brand-muted">{label}</dt>
      <dd className="t-numeric-sm text-brand-primary">
        {loading ? <Skeleton textRole="numeric-sm" width="3ch" /> : <bdi>{unavailable || !Number.isFinite(value) ? '—' : Math.max(0, value).toLocaleString(locale)}</bdi>}
      </dd>
    </div>)}
  </dl>;
}
