import { expect, test, type Page } from '@playwright/test';
import { availableQuest } from './fixtures';

/**
 * "Alive" must stay cheap: Home may run a small, fixed number of looping animations, and none at all when the
 * player has switched motion off (in-app switch or OS preference).
 */
const user = { region: 'americas', telegram_id: 999001, first_name: 'Alexandra', last_name: 'Rivera', username: 'alexandra', elo: 1450, level: 5, xp: 850, games_played: 28, wins: 16, losses: 10, draws: 2, win_rate: 57.1, current_streak: { count: 3, type: 'win' }, study_streak: 7, unlocked_items: [], recent_games: [], referral_code: 'motion-budget', is_premium: false };

async function prepare(page: Page, reduce: boolean) {
  await page.route('https://telegram.org/**', route => route.abort());
  await page.addInitScript(r => {
    sessionStorage.setItem('telegram_web_auth', 'id=999001&hash=e2e-invalid-signature');
    localStorage.setItem('onboarding_completed', 'true');
    if (r) localStorage.setItem('setting_reduce_motion', 'true');
  }, reduce);
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const now = Date.now();
    const data = path.endsWith('/users/sync') ? user
      : path.endsWith('/gamification/engagement/status') ? availableQuest
      : path.endsWith('/wallet/balance') ? { balance: 1250, wallet_address: 'EQPreview' }
      : path.endsWith('/arena/status') ? { status: 'scheduled', starts_at: new Date(now + 3600e3).toISOString(), ends_at: new Date(now + 7200e3).toISOString(), server_now: new Date(now).toISOString(), prizes_xp: [500, 300, 100], participation_xp: 25, participants: 0, standings: [], me: null, in_pool: false }
      : path.endsWith('/gamification/tasks') ? [{ id: 2, task_id: 2, title_key: 'daily_win', progress: 1, target_count: 1, xp_reward: 100, completed: true, claimed: false }] : path.includes('/leaderboard') ? [] : path.endsWith('/game/active') ? { active_game_id: null }
      : path.endsWith('/daily-checkin/status') ? { can_claim: false, streak: 3, claimed_today: true } : {};
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
  });
}

const loops = (page: Page) => page.evaluate(() => document.getAnimations().filter(a => (a.effect as AnimationEffect | null)?.getComputedTiming().iterations === Infinity).length);

test('home runs 1-3 looping animations with motion on', async ({ page }) => {
  await prepare(page, false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/home', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  await page.waitForTimeout(2500);
  const n = await loops(page);
  if (n > 3) console.log('Looping animations', await page.evaluate(() => document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations === Infinity).map(animation => ({ name: (animation as CSSAnimation).animationName, element: ((animation.effect as KeyframeEffect).target as Element)?.outerHTML.slice(0, 180) }))));
  expect(n, 'looping animations on Home').toBeGreaterThanOrEqual(1);
  expect(n, 'looping animations on Home').toBeLessThanOrEqual(3);
});

test('home runs no looping animation when motion is reduced', async ({ page }) => {
  await prepare(page, true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/home', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
  await page.waitForTimeout(2500);
  expect(await loops(page)).toBe(0);
});
