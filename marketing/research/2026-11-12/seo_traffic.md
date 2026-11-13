# SEO and traffic research: web3chess.online

Pulled 2026-11-12. Every figure names its tool and date. "no access" means the tool refused the call. "not measured" means no available tool returned the figure. No numbers are estimated or invented.

## Summary

- **Most paid SEO data could not be pulled today.** The Ahrefs plan is Free with 0 API units, Semrush has 0 API units, Similarweb is at its credit limit, and the Ubersuggest daily report limit of 3 was already used up. So **Google search volume, keyword difficulty (KD), CPC, organic traffic, backlinks and channel mix are all no access** for every domain.
- **What did work:**
  - Ahrefs free Domain Rating (DR) for 20 domains.
  - Ubersuggest Google autocomplete, which shows real US query phrasing but no metrics.
  - vidIQ YouTube search estimates. This is the only search-volume source that worked, and it measures YouTube, not Google.
  - WebSearch result samples, used to see who shows up for a query. These are not Google rank-tracker data.
- **Both of our domains have DR 0.0** (Ahrefs, 2026-11-12). The closest direct competitor, EdChess (a TON chess game inside Telegram), has DR 11. Anichess has DR 51. Chess.com and lichess have DR 86 and 85.
- **Telegram chess searches are a winnable niche.** WebSearch results for "chess telegram bot" and "how to play chess in telegram" are mostly GitHub repos, a listicle, a t.me post and Product Hunt. No established brand page owns these queries. YouTube demand for "chess telegram" is under 750 a month (vidIQ). Total demand is small, but the competition is weak.
- **Beginner chess topics have much more demand.** On YouTube (vidIQ), "chess openings for beginners" gets about 53,256 searches a month (competition 42) and "chess tactics for beginners" about 14,475 (competition 27, the lowest in the set). Google KD for these is unmeasured.

---

## 1. Domain comparison

DR is from Ahrefs `public-domain-rating-free`, version dr3, pulled 2026-11-12. Every other column is **no access**: Ahrefs `site-explorer-metrics` returned "Insufficient plan", Semrush returned `no_api_units`, Similarweb is at its credit limit, and the Ubersuggest report quota was used up.

| Domain | Role | Ahrefs DR | Organic traffic | Organic keywords | Backlinks / ref. domains | Monthly visits trend | Top countries |
|---|---|---|---|---|---|---|---|
| web3chess.online | ours (marketing site) | **0.0** | no access | no access | no access | no access | no access |
| app.web3chess.online | ours (game client / Mini App) | **0.0** | no access | no access | no access | no access | no access |
| chess.com | competitor (incumbent) | 86.0 | no access | no access | no access | no access | no access |
| lichess.org | competitor (incumbent) | 85.0 | no access | no access | no access | no access | no access |
| chessbase.com | content/tools | 78.0 | no access | no access | no access | no access | no access |
| chess24.com | content/play | 71.0 | no access | no access | no access | no access | no access |
| chessgames.com | content (runs virtual-stakes "bookie") | 71.0 | no access | no access | no access | no access | no access |
| chesskid.com | competitor (kids) | 70.0 | no access | no access | no access | no access | no access |
| chessable.com | training | 69.0 | no access | no access | no access | no access | no access |
| chesstempo.com | tactics trainer | 69.0 | no access | no access | no access | no access | no access |
| playtoearn.com | play-to-earn (P2E) directory where competitors are listed, so a **listing target** | 65.0 | no access | no access | no access | no access | no access |
| anichess.com | crypto chess | 51.0 | no access | no access | no access | no access | no access |
| chessarena.com | World Chess / FIDE Online Arena, prize-money tournaments | 44.0 | no access | no access | no access | no access | no access |
| checkmate.live | prize/payments chess (WebSearch found playbook.checkmate.live) | 21.0 | no access | no access | no access | no access | no access |
| powchess.com | real-money chess on BSV (2021-era coverage, current status unverified) | 20.0 | no access | no access | no access | no access | no access |
| edchess.io | **TON + Telegram P2E chess (@edchess_bot), the closest direct competitor** | 11.0 | no access | no access | no access | no access | no access |
| immortalgame.com | crypto chess (Immortal Game). The tool did not confirm who owns this domain | 7.0 | no access | no access | no access | no access | no access |
| chesslers.com | wager chess (domain guessed from the name, unverified) | 1.6 | no access | no access | no access | no access | no access |
| chessbet.com | domain guessed, unverified | 0.3 | no access | no access | no access | no access | no access |
| chessmoney.com | domain guessed for the "ChessMoney" wager service, unverified | 0.0 | no access | no access | no access | no access | no access |

