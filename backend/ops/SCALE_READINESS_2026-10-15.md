# Web3Chess readiness for 10000 daily players

**Implementation update:** reliability fixes, free challenges, acquisition tracking and a real PostgreSQL/Redis test lane are now implemented in the working tree. See the [pilot release checklist and evidence](PILOT_RELEASE_2026-10-15.md). The findings below preserve the original audit baseline; they are not a statement that every listed code defect remains. Production rollout and 10,000-DAU capacity certification remain outstanding.

Assessment date: 15 October 2026. Source baseline: commit `214d161d6e`, plus the working files inspected during this review. Other work was in progress in this checkout; verify the final deployed revision before implementing these findings.

**Decision: the platform is available, but capacity for 10,000 daily active players is unproven and several reliability issues should be fixed before a broad acquisition push.** Begin with small, measured cohorts, fix the correctness risks, and expand only after realistic load and recovery tests pass. Increasing Railway replicas alone is unsafe with the present application state and transport configuration.

The acquisition objective is **10,000 daily active players**, with **less than $1,000 of acquisition spending in the first 90 days**, excluding engineering and hosting. The companion [player acquisition plan](../../marketing/PLAYER_ACQUISITION_PLAN_2026-10-15.md) stages distribution around these release gates.

## Availability and evidence

Four read-only production requests on 15 October returned HTTP 200:

| Surface | Observation |
| --- | --- |
| `https://web3chess.online/` | Website HTML available |
| `https://app.web3chess.online/` | App HTML available; `Cache-Control: no-cache, must-revalidate` preserved |
| `https://api.web3chess.online/health` | `status=ok`, version `1.7.3` |
| `https://api.web3chess.online/api/v1/gamification/engagement/catalog` | `first-three-v1` enabled; target 3; minimum 20 plies; online games; noncash rewards |

These are availability observations from one client, not latency percentiles, a complete player journey, or proof of safe concurrent play. No production load test was run. The local Railway CLI has no linked project, so deployed replica counts, resource allocations, database limits, Redis persistence, backups, and traffic history remain unverified. App version `1.7.3` does not identify an exact deployed Git revision.

Useful foundations already exist: asynchronous FastAPI and database access, Redis game storage and Socket.IO coordination, per-game locks, unique game-history identifiers, transaction deduplication, reconciliation, blocked-user handling, telemetry retention, client error reporting, and a stale-game sweeper. These reduce the work required; they do not establish a player ceiling.

## What 10000 daily players means for capacity

Use gameplay DAU: distinct authenticated human players who make a server-accepted move during a UTC day. Exclude bot identities, staff/test accounts, reward claims, signups without play, and passive app opens. Report completed-game DAU alongside it to expose shallow or farmed activity.

Average concurrent players = DAU × average connected minutes per player per day ÷ 1,440. Peak factors below are planning assumptions, not observed demand.

| Scenario | Average concurrency | Illustrative peak |
| --- | ---: | ---: |
| 10,000 registrations; 20% play daily; 20 minutes daily | 28 | 84–139 at 3–5× average |
| **10,000 DAU; 20 minutes daily** | **139** | **417–694 at 3–5× average** |
| 10,000 DAU; 45 minutes daily | 313 | 938–1,563 at 3–5× average |
| 10,000 simultaneously playing humans | 10,000 | Up to 5,000 concurrent human games |

A synchronized creator event can exceed these average-based estimates. Plan initially to validate **1,000 concurrent sessions**, then **2,000** for longer sessions and event bursts. Neither number is a measured current capacity or a guarantee that every 10,000-DAU traffic profile fits.

At 1,000 simultaneously playing humans, 500 games making one half-move every three seconds generate about **167 accepted moves per second**. At 2,000, that becomes about **333 per second**. At 10,000 simultaneous players, it is about **1,667 per second**, a separate target. AI games have one human per game and client-computed opponent moves, so test their different event mix explicitly.

## Correctness and replica blockers

Priority P0 means fix before large traffic bursts or backend replication; P1 means fix before expanding beyond a controlled pilot. Severity reflects the launch consequence, not a claim that an incident has already happened.

