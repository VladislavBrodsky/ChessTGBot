/** Game money arrives in cents. Finished-game readouts never guess a credited win payout. */
export interface FinishedGame {
  winner_id?: number | null; result_type?: string | null; wager_amount: number;
  payout_amount?: number | null; white_player_id: number;
  white_elo_before?: number | null; white_elo_after?: number | null;
  black_elo_before?: number | null; black_elo_after?: number | null;
}
export type GameOutcome = 'aborted' | 'draw' | 'win' | 'loss';
export function gameResultSummary(game: FinishedGame, userId: number) {
  const outcome: GameOutcome = game.result_type === 'aborted' ? 'aborted' : !game.winner_id ? 'draw' : game.winner_id === userId ? 'win' : 'loss';
  const white = game.white_player_id === userId;
  const before = white ? game.white_elo_before : game.black_elo_before;
  const after = white ? game.white_elo_after : game.black_elo_after;
  const knownElo = typeof before === 'number' && Number.isFinite(before) && typeof after === 'number' && Number.isFinite(after);
  const payoutCents = game.wager_amount === 0 ? 0 : outcome === 'win' ? game.payout_amount : outcome === 'loss' ? 0 : game.wager_amount;
  const payout = typeof payoutCents === 'number' && Number.isSafeInteger(payoutCents) && payoutCents >= 0 ? payoutCents / 100 : null;
  return { outcome, payout, newElo: typeof after === 'number' && Number.isFinite(after) ? after : undefined, eloChange: knownElo ? after - before : undefined };
}
