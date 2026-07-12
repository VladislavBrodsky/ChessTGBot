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
2. **AI-fallback in the matchmaking queue** — after N seconds unmatched, offer a
   labeled bot game so the 81% who currently leave empty-handed get *a* game.
   Also widen the ELO window as wait grows; show real queue size + "notify me
   when an opponent joins." Recovers the clearest demand in the data.
3. **Gate referral rewards on activation, not signup** — pay when the referred
   user deposits or plays N real games; tighten per-referrer velocity. Stops the
   5-account farm from burning commissions on junk and refocuses invites on
   quality. (Complements the region-targeted arena notifications already shipped
   — watch the 37 blocks/48h for fatigue.)
4. **Fix `session_start` → user attribution** (frontend `lib/telemetry.ts` /
   `TelemetryReporter.tsx` send `user_id`; verify it matches `telegram_id` and
   lands in `telemetry_logs.user_id`). Without it the activation funnel lies.

## Tracking gaps to add (so the next read is sharper)
- Deposit-funnel events: `deposit_modal_open → initiated → address_copied →
  completed/abandoned` (today only the final `transactions` row exists — can't
  see where the 2 pending stalled).
- `wager_insufficient_balance` — direct measure of deposit demand.
- Referral-quality: referred-user activation, not just referral count.
- A nightly rollup table (telemetry_logs has no retention/aggregation — fine for
  48h, expensive for trends).

## Notes / caveats
- Money columns are cents; `amount/100` = USDT.
- Arena data at snapshot: #1,#2 (19:00, old single-slot schedule) finished with 0
  participants; #3 (20:00, new 4×/day schedule) was **live with 2 participants /
  2 games** — the region-targeting had only just deployed. Re-check arena
  participation + per-user notification volume over the next few days (HANDOVER.md
  "post-deploy watch").
- Don't over-read a single 48h window, and don't fabricate numbers — re-run the
  script for fresh data.
