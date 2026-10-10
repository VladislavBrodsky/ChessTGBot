# Real TON rewards: strategy, math and rollout

**Date:** 2026-10-10 · **Roles:** CMO (strategy and funding), Senior PM (sequencing and risk), Lead UX (surfaces)
**Status:** proposal for owner decisions. Nothing here is built or paid out yet. Decisions are in section 9.

---

## 0. The one thing we will not do

The brief asked for 20 invented players on the leaderboard with 231-432 TON "earned last month", balances that rise by
20-70 TON a day, and stock photos as their avatars, to make the app look busy and profitable before it has users.
**We will not build that**, and the plan below solves the same cold-start problem honestly.

Why, in order of importance:

1. **It is a fake earnings claim in a product that holds real money.** Fabricated winners with fabricated balances are
   the kind of social proof that consumer-protection rules treat as deceptive (fake testimonials and invented earnings
   are listed as banned practices in the EU's unfair-commercial-practices rules and in the FTC's endorsement and earnings
   guidance). People would deposit and stake money because of numbers that are not real. I am not a lawyer; this is the
   point where counsel must be involved before anything involving money ships.
2. **It breaks our own rules.** `STRATEGY.md`, the QA gates and `CLAUDE.md` all forbid invented stats and income claims.
3. **The numbers are impossible to match.** 20 people at ~330 TON a month is about 6,600 TON (about $33,000 at an
   assumed $5/TON). A new player who tries to "earn 20-70 TON a day" will find it cannot be done, tell their friends,
   and the channel's reputation ends there. Section 4 shows what the real economy can afford.
4. **Platform risk.** Telegram, wallet providers and app stores act on fake-earnings schemes. A ban costs more than any
   amount of early "activity".

### What we do instead (cold start without lying)

| Need | Honest answer |
|---|---|
| A leaderboard that is not empty | **Genesis 100:** invite 100 real people (chess creators, club members, our community) with their consent. Seed them with a funded Season pool and real play. Their names and results are real because they are |
| "Is anyone here?" | A zero-state that sells the prize ("Season 1: be #1. Pool: 400 TON funded by Web3Chess") plus real, consented, anonymised events ("A player won a match 2 min ago") shown **only when true** |
| Opponents available at any hour | **Labelled practice engine** (the A.I. Coach already exists). Never pass a bot off as a person |
| Proof the money is real | A public **proof-of-payout page**: pool size, treasury address, each payout with its on-chain link. Verifiable beats invented, and it is shareable |
| Staff/founder accounts | Allowed if clearly badged "Team" and excluded from prizes |

---

## 1. What the competitor does (EdChess, from your screenshots and our audit)

| Mechanic | EdChess | Our read |
|---|---|---|
| **Puzzle Pass** | Two-week daily-quest pass, 10 puzzles, free "Regular" and paid "Premium" tiers, hints and skips as resources | Strong retention structure: a deadline, a free tier, a final reward. **Adopt the shape** |
| **Deadline pressure** | "3 days left", "One last extra day", "final prize 5 $GRAM" | Works because the deadline is real. **Adopt with real deadlines only** |
| **Scheduled arenas** | "$30 tournament today at 15:00 UTC, 3+0" | Fixed, announced times create appointments. We already have an Arena with a schedule. **Raise its profile** |
| **Happy Hours** | "16-18 UTC leaderboard points are doubled" | Cheap, effective, honest. **Adopt** (announce a day ahead, fixed times) |
| **Collectible boards with pool share** | "55% of the prize pool goes to rare-board owners' league"; "forge a board that earns extra income" | **Do not copy.** Selling items that capture prize money is pay-to-win and an earnings promise. It also pushes the economy toward a pyramid shape |
| **Token ($GRAM) rewards** | Rewards denominated in their own token | We reward in TON, a liquid asset. No token to inflate |
| **Weekly agenda posts** | "What to do on EdChess this week" | Our audit found this is their weakest recurring format (0.93x baseline reach). **Skip** |
| **Headline claims** | Many "earn" headlines, few risk lines | **Opposite stance:** no "earn" language, clear risk lines |

Public numbers (33.9K "monthly users" in the channel header) are the competitor's own claim, not verified reach.

---

## 2. Design: the Season Pool

**Principle: rewards are a funded prize pool, not a conversion rate.** XP never turns into TON.

