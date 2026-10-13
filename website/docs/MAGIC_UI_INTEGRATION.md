# Magic UI integration for the marketing website

This contract supplements [the website design system](../../design-system/website/DESIGN.md). It applies to `website/`, including public pages and blog templates. The Mini App has separate tokens and primitives.

## Installed stack and stylesheet order

Use the repository's installed Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 with `@tailwindcss/postcss`, `framer-motion` 12, and COBE 2. Use local Phosphor icons from `@/icons`, local SVG currency assets, and shared website controls from `@/components/ui/`. Read installed Next documentation before changing framework configuration.

The root layout imports `src/app/globals.css` once. That stylesheet imports Tailwind, `design-system/website/theme.css`, then `src/styles/marketing-showcase.css`, in that order. `@source "../"` includes component and data-file utility strings. Custom showcase selectors live in `@layer components`; utility overrides remain predictable. Do not import a second global theme, Tailwind v3 config, or the Mini App stylesheet.

The local files are maintained adaptations. A missing `components.json` does not prevent them from working; this website does not depend on the shadcn CLI to register components. Do not run a registry installer over shared primitives or add `motion`, Lucide, Radix icons, or a remote icon service without a concrete dependency need and review of the generated changes.

## Tokens that actually compile

The theme resets `--color-*` and `--shadow-*`. Tailwind's default color/shadow names are intentionally unavailable. A component can render while missing these styles, so a successful TypeScript check alone is insufficient.

| Role | Canonical utility | Invalid legacy/example name |
| --- | --- | --- |
| Main text | `text-fg` | `text-fg-default` |
| Muted text | `text-fg-muted` | `text-slate-600` |
| Positive state text | `text-fg-win` | `text-emerald-600` |
| Positive state fill | `bg-win-fill/15` | `bg-emerald-500/15` |
| Nested surface | `bg-inset` | `bg-surface-inset` |
| Inverse action surface | `bg-inverse` | `bg-surface-inverse` |
| Small heading | `text-title` | `text-heading-xs` |
| Supporting metadata | `text-caption` | `text-body-xs` |
| Border | `border-line` | `border-gray-200` |
| Flat elevation | `shadow-none` | `shadow-xs`, `shadow-md` |

Use semantic `fg-*` state text on scoped surfaces; it switches to readable soft ink in black blocks. Use state colors for actual state and asset colors for currency identification. Winning payments never use loss colors. Native currency SVG fills/illustration shading are preserved. Complete utility strings must appear in source; use a literal map rather than `bg-${color}-500` or another runtime construction.

Typography uses Onest for explanations, controls, and 14px metadata; Barlow Condensed for display headings and selected figures. Body copy is 16px with comfortable leading. Data-card headings align left. Preserve owner copy and all marketing modules; headings have no terminal periods.

## Local adapter contracts

| Reference | Local implementation | Required adaptation |
| --- | --- | --- |
| [Bento Grid](https://magicui.design/docs/components/bento-grid) | `magicui/bento-grid.tsx`, `RewardsBento`, `FeatureCardIntro` | Natural rows; 1/2/3 columns at 640/1024px; shared Card; complete copy; always visible 44px actions; demo in flow |
| [Animated List](https://magicui.design/docs/components/animated-list) | `magicui/animated-list.tsx`, `LiveSettlementFeed` | Deterministic first frame; bounded visible item count; stable keys; complete rows; cleaned-up timer; hover/focus pause and reduced motion |
| [Icon Cloud](https://magicui.design/docs/components/icon-cloud) | `magicui/icon-cloud.tsx` | Local `children` and `center` API, four SVG assets and a gold king core; bounded perspective orbit; no token/core/legend collision; separate pause dock |
| [Orbiting Circles](https://magicui.design/docs/components/orbiting-circles) | `magicui/orbiting-circles.tsx`, `ChessEcosystemOrbit` | Numeric or CSS-length `radius`; consistent `--orbit-distance`, `--duration`, `--angle`, `--icon-size`; responsive container geometry; all eleven selectors accessible |

The reference demos include their own palettes, fixed visual stages, masking, and positioning. Translate their behavior into our layout and tokens. Do not copy their wrapper geometry unchanged into production. The local IconCloud API intentionally differs from the current registry's `icons`/`images` API; substituting that source requires an explicit migration of consumers and controls.

Below 340px of available orbit-panel width, keep the five currency/platform tokens in the outer ring and show six labelled chess buttons in a grid. Larger panels add the inner ring. Both layouts retain the selected item and full inspector copy. CSS establishes the first frame; no hydration-time radius jump. Keep 44px targets inside the stage, including safe gutters. The globe uses a stable square and a complete SVG fallback before WebGL or if WebGL is unavailable.

## Motion, interaction, and verification

Use `useShowcaseActivity` for viewport, tab visibility, and reduced-motion preferences. Clear every timer, animation frame, observer, and listener. Vault frames are capped; globe/orbit/list work stops offscreen. Prefer transform/opacity motion. Financial rows remain sharp. Native pause controls use shared Button, accessible names, `aria-pressed`, and keyboard focus. Keep hover/focus inspection temporary and click/tap selection persistent.

Never hide a layout problem with root `overflow-x: hidden`. Interactive panels use `data-interactive-workspace` so the phone action does not cover their controls. QR overlays do not reserve page width. Respect symmetric `--site-safe-gutter` and top/bottom insets.

Run:

```sh
npm run ui:check -- --self-test
npm run lint
npm run build
npm run seo:check
```

The UI guard checks dependency declarations, stylesheet import order, source scanning, safe gutters, required keyframes, and generated named utility selectors. The build repeats it against the emitted production CSS. The regression fixtures cover the undefined classes that caused the October 13 styling gaps. This guard complements visual checks; it cannot establish layout quality, interaction correctness, or contrast by itself.

Check actual viewport widths from 320px through desktop, full text/amounts, no overflow, node containment/collisions, keyboard selection, pause/resume, and reduced-motion behavior. For shared tokens, inspect the home page and all supporting page templates, including an article and blog index. Compare production/local copy and required modules before publishing.

For isolated checkouts with dependencies symlinked from the main checkout, use `npm run dev -- --webpack`; Turbopack can reject an out-of-root dependency symlink. Keep the normal production build configuration unchanged.
