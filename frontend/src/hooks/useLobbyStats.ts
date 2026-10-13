'use client';

import { useState, useEffect } from 'react';
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

/**
 * Calculates a realistic diurnal 24-hour baseline curve for games played,
 * anchored to UTC midnight.
 * Range: [125, 755]. Resets back to 125 every 24h at 00:00:00 UTC.
 */
export function getDiurnalGames24h(now: Date = new Date()): number {
  const utcSeconds = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  const progress = utcSeconds / 86400; // 0.0 to 1.0 throughout the UTC day
  // Smooth cosine ease-in-out curve
  const curved = 0.5 * (1 - Math.cos(Math.PI * progress));
  const base = 125 + Math.round(630 * curved);
  return Math.min(755, Math.max(125, base));
}

/**
 * Generates an initial waiting count strictly in [28, 45].
 */
export function getInitialWaiting(now: Date = new Date()): number {
  const block = Math.floor(now.getTime() / 10000);
  const pseudo = Math.abs(Math.sin(block) * 10000) % 1;
  return 28 + Math.floor(pseudo * (45 - 28 + 1));
}

/**
 * Returns a new random count within [28, 45] by applying a natural random jitter [-2, +2]
 * with reflection at boundaries.
 */
export function getNextWaiting(prev: number): number {
  const deltas = [-2, -1, 0, 1, 2];
  const delta = deltas[Math.floor(Math.random() * deltas.length)];
  const candidate = prev + delta;
  if (candidate < 28) return 28 + Math.floor(Math.random() * 3);
  if (candidate > 45) return 45 - Math.floor(Math.random() * 3);
  return candidate;
}

/**
 * Dynamic lobby activity metrics for the Play screen:
 * - "Waiting now": fluctuating random range between 28 and 45, updated every 10 seconds.
 * - "Games in 24h": at least 125 games, naturally scaling during the day up to 755,
 *   with incremental +1 to +3 ticks during active sessions and resetting every 24h (00:00 UTC).
 * - Real matchmaker/backend counts take precedence whenever they exceed simulated values.
 */
export function useLobbyStats() {
  const { data, error } = useSWRFetch<LobbyStats>('/api/v1/game/lobby-stats', {
    refreshInterval: 15000,
    revalidateOnFocus: false,
    errorRetryCount: 1,
  });

  const [simulatedSearching, setSimulatedSearching] = useState<number>(() => getInitialWaiting());
  const [sessionBonus, setSessionBonus] = useState<number>(0);
  const [lastUtcDay, setLastUtcDay] = useState<number>(() => new Date().getUTCDate());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentUtcDay = now.getUTCDate();
      if (currentUtcDay !== lastUtcDay) {
        setLastUtcDay(currentUtcDay);
        setSessionBonus(0); // 24h reset back to 125 minimum
      } else {
        // Natural incremental game progress during session (+1 to +3 games)
        if (Math.random() < 0.45) {
          const added = Math.floor(Math.random() * 3) + 1;
          setSessionBonus((prev) => prev + added);
        }
      }
      setSimulatedSearching((prev) => getNextWaiting(prev));
    }, 10000);

    return () => clearInterval(timer);
  }, [lastUtcDay]);

  const baseGames = getDiurnalGames24h();
  const simulatedGames = Math.min(755, Math.max(125, baseGames + sessionBonus));

  const realSearching = Number(data?.searching ?? 0);
  const realGames = Number(data?.games_24h ?? 0);

  const searching = Math.max(realSearching, simulatedSearching);
  const games24h = Math.max(realGames, simulatedGames);

  return {
    loaded: true,
    error: Boolean(error && !data),
    searching,
    games24h,
    recent: Array.isArray(data?.recent) ? data.recent.slice(0, 5) : [],
  };
}
