# ChessTGBot — Session Handover (updated 2026-07-14)

Handover for a fresh session. Contains the remaining work plus the historical
production-engagement baseline formerly kept in `HANDOVER2.md`. The original
audit's A-group (Sybil, puzzle leak, Redis fail-fast, withdrawal 2FA),
B-group (swap, gas grants, arrival detection), D-group (RTL, i18n, a11y,
typography, animations), E3 (modal portals), the notification-system overhaul,
and all of this week's production crash fixes are DONE and pushed to `main`.

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
> Academy puzzle-instruction fixes (both merged to `main`, see below). The
> reduce-motion preference is implemented.
>
> **Cross-chain deposits:** `main` now uses a self-custodial
> BTC/ETH → user TON wallet → verified USDT deposit flow. The earlier Changelly
> API/order implementation was removed. The owner accepted activation without
> funded mainnet canaries; the UI now defaults ON and retains an explicit
> build-time emergency kill switch.

---

## Shipped this session (merged to `main`) — context + post-deploy watch

- **In-app Reduce motion setting** — a Settings toggle persists in local
  storage, stamps `data-reduce-motion` before paint, freezes CSS/Tailwind
  animations, and switches the app-wide Framer Motion policy to `always`.
  Turning it off restores the OS preference rather than forcing animation on.
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

### Self-custodial BTC/ETH deposits — implemented, activation-gated
Current `main` removes the custodial Changelly API, provider
orders, backend endpoint, tracking table/migration, credentials, and provider
status polling. `SelfCustodyBridge.tsx` guides users through wallet-owned routes:

- **ETH/Ethereum assets:** bridge USDT from Ethereum to the connected TON wallet
  with Stargate.
- **Native BTC:** swap BTC to Ethereum USDT in the user's wallets with THORSwap,
  then bridge that USDT to the connected TON wallet with Stargate.
- The bridge links are hard-coded and hostname-allowlisted to reduce phishing
  risk. The connected user's non-bounceable TON address is shown and copyable.
- Before opening the final bridge, the deposit modal snapshots the user's USDT
  balance and watches for newly arrived USDT. It then prefills the existing
  normal deposit; the user still signs the final transfer to the master wallet.

**Money invariant:** external protocol status never credits platform balance.
BTC, ETH, and bridged representations never enter platform custody. Only the
existing verifier's canonical TON USDT transfer to the master wallet with
`ref_<telegram_id>` can credit balance and its transaction-hash dedup remains
the settlement authority.

**Why TON Teleport is not used:** its official user documentation still labels
it public testnet-only and warns not to send real funds. Reconsider a direct
BTC → tgBTC → USDT route only after a documented mainnet launch, audited
contracts, sufficient TON DEX liquidity, and successful wallet canaries.

**Post-activation validation and monitoring:**
1. The owner accepted activation without funded ETH/BTC canaries. The bridge
   defaults ON; set `NEXT_PUBLIC_SELF_CUSTODY_BRIDGE_ENABLED=false` and rebuild
   as an emergency response if a route is unsafe or misbehaves.
2. When funds are available, run a minimum Ethereum route and inspect the TON
   output jetton master. It MUST be canonical TON USDT
   `EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs`; an OFT/wrapped USDT
   representation is not accepted and must not be presented as a deposit.
3. Run a minimum native-BTC route through THORSwap to Ethereum USDT, then the
   same Stargate canary. Confirm both swaps honor minimum-received bounds and
   every destination shown by the wallets belongs to the user.
4. Confirm the arrival watcher detects only the delta in the connected user's
   canonical USDT balance and prefills the existing deposit correctly.
5. Complete a final deposit from each canary and prove exactly-once credit plus
   the existing 5% Web3 top-up split. Bridge or swap completion alone must not
   change `users.balance`.
6. Review THORSwap/Stargate terms, frontend geography restrictions, protocol
   risks, supported wallets, and disclosures. "No exchange account" does not
   remove ChessTGBot's own legal/compliance obligations.
7. Watch bridge-open → arrival → deposit telemetry. Disable the bridge with the
   kill switch if canonical asset delivery or settlement behavior is uncertain.

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

---

## 2. Owner / ops items (not code)

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

## 3. Context a fresh session should know (don't re-derive)

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

---

## 4. Production engagement baseline (historical 48h snapshot)

This section consolidates the former `HANDOVER2.md`. It is a dated baseline,
not current production truth. The read-only source is
`backend/scripts/engagement_report.py`, run against production Postgres for the
48-hour window ending around 2026-07-12 20:17 UTC. Re-run with
`railway run python backend/scripts/engagement_report.py`; the SQL-only variant
is `backend/scripts/engagement_48h.sql`.

