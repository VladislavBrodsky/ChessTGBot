# Web3Chess content audit, 16 October 2026

CMO review of the content strategy, the published canvases, live channel performance and the path from a post to a new player. All figures come from the repo, the public channel preview, the X API (read-only) or the scraped competitor database, read on 16 October 2026.

## Verdict

**We are producing polished assets for an audience that does not exist yet, and grading ourselves with numbers nobody measured.** @chess_hub has 55 subscribers. Its median post gets 29 views, and the last four posts got 3–4 views each. @defi_ambassador on X has 21 followers, and its 10 automated posts earned 50 impressions in total (median 4) with zero profile clicks; `metrics.csv` claims about 31,000. Volume is not the bottleneck. Distribution, trust and measurement are.

To bring in new players every day, the effort has to move from publishing 13 posts a day into near-empty channels to putting one strong chess moment a day in front of people who already gather: chess groups, creators and our own bot users. Each of those posts needs a tracked link into a free game.

## Scorecard

| Area | Grade | Evidence |
|---|---|---|
| Measurement | F | `metrics.csv` is typed in by hand (`cmo_performance_audit.py:115-214` writes constants). It claims 3,840 reach for t.me/chess_hub/12 (real: 19 views) and 2,000–3,800 impressions per X post (real, from the X API: 2–16). Every "6-month CMO audit" conclusion rests on these numbers. |
| Distribution | F | 55 Telegram subscribers and 21 X followers. No partner groups, no creator deals, no cross-promotion. On X, 8 posts went out in about 4 hours and averaged 5 impressions each. |
| Strategy coherence | D | Six live strategy documents disagree on the basics: FOMO or no FOMO, "Play-to-Earn" or "never promise earnings", 5 or 8 slots a day. |
| Trust and compliance | D | The channel is titled "Play & Earn", and early posts read "Start earning" and "grew your crypto wallet". Creatives say "Vault closes soon", blog authors include made-up people like "Grandmaster Morphy", and posts carry invented stats and a self-spotlight. Details in Gap 4. |
| Creative craft | B | Strong, recognisable system with legible type and an 18+ / "You can lose your stake" footer on money posts. It is let down by repetition, small puzzle boards and the "Play-to-Earn" lockup. |
| Operations | D | The pipeline stalled on 14 October. The poster runs on a laptop, retried one rejected tweet 233 times over 12.5 hours, and five posts went out in two minutes. |
| Post-to-player tracking | F | No post can be traced to a player. Since 13 October the tagged Telegram "Play" buttons (`mk_…`) open an "invalid invitation" error for new players. |

## What is working: keep it

- **The 10 October competitor audit** (`content-ops/reports/competitor-audit-2026-10-10.md`) is rigorous and real. It found that chesscom_ru reaches about 50% of its subscribers by never selling, while EdChess, which promises earnings, reaches 6% and is declining. Both post about once a day. We then built the opposite plan.
- **`content-ops/STRATEGY.md` and `PLAYER_ACQUISITION_PLAN_2026-10-15.md`** are the right strategy: honest positioning, community sessions, the puzzle relay and the rival loop, measured by first games. Make them the only source of truth.
- **The quality gates.** FEN/SAN checks with python-chess, the originality check and the 18+ footer.
- **The 11 October news canvases** (Uzbekistan Olympiad gold, the European Club Cup with dates and sources). They were timely, verified and written for chess players, and they are the best work in the queue.
- **Puzzle → reveal reply.** The mechanic is right: posts 18 and 19 answer post 12.
- **The visual system.** Black canvas, mint accent and condensed display type are recognisable in a feed. Keep the system and fix how it is used.

## Gaps, ranked by impact on new players

### 1. Invented performance data

`cmo_performance_audit.py` writes fixed reach, click and `game_starts` values for every post, and the committed `metrics.csv` was edited by hand on top of that. The "6-month CMO audit" report is built on these figures. The Telegram channel has only 16 visible posts in its whole history. Rules like the "Docked Link Law: 2.4x reach" were never measured.

The acquisition plan itself says per-post attribution is not shipped. So `attributed_visits` and `game_starts` per post cannot exist.

**Fix:** delete the generated `metrics.csv` and the `cmo-6month-content-audit-2026.*` reports, and remove the hard-coded rows. Then fill metrics only from real sources:

- `telegram_public.py` run daily against @chess_hub
- X analytics export, or the X API if the tier allows reads
- backend registrations by start parameter

