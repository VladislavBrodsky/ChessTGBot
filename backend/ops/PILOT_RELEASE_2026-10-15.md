# Community pilot release — 15 October 2026

The implementation supports a controlled free-play community pilot. It does not certify production capacity for 10,000 daily players. These changes are local and have not been deployed by this task.

The friend-invitation follow-up is documented in [TELEGRAM_FRIEND_INVITATIONS_2026-10-15.md](TELEGRAM_FRIEND_INVITATIONS_2026-10-15.md), including the malformed reported link, durable referral requests, Main Mini App routing and rollout checks. Apply migrations through `e2b9c651a403` for that flow.

## What changed

| Area | Release behavior |
| --- | --- |
| Shared state | Production Redis failures reject/retry operations instead of switching authority to process memory. Health checks require Redis. Renewable leases and revision checks reject stale moves and lost lock ownership. |
| Multiple API workers | Production clients and server use WebSocket-only transport. Authenticated shared presence supports cross-worker pairing and reconnects. Arena pool state is shared and fenced in Redis. |
| Background work | One renewable Redis owner runs the maintenance cohort. Campaign recipient reservations, Arena scores and XP prize receipts persist across restarts. Notification reservations avoid blind duplicate attempts; they do not prove Telegram delivery. |
| Settlement recovery | Completed game state remains in a durable retry set without an expiry until the SQL result and Arena score are committed. The sweeper retries failures and clears stalled matched free invitations after their grace window. |
| Lobby work | Shared aggregate caching, single-flight refresh, read-only queue counts and indexed user membership reduce repeated scans. No simulated player or game counts remain in the lobby. |
| Abuse and saturation | Authenticated telemetry has bounded batches and per-player limits. Sensitive socket events have per-player budgets. Database pool waits have a configurable five-second bound. |
| Free friend play | Friend action creates an online game with zero stake, no balance dependency, an opaque invite and a three-minute first-move grace after the friend joins. Creator disconnect before acceptance does not cancel the invitation. Free rematches remain free. |
| Acquisition | Admin → Marketing creates practice/Arena campaign links and shows measured player counts, exact-day return rates, source registrations and source players. The former fabricated marketing scorecard is unavailable. |
| Quest | Free AI and human games can qualify under the existing completion/move rules. Existing qualifying human-game rights are preserved. Paid referral milestone and money-entry rules are unchanged. |

## Tracking definitions

- DAU is a unique positive Telegram account with at least one server-accepted move in a UTC calendar day. WAU/MAU are unique accounts across the last 7/30 UTC calendar days, including today. Configured admin accounts are excluded. Bot moves, passive opens, check-ins and signups alone do not count. Operational test identities must remain outside production or be explicitly excluded.
- An accepted state transition atomically writes a daily fact into a Redis outbox. The owner flushes to PostgreSQL every five seconds, deduped by player/day. Counts can lag during a database outage; outbox facts are retained for retry. Redis persistence is required to survive Redis data loss.
- Coverage begins with newly recorded play; history is not fabricated or reconstructed from registrations. Empty coverage and immature retention have no displayed percentage. A refresh failure retains the last confirmed response with a status message.
- D1/D7/D30 are exact-day return rates from the first **recorded playing day**, with only mature cohorts in the denominator. They are not registration-cohort or qualifying-completion retention.
- Campaign attribution is immutable first acquisition for newly created accounts. Signed Telegram launch parameters are preferred; authenticated browser resolution allows a ten-minute new-account grace. Returning accounts and self-invitations do not become new acquisitions. Missing sources remain unknown.
- Source “players” means an attributed registration later made at least one accepted move, over the recorded lifetime. It is not a 24-hour qualifying completion or a verified marketing click. Full funnel, last-touch attribution, completed-game DAU and qualified activation remain future work.
- Community tokens expire after 30 days. Game invitations also require a live game; unfinished Redis games normally expire after 24 hours. Expired tokens are pruned daily.

## Rollout order