| Piece | Rule |
|---|---|
| **XP** | Stays the cosmetic currency (boxes, themes, levels). Unchanged. **No XP-to-TON conversion**: a fixed rate becomes an exchange rate people farm until it breaks |
| **Season** | 14 days (our "Pass"). Free for everyone. Starts and ends at fixed UTC times with a visible countdown |
| **Season Score** | Earned from rated games, puzzles and a streak. Has a **soft daily cap** and a **streak multiplier that saturates at 1.5x**, so grinding 20 hours a day cannot beat steady play |
| **Pool** | `pool = alpha x fee revenue + funded marketing budget`. Paid in a USD-denominated ledger balance, withdrawable as **real TON at the spot rate** through the existing, confirmed withdrawal flow |
| **Split** | 70% **rank pool** (Zipf payouts to the top ~10%, capped at 50 players) + 30% **participation pool** (equal shares to everyone who qualified), so every committed player sees real money, and the top is aspirational |
| **Qualify** | >= 5 real-stake matches in the season week against >= 3 distinct opponents (so every qualifier has paid fees into the pool) and >= 3 active days |
| **Happy Hour** | Two fixed daily windows at 2x Season Score, announced the day before, same time every day |
| **Referral** | **Needs a decision.** The backend already pays multi-level commissions (`referral_commission_service.py`: up to 6 levels by tier). Multi-level payouts carry regulatory risk in some jurisdictions (pyramid and MLM rules); counsel should review them before TON rewards are added on top. This plan adds no new referral payments |
| **Wagers** | Stay opt-in with the 18+ / "You can lose your stake" disclosure. The Season never *requires* staking to take part: puzzle and free-play score can qualify for the participation tier up to a cap, funded by the marketing budget only |

---

## 3. The math

Settlement (from `SETTLEMENT`): winner 95%, platform 3%, referrer 2%. A match with stake `S` yields a platform fee of
`0.03 x 2S = 0.06 S`, so **fee revenue per day = 0.03 x participations x S**.

**Self-funding property.** If `alpha < 1` and the pool is paid only to qualifiers who each paid their own fees, then
the *average* qualifier receives less than the fees they generated. Sybil accounts cannot extract value on average; they
can only redistribute it with real players. The part that *is* exposed to farming is the **funded marketing budget**,
which is why it carries the stricter caps below.

**Zipf rank payouts.** Weight of rank `r` is `1 / r^s` with `s = 0.9`, normalised over the top `K`. `s` near 1 pays the
winner a lot but leaves real money for ranks 5-50, which is what keeps mid-table players playing.

**Streak multiplier.** `m(d) = 1 + 0.5 x (1 - e^(-d/7))` gives 1.07 (day 1), 1.32 (day 7), 1.49 (day 30). It rewards
returning without letting a 60-day streak dominate.

**Soft daily cap.** `score = 100 x tanh(raw / 100)`: 50 raw points count 46, 200 count 96, 500 count 100. Beyond about 200
points of effort in a day there is nothing left to farm.

### What the funded pool can really pay

Output of `python3 backend/scripts/rewards_model.py` (assumptions in the file: 4 matches per active player per day, 45%
of active players stake, $5 stake, alpha 0.35, qualifiers 62% of stakers):

| DAU | Fee revenue/day | Weekly pool | Qualifiers | #1 prize | **Median qualifier** | Weeks to the $10 withdrawal minimum (median) |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | $27 | $66 | 72 | $17 | **$0.28** | 36 |
| 1,000 | $270 | $662 | 622 | $87 | **$0.32** | 31 |
| 10,000 | $2,700 | $6,615 | 6,165 | $862 | **$0.32** | 31 |
| 100,000 | $27,000 | $66,150 | 61,441 | $8,620 | **$0.32** | 31 |

**Reading it honestly:** a fee-funded pool does *not* scale into "real money for activity". The per-person amount stays
at cents because the pool grows with the number of players too. At $100/day of marketing money and 100 DAU the median
qualifier gets about $3 a week and the top player about $195. That is a **customer-acquisition cost, not a salary**
(here about $1 per daily user per day). It only makes sense if the lifetime value of a retained player is higher, and
it must be sized from a CAC target, not from hope.

**Practical consequences**
1. Do not market "earn TON". Market **prizes, seasons, deadlines and proof of payout**.
2. Decide the daily acquisition budget `B` first; alpha is a secondary lever.
3. Raise the *feel* of reward with things that cost little: first-place status, badges, collectible results, streaks.
4. Use the $10 minimum deliberately: show progress to the first payout ("$3.20 of $10"), which is itself a retention hook.

---

## 4. Controls that keep it solvent and fair

| Risk | Control |
|---|---|
| Pool exceeds what we can pay | Pool is computed **after** the season closes from realised fees and a fixed budget; it cannot go negative. `solvency_service` check before every payout run |
| Multi-accounting / bot farming | Qualification needs real-stake matches against distinct opponents; same-opponent decay; account age >= 7 days; wallet verified; existing `sybil_guard` signals; payouts held 72 h for review; per-player weekly cap of 25% of the pool |
| Rating manipulation (win-trading) | Score weights opponent strength and applies a repeated-pairing decay |
| Price swings in TON | Ledger in USD, conversion at withdrawal; show the rate and fee before confirm |
| Money-flow integrity (CLAUDE.md) | Every credit has a **dedup key** (`season_id:user_id:kind`); credits only from our own closed-season ledger, never from third-party status; admin alert prefix `TREASURY`; withdrawals keep the existing confirmation flow |
| Regulatory | Counsel review of: prize-promotion rules in launch jurisdictions, whether rewards are taxable to players, whether any element is gambling in a given country, KYC thresholds, terms of service and official rules. Geo-block where required. 18+ only |

---

## 5. UX and visual language (Lead UX)

Keep the Obsidian Chess identity; add TON as a **single accent**, not a new brand.