| ID | Priority | Verified implementation and consequence | Required change and acceptance evidence |
| --- | --- | --- | --- |
| SCALE 01 | P0 | `game_service.py:27–73` yields even after a failed Redis game lock. Matchmaker callers such as `matchmaker.py:304` and `:377` continue when the distributed lock returns no token. Contention or Redis failures can therefore permit concurrent state mutation. Locks expire after five seconds without renewal. | Reject or retry safely when lock ownership is absent; distinguish contention from infrastructure failure. Use bounded atomic transitions or lease renewal with fencing/version checks. Force contention and lease expiry across two actual processes; prove no duplicate pairing, lost move, or duplicate money mutation. |
| SCALE 02 | P0 | `session_manager.py:26–82` switches to process memory after Redis errors. Previously stored Redis games are not copied into that memory; recovery at `:125` does not reconcile divergent games. `main.py:773` skips the Redis ping in memory mode and can report healthy while shared game state is unavailable. | Make production readiness require healthy shared state. Pause/reject new shared-game and money mutations during an outage rather than creating independent authoritative stores. Define recovery from persisted move/state records and test Redis loss, restoration, and process death. Keep development memory mode explicit. |
| SCALE 03 | P0 | `arena_service.py:49–64` stores waiting players, current arena, and scored-game bookkeeping in one process. `main.py:285–339` starts schedulers and maintenance loops in every API process. The marketing scheduler dedupes with process-local `_last_sent_date`. Telegram bot receiver leadership already exists; it does not make every other scheduler singular. | Give Arena one durable owner with a shared pool, or make its transitions fully shared and atomic. Audit each background service for ownership and idempotency. Use persistent notification receipts and a single delivery worker. Test joins on different replicas, owner restart, one score per game, and one send per campaign/player. |
| SCALE 04 | P0 for replicas | `frontend/src/lib/socket.ts:124` uses `['polling', 'websocket']`. Python Socket.IO requires session affinity when polling is enabled. Railway documents random request distribution and no sticky sessions. Redis pub/sub does not share Engine.IO connection state. | Prove a WebSocket-only deployment works on supported Telegram iOS/Android and browser networks, or put polling behind an affinity-capable routing layer. Keep a documented compatibility path. Test real two-replica connect, join, broadcast, reconnect, and fallback behavior. |

