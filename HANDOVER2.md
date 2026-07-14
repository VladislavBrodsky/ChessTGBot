# ChessTGBot — Engagement Findings Handover (2026-07-12)

Companion to `HANDOVER.md` (which tracks remaining feature/ops work). This doc
holds a **data-driven read of real production behaviour** and the growth work it
points to. Kept separate on purpose.

**Source:** `backend/scripts/engagement_report.py` (read-only) run against the
production Postgres, 48h window ending ~2026-07-12 20:17 UTC. Re-run any time:
`railway run python backend/scripts/engagement_report.py` (or paste it into the
Railway backend shell — it reads `DATABASE_URL` from the env). SQL-only variant:
`backend/scripts/engagement_48h.sql`.

---

## Baseline numbers (48h snapshot — compare future runs against this)

| Metric | Value |
|---|---|
| New signups | **465** |
| Active users (app/games/money) | **83** |
| App sessions | 1197 |
| Bot blocks in window | 37 |
| Games: computer / online (PvP) | **134 / 4** |
| Matchmaking: join / matched / abandon / timeout | 54 / 6 / 41 / 3 |
| — match success rate | **11%** |
| — timed-out or abandoned | **81%** |
| Wagered games / volume / rake | **0 / $0 / $0** |
| Deposits (completed) | **0** (2 stuck `pending`, $15) |
| Total user balance held | **$13.97** |
| Referrals: rows / distinct referrers / referred-who-played | **823 / 5 / 50** |
| Funnel: signup→open→play→pvp→wager→deposit | 465 → 0* → 22 → 1 → 0 → 0 |

\* `opened_app = 0` is a **measurement bug**, not reality — see below.
Top screens: /home 554, /academy 337, / 323, /game 282, /challenges 178,
/academy/puzzle 158, /settings 114 (then ar/ru locales).

---

## Four headline findings

### 1. Growth is being farmed; the signups are dead accounts
465 signups came from just **5 distinct referrers** (823 multi-tier referral
rows). Five accounts driving 465 signups in 48h is not organic — it's
referral-incentive farming. Those users don't engage: of the 465, **22 played
anything (4.7%), 1 PvP, 0 wagered, 0 deposited**, and 37 blocked the bot. Real
active users ≈ 83. The platform is **paying referral commissions (19 completed)
on accounts that never play**, and the 465 vanity number hides near-zero real
engagement. The Sybil guards (`signup_ip_hash`, 3-game/10-move milestone,
per-referrer velocity caps in `config.py`) exist but are being beaten — rewards
fire on signup, before real activation.

### 2. PvP matchmaking is broken — the biggest fixable lever
**54 players joined the queue, only 6 matched (11%); 81% timed out or
abandoned.** Demand for PvP clearly exists, but matching starves — which is why
only 4 of 138 games were online (97% vs the computer). This is measured cleanly
by the `queue_*` telemetry events. The Daily Arena (just shipped, concentrates
demand into windows) is the structural fix; a queue AI-fallback is the tactical
one.

### 3. The money engine is idle
**0 completed deposits, 0 wagered games, 0 rake in 48h.** Two deposits are stuck
`pending` ($15), one `game_wager` shows `failed` (-$5). Total balance held across
all users is **$13.97**. For a real-money app this is the existential finding:
the revenue loop is not turning. Wagering is downstream (needs a funded balance +
a PvP match), so deposits + PvP matching are the unlocks.

### 4. A measurement bug is hiding the activation funnel
The funnel reports `opened_app = 0` for the 465 cohort, yet 22 of them played —
impossible unless `session_start` telemetry isn't attributing `user_id` to the
new signups' `telegram_id`. **Activation is currently unmeasurable.** (By
contrast the `queue_*` events worked perfectly — that's how #2 was caught.)

---

## Prioritized action list (growth track)

