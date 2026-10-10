# Website content and performance audit

Checked 8 October 2026 UTC. The live website and local candidate are different builds. These results do not establish that the local changes are deployed.

## Live mobile measurements

Three fresh Chromium contexts per page, 390×844 viewport, 4× CPU slowdown, 1.6 Mbps download, 0.75 Mbps upload, 150 ms network latency, disabled browser cache and reduced motion. Values are navigation sample medians. Capture ends shortly after page load; later interactions are outside the measurement.

| Live page | HTTP | LCP | CLS | Transferred data | Main thread blocking observed |
|---|---|---|---|---|---|
| Home | 200 | 1.740 s | 0 | 472 KB | 63 ms |
| Blog | 200 | 1.452 s | 0 | 413 KB | 30 ms |
| Fair play article | 200 | 1.540 s | 0 | 415 KB | 59 ms |

No JavaScript page errors or horizontal overflow were observed in these samples. Robots and sitemap both returned 200. These are synthetic lab observations, not a Lighthouse score, real-user INP, or 75th-percentile Core Web Vitals. Field good thresholds are LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1; confirm them with field data before claiming a pass. [Web Vitals](https://web.dev/articles/vitals)

## Prioritized findings and changes

| Priority | Observed issue | Candidate change or next action |
|---|---|---|
| High | Live fair-play article claims engine-cheat prevention, latency elimination and guaranteed settlement, with an unverified personal author role | Corrected existing content locally; accountable editorial Organization author and current mechanism explanations |
| High | Live Home structured data includes outdated deposit and anti-cheat statements | The existing website candidate already contains corrected copy; deploy and verify the combined reviewed website changes |
| High | Article inventory included unsupported reward schedules and credential claims; the bankroll example misstated break-even | Revised existing articles while retaining eight URLs; the 1.9× total receipt model gives 52.63% break-even under explicit simplified assumptions |
| Medium | Home and Blog had no canonical link in the live samples | Canonicals present in the local candidate; verify them after deployment |
| Medium | Live article schema used a natural-language publication date and omitted its share image | Candidate has ISO dates, substantive update date, article image URL, source citations and accountable author type |
| Medium | Live static sitemap dates appear generated from the build timestamp | Existing candidate uses actual article dates and omits unknown static modification dates |
| Medium | Content was embedded in a large source array, making daily additions difficult to review | One JSON per article, a seven-category taxonomy, build validation and standalone file tracing |
| Medium | No connected Search Console, social engagement exports or attributable game-start analytics were available | Supply authorized exports or integrations; the scorecard preserves missing values instead of reporting invented results |

## Local candidate verification

The production build with Next's Webpack compiler passed, including TypeScript and generation of 36 static routes. The default Turbopack build could not create its local worker port in this environment. This is an environment limitation, not evidence of a production application failure. The unsupported `next start` preview command failed for an article; the actual standalone package used by the Docker deployment returned 200 after its public/static assets were installed before server startup.

The completed standalone preview showed Home, Blog and a representative article at 390px without overflow or JavaScript errors. All sampled images loaded with intrinsic dimensions. Canonicals and Organization article metadata were present; article citations and ISO dates matched the candidate content. All eight article destinations and their share images were checked separately. Source validation, legal position checks, draft checks and scoped lint passed. Seven research/analytics tests covered public-host restrictions, unknown dates, deduplication, robots failure, null metrics and rollback on failed promotion.

The local one-run lab samples measured Home LCP 1.812 s, Blog 1.216 s and the sampled Product article 0.912 s, each with CLS 0. They are useful for verification, but the article, build and environment differ from production. Do not present that comparison as a measured percentage improvement.

## Next release and ongoing checks

Review the specific website/content diff alongside existing website work, then deploy through the authorized main-branch workflow. Confirm the three canonical URLs, corrected article claims, new schema dates, sitemap and share images on production. Run the same three-sample audit after release to compare like pages and conditions. The daily desk includes Monday SEO/performance checks and keeps field analytics separate.

Raw evidence: [live audit](live-audit.json), [local audit](local-audit.json), and the saved mobile screenshots in this folder. Loading performance is healthy in the sampled lab runs; accurate deployed claims and missing attribution are the higher-priority marketing issues.
