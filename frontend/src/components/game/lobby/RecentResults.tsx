'use client';

import { useLocale } from 'next-intl';
import { FaTrophy } from 'react-icons/fa';
import type { RecentResult } from '@/hooks/useLobbyStats';

const LABEL: Record<RecentResult['result_type'], string> = {
  checkmate: 'lobby_won_checkmate', resignation: 'lobby_won_resignation', timeout: 'lobby_won_timeout', abandon: 'lobby_won_abandon',
};

function ago(iso: string | null, locale: string): string {
  if (!iso) return '';
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return Math.abs(minutes) < 60 ? rtf.format(-Math.max(minutes, 0), 'minute') : rtf.format(-Math.round(minutes / 60), 'hour');
}

/** Real recent decisive human games, anonymous and without money amounts. Renders nothing when there are none. */
export function RecentResults({ recent, t }: { recent: RecentResult[]; t: (key: string) => string }) {
  const locale = useLocale();
  if (recent.length === 0) return null;
  return (
    <section className="lobby-recent" aria-label={t('lobby_recent_title')}>
      <h2 className="ui-eyebrow">{t('lobby_recent_title')}</h2>
      <ul className="lobby-recent__list">
        {recent.slice(0, 3).map((item, i) => (
          <li key={`${item.ended_at}-${i}`} className="lobby-recent__row">
            <FaTrophy size={12} className="shrink-0 text-brand-gold" aria-hidden="true" />
            <span className="lobby-recent__label">{t(LABEL[item.result_type] ?? LABEL.checkmate)}</span>
            {item.elo_gain ? <span className="lobby-recent__gain">+{item.elo_gain}</span> : null}
            <time className="lobby-recent__time" dateTime={item.ended_at ?? undefined}>{ago(item.ended_at, locale)}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}
