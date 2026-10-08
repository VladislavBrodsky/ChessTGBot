# Web3Chess organic growth plan — 2026-10-08

## Decision in one page

Win the narrow, useful searches that the product can satisfy now: **play chess in Telegram**, **free A.I. practice**, and **solve a real chess position**. Send a visitor from a helpful answer or puzzle into a working game path. Measure authenticated arrival and actual games before expanding. Do not make 150 near-duplicate landing pages for 150 phrases.

The companion [150-keyword map](KEYWORD_MAP_150.csv) is an **intent-tested candidate inventory**, not a ranking of measured search volume. Search Console currently exposes too little demand data to call any phrase a proven winner. P0/P1/P2 express product fit and execution order, not traffic forecasts. Each candidate maps to one canonical existing page or a clearly marked future page. Use Search Console impressions, clicks, indexation, and actual player conversion to re-rank the map as data accrues.

## Evidence and baseline

- Google Search Console domain property: `sc-domain:web3chess.online`. The last 28 settled days through **2026-10-05** show **11 impressions, 1 click, 9.1% observed CTR**, and an average position of 15.9. This sample is too small for ranking or CTR conclusions. The only query returned in the query report was `web3 chess` (3 impressions, 0 clicks); query rows can be omitted by Search Console privacy thresholds.
- Search Console URL Inspection returned **“URL is unknown to Google”** for the homepage at the time of the audit. The public sitemap is reachable at `https://web3chess.online/sitemap.xml`, but the connected property lists **zero submitted sitemaps**. Submission through GSC Wizard was denied because its OAuth grant has read-only Search Console scope, despite the property showing site-owner permission. Enable full Search Console access at `tool.gscwizard.com/account`, then submit that URL and recheck inspection after Google has processed it. Submission is a discovery request, not an indexing guarantee.
- GSC Wizard crawled Home, Academy, How It Works, Wagers, and Journal. All five were HTTP 200, indexable, self-canonical, with one H1 and no critical/high findings. Six low-priority flags included long titles, missing structured data on some pages, and one intentionally decorative image with empty alt. The latter is correct accessibility behavior; do not add misleading alt just to satisfy a checker.
- No GA4 property is connected to this GSC Wizard account. Its CrUX API key is also absent, so there is no trustworthy first-party organic-to-player funnel or field Core Web Vitals trend here yet. The app has authenticated telemetry for game and referral milestones, but marketing search sessions are not linked to those outcomes.

## Competitive patterns and our position

