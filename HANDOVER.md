# ChessTGBot — Session Handover (updated 2026-07-12)

Handover for a fresh session. Contains **only what is still left to do** — the
original audit's A-group (Sybil, puzzle leak, Redis fail-fast, withdrawal 2FA),
B-group (swap, gas grants, arrival detection), D-group (RTL, i18n, a11y,
typography, animations), E3 (modal portals), the notification-system overhaul,
and all of this week's production crash fixes are DONE and pushed to `main`
(HEAD at time of writing: `6304472d7`).

**Project:** Telegram Mini App chess with real-money USDT wagering. Next.js
frontend + FastAPI/Socket.IO backend, Postgres + Redis, TON chain for
deposits/payouts. Production = two Railway services auto-deployed on push to
`main` (frontend runs `next start`; backend FastAPI). `backend/static_frontend`
is a committed export for the monolith path — **rebuild after any
`frontend/src` change** (`cd frontend && npm run build:static`) and commit it
(CI enforces freshness on PRs).

**Test commands:** `cd backend && ./venv/Scripts/python -m pytest`
(262 passed / 2 skipped at handover) · `cd frontend && npm run test:ci` ·
frontend build doubles as the typecheck.

> **This session:** shipped the region-targeted Daily Arena overhaul and the
> Academy puzzle-instruction fixes (both merged to `main`, see below). Two new
> code items from user feedback remain — see §1 (reduce-motion toggle,
> game-only display name/avatar).
>
> **Cross-chain branch:** `feat/cross-chain-deposits` adds BTC/ETH conversion
> deposits through Changelly, but is intentionally OFF until the activation
> checklist below is completed. It has not been merged to `main` or deployed.

---

## Shipped this session (merged to `main`) — context + post-deploy watch

- **Academy puzzle-instruction fixes** — a user reported ~50% of the first 10
  puzzles had wrong instructions; engine-confirmed (mate-in-1s that weren't
  mate, a "fork" that didn't fork, an illegal position whose solution captured
  the king, "win the queen" that won a pawn). Corrected #3–#9 in
  `backend/app/core/puzzles.py` (kept #1/#2/#10 — puzzle 1's `g5f7` is asserted
  by `test_puzzle_gating`) and rebuilt the 11–100 generator, which had been
  cycling three mate-in-1 FENs under mismatched "Fork/Pin/Skewer" labels. New
  `backend/tests/test_puzzles_valid.py` engine-verifies all 100 (legal single
  move + the stated tactic actually holds).
