// Stake copy must match what the app ships. The website states the lobby's stake presets (config.ts and
// llms.txt), and the Mini App lobby and the backend own the real range. Run with `node --test` from website/.
// It reads ../frontend and ../backend, so it runs in the repository CI rather than in the website-only build.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(websiteRoot, "..");
const read = (...parts) => readFileSync(path.join(...parts), "utf8");
const numbers = (list) => list.split(/,\s+|\s+or\s+/).map((item) => Number(item.replace(/,/g, "").trim()));

const betSlip = path.join(repoRoot, "frontend/src/components/game/lobby/BetSlip.tsx");
// The one backend minimum: REST create, socket join/rematch and friend invites all import it.
const gameRules = path.join(repoRoot, "backend/app/services/game_rules.py");

test("website stake presets, llms.txt and the app's lobby agree", { skip: !existsSync(betSlip) && "frontend/ not checked out" }, () => {
  const config = read(websiteRoot, "src/lib/config.ts");
  const sitePresets = numbers(config.match(/LOBBY_STAKE_PRESETS = \[([^\]]+)\]/)[1]);
  const appPresets = read(betSlip).match(/STAKES_CENTS = \[([^\]]+)\]/)[1].split(",").map((cents) => Number(cents) / 100);
  assert.deepEqual(sitePresets, appPresets, "LOBBY_STAKE_PRESETS must equal STAKES_CENTS / 100 in the app's BetSlip.tsx");

  const llms = read(websiteRoot, "public/llms.txt");
  assert.doesNotMatch(llms, /stake tiers/i, "llms.txt must not present example stakes as the only tiers");
  const llmsPresets = llms.match(/Lobby presets: ([^.]+?) USDT/);
  assert.ok(llmsPresets, "llms.txt must list the lobby presets");
  assert.deepEqual(numbers(llmsPresets[1]), appPresets, "llms.txt lobby presets must match the app");
});

test("website minimum stake matches the backend", { skip: !existsSync(gameRules) && "backend/ not checked out" }, () => {
  const backendMin = read(gameRules).match(/^MIN_HUMAN_STAKE_CENTS = (\d+)$/m);
  assert.ok(backendMin, "backend/app/services/game_rules.py must define MIN_HUMAN_STAKE_CENTS");
  const minCents = Number(backendMin[1]);
  const minUsdt = Number(read(websiteRoot, "src/lib/config.ts").match(/minStakeUsdt: (\d+(?:\.\d+)?)/)[1]);
  assert.equal(minUsdt * 100, minCents, "MATCH_RULES.minStakeUsdt must equal MIN_HUMAN_STAKE_CENTS / 100");
  assert.match(read(websiteRoot, "public/llms.txt"), new RegExp(`stake the same amount, from ${minUsdt} USDT`));
});
