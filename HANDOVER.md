# ChessTGBot — Gap Register (updated 2026-07-16)

Ten-pillar assessment of the app, reduced to **gaps only** — what is missing,
weak, or risky per pillar. Strengths are omitted by design; this is a worklist,
not a scorecard. Each pillar carries a letter grade for triage. Fix priority is
summarized at the bottom.

**Project:** Telegram Mini App chess with real-money USDT wagering. Next.js
frontend + FastAPI/Socket.IO backend, Postgres + Redis, TON chain for
deposits/payouts. Production = two Railway services auto-deployed on push to
`main`. `backend/static_frontend` is a committed export — rebuild after any
`frontend/src` change (`cd frontend && npm run build:static`) and commit it (CI
enforces freshness on PRs).

---

## 1. UI/UX — B+

- **The lobby leans entirely on simulated activity.** `playersOnline` seeds at
  782, `activeUsers` at 3768 (`frontend/src/components/game/PlayLobby.tsx`), and
  the match-found screen shows a fabricated opponent ELO (`yours ± 20`). It hides
  the empty-room problem but sets up a consistency break: a user who joins an
  "812 online" arena and then waits minutes for a match feels the lie — and the
  one truthful signal (the server-queue card) was just removed. Prefer honest-
  but-warm waiting states ("matching you against players in your rating range…")
  over more invented numbers.
- **`PlayLobby.tsx` is ~1,200 lines** mixing matchmaking logic, socket handling,
  and presentation. It is where UI bugs will breed; split matchmaking/socket
  state out of the view.

## 2. Security — B

1. **Web-login `initData` persists in `localStorage`** (`frontend/src/lib/api.ts`)
   — any XSS becomes a 24-hour credential theft. Raises the stakes on the HTML-
   escaping discipline.
2. **Rate limits are in-memory dicts** (`backend/app/api/v1/deps.py`) — they
   reset on every deploy (deploys are frequent) and will not survive going
   multi-replica.

## 3. Money-Flow Correctness — A−

- **Stripe card deposits have a known stuck-`pending` mode with no automated
  reconciliation.** `stripe_sweeper.py` exists but appears to be run by hand.
  "Harden deposit and subscription settlement" landed 2026-07-15 — verify it
  actually closed this; if not, add a scheduled reconciliation sweep.
- **Money ops are still partly manual.** One-off scripts live inside `app/`
  (`one_time_refund_kirill.py`, `process_payouts_backlog.py`,
  `sync_all_historical_deposits.py`, `stripe_sweeper.py`, `wallet_diagnostic.py`)
  — each hand-run is a risk. Move to `scripts/`/`ops/` with a runbook.
- **A5 hot wallet (decision-gated):** `PAYOUT_MNEMONIC` is a plaintext env var;
  leak = total drain. Cheapest mitigation: dedicated payout wallet holding a
  small float, topped up manually from cold storage (no code change — move funds
  + swap env vars). Bigger: signing service / multisig.

## 4. App Integrity — B−

- **No engine-cheat detection — the dominant threat in real-money chess.**
  Someone running Stockfish in another window is currently undetectable and
  unbeatable. Start with **post-hoc** analysis on wagered games (engine move-
  match %, centipawn-loss profiles) feeding a review queue that gates large
  withdrawals; real-time detection can come later.
- **Fabricated counters + fake opponent ELO are an integrity liability**, not
  just a UX choice (see Legal).
- **Matchmaker/arena/rate-limit/profile-cache state is in-memory, single-
  instance by design.** Fine now, but it is an undocumented ceiling on
  horizontal scaling.
- **Device fingerprinting (A1 residual, decision-gated):** IP-based Sybil guards
  stop lazy farms; a determined IP-rotator needs client fingerprinting.
  Privacy/infra decision first.

## 5. Deployment & CI — B+

- **No staging environment.** Prod *is* the test environment; yesterday's schema
  incident put prod down ~6 hours partly for this reason. A lightweight Railway
  staging env + PR-preview habit for risky backend changes would cut incident
  frequency materially.
- **`main` is unprotected.** CI exists but does not gate merges; multiple
  concurrent sessions push straight to a live money app (a crash shipped and was
  fixed mid-stream this week; a double-credit incident happened before). ~10 min
  in GitHub settings.
- **No health-check-gated deploy and no automated rollback** — rollback is a
  manual redeploy.

## 6. Performance — B

