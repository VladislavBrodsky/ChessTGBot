/**
 * Developer mode: the Mini App on localhost with a built-in test identity and a mock API. No Telegram auth,
 * database or backend needed.   npm run dev:mock   ->   http://localhost:3124/en/home
 *
 * Safety: the identity bypass in src/lib/e2eTestMode.ts only works on localhost, never in a production build, and only
 * when NEXT_PUBLIC_E2E_TEST_MODE / NEXT_PUBLIC_E2E_AUTO_AUTH are set, which this script does for its own dev server.
 */
import { spawn } from 'node:child_process';
import { startMockApi } from './mock-api.mjs';

const apiPort = Number(process.env.MOCK_API_PORT || 8124);
const webPort = Number(process.env.PORT || 3124);
const api = await startMockApi(apiPort);
console.log(`[dev-mock] mock API on http://127.0.0.1:${apiPort}`);

const next = spawn('npx', ['next', 'dev', '--webpack', '-p', String(webPort)], {
  stdio: 'inherit',
  env: {
    ...process.env,
    BACKEND_URL: `http://127.0.0.1:${apiPort}`,
    NEXT_PUBLIC_API_URL: '',
    NEXT_PUBLIC_E2E_TEST_MODE: 'true',
    NEXT_PUBLIC_E2E_AUTO_AUTH: 'true',
  },
});
const stop = () => { next.kill('SIGTERM'); api.close(); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
next.on('exit', code => { api.close(); process.exit(code ?? 0); });