- **Tokens:** `--ton: #0098EA` (TON's published brand blue; confirm against their brand guide before use), `--ton-ink` for text on it, a `--grad-ton` used on **one** surface per viewport (the Season card). Contrast-check in all three themes before merging (`npm run check:design`, axe).
- **Season card (Home, top):** pool size in TON with a live USD estimate, countdown to the real season end, your rank and "distance to next payout", a progress ring to the $10 minimum, a Happy Hour chip that turns live at the real window. One looping animation (diamond shimmer), everything else responds to actions.
- **Reward moments:** diamond burst on claim, number roll on the balance, a receipt card with the on-chain link, and a share card (real numbers only, no wager amounts).
- **Leaderboard:** real players only, opt-in display name (default: first name + initial), Season rank and score, a "what changed since yesterday" delta, and your pinned row. Teams and engine opponents are labelled.
- **Wallet:** TON balance card with rate, "Withdraw as TON" flow that shows rate, fee and tonviewer link; progress to the minimum.
- **Proof page:** `/season/<n>` public page: pool, budget source, winners (consented), transactions.
- **Motion and FOMO:** only for real timers (season end, Happy Hour, Arena start, streak expiry). Motion budget and reduced-motion rules from `ENGAGEMENT_PLAN.md` apply.

## 6. Marketing and virality (CMO)

- **Narrative:** "Play chess. Seasons with real prizes. Proof on-chain." No "earn" language; risk line on anything touching stakes.
- **Weekly beats** (feeds the 5-posts-a-day pipeline): Monday Season kickoff with the pool and countdown; daily Happy Hour reminder; Wednesday Match Rules (18+); Friday leaderboard recap; Sunday **Season Recap** with winners (consented) and the proof-of-payout link. Add `season` and `recap` pillars to `pipeline/config.json`.
- **Referral loop:** invite a friend into a **Duo challenge** (both get Season Score for the first rated game, no cash bonus, no multi-level). Existing referral commissions stay as they are until counsel has reviewed them (see section 2).
- **Creators:** Genesis 100 includes creators who stream their season; give them a referral code and an affiliate page.
- **Measurement:** attributed first games per share and per creator code, D1/D7, qualifiers per week, payout withdrawals, CAC against retained players. Public view counts are not growth claims.

## 7. Roadmap and ownership (Senior PM)

| Phase | Weeks | Deliverables | Owner | Exit gate |
|---|---|---|---|---|
| 0. Decisions and legal | 0-1 | Budget `B`, alpha, jurisdictions, terms and official rules, tax/KYC stance, payout asset | Owner, CMO, counsel | Written sign-off on the section 9 list |
| 1. Backend | 1-3 | Season tables, Season Score, pool accounting, closed-season payout job with dedup keys, TREASURY alerts, solvency pre-check, anti-abuse signals, tests | Backend | Ledger audit passes; replay of a simulated season is byte-for-byte reproducible |
| 2. Frontend | 2-4 | Season card, leaderboard, wallet TON flow, proof page, share cards, countdowns and Happy Hour | Frontend + UX | Design checks, axe, CLS, i18n parity for 10 locales |
| 3. Genesis 100 beta | 4-6 | 100 consented real players, funded pool, daily monitoring | PM + CMO | No fraud signals, payouts reconcile to the on-chain transfers |
| 4. Public Season 1 | 6+ | Launch posts, creator codes, weekly recap cadence | CMO | Retention and CAC at or better than plan |

**RAID**
- *Risks:* regulatory classification; TON price volatility; fraud; community expectations of "earnings"; treasury drain.
- *Assumptions to validate:* staking share 45%, 4 matches per active day, 2.2x weekly uniques (all in the model; replace with real telemetry as soon as it exists).
- *Dependencies:* withdrawal/payout services, `solvency_service`, `sybil_guard`, the Arena schedule, the content pipeline.
- *Decisions:* section 9.

## 8. What I will build next (after your go-ahead)

Phase 1 backend skeleton (Season models, score and pool maths with unit tests, a dry-run payout job that writes **no money**), the TON design tokens and Season card behind a feature flag, and the proof page. Real payouts stay disabled until the section 9 decisions are signed off.

## 9. Decisions needed from you

1. **Budget:** how much per day (`B`) are you willing to fund as acquisition spend, and what is your CAC target? (The model shows cents without it.)
2. **Pool share (`alpha`)** of fee revenue routed to prizes: default 35%.
3. **Jurisdictions** for launch and permission to engage counsel on prize-promotion, tax and gambling rules **before** any payout.
4. **Payout asset:** USD-denominated ledger withdrawn as TON at spot (recommended) vs holding TON reserves.
5. **XP:** confirm XP stays cosmetic and never converts to TON.
6. **Genesis 100:** confirm we recruit real, consenting players, and that team accounts are badged and excluded from prizes.
7. **Pass pricing:** keep the Season free (recommended) or add a paid tier later.
8. **Multi-level referral commissions** (up to 6 levels today): keep, restrict or retire after legal review. The website says 2%; the backend rates differ by tier, so public copy and code should be reconciled.
