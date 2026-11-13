# Web3Chess growth strategy, stage 2: distribution and liquidity

Prepared 12 November 2026 (CMO / senior PM audit). Supersedes the cadence and loop assumptions in
`PLAYER_ACQUISITION_PLAN_2026-10-15.md` and `content-ops/GROWTH_OPERATING_PLAN.md` where they conflict; their
measurement definitions (gameplay DAU, activation, K-factor) still apply. Every number below carries its source and
date. "Unverified" means a third-party or self-reported figure.

## 1. Executive summary

1. **We built a content factory before we had an audience.** Stage 1 (Oct–Nov) produced a strong engine: 91+
   published posts, exact-board renderer, Studio canvases, QA/compliance gate, CMO auto-approval, 36 blog articles.
   It publishes to almost nobody: Telegram @chess_hub has 61 subscribers and 4–18 views per post; X @defi_ambassador
   has 22 followers and its API credits ran out on 2026-11-04. More posts to the same 61 people lowered views per post.
2. **The product has almost no players yet.** The public leaderboard's top 50 players have 174 games between them
   (median 1, 20 of 50 with zero games), observed 2026-11-12. The real funnel numbers live in admin `/player-metrics`
   and must become the weekly scorecard.
3. **The category is open.** No Telegram chess app has scale: EdChess shows 20,890 monthly users and Chess Now
   13,154 on their t.me pages (observed 2026-11-12). EdChess has a 35.6K-subscriber channel, but its views per post
   fell from about 1.2K to about 270 between late October and 12 November. Anichess (Animoca × Chess.com) is not on
   Telegram. Immortal Game dropped its crypto features.
4. **Stage 2 changes what we spend time on: distribution first.** Spend founder hours on partners (channel admins,
   creators, coaches, Telegram game communities), app catalogs and share loops. Publish fewer, better owned posts.
   The new **partner lead engine** (`marketing/leadgen/`) finds, scores and drafts outreach to new partners every
   day, and gives each partner an attributed `mk_` link.
5. **One product decision gates the whole plan (section 7, D1).** Since commit `c9aa862c5c` (2026-11-11) every human
   game needs a stake of at least $1, and the free Arena and free friend challenges are off. Every growth loop that
   worked for competitors runs on free human play: Chess Now's chat challenges, EdChess arenas, Chess.com, Lichess.
   Telegram Ads also bans real-money gaming ads. Without a free human lane, paid ads and partner posts can only
   promote A.I. practice, and new stake players find an empty lobby.

## 2. Where we are: data snapshot (2026-11-12)

| Area | Observed | Source |
|---|---|---|
| Telegram channel | @chess_hub 61 subscribers; last 20 posts 4–18 views; 4–6 views on 12 Nov (4 posts that day) | t.me/s/chess_hub preview |
| Telegram cadence effect | 10–16 views/post at 1–2 posts/day vs 4–6 at 6/day | content-ops audit 2026-11-12 |
| X | @defi_ambassador: 22 followers, 109 following, 244 posts. Profile is a personal fintech-branded account, not a Web3Chess brand profile. API 402 on every post/metric since 2026-11-04 (48 failed slots) | X API, `state/performance_metrics.json` |
| Content engine | 6 TG + 6 X slots/day planned; canned pools exhausted; AI writer idle (no `ANTHROPIC_API_KEY` in `marketing/.env`); same posts published 4–5×, now blocked by a 45-day repeat window | `content-ops` memory audit |
| Measurement | `metrics.csv` has URLs but no reach, click or game columns filled; admin `/marketing` returns `data_status: unavailable` | repo |
| Players (proxy) | Top 50 by Elo: 174 games total, median 1, max 31 | public `/api/v1/users/leaderboard` |
| Attribution | Works: `mk_<campaign>` start params are attributed at /start and at Mini App auth; `/player-metrics` reports registrations and players per campaign | `player_tracking.py`, `deps.py` |
| Website | web3chess.online up (200, 0.7 s); 45 sitemap URLs; 36 articles; Ahrefs DR **0**; GA4 via first-party gateway since 2026-11-12 | curl, Ahrefs free DR, memory |
| SEO tooling | Ahrefs Free (DR only), Semrush no API units, Similarweb credit limit reached, Ubersuggest 3 reports/day | SEO pull 2026-11-12 |
| Product rules | Free: A.I. coach and Academy. PvP: stake ≥ $1. Pot split 95/3/2 (winner/platform/referral). Card-first deposit and post-practice stake bridge on the current branch | `game.py`, `website/src/lib/config.ts`, git log |
| Competitor channels we track | chesscom_ru 9,740 subs, median 5,920 views; edchessss 35,600 subs, median 976 views (last 20 posts) | lead-engine smoke crawl 2026-11-12 |

