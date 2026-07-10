# ChessTGBot — Session Handover

Concise handover for a fresh conversation. Part 1 = what's been built/hardened.
Part 2 = every issue raised this session that is **still unaddressed**.

**Project:** Telegram Mini App chess with real-money USDT wagering. Next.js
static-export frontend + FastAPI/Socket.IO backend, Postgres + Redis, TON chain
for deposits/payouts. Production = two Railway services (frontend `next start`,
backend FastAPI); `backend/static_frontend` is the committed export for the
monolith path — rebuild it after any `frontend/src` change (`cd frontend &&
npm run build:static`) and commit it (CI enforces on PRs).

---

## Part 1 — What was built / hardened (all shipped to `main`)

**Settlement / money model**
- **USDT-only settlement** end-to-end: backend credits only USDT (all deposit
  paths gated on `_is_usdt_master`), deposit UIs restricted to USDT, price-oracle
  removed from the money path. Closes the FX/insolvency risk of holding a
  volatile basket against USD liabilities.
- **Withdrawal velocity controls**: rolling-24h per-user cap + review threshold
  (large withdrawals held as `pending_review`, admins alerted); admin
  approve/reject endpoints. Rate limits on withdraw/deposit-verify/game-create.
- **Settlement math** extracted to a pure, tested function (95% payout / 3% rake
  / 2% referral; value-conservation invariant).
- **Double-credit fix** (another session): `/deposit/verify` and the crawler now
  share a dedup key; broadcast-timeout withdrawals held pending vs unsafe refund.
- **Referral commission minting fixed** (another session): winner-only payout +
  split uses the *direct referrer's* tier matrix (≤2%, no minting).
- Truth-in-advertising: "WIN UP TO" now shows real 95% payout; referral "10%"
  → "up to 2%".

**Security**
- Deposit fail-open path gated to dev; `auth_date` replay protection on initData;
  `/game/history` auth-gated; CORS wildcard dead-code removed.
- **Web/desktop auth** (another session): Telegram Login-Widget payloads verified
  with the correct `SHA256(bot_token)` HMAC + `auth_date` freshness; dev-only
  unverified fallback gated to `TESTING`/`ENV=development` (prod-safe defaults).
- **Anti-collusion matchmaking** + IP-keyed failed-auth throttle (another
  session): no self / referral-linked / same-IP auto-match.
- **XP faucet capped**: 250 XP/day from AI games (was unlimited → free premium).

**Game integrity** — audited, found clean (server-authoritative clock, moves,
results; double-payout prevented by unique constraint + atomic settlement).

**Observability & solvency**
- Frontend crash capture → admin Telegram alerts; error boundaries
  (`error.tsx`, `global-error.tsx`, `ClientErrorReporter`); Sentry FE crash
  reporting (another session).
- Solvency reconciliation service + `GET /admin/solvency` + sustained-deficit
  alert loop + gas-float alert (enabled by default in prod by another session).

