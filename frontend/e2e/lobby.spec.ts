import { expect, test, type Page } from '@playwright/test';

/**
 * The Play lobby: the primary action and the risk line must be reachable on a phone without scrolling, every chip is a
 * proper tap target, activity numbers are only shown when measured, and the search/cancel/A.I.-fallback flow works.
 */
const user = { region: 'americas', telegram_id: 999001, first_name: 'Alexandra', last_name: 'Rivera', username: 'alexandra', elo: 1450, level: 5, xp: 850, games_played: 28, wins: 16, losses: 10, draws: 2, win_rate: 57.1, current_streak: { count: 3, type: 'win' }, study_streak: 7, unlocked_items: [], recent_games: [], referral_code: 'lobby-spec', is_premium: false };
const tasks = [{ id: 1, task_id: 1, title_key: 'daily_play', progress: 2, target_count: 3, xp_reward: 50, completed: false, claimed: false }];

async function prepare(page: Page, lobby: { searching: number; games_24h: number; recent?: unknown[] } | null, balance = 1250) {
  await page.route('https://telegram.org/**', route => route.abort());
  await page.addInitScript(() => {
    sessionStorage.setItem('telegram_web_auth', 'id=999001&hash=e2e-invalid-signature');
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('setting_reduce_motion', 'true');
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const now = Date.now();
    let status = 200;
    let data: unknown = {};
    if (path.endsWith('/users/sync')) data = user;
    else if (path.endsWith('/wallet/balance')) data = { balance, wallet_address: 'EQSpec' };
    else if (path.endsWith('/game/lobby-stats')) { if (lobby) data = { ...lobby, counted_at: 1 }; else { status = 500; data = { detail: 'down' }; } }
    else if (path.endsWith('/gamification/tasks')) data = tasks;
    else if (path.endsWith('/gamification/engagement/status')) data = { enabled: false };
    else if (path.endsWith('/game/active')) data = { active_game_id: null };
    else if (path.endsWith('/arena/status')) data = { status: 'scheduled', starts_at: new Date(now + 3600e3).toISOString(), ends_at: new Date(now + 7200e3).toISOString(), server_now: new Date(now).toISOString(), prizes_xp: [500, 300, 100], participation_xp: 25, participants: 0, standings: [], me: null, in_pool: false };
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  });
}

async function openLobby(page: Page, width = 375, height = 812) {
  await page.setViewportSize({ width, height });
  await page.goto('/en/game', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.snap-picker__item').first()).toBeVisible({ timeout: 60000 });
  await expect(page.locator('.lobby-cta')).not.toHaveAttribute('data-state', 'busy');
  await page.evaluate(() => document.fonts.ready);
}

test('phone: Start button and the risk line are visible without scrolling, and chips are 44px targets', async ({ page }) => {
  await prepare(page, { searching: 3, games_24h: 128 });
  await openLobby(page);
  const cta = page.locator('.lobby-cta');
  await expect(cta).toBeVisible();
  const nav = await page.locator('[data-app-navbar]').boundingBox();
  const box = await cta.boundingBox();
  expect(box!.y + box!.height, 'Start button bottom must clear the navbar').toBeLessThanOrEqual(nav!.y + 1);
  await expect(page.getByText('USDT matches are for adults (18+)')).toBeInViewport();
  for (const chip of await page.locator('.snap-picker__item').all()) {
    const b = await chip.boundingBox();
    expect(b!.height).toBeGreaterThanOrEqual(43.5);
    expect(b!.width).toBeGreaterThanOrEqual(43.5);
  }
});

test('320px wide: the page never scrolls sideways and the selected stake and time sit in the middle of their carousels', async ({ page }) => {
  await prepare(page, { searching: 0, games_24h: 0 });
  await openLobby(page, 320, 640);
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  for (const picker of await page.locator('.snap-picker').all()) {
    const track = (await picker.locator('.snap-picker__track').boundingBox())!;
    const selected = (await picker.locator('[aria-checked="true"]').boundingBox())!;
    expect(Math.abs(selected.x + selected.width / 2 - (track.x + track.width / 2))).toBeLessThanOrEqual(3);
  }
});

test('swiping a carousel selects the option nearest the centre, and tapping centres the tapped option', async ({ page }) => {
  await prepare(page, { searching: 0, games_24h: 0 });
  await openLobby(page);
  await page.waitForTimeout(500);
  const stake = page.locator('.snap-picker').first().locator('.snap-picker__track');
  await expect(page.getByRole('radio', { name: '$5', exact: true })).toHaveAttribute('aria-checked', 'true');
  await stake.evaluate(el => el.scrollBy({ left: 2 * 84, behavior: 'instant' })); // a two-option swipe may glide past the first
  await expect(page.getByRole('radio', { name: '$25', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.lobby-payout__value--win')).toContainText('$47.50');
  await page.getByRole('radio', { name: '$1', exact: true }).click();
  await expect(page.getByRole('radio', { name: '$1', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect.poll(async () => {
    const t = (await stake.boundingBox())!; const c = (await page.getByRole('radio', { name: '$1', exact: true }).boundingBox())!;
    return Math.abs(c.x + c.width / 2 - (t.x + t.width / 2));
  }, { timeout: 3000 }).toBeLessThanOrEqual(3);
  await page.getByRole('radio', { name: '$1', exact: true }).press('ArrowRight');
  await expect(page.getByRole('radio', { name: '$5', exact: true })).toHaveAttribute('aria-checked', 'true');
});

test('stake selection updates the payout and uses the 95% settlement', async ({ page }) => {
  await prepare(page, { searching: 0, games_24h: 0 });
  await openLobby(page);
  await page.getByRole('radio', { name: '$10', exact: true }).click();
  await expect(page.getByRole('radio', { name: '$10', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.lobby-payout__value--win')).toContainText('$19.00');
});

test('activity numbers are shown only when measured', async ({ page }) => {
  await prepare(page, { searching: 7, games_24h: 0 });
  await openLobby(page);
  await expect(page.locator('.lobby-live dd')).toHaveText(['7', '0']);
});

test('failed activity stays unknown without blocking the lobby', async ({ page }) => {
  await prepare(page, null);
  await openLobby(page);
  await expect(page.locator('.lobby-live dd')).toHaveText(['—', '—']);
  await expect(page.locator('.lobby-cta')).toBeVisible();
});

test('insufficient balance turns the action into a top-up with the exact shortfall', async ({ page }) => {
  await prepare(page, { searching: 0, games_24h: 0 }, 200);
  await openLobby(page);
  await expect(page.locator('.lobby-cta')).toHaveAttribute('data-state', 'topup');
  await expect(page.locator('.lobby-cta__sub')).toContainText('$3.00');
});

test('search and cancel without AI fallback button', async ({ page }) => {
  test.setTimeout(90_000);
  await prepare(page, { searching: 2, games_24h: 10 });
  await openLobby(page);
  await page.locator('.lobby-cta').click();
  await expect(page.getByRole('timer')).toBeVisible();
  await expect(page.getByText('You are matched with the next player waiting')).toBeVisible();
  await expect(page.getByRole('button', { name: /Switch to A\.I\. practice/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Cancel Search/ }).click();
  await expect(page.locator('.lobby-cta')).toBeVisible();
});
