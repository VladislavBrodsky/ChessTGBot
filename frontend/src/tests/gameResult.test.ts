import { gameResultSummary, type FinishedGame } from '@/lib/gameResult';
import { winnerCents } from '@/lib/settlement';
const game: FinishedGame = { white_player_id: 1, wager_amount: 500, white_elo_before: 1500, white_elo_after: 1512 };
it('converts returned stakes and credited win payouts from cents exactly once', () => {
  expect(gameResultSummary({ ...game, winner_id: null }, 1)).toMatchObject({ outcome: 'draw', payout: 5 });
  expect(gameResultSummary({ ...game, result_type: 'aborted' }, 1)).toMatchObject({ outcome: 'aborted', payout: 5 });
  expect(gameResultSummary({ ...game, winner_id: 1, payout_amount: 950 }, 1)).toMatchObject({ outcome: 'win', payout: 9.5, eloChange: 12, newElo: 1512 });
  expect(gameResultSummary({ ...game, winner_id: 2 }, 1)).toMatchObject({ outcome: 'loss', payout: 0 });
});
it('leaves missing or malformed settlement and rating data unknown', () => {
  const result = gameResultSummary({ white_player_id: 1, wager_amount: 500, winner_id: 1 }, 1);
  expect(result.payout).toBeNull(); expect(result.newElo).toBeUndefined(); expect(result.eloChange).toBeUndefined();
  expect(gameResultSummary({ ...game, winner_id: 1, payout_amount: NaN }, 1).payout).toBeNull();
});
it('uses the server outcome independently of a translated title', () => {
  expect(gameResultSummary({ ...game, winner_id: 1, result_type: 'timeout' }, 1).outcome).toBe('win');
  expect(gameResultSummary({ ...game, winner_id: 1, result_type: 'aborted' }, 1).outcome).toBe('aborted');
});
it('matches the two independently rounded backend fees for custom stakes', () => {
  expect(winnerCents(333)).toBe(634);
  expect(winnerCents(1000)).toBe(1900);
  expect(winnerCents(500)).toBe(950);
  expect(winnerCents(0)).toBe(0);
  expect(winnerCents(NaN)).toBe(0);
});
