# ChessTGBot E2E Audit Remediation Playbook

Last updated: 2026-07-22

Status: Remaining remediation plan

Audience: Coding agents and engineers implementing follow-up work from the
2026-07-21 end-to-end audit.

This document is an execution guide, not only an audit report. Each work package
defines its scope, likely files, required behavior, tests, acceptance criteria,
and production verification. Read `AGENTS.md`, `BRAND_DESIGN_SYSTEM.md`, and this
document before changing code.

## 1. Objective

Close the material gaps found across these pillars:

1. UI/UX
2. Security
3. Money-flow correctness
4. App integrity
5. Deployment and CI
6. Performance
7. Localization and RTL
8. Observability
9. Engineering excellence

The target state is a release process in which:

- an irreversible payout cannot execute twice;
- every balance mutation and ledger row commit atomically;
- production payment configuration fails closed;
- authentication and administrative authorization fail closed;
- critical browser journeys run automatically in CI;
- mobile, desktop, RTL, keyboard, and screen-reader flows are testable;
- deployments have an explicit verification and rollback path;
- operators can detect latency, queue, money, and client-error incidents quickly.

## 2. Production Topology and Non-Negotiable Rules

Production consists of two Railway services that deploy from `main`:

- Frontend: `https://chesstgbot-frontend-production.up.railway.app`
- Backend: `https://chesstgbot-backend-production.up.railway.app`

The old monolith URL is dead and must not be used for verification.

Repository rules that apply to every package:

- Preserve all unrelated user changes in a dirty worktree.
- Never test real withdrawals, deposits, Stripe charges, broadcasts, bot
  messages, or admin mutations without explicit authorization.
- Use a temporary SQLite database or an isolated Postgres database for money
  and game integration tests.
- Frontend visual changes must follow `BRAND_DESIGN_SYSTEM.md`.
- Every frontend source/config change must be followed by:

  ```bash
  cd frontend
  npm run build:static
  cd ..
  bash scripts/check-static-export-fresh.sh
  ```

- Do not hide the bottom navbar on main dashboard pages to solve overlay bugs.
  Coordinate overlays through state and z-index instead.
- Every fixed bottom element must use `--app-safe-bottom`.
- Escape every user-controlled string sent in Telegram HTML messages.
- Never automatically refund or retry a payout after an uncertain blockchain
  broadcast. The chain must be checked first.
- Do not weaken Telegram `initData` signature or age validation.

## 3. Audit Baseline

The following evidence was collected on 2026-07-21:

- Frontend Jest: 49 tests passed.
- Backend pytest without the real-socket case: 523 passed, 2 skipped.
- Real two-client Socket.IO E2E: 1 passed.
- Aggregate backend result: 524 passed, 2 Postgres-only targeting tests skipped.
- Frontend production build: passed.
- TypeScript typecheck: passed after a fresh build removed stale generated types.
- ESLint: 0 errors, 49 warnings.
- Static-export freshness check: passed.
- Python `pip check`: passed.
- Alembic: one migration head.
- `npm audit --omit=dev`: 3 moderate vulnerabilities.
- Production backend `/health`: HTTP 200.
- Production unauthenticated wallet request: HTTP 401.
- Production frontend measurement: about 147 ms TTFB and 169 ms total from the
  audit environment.
- Browser coverage exercised 390x844 mobile and 1440x900 desktop viewports.
- Local authenticated journey covered home, onboarding, region prompt, daily
  reward, game lobby, AI setup, one move and AI reply, resignation, result, and
  wallet history.
- Arabic set `lang="ar"` and `dir="rtl"` with no horizontal overflow.

Known verification limits:

- No real Telegram-authenticated production session was mutated.
- No real Stripe or TON transfer was initiated.
- A fresh Postgres migration replay was not run locally because Docker was not
  available. CI already defines this gate, but the current commit still needs a
  green CI run before release.

## 4. Priority and Release Gates

Severity definitions:

