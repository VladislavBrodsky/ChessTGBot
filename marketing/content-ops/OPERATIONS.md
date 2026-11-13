# Viral content operations: two Telegram drafts, X paused, and three article slots

This is the runbook for the content engine in `pipeline/`, the exact-position board renderer in `../templates/tg/`, and the campaign [Creatives Studio](https://web3chess.online/CREATIVES). It supersedes the
older one-article-a-day sections of [WORKFLOW.md](WORKFLOW.md) for channel production and the blog; the research and review
rules there still apply.

**Status (2026-10-24):** the pipeline plans, briefs, gates, renders and can publish approved items when the channel runner has its credentials. The repository's current mode is **cmo** for Telegram and X: the CMO agent approves each draft automatically ([the CMO release review](#the-cmo-release-review)), and **nothing sends unless an approval bound to its exact copy and current canvas is on record** (see [the dispatch gate](#the-dispatch-gate)). Articles stay in human `review` mode. The current maximum daily plan is two Telegram drafts (09:30 and 15:30 UTC: an engine-checked puzzle, then an Academy lesson) and three article slots; X is paused (`x.enabled: false` in `pipeline/config.json`) while its API credits are depleted. Slot times and the post format of each slot are `telegram.slots_utc` and `telegram.formats`. When the plan changes, the next top-up archives unsent drafts left at old slot times and rebuilds those slots (decision D3 of `marketing/GROWTH_STRATEGY_2026-11.md`, 2026-11-12). Check queue state before preparing or rescheduling an item; prior entries may already be approved or published. The editorial desk remains a separate review workflow from social publication.

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
python3 marketing/content-ops/daily.py doctor                  # daemon freshness + what blocks each draft (--fix: archive legacy, re-render)
python3 marketing/content-ops/daily.py review --days 2         # state/review/<date>.html: every draft with its image, copy and verdict
# a person reads each draft and its image on that sheet, then approves by id (several at once is fine):
python3 marketing/content-ops/daily.py approve <id> [<id> ...] [--by NAME]   # refuses unless the gates pass on the current canvas
python3 marketing/content-ops/daily.py stage                   # approved articles -> website/src/content/articles
python3 marketing/content-ops/daily.py publish --dry-run       # what would be sent (posts and puzzle reveals)
python3 marketing/content-ops/daily.py publish                 # live, only with credentials
```

Run `publish` every 10-15 minutes (cron, launchd or a scheduler); it only sends approved items whose `scheduled_at` has
passed, at most five per run, at most once each (`publishing` is claimed before the network call, so a crash can never
double-post). Puzzle reveals are threaded replies sent `reveal.after_hours` after the puzzle.

### The dispatch gate

Every publisher (autopilot, `daily.py publish`, `publish-x`, `PublisherAgent`, `telegram_publisher`) asks `pipeline/gate.py` before anything leaves the machine. `approved` in a file is not enough. An entry is cleared only when **all** of these hold:

| Check | Why it exists |
|---|---|
| An accountable approver recorded it (`approval.by` is `agent:cmo` or `human:<name>` in `cmo` mode, `human` only in `review` mode) and the approval's content digest still matches the copy, buttons, creative spec and reveal | The old daemon marked its own output `approved` with no record; any edit after approval now voids it |
| It is dated today (UTC), inside its slot's 3-hour window | Old approvals never catch up; reschedule on purpose |
| Its image was drawn by the right engine (`board` for exact positions, `studio` for everything else) on the **current canvas version** | A template or Studio change makes every earlier image stale, so improved canvases cannot be skipped by an old render |
| The approver approved that same canvas version | Approvals name the pixels that were reviewed |
| It passes today's QA rules | Rules added after approval apply to it; e.g. unsupported "sub-50ms" claims |

`pipeline/renderer.py::canvas_version()` hashes both renderers, their templates, the Studio model/render code, fonts and art. `daily.py doctor` shows each draft's verdict and the reason; the autopilot logs one "Held back" line per change instead of one per tick. Archived or demoted work lives in `queue/_archive/` (specs only; images re-render) and is never globbed by the queue.

### The CMO release review

In `cmo` mode (`pipeline/config.json` → `mode`), the autopilot runs `CmoAgent.release_day()` every tick before it picks what to send (`daily.py cmo-review [--dry-run]` runs it by hand). For each of today's and tomorrow's drafts in the current plan it re-renders a stale canvas, then either approves it (`approval.by = agent:cmo`, plus a `cmo_review` record with the score and notes) or leaves it a draft with the reasons. The CMO approves only when the gate's own checks pass **and** the slot meets the CMO golden rules (`review_slot_alignment`: hook length and punctuation, docked links, 1:1 X creative) **and** it is not recycled: no hook that ran in the last 7 days, no date-badged hook, no near-identical copy. A refused draft stays a draft; a slot left empty is better than a repeat, so write fresh content for it (`daily.py briefs` + `submit`) and the next tick reviews it. Any edit or canvas change voids the approval and the next review decides again. A person can still approve or reject with `daily.py approve|reject`; their decision stands under the same gate. Set a channel back to `review` to require a person.

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
3. Install the image engine once with the locked toolchain: `cd frontend && npm ci --include=optional && npx playwright install chromium` (Node 20, matching CI). If Chromium is managed separately, set `W3_CHROMIUM_EXECUTABLE_PATH` for the trusted runner; the renderer reports a direct setup hint when its binary is missing.
4. Review the first week's items by hand in `review` mode. Consider `auto` only after the team has read ~50 items and the
   gates have never let a bad one through. In `auto`, anything that passes QA publishes.
5. Confirm with the product owner (not verified by this repo): the geo rules for wager messaging, and Telegram's rules for
   crypto/gambling content in any paid placement. The first Match Rules post (Wednesday S5) waits for that answer.

### Running the autopilot (launchd)

`com.web3chess.autopilot.plist` runs `autopilot.py --daemon --live` with `KeepAlive`. Live mode drafts the missing slots for today and tomorrow (review mode: drafts only) and sends **only gate-cleared** entries. A long-running process keeps the code it imported at boot, so the daemon records `engine_fingerprint()` (Python sources + `pipeline/config.json`) in `state/autopilot_state.json`, checks it every tick, and exits when the checkout changes; launchd then starts it on the new code. `daily.py doctor` reports whether the running daemon matches the checkout. Do not rely on a restart you did not see.

```bash
launchctl bootout   gui/$(id -u)/com.web3chess.autopilot                    # stop (also stops all unattended posting)
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.web3chess.autopilot.plist   # start
python3 marketing/content-ops/daily.py doctor                               # confirm: loaded, running, code matches
```

The reply sniper and the legacy five-post CMO routine are off. Do not start them from the plist.

The normal CI workflow runs content engine unit tests on every PR and push to `main`. The GitHub workflow `.github/workflows/content-ops.yml` re-runs tests and queue QA gates on demand. It does **not**
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