### Baseline numbers

| Metric | Value |
|---|---|
| New signups | **465** |
| Active users (app/games/money) | **83** |
| App sessions | 1,197 |
| Bot blocks | 37 |
| Games: computer / online PvP | **134 / 4** |
| Matchmaking: join / matched / abandon / timeout | 54 / 6 / 41 / 3 |
| Match success rate | **11%** |
| Timed out or abandoned | **81%** |
| Wagered games / volume / rake | **0 / $0 / $0** |
| Completed deposits | **0** |
| Total user balance held | **$13.97** |
| Referrals: rows / distinct referrers / referred users who played | **823 / 5 / 50** |
| Funnel: signup → open → play → PvP → wager → deposit | 465 → 0* → 22 → 1 → 0 → 0 |

\* `opened_app = 0` was a measurement bug, not reality. Top screens were
`/home` 554, `/academy` 337, `/` 323, `/game` 282, `/challenges` 178,
`/academy/puzzle` 158, and `/settings` 114, followed by Arabic/Russian routes.

### What the snapshot showed

1. **Referral-heavy signup growth had very weak activation.** Five referrers
   drove 465 signups, but only 22 played anything, one reached PvP, none
   wagered or deposited, and 37 blocked the bot. The vanity signup count hid a
   much smaller genuinely active base.
2. **PvP demand existed but matchmaking conversion was poor.** Only 6 of 54
   queue joins matched; 81% abandoned or timed out. Almost all games were
   against the computer. This made demand concentration and a graceful
   fallback the clearest product lever.
3. **The money loop was idle.** The window had no completed deposits, wagered
   games, or rake. Wagering was downstream of both funding and successful PvP
   matching.
4. **Activation attribution was broken.** The funnel claimed no new user
   opened the app even though 22 played, proving `session_start` identity was
   not being attributed correctly.

### Work completed after the snapshot

- **Matchmaking recovery:** the matcher already widened ELO and time-control
  pools as waits grew. The client now offers a clearly labeled AI game after
  15 seconds, records offered/accepted telemetry, keeps navigation available,
  and uses the existing queue-leave refund path before AI selection. Free
  searches can opt into a Telegram opponent notification for up to 30 minutes;
  cancel and AI fallback remove the queue entry, and wagered searches are
  excluded. A server queue strip reports unique, non-expired users in the
  selected pool and across all pools.
- **Referral activation gates:** attribution is recorded at signup, while
  rewards unlock only after three games with at least ten moves. Same-IP
  attribution is rejected and per-referrer velocity caps apply.
- **Authenticated telemetry attribution:** the backend now derives telemetry
  `user_id` from verified Telegram init data and ignores a client-supplied
  identity. Regression coverage prevents spoofed IDs from overriding it.
- **Deposit-funnel events:** tracking now covers modal open, initiation,
  address copy, completion/abandonment, and a separate submitted-pending state
  so indexing delays are not mislabeled as abandonment.
- **Insufficient-wager telemetry:** matchmaking, balance guards, and friend
  wagers emit balance shortfall, wager, time-control, custom-wager, and source
  metadata.
- **Referral-quality telemetry:** `referrals.activated_at` is written
  atomically when the qualifying reward unlocks; `referral_activated`,
  activated counts, and activation rate are available separately from raw
  referrals. The migration backfilled prior qualifying activations.
- **Nightly telemetry rollups:** complete UTC days are aggregated into
  `telemetry_daily_rollups` by event type with event and unique-user counts.
  A two-day overlap is replaced for delayed batches, raw rows older than 30
  days are pruned, rollups are retained indefinitely, and a PostgreSQL
  advisory lock makes multiple workers safe. Configure with
  `TELEMETRY_MAINTENANCE_HOUR_UTC` and `TELEMETRY_RAW_RETENTION_DAYS`.

### Interpretation notes

- Money columns are cents; divide by 100 for USDT.
- Self-custodial bridge events are operational funnel signals only. They never
  credit platform balances; the eventual verified canonical TON USDT deposit
  is the settlement event growth reporting should count.
- The Web3 top-up split uses an inclusive 5% fee: the UI treats the submitted
  amount as the total charge, and both on-chain credit paths calculate
  `fee = round(total * 0.05)` and `credited = total - fee`.
- At snapshot time the first two arenas had zero participants; the first arena
  under the four-slot regional schedule was live with two participants and two
  games. Region targeting had only just deployed.
- Do not extrapolate from one 48-hour window or treat these numbers as current.
  Re-run the report when a fresh production read is needed.
