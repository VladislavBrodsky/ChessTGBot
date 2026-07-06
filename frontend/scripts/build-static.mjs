// Builds the Next.js static export and syncs it into backend/static_frontend.
//
// backend/static_frontend is the frontend that PRODUCTION actually serves
// (see backend/app/main.py). If you change anything under frontend/src and
// don't re-run this script, your fix will exist in source but never ship —
// that's exactly how the "missing bottom navbar on iOS Telegram" bug happened:
// five navbar fixes were committed to frontend/src while the deployed static
// build was still the one from an earlier commit.
//
// Usage (from frontend/):  npm run build:static
import { spawnSync } from 'node:child_process';
import { rmSync, cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(frontendDir, 'out');
const targetDir = path.resolve(frontendDir, '..', 'backend', 'static_frontend');
const nextBin = path.join(frontendDir, 'node_modules', 'next', 'dist', 'bin', 'next');

console.log('> Building static export (STATIC_EXPORT=true next build --webpack)...');
const build = spawnSync(process.execPath, [nextBin, 'build', '--webpack'], {
    cwd: frontendDir,
    stdio: 'inherit',
    env: { ...process.env, STATIC_EXPORT: 'true' },
});
if (build.status !== 0) {
    console.error('Build failed — backend/static_frontend was NOT touched.');
    process.exit(build.status ?? 1);
}
if (!existsSync(path.join(outDir, 'index.html'))) {
    console.error(`Build produced no ${outDir}/index.html — aborting sync.`);
    process.exit(1);
}

console.log(`> Syncing ${outDir} -> ${targetDir} ...`);
rmSync(targetDir, { recursive: true, force: true });
cpSync(outDir, targetDir, { recursive: true });

console.log('> Done. Remember to COMMIT backend/static_frontend so the deploy picks it up.');