Data we still do not have, and the fix: product funnel (export `/player-metrics` weekly), Search Console queries
(GSC is owned by another Google account and no connector reaches it; add the Supermetrics or AdCopilot plugin or
export CSV), GA4 traffic (same), Google keyword volumes (Semrush units or Ubersuggest after its reset).

## 3. Strengths and weaknesses

**Strengths**

- A real product inside Telegram: free A.I. coach, Academy puzzles, 10 locales, card-first deposits, USDT
  settlement with a published split, referral fee built into the pot (2%).
- Production-grade marketing tooling: exact-board renderer (legal positions verified with python-chess), Studio
  canvases, QA and compliance gate, CMO auto-approval, Telegram competitor scraper, keyword portfolio, now a lead
  engine.
- Honest measurement culture: no padded counters, `mk_` attribution, activation and retention defined.
- Compliance-ready copy rules (18+, "you can lose your stake", no earnings promises). Competitors don't do this:
  99 of 329 EdChess posts say "earn" and 5 contain risk wording (audit 2026-10-10).
- Timing: the Telegram chess leader slot is open and the nearest rival's reach is shrinking.

**Weaknesses**

- **No distribution.** About 80 owned followers across channels. Volume was mistaken for reach.
- **Liquidity.** Stake-only PvP with few players means a newcomer who wants a human game may wait alone. Every
  promotion of PvP before liquidity exists burns the visitor.
- **Brand surface.** The X account is a personal fintech profile; DR 0; no catalog listings verified; copy still
  says TON in places, while the market and EdChess say GRAM (rename reported June 2026, unverified; the codebase
  already quotes GRAM).
- **No partner program.** No admin-facing offer, no partner dashboard, referral share undocumented for partners.
- **Founder time goes to engineering and content, not relationships.**
- **Measurement gaps** (above) mean we cannot yet say which channel produces a playing user.

