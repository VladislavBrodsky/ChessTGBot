import { test, expect } from '@playwright/test';
import { messages } from './messages';

test('earned-box progress, rules and claim work at 320px in dark/light and Arabic', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  let claimed = false;
  const user = { region: 'americas', telegram_id: 700701, first_name: 'Quest preview', xp: 120, level: 1, elo: 1000,
    games_played: 3, wins: 0, losses: 0, draws: 3, win_rate: 0, current_streak: { count: 0, type: 'none' }, unlocked_items: [] };
  const quest = { enabled: true, accepting_enrollments: true, enrolled: true, target: 3, progress: 3,
    state: 'claimable', reward_key: null, rewards: [{ key: 'xp_250', probability_percent: 60 },
      { key: 'boost_24h', probability_percent: 30 }, { key: 'border_gold', probability_percent: 10 }] };
  await page.route('https://telegram.org/**', route => route.abort());
  await page.addInitScript(() => {
    sessionStorage.setItem('telegram_web_auth', 'id=999001&hash=e2e-invalid-signature');
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('setting_reduce_motion', 'true');
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/engagement/claim')) claimed = true;
    const data = path.includes('/engagement/') ? { ...quest, state: claimed ? 'claimed' : 'claimable', reward_key: claimed ? 'xp_250' : null }
      : path.endsWith('/users/sync') ? user
      : path.endsWith('/wallet/balance') ? { balance: 0 }
      : path.endsWith('/daily-checkin/status') ? { can_claim: false }
      : path.endsWith('/game/active') ? { active_game_id: null }
      : path.includes('/leaderboard') || path.endsWith('/gamification/tasks') ? [] : {};
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
  });
  await page.setViewportSize({ width: 320, height: 740 });
  for (const theme of ['dark', 'light']) {
    for (const locale of ['en', 'ar'] as const) {
      claimed = false;
      await page.addInitScript(theme => localStorage.setItem('theme', theme), theme);
      await page.goto(`/${locale}/home`, { waitUntil: 'domcontentloaded' });
      const card = page.locator('[aria-labelledby="engagement-title"]');
      await expect(card).toBeVisible();
      await card.scrollIntoViewIfNeeded();
      await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await card.getByRole('button', { name: messages[locale].Engagement.odds, exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      for (const odds of ['60%', '30%', '10%']) await expect(dialog.getByText(odds, { exact: true })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`quest-${locale}-${theme}-rules.png`), fullPage: true });
      const geometry = await dialog.evaluate(element => {
        const r = element.getBoundingClientRect();
        return { left: r.left, right: r.right, width: innerWidth };
      });
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(geometry.width);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(page.getByRole('navigation', { name: messages[locale].Common.primary_navigation })).toBeVisible();
      await card.getByRole('button', { name: messages[locale].Engagement.claim, exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('dialog').getByRole('status')).toHaveText(messages[locale].Engagement.rewards.xp_250);
    }
  }
});