Leave a cell empty when the data is missing.

### 2. No distribution: we publish into an empty room

- Telegram: 55 subscribers and 29 median views, against 2,060–4,760 for the two benchmark channels.
- X: 21 followers. The 10 automated posts earned 2–16 impressions each, 0 reposts, 0 bookmarks and 0 profile clicks. The single reply on each post is our own link reply.
- Reactions on posts 5–20 sit at 13–24 per post even when views are 16–19. That is roughly 700 reactions per 1,000 views; competitors get 12–19. The reactions look seeded, and the posts after them get 0–1. Seeded reactions don't fool Telegram's ranking or new readers. Stop.
- Nothing in the pipeline gets a post in front of new people. There is no partner-group posting, no creator collaboration, no channel cross-promotion, no Telegram folder exchange, no reply strategy on X, and no short video.

**Fix:** spend 70% of content time on distribution and 30% on creation until a channel shows organic reach. See "The daily new-player engine" below.

### 3. A volume plan that contradicts our own evidence

`pipeline/config.json` plans 8 X posts and 5 Telegram posts a day. The competitor audit found that neither benchmark posts 5 a day, and that format barely changes reach.

On a 55-person channel, more posts mean more mutes and leaves. On X, an account with little following posting 8 times in 4 hours reads as spam, especially alongside 230 rejected duplicate-tweet attempts between 02:36 and 15:06 UTC on 14 October. Repetition is already visible:

- x-6 and x-10 are the same canvas
- "WHITE TO PLAY / ONE DECISIVE MOVE" appears on 3 X canvases and 2 Telegram canvases
- "BLITZ ARENA / VAULT CLOSES SOON" appears on 3 Telegram canvases
- the same 3D knight-and-rook render appears on 6 canvases

**Fix:**

- Telegram: 2 posts a day (puzzle plus reveal or news) and 1 culture post every other day.
- X: 1–2 original posts plus 20–30 genuine replies a day on large chess accounts.
- Blog: 2 articles a week aimed at real search queries.
- Quality bar: no canvas layout repeats within 7 days.

### 4. Positioning and trust debt

The product is a skill game with optional USDT stakes. The public face says "earn":

- **Channel and logo.** The channel is titled "Web3 Chess - Play & Earn", and every canvas since 12 October carries "Play-to-Earn" under the CHESS wordmark. Posts 11 October and earlier showed the Web3Chess mark.
- **Live posts 5–9:** "Start earning", "chess players will outperform most crypto traders", "grew your crypto wallet", "worth more than your coffee". These break STRATEGY.md and the house compliance rules. Telegram Ads and most creators will refuse this framing, and it attracts earn-seekers rather than chess players.
- **Prize claims to verify.** The 13 October X post promises a "$500 Prize Vault". If that prize was not funded and paid out, delete the post; the acquisition plan already bans unfunded prize announcements.
- **Artificial urgency.** "Vault closes soon", "Registration locks the second the round clock starts" and "Midnight Blitz Vault ( USDT)". In the last one the prize variable rendered empty. The arena times also don't agree: canvases say 21:00 UTC, while the documents list 02/08/14/20.
- **Invented authority:**
  - 16 of 35 blog articles are credited to people who appear to be invented ("Grandmaster Morphy", "Elena Rostova", "Viktor Vance") with stock avatars, and one editorial byline is labelled "Speed Chess Grandmaster".
  - Unsourced figures appear on canvases, such as "4 motifs decide 85% of blitz games".
  - Canvases claim "Zero-cheat fairness" and "No bots running scripts" without evidence.

  Google's helpful-content guidance and our own STRATEGY.md both reject all three.
- **The player spotlight** (14 October, X). It tags @grandmaestro, which matches this machine's account name. If that is a staff account, a staff win is being presented as a player story. On X the tag also mentions whoever owns that handle. The canvas shows the back-rank puzzle from x-7, not the "move 23 tactic" the copy promises.
- **Deleted posts.** Posts 13–15, 17 and 21, which the queue marks as published, are no longer in the channel.

**Fix:**

- Rename the channel. Suggestion: "Web3Chess — Daily Chess Puzzles".
- Replace "Play-to-Earn" on the lockup with nothing, or with "Chess in Telegram".
- Delete or edit posts 5–9.
- Move blog bylines to "Web3Chess Editorial" or to real, named contributors.
- Ban invented countdowns and numbers in the QA gate. It already checks for earn language, so extend the same list.
- Use only real player stories, with permission.

