import { expect, test, type Page } from '@playwright/test';

const mockUser = {
  telegram_id: 999_001,
  first_name: 'E2E',
  last_name: 'Player',
  username: 'e2e_player',
  rating: 1200,
  games_played: 4,
  wins: 3,
  losses: 1,
  draws: 0,
  xp: 250,
  level: 2,
};

async function enableLocalTestIdentity(page: Page) {
  await page.addInitScript(() => {
    (window as Window & { __E2E_TEST_AUTH__?: boolean }).__E2E_TEST_AUTH__ = true;
  });
}

async function mockApi(page: Page, requests?: Map<string, number>) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    requests?.set(path, (requests.get(path) || 0) + 1);

    const response = path.endsWith('/wallet/balance')
      ? { balance: 12.5, wallet_address: 'EQE2EWalletAddress' }
      : path.endsWith('/wallet/transactions')
        ? []
        : path.endsWith('/users/sync')
          ? mockUser
          : path.endsWith('/game/active')
            ? { active_game: null }
            : {};

    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(response) });
  });
}

test.describe('browser safety net', () => {
  test.beforeEach(async ({ page }) => {
    // The real SDK is an external dependency and can synthesize a WebApp
    // object in a normal browser. E2E auth must be controlled solely by the
    // explicit, local-only identity above.
    await page.route('https://telegram.org/js/telegram-web-app.js', (route) => route.abort());
  });

  test('redirects an unauthenticated protected route to login', async ({ page }) => {
    await page.goto('/en/home', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/en\/login$/, { timeout: 8_000 });
  });

  test('renders the desktop login fallback without horizontal overflow', async ({ page }) => {
    await page.goto('/en/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test('keeps Arabic markup RTL and within the viewport', async ({ page }) => {
    await page.goto('/ar/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test('loads wallet data once without a balance polling loop', async ({ page }) => {
    const requests = new Map<string, number>();
    await enableLocalTestIdentity(page);
    await mockApi(page, requests);

    await page.goto('/en/wallet', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Wallet|Deposit/, { timeout: 10_000 });
    await page.waitForTimeout(1_000);
    // React Strict Mode intentionally mounts effects twice in `next dev`.
    // A higher number would regress into the old unbounded request loop.
    expect(requests.get('/api/v1/wallet/balance') || 0).toBeLessThanOrEqual(1);
    expect(requests.get('/api/v1/wallet/transactions') || 0).toBeLessThanOrEqual(2);
  });

  test('shows the dashboard with the authenticated local test identity', async ({ page }) => {
    const requests = new Map<string, number>();
    await enableLocalTestIdentity(page);
    await mockApi(page, requests);

    await page.goto('/en/home', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/en\/home$/);
    await expect.poll(() => requests.get('/api/v1/users/sync')).toBeGreaterThanOrEqual(1);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
  });
});
