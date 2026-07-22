import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  // A shared Next dev server compiles routes lazily. Serial execution prevents
  // cold-route compilation races from masquerading as browser failures.
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev:e2e',
    url: 'http://localhost:3000/en/login',
    reuseExistingServer: !isCI,
    env: { NEXT_PUBLIC_E2E_TEST_MODE: 'true' },
    timeout: 120_000,
  },
});
