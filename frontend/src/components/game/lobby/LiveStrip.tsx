'use client';

import { useLocale } from 'next-intl';
import { FaChessKnight } from 'react-icons/fa';
import { Skeleton } from '@/components/ui/Skeleton';

/** Measured counts retain their geometry across loading, quiet, and unavailable states. */
export function LiveStrip({ searching, games24h, loading = false, unavailable = false, t }: {
  searching: number; games24h: number; loading?: boolean; unavailable?: boolean; t: (key: string) => string;
}) {
  const locale = useLocale();
  const counts = [
    {
      value: searching,
      label: t('lobby_waiting'),
      icon: (
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
      ),
      isLive: true,
    },
    {
      value: games24h,
      label: t('lobby_games_24h'),
      icon: <FaChessKnight className="text-brand-muted shrink-0 text-xs" aria-hidden="true" />,
      isLive: false,
    },
  ];

  return (
    <dl className="lobby-live" aria-busy={loading || undefined}>
      {counts.map(({ value, label, icon, isLive }, index) => (
        <div className="lobby-live__metric" key={index}>
          <div className="flex items-center gap-1.5 min-w-0">
            {icon}
            <dt className="t-caption text-brand-muted line-clamp-2">{label}</dt>
          </div>
          <dd className={`t-numeric-sm ${isLive ? 'lobby-live__val--live' : 'lobby-live__val--games'}`}>
            {loading ? (
              <Skeleton textRole="numeric-sm" width="3ch" />
            ) : (
              <bdi suppressHydrationWarning>{unavailable || !Number.isFinite(value) ? '—' : Math.max(0, value).toLocaleString(locale)}</bdi>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
