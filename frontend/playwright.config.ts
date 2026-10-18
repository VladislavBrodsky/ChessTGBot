import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);

const port = process.env.E2E_PORT || '3000';

export default defineConfig({
  testDir: './e2e',
  // Pilot checks use their own compiler/cache and required CI lane.
  testIgnore: '**/pilot.spec.ts',
  // Exercise production routes on one local server with isolated browser contexts.
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'node scripts/e2e-server.mjs',
    url: `http://localhost:${port}/en/login`,
    reuseExistingServer: false,
    stdout: 'pipe',
    timeout: 600_000,
    env: {
      ...process.env,
      E2E_PORT: port,
    },
  },
});