The transport requirements come from [python-socketio horizontal scaling](https://python-socketio.readthedocs.io/en/stable/server.html#horizontal-scaling) and [Railway scaling and sticky sessions](https://docs.railway.com/deployments/scaling). Do not switch transports without testing users whose networks currently rely on polling.

## Throughput and operations gaps

| ID | Priority | Evidence and impact | Work to complete |
| --- | --- | --- | --- |
| SCALE 05 | P1 | Matchmaker queue joins, matching, counts, and other mutations share one `global` Redis lock. Queues are JSON arrays loaded and rewritten; `find_user_entry` scans pools. `socket_events.py:665` creates a poller per queued user, normally waking every two seconds for the first two minutes. | Replace repeated per-user scans with a bounded matcher per compatible pool, indexed queue membership, atomic pair claims, and measured queue work. Preserve cross-time-control matching and fair-play guards. Instrument lock wait, queue age, and polling work before and after. |
| SCALE 06 | P1 | Lobby clients poll every 15 seconds. `lobby_stats.py:97` keeps only one viewer-specific searching-cache entry, so different viewers invalidate it. Each miss reaches the globally locked queue count. | Cache a shared aggregate independently of viewer identity; subtract the viewer through indexed membership. Prevent cache stampedes. At 1,000 lobby viewers, the existing interval alone is about 67 HTTP requests/second; at 10,000 it is about 667. |
| SCALE 07 | P1 | Database defaults are 10 pooled + 20 overflow connections **per process**, with a 30-second pool wait. Read and write engines can each have a pool when separate URLs are configured. Actual PostgreSQL limits and query plans are unknown. | Set a connection budget across all processes and workers, retaining operational headroom. Measure pool waits, transaction duration, locks, slow queries, and history/leaderboard plans. Validate indexing with representative history volume. Use a pooler only with driver compatibility verified; do not solve saturation by blindly raising limits. |
| SCALE 08 | P1 | Telemetry batches are written to PostgreSQL, while INFO game-state logs are emitted from the client. Telemetry has an IP limit of 30 requests/minute. Shared mobile/Wi-Fi networks can aggregate legitimate users behind one IP. | Measure writes and logging overhead; sample routine game traces. Bound batch sizes, apply identity-aware authenticated limits plus broader abuse limits, and test many legitimate users on one IP. Protect Socket.IO events with explicit per-user/event budgets; reviewed move handlers have no equivalent limiter. |
| SCALE 09 | P1 | Per-turn timers and matchmaking pollers live in API memory. The stale-game sweeper helps with expired and never-started games, but it scans the active set serially every minute. | Test restart during play and queueing; use shared deadlines and bounded sweep batches where needed. Record timeout settlement lag. Test simultaneous game completions and payout/notification backlogs, not only moves. |
| SCALE 10 | P1 | CI runs migrations against PostgreSQL, but the main pytest job uses SQLite. Row-lock concurrency tests explicitly skip SQLite. No repeatable capacity harness was found in the repository. | Add a real PostgreSQL + Redis integration lane, independent sessions per concurrent operation, and two API processes. Run contention, simultaneous rewards, settlement, restart, and transport cases. Existing unit tests and the single-process socket E2E test cannot substitute for this. |

The normal AI move path is client-side Stockfish (`useGameSocket.ts:48–68`) with a local fallback, which reduces server CPU demand. The backend also contains a process pool, defaulting to two AI workers, but the reviewed normal socket path does not call `make_bot_move`. Do not present that dormant/default pool as the proven primary bottleneck. Measure client worker startup, CDN failure, low-end device responsiveness, and server validation costs instead.

## Growth data and product blockers

1. **Activity figures contain invented minimums.** `lobby_stats.py:97` defaults to padding real values with simulated searching counts of 28–45 and 125–755 daily games. Its endpoint calls that default. `useLobbyStats.ts:99–100` applies another simulated floor. Remove both for player-facing evidence and acquisition reporting; show actual counts or an unavailable/quiet state.
2. **The existing admin activity count is not gameplay DAU.** `admin.py:102` unions games, transactions, registrations, and check-ins. Some branches use Telegram IDs, others internal user IDs. This can count different identifiers for the same player. Normalize identity and publish distinct gameplay activity separately.
3. **The marketing scorecard is not a reliable baseline.** The reviewed `admin.py:1555` returns a literal `42.0%` funnel CTR and other fixed performance claims. Six of 24 rows in `marketing/content-ops/metrics.csv` have reporting windows ending before publication: lines 8–11 and 18–19. Validate against original platform exports; mark unsupported fields unknown. This does not establish that every row is false.
4. **A casual direct invitation currently carries a money hurdle.** `game.py:27–43` requires at least 100 cents for online game creation; computer games are forced to zero stake. Free random matchmaking and Arena do not establish a free direct-friend invitation. Build and verify a free invite/rematch path before promoting that promise.
5. **Free acquisition and paid referral activation differ.** `gamification_service.py:397–452` activates the existing referral milestone after three qualifying human online games with a positive stake, sufficient moves, and eligible results. Free practice users must have separate acquisition/retention events. Preserve existing money rules; do not relabel this milestone or extend balance rewards to free play without a separately reviewed economic design.
6. **Quest copy and server eligibility disagree.** `marketing/engagement/README.md:7` promises three free AI games. Current `engagement_campaign.py:65–82` excludes AI, requires online human games with at least 20 plies after enrollment, and has no zero-stake filter. The public catalog confirms online games but does not disclose every eligibility predicate. Reconcile the product, copy, catalog, and previously enrolled players' expectations; verify a qualifying journey before further quest promotion.
7. **Campaign routing needs a real contract.** `home/page.tsx:67–74` treats unrecognized non-referral `startapp` values as game IDs. Existing game invite URLs do not carry a separate referral/campaign record. Introduce an allowlisted opaque launch token that resolves destination, campaign, and optional inviter. Verify cold start, `/start`, direct Mini App, browser, and returning-player paths before using new campaign codes.

The existing [SEO operating system](../../website/docs/SEO_GROWTH_OPERATING_SYSTEM_2026-10-15.md) also records a `www` TLS issue and sparse Search Console traffic. Recheck that infrastructure issue before distributing `www` links. Its recorded figures are a prior audit, not new measurements in this review.

## Capacity validation and launch gates

Use an isolated production-like environment with PostgreSQL, Redis, the real Socket.IO transport, synthetic identities accepted only by a staging configuration, and external money and messaging replaced with deterministic test adapters. Never relax production authentication. Start at **100 → 250 → 500 → 1,000 → 2,000** concurrent sessions; a stage proceeds only after the preceding stage passes.

At each stage, record the exact commit, resources, region, number of processes, database size, load-generator capacity, and player mix. Include idle connected clients, active human games, AI games, queued players, lobby and leaderboard readers, a login burst, and simultaneous completions. Validate 100% human and 100% AI boundaries as well as a mixed profile. Avoid unrealistically sending all moves without legal boards or think times.

Run a 30-minute steady period at intermediate stages, a two-hour soak at the intended launch ceiling, and a brief 2× arrival burst. Inject one API restart, Redis interruption, database latency, duplicate/reordered client requests, and a Telegram 429 response. Real iOS/Android journeys complement the simulated socket clients.

| Proposed launch criterion | Required result |
| --- | --- |
| Correctness | Zero double pairing, lost accepted moves, duplicate credits/payouts, or unexplained balance drift |
| Accepted move to opponent update | p95 ≤500 ms and p99 ≤1 s from representative clients; separately record server processing p95 ≤250 ms |
| Authenticated read API | p95 ≤400 ms in the primary region, excluding client network time |
| Unexpected HTTP/socket operation failures | <1%; exclude intentionally rejected invalid requests and report them separately |
| Reconnect after service restoration | ≥99% of affected test clients recover within 10 seconds, with correct game state |
| Matchmaking | p95 ≤15 seconds when a compatible opponent is available; report liquidity wait separately |
| Resources | No sustained CPU/memory/pool saturation, unbounded queue growth, or degradation during soak; retain at least 30% measured headroom |
| Recovery and money | No mutation under lost lock ownership; no blind refund of uncertain on-chain payouts; reconciliation clears or explicitly flags exceptions |

These are proposed release budgets, aligned with the existing performance playbook, not achieved service levels. Lower the advertised event size if measured capacity is lower. A 10,000-simultaneous-player claim requires its own 10,000-session test and capacity budget.

## Implementation order and ownership

1. **Backend owner:** fix SCALE 01–02, correct readiness, normalize gameplay metrics, and reconcile quest eligibility. Add real PostgreSQL/Redis concurrency evidence.
2. **Product/frontend owner:** remove activity padding, provide free direct challenges, and implement safe campaign launch routing. Follow the existing shared UI and safe-area rules; rebuild the committed static export after frontend changes.
3. **Platform owner:** verify Railway resources, database/Redis persistence and restore procedures, then resolve transport routing and background ownership before adding replicas.
4. **Backend/platform owners:** reduce matchmaking/lobby scan work; run the staged capacity and fault tests; record an actual supported event ceiling.
5. **Growth owner:** invite the next cohort only within the validated ceiling and with working attribution. Pause expansion for correctness incidents, broken launches, or deteriorating retained play.

Track this work with the existing [performance, delivery, and observability playbook](../../E2E_AUDIT_REMEDIATION_PLAYBOOK.md), especially PERF-02, DEP-03, OBS-02, and OBS-03. Logging and telemetry code already exist; the missing evidence is sustained performance, accurate cohorts, and reliable recovery under the intended load.
