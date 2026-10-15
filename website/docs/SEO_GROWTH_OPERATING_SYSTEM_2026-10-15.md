# Web3Chess organic acquisition operating system — 2026-10-15

This is the execution layer for [the strategy and 150-keyword candidate map](SEO_GROWTH_PLAN_2026-10-08.md). The objective is **first completed free practice game or first human match from a nonbranded search visitor**, then a return game. Search traffic alone is not a player count. No finite SEO program can guarantee unlimited traffic.

## Verified state and limits

- On 2026-10-15, the public sitemap listed 43 URLs. Home, Play, How It Works, Wagers, Academy, Journal, Fair Play, Rules, Terms, Privacy, and two sampled articles returned HTTP 200 with self-canonicals. The representative pages had one visible H1 each. Robots and sitemap returned HTTP 200.
- The sitemap had been assigning the current time to every static route on each fetch. This release removes those unverifiable `<lastmod>` values and retains editorial dates for articles. The Play page also included an unsupported `4.9` / `3,840` aggregate rating in `SoftwareApplication` JSON-LD; this release removes that markup.
- The Search Console domain property, viewed in the signed-in Chrome account on 2026-10-15, showed **18 impressions and 1 click** from 2026-09-22 through the latest settled day, 2026-10-13. Only three query rows were exposed; `web3 chess` had 4 impressions and no clicks. The 18-impression sample is too sparse for keyword or CTR winners. The GSC Wizard connector itself is unavailable because its trial ended, but direct Search Console read access is working in the `Lime Marketing` Google account.
- Search Console's indexing report was last updated 2026-10-11: **20 indexed, 19 not indexed** (13 historical 404s, five crawled-but-not-indexed pages, one duplicate). Most 404 examples are legacy `www` locale/login paths, plus an old app `/academy` and the API root. The submitted sitemap was marked **Success**, submitted 2026-10-12, last read 2026-10-13, and reported 44 discovered pages; the current live file lists 43. This is a discovery snapshot, not a count of indexed pages.
- Search Console attributed 12 of 18 impressions and the only click to `https://www.web3chess.online/`. The live `www` host currently fails TLS hostname verification, while apex pages return 200. Public DNS points `www` at a Railway hostname. This release adds the permanent host redirect and maps legacy localized login/home URLs to the current app routes; Railway custom-domain/certificate configuration still needs repair before browsers can reach those redirects safely. Do not bypass the certificate warning or infer a conversion from that search click.
- The website has a GA4 measurement ID and emits click events, but this task has no read access to the property. `play_in_telegram` is a **handoff click**, not an authenticated arrival or a game. No current search-to-game conversion rate is defensible.

## One page per job, one next action per page

| Searcher's job | Canonical page | Useful result before the CTA | Primary next action | Success signal |
| --- | --- | --- | --- | --- |
| Play chess in Telegram | `/play` | Working launch paths and honest free/paid explanation | Open Telegram or browser | Authenticated arrival, then first game |
| Improve at tactics | `/academy` | Solve an actual position, see why the move works | Share the same position or train in the app | Unrevealed solve, recipient solve, practice game |
| Learn the rules | `/rules` | Illustrated rule answer and board example | Try a free practice game | First practice game |
| Understand friend matches | `/how-it-works` | Current match and wager requirements | Start an eligible challenge | Created match, joined match |
| Evaluate paid play | `/wagers` and `/fair-play` | Verifiable settlement, eligibility and fair-play rules | Inspect rules, then choose a match | Eligible game, never a deposit alone |
| Learn a specific chess idea | One original Journal article | Board, notation, explanation, source where needed | Apply the idea in Academy or a game | Challenge start, practice game |

Use the 150 phrases as a **research inventory** for these routes and article briefs, not 150 synonym pages. Re-rank only with settled Search Console demand and downstream behavior. Editorial must verify every chess position and every changing product claim. The Daily Web3Chess content desk owns drafts; this workflow does not auto-publish them.

## Acquisition and sharing loops

1. **Search → useful answer → play:** answer the exact chess or Telegram question on an indexable page, show a real position or clear steps, then offer the matching free-practice path. Prefer a specific answer over a keyword-heavy introduction.
2. **Puzzle → friend → second solve:** after a legitimate solve, the existing share control sends the same position. The recipient lands on that board and can solve before opening the app. Track puzzle start, solve without reveal, share intent, recipient landing, recipient solve, handoff click, and authenticated game separately. Telegram/X share clicks are intentions, not confirmed sends; a copied link counts only after clipboard success.
3. **Game → useful return:** offer a new verified tactic, rematch, or progress milestone inside the product after a real game. A notification requires product permission and actual player state. Avoid fake countdowns, unsupported activity numbers, or financial prize promises.
4. **Community distribution:** publish original chess explanations and board links to the official Telegram channel and relevant communities under their rules. Measure referring visits, solved positions, and games per piece. Do not buy or manufacture engagement.

