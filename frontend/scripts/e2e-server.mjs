// Build once and serve production routes for browser tests. The test API responses
// and invalid session fixture live in Playwright; production auth bypasses stay off.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nextBin = path.join(frontendDir, 'node_modules/next/dist/bin/next');
const env = {
  ...process.env,
  STATIC_EXPORT: 'false',
  NEXT_TELEMETRY_DISABLED: '1',
  NEXT_PUBLIC_E2E_TEST_MODE: 'false',
  NEXT_PUBLIC_E2E_AUTO_AUTH: 'false',
  NEXT_PUBLIC_API_URL: '',
  BACKEND_URL: 'http://127.0.0.1:8000',
};
let stopping = false;
let child;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => { stopping = true; child?.kill(signal); });
}
function run(args) {
  const spawned = spawn(process.execPath, [nextBin, ...args], { cwd: frontendDir, env, stdio: 'inherit' });
  spawned.on('error', error => { console.error(error); process.exit(1); });
  return spawned;
}
const port = process.env.E2E_PORT || '3000';
child = run(['build', '--webpack']);
child.on('exit', code => {
  if (stopping || code !== 0) process.exit(code ?? 1);
  child = run(['start', '-p', port]);
  child.on('exit', code => process.exit(code ?? 0));
});
