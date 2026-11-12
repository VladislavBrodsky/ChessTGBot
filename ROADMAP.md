# Web3Chess — Roadmap & Completeness Checklist

**Last reviewed:** 2026-11-12 (against `origin/main` @ cf0dbcf7df).
**Sources merged here:** [HANDOVER.md](HANDOVER.md) (gap register), [FIRST_100K_PLAYERS](website/docs/FIRST_100K_PLAYERS_2026-10-20.md) (growth plan), open PRs, git history, and code checks on `main`.

## How to use this file

- One line per task. Tick `[x]` and append the date + PR/commit when it lands on `main` (not when it lands on a branch).
- **Priority:** `P0` = money/fairness/outage risk, do first · `P1` = blocks growth or measurement · `P2` = scale & engineering health · `P3` = product depth.
- **Done means:** merged to `main`, CI green, static export rebuilt if `frontend/src` changed, and verified in production (or the verification step is written next to the tick).
- Review weekly. Move a phase to ✅ only when every P0/P1 line in it is ticked. Add new findings to the right phase rather than to the bottom.

## Scoreboard

| Phase | Theme | Status | Open / Total |
| --- | --- | --- | --- |
| 0 | Land in-flight work, clean the queue | 🟡 In progress | 3 / 6 |
| 1 | Real-money trust & safety | 🟡 In progress | 4 / 12 |
| 2 | Activation & measurement | 🟡 In progress | 5 / 7 |
| 3 | Growth experiments (90-day plan) | ⚪ Not started | 8 / 8 |
| 4 | Scale & engineering health | 🟡 In progress | 8 / 10 |
| 5 | Product depth | ⚪ Not started | 6 / 6 |

---

## Phase 0 — Land in-flight work, clean the queue (this week)

Goal: nothing half-finished sitting on branches or open PRs; `main` can't be broken by a direct push.

