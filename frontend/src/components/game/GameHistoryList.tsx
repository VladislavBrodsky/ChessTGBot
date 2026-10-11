'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FaTrophy, FaFlag, FaHandshake, FaShareAlt } from 'react-icons/fa';
import { FiChevronRight } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';

export interface RecentGame {
  game_id: string;
  result: string;
  elo_change: number;
  opponent?: { name?: string; elo?: number };
}

/** Review links and optional share controls use the same row on Play and Profile. */
export function GameHistoryList({ games, onShare }: { games: RecentGame[]; onShare?: (game: RecentGame) => void }) {
  const locale = useLocale();
  const t = useTranslations('Index');
  const tg = useTranslations('Game');
  return <ol className="w-full flex flex-col gap-2 list-none m-0 p-0">
    {games.map(game => {
      const win = game.result === 'win';
      const loss = game.result === 'loss';
      const result = t(win ? 'result_win' : loss ? 'result_loss' : 'result_draw');
      const name = game.opponent?.name === 'A.I. Coach' ? t('ai_engine') : game.opponent?.name || t('ai_engine');
      return <li key={game.game_id} className="ui-list-row gap-2">
        <Link href={`/${locale}/game/review?gameId=${encodeURIComponent(game.game_id)}`} aria-label={`${t('recent_activity')}: ${name}, ${result}`} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-control">
          <span className={`ui-icon-tile ${win ? 'ui-icon-tile--success' : loss ? 'ui-icon-tile--danger' : ''}`} aria-hidden="true">{win ? <FaTrophy /> : loss ? <FaFlag /> : <FaHandshake />}</span>
          <div className="min-w-0 flex-1">
            <p className="t-title-3 truncate">{t('vs')} {name}</p>
            <p className="t-caption text-brand-muted">{t('opponent_elo')}: {game.opponent?.elo ?? '—'}</p>
          </div>
          <div className="shrink-0 text-end">
            <p className={`t-numeric-sm ${win ? 'text-brand-success' : loss ? 'text-brand-danger' : 'text-brand-muted'}`}>{game.elo_change > 0 ? '+' : ''}{game.elo_change ?? 0} {t('elo')}</p>
            <p className="t-caption text-brand-muted">{result}</p>
          </div>
          {!onShare && <FiChevronRight size={16} className="shrink-0 text-brand-muted rtl:rotate-180" aria-hidden="true" />}
        </Link>
        {onShare && <Button variant="ghost" size="sm" className="p-0 w-11 shrink-0" aria-label={`${tg('share_ledger')}: ${name}`} onClick={() => onShare(game)}><FaShareAlt size={16} aria-hidden="true" /></Button>}
      </li>;
    })}
  </ol>;
}
