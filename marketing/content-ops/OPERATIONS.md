# Viral content operations: six Telegram drafts, six X drafts, and three article slots

This is the runbook for the content engine in `pipeline/`, the exact-position board renderer in `../templates/tg/`, and the campaign [Creatives Studio](https://web3chess.online/CREATIVES). It supersedes the
older one-article-a-day sections of [WORKFLOW.md](WORKFLOW.md) for channel production and the blog; the research and review
rules there still apply.

**Status (2026-10-22):** the pipeline plans, briefs, gates, renders and can publish approved items when the channel runner has its credentials. The repository's current mode is **review**: a human checks each post and rendered image before approval. The current maximum daily plan is six Telegram drafts, six X drafts, and three article slots. Check queue state before preparing or rescheduling an item; prior entries may already be approved or published. The editorial desk remains a separate review workflow from social publication.

## 1. Who does what

The CMO owns outcomes and the weekly decision. Everyone else produces a defined artifact and passes it on. These are
ordered passes (human or agent), not separate deployed services.

| Role | Owns | Input | Output | Done when |
|---|---|---|---|---|
| **CMO** (in charge) | Weekly plan, slot mix, experiment calendar, final approval, go/no-go for live posting | Analyst's weekly log, audit report | Updated `pipeline/config.json` (slots, rotation), one experiment per week with a stop rule | Plan is committed and the week's queue is `plan`ned |
| **Competitive analyst** | Scraping and audit of public channels, new viral sources | `sources.json`, `telegram_public.py` | `reports/competitor-audit-<date>.md/.json`; `viral_sources` kept current | Report cites n, p-values, limits; no copied text kept beyond short evidence excerpts |
| **Chess editor** | Every position and line | `pipeline/idea_bank.py`, Lichess CC0 data, verified games | Verified ideas (`idea_bank`), correct SAN, honest lessons | python-chess verifies; tests pass |
| **Copywriter / SMM** | Post and article drafts in our voice; hooks, CTA, reveal text | The slot's brief (`daily.py briefs`) | `drafts/<date>/tg-N.json`, `art-N.json` | `daily.py submit` returns no issues |
| **Designer** | Exact-position board graphics and branded promotional canvases | `../templates/tg/`, `/CREATIVES`, `creative.json` | Board image for puzzles; Studio project JSON, platform PNGs and proof sheet for campaigns | Renderer checks pass; each image is reviewed at phone size |
| **Compliance / QA** | The gates and the human read | `pipeline/qa.py`, `renderer.check` | Gate changes (never weakened), the approval click | A person reads the post + image, then `daily.py approve <id>` |
| **Analytics** | Weekly numbers and what to do next | Channel stats exports, UTM visits, attributed starts | Decision log; gaps stated as gaps | Metrics table updated; unknowns left empty |

## 2. Daily cycle

All commands run from the repo root. `--date` defaults to today (UTC).

```bash
python3 marketing/content-ops/daily.py plan --days 2           # create configured Telegram, X, and article slots
python3 marketing/content-ops/daily.py briefs                  # attach briefs (voice, idea, audit patterns, CTA registry)
# writer fills each slot (an agent, a human, or `daily.py write` with ANTHROPIC_API_KEY):
python3 marketing/content-ops/daily.py submit <id> <draft.json>    # QA gates + image render
python3 marketing/content-ops/daily.py status
# a person reads each draft and its PNG (queue/<date>/<id>.png), then:
python3 marketing/content-ops/daily.py approve <id>            # refuses if the gates did not pass
python3 marketing/content-ops/daily.py stage                   # approved articles -> website/src/content/articles
python3 marketing/content-ops/daily.py publish --dry-run       # what would be sent (posts and puzzle reveals)
python3 marketing/content-ops/daily.py publish                 # live, only with credentials
```

Run `publish` every 10-15 minutes (cron, launchd or a scheduler); it only sends approved items whose `scheduled_at` has
passed, at most five per run, at most once each (`publishing` is claimed before the network call, so a crash can never
double-post). Puzzle reveals are threaded replies sent `reveal.after_hours` after the puzzle.

### The slot plan (UTC)

`pipeline/config.json` carries the plan from [the competitor audit](reports/competitor-audit-2026-10-10.md) section 6.
It is a four-week hypothesis built on spacing and time zones (the data shows almost no time-of-day effect), not a
measured optimum.

| Channel | Configured UTC slots | Daily maximum |
|---|---|---|
| Telegram | 06:30, 09:30, 12:30, 15:30, 18:30, 21:30 | 6 review drafts |
| X | 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 | 6 review drafts |
| Website | 05:00, 11:00, 17:00 | 3 article slots |

Pillars and template families rotate through `pipeline/config.json`; exact-position tactics keep the board renderer while non-position campaigns use the shared Studio canvas contract.
Articles run on `site.slots_utc` with a matching pillar mix and a `cover` image.
Articles carry `publishAt`, so the site shows each one only from its slot time (ISR revalidate 600 s).

### What the gates enforce (a failing item is `rejected`, never posted)

- Telegram HTML is balanced and escaped; <= 1024 chars with an image; <= 3 emoji; hook <= 110 chars; <= 2 buttons.
- Links only to our hosts and `t.me/chess_matbot`, `chess_hub`, `chesshub_chat`; `startapp` only `arena` or `ref_<code>`.
- Originality: no 6-word run and low n-gram overlap against the competitor excerpts attached as sources; near-duplicate check against earlier posts.
- Compliance: no income/profit/urgency language (also inside the image text); wager wording needs "18+" and "You can lose your stake." in the post (and in the image footer); no youth wording near wager copy.
- Chess: every FEN is legal, every SAN line replays, "mate in N" claims are proven with python-chess, and the **image's FEN must equal the checked FEN**.
- Images: the engine's own QA (fit, safe margin, overlap, WCAG AA contrast, size floors, board squares >= 28 px). A failed render rejects the item; a post with a `creative` and no image is refused by the publisher.
- Promotional canvases may attach a reviewed `/CREATIVES` JSON as `creative.studio` to a non-position queue item. This replaces only that item's rendered main image; all existing text, claim, disclosure and approval gates still run. Any item with a chess FEN or verified chess position continues through the exact board renderer. X Studio images must be square. Do not attach Studio art to puzzle reveals.

For the daily editorial package, `node marketing/content-ops/export-creative.mjs marketing/content-ops/drafts/YYYY-MM-DD` creates the Studio JSON and reviewed PNG set. An approved article may copy its `creative/blog.png` into `website/public/blog/` and serve it as the article share image; this is a publication change and requires the article-specific approval and normal site checks. Do not replace an exact board diagram with this promotional cover. Exporting a canvas alone does not publish a post or make a queue entry approved.

## 3. Go live (owner actions)

1. Create the bot (or reuse `@chess_matbot`) and add it as an **administrator** of the channel with "Post messages".
2. Provide secrets as environment variables on the machine that runs `publish` (never in the repo):
   `W3_TG_BOT_TOKEN`, `W3_TG_CHANNEL` (`@channelusername` or the numeric id). Optional drafting: `ANTHROPIC_API_KEY`, `W3_WRITER_MODEL`.
3. Install the image engine once: `cd frontend && npm install && npx playwright install chromium` (Node 20+).
4. Review the first week's items by hand in `review` mode. Consider `auto` only after the team has read ~50 items and the
   gates have never let a bad one through. In `auto`, anything that passes QA publishes.
5. Confirm with the product owner (not verified by this repo): the geo rules for wager messaging, and Telegram's rules for
   crypto/gambling content in any paid placement. The first Match Rules post (Wednesday S5) waits for that answer.

The GitHub workflow `.github/workflows/content-ops.yml` runs the tests and the QA gates on demand. It does **not**
publish: live posting needs durable queue state (at-most-once), which should live on one trusted runner until the team
chooses where it belongs.

## 4. Sources and scraping

`telegram_public.py` reads public `t.me/s/<channel>` previews: https only, robots.txt first, >= 2.5 s between requests,
page cap, no media download, text and counts only, stored in `state/telegram_posts.sqlite3` (ignored by Git).

```bash
python3 marketing/content-ops/content_ops.py scrape-telegram chesscom_ru edchessss
python3 marketing/content-ops/telegram_audit.py       # reproduces every number in the report
```

Re-scrape weekly so the observation table builds real views-by-age curves. Other sources (`sources.json` ->
`viral_sources`, 46 entries; 41 verified) are monitored through their official feeds/APIs where allowed. Reddit and
X/Instagram/TikTok have no permitted automated feed and stay manual. Competitor material is **evidence, never copy**: we
keep the pattern (hook structure, format, timing), rebuild it on our own position, wording and brand art.

## 5. Measurement and the Monday review

Per slot: median views, reactions per 1K views, link clicks (UTM on web links), and attributed first games when the
attribution exists (see STRATEGY.md measurement plan). Public view counts are not reach and not conversion; do not
publish claims about our audience until attribution exists.

Monday (CMO): for each experiment choose continue / revise / stop / investigate; one new experiment per week with a
baseline and a stop rule. After four weeks compare each slot with its own median and re-cut the slot plan.

## 6. Adding to the engine

- New idea: add to `pipeline/idea_bank.py` (tests re-verify every entry).
- New image template: `../templates/tg/README.md` -> "Adding a template", then map it in `config.json` `creative_defaults`.
- New CTA or link: `pipeline/brand.py` `CTAS` (only verified destinations).
- New gate: `pipeline/qa.py` + a test in `test_pipeline.py`. Gates may be tightened, not loosened, without CMO sign-off.
