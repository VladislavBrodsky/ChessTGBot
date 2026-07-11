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

---

## 1. Code work remaining

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

### Decision-gated (do NOT start without an explicit owner call)
- **A5 hot wallet** — `PAYOUT_MNEMONIC` is a plaintext env var; leak = total
  drain. Cheapest real mitigation: dedicated payout wallet holding only a
  small float, topped up manually from cold storage (code change: none —
  just move funds + swap env vars). Bigger: signing service / multisig.
- **Cross-chain deposits** — swap covers TON→USDT only. BTC/ETH holders need
  an aggregator integration (swap.coffee / LetsExchange) or stay on the card
  flow. Product decision first.
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