**Our own audience (internal repo audit, not an SEO tool).** `marketing/CONTENT_AUDIT_2026-10-16.md` records 55 subscribers on the Telegram channel @chess_hub and 21 followers on X. The audit's 10 automated X posts earned 50 impressions in total. `marketing/content-ops/keywords-150.json` says its search volumes are "unmeasured", and this report does not change that for Google.

### Crypto, wager and Telegram chess competitors found (WebSearch, 2026-11-12)

The competitor reports in Ahrefs, Semrush, Similarweb and Ubersuggest were all no access, so these were found with WebSearch:

- **EdChess** (edchess.io, @edchess_bot): TON play-to-earn chess inside Telegram. It offers 1v1, bot games and tournaments in bullet, blitz and rapid. PlayToEarn lists it as Alpha. Its Product Hunt page claims 450K+ registered players and $45K+ in tournament payouts. These are the company's own claims and are unverified.
- **ChessNowBot**: an open-source Telegram Mini App that WebSearch describes as a Telegram Mini App contest winner. Its GitHub repo ranks for Telegram chess queries.
- **Other Telegram bots**: @tgchessbot, @chessy_bot, Chessio Bot, @ChessContestBot and Shu Chess, which uses Elo ratings tied to Telegram IDs.
- **ChessNode**: Telegram and web, with crypto tournament prizes.
- **Real-money App Store apps**: Real Money Chess Prizes (Skillz), Real Chess Clash (Skillz), Chess Payday, Chess for Cash, Entropy Chess (ETRPY token) and MPL Chess.
- **Wager and P2E sites**: Arcadia Games / Arcadia Chess, Chesslers, ChessFish, Royale Chess, PowChess (BSV) and Checkmate.
- **World Chess (chessarena.com)**: prize-money tournaments with a $1.5 entry and an initial weekly prize fund of $85. These figures come from the chessarena.com news post as summarized by WebSearch.

---

## 2. Competitor traffic channel mix

| Domain | Direct | Search | Social | Referral | Paid | Top social sources | Source / status |
|---|---|---|---|---|---|---|---|
| chess.com | no access | no access | no access | no access | no access | no access | Similarweb `get-website-analysis-social-traffic-sources-agg` returned 403: plan credit limit reached |
| lichess.org | no access | no access | no access | no access | no access | no access | not attempted: Similarweb has no credits, Semrush has no API units |
| anichess.com | no access | no access | no access | no access | no access | no access | same |
| immortalgame.com | no access | no access | no access | no access | no access | no access | same |
| edchess.io | no access | no access | no access | no access | no access | no access | same |
| chesskid.com | no access | no access | no access | no access | no access | no access | skipped, since no tool could return it |

No channel mix, top countries or visits trend could be pulled for any domain today.

---

## 3. Keyword opportunity table

How to read the columns:

- **Google volume, KD and CPC are no access for every row.** The Ubersuggest `keyword_suggestions` call returned 403 because the daily limit of 3 reports was used up. Semrush returned `no_api_units` and Ahrefs Keywords Explorer requires a paid plan.
- **"US autocomplete"** means the phrase, or close variants, appears in Ubersuggest `google_suggestions` for the US in English (2026-11-12). This shows people really type it, but it does not measure volume.
- **"YT est./mo"** and **"YT comp."** are vidIQ YouTube estimates of monthly searches and competition on a 0–100 scale (2026-11-12). They describe YouTube search, not Google.
- **"Who ranks"** is a WebSearch result sample (US, 2026-11-12), not a Google rank tracker.

