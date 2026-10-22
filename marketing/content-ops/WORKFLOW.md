# Daily content workflow

> The configured six-Telegram, six-X, and three-article review pipeline, role charters and go-live steps are in [OPERATIONS.md](OPERATIONS.md). This page keeps the research and review rules.

Prepare a complete English editorial package at 09:00 America/Mexico_City. Save it for review in this repository. The owner can later authorize automatic blog publication; social distribution needs explicit channel access and authorization. Local scheduled runs require this computer and the Codex app to be available. [Codex automations](https://learn.chatgpt.com/docs/automations?surface=app)

## Roles

The Head of Marketing and Keyword Intelligence charters exist in the separate MarketingOS project at `/Users/grandmaestro/projects/MarketingOS/agents/`. Their principles inform this workflow. No connection to a running CMO service or SMM publisher has been established. These are ordered review passes within the daily run, not claims that several independent services are deployed.

| Pass | Responsibility | Deliverable |
|---|---|---|
| CMO | Audience, offer, objective, priority and experiment | One selected brief with success metric and stop rule |
| Research and keywords | Public feeds, primary fact verification, intent and duplicate check | Source ledger, fresh opportunity and evergreen alternative |
| Chess editor | Legal positions, variations, explanation and factual product claims | Original article with verified example and correct metadata |
| SMM | Native channel copy, hook variants and visual direction | Telegram, X, carousel and story copy plus template mapping |
| SEO and performance | Metadata, links, schema, sitemap and mobile page checks | Content validation and audit findings |
| Analytics | Comparable windows, attributed actions and next experiment | Weekly decision log with actual data or explicit gaps |

## Run sequence

1. Read repository instructions, STRATEGY.md, CALENDAR.md and the current website design guide. Inspect local changes. Keep unrelated work intact and do not stage or deploy the whole working tree.
2. Check whether today's dated package already exists. Resume an unfinished package; do not create a second daily article. Collect feeds with `python3 marketing/content-ops/content_ops.py collect`. Read its per-source failures and fetched time. It checks robots, hosts, response size, conditional requests, retries, dates and duplicate fingerprints.
3. Read the leading relevant candidates and full primary pages. The raw rank can prefer irrelevant subjects; apply the audience filter. Record claim, source URL, source publication/update timestamp, actual event date if established, capture time and verification status. If feeds fail, use permitted primary pages through web research. If facts remain uncertain, switch to the evergreen calendar item.
4. Choose one useful original angle. Check existing articles and prior drafts for repetition and competing intent. Use the seven-series rotation, allowing verified news to displace a related item. Avoid wager promotion in youth-oriented material.
5. Write one article. Save `drafts/YYYY-MM-DD/article.json` in the published article schema, `article.md` for reading, `social.md` for channels, and `evidence.json` for factual review. Use the actual intended publication date; a draft date does not establish publication. Estimate reading time from the finished text. Recalculate money examples from current settlement rules and replay any SAN lines with chess.js. Engine evaluations need an actual engine result and configuration.
6. Prepare two meaningful hook variants and one selected social package. Include a complete puzzle payoff, CTA, any required stake note, source credit where material, and a template family. Save `creative.json` and run `export-creative.mjs` with the bundled Node runtime. It creates editable `/CREATIVES` project JSON and PNGs for 1:1, 4:5, 9:16, 16:9 and 1200×630 blog share, plus a four-format proof sheet. Review the actual exported pixels at mobile size, safe areas, claims and destination; revise the brief or project and re-export until layout warnings clear. Keep exact-position board graphics in the chess renderer. If Chromium is unavailable, preserve the project JSON and report the missing visual exports. A meme must use original or licensed imagery. Save `distribution.json` as the attachment contract: each platform records its native caption, destination, PNG, editable project and status. Telegram and X use the square asset; blog Open Graph uses the blog asset; later platforms remain disabled until connected and approved.
7. Run the content checks and test the article's notation. To check an unpublished draft with the full schema without adding it to the blog, use `npm run content:check -- --draft ../marketing/content-ops/drafts/YYYY-MM-DD/article.json` from `website/`. Check relevant internal destinations, sources and the finished mobile layout. An automated word-pattern check is only a helper; review the headline, social copy and implications too.
8. In review mode, leave the new article in drafts and report the package path plus any material source or publishing issue. Do not publish it, send Telegram broadcasts, message other chats, post on social accounts or change budgets. Notify only when a package finishes or a meaningful failure or decision needs attention; do not repeat unchanged status.

## Blog promotion after approval

Approval must identify the article version. The local helper `promote` requires a reviewer record, checks the draft, rejects duplicate slugs, adds the JSON to the website and rolls it back if the full content check fails. It does not deploy. Run the production build, review the specific diff, and follow the repository's authorized Git and deployment workflow. Railway's website service deploys on a main push, so deployment is a distinct external consequence.

After deployment, verify the actual page returns 200, the title/canonical/JSON-LD match the approved article, the sitemap includes it and the share image loads. Record URL, deployed version and time. Publication fails if these checks fail. The existing Mon/Wed/Fri bot broadcaster is a separate system and is not part of this daily research workflow. Editorial canvas approval does not authorize a Telegram, X or future-platform post. Non-position Telegram and X creative is generated as a context-bound `creative.studio` project before QA; puzzle, trap and reveal posts stay on the exact board renderer. Blog staging accepts `blog_creative.image` and `blog_creative.project`, copies the reviewed 1200×630 pair under the article slug, and the Open Graph route selects it automatically. QA rejects mismatched caption fields, CTA destinations, missing project data, or unsupported quantified claims.

## Monday review

Audit ten recent competitor posts per accessible priority channel. Preserve the observation window, visible metrics and access method; unknown metrics remain unknown. Refresh keyword priorities using authorized Search Console/platform exports when supplied. Review the last seven days against comparable prior windows, with 28-day search comparisons to reduce daily noise.

Run the production mobile laboratory audit on Home, Blog and an article, and inspect changes against the previous run. Report lab results separately from field Core Web Vitals. Make bounded fixes that the task authorizes; review deployment independently. Choose one experiment to retain, one to revise and any to stop. If data is absent, record the missing input and prepare the next measurement rather than invent a result.

## Source and output architecture

`sources.json` controls the three public feed hosts. SQLite in ignored `state/` stores canonical URLs, hashes, first/last seen times and conditional-request headers. Reports expose source failures and recent dated candidates. Feed snippets support discovery, not copied article generation. Draft evidence records are the editorial source of truth. Published JSON powers static blog routes, their share images and sitemap; adding a file does not require editing a giant article array.

The pipeline is intentionally independent of paid APIs and private credentials. Authorized social APIs or exports can later supply engagement observations; do not bypass account restrictions or claim that a public feed proves virality. The CMO can consume these files from MarketingOS after an explicit integration; do not silently edit that separate project.