**Opportunities**: catalogs (tApps Center via @app_moderation_bot, findmini.app, PlayToEarn DR 65, DappRadar,
Product Hunt) and Telegram's Apps tab with a Main Mini App video preview; hundreds of small chess channels in
RU/IR/IN/UZ/ES/PT that cross-promote; YouTube beginner demand ("chess openings for beginners" 53K/mo, "chess
puzzles" 39K, "chess tactics for beginners" 14K at low competition, vidIQ 2026-11-12); weak SERPs for "play chess on
Telegram" (repos and listicles); Telegram's affiliate program; revenue-share referrals (Anichess pays 10% of fees
from the referee's 3rd match, Chess.com affiliates 15% recurring).

**Threats**: real-money gaming regulation (India's 2025 ban on real-money skill games; US state carve-outs),
Telegram Ads policy, cheating and payout distrust (Skillz-style chess apps' reviews), a funded competitor entering
Telegram, post-airdrop churn patterns (Hamster Kombat 300M → 41M users in about 3 months, reported).

## 4. Competitors and how they promote

| Competitor | Status | Audience (observed unless noted) | What drives their growth | Gap we exploit |
|---|---|---|---|---|
| Chess.com | Dominant | 267M members, 10.2M DAU (reported, Q2 2026) | SEO (85.8M search clicks/quarter, reported), app stores, creators and events (PogChamps), 15% affiliate | Not inside Telegram, no stakes |
| Lichess | Active, nonprofit | YouTube 75.5K | Word of mouth, "no ads, no registration", open source | No money, no Telegram |
| Anichess | Active, funded | Discord 36.9K, YouTube 1.13K | Chess.com + Carlsen, streamer leagues, seasons, fee-share referral, token listings | Volatile token, wallet friction, no Telegram |
| EdChess | Active, nearest rival | 20,890 MAU; channels 35.6K EN + 12.2K RU; views/post falling | Catalog listings (PlayToEarn, DappRadar, Product Hunt), daily channel posts, Puzzle Pass, award votes, $30 arenas | Tiny prizes, NFT-gated pools, no referral, "earn" copy |
| Chess Now / Chess ❤️ | Active | 13,154 MAU | In-chat share links, contest wins, curator features | No progression, no money |
| ChessNode | Dormant since Jul 2026 | 18K channel | Token rewards | Abandoned audience: recruitable |
| Real-money chess apps | Stale | ~91 ratings | App-store search | Trust and payout doubts |

Patterns that work in 2025–2026 Telegram: in-chat sharing and challenges, catalog and Apps-tab placement,
retention-first design, affiliate/fee-share referrals, small real prizes with public payout proof. Patterns that
stopped working: airdrop farming, fixed per-invite bounties, giveaway blasts (a free-Stars giveaway kept 8% of the
users it brought, reported).

Full evidence and sources: research files listed in section 10.

## 5. Strategy for stage 2 (next 90 days)

**Goal.** Prove one repeatable channel that delivers activated players who return, at under $1 cash per activated
player. North-star metric: **weekly active human-game players** (server-accepted move in a human game). Leading
indicators: attributed registrations and activations per partner, D1/D7 return, first deposit rate after practice.

**Positioning.** "Chess inside your Telegram chats. Practise free against the A.I. coach; play real opponents for
real stakes from $1 when you're ready (18+)." Lead with chess value; stakes are the optional adult step, never the
headline in acquisition channels.

### Pillar A: fix the floor before buying attention (weeks 1–2)

1. **Owner decision D1** (free human lane). Recommended: one free, unstaked human lane that cannot farm rewards,
   for example a free friend challenge without XP or referral credit, or one free community arena window per day.
   Keep stakes everywhere else.
2. **Concentrate liquidity.** Promote one or two daily "prime-time" match windows so stake players meet. Show honest
   lobby counts (already never padded).
3. **Catalogs and Apps tab** ($0, one day): tApps Center, findmini.app, PlayToEarn, DappRadar, Product Hunt; Main
   Mini App with screenshots and a video preview; pitch @trendingapps "Game Friday".
4. **Brand surfaces**: a Web3Chess-branded X profile (rename or new handle), consistent bio and pinned post on
   @chess_hub, GRAM wording where the token is meant. Rewrite the @chesshub_chat description: it currently says
   "Turn every move into rewards" and "earn crypto", which breaks our own no-earnings-promise rule and is the first
   thing a partner admin sees when they check us out.
5. **Cut cadence**: Telegram to 2 posts/day (puzzle + one lesson or product moment), X paused until credits are
   topped up and the profile is branded. This is a config and code change in `content-ops` (6 slots are hardcoded
   in `orchestrator.generate_telegram_daily_batch`; see memory audit). Add `ANTHROPIC_API_KEY` so the AI writer
   replaces recycled copy.

### Pillar B: partner-led distribution, the daily lead engine (from week 1)

The engine finds partners, so founder time goes to conversations. Offers, in order of cost:

| Partner type | Offer (true today) | Ask |
|---|---|---|
| Chess channel admins | Free daily engine-checked puzzle posts with a play link; optional paid placement ($10–40 micro budget) | Weekly post with their `mk_` link |
| Chess groups | One weekly puzzle for members, approved by the admin | Pin or share |
| Creators (YouTube/X/TikTok, 1K–500K) | Paid per placement, tracking link shows exact players | Pinned link or 30–60 s integration |
| Coaches and clubs | Free practice tool for students; referral share per published rules | Share with students |
| Telegram game communities | Post swap, joint challenge, paid post | Cross-promotion |

Planning model (assumptions, not forecasts): 25 first contacts × 5 days = 125/week; 10–15% reply; a third of replies
become partners → 4–6 partners/week. If a partner post in a 5K channel is seen by about 20% and 1–2% tap, that is
10–20 arrivals and 5–10 activations per post. Replace these with measured `mk_` numbers after week 3.

Capacity limit: the bottleneck is human sending and replying (about 45–60 minutes/day for 25 messages), not
discovery. Send only from an established, Web3Chess-branded account to public business contacts. Telegram restricts
accounts that are reported for unsolicited messages; keep volume steady and copy specific.

Compliance for partner work (from the channel research; verify with counsel before paid RU placements):
- Russia: channels with 10k+ subscribers must be in the RKN registry to carry ads, and ads need ERID marking through
  an ad-data operator. Crypto and gambling ads are restricted. In RU, promote free chess features only.
- No stake messaging to kid-focused partners (youth clubs, kids' coaches); offer them free practice only.
- Lichess and Chess.com forbid commercial messages: reach clubs through the Telegram link or website in the team
  description, never through on-site PMs.
- Paid creator posts carry the platform's paid-promotion disclosure.

Seeded on 2026-11-12 with 198 researched rows (53 YouTube creators, 45 Telegram channels/groups, 26 online clubs, 16
coaches, 12 Telegram game communities, catalogs and ad networks). Highest-priority first contacts from that list:
@trendingapps and the Telegram Apps Center (catalog features), large RU chess media channels (33K, 18.6K, 9.9K
subscribers), the Iran Chess Association channel (13.1K), Lichess clubs that run their own Telegram chats, and
adult-improver YouTube creators.

### Pillar C: owned content that compounds (from week 2)

- **Telegram**: 2/day, puzzle-first, each with a play link. Grow subscribers through post swaps with channels the
  lead engine finds (the most common growth tactic among RU/IR chess channels).
- **Short video**: daily 20–35 s puzzle Shorts/TikToks from the exact-board renderer; target "chess tactics for
  beginners" (low competition) and "chess openings for beginners" (highest demand).
- **SEO**: 6 long-tail pages before more general articles: `/play-chess-telegram` (+ how-to), "Telegram chess bots
  compared", "send a chess challenge link", `/play-chess-for-usdt` explainer, "is it legal to play chess for money",
  "Telegram games that pay in GRAM". Backlinks from catalogs and awesome-lists. Measure in Search Console.

### Pillar D: loops inside the product (weeks 3–8, engineering)

1. "Challenge this chat" share after every finished game and puzzle (prepared inline share with `start` parameter).
2. Clubs for channel/group admins with a weekly club leaderboard: turns partner channels into recurring recruiters.
3. Revenue-share referral documented for partners (2% referral fee already in the pot) and a simple partner stats
   view; consider listing in Telegram's affiliate program.
4. Weekly sponsored arena with a small, real USDT pool and a public tonviewer payout link (needs D1 and legal review).

### Pillar E: paid tests, capped (weeks 4–12)

$250 total: Telegram Ads in chess channels and Adsgram task ads, **promoting free A.I. practice and puzzles only**
(Telegram Ads bans real-money gaming; minimum 0.1 TON CPM reported). $300 creators, $350 prize pool (if D1/D4
approved), $100 reserve. Stop a test after 2 comparable weeks without attributed activations.

## 6. Operating workflow

**Daily**

| Time (local) | What | Who |
|---|---|---|
| 07:00 | `leadgen.py daily`: discovery, rescore, slate in `marketing/leadgen/reports/` | launchd (automatic, after install) |
| 08:00 | Review slate, personalise top 5, send 20–25 messages, `mark … contacted`; answer replies | Partnerships owner (45–60 min) |
| All day | 2 Telegram posts through the content daemon (CMO auto-approval, gate, QA) | content-ops daemon |
| 18:00 | Reply to channel comments, log partner replies | Community owner (15 min) |

**Weekly (Monday)**: export `/player-metrics` → `leadgen.py sync-metrics`; scorecard (section 8); continue / revise
/ stop per partner and per format; pick one funnel bottleneck for the week; competitor snapshot (scraper re-run on
tracked channels). **Monthly**: re-plan budget split, retire formats that lost reach and downstream action for three
comparable batches (existing rule).

## 7. Decisions needed from the owner

| # | Decision | Recommendation |
|---|---|---|
| D1 | Restore a free human-vs-human lane? | Yes, limited and reward-free (see Pillar A.1). Without it, partners and ads can only sell A.I. practice |
| D2 | X account: rename to a Web3Chess brand and top up API credits, or pause X? | Pause posting now; rebrand before resuming |
| D3 | Cut Telegram to 2 posts/day | Yes (data above) |
| D4 | Approve the $1K/90-day split (prizes $350, creators $300, paid tests $250, reserve $100) | Yes, prizes only after D1 and legal review |
| D5 | Install the daily lead-engine launchd job (read-only discovery) | Yes, after this branch merges |
| D6 | Add `ANTHROPIC_API_KEY` (AI writer) and `YOUTUBE_API_KEY` (creator discovery) to `marketing/.env` | Yes |
| D7 | Connect GA4 + Search Console to Claude (Supermetrics or AdCopilot plugin) or export CSVs weekly | Yes |

## 8. Scorecard and gates

Weekly, same windows, missing data left blank: leads discovered; first contacts sent; reply rate; partners live;
`mk_` registrations; activated players (first accepted move); D1/D7 return; first deposits after practice; @chess_hub
subscribers and median views; catalog referrals.

Gates (carried over from the October plan): activation ≥50% of registrations, D1 ≥30%, D7 ≥15% on at least 100
matured players before scaling paid tests. Stop immediately on money inconsistencies or wrong promises in copy.

| Day | Target (planning, not forecast) |
|---|---|
| 30 | Catalog listings live; 400+ leads in CRM; 100+ contacts sent; 10 partners live; first 100 attributed registrations |
| 60 | 25 partners; 2 channels with repeat attributed activations; 50–150 weekly active human-game players |
| 90 | One channel proven at < $1 per activated player; 150–300 weekly active human-game players; partner program documented |

## 9. Claude skills and workers available for this plan

| Role | Skills / agents / connectors | Status 2026-11-12 |
|---|---|---|
| CMO and planning | `marketing:campaign-plan`, `marketing:competitive-brief`, `product-management:metrics-review`, `social-media-skills:social-strategy`, `goals-and-kpis`, `experimentation-and-ab-testing` | Ready |
| Partnerships / lead gen | **`marketing/leadgen/` engine**, project agent `partnership-scout`, `sales:draft-outreach`, `small-business:outreach-composer`, `social-media-skills:collabs-and-cross-promotion`, `ugc-and-influencer`, `social-selling-and-dm`, `sales:handle-objection` | Ready (YouTube key needed for creator discovery) |
| Competitive intelligence | project agent `competitor-watch`, `content-ops/telegram_public.py`, `searchfit-seo:competitor-analyzer`, `social-media-skills:competitor-analysis`, `viral-reverse-engineering`, `vidiq:vidiq-competitor-watchlist` | Ready (vidIQ about 100 credits left) |
| Content and copy | content-ops daemon + AI writer, `marketing:content-creation`, `social-media-skills:hook-writer`, `carousel-writer`, `short-form-video-script`, `youtube-shorts`, `tiktok-script`, `educational-content-and-how-to` | AI writer needs `ANTHROPIC_API_KEY` |
| Design | Studio `/CREATIVES`, exact-board renderer, Canva connector and `canva:*` skills, Figma connector, Unsplash | Ready |
| Video and audio | vidIQ (clips, scripts, thumbnails, voiceover), ElevenLabs speech, `social-media-skills:capcut` / `opus-clip` / `heygen` guides | Ready (credit-metered) |
| SEO | `searchfit-seo:*` skills and `seo-auditor` agent, `marketing:seo-audit`, `small-business:seo-ai-visibility` | Ready; data tools limited (Ahrefs Free, Semrush/Similarweb out of credits) |
| Analytics | project agent `growth-analyst`, admin `/player-metrics`, `windsor-ai:*` (needs setup), Supermetrics / AdCopilot plugins (not installed) | GA4 and GSC not reachable from Claude yet |
| Scheduling and distribution | content-ops daemon (Telegram, X), `postiz:postiz` (28 channels, needs an account), vidIQ social publishing (connected accounts) | X blocked by credits |
| Community | `social-media-skills:community-management`, `engagement-routine`, `reply-and-comment-writer`; Telegram plugin for Claude Code (owner approvals from the phone) | Plugin not installed |
| Automation | launchd jobs, `schedule` skill (cloud routines), `loop` | Ready; new recurring publishers need explicit owner approval |

The three project agents live in `.claude/agents/` and only read, research and draft. None of them sends a message
or publishes.

## 10. Evidence

- `research/2026-11-12/`: competitor report with sources, SEO and traffic pull with the tool access log, channel and
  outreach-rules map. The 198-row lead list is not committed (public repository); it is in the local lead CRM.
- `leadgen/README.md`: lead engine runbook and rules.
- `content-ops/reports/competitor-audit-2026-10-10.md` (Telegram channel statistics), `cmo-6month-content-audit-2026.md`.
- Code facts: `backend/app/api/v1/endpoints/game.py` (stake rule), `backend/app/services/player_tracking.py`
  (attribution and `/player-metrics`), `website/src/lib/config.ts` (pot split).
