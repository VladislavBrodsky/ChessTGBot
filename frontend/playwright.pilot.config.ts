import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  outputDir: './test-results-pilot', testDir: './e2e', testMatch: 'pilot.spec.ts', workers: 1, timeout: 120000,
  use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3101', trace: 'retain-on-failure' },
  webServer: {
    command: 'node node_modules/next/dist/bin/next dev --turbopack -p 3101',
    url: 'http://localhost:3101/en/login', reuseExistingServer: false,
    env: { PILOT_BUILD_DIR: '.next-pilot', NEXT_PUBLIC_E2E_TEST_MODE: 'true', NEXT_PUBLIC_E2E_AUTO_AUTH: 'false' }, timeout: 300000,
  },
});