1. Record the exact release revision and verify Railway PostgreSQL backups/restore, Redis persistence/no-eviction policy, and a shared Redis service for all workers. Use a separate staging database and Redis service for tests.
2. Apply migration `d9a421e6b507` before the new API or background owner accepts traffic. It adds tracking, attribution, durable receipts and a history query index. The normal container migration step must complete successfully.
3. Keep one production API replica for the initial pilot and transport transition. Two-worker test evidence covers free play; paid admission/rematch crash recovery must be checked before production scale-out. If older clients need a refresh window, temporarily set `SOCKET_LEGACY_POLLING_ENABLED=true` on that single replica, deploy the API, then deploy the new frontend and verify current clients connect using WebSocket. Set the flag back to `false` **before** adding API replicas. Do not enable polling across randomly routed replicas.
4. Deploy backend and frontend together before distributing free challenge links. The old API rejects zero-stake direct games. Rebuild and include `backend/static_frontend` for the optional monolith export. Marketing website deployment is separate.
5. Verify `/health` on `api.web3chess.online`, logs for one background owner, no repeated delivery attempts, activity outbox draining, and no settlement backlog. `SEND_RELEASE_BROADCAST` defaults to `false`; deployment must not send a release announcement automatically.
6. With two ordinary test accounts, check Telegram iOS and Android cold start, free challenge creation, forwarding, acceptance, a legal move by each player, reconnect and free rematch. Check an expired link and a community practice link. Verify no balance or wager transaction is created for a free game. This physical-device production smoke check has not been performed locally.
7. Create a separate campaign per consenting community in Admin → Marketing. Start with a small scheduled session, confirm the source counts and first accepted moves, and inspect errors/settlement lag before inviting the next group. Do not expect historical D7/D30 rates on day one.

Budget connections across every API process, background worker and optional read engine. Keep total configured pool capacity below the actual PostgreSQL connection allowance with operational headroom; do not add replicas without checking that budget. The new timeout prevents long waits but does not increase database capacity.

## Verification and remaining capacity work

Initial pilot regression evidence (before the friend-invitation follow-up): **729 backend tests passed** (11 intentionally skipped in the normal SQLite run), **10 real PostgreSQL/Redis pilot checks passed**, and **53 focused backend regressions passed** after the connection/read optimizations. The frontend suite passed **40 suites / 176 tests**; all **1,251 messages across 10 locales**, design rules and zero-warning lint passed. **Four pilot browser journeys passed** (Home → Play at 320px English, 390px Arabic and 1280px English, plus campaign-link creation). **Production static export passed**, including TypeScript and 213 generated pages; `backend/static_frontend` was rebuilt from the identical source snapshot and file hashes verified after sync. The pilot browser lane uses Turbopack with an isolated cache; the Webpack development server showed a hot-reload/hydration loop locally. The production export still uses Webpack and passed; it emitted framework Edge-runtime and dynamic-import cache warnings. Physical Telegram cold-start checks remain a release gate. The normal suite emitted existing dependency deprecation warnings; Jest reported a worker teardown warning despite all assertions passing.


The isolated tests use real local PostgreSQL 16 and Redis 7, production authentication with dummy signed identities, and two API processes with external Telegram/money effects replaced by test adapters. No production load or real message sending occurs.

The recorded local pilot workload connected **100 players to two workers**, created **50 free human games**, and accepted **200 moves with zero unexpected errors**. The final run measured round-trip p50 **21.58 ms** and p95 **53.63 ms**, after removing unnecessary connection-time global locks. These short local results establish cross-worker correctness for this workload; they are not a soak test, internet latency measurement, or supported production player ceiling.

`tests/test_pilot_reliability.py` covers stale-write/lost-lease rejection, renewable lock contention, free-game active-slot protection, durable campaign delivery reservation, fail-closed Redis loss, concurrent move authorization, outbox deduplication, immutable acquisition, mature PostgreSQL cohorts, shared Arena restart, score/prize deduplication, settlement retry and two-worker reconnect/play/free-rematch acceptance. `.github/workflows/pilot-reliability.yml` repeats this with real services and a separate required pilot-browser job in CI. `PILOT_PLAYER_COUNT` permits even workloads from 2 through 2,000; use isolated staging resources and record their specifications. The fixture refuses non-loopback services and requires a `_test` database plus Redis DB 15.

Remaining work before a broad 10,000-DAU push:

- Replace the global JSON matchmaking mutation lock and per-player polling with bounded per-pool matching if staged measurements show contention. This release reduces reader scans but retains that architecture.
- Run the audit's 250 → 500 → 1,000 → 2,000-session mixed workload, realistic history volume, burst, two-hour soak, API termination, Redis restoration and delayed-database scenarios on production-like resources. Record p95/p99, queue age, reconnect success, pool waits, memory and settlement lag. A short 100-player check cannot replace these gates.
- Review the existing cross-store boundaries in paid admission/rematches before expanding wagered traffic: a SQL debit can commit before its corresponding Redis state update. A process death or Redis interruption at that boundary needs a durable admission/compensation design and crash-injection evidence. This release does not certify those existing money paths.
- Verify actual Railway resource allocations, shared Redis persistence, PostgreSQL connection limits, backup recovery and alert delivery. They were not available through a linked Railway project in this task.
- Measure completion-based activation, human/AI completed-game DAU and full source-to-retention funnel separately from the accepted-move dashboard. Do not use unsupported historical marketing rows as evidence.

Rollback should prefer a forward fix or temporarily closing new pilot admissions. Existing monetary games must settle before reverting lifecycle code. Keep the additive database tables until all new API/background processes are stopped; do not downgrade schema under running workers.