| Keyword | Google vol | KD | CPC | US autocomplete (variants seen) | YT est./mo (comp.) | Intent | Who ranks (WebSearch sample) | Our realistic angle |
|---|---|---|---|---|---|---|---|---|
| play chess telegram | no access | no access | no access | Yes: "play chess on telegram", "play chess in telegram", "how to play chess in telegram" | "chess telegram": <750 (comp. null) | transactional | github.com/makhnanov/chessnowbot, github.com/Piterden/chessbot, github.com/cxjdavin/tgchessbot, blog.invitemember.com/best-telegram-bot-games, t.me/s/trendingapps/103, Product Hunt (EdChess) | **High.** No brand landing page owns this query. Build a dedicated "Play chess in Telegram" page with a how-to and the bot deep link |
| chess telegram bot | no access | no access | no access | Yes: "chess bot for telegram", "chess game bot telegram", "chess bot tg", "chess com telegram bot" | not measured | transactional/nav | same set as above (repos, listicle, Product Hunt) | **High.** Comparison page "Telegram chess bots compared" that includes ours |
| telegram chess game | no access | no access | no access | Yes: "chess game in telegram", "chess game on telegram", "chess telegram game" | "telegram game": 4,815 (comp. 21) | transactional | same set | **High.** Same page cluster |
| chess mini app | no access | no access | no access | Ambiguous: results are Apple Watch "mini chess" and "chess minis". No Telegram-specific variant appeared | not measured | mixed | not sampled | **Low as worded.** Target "telegram chess mini app" inside the Telegram page instead |
| play chess for money | no access | no access | no access | Yes, large set: "...online", "...app", "...reddit", "chess 1v1 for money", "sites to play chess for money", "is it legal to play chess for money", "is playing chess for money gambling" | <750 (comp. 38) | transactional / YMYL | sites.google.com/view/playchessearnmoney, fintechfutures.com (Arcadia press release), App Store "Chess for Cash", bsvblockchain.org (POWChess), chessarena.com news, dummies.com, chessgames.com bookie | **Medium.** The SERP is weak but sensitive (gambling-adjacent). Win with honest explainers: legality, fees, how stakes work |
| chess for crypto | no access | no access | no access | Yes: "play chess for crypto", "play chess earn crypto", "play to earn chess crypto", "chess on blockchain", "crypto chess tournament". Noise from CHESS token price queries | not measured | transactional | playtoearn.com listings, dappradar.com/dapp/edchess, alchemy.com/dapps/chesslers, moralis.com wiki | **Medium-high.** Get listed on playtoearn.com (DR 65) and DappRadar. Add a "play chess for USDT" page |
| chess earn money | no access | no access | no access | Yes: "chess earn money app", "chess money earning app", "chess earn money without investment", "play chess earn money india app" | not measured | transactional (strong India skew in phrasing) | App Store (Skillz, Chess Payday), brsoftech.com, orioninfosolutions.com, coherentlab.com blog listicles | **Medium.** Listicle outreach plus our own "how earning works" page |
| play chess online free | no access | no access | no access | Yes, hundreds of variants ("...no registration", "...with friends", "...guest") | not measured | transactional | not sampled | **Low.** Head term. Only "no sign up / play in Telegram" variants are realistic |
| chess puzzles | no access | no access | no access | not queried | 39,164 (comp. 46, +31.1% growth) | informational | not sampled | **Low on Google, medium on YouTube/Telegram.** Daily puzzle posts and Shorts |
| chess tactics trainer | no access | no access | no access | not queried | not measured. Related "chess tactics for beginners" is 14,475 (comp. 27) | informational | not sampled (chesstempo.com DR 69 is in this space) | **Medium for "tactics for beginners"** (lowest YouTube competition measured) |
| chess openings for beginners | no access | no access | no access | not queried | **53,256 (comp. 42)**. "best openings in chess" 35,323 (comp. 41) | informational | not sampled | **Medium on YouTube.** Blog articles feeding the app CTA |
| how to improve at chess | no access | no access | no access | not queried | not measured. "how to get good at chess for beginners" 5,190 (comp. 28). "chess tips" 53,034 (comp. 59) | informational | not sampled | **Medium.** Long-tail beginner how-tos |
| chess with friends online | no access | no access | no access | Yes, large set: "play chess with friend online link", "online chess with friends no sign up", "chess with friends replacement", "why is chess with friends shutting down" | not measured | transactional | not sampled for this exact query. For "how to play chess in telegram with friends", the sample was GitHub bots plus Facebook Messenger chess articles | **High for the link / no-signup variants.** A Telegram invite link fits that intent directly |
| ton games | no access | no access | no access | Yes: "ton games bot", "ton games telegram", "ton games list", "ton blockchain games", "top games on ton", "play to earn ton games" (plus "toon games" noise) | not measured | navigational/listicle | not sampled | **Medium.** Directory listings and a "TON games list" roundup |
| telegram games earn | no access | no access | no access | Yes: "telegram games earn money", "...real money", "...without investment", "...2026", "telegram games to earn ton", "best telegram games to earn crypto" | "telegram games": <750 (comp. 22) | transactional | not sampled | **Medium.** A "best Telegram games to earn TON/USDT" roundup (disclosed as ours) |