- P0: Can directly cause duplicate or incorrect irreversible money movement.
- P1: Can lose money, grant unauthorized privilege, or silently misrepresent a
  payment result under plausible conditions.
- P2: Material security, usability, performance, observability, or release risk.
- P3: Quality debt that should be scheduled but does not block an emergency fix.

Release order:

1. Deploy to staging and complete DEP-02 verification.
2. Complete the remaining browser, accessibility, localization, and performance
   packages.
3. Enable blocking CI only after existing warnings and environment assumptions
   are resolved.

## 5. Work Package Ownership

Models may work in parallel only when their ownership surfaces do not overlap.

| Track | Packages | Primary ownership |
|---|---|---|
| Security backend | SEC-04 | security/config/middleware and security tests |
| Frontend auth/i18n | UI-01, L10N-01 | login page, login widget, locale messages |
| Frontend application | UI-02 to UI-04 | home/layout/game/wallet components and frontend tests |
| Integrity | INT-01, INT-02 | game analysis, review policy, anti-cheat tests |
| Delivery | DEP-01 to DEP-03 | CI, dependency locks, runbooks |
| Observability | OBS-02 to OBS-03 | telemetry, metrics, alert controls, dashboards/runbooks |

## 6. Security

### SEC-04 - Add Browser Security Headers and Reduce Credential Exposure [P2]

Required implementation:

- Add CSP tailored to Next.js, Telegram SDK/widget, TON Connect, Sentry, backend
  API, and approved image sources.
- Add HSTS, `X-Content-Type-Options: nosniff`, Referrer Policy, and a minimal
  Permissions Policy.
- Define `frame-ancestors` carefully so the Telegram embedding model continues
  to work.
- Remove `X-Powered-By` where practical.
- Reassess web-login `initData` storage in `localStorage`; prefer an HttpOnly,
  Secure, SameSite session cookie or a shorter-lived server session.
- Add response-header tests for frontend and backend.

Acceptance criteria:

- No inline script/style regression or blocked Telegram/TON flow in staging.
- Production headers are present on HTML and API responses as appropriate.
- A web credential is not readable from JavaScript after the session migration.

## 7. UI/UX and Accessibility

### UI-01 - Repair Production Telegram Web Login [P2]

Problem:

The production widget displays `Bot domain invalid`. The page hardcodes
`chess_matbot` in the widget, QR code, and Telegram link while backend defaults
refer to other bot names.

Required implementation:

- Establish one canonical bot username configuration shared by widget, QR, link,
  backend notifications, and deployment settings.
- Use `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` or a generated public config object.
- Remove all hardcoded bot usernames from the login page.
- Register the exact production frontend/custom domain with BotFather as an ops
  step.
- Render a clear, high-contrast fallback when the Telegram iframe reports an
  error. Do not leave black error text on a black background.
- Verify that the QR code and link resolve to the same bot and Mini App.

Acceptance criteria:

- Desktop web login authenticates on the production domain.
- QR and button open the intended production bot.
- Domain misconfiguration produces an actionable visible error.
- Mobile Mini App login remains unchanged.

### UI-02 - Coordinate First-Run Dialogs [P2]

Problem:

Onboarding, region selection, and daily reward are mounted concurrently. Only
one is visually prominent, but multiple dialogs remain in the accessibility tree.

Required implementation:

- Add a single first-run flow coordinator with a deterministic queue.
- Recommended order: onboarding, region, daily reward.
- Mount only the active dialog. Hidden dialogs must not have `role="dialog"`,
  trap focus, or accept pointer events.
- Restore focus to a sensible control after the final dialog closes.
- Respect reduced motion and Telegram safe areas.

Acceptance criteria:

- At most one visible/mounted modal has `aria-modal="true"`.
- Escape/back behavior is deterministic and cannot strand the user.
- Screen-reader focus enters and leaves each dialog correctly.
- Reload and returning-user flows do not replay completed steps.

### UI-03 - Make the Chessboard Keyboard and Screen-Reader Usable [P2]

