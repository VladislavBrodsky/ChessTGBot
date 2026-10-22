import { expect, test, type Page } from '@playwright/test';

const user = { telegram_id: 123456789, first_name: 'Pilot', last_name: 'Player', elo: 1200, xp: 0, level: 1,
  games_played: 0, wins: 0, losses: 0, draws: 0, unlocked_items: [], recent_games: [], referral_code: 'pilot', region: 'americas' };

async function prepare(page: Page) {
  await page.route('https://telegram.org/**', route => route.fulfill({ contentType: 'application/javascript', body: '// Local test SDK placeholder' }));
  await page.addInitScript(() => {
    (window as Window & { __E2E_TEST_AUTH__?: boolean }).__E2E_TEST_AUTH__ = true;
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('setting_reduce_motion', 'true');
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let response: unknown = {};
    let status = 200;
    if (path.endsWith('/users/sync')) response = user;
    else if (path.endsWith('/wallet/balance')) { status = 503; response = { detail: 'Unavailable' }; }
    else if (path.endsWith('/game/lobby-stats')) response = { searching: 0, games_24h: 0, recent: [], counted_at: 1 };
    else if (path.endsWith('/game/active')) response = { active_game_id: null };
    else if (path.endsWith('/gamification/tasks')) response = [];
    else if (path.endsWith('/game/create')) response = { game_id: 'e2e-ai-game' };
    else if (path.endsWith('/arena/status')) response = { status: 'scheduled', participants: 0, standings: [], starts_at: new Date(Date.now() + 3600000).toISOString() };
    else if (path.endsWith('/gamification/engagement/status')) response = { enabled: false };
    else if (path.endsWith('/admin/stats')) {
      response = Object.fromEntries(['total_users', 'total_blocked_users', 'premium_users', 'premium_conversion_rate', 'active_24h', 'active_7d', 'active_30d', 'engagement_rate_24h', 'total_games', 'games_today', 'total_deposits_cents', 'total_withdrawals_cents', 'total_chargebacks_cents', 'total_refunds_cents', 'total_fees_cents', 'platform_rake_cents', 'net_revenue_cents', 'total_referrals'].map(key => [key, 0]));
      response = { ...response as object, referral_levels: { level_1: 0 }, daily_activity: [], daily_revenue: [] };
    } else if (path.endsWith('/admin/player-metrics')) response = {
      dau: 0, wau: 0, mau: 0, coverage_start: null, unattributed_players: 0, sources: [],
      retention: { d1: { eligible: 0, returned: 0, rate: null }, d7: { eligible: 0, returned: 0, rate: null }, d30: { eligible: 0, returned: 0, rate: null } },
    };
    else if (path.endsWith('/admin/player-campaigns')) response = { url: 'https://t.me/chess_matbot/app?startapp=go_pilotcampaign123456', expires_at: '2026-11-15T00:00:00Z' };
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(response) });
  });
}