- **Several frontend components poll on `setInterval`** (arena status, balances,
  countdowns in `PlayLobby.tsx`, `ArenaBanner.tsx`, `DepositModal.tsx`,
  `SeasonalCountdown.tsx`, admin page). Fine at hundreds of users, additive at
  thousands — the Socket.IO push channel already exists for most of it.
- **Avatar 404s re-fetch every render** with no negative caching
  (`/api/v1/users/avatar/{id}` — heavy in the logs).
- **The single-instance in-memory state caps scaling to "bigger box"** until
  refactored — acceptable, but undocumented as a limit.
- **No load testing evident** — the limits will be met in production first.

## 7. Localization & RTL — A

- **Key drift is prevented via automated CI checks** using the Jest test suite in
  `messages-parity.test.ts`. Hardcoded game-flow strings have been externalized,
  and translation parity is enforced.
- **RTL and locale support is active** but rendering should be proactively monitored
  on new UI components.

## 8. Observability — A−

- **Railway per-replica log rate limit dropped messages during yesterday's error
  storm** — logs vanish exactly when most needed. Sample/collapse repeated
  tracebacks so a flood does not blind the operator.
- **No external uptime probe.** The backend was 502 for hours; detection came
  from users/logs, not a monitor. A free external ping on
  `/api/v1/arena/status` closes most of this.
- **No metrics/dashboards beyond admin stats** — p95 latency, queue depths, and
  match rates are invisible. One latency histogram + queue-depth gauge would go
  a long way.

## 9. Legal & Compliance — D  (weakest pillar; existential)

- **No Terms of Service or Privacy Policy anywhere in the app.** Searched —
  there are none.
- **Real-money USDT wagering with rake, and no KYC / AML / sanctions screening /
  geo-blocking / age gate.** Even under a "skill gaming" theory (chess is the
  strongest case), cash play is regulated or prohibited in many jurisdictions;
  crypto settlement adds money-transmission/AML exposure. There is currently no
  jurisdictional filter of any kind.
- **Fabricated figures on the login page** ("12K+ PLAYERS", "$4.2K PRIZE POOL")
  and simulated lobby counts are deceptive-practices exposure independent of
  gambling law.
- **Mystery boxes brush against loot-box regulation** in several markets.
- **Telegram's own platform terms around gambling bots are a de-platforming
  risk** that no legal structure fixes.
- **Minimum viable steps:** publish ToS + Privacy Policy with jurisdiction
  restrictions and an age requirement; geo-block clearly prohibited markets;
  replace invented numbers with real ones or remove them; obtain one real legal
  opinion on the skill-vs-chance classification in target markets. *(Not legal
  advice — but the current posture is "none," and anything above none is
  progress.)*

## 10. Engineering Excellence — B+

- **File gigantism in the highest-risk domains:** `wallet.py` (~1,931 lines),
  `telegram_bot.py` (~1,000), `PlayLobby.tsx` (~1,200). Lowest navigability
  exactly where mistakes cost the most.
- **The test harness passes vacuously without a test DB.** `conftest.py` silently
  falls back to a mock session, so DB tests go green on machines lacking
  `chess_db_test`; local Python 3.13 vs CI 3.12 compounds the confusion. Make the
  skip loud.
- **Ad-hoc money/ops scripts live inside `app/`** (see Money-Flow) — relocate
  with a runbook.

---

## Priority — top five actions

1. **Post-hoc engine-cheat screening on wagered games**, gating large
   withdrawals (App Integrity). Protects the fairness of the money loop.
2. **Stand up a staging environment** (Deployment). Previous 6-hour outage was
   a staging-shaped hole.
3. **Web-login initData security** (Security). Secure the client-side storage
   of `initData` or reduce lifetime to avoid credential theft risk from XSS.
4. **Dedicated payout hot wallet / separate float** (Money-Flow). Move payout
   keys off the main server's environment or implement a signature service to reduce wallet-drain risk.
5. **Move rate limits from in-memory to Redis** (Security). In-memory rate limits reset on every deploy and block horizontal scaling.

---

## Owner / ops items (not code)

- **Branch protection on `main`** — ~10 min in GitHub settings.
- **Rotate the Postgres password** — alerts leaked `len + first5/last3` chars of
  it into Telegram for weeks before the fix. Treat as compromised.
- **Staging environment / rollback story / backup strategy** — still none.
- **KYC / age / geo / licensing** — the biggest non-code risk; unchanged.
- **External uptime monitor** — none today.