Problem:

The 64 chess squares render as unnamed `role="button"` controls.

Required implementation:

- Use the supported `react-chessboard` customization API rather than DOM
  mutation after render.
- Give every square an accessible name containing coordinate and content, for
  example `e2, white pawn` or `e4, empty`.
- Expose selected square, legal destinations, last move, check, turn, and game
  result through appropriate state/announcements.
- Support keyboard selection and movement without requiring drag gestures.
- Avoid adding 64 squares to the tab order simultaneously if a roving-tabindex
  grid pattern is feasible.
- Preserve touch, drag, click-to-move, orientation, promotion, and arrow behavior.

Acceptance criteria:

- A keyboard-only user can make `e2-e4` and complete promotion selection.
- A screen reader announces square, piece, selection, and move result.
- Board orientation produces correct coordinate names for both colors.
- Existing move/arrow tests remain green and new accessibility tests are added.

### UI-04 - Clean Up Interaction Semantics and Missing Assets [P3]

Required work:

- Remove nested interactive elements such as a `<button>` inside the `To Lobby`
  link. Use one semantic link or button.
- Add a valid favicon and resolve the `/noise.png` 404 observed in local E2E, or
  remove the reference.
- Ensure every icon-only button has an accessible label and at least a 44x44
  effective mobile touch target where practical.
- Preserve the successful 390x844 no-overflow result and bottom safe-area spacing.

## 8. Performance

### PERF-02 - Establish Load and Latency Budgets [P2]

Required work:

- Add a repeatable load test for health, authenticated reads, matchmaking join,
  Socket.IO move events, and leaderboard reads.
- Do not load-test production without authorization.
- Record p50, p95, p99, error rate, DB pool use, Redis latency, and Socket.IO
  disconnect rate.
- Define budgets for cold HTML, API reads, game moves, and matchmaking.
- Document the current single-instance/in-memory scaling ceiling.

Suggested initial budgets:

- Cached frontend HTML p95 under 500 ms from the primary region.
- Authenticated read API p95 under 400 ms under expected peak load.
- Server move acknowledgement p95 under 250 ms excluding client network RTT.
- Error rate below 1 percent during the agreed load profile.

## 9. Localization and RTL

### L10N-01 - Remove Remaining Hardcoded Login Strings [P2]

Problem:

Arabic correctly switches direction, but Players, Matches, Prize Pool, image alt
text, and the footer remain English.

Required implementation:

- Add message keys for all visible login-page strings.
- Update all ten locale files and retain message-parity enforcement.
- Use locale-aware number and currency formatting where values are real.
- Verify whether the social-proof numbers are real. Remove or replace them if
  they are fabricated or stale.
- Keep the brand name untranslated where intended, but translate descriptive
  footer text.
- Verify icon/arrow direction in Arabic.

Acceptance criteria:

- No user-facing English remains on `/ar/login` except intentional brand names.
- `lang` and `dir` remain correct.
- Arabic at 390x844 and 1440x900 has no horizontal overflow or clipped controls.
- Message parity and build-static checks pass.

### L10N-02 - Add Automated Locale Smoke Coverage [P3]

Required work:

- Visit every generated locale's login, home, game, wallet, and academy routes in
  a browser smoke suite.
- Assert valid `lang`, expected `dir`, no page-level horizontal overflow, and no
  missing-message console errors.
- Include at least Arabic RTL and German long-copy screenshots or layout checks.

## 10. App Integrity

### INT-01 - Preserve Server Authority and Expand Tamper Tests [P2]

Current strengths that must not regress:

- The server rejects out-of-turn moves.
- The real Socket.IO E2E completes matchmaking, checkmate, wager debit, and
  settlement.
- Matchmaker collusion, Sybil, puzzle uniqueness, clock, and concurrency tests
  exist.

Required additions:

- Test illegal FEN/state injection attempts from the client.
- Test replayed move events and duplicate Socket.IO delivery.
- Test mismatched game/user IDs and reconnect takeover attempts.
- Test clock manipulation and stale client timestamps.
- Ensure all rewards and game results derive from server state, never client
  claims.

