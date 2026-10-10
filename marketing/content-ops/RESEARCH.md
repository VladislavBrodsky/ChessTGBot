# Initial market and editorial research

Observed 7 October 2026; collected 8 October UTC. The research collector successfully retrieved 59 entries across FIDE, Lichess and Chess.com and shortlisted 22 dated entries from the previous seven days. The shortlist is a freshness and topic-fit heuristic. It is not an engagement ranking.

## Competitive patterns

| Source | Observed format | Web3Chess hypothesis | Measurement needed |
|---|---|---|---|
| [Chess.com news](https://www.chess.com/news) | Player milestones, creator events, results and consequential moments | A timely fact can introduce an original practical chess lesson | Comparable public social views, post age, replies and downstream visits |
| [Lichess updates](https://lichess.org/feed) | Product utility, participatory game submissions, curated puzzles and community events | A concrete task or puzzle creates a reason to participate and return | Our puzzle completions, shares, qualified clicks and repeat practice |
| [FIDE news](https://www.fide.com/category/fide-news/) | Official announcements, dates, rules and tournament context | Primary verification gives an event explainer dependable context | Query impressions and useful reader questions; not inferred social virality |

Lichess announced image import for its Board Editor on 7 October. The opportunity for Web3Chess is an original lesson about what piece placement does not tell an analyst: side to move, castling rights and en passant context. It is a competitor feature, not a Web3Chess feature. The first draft uses that observation as a short news introduction and supplies its own examples. [Dated primary update](https://lichess.org/feed#2026-10-07-20:30)

No competitor is labelled “best performing” without a visible metric and a comparable observation window. Feed retrieval does not access private social accounts. Search volume, CPC, keyword difficulty and audience size are unmeasured. Keyword priorities in STRATEGY.md are editorial hypotheses until account data or authorized exports establish demand.

The public social check also opened Chess.com's YouTube Shorts page, Lichess's X page and the Reddit feature announcement linked by Lichess. The retrieved YouTube page exposed no current video metrics, X returned 403, and Reddit exposed no vote/comment counts. These attempts add no measured performance ranking. Use authorized channel exports or visible public metrics in the next audit; do not convert an access failure into a virality estimate.

## Product evidence

The money example uses the 95/3/2 decided-match split in `backend/app/services/settlement.py`, mirrored in `website/src/lib/config.ts`. A combined 20 USDT pot yields a 19 USDT winner receipt; subtracting the winner's 10 USDT stake leaves a 9 USDT gain. Draw handling, withdrawals and transfer costs have separate rules. In the simplified decided-game-only model, break-even is 1/1.9 = 52.63%, not 51.3%. This is arithmetic under stated assumptions, not an estimate of a player's success.

Rating claims were checked against `backend/app/services/game_service.py`, which uses an Elo-style expected-score update. Removed unsupported author credentials, reward schedules, universal win-rate statistics, instant withdrawal claims and non-custodial language from existing articles. Retained their eight URLs so revisions preserve destinations.

## First measurement requests

Use authorized Search Console exports for queries and landing pages, platform exports for social reach and engagement, and verified app events for first games and repeat practice. Record country, language, device and dates where available. Until then, the operating outputs are research evidence, original drafts, content quality checks and laboratory performance results—not a live revenue dashboard.