| Product | Observable acquisition/product loop | Web3Chess response |
| --- | --- | --- |
| [Chess.com play](https://www.chess.com/play) and [daily puzzle](https://support.chess.com/en/articles/8708990-how-does-the-daily-puzzle-work) | Many clear intent paths (person, bot, friend, tournament), shareable daily puzzle outcomes, and a reason to return. | Lead with a real playable position and a position-specific friend link. Explain each route precisely. Do not claim comparable puzzle depth or activity. |
| [Lichess](https://lichess.org/) | Free chess, visible puzzle-of-the-day, and direct friend/computer actions on a broad chess platform. | Do not compete on “free chess” alone. Own the Telegram-native convenience and show the board before asking for a platform switch. |
| [ChessTempo](https://www.pt.chesstempo.com/) | Specialist tactics and opening training with a study promise. | Publish genuinely useful tactics/opening explanations that connect to playable practice, not generic SEO summaries. |
| [Telegram @chess](https://t.me/chess) | Direct “play chess in Telegram with real opponents or AI” positioning inside the same distribution channel. | Differentiate with transparent match rules, clear free-practice path, and a trustworthy public guide. A Telegram-native claim is not unique by itself. |

The inference from these public experiences is that broad head terms are crowded. The first defensible wedge is Telegram-specific intent combined with a helpful interactive chess result. These sources show product patterns, **not** competitors' search volumes, traffic, or conversion rates.

## 150-keyword audit and page architecture

The map has **15 clusters × 10 unique phrases**: 50 P0, 70 P1, and 30 P2. It separates play, friend invitation, A.I. practice, puzzles, mate-in-one, beginner training, openings, tactics, blitz, rules, fair play, USDT match evaluation, Mini App evaluation, Spanish, and Portuguese. “Live” means there is a relevant canonical page, not that it ranks. “Planned” means no page should be emitted until the underlying content and UX exist.

| Search job | Canonical destination | What a visitor must get |
| --- | --- | --- |
| Play chess in Telegram / with a friend | `/how-it-works` | A direct answer, true steps, the current friend-invite restriction (1 USDT minimum), and a working Play choice. |
| Practise against A.I. / solve puzzles / mate in one | `/academy` | A playable puzzle, hints, the free-practice route, and concrete learning next steps. |
| Beginner openings and blitz | Existing opening and blitz articles | Original explanations, verified positions/examples, contextual route into practice. |
| Fair play | `/fair-play` | Current rules and limits of legal-move validation; no invented automated cheat detection. |
| USDT chess match questions | `/wagers` | Fees, example net outcomes, custody distinction, risk, and age/local eligibility. |
| Rules searches | Future chess-rules guide | A complete, illustrated, correct beginner rules resource. Do not send this cluster to a thin placeholder. |
| Spanish and Portuguese searches | Future localized URLs | Fully translated main content, navigation, legal/risk copy, tested conversion path, and reciprocal `hreflang`. No boilerplate-only translations. |

The current English website should not emit `hreflang` for the Mini App's ten languages. [Google's multilingual guidance](https://developers.google.com/search/docs/advanced/crawling/managing-multi-regional-sites) calls for distinct, substantive localized URLs and proper alternate annotations. Broaden beyond Spanish and Portuguese when actual country/language demand and editorial capacity support it.

## The self-improving loop

**North star:** first completed free practice game or first human match from a nonbranded organic landing visit. A search click, website handoff, Telegram open, registration, first game, and retained player are different events; report them separately.

1. **Every day:** check public route/sitemap availability, Search Console index coverage, impressions/clicks by query/page/country, and clear regressions. Search Console lags by roughly two to three days, so do not interpret yesterday's partial data as a fall.
2. **Every week:** rank existing-page opportunities by search intent, impressions, ranking range, CTR, and downstream game starts once attribution is available. Improve one page at a time. Keep a dated hypothesis, changed URL, and before/after window. Review a page only after a meaningful observation window; fewer than 100 impressions in a 28-day query cohort is too noisy for CTR experiments.
3. **Every month:** refresh stale guides when product behavior or search intent changes, prune duplicate angles, review internal links, compare country demand, and run mobile Core Web Vitals checks. Targets for field data are LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at the 75th percentile, per [Google's Core Web Vitals guidance](https://support.google.com/webmasters/answer/9205520).
4. **At every release:** enforce the SEO build guard for a single H1, self-canonical pages, metadata, and sitemap coverage. Editorial checks must validate product claims and preserve one useful purpose per page.

Automation can monitor 24/7 and propose or implement reversible, evidence-backed fixes. It must not auto-publish batches of synonym pages, fake live counts, countdowns, artificial scarcity, scraped content, or unverified financial claims. [Google's helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) favors content that solves a visitor's task; its [spam policies](https://developers.google.com/search/docs/essentials/spam-policies) explicitly warn against scaled low-value content.

## Distribution and honest virality

- **Puzzle-to-friend loop:** let a visitor solve one website position and send that exact position to a friend. The recipient should land on the selected board, solve it, and see a clear free-practice choice. Measure recipient solves and game starts separately. The current three positions are examples, not a “new puzzle every day” feed.
- **Useful short-form chess content:** turn verified positions and original guides into short visual explanations for chess communities and creator collaborations. Each piece should stand alone as instruction, link to one playable board or guide, and disclose a paid collaboration when applicable. Publish where community rules allow it; no unsolicited Telegram messages or synthetic engagement.
- **Friend match invitation:** the Mini App already creates a game link, but this flow currently requires an eligible 1 USDT-or-higher wager and sufficient balances. Never market it as a free friend game. A free friend mode would be a separate product decision and a stronger future acquisition loop.
- **Real event urgency:** when a verifiable tournament or community session exists, publish its schedule, time zone, entry rules, and a join link. Avoid perpetual countdowns and unsupported live-player numbers.
- **Retention before scale:** compare the source of a first game with day-1/day-7 return behavior once measurement exists. Promote the channels that lead to real play, not only cheap clicks or social shares.

## Funnel instrumentation still needed

The website can track privacy-respecting aggregate stages such as `organic_landing`, `puzzle_started`, `puzzle_solved_without_reveal`, `puzzle_share`, `telegram_handoff`, `browser_handoff`; the Mini App already has authenticated telemetry for later game milestones. A reviewed first-party attribution design must connect these stages without collecting sensitive chess, wallet, or personal data unnecessarily. Before implementing it, confirm the analytics destination, retention/consent model, and how a Telegram deep link can carry an allowlisted campaign identifier without being mistaken for a game ID. Do **not** append arbitrary UTM text to `startapp`: current app code treats unknown values as game IDs.

Until that bridge exists, use Search Console for discovery, backend telemetry for aggregate gameplay, and explicitly label the missing join. Do not report website CTA clicks as acquired players.

## Prioritized delivery

1. **Now:** register the live sitemap in Search Console once full OAuth scope is enabled; inspect Home and the key landing pages again; validate robots/canonicals and website build output.
2. **Now:** strengthen the existing Telegram play guide and Academy around the P0 intent clusters, with accurate friend-match and free-practice answers plus relevant internal reading. Do not dilute the original visual system.
3. **Next:** connect analytics/attribution and CrUX field measurement, then learn where visitors leave between organic arrival and first game. Run small, reversible CTA and copy experiments against that outcome.
4. **Then:** publish one genuinely useful illustrated rules guide and a modest cadence of original chess instruction, each with a clear practice action. Localize a complete high-value route only when its translation, support, and compliance copy can be maintained.

There is no credible basis yet to promise a traffic number or call any keyword “viral.” The plan makes acquisition measurable and compounds around verified demand instead of inventing demand.