### INT-02 - Add Post-Hoc Engine-Cheat Screening [P2, Product Decision]

Goal:

Protect real-money games from external engine assistance without attempting an
unreliable instant ban system.

Recommended first phase:

- Analyze wagered completed games asynchronously.
- Store engine-match rate, average centipawn loss, suspicious streaks, move-time
  distribution, and sample size.
- Produce a review score, not an automatic guilt verdict.
- Gate large withdrawals for manual review when risk and sample thresholds are
  met.
- Give admins the evidence and game links needed to review a flag.
- Define retention, appeal, false-positive, and privacy policies before enabling
  enforcement.

Acceptance criteria:

- Screening cannot alter game settlement after the fact.
- A job replay does not duplicate flags.
- Small samples do not trigger automatic restrictions.
- The withdrawal gate is auditable and reversible by an authorized admin.

## 11. Deployment and CI

### DEP-01 - Make Dependency Resolution Reproducible [P2]

Required implementation:

- Change frontend CI from `npm install` to `npm ci` because
  `frontend/package-lock.json` is committed.
- Remove the stale no-lockfile CI comment.
- Confirm Railway uses the same lockfile and Node major version.
- Pin Python dependencies through a generated lock/constraints file with hashes
  or exact versions. Keep a human-edited input file if desired.
- Remove the duplicate `asyncpg` requirement.
- Add dependency audit jobs with a documented severity policy.

Current advisory:

- `npm audit --omit=dev` reported three moderate findings involving Next.js's
  bundled PostCSS advisory. Investigate an upstream patched Next.js release.
  Do not apply npm's suggested downgrade to Next 9.

### DEP-02 - Add Staging, Health Gates, and Rollback [P1/P2]

Required operational work:

- Create separate Railway staging frontend/backend/Postgres/Redis services.
- Use non-production bot, wallet, Stripe test mode, and secrets.
- Apply migrations to staging before application traffic is switched.
- Add a post-deploy health gate for frontend HTML, backend health, authentication
  rejection, Socket.IO connection, and one non-money read.
- Document one-command or one-click rollback to the previous known-good images.
- Require a backup/restore check before destructive migrations.
- Protect `main` and require passing CI for merge.

Acceptance criteria:

- A failed health gate does not promote the release.
- The previous frontend and backend versions can be restored independently.
- A migration failure leaves the previous application service available.
- Staging cannot reach production money credentials.

### DEP-03 - Harden Existing CI Gates [P2]

Required implementation:

- Set `typescript.ignoreBuildErrors` to false after confirming the blocking
  typecheck order works for both standalone and static builds.
- Reduce the 49 lint warnings, then make lint blocking.
- Run backend tests with explicit deterministic test database configuration.
- Stop silently falling back to mock sessions for tests that claim to validate
  real database semantics. Skip loudly or fail with setup guidance.
- Run the two Postgres-only arena targeting tests in CI against the service DB.
- Retain the fresh-Postgres Alembic upgrade and static-export freshness gates.
- Test Python 3.12, matching CI and production; optionally add 3.13 as an allowed
  experimental lane until async fixture compatibility is fixed.

## 12. Observability

### OBS-02 - Add Metrics and SLO Signals [P2]

Minimum metrics:

- HTTP request count, status, and latency histogram by normalized route.
- Socket.IO connects, disconnects, active sessions, and event latency.
- Matchmaking queue depth and wait time by time control and wager class.
- Active games, settlement successes/failures, and stuck-game count.
- Withdrawal state counts, payout age, webhook failures, and ledger anomalies.
- DB pool saturation and Redis operation errors.
- Client crash count by build hash and first-line fingerprint.

Rules:

- Never label metrics with Telegram IDs, game IDs, transaction hashes, or other
  unbounded/high-cardinality values.
- Include build/commit identity in logs and alerts.
- Alert on sustained symptoms, not every individual request failure.

