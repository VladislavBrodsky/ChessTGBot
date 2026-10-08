import { expect, test, type Page } from '@playwright/test';

const user = {
  telegram_id: 999001, first_name: 'Alexandra', last_name: 'Rivera', username: 'alexandra',
  elo: 1450, level: 5, xp: 850, games_played: 28, wins: 16, losses: 10, draws: 2,
  win_rate: 57.1, current_streak: { count: 3, type: 'win' }, study_streak: 7,
  percentile: 82, global_rank: 127, total_score: 17, unlocked_items: [], recent_games: [],
  referral_code: 'layout-preview', is_premium: false,
};
const tasks = [
  { id: 1, task_id: 1, title_key: 'daily_play', progress: 2, target_count: 3, xp_reward: 50, completed: false, claimed: false },
  { id: 2, task_id: 2, title_key: 'daily_win', progress: 1, target_count: 1, xp_reward: 100, completed: true, claimed: true },
];

async function prepare(page: Page, theme = 'dark') {
  await page.route('https://telegram.org/**', route => route.abort());
  await page.addInitScript(theme => {
    (window as Window & { __E2E_TEST_AUTH__?: boolean }).__E2E_TEST_AUTH__ = true;
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('theme', theme);
    localStorage.setItem('setting_reduce_motion', 'true');
  }, theme);
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith('/users/sync') ? user
      : path.endsWith('/wallet/balance') ? { balance: 1250, wallet_address: 'EQPreviewConnectedTONWallet0000' }
      : path.endsWith('/wallet/transactions') ? [{ id: 1, type: 'deposit', amount: 1250, fee: 65, status: 'completed', reference_id: 'preview', created_at: '2026-10-07T12:00:00Z' }]
      : path.endsWith('/gamification/tasks') ? tasks
      : path.endsWith('/gamification/academy/state') ? { unlocked_lessons: [], completed_lessons: [], puzzles: [] }
      : path.endsWith('/content/lessons') || path.endsWith('/gamification/themes') || path.endsWith('/gamification/achievements') ? []
      : path.includes('/leaderboard') ? [{ ...user, rank: 2 }, { ...user, rank: 1, telegram_id: 999002, first_name: 'Mikhail', last_name: 'Petrov', elo: 1520 }]
      : path.endsWith('/game/active') ? { active_game_id: null }
      : path.includes('/referrals/stats') ? { total_referrals: 3, active_referrals: 2, total_earnings_usdt: 1.25, earnings_chart: [] }
      : {};
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
  });
}

const routes = ['home', 'game', 'academy', 'marketplace', 'challenges', 'wallet', 'profile', 'settings', 'membership', 'academy/themes', 'academy/achievements'];

test('all destinations keep a readable heading, usable controls, and navigation', async ({ page }, testInfo) => {
  test.setTimeout(180000);
  await prepare(page);
  for (const route of routes) {
    await page.goto(`/en/${route}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20000 });
    const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
    if (route === 'membership') await expect(page.getByRole('link', { name: 'Back' })).toBeVisible();
    else await expect(navigation).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const undersized = await page.locator('button:visible, [role="switch"]:visible').evaluateAll(elements => elements
      .filter(element => !element.closest('[data-testid="live-chessboard"]') && !['Open Next.js Dev Tools', 'Open issues overlay', 'Collapse issues badge'].includes(element.getAttribute('aria-label') || ''))
      .map(element => ({ name: element.getAttribute('aria-label') || element.textContent?.trim(), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))
      .filter(element => element.width < 43.5 || element.height < 43.5));
    expect(undersized, `${route} touch targets`).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`${testInfo.project.name}-${route.replaceAll('/', '-')}.png`), fullPage: true });
  }
});

test('320px light and Arabic layouts retain all primary destinations', async ({ page }) => {
  test.setTimeout(120000);
  await prepare(page, 'light');
  await page.setViewportSize({ width: 320, height: 740 });
  for (const locale of ['en', 'ar']) {
    for (const route of ['home', 'game', 'wallet', 'settings', 'marketplace']) {
      await page.goto(`/${locale}/${route}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1').first(), `${locale}/${route} should have a visible heading at ${page.url()}`).toBeVisible({ timeout: 20000 });
      const nav = page.getByRole('navigation', { name: 'Primary navigation' });
      await expect(nav).toBeVisible();
      await expect(nav.getByRole('link')).toHaveCount(5);
      const offscreen = await nav.getByRole('link').evaluateAll(links => links.filter(link => {
        const rect = link.getBoundingClientRect();
        return rect.left < 0 || rect.right > innerWidth || rect.bottom > innerHeight;
      }).map(link => link.textContent));
      expect(offscreen).toEqual([]);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  }
});

test('language dialog traps focus, closes with Escape, and restores the trigger', async ({ page }) => {
  await prepare(page);
  await page.goto('/en/settings', { waitUntil: 'domcontentloaded' });
  const trigger = page.getByRole('button', { name: /Choose language/i });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: /Choose language/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close dialog' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: '日本語' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close dialog' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});