### 5. Canvases: good system, weak hero, generic call to action

- **Puzzle boards fill about 35% of the frame** and use low-contrast light-grey squares. On a phone feed the position is the hook, so the board should fill 60–70% of the canvas, with move arrows on the reveal.
- **Every canvas points to `web3chess.online ↗`** while the button text says "Solve in Mini App", "Play in Telegram" or "Enter Arena". The label and destination disagree. The link in an image can't be clicked, so the pill should name the one place to type or tap, for example `t.me/chess_matbot`.
- **X canvases say "Answer with reactions or in replies".** X has no reactions; the line was copied from Telegram.
- **Feature cards** ("Sub-100ms sync", "FastAPI + Socket.IO", "Microsecond timestamps") speak to engineers, not players. Keep them for one build-in-public post a week at most.
- **The style guide pushes the wrong copy.** Its section 6 tells writers to use "real crypto gains" and "Win & cash out live", which contradicts STRATEGY.md and the acquisition plan.
- **No motion.** The renderer exports PNG only, and short board animations (10–20 s puzzle, blunder or time scramble) are the main organic format for chess on X, TikTok, Reels and YouTube Shorts.

**Fix:**

- Enlarge the board, add a "reveal" variant with arrows, and use a high-contrast board theme.
- Make the pill show the actual destination.
- Write platform-specific instructions on each canvas.
- Rewrite section 6 of the style guide.
- Add MP4 export to the template renderer using the same scene data.

### 6. Tracking from post to player

**No post can be traced to a new player today, and the tracked buttons show newcomers an error.**

- **Tagged buttons are broken.** Since 13 October the publisher has tagged Telegram "Play" buttons with `startapp=mk_tg_<post>` (`content-ops/pipeline/brand.py:134`). Neither the backend nor the Mini App understands `mk_`:
  - `FriendInvitations.tsx` sends every launch parameter except `arena` to `/game/friends/preview`.
  - `friend_invites.py` rejects the parameter as `invalid_invitation`.
  - The newcomer sees "This invitation is invalid or belongs to another player" on their first screen, and nothing is recorded.
- **The tracking that does work goes unused.**
  - Admin-created `go_<token>` campaign links record first-touch source in `player_acquisition` (`backend/app/services/player_tracking.py`).
  - So do `ref_` referrals.
  - No published post uses either.
  - `go_` tokens also expire after 30 days, so evergreen posts and blog links stop attributing.
- **Arena buttons, X links and website "Play" buttons are untagged.** `website/src/lib/config.ts:26` deliberately strips campaign parameters, so GA4 UTMs stop at the website.
- **Nothing is measured per source** for the first PvP game, first deposit or retention. The admin `/marketing` endpoint is an intentional empty stub. `/admin/player-metrics` reports registrations and "players" (any accepted move) per `go_` campaign only.
- **The referral programme is never used in content.**
  - What it pays: $0.10 to the referrer and $0.05 to the new player after 3 games, plus milestones.
  - The app copy says the new player's bonus arrives "instantly" (`frontend/src/messages/en.json:260`). The backend requires 3 qualifying games first.

**Fix, in order:**

1. **This week.** Make `mk_` either a recognised campaign token (resolve, attribute first-touch and route home) or stop adding it. Until then, every tagged channel button greets new players with an error.
2. **One link system.** Every post gets a non-expiring `go_` style token per post and channel, reserved by the publisher at publish time. The website passes its UTM campaign into `startapp`.
3. **Log bot `/start` and Mini App opens with their parameter.** Report the funnel per source: arrival → registration → first accepted move → first completed game → day 1 and day 7 return. Keep deposits out of acquisition goals.
4. **Fix the referral copy.** Then test one invite-led post a week with the user's own `ref_` link inside the product, not in the channel.
5. **Set GA4 consent defaults** for EU visitors to `denied` (currently all four storage types default to `granted` in `website/src/app/layout.tsx:123`).

### 7. Operations

- Nothing writes new posts on a schedule, so the queue ran dry on 14 October.
- The poster ran on a laptop and was stopped; at one point two copies ran at once.
- It retried a non-retryable 403 every minute for 12.5 hours (233 attempts, 230 rejected as duplicates).
- Five Telegram posts went out within two minutes on 12 October.
- `test_autopilot.py` writes to the live state file.

