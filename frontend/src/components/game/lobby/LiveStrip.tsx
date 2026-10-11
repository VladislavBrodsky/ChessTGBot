'use client';

import { useLocale } from 'next-intl';

/**
 * Honest activity strip. It shows only numbers the backend actually measured, and renders nothing when there is
 * nothing to show: a quiet lobby must look quiet, never padded with invented players.
 */
export function LiveStrip({ searching, games24h, t }: { searching: number; games24h: number; t: (key: string) => string }) {
  const locale = useLocale();
  if (searching <= 0 && games24h <= 0) return null;
  const fmt = (n: number) => n.toLocaleString(locale);
  return (
    <div className="lobby-live" role="status" aria-live="polite">
      {searching > 0 && (
        <span className="lobby-live__row">
          <span className="lobby-live__badge ui-eyebrow">
            <span className="lobby-live__dot fx-ring-pulse" aria-hidden="true" />
            {t('lobby_live')}
          </span>
          <span><strong>{fmt(searching)}</strong> {t('lobby_waiting')}</span>
        </span>
      )}
      {games24h > 0 && <span className="lobby-live__row"><strong>{fmt(games24h)}</strong> {t('lobby_games_24h')}</span>}
    </div>
  );
}
