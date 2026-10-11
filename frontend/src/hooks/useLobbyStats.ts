'use client';

import { useSWRFetch } from '@/hooks/useSWRFetch';

export interface RecentResult { result_type: 'checkmate' | 'resignation' | 'timeout' | 'abandon'; elo_gain: number | null; ended_at: string | null }
interface LobbyStats { searching: number; games_24h: number; recent?: RecentResult[]; counted_at: number }

/**
 * Measured lobby activity from the backend (players waiting for an opponent, human games in the last 24 h).
 * Nothing here is estimated or padded: `loaded` is false until the first answer, and zero stays zero.
 */
export function useLobbyStats() {
  const { data, error } = useSWRFetch<LobbyStats>('/api/v1/game/lobby-stats', {
    refreshInterval: 15000,
    revalidateOnFocus: false,
    errorRetryCount: 1,
  });
  return {
    loaded: Boolean(data) || Boolean(error),
    searching: Math.max(0, Number(data?.searching ?? 0)),
    games24h: Math.max(0, Number(data?.games_24h ?? 0)),
    recent: Array.isArray(data?.recent) ? data.recent.slice(0, 5) : [],
  };
}