**Fix:**

- Run the daily step (`plan` → `write` → `qa`) and the poster on a server or a scheduled job, not a laptop.
- Add a lock and stop retrying on 4xx errors.
- Alert when fewer than 24 hours of approved posts remain.
- Never publish more than one post per channel per 3 hours.

## The daily new-player engine

The core idea: **one verified chess moment a day, distributed where chess players already are, ending in a free game through a tracked link.**

| Loop | What happens daily or weekly | Channel | Metric |
|---|---|---|---|
| **Puzzle relay** (core unit) | One verified puzzle. Post at a fixed time, reveal in the same channel 6 h later, and include a "send this to the friend who'd miss it" share link to a free game | TG channel, X, partner groups, bot users | Recipient arrivals, first games |
| **Community sessions** | Two hosted 30-minute sessions a week inside partner chess groups, at one time control | Partner groups (3 → 10 → 20) | Players per session, D7 return |
| **Rival loop** | After every game: rematch or invite card with the inviter's code | In product | Invitees who play, K-factor |
| **Bot-user digest** | One weekly opt-in message: puzzle, session time, the player's progress | @chess_matbot | Return play versus a holdout group |
| **X conversation** | 1–2 native posts (puzzle or opinion, no link in the main tweet) plus 20–30 replies a day on large chess accounts | X | Profile visits → link clicks |
| **Short video** | Three 10–20 s board animations a week, made from the same puzzle | X, Shorts, Reels, TikTok | Views, then tracked arrivals |
| **Search** | Two articles a week aimed at the product's own queries ("play chess in Telegram", "chess with friends Telegram") and lesson queries checked against Search Console | Blog | Search clicks → app arrivals |

### Weekly content mix (Telegram)

- 7 puzzles plus reveals
- 2 verified news-to-lesson posts
- 2 culture or meme posts
- 1 product how-to
- 1 rules post (adults only, real worked example)

That is about 13 posts a week instead of 35. Money and arena posts stay at or below 1 in 7.

## First 30 days

| Week | Do | Done when |
|---|---|---|
| 1 | Fix the `mk_` launch error first. Delete fake metrics and seeded engagement. Rename the channel and lockup. Fix or remove posts 5–9. Merge the strategy documents into STRATEGY.md and the acquisition plan, and archive VIRAL_FOMO, the FOMO section of the style guide, and the Telegram templates for arena alerts, high-stakes recaps and the payout hall of fame. Ship per-post tracking links that don't expire (see Gap 6). Move the poster to a server with the safety fixes. | Every new post carries a unique tracked link; the dashboard shows real views and arrivals |
| 2 | Start the puzzle relay at 2 posts a day. Build a list of 30 adult chess groups and creators, and pitch 10 with a ready session kit. Start the X reply routine. | 3 partner groups agree; the first relay recipients arrive |
| 3 | Run the first 2 hosted sessions. Ship the board-video export and post 3 videos. Send the first weekly bot digest to opted-in users. | Each session ends in at least 10 completed games; first video arrivals are tracked |
| 4 | Keep the formats with real arrivals and drop the rest. Ask each working host for one introduction. | Monday review on real numbers: new activated players a day by source |

**Target,** consistent with the acquisition plan's honest model: **5–10 new activated players a day by day 30, all from tracked sources.** Then grow toward 10 active partners by day 60. Daily new players come from partners and invitations compounding, not from post count.

## Documents to retire or rewrite

| File | Action |
|---|---|
| `VIRAL_FOMO_CONTENT_STRATEGY.md` | Archive; it conflicts with STRATEGY.md on urgency and earnings |
| `TELEGRAM_CHANNEL_STRATEGY.md` templates 2, 3, 5 | Remove the arena countdown, the high-stakes recap with invented players and the payout hall of fame |
| `X_CONTENT_MARKETING_STRATEGY.md` | Keep the reply routine and keyword notes; drop the "tap-to-earn manifesto" and the unmeasured "laws" |
| `templates/CANVAS_STYLE_GUIDE.md` sections 5–6 | Remove the "Play-to-Earn" mark and the "real crypto gains" copy rules |
| `content-ops/pipeline/config.json` | Cut to the cadence above; fix the 8-versus-5-slot mismatch with the note |
| `content-ops/cmo_performance_audit.py`, `metrics.csv` | Replace with real data ingestion |