**Performance / UX / infra**
- TonConnect provider scoped to wallet routes (killed the 36-request burst on
  Home); `ActiveGame` lazy-loaded (board off the lobby's critical path);
  `prefers-reduced-motion` honored; React strict mode on.
- iOS navbar fix (`max()` safe-area insets, `viewport-fit=cover`, never-hide on
  main pages); leaderboard "Show Top 50" modal portal fix; honest wallet/stats
  error states; TonConnect "Play Game" crash fix **+ regression test**.
- CI: import-check secrets fix; now runs **all** `backend/tests` (~177 tests);
  static-export staleness guard made test-aware; auth-throttle tests made
  deterministic.

---

## Part 2 — Unaddressed issues (raised this session, NOT fixed)

### A. Money / fraud / security (highest value)
1. **Sybil / account-farming** — no hard limit on how many accounts one person
   creates and chains for referrals. Partly blunted by anti-collusion
   matchmaking, but no account-level cap. (Audit item 1d.)
2. **Puzzle solution leak** — `get_puzzle_by_id` (gamification.py) returns
   `"solution"` to the client, so XP can be farmed by echoing it to
   `verify_puzzle_solution`. Bounded (one-time puzzles via `SolvedPuzzle`) but
   the server-side check is defeated. Proper fix = server-side incremental move
   validation (frontend `PuzzleBoard` currently needs the solution for UX).
   (Audit item 3.)
3. **Auth throttle Redis-down latency** — when Redis is genuinely down in prod,
   `register_auth_failure`/`auth_ip_is_blocked` retry Redis on *every* auth
   (multi-second timeout each) instead of flipping to the memory path. Should set
   `SessionManager._use_memory=True` on first error (like the game-state ops do).
4. **No per-withdrawal confirmation / 2FA** — velocity controls exist, but a
   large withdrawal within the cap still auto-pays; no secondary confirmation.
5. **Hot-wallet single point of failure** — `PAYOUT_MNEMONIC` is a plaintext env
   var; leak = total drain. Consider a signing service / withdrawal limits /
   multisig. (Owner/architecture.)

### B. Product goal: "deposit whatever currency, seamlessly"
6. **No in-app swap to USDT** — a TON/BTC holder must leave the app to swap, then
   return. The actual unlock is a TON DEX-aggregator swap widget (STON.fi /
   DeDust).
7. **Gas wall** — a USDT-holder with **no native TON** cannot deposit (jetton
   transfers need TON gas), and there's no in-app way to get gas. Needs gas
   abstraction / gasless relay.
8. **Two-step Transak card flow** — buys USDT to the user's *own* wallet, then
   they must return and do a second on-chain deposit (pay gas again).
9. **Manual-transfer memo footgun** — a deposit without the exact `ref_` comment
   is unattributable and lost; the warning is easy to miss.
10. **Two duplicated deposit components** (`DepositModal` + `LobbyDepositDrawer`)
    — both USDT-only now, but they drift; should be consolidated.

### C. Trust / legality (can dwarf the code)
11. **Regulatory** — real-money wagering with **no KYC, age, geo, or licensing**.
    The biggest non-code risk. (Owner.)
12. **Fabricated data** — fake "online" / "active users" counts (`PlayLobby`) and
    fake referral-winner toasts (`ReferralNotification`). Trust + regulatory
    liability. (User chose to skip earlier.)
13. **Negative stat framing** — Home leads with win-rate / loss-streak /
    W-L-D; demoralizing for struggling players. (User chose to skip.)

### D. Localization / accessibility / polish
14. **RTL for Arabic** — not implemented; the whole locale renders
    mirrored-wrong. Plus 2 membership keys still untranslated (`compare_tiers`,
    `hide_comparison`).
15. **Onboarding & CustomAlertModal hardcoded English** — first-touch surfaces
    not localized despite 10 locales; onboarding is 4 dense slides.
16. **Accessibility** — icon-only navbar with no `aria-label`; settings toggles
    expose no on/off state; rank medals color-only; empty states are dead-ends
    ("No transactions found" can't distinguish empty vs failed-to-load).
17. **Micro-typography** — pervasive 7.5–9px ALL-CAPS with heavy tracking is
    below the iOS legibility floor and truncates long locales.
18. **Triple-labeling** — e.g. LEADERBOARD → GLOBAL RANKING → GLOBAL LEADERBOARD
    stacked; one heading + one eyebrow would do.
19. **Render/animation cost** — always-on starfield + scanlines + blurred mesh
    blobs + infinite framer pulses caused repeated preview render stalls; a real
    concern on low-end devices even with reduced-motion.

### E. Infra / process (owner-side)
20. **No branch protection** — CI doesn't block merges; pushes go straight to
    `main`, and multiple sessions edit the same money code concurrently (a
    regression time-bomb; the double-credit incident already happened once).
21. **No staging environment, no rollback story, no stated backup strategy** —
    money/auth changes ship straight to a live real-money app.
22. **Stacking-context audit for other modals** — a background task was spun off
    to check `MatchOverModal` and the membership-page modals for the same
    portal/z-index trap the leaderboard modal had; verify it was done.

### F. Verification debt
23. **Full pytest suite not re-run to 100% confirm green** after the
    auth-throttle test fix (high confidence — isolated fixture, other 175 passed
    — but not re-verified end to end).
24. **RTL / accessibility / desktop-sidebar** UX from recent merges only
    spot-checked, not exercised end to end in a real client.

---

*Recommended next: A3 (throttle fail-fast, quick), then A2 (puzzle leak) or A1
(Sybil). The B-group (swap + gas) is the real feature work for the deposit goal.
The C-group (regulatory, fake data) is the highest business risk and is the
owner's call.*