**More vidIQ YouTube numbers (2026-11-12).** These are related keywords that came back with the calls above:

| Keyword | YT est./mo | YT comp. |
|---|---|---|
| chess tricks | 85,207 | 42 |
| chess game | 67,657 | 45 (+59% growth) |
| chess tournament | 46,111 | 57 |
| how to play chess for beginners | 36,815 | 45 |
| chess tutorial | 31,719 | 38 |
| chess lessons | 28,768 | 43 |
| chess tutorial for beginners | 21,071 | 38 (−65.3% growth) |
| chess strategy for beginners | 14,333 | 36 |
| chess tips for beginners | 9,450 | 43 (+99.5% growth) |
| chess tricks for beginners | 5,831 | 34 |

For the Telegram games keywords, every row except "telegram game" was under 750. Competition on those rows ranged from 7 to 47: "how to play telegram games" and "telegram game tutorial" had comp. 7, and "how to play games in telegram with friends" had comp. 12.

---

## 4. Twenty prioritized long-tail targets

Every phrase below is a verbatim Ubersuggest US autocomplete string or a vidIQ keyword (2026-11-12). **Google KD and volume were not measured**, so the ranking is qualitative. It weighs how well the phrase fits the product, how weak the observed WebSearch results are, and vidIQ competition where it exists. The top 3 clusters where we could realistically rank are (A) Telegram chess, (B) chess for crypto / earn on Telegram and TON, and (C) chess with friends by link.