- [ ] **P0** Protect `main`: require the `CI` and `static-export-fresh` checks before merge (GitHub reports "Branch not protected" today). ~10 min in repo settings. *Owner decision:* direct pushes to `main` are still in use (2026-11-12), so protection would need an admin bypass.
- [ ] **P0** Finish or park `feat/card-first-deposit-stake-bridge`: it carries ~1,300 uncommitted files (Stripe reconciliation, DepositModal rewrite, payout_service, CI edits, a stale static export). `main` has moved on since (Oct 30 money fixes). Rebase onto `origin/main` in a worktree, rebuild `backend/static_frontend`, run both test suites, open a PR.
- [x] **P1** Decide [PR #94](https://github.com/VladislavBrodsky/ChessTGBot/pull/94) (ref_ invitation sharing) — merged 2026-11-12.
- [x] **P1** Decide [PR #93](https://github.com/VladislavBrodsky/ChessTGBot/pull/93) (honest website copy: engine, clock, anti-cheat) — merged 2026-11-12.
- [x] **P2** Decide [PR #95](https://github.com/VladislavBrodsky/ChessTGBot/pull/95) (drop project-local npm cache) — merged 2026-11-12.
- [ ] **P2** Close or rebase July-era [PR #90](https://github.com/VladislavBrodsky/ChessTGBot/pull/90) and [PR #88](https://github.com/VladislavBrodsky/ChessTGBot/pull/88) — 3.5 months stale; likely superseded.

## Phase 1 — Real-money trust & safety

Goal: a player's stake is safe, games are fair, and an outage is detected in minutes rather than hours.

**Game rules & fairness**
- [x] **P0** Enforce "every human game is wagered" — 2026-11-12 (`c9aa862c5c`, pilot tests `3f0a8b12a4`). REST create needs $1+, friend requests can't be accepted, rematches need a stake, leftover free games can't be joined, free daily Arena switched off (`ARENA_ENABLED = False`). Live in production.
- [x] **P0** Post-hoc engine-cheat screening on wagered games — 2026-11-12 ([PR #100](https://github.com/VladislavBrodsky/ChessTGBot/pull/100), `959f0bfca4`). Stockfish depth 12; flag = 20+ judged moves, ≥90% top-move match, ≤10 cp avg loss. A flagged player's withdrawals are held in `pending_review` + SECURITY alert; admins clear/uphold via `/admin/fair-play/reviews`. Live in production. Follow-up: tune thresholds once real flag data exists.
- [x] **P1** Make website/app anti-cheat claims match what ships — PR #93, 2026-11-12.

**Money custody**
- [x] **P0** Refuse a payout before signing when custody can't cover it — 2026-10-30.
- [x] **P0** Profit position + admin-confirmed sweep to a separate company wallet — 2026-10-30.
- [x] **P0** Settle payouts by the USDT transfer; close stake/deposit races; ledger true-up audit — 2026-10-30.
- [x] **P1** Stripe card-deposit automated reconciliation — 2026-07-21 (`stripe_reconciliation.py`).
- [ ] **P0** Payout hot wallet holds a small float only; `PAYOUT_MNEMONIC` no longer controls the bulk of funds (owner decision; no code change for the first step).

**Detection & recovery**
- [x] **P0** External uptime probe with Telegram alert to the owner — 2026-11-12 (`.github/workflows/uptime.yml`, `scripts/uptime_probe.py`). Every 5 min from GitHub Actions: API `/health` (DB + Redis), Socket.IO websocket upgrade, Mini App, website; 3 attempts before DOWN; alerts once on down and once on recovery. **Owner step:** add repo secrets `TELEGRAM_BOT_TOKEN` and `ALERT_CHAT_ID` — until then a failed run only emails the owner via GitHub.
- [ ] **P0** Staging environment on Railway (backend + frontend + Postgres) and a habit of deploying risky backend/migration changes there first.
- [ ] **P1** Health-check-gated deploys and a documented one-command rollback.
- [ ] **P1** Collapse repeated tracebacks before logging so Railway's per-replica rate limit doesn't drop logs during an error storm.

## Phase 2 — Activation & measurement

Goal: we can say, per source, how many people finished a first game and came back on day 7.

- [x] **P1** Funnel telemetry for card-first deposit and post-practice stake bridge — 2026-10-24.
- [x] **P1** Website launches attributed to first players; `mk_` links recorded as first-touch — 2026-10-16/20.
- [ ] **P1** Report **completed first game** (AI and wagered as separate cohorts) by source — today the source report counts registrations and accepted moves only.
- [ ] **P1** Day-7 return cohort by source, with a privacy/retention review for any person-level join.
- [ ] **P1** Verify the free AI route end to end in production on Telegram iOS, Telegram Android, and desktop browser (create → finish → result → share).
- [ ] **P1** Abuse-adjusted counts: exclude self-referrals and duplicate accounts from every growth number.
- [ ] **P2** One weekly growth review note (numbers + denominators per funnel step) — create the template and run it once.

## Phase 3 — Growth experiments (90-day plan, from FIRST_100K_PLAYERS)

Goal: find which channels produce completed games and day-7 returns; scale only those. Start after Phase 2's first two P1 lines.

- [ ] **P1** Puzzle-share loop: each of the three verified website positions has a share link that opens the same unsolved board, reveals after an attempt, then offers AI practice. Track solves → shares → recipient solves → first AI games.
- [ ] **P1** Creator pilot: 3–5 chess educators, distinct languages, each with an original position, lesson, and own source code; pay only against verified outcomes.
- [ ] **P1** Owned Telegram channel test with campaign labels per post; complete the bot profile preview and launch path.
- [ ] **P1** Club/community pilot with a host kit (board link, QR, instructions, recap).
- [ ] **P2** Weeks 7–12: short "find the move" video format (Shorts route via profile link — Shorts URLs aren't clickable).
- [ ] **P2** One search-page improvement per week on Play / Academy / rules pages, each with a working board and AI action (no keyword-variant page farms).
- [ ] **P2** Post-AI-game referral: share the same position or AI milestone; human-challenge links must show the wager.
- [ ] **P3** Pick one localization market only once a partner or Search Console signal supports it.

Guardrails: no cash-prize Mystery Box promotion until custody, audited odds, rules and payout exist; no Telegram Ads for this product (policy bars real-money gaming); no unsolicited DMs.

## Phase 4 — Scale & engineering health

Goal: the code that handles money is small enough to review, and the app survives 10× today's traffic.

- [x] **P2** Shrink `PlayLobby.tsx` (~1,200 → 748 lines).
- [x] **P2** `REQUIRE_REAL_DB` guard exists so DB tests can't pass silently on a mock session.
- [ ] **P2** Make the real-DB requirement the default in CI and print a loud warning locally when falling back to the mock session.
- [ ] **P2** Split `backend/app/api/v1/endpoints/wallet.py` (2,231 lines) into deposit / withdrawal / admin-credit / balance modules with no behavior change.
- [ ] **P2** Split `backend/app/services/telegram_bot.py` (1,181 lines) into handlers per command group.
- [ ] **P2** Move `backend/app/process_payouts_backlog.py` and remaining one-off money scripts to `backend/scripts/ops/` with a runbook (`docs/ops-runbook.md`).
- [ ] **P2** Replace polling with Socket.IO push where the server already emits — 15 `setInterval` files today; start with `ArenaBanner`, `DepositModal`, `useLobbyStats`, `Leaderboard`, `BalanceOpportunity`.
- [ ] **P2** Document the single-instance ceiling (matchmaker, arena, rate-limit and profile cache are in-memory), then move that state to Redis.
- [ ] **P2** Load test: concurrent matchmaking + 200 live games + deposit webhooks against staging; record p95 and the breaking point.
- [ ] **P2** Metrics: one API latency histogram and matchmaking queue-depth gauge visible to the admin.

## Phase 5 — Product depth

Goal: features that keep retained players playing. Start only when Phases 1–2 are green.

- [ ] **P3** 100 GRAM Vault go-live prerequisites: funded custody, auditable odds/draw, eligibility, written rules, tested payout — or keep it XP-only.
- [ ] **P3** Marketplace roadmap items ([frontend/MARKETPLACE_ROADMAP.md](frontend/MARKETPLACE_ROADMAP.md)) re-prioritized against D7 data.
- [ ] **P3** Daily puzzle that actually refreshes daily, with streaks.
- [ ] **P3** Embeddable playable position for publishers, with a source-aware link.
- [ ] **P3** Device fingerprinting for Sybil defense (privacy/infra decision first).
- [ ] **P3** Wagered club events/tournaments, once organizer workflow, eligibility and wager rules exist.

---

## Already closed (for reference)

- Web login auth no longer persisted in `localStorage` (`sessionAuth.test.ts` asserts it's cleared).
- Translation key parity enforced in CI (`messages-parity.test.ts`).
- CI runs independent frontend browser checks in parallel — 2026-11-01.
- Referral reward flow hardened — 2026-11-01.
- Critical Next.js advisories patched in app and website — 2026-10-22.
