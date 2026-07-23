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
  region: 'americas',
};

async function enableLocalTestIdentity(page: Page) {
  await page.addInitScript(() => {
    (window as Window & { __E2E_TEST_AUTH__?: boolean }).__E2E_TEST_AUTH__ = true;
  });
}

async function prepareAuthenticatedPage(page: Page, requests?: Map<string, number>) {
  await enableLocalTestIdentity(page);
  await page.addInitScript(() => localStorage.setItem('onboarding_completed', 'true'));
  await mockApi(page, requests);
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
            ? { active_game_id: null }
            : path.endsWith('/game/create')
              ? { game_id: 'e2e-ai-game' }
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
    await prepareAuthenticatedPage(page, requests);

    await page.goto('/en/home', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/en\/home$/);
    await expect.poll(() => requests.get('/api/v1/users/sync')).toBeGreaterThanOrEqual(1);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
  });

  test('completes the first-run onboarding queue and persists completion', async ({ page }) => {
    await enableLocalTestIdentity(page);
    await page.addInitScript(() => localStorage.removeItem('onboarding_completed'));
    await mockApi(page);

    await page.goto('/en/home', { waitUntil: 'domcontentloaded' });
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    for (let slide = 0; slide < 3; slide += 1) {
      await dialog.getByRole('button', { name: 'Next' }).click();
    }
    await dialog.getByRole('button', { name: 'Get Started' }).click();
    await expect(dialog).toBeHidden();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('onboarding_completed'))).toBe('true');
  });

  test('opens the game lobby and lets a player select an AI difficulty', async ({ page }) => {
    await prepareAuthenticatedPage(page);

    await page.goto('/en/game', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Train\s+Against A\.I\./i }).click();
    await expect(page.getByRole('heading', { name: 'Select AI Difficulty' })).toBeVisible();
    await page.getByRole('button', { name: /Easy Mode/i }).click();
    await expect(page.getByRole('button', { name: /Start Training Session/i })).toBeVisible();
  });

  test('starts an AI game, receives a deterministic reply, and resigns', async ({ page }) => {
    await prepareAuthenticatedPage(page);

    await page.goto('/en/game', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Train\s+Against A\.I\./i }).click();
    await page.getByRole('button', { name: /Easy Mode/i }).click();
    await page.getByRole('button', { name: /Start Training Session/i }).click();
    await expect(page).toHaveURL(/\/en\/game\?id=e2e-ai-game$/);
    const board = page.getByTestId('live-chessboard');
    await expect(board).toBeVisible({ timeout: 10_000 });
    await board.focus();
    await board.pressSequentially('e2e4');
    await expect(page.getByText('e4')).toBeVisible();
    await page.getByRole('button', { name: 'Resign' }).click();
    await expect(page.getByRole('heading', { name: /Resign/i })).toBeVisible();
    await page.locator('.bottom-drawer-backdrop').last().getByRole('button').first().click();
    await expect(page.getByText(/Tactical Defeat/i)).toBeVisible();
  });

  test('keeps deposit and withdrawal validation local until a valid request', async ({ page }) => {
    const requests = new Map<string, number>();
    await prepareAuthenticatedPage(page, requests);

    await page.goto('/en/wallet', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Deposit/i }).click();
    await expect(page.getByRole('button', { name: /Reconnect Wallet App|Connect Wallet to Top Up/i })).toBeVisible();
    await page.locator('.bottom-drawer-sheet button').first().click({ force: true });
    await page.getByRole('button', { name: /Withdraw/i }).click();
    const amount = page.locator('input[type="number"]');
    await amount.fill('100');
    await expect(page.getByText(/Insufficient Platform Balance/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Request TON Withdrawal/i })).toBeDisabled();
    expect(requests.get('/api/v1/wallet/withdraw') || 0).toBe(0);
  });

  test('renders the authenticated Arabic dashboard in RTL', async ({ page }) => {
    await prepareAuthenticatedPage(page);

    await page.goto('/ar/home', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/ar\/home$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
  });
});