for (const [locale, width] of [['en', 320], ['ar', 390], ['en', 1280]] as const) {
  test(`free friend challenge works without a balance at ${width}px ${locale}`, async ({ page }) => {
    await prepare(page);
    await page.setViewportSize({ width, height: 900 });
    // Community launches authenticate on Home before navigating to Play.
    await page.goto(`/${locale}/home`);
    await page.locator(`nav a[href="/${locale}/game"]:visible`).first().click({ timeout: 30000 });
    const button = page.locator('.lobby-tile').filter({ has: page.locator('svg') }).last();
    await expect(button).toBeEnabled({ timeout: 30000 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await button.click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    const request = page.waitForRequest(request => request.url().includes('/game/create'));
    await drawer.getByRole('button', { name: locale === 'ar' ? 'إنشاء مباراة مجانية' : 'Create free game' }).click();
    const url = new URL((await request).url());
    expect(url.searchParams.get('type')).toBe('online');
    expect(url.searchParams.get('wager')).toBe('0');
    await expect(page).toHaveURL(new RegExp(`/${locale}/game\\?id=e2e-ai-game`), { timeout: 30000 });
  });
}

test('player dashboard shows unknown history and creates an attributed community link', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/admin');
  await page.getByRole('button', { name: 'Marketing', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Player acquisition' })).toBeVisible();
  await expect(page.getByText('No gameplay recorded yet')).toBeVisible();
  await expect(page.getByText('42.0%')).toHaveCount(0);
  await page.getByLabel('Campaign code (lowercase letters, numbers, underscores)').fill('club_pilot');
  const request = page.waitForRequest(request => request.url().includes('/admin/player-campaigns'));
  await page.getByRole('button', { name: 'Create community link', exact: true }).click();
  expect((await request).postDataJSON()).toEqual({ campaign: 'club_pilot', destination: 'practice' });
  await expect(page.getByLabel('Copy invitation link')).toHaveValue(/startapp=go_/);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

const friendRequest = { kind: 'request', id: 'pilotrequest', status: 'pending', role: 'guest', opponent: { name: 'Dana', elo: 1450 }, game_id: null, free: true, time_control: 600, url: 'https://t.me/chess_matbot?startapp=fi_pilotrequest' };

test('public referral starts free computer practice without notifying the referral owner', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 320, height: 740 });
  let requestEndpointCalled = false;
  await page.route('**/api/v1/game/friends/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/requests')) requestEndpointCalled = true;
    const response = path.endsWith('/preview')
      ? { kind: 'route', destination: 'practice' }
      : { launch: null, invitations: [] };
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(response) });
  });
  await page.goto('/en/home?startapp=ref_dana');
  await expect(page).toHaveURL(/\/en\/game\?id=e2e-ai-game/, { timeout: 30_000 });
  expect(requestEndpointCalled).toBe(false);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`personal clock remains visible throughout the game at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await prepare(page);
    await page.setViewportSize(viewport);
    await page.goto('/en/game?id=e2e-ai-game');
    const clock = page.getByRole('timer', { name: 'Your time' });
    await expect(clock).toBeVisible({ timeout: 30_000 });
    const before = await clock.boundingBox();
    expect(before).not.toBeNull();
    expect(before!.y).toBeGreaterThanOrEqual(0);
    expect(before!.y + before!.height).toBeLessThanOrEqual(viewport.height);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(clock).toBeVisible();
    const after = await clock.boundingBox();
    expect(after).not.toBeNull();
    expect(after!.y).toBeGreaterThanOrEqual(0);
    expect(after!.y + after!.height).toBeLessThanOrEqual(viewport.height);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('incoming play request takes priority over onboarding and accepts only after a tap', async ({ page }) => {
  await prepare(page);
  await page.addInitScript(() => localStorage.removeItem('onboarding_completed'));
  let accepted = false;
  await page.route('**/api/v1/game/friends/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let response: unknown = {};
    if (path.endsWith('/inbox')) response = { launch: null, invitations: [{ ...friendRequest, role: 'host' }] };
    if (path.endsWith('/respond')) { accepted = true; expect(route.request().postDataJSON()).toEqual({ action: 'accept' }); response = { ...friendRequest, role: 'host', status: 'ready', game_id: 'e2e-ai-game' }; }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(response) });
  });
  await page.goto('/en/home');
  await expect(page.getByRole('heading', { name: 'A friend wants to play', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  expect(accepted).toBe(false);
  await page.getByRole('button', { name: 'Accept and play' }).click();
  await expect(page).toHaveURL(/\/en\/game\?id=e2e-ai-game/);
  expect(accepted).toBe(true);
});

test('reported legacy game shows a named preview and expired links have a clear exit', async ({ page }) => {
  await prepare(page);
  let expired = false;
  await page.route('**/api/v1/game/friends/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/preview')) await route.fulfill({ status: expired ? 410 : 200, contentType: 'application/json', body: JSON.stringify(expired ? { detail: { code: 'expired_invitation' } } : { kind: 'game', parameter: '4e044c66', game_id: '4e044c66', opponent: friendRequest.opponent, free: true, time_control: 600 }) });
    else await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ launch: null, invitations: [] }) });
  });
  await page.goto('/en/home?startapp=4e044c66');
  await expect(page.getByRole('heading', { name: 'Join your friend', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join free game' })).toBeEnabled();
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  expired = true;
  await page.goto('/en/home?startapp=oldmissing');
  await expect(page.getByText('This invitation has expired — ask your friend for a new link')).toBeVisible();
  await page.getByRole('button', { name: 'Back to app' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('nav')).toBeVisible();
});


test('Arabic light direct invitation remains readable with reduced motion and safe mobile width', async ({ page }) => {
  await prepare(page);
  await page.addInitScript(() => localStorage.setItem('theme', 'light'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/v1/game/friends/**', async route => {
    const preview = new URL(route.request().url()).pathname.endsWith('/preview');
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(preview ? { kind: 'game', opponent: friendRequest.opponent, parameter: '4e044c66', game_id: '4e044c66', free: true, time_control: 600 } : { launch: null, invitations: [] }) });
  });
  await page.goto('/ar/home?startapp=4e044c66');
  await expect(page.getByRole('button', { name: 'انضم مجانًا', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('dialog').screenshot({ path: '/tmp/chess-pilot-validation/invitation-ar.png' });
});


test('public referral QR keeps the corrected app link without opening a saved private invitation', async ({ page }) => {
  await prepare(page);
  let inboxRequests = 0;
  await page.route('**/api/v1/game/friends/**', async route => {
    inboxRequests++;
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ launch: 'ref_private', invitations: [] }) });
  });
  await page.goto('/en/qr?code=pilot');
  await expect(page.locator('a[href="https://t.me/chess_matbot?startapp=ref_pilot"]')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(inboxRequests).toBe(0);
});


test('a declined request stays visible after reopening Home', async ({ page }) => {
  await prepare(page);
  await page.route('**/api/v1/game/friends/inbox', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ launch: null, invitations: [{ ...friendRequest, status: 'declined' }] }) }));
  await page.goto('/en/home');
  await expect(page.getByText('Invitation declined', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'View', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Invitation declined', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to app' })).toBeVisible();
});
