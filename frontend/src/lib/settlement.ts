/**
 * Match settlement shown to players. Mirrors the backend and website/src/lib/config.ts SETTLEMENT:
 * the winner receives 95% of the pot (3% platform fee, 2% referral).
 */
export const WINNER_PERCENT = 95;

/** What the winner receives for a stake, in cents (pot = 2 x stake). */
export function winnerCents(stakeCents: number): number {
  if (!Number.isFinite(stakeCents) || stakeCents <= 0) return 0;
  const pot = Math.round(stakeCents) * 2;
  return pot - Math.floor(pot * 3 / 100) - Math.floor(pot * 2 / 100);
}

export const formatUsd = (cents: number): string => `$${(cents / 100).toFixed(2)}`;