- **Region-targeted Daily Arena** — runs 4 arenas/day (`ARENA_START_UTC` =
  `02:00,08:00,14:00,20:00`); each user is notified for only their best-fit slot
  — explicit `users.region` > peak play-hour mined from `game_history` >
  `preferred_language` — so ~1 ping/user/day no matter how many arenas run
  (`backend/app/services/arena_targeting.py`). Adds opt-out
  (`users.arena_notifications` + Settings toggle) and a region-ask modal on entry
  (`frontend/src/components/RegionPrompt.tsx`). Wired the previously-orphaned
  `ArenaBanner` into the game lobby (`PlayLobby.tsx`) so the arena is joinable.
  Migration `a1f7c39b52d0` (region + arena_notifications).
  **Post-deploy watch:** this is the first time the arena runs 4×/day and sends
  real region-targeted notifications, and the first live `join_arena` round-trip
  runs in prod (never browser-E2E'd — Telegram-auth-gated). Watch the first few
  windows' logs; confirm per-user notification volume is ~1/day, not a full-base
  blast (the whole point of the targeting).

---

## 1. Code work remaining

### Accessibility — in-app "Reduce motion" toggle (from user feedback; small–medium)
An autistic user reported the "excessive movement of notifications is too
distracting to play." The app already respects OS-level reduced motion
(`frontend/src/app/globals.css` `@media (prefers-reduced-motion: reduce)`
~line 1006, plus framer `MotionConfig reducedMotion="user"` in
`frontend/src/components/Providers.tsx`), but there is no in-app control — many
Telegram WebView users never set the OS flag. Ambient motion is heavy:
`ActiveGame.tsx` (~14 always-animating elements), `PlayLobby.tsx` (~12),
`ArenaBanner` pulses/pings. Fix: add a "Reduce motion" toggle in Settings
(alongside the new Arena-alerts toggle), persist it, and gate animations via a
root `data-*` attribute (covering Tailwind `animate-pulse`/`animate-ping` and
framer variants). Dovetails with the Settings changes already on `main`.

### Privacy — game-only display name + avatar (from user feedback; larger)
Same user asked to "change username and profile pic just for the game and
referrals." Identity is currently pulled straight from Telegram
(`first_name`/`username`/`photo_url`) and shown in games, the leaderboard, arena
standings, and referral notifications. Add optional override fields on `User`
(+ migration), a Settings UI, and update every render site. **Needs a
moderation story** (impersonation + offensive names) and MUST keep the
`html.escape()` discipline for any name entering a `parse_mode="HTML"` message
(see §4 / CLAUDE.md — a raw `<` crashed `/start` for weeks). Scope as its own
feature.

### C2 — Remove fabricated data (recommended next; owner has deferred twice)
Real-money app showing invented numbers = trust + regulatory liability.
- `frontend/src/components/game/PlayLobby.tsx:130` — `activeUsers` seeded at
  `3768` and drifted with `Math.random()` every few seconds (~line 268);
  `playersOnline` similarly fake; opponent card shows randomized ELO
  (`stats.elo ± 20`, ~line 539).
- `frontend/src/components/ReferralNotification.tsx` — fake "X just won $Y via
  referral" toasts from a hardcoded name list.
- Fix: replace with real counts (backend has a matchmaking queue + telemetry
  now — a cheap `GET /api/v1/game/online-count` from socket/session data is
  feasible) or remove the widgets entirely. Removing is the fast safe option.

### C3 — Negative stat framing (owner previously chose to skip; small)
`frontend/src/app/[locale]/home/page.tsx:~230` leads with win-rate % and a
loss-streak badge. If ever picked up: lead with XP/level/games played, tuck
W/L% behind a details view.

### B3 full fix — Transak webhook direct credit (BLOCKED on owner config)
Today: card buys USDT to the user's own wallet; the deposit modal then watches
for arrival and prefills the deposit (shipped). The real fix removes the second
on-chain step entirely:
- Set Transak `walletAddress` = master wallet, `partnerOrderId` = `ref_<tgId>`.
- New backend endpoint: Transak webhook (signed; verify with their
  access token / webhook secret) → on `ORDER_COMPLETED`, credit the user
  keyed by `partnerOrderId`, dedup on Transak order id (same pattern as
  `deposit/verify` + crawler dedup keys).
- **Blocked until owner sets up webhook secret + production API key in the
  Transak dashboard** (`NEXT_PUBLIC_TRANSAK_API_KEY` currently drives the
  card tab; STAGING default).

### Cross-chain BTC/ETH deposits — implemented, activation-gated
Branch `feat/cross-chain-deposits` adds a backend-only Changelly API client,
fixed-rate quote/order/status endpoints, `cross_chain_deposits` tracking table
(migration `c4d9a5e7b2f1`), and a deposit-modal flow for BTC and ETH. Changelly
converts the source asset to **USDTON** and pays the existing master wallet with
`ref_<telegram_id>`. The frontend section is hidden unless the feature flag and
credentials are present.

**Money invariant:** Changelly status NEVER credits a platform balance. A
provider order can say `finished`, but credit still happens only after the
existing TON path independently observes verified official USDT at the master
wallet with the attribution memo. This preserves the one money-entry path and
its existing transaction-hash deduplication.

**Do not enable in production until all of these are complete:**
1. Apply Alembic migration `c4d9a5e7b2f1` and obtain a Changelly partner API
   key plus RSA PKCS#8 private key (hex DER form).
2. Set `CHANGELLY_API_KEY`, `CHANGELLY_PRIVATE_KEY_HEX`,
   `CHANGELLY_API_URL=https://api.changelly.com/v2`, and
   `CHANGELLY_PAYOUT_CURRENCY=usdton`; leave
   `CROSS_CHAIN_DEPOSITS_ENABLED=false` initially.
3. Run one minimum-size BTC canary and one ETH canary. Confirm Changelly echoes
   the master payout address and `ref_<telegram_id>`, then inspect the actual
   USDTON jetton payout in Tonviewer/TonAPI and prove the memo survives in the
   transfer notification. If the memo is absent, **do not enable** — users would
   pay successfully but the deposit could not be attributed.
4. Prove each canary credits exactly once through the normal crawler/webhook,
   with the actual received USDT split by the existing 5% Web3 top-up rule.
   Provider quote/status alone must never move `users.balance`.
5. Review Changelly KYC/hold/refund behavior, supported countries, terms, and
   provider disclosures; geo-block or disable the flow wherever required.
6. Only then set `CROSS_CHAIN_DEPOSITS_ENABLED=true`. Watch provider failures,
   stuck orders, unattributed master-wallet receipts, and duplicate-credit
   alerts closely during the first live deposits.

**Follow-up hardening after the canary:** add an admin order viewer and TREASURY
alerts for paid/sending/finished orders that do not become an on-chain credited
deposit within the chosen SLA. The current UI polls status; the deposit crawler
continues independently if the user closes Telegram.

### Decision-gated (do NOT start without an explicit owner call)
- **A5 hot wallet** — `PAYOUT_MNEMONIC` is a plaintext env var; leak = total
  drain. Cheapest real mitigation: dedicated payout wallet holding only a
  small float, topped up manually from cold storage (code change: none —
  just move funds + swap env vars). Bigger: signing service / multisig.
- **Device fingerprinting (A1 residual)** — IP-based Sybil guards stop lazy
  farms; a determined IP-rotator needs client fingerprinting. Privacy/infra
  decision first.
- **Multi-move puzzles** — all 100 puzzles are single-move; a tripwire test
  (`backend/tests/test_puzzle_gating.py::test_all_puzzle_solutions_are_single_move`)
  fails the suite if a multi-move puzzle is added before server-side
  incremental validation exists. Only relevant if content expands.

### Minor polish leftovers (batch when convenient)
- Admin page `frontend/src/app/[locale]/admin/page.tsx:~686` — "No
  transactions" empty state is a dead-end (no error/retry distinction).
  The user-facing ledger already has the pattern to copy
  (`TransactionLedger.tsx` `error`/`onRetry` props).
- Onboarding is 4 dense slides (copy condensation, D2 residual).
- ~280 locale strings (deposit/swap/gas flows) in ar/hi/ja/zh were
  machine-authored this week — worth a native-speaker skim.

---

## 2. Verification debt (needs a human with a device — F2)

Everything below is tested in CI but **unproven in the live Telegram app**.
~20 minutes with a real wallet holding ~2 TON:
1. **Swap**: deposit modal → "Have TON but no USDT? Swap in-app" → swap ~1 TON.
   Expect quote, STON.fi router as tx destination, then "USDT arrived —
   prefilled" within ~1 min, then complete the deposit. Worst-case failure is
   contained to the user's own wallet (router refunds failed swaps).
2. **Gas grant**: from a wallet with USDT but no TON, tap "⛽ … free splash".
   Expect bot DM + ~0.06 TON; a second tap must be refused (30-day cooldown).
3. **Withdrawal confirmation**: request a sub-$500 withdrawal. Expect bot DM
   with Confirm/Cancel; funds stay held until Confirm; Cancel refunds; an
   ignored request auto-refunds after 30 min.
4. **/start with a hostile display name** (symbols like `<`, `&` in the
   Telegram name) — must reply normally (was crashing until `996c2102b`).
5. Spot-check Arabic RTL, the deposit modal on a low-end phone (lite-fx), and
   desktop sidebar UX.

---

## 3. Owner / ops items (not code)

- **Branch protection on `main`** — CI exists but doesn't gate merges; multiple
  concurrent sessions push straight to a live money app (a crash shipped and
  was fixed mid-stream this week; a double-credit incident happened before).
  ~10 min in GitHub settings.
- **Rotate the Postgres password** — alerts leaked `len + first5/last3` chars
  of it into Telegram for weeks before the fix. Treat as compromised.
- **Staging environment / rollback story / backup strategy** — still none.
- **Watch the new alerts for a few days**:
  - 🛡️ signup-cluster alerts may be noisy on carrier-NAT IPs → raise
    `SIGNUP_IP_CLUSTER_ALERT_THRESHOLD` (env) if so.
  - 🧊 "Withdrawal stuck in processing_payout" = crash mid-payout; follow the
    triage instructions IN the alert (check chain before refunding — never
    blind-refund).
- **Transak dashboard** — webhook secret + production key (unblocks B3 above).
- **KYC / age / geo / licensing** — the biggest non-code risk; unchanged.

---

## 4. Context a fresh session should know (don't re-derive)

- **Alert systems**: every admin alert is attributed to a named system
  (🎮 GAME CLIENT / ⚙️ CORE API / 💰 TREASURY / 🔌 REALTIME / 🛡️ SECURITY) via
  logger-prefix mapping in `backend/app/core/alerts.py`. Client crash reports
  are labeled by capture point. `app.services.telegram_bot` logger is
  excluded from alerts (loop prevention) — bot-handler errors must log via
  `app.bot.errors` instead.
- **Withdrawal flow**: `/wallet/withdraw` → velocity caps → (≥$500 →
  `pending_review`, admin approve/reject) or (below → `pending_confirmation`,
  bot Confirm/Cancel with HMAC nonce in callback_data;
  `backend/app/services/withdrawal_confirmation.py`). Sweeper in `main.py`
  refunds expired confirmations and pages stuck payouts. Without a bot token
  (dev/tests) the legacy auto-pay path applies.
- **Sybil guards**: `users.signup_ip_hash`/`created_at` (migration
  `a7f2e9c31b04`); same-IP referral attribution refused; signup bonuses capped
  5/24h per referrer (deferred, not forfeited); milestone needs 3 games with
  ≥10 moves. Knobs are env vars (see `config.py` "Sybil" block).
- **Gas grants**: `backend/app/services/gas_grant.py`; on-chain-proof gated,
  once per user+wallet per 30d, global 25/day. `GET /wallet/onchain-balances`
  proxies TonAPI for the client.
- **Swap**: `frontend/src/components/Wallet/SwapToUsdt.tsx`; STON.fi
  simulation API for quotes, SDK for tx build, proceeds go to the USER's
  wallet — platform money entry remains the USDT deposit path only.
- **Debugging production alerts**: first match the alert's chunk hashes /
  timestamps against the deploy timeline — the crash may be in an
  already-replaced build. Beware mixed commit timezones (sessions commit in
  -04:00 and -06:00). Curl the prod frontend HTML to see the live build.
  Alert tracebacks keep the TAIL (exception at bottom) and are HTML-escaped.
- **HTML notifications**: any user-controlled string (display names!) entering
  a `parse_mode="HTML"` message MUST be `html.escape()`d — a name with `<`
  crashed `/start` for weeks.
- **iOS/Telegram gotchas + prod topology**: see `CLAUDE.md` (two Railway
  services; monolith URL dead; `--app-safe-bottom` for bottom insets; navbar
  never hidden on main pages).
