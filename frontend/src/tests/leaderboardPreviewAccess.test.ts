import { isLeaderboardPreviewAllowed } from '@/lib/leaderboardPreviewAccess';

describe('Local leaderboard preview access', () => {
  it.each(['localhost', '127.0.0.1', '[::1]', '::1'])('allows local development on %s', hostname => {
    expect(isLeaderboardPreviewAllowed('development', hostname)).toBe(true);
  });

  it.each([
    ['production', 'localhost'],
    ['production', 'app.web3chess.online'],
    ['development', 'app.web3chess.online'],
    ['test', 'localhost'],
    [undefined, 'localhost'],
  ])('denies %s on %s', (environment, hostname) => {
    expect(isLeaderboardPreviewAllowed(environment, hostname!)).toBe(false);
  });
});