| # | Target | Cluster | Source | Page to build | Why |
|---|---|---|---|---|---|
| 1 | play chess on telegram | A | UB autocomplete | Landing page `/play-chess-telegram` | Exact product match. Results are repos and listicles |
| 2 | how to play chess in telegram | A | UB autocomplete | How-to guide with screenshots and deep link | Question intent. No brand guide was seen in results |
| 3 | chess bot for telegram | A | UB autocomplete | "Telegram chess bots compared" | The results list competing bots, so a fair comparison page can rank |
| 4 | chess game on telegram | A | UB autocomplete | Same landing page (section) | Close variant |
| 5 | chess com telegram bot | A | UB autocomplete | FAQ: "Is there a Chess.com Telegram bot?" | Captures people looking for the incumbent |
| 6 | chess telegram group link | A | UB autocomplete | Page listing our community group and invite link | Navigational demand for groups |
| 7 | play chess with friend online link | C | UB autocomplete | "Send a chess challenge link" page | The Telegram invite link fits the intent directly |
| 8 | online chess with friends no sign up | C | UB autocomplete | Same page, no-signup angle | Mini App flow needs no separate account |
| 9 | chess with friends replacement | C | UB autocomplete | "Chess With Friends alternatives" | Autocomplete also shows "why is chess with friends shutting down". The shutdown itself was not verified, so check it before publishing |
| 10 | play chess for crypto | B | UB autocomplete | `/play-chess-for-usdt` explainer | Product match. Results are directories |
| 11 | play to earn chess crypto | B | UB autocomplete | Same page plus playtoearn.com listing | playtoearn.com (DR 65) already ranks for competitors |
| 12 | play chess earn crypto | B | UB autocomplete | Same cluster | Variant |
| 13 | telegram games to earn ton | B | UB autocomplete | "Telegram games that pay in TON" roundup | Telegram-native earning intent |
| 14 | best telegram games to earn crypto | B | UB autocomplete | Roundup (disclose that we're on it) | Listicle intent we can own |
| 15 | is it legal to play chess for money | B | UB autocomplete | Legal/FAQ explainer | Trust-building page for a sensitive money topic. The results sample is weak |
| 16 | sites to play chess for money | B | UB autocomplete | Comparison page | Commercial listicle intent |
| 17 | chess tactics for beginners | content | vidIQ 14,475/mo YT, comp. 27 | Blog plus Shorts series | Lowest YouTube competition measured |
| 18 | how to get good at chess for beginners | content | vidIQ 5,190/mo YT, comp. 28 | Blog guide | Low YouTube competition |
| 19 | chess openings for beginners | content | vidIQ 53,256/mo YT, comp. 42 | Pillar article | Largest beginner demand measured |
| 20 | how to play telegram games | A/B | vidIQ <750/mo YT, comp. 7 | YouTube tutorial / blog | Very low competition, and the audience is ours |

**Backlink quick wins**, based on the DR gap and who appears in results:

- Listings on playtoearn.com (DR 65), DappRadar and Product Hunt.
- Outreach to blog.invitemember.com's "best telegram bot games" listicle and to t.me/trendingapps.
- PRs adding us to "awesome" GitHub lists that rank for Telegram chess (ecosyste.ms awesome lists).

---

## 5. Tool access status (2026-11-12)

| Tool | Status | What happened |
|---|---|---|
| Ahrefs: `subscription-info-limits-and-usage` | worked (free) | Plan "Free, billed monthly". Workspace unit limit 0, usage 0. Resets 2026-12-09 |
| Ahrefs: `public-domain-rating-free` | **worked** | Two calls, 20 domains, 0 units |
| Ahrefs: `site-explorer-metrics` (web3chess.online) | **no access** | HTTP 400 "Insufficient plan". Not retried, and no other paid Ahrefs tools were tried |
| Ahrefs: GSC (`management-projects`, `gsc-keywords`) | **no access** | Both returned "Insufficient plan", so Search Console data is unavailable through Ahrefs |
| Semrush: `domain_overview` | **no access** | `no_api_units`: the subscription is active but has no API units. Semrush says more units can be added at https://www.semrush.com/mcp-access. Not retried |
| Similarweb: social traffic sources (chess.com) | **no access** | 403: the plan's credit limit is reached (no credits are charged for failed calls). Plans: https://account.similarweb.com/journey/packages/mcp?hook=mcpAccess. Not retried |
| Ubersuggest: `auth_status` / `user_limits` | worked | Free tier, limit of 3 reports a day. `user_limits` showed 0 of 3 used |
| Ubersuggest: `keyword_suggestions` | **no access** | 403 "You have reached the daily reports limit: 3", even though `user_limits` had shown 0 used (quota probably spent elsewhere today, or a stale counter). A paid plan raises the limit (https://ubersuggest.com/en/pricing). Otherwise the quota resets daily |
| Ubersuggest: `google_suggestions` | **worked** | Two calls (10 seeds, US/en). Returns autocomplete phrases only, with no metrics |
| vidIQ: `vidiq_keyword_research` | **worked** (added as the only volume source) | Four calls at 5 credits each, so 20 of the 120-credit balance. Figures are YouTube search, not Google |
| WebSearch | worked | Six queries, used only as result samples to see who ranks |

**To finish the Google-side numbers** (Google volume, KD, CPC, organic traffic and channel mix), any one of these is enough:

- Add Semrush API units.
- Upgrade Ahrefs to a paid plan, or connect Google Search Console to an Ahrefs project.
- Add Similarweb credits.
- Re-run Ubersuggest `keyword_suggestions` after its daily reset, for 3 seed clusters a day.

Sources (WebSearch, 2026-11-12):

- [ChessNowBot (GitHub)](https://github.com/makhnanov/chessnowbot)
- [Piterden/chessbot](https://www.github.com/Piterden/chessbot)
- [cxjdavin/tgchessbot](https://github.com/cxjdavin/tgchessbot)
- [InviteMember: best Telegram bot games](https://blog.invitemember.com/best-telegram-bot-games)
- [t.me/trendingapps post](https://t.me/s/trendingapps/103)
- [EdChess on Product Hunt](https://www.producthunt.com/posts/edchess-io)
- [EdChess on DappRadar](https://dappradar.com/dapp/edchess?cur=ETH)
- [EdChess on PlayToEarn](https://playtoearn.com/blockchaingame/edchessio/edit)
- [Arcadia press release](https://www.fintechfutures.com/press-releases/arcadia-games-launches-revolutionary-board-games-online-platform-to-enable-gamers-to-play-chess-for-money-online)
- [POWChess](https://bsvblockchain.org/?p=15038)
- [World Chess prize tournaments](https://chessarena.com/news/all/world-chess-introduces-prize-money-tournaments/)
- [Chess for Cash (App Store)](https://apps.apple.com/app/id1586330040)
- [Real Money Chess Prizes Skillz](https://apps.apple.com/us/app/-/id6444390683)
- [Chess Payday](https://apps.apple.com/us/app/-/id1609406107)
- [Chesslers (Alchemy)](https://alchemy.com/dapps/chesslers)
- [checkmate.live playbook](https://playbook.checkmate.live/faqs/payments)
- [chessgames.com bookie](https://www.chessgames.com/perl/bookie?help=1)