## Measurement contract

| Stage | Event/source | What it can prove |
| --- | --- | --- |
| Search appearance | Search Console impressions by query/page/country | Discovery only; delayed and sometimes privacy-filtered |
| Search visit | Search Console click; GA4 organic session when verified | Visit, not a player |
| Website engagement | `chess_puzzle_interaction` with `start`, `solve`, `reveal`, `hint`; `share` with `share_intent` | On-site actions; share intent is not a delivered invitation |
| Telegram handoff | `play_in_telegram` with `funnel_stage=telegram_handoff_click` | Outbound click only |
| Authenticated arrival | Backend/Mini App telemetry, joined to an approved campaign identifier | Opened and authenticated product session |
| Activation | Backend completed free practice or human game | Real player outcome |
| Retention | Backend return game in day-1/day-7 windows | Returning play, not impressions |

Segment every stage by landing page, device, country, branded/nonbranded query cohort where available, and campaign. Report counts and denominators with settled date windows. Never divide website clicks by backend games as if they were the same cohort until the attribution bridge exists. Avoid putting personal or wallet data into analytics events.

The site already sends a GA4 `play_in_telegram` event. In this release its destination URL is generated from the canonical bot configuration, and puzzle starts/hints are recorded on actual interaction. A first-party bridge from a website session to authenticated Mini App arrival still needs a reserved, allowlisted `startapp` campaign code, backend deduplication, retention/consent review, and end-to-end verification. Arbitrary UTM strings must **not** be appended to `startapp`: unknown values are currently treated as game IDs.

## 90-day execution cadence

| Window | Ship and verify | Decision gate |
| --- | --- | --- |
| Days 0–14 | Repair `www` TLS in the Railway website custom-domain settings and make HTTPS `www` redirect to the apex. Verify live redirects and certificate, then inspect Home/Play/Academy in Search Console. Keep the already-submitted sitemap; verify GA4 data collection and consent settings, and record settled baseline by page/query/country. Confirm browser and Telegram launch paths on mobile. | Do not announce traffic uplift from a sample under 100 impressions per query cohort over 28 settled days. |
| Days 15–45 | Improve one existing page per week where Search Console shows a real query/page mismatch. Add original answer, board example, or clearer route into play; release with a dated hypothesis. Add the privacy-reviewed website→app attribution bridge once product and analytics owners agree on the ID/retention contract. | Compare complete pre/post windows; inspect actual first games, not only CTA clicks. Revert if task completion or accessibility worsens. |
| Days 46–90 | Expand only proven clusters with original lessons or expert-reviewed examples. Test puzzle-to-friend sharing and one partner/community format at a time. Localize a complete route only when product/support copy can be maintained. | Allocate effort by incremental games and day-7 return, then by qualified handoffs. Stop channels that bring clicks without play. |

Weekly: review Search Console indexing and settled query/page/country data, choose **at most one** on-page or technical hypothesis, and run website build, typecheck, lint, and `seo:check`. Monthly: assess Core Web Vitals field data when available, article freshness, duplicate intent, editorial accuracy, and source-to-game cohort quality. At every release: verify one H1, canonical, sitemap coverage, indexability, mobile CTA, and no unsupported schema claim.

## Access needed to complete the measurement setup

1. Grant access to the Railway project hosting `web3chess.online`, or have its owner register `www.web3chess.online` as a custom domain and verify the certificate. The website will then apply the permanent HTTPS redirect in this release. The currently signed-in Railway CLI account lists no Web3Chess project. Direct Search Console access works; renewing GSC Wizard is optional if the recurring monitor uses that browser access instead.
2. Provide read access to the GA4 property receiving `G-JXR1D3D5E3` (or confirm the production measurement ID if different). Verify that events arrive before building dashboards or declaring conversion rates.
3. Approve the first-party attribution ID, consent/retention policy, and backend deduplication contract before joining website visits to authenticated games.

Google references: [sitemap last-modified guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [structured-data quality policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), and [Search Console workflow](https://developers.google.com/search/docs/monitor-debug/search-console-start).
