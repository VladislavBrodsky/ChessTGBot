# Website UI/UX audit — 2026-10-11

Scope: the live site at https://web3chess.online and `website/`. Method: Playwright crawl of every sitemap URL plus the 404 at 390, 820 and 1440 px (console, network, overflow, targets, images, ids, headings), axe-core 4.12 (WCAG 2.0/2.1 A+AA and best-practice) on every page at 390 and 1440 px, a throttled run (4× CPU, 1.6 Mbps, 120 ms) for CLS/LCP, an interaction probe (menu, FAQ, puzzle states, sticky nav), and full-page visual review. The same suites re-ran against a local production build after the changes.

## Baseline

The site was already sound: no console errors, no horizontal scroll, no broken images, one H1 per page, **0 axe violations**, CLS 0.000–0.033, LCP 0.9–2.8 s under throttling. The defects below are what remained.

## Defects found and fixed

| # | Evidence | Fix |
| - | -------- | --- |
| 1 | **Blog topic filter broke on desktop.** Both the mobile `<select>` and the desktop chips were visible; chips floated in a cramped column beside the search. Cause: the label carried Tailwind `block` (utilities layer) which beat `.blog-category-select { display: none }` (components layer). | Removed the conflicting utility, rebuilt the toolbar: select + search below 1024 px, chips left / search right on one aligned row above. |
| 2 | Featured story appeared twice on one screen (Editor's pick and again in the grid). | Hidden from the grid until a filter or search is active; count reads "7 more stories"; added a "Clear filters" action. |
| 3 | **Stray dark block in the Academy/Journal hero art** (AI-generation leftover behind the book) and in its social-preview image. | Isolated by colour and erased from the alpha channel in `chess-academy.webp`; regenerated `chess-academy-social.png` from it (full-colour RGBA; a 256-colour palette visibly posterized the shading). |
| 4 | Duplicate SVG id `path6570` on `/academy` (react-chessboard's king glyph, two boards on one page). | Ids stripped from piece SVGs in `FogBoard`; nothing referenced them. |
| 5 | "1 USDT" stat pushed its label 2 px below its three neighbours. | Stat value fixed to its own line box; all four labels now share one top. |
| 6 | Article dates printed as raw ISO in monospace; long articles left the right half of the page empty. | "Sep 24, 2026 · Updated Oct 7, 2026"; two-column layout with a sticky "On this page" rail (scroll-spy, ≥1120 px) and a CSS-only reading-progress bar. Every section heading now has a stable id for deep links. |
| 7 | **404 had no navigation or footer** and used a legacy pawn-like glyph from the old Mini App icon. | Real header and footer, four recovery links, the brand knight laid on its side. Removed the unused `KingMark`. |
| 8 | **No error boundary**: a runtime error showed Next's default page. | `error.tsx` (branded, `retry`, digest reference) and `global-error.tsx` (self-contained document). Verified in a production build: HTTP 500, UI shown, retry recovers. |
| 9 | Puzzle placeholder looked merely dimmed while its code loads. | Added a `loading-sheen` pass over the real, disabled controls (same geometry, so nothing shifts; off for reduced motion). |
| 10 | `Stakes & fees` link was a plain `<a>` (full reload); footer "Telegram Community Chat" wrapped on phones; README listed built pages as "not built". | `Link`; "Community chat"; README corrected. |

## Tried and removed (with evidence)

- **Route-level `loading.tsx` skeletons.** A production build showed `/blog/<unknown-slug>` returning **200** instead of 404 (the live site returns 404). Cause and rule are in the README. Removed both files; pages are prerendered, so they added nothing on navigation.
- **Scroll-reveal on sections.** Axe flagged text caught mid-fade as contrast failures (1.3–1.6:1) that vanished with reduced motion. Marginal polish on a deliberately restrained site, so removed.

## Verification

- Production build (39 pages), `tsc`, `eslint`, content check and SEO check (17 pages, 17 sitemap URLs): pass.
- Axe: 0 violations on every page at 390 and 1440 px, with motion on.
- Crawl vs baseline: duplicate-id finding gone; no new console errors, overflow or broken images.
- Status codes: unknown slug 404, unknown path 404, error route 500, valid pages 200.
- Blog: select hidden / chips shown at 1440; the reverse at 820 and 390.

Not exercised: `global-error.tsx` (it only renders if the root layout itself throws; it builds, lints and typechecks).

## Not done — needs a decision or assets

- **Real Mini App screenshots.** The product is never shown; this is the largest remaining gap for a product site. Needs captures of a released build.
- **i18n.** The site claims "10 App languages" but is English only.
- **Analytics with consent**, **Premium/Trust pages**, **dark theme** (the system is intentionally light-only today).
- **Hero art** was patched, not regenerated; commissioned or regenerated source art would be cleaner.
