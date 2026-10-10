# Web3Chess content operations

Daily autoposting (5 Telegram posts + 5 articles): [OPERATIONS.md](OPERATIONS.md). Read [the strategy](STRATEGY.md), [daily workflow](WORKFLOW.md), [28-day calendar](CALENDAR.md), [initial research](RESEARCH.md) and [site audit](reports/AUDIT.md). The [first daily package](drafts/2026-10-08/article.md) includes original channel copy and source evidence. Review is the current publishing mode.

## Collect and verify

From the repository root:

```sh
python3 marketing/content-ops/content_ops.py collect
python3 -m unittest discover -s marketing/content-ops -p 'test_*.py'
cd website
npm run content:check
npm run content:check -- --draft ../marketing/content-ops/drafts/2026-10-08/article.json
npm run typecheck
npm run build
```

If the local Turbopack worker cannot bind a port, `npm run build -- --webpack` verifies the same production pages using Next's alternate compiler. This environment's successful verification used that command; it is not a change to Railway's build configuration.

The collector respects public feed access, applies conditional requests, deduplicates canonical URLs and saves per-source failures. It never logs credentials or follows arbitrary hosts. Inspect `reports/latest-research.json` and verify the primary source before writing. A failed source does not stop the remaining sources. `state/` stores the local cache and review log and is ignored by Git.

## Promote a reviewed article

```sh
python3 marketing/content-ops/content_ops.py promote marketing/content-ops/drafts/2026-10-08/article.json --reviewed-by 'Actual reviewer name'
```

Use a real review record for the exact version. The command adds a validated local website file; it does not publish or send anything. Duplicate slugs require a reviewed update to the existing file. The website content directory is included in standalone build tracing so the loader remains available in the deployed package.

## Audit and analyse

`website/scripts/audit-site.mjs` requires Playwright. In this Codex workspace, set `W3_BROWSER_MODULES` to the bundled Node package directory returned by the workspace dependencies tool, then run:

```sh
node website/scripts/audit-site.mjs --out marketing/content-ops/reports/live-audit.json
python3 marketing/content-ops/content_ops.py analyse marketing/content-ops/metrics.csv --output marketing/content-ops/reports/analytics.json
```

Copy `metrics.csv.example` and fill it with actual platform exports. Empty values produce null ratios. Collect no private player names or wallet addresses for this scorecard. The lab audit uses three fresh mobile contexts, 4× CPU slowdown and a defined network throttle; INP and field percentiles require real-user data.

Daily creative can be exported with the bundled Node runtime using `marketing/content-ops/export-creative.mjs <draft-folder>`. It reads the folder's `creative.json`, reuses the existing campaign renderer, checks every layout, and writes native PNGs, editable SVGs and a proof sheet. The first package contains all four formats. Source assets and licenses stay in the original campaign kit.

## MarketingOS integration

This folder is a usable input/output contract for the separate MarketingOS project. Its Head of Marketing and Keyword Intelligence charters were inspected. No running SMM publisher was found in this repository. Integrating their service would require an explicit project change and real channel credentials; the daily Codex run currently performs the ordered research, editorial, SMM and analytics passes itself.