### OBS-03 - Add External Monitoring and Runbooks [P2]

Required work:

- Add an external uptime probe for frontend HTML and backend `/health`.
- Add a synthetic unauthenticated request that must remain 401.
- Add runbooks for backend 5xx, Redis outage, DB migration failure, payout stuck,
  ledger mismatch, Telegram bot failure, and stale frontend chunks.
- Document exact production URLs and explicitly forbid the dead monolith URL.
- Ensure public health errors do not expose internal hostnames or exception text.

## 13. Engineering Excellence and Test Strategy

### ENG-01 - Reduce High-Risk Module Size [P3]

After behavior is protected by tests:

- Split payment-provider adapters, withdrawal policy/state machine, deposit
  verification, Stripe webhooks, and schemas out of `wallet.py`.
- Split socket/matchmaking state from `PlayLobby.tsx` presentation.
- Move operational scripts out of importable application packages.
- Prefer small domain services with explicit transaction ownership.

Do not combine this refactor with the first critical money fix. Stabilize behavior
and tests first, then refactor in separate reviewable commits.

## 14. Definition of Done by Pillar

### UI/UX

- Production web login works or shows a clear fallback.
- First-run prompts never overlap semantically or visually.
- Mobile/desktop core journeys have automated coverage.
- Keyboard and screen-reader users can play a move.

### Security

- Admin configuration, payout configuration, CORS, and proxy trust fail closed.
- Production sends reviewed browser security headers.
- Web credentials are not stored in script-readable long-lived storage.

### Money-Flow Correctness

- Payout side effects have single-owner status claims.
- Balance and ledger mutations are atomic.
- Every external event and retry is idempotent.
- Uncertain broadcasts require reconciliation, never blind retry/refund.

### App Integrity

- Server authority and replay/tamper tests pass.
- Engine-cheat screening has a documented policy before enforcement.

### Deployment and CI

- Lockfiles are honored.
- CI is merge-blocking and deterministic.
- Staging, health gates, backup checks, and rollback are documented and tested.

### Performance

- Load budgets and capacity assumptions are measured and documented.

### Localization and RTL

- All visible copy uses messages.
- All locales smoke-test; RTL has dedicated layout checks.

### Observability

- Metrics, external probes, build identity, and incident runbooks exist.

### Engineering Excellence

- Lint and typecheck are blocking.
- High-risk modules are reduced only after behavior is protected.

## 15. Standard Verification Commands

Run the relevant subset during development and the full set before handoff:

```bash
cd frontend
npm ci
npm run build
npm run typecheck
npm run test:ci -- --runInBand
npm run lint
```

```bash
cd backend
python -m alembic heads
python -m pytest
python -m pip check
```

For frontend source/config changes:

```bash
cd frontend
npm run build:static
cd ..
bash scripts/check-static-export-fresh.sh
```

Production read-only smoke checks after an authorized deployment:

```bash
curl -i https://chesstgbot-frontend-production.up.railway.app/en/login
curl -i https://chesstgbot-backend-production.up.railway.app/health
curl -i https://chesstgbot-backend-production.up.railway.app/api/v1/wallet/balance
```

Expected results:

- Frontend HTML is 200 with `Cache-Control: no-cache, must-revalidate`.
- Backend health is 200 only when DB and Redis are healthy.
- Unauthenticated wallet access is 401.
- Arbitrary origins receive no credentialed CORS headers.
- Hashed static assets retain immutable caching.

## 16. Handoff Template for Each Model

Every implementing model should report:

1. Work package IDs completed.
2. Behavioral changes and invariants preserved.
3. Schema/config/environment changes.
4. Tests added and exact results.
5. Commands not run and why.
6. Production or ops steps still required.
7. Residual risk and rollback instructions.
8. Confirmation that unrelated worktree changes were preserved.

Do not mark a package complete only because the happy path works. The package is
complete when its listed concurrency, failure, security, accessibility, and
verification criteria are covered.
