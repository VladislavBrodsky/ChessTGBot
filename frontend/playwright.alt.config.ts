import base from './playwright.config';
import { defineConfig } from '@playwright/test';
export default defineConfig({ ...base, use: { ...base.use, baseURL: 'http://localhost:3124' }, projects: [base.projects![0]],
  webServer: { command: 'node scripts/dev-mock.mjs', url: 'http://localhost:3124/en/login', reuseExistingServer: true, timeout: 180_000 } });
