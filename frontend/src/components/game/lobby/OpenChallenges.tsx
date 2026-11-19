'use client';

import { Button } from '@/components/ui/Button';
import { MetaLine } from '@/components/ui/MetaLine';
import { formatUsd } from '@/lib/settlement';
import type { OpenChallenge } from '@/hooks/useOpenChallenges';

type T = (key: string, values?: Record<string, string | number>) => string;

function minutesLeft(expiresAt: number, nowMs: number): number {
  return Math.max(1, Math.ceil((expiresAt * 1000 - nowMs) / 60000));
}

/**
 * Staked games another player is waiting in right now. Accepting opens the game, where the
 * stake terms (and a top-up when the balance is short) are confirmed before any charge.
 * Renders nothing when nobody is waiting.
 */
export function OpenChallenges({ challenges, onOpen, t, nowMs = Date.now() }: {
  challenges: OpenChallenge[];
  onOpen: (gameId: string) => void;
  t: T;
  nowMs?: number;
}) {
  if (challenges.length === 0) return null;
  return (
    <section className="lobby-open" aria-labelledby="lobby-open-title">
      <h2 id="lobby-open-title" className="ui-eyebrow">{t('open_challenges_title')}</h2>
      <ul className="lobby-open__list">
        {challenges.map((c) => (
          <li key={c.game_id} className={`ui-list-row ${c.mine ? '' : 'ui-stat--accent'}`}>
            <div className="lobby-open__text">
              <span className="lobby-open__name">{c.mine ? t('open_challenge_yours') : c.creator_name}</span>
              <MetaLine className="lobby-open__meta">
                {!c.mine && t('open_challenge_meta_elo', { elo: c.creator_elo })}
                {t('open_challenge_meta_game', { minutes: Math.round(c.time_control / 60) })}
                {t('open_challenge_meta_left', { minutes: minutesLeft(c.expires_at, nowMs) })}
              </MetaLine>
            </div>
            <Button size="sm" variant={c.mine ? 'secondary' : 'primary'} className="shrink-0" onClick={() => onOpen(c.game_id)}>
              {c.mine ? t('open_challenge_view') : t('open_challenge_accept', { amount: formatUsd(c.bid_amount) })}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
