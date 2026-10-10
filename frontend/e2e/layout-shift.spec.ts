import { expect, test, type Page } from '@playwright/test';

/**
 * Skeletons must occupy the same box as the content they replace. Every API response is delayed so the
 * loading state is on screen, then resolves; the cumulative layout shift of that swap must stay small.
 */
const user = {
  telegram_id: 999001, first_name: 'Alexandra', last_name: 'Rivera', username: 'alexandra', elo: 1450, level: 5, xp: 850,
  games_played: 28, wins: 16, losses: 10, draws: 2, win_rate: 57.1, draw_rate: 7.1, loss_rate: 35.7,
  current_streak: { count: 3, type: 'win' }, study_streak: 7, percentile: 82, global_rank: 127, total_score: 17,
  unlocked_items: [], recent_games: [], referral_code: 'layout-preview', is_premium: false,
};
const tasks = [
  { id: 1, task_id: 1, title_key: 'daily_play', progress: 2, target_count: 3, xp_reward: 50, completed: false, claimed: false },
  { id: 2, task_id: 2, title_key: 'daily_win', progress: 1, target_count: 1, xp_reward: 100, completed: true, claimed: false },
  { id: 3, task_id: 3, title_key: 'daily_login', progress: 0, target_count: 1, xp_reward: 20, completed: false, claimed: false },
];
const players = Array.from({ length: 6 }, (_, i) => ({ ...user, rank: i + 1, telegram_id: 1000 + i, first_name: `Player${i}`, elo: 1600 - i * 25 }));

async function prepare(page: Page) {
  await page.route('https://telegram.org/**', route => route.abort());
  await page.addInitScript(() => {
    (window as Window & { __E2E_TEST_AUTH__?: boolean }).__E2E_TEST_AUTH__ = true;
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('setting_reduce_motion', 'true');
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
        if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith('/users/sync') ? user
      : path.endsWith('/wallet/balance') ? { balance: 1250, wallet_address: 'EQPreviewConnectedTONWallet0000' }
      : path.endsWith('/wallet/transactions') ? [{ id: 1, type: 'deposit', amount: 1250, fee: 65, status: 'completed', reference_id: 'p', created_at: '2026-10-07T12:00:00Z' }]
      : path.endsWith('/gamification/tasks') ? tasks
      : path.endsWith('/gamification/academy/state') ? { unlocked_lessons: [], completed_lessons: [], puzzles: [] }
      : path.endsWith('/content/lessons') || path.endsWith('/gamification/themes') ? []
      : path.includes('/leaderboard') ? players
      : path.endsWith('/game/active') ? { active_game_id: null }
      : path.includes('/referrals/stats') ? { total_referrals: 3, active_referrals: 2, total_earnings_usdt: 1.25, earnings_chart: [] }
      : {};
    await new Promise(resolve => setTimeout(resolve, 700));
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
  });
}

const BUDGET = 0.08;
for (const route of ['home', 'profile', 'wallet', 'challenges', 'marketplace']) {
  test(`${route}: loading to loaded keeps layout shift under ${BUDGET}`, async ({ page }) => {
    await prepare(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/en/${route}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(2500);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    console.log(`CLS ${route}: ${cls.toFixed(4)}`);
    expect(cls, `${route} layout shift`).toBeLessThan(BUDGET);
  });
}
