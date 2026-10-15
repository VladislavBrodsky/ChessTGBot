'use client';

import { useSWRFetch } from '@/hooks/useSWRFetch';

export interface RecentResult {
  result_type: 'checkmate' | 'resignation' | 'timeout' | 'abandon';
  elo_gain: number | null;
  ended_at: string | null;
}

interface LobbyStats {
  searching: number;
  games_24h: number;
  recent?: RecentResult[];
  counted_at: number;
}

/** Server activity stays distinct from loading, unknown, and measured zero. */
export function useLobbyStats() {
  const { data, error } = useSWRFetch<LobbyStats>('/api/v1/game/lobby-stats', {
    refreshInterval: 15000, revalidateOnFocus: false, errorRetryCount: 1,
  });
  const valid = data && Number.isFinite(data.searching) && Number.isFinite(data.games_24h);
  return {
    loaded: Boolean(data || error),
    error: Boolean(!valid && (data || error)),
    searching: valid ? Math.max(0, data.searching) : 0,
    games24h: valid ? Math.max(0, data.games_24h) : 0,
    recent: valid && Array.isArray(data.recent) ? data.recent.slice(0, 5) : [],
  };
}