1. **Investigate the 2 pending deposits / 0 completions** — money-critical and
   concrete. Trace the deposit-arrival path (`ref_` crawler + confirmation;
   `deposit/verify`). Why does nothing reach `completed`? Then the Transak
   direct-credit unblock (HANDOVER.md B3) removes the second on-chain hop that
   likely kills conversion.

   > **INVESTIGATED 2026-07-12 (code trace; not yet resolved).** Key findings:
   > - The 2 `pending` rows are **Stripe card sessions, not on-chain** — the
   >   original on-chain framing was wrong. `Transaction.status` defaults to
   >   `"completed"`, and the ONLY path that writes a `pending` deposit is
   >   `stripe_create_session` (`wallet.py`). Every on-chain path
   >   (`/deposit/verify`, `deposit_crawler`, TON push `/webhook`) writes
   >   `completed` directly, so an on-chain deposit can never be `pending`.
   > - **Stripe deposits are credited ONLY by the webhook** (`/stripe/webhook`).
   >   The redirect handler `/stripe/verify-session` and the frontend
   >   `DepositModal` poll are **read-only** (they just return `tx.status`) — no
   >   credit-on-redirect fallback, and there is **no reconciliation sweeper** for
   >   pending deposits (withdrawals have one). So any webhook miss = card charged,
   >   user never credited, silently, forever.
   > - The prod webhook secret **is** set (prod `POST /stripe/webhook` returns
   >   400, not 501). Prime suspect: `WEBAPP_URL` defaults to the **dead monolith**
   >   `chesstgbot-production.up.railway.app` (returns 404), and Stripe
   >   success/cancel URLs are built from it (`wallet.py`); the Stripe Dashboard
   >   webhook may point at that same dead host → deliveries fail → tx stuck.
   > - **On-chain "0 completed" is a demand problem, not a bug** — `USDT_MASTER`
   >   is the official Tether jetton and the path is sound; consistent with the
   >   $13.97 total balance.
   >
   > **FOLLOW-UP 2026-07-13 (still unresolved):** The current production query
   > shows **3** pending live Checkout Sessions, not 2. Stripe Workbench screenshots
   > show green integration health and successful `POST /v1/checkout/sessions`
   > calls. That proves session creation works; it does **not** prove any Session
   > was paid, that `checkout.session.completed` was emitted, or that the webhook
   > reached this backend. For each of the 3 Session IDs, an owner with Dashboard
   > access still needs to record `status` and `payment_status`, then inspect the
   > related Events/webhook delivery attempts.
   >
   > Current `main` now defaults `WEBAPP_URL` to `https://web3chess.online` and
   > `BACKEND_URL` to `https://api.web3chess.online`, and Stripe Checkout creation
   > has an idempotency key. This removes the dead-monolith default from current
   > code, but the deployed Railway variables and Stripe webhook destination still
   > need direct verification. The expected webhook endpoint is
   > `https://api.web3chess.online/api/v1/wallet/stripe/webhook`.
   >
   > **NEXT (needs owner Stripe access):** (a) classify all 3 Sessions as paid,
   > open/abandoned, or expired from `status` + `payment_status`; (b) inspect any
   > failed webhook deliveries; (c) verify Railway `WEBAPP_URL` and the Dashboard
   > endpoint use the live custom domains. Do not change credit logic or manually
   > credit balances until those facts are known.
   >
   > **CODE FIXES to apply (money-critical — get owner sign-off first):**
   > A. credit-on-redirect fallback (`Session.retrieve` → credit idempotently with
   > the webhook's lock+dedup); B. pending-deposit reconciliation sweeper
   > (mirror the withdrawal sweeper); C. treasury alert on any deposit `pending`
   > > N min; E. Transak webhook endpoint for B3 (blocked on owner dashboard
   > secret + prod API key).
2. **AI-fallback in the matchmaking queue** — after N seconds unmatched, offer a
   labeled bot game so the 81% who currently leave empty-handed get *a* game.
   Also widen the ELO window as wait grows; show real queue size + "notify me
   when an opponent joins." Recovers the clearest demand in the data.

   > **IMPLEMENTED AND MERGED 2026-07-13 (PR #9).** The matcher already widened
   > ELO and time-control pools as wait time grew. The client now offers a clearly
   > labeled AI game after 15 seconds, records offered/accepted telemetry, keeps
   > navigation available during the search, and relies on the existing
   > `leave_matchmaking` refund path before opening AI difficulty selection.
   > Free searches now also offer an explicit Telegram "notify me" option after
   > 15 seconds. Opt-in persists in the shared queue for up to 30 minutes,
   > survives leaving/reopening the lobby, and records `queue_notify_opt_in`;
   > Cancel and AI fallback still remove the entry, and wagered searches are
   > excluded. A separately labeled server queue strip now reports unique,
   > non-expired users in the selected pool and across all pools from the shared
   > Redis/in-memory queue. `queue_join` records the same `real_*` counts with a
   > `server_shared_queue` source marker for analytics. The existing simulated
   > engagement counts,
   > wait estimate, opponent ELO, and referral-payout feed remain enabled at the
   > owner's request (restored 2026-07-13).
3. **Gate referral rewards on activation, not signup** — pay when the referred
   user deposits or plays N real games; tighten per-referrer velocity. Stops the
   5-account farm from burning commissions on junk and refocuses invites on
   quality. (Complements the region-targeted arena notifications already shipped
   — watch the 37 blocks/48h for fatigue.)

   > **IMPLEMENTED BEFORE 2026-07-13; VERIFIED IN CURRENT CODE.** Referral
   > attribution is recorded at signup, but rewards unlock only after 3 games
   > with at least 10 moves, with same-IP rejection and per-referrer velocity
   > caps. The production data should be re-run to measure whether farms still
   > clear that activation threshold.
4. **Fix `session_start` → user attribution** (frontend `lib/telemetry.ts` /
   `TelemetryReporter.tsx` send `user_id`; verify it matches `telegram_id` and
   lands in `telemetry_logs.user_id`). Without it the activation funnel lies.

   > **FIXED 2026-07-13.** The telemetry endpoint now derives `user_id` from
   > verified Telegram init data and ignores the legacy client-supplied ID. The
   > frontend no longer parses identity from optional local storage. Regression
   > coverage proves a spoofed payload ID cannot override the authenticated ID.

## Still to do (prioritized, as of 2026-07-13)

1. **Resolve the three pending Stripe deposits before changing credit logic.**
   In live mode, record `status` and `payment_status` for each Session, classify
   it as paid, abandoned/open, or expired, and inspect the associated webhook
   deliveries. Verify the Dashboard endpoint is
   `https://api.web3chess.online/api/v1/wallet/stripe/webhook` and Railway
   `WEBAPP_URL` is `https://web3chess.online`. Green Health/API creation logs are
   insufficient evidence that payment completion and crediting work.
2. **After those production facts and explicit owner approval, harden Stripe
   crediting.** Extract one idempotent, row-locked credit function shared by the
   webhook and redirect verification; add a pending-deposit reconciliation
   sweeper; alert TREASURY when a deposit remains pending past the chosen SLA.
   Never credit from unverified redirect parameters alone.
3. **Measure matchmaking recovery after the 2026-07-13 merge/deploy.** The real
   queue-size signal and free-search "notify me" option are implemented; measure
   `queue_notify_opt_in`,
   `queue_ai_fallback_offered` to `accepted`, and matched/abandon/timeout rates
   to determine whether the 15-second offer is at
   the right point. The simulated lobby counters and referral-payout feed remain
   enabled by owner request and must not be treated as analytics. Use only the
   server-emitted `real_pool_queue_size`, `real_total_queue_size`, and
   `queue_size_source=server_shared_queue` fields for queue-depth analysis.
4. **Re-run the engagement report after at least 48 hours of the corrected
   telemetry.** Compare activation, queue conversion, AI-fallback acceptance,
   deposit-funnel completion, referral quality, arena participation, and bot
   blocks against the baseline in this file. Do not use the 2026-07-12 snapshot
   as current production truth.
5. **Transak direct credit remains blocked on owner configuration.** Obtain the
   production API key and webhook secret before implementing signed
   `ORDER_COMPLETED` handling and order-id deduplication.
6. **Activate self-custodial BTC/ETH deposits only after live canaries.** Branch
   `feat/cross-chain-deposits` removed Changelly and now guides wallet-owned
   THORSwap/Stargate routes into the user's TON wallet. It defaults OFF via
   `NEXT_PUBLIC_SELF_CUSTODY_BRIDGE_ENABLED=false`. Prove each route delivers
   canonical TON USDT (not a wrapped/OFT representation), the arrival watcher
   sees it, and the user's subsequent normal deposit credits exactly once. See
   `HANDOVER.md` for the full activation and compliance checklist.

## Tracking gaps to add (so the next read is sharper)
- Deposit-funnel events: `deposit_modal_open → initiated → address_copied →
  completed/abandoned` (today only the final `transactions` row exists — can't
  see where the 2 pending stalled).
  **Added 2026-07-13**, including separate submitted-pending events so an
  on-chain transfer awaiting indexing is not mislabeled as abandoned.
- `wager_insufficient_balance` — direct measure of deposit demand.
  **Added 2026-07-13** for matchmaking, its balance safety guard, and friend
  wagers, with wager, wallet balance, shortfall, time control, custom-wager, and
  source metadata.
- Referral-quality: referred-user activation, not just referral count.
  **Added 2026-07-13.** `referrals.activated_at` is written atomically when the
  qualifying three-game reward unlocks; the same transaction emits
  `referral_activated`. User referral stats and admin stats now expose activated
  counts and activation rate separately from recent active referrals. The
  migration backfills prior activations from completed signup-bonus transactions.
- A nightly rollup table (telemetry_logs has no retention/aggregation — fine for
  48h, expensive for trends).
  **Added 2026-07-13.** At 02:00 UTC by default, complete UTC days are aggregated
  into `telemetry_daily_rollups` by event type with event and unique-user counts.
  A two-day overlap is replaced on each run for delayed batches, then raw rows
  older than 30 days are pruned. Rollups are retained indefinitely. Configure
  with `TELEMETRY_MAINTENANCE_HOUR_UTC` and
  `TELEMETRY_RAW_RETENTION_DAYS`; a PostgreSQL advisory lock makes scaled
  workers safe.

## Notes / caveats
- Money columns are cents; `amount/100` = USDT.
- Self-custodial bridge telemetry is operational funnel data only. It never
  credits balances; verified canonical USDT sent from the user's TON wallet to
  the master wallet remains the sole settlement authority. Growth reporting
  should count the eventual completed `transactions` deposit, not a bridge-open
  event or external protocol completion.
- PR #9 also fixed the Web3 top-up fee regression caught by CI. The Web3 UI sends
  requested credit plus a 5% fee, so both on-chain credit paths now split the
  received total with `credited = round(total / 1.05)` and record the remainder
  as the fee. The full backend suite passed before merge. This does not resolve
  or alter the three pending Stripe Checkout Sessions above.
- Arena data at snapshot: #1,#2 (19:00, old single-slot schedule) finished with 0
  participants; #3 (20:00, new 4×/day schedule) was **live with 2 participants /
  2 games** — the region-targeting had only just deployed. Re-check arena
  participation + per-user notification volume over the next few days (HANDOVER.md
  "post-deploy watch").
- Don't over-read a single 48h window, and don't fabricate numbers — re-run the
  script for fresh data.
