'use client';

import { useSWRFetch } from '@/hooks/useSWRFetch';

export interface OpenChallenge {
  game_id: string;
  bid_amount: number;
  time_control: number;
  creator_name: string;
  creator_elo: number;
  created_at: number;
  expires_at: number;
  mine: boolean;
}

/**
 * Real staked games anyone can accept from the lobby (backend/app/services/open_challenges.py).
 * Never padded: an empty list is the honest answer and the lobby then shows nothing.
 */
export function useOpenChallenges() {
  const { data } = useSWRFetch<{ challenges?: OpenChallenge[] }>('/api/v1/game/open-challenges', {
    refreshInterval: 15000,
    errorRetryCount: 1,
  });
  const challenges = Array.isArray(data?.challenges)
    ? data.challenges.filter((c) => c && typeof c.game_id === 'string' && c.bid_amount > 0)
    : [];
  return { challenges };
}
