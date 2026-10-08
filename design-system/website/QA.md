# Marketing website validation — 2026-10-07

## Verified build

- Website type checking, ESLint, and production build pass. All 37 static page/image routes generate successfully, including the Apple touch icon.
- This website work does not modify Mini App or backend code; no static frontend export is required for these changes.
- Local preview only. No production deployment or push was performed.

## Responsive heroes

The production preview was checked in the browser at 320, 360, 390, 640, 768, 1024, 1280, and 1536px: **48 route/width combinations** across Home, How It Works, Academy, Wagers, Fair Play, and Journal.

Every combination has one H1, the correct page-specific artwork inside its hero, a loaded responsive image, and no horizontal overflow. Desktop and phone compositions were also inspected visually. Below 768px the artwork follows the headline; the supporting explanation and actions follow it. From 768px the hero uses two columns.

All five generated artwork files preserve alpha and use 1000px WebP sources. Source sizes are approximately 70–127KiB; Next Image serves smaller variants as appropriate. The browser selected a 640px image for the 403px desktop artwork in the 1024px viewport. Hero dimensions are reserved before loading. Social images are generated locally at build time with bundled fonts.

## Interaction and accessibility

- Mobile menu: opening focus, first/last Tab cycling, Shift+Tab, Escape, scroll restoration, and focus restoration verified.
- The 10+0 preview displays “Ten minutes. Room to think ahead.”
- Selecting a 25 USDT example displays a 47.50 USDT winner credit; this includes the original stake and performs no transaction.
- The Academy challenge accepts Ra8 and displays the checkmate outcome. Earlier checks verified the three solutions, incorrect-move recovery, tap input, hints/reveal/reset, and selected-puzzle share URLs.
- Journal category filtering, search, empty results, and reset verified.
- Pointer motion changes the artwork transform within its bounds, then returns to rest on pointer leave. Reduced-motion media rules, touch gating, visibility/offscreen cleanup, and listener cleanup reviewed in code. Motion is finite or event-driven, without an idle render loop.
- Browser console captured no errors during the final responsive checks.

## Content and search presentation

- Canonical URLs point to the production domain; all six main routes have matching social artwork.
- The 95/3/2 decided-match split is sourced from the backend settlement implementation.
- Main page copy distinguishes legal-move validation from detection of outside assistance, platform credit from wallet withdrawal, and personal-wallet swaps from platform deposits.
- Article dates use real content dates. Unknown static route modification dates are omitted from the sitemap.
- The Fair Play article preview and the Wagers social preview were visually inspected for clipping and hierarchy.

These are browser viewport checks, not measurements from physical phones or a Lighthouse performance score.

## Follow-up mobile audit and brand update

- Reproduced the reported Academy clipping at 320px: the challenge's form forced a 337px grid column into 232px of available space. Explicit shrinking grid tracks, `min-width:0`, and stacked narrow form controls fix the cause. The yellow panel now uses 16px phone padding; the loaded board fits at 248px in the 320px viewport.
- Checked all six main routes at 320, 375, 768, 1024, and 1440px (30 route/width combinations), with no document overflow. Separately checked the loaded challenge at 320, 375, 640, 768, 1024, and 1440px so lazy loading could not conceal the original fault.
- Verified all three puzzle solutions, incorrect-move recovery, hint expansion, solution reveal, and reset on the mobile layout. The fixed Play action becomes hidden/inert while the notation field has focus. Repeated taps on the section link return to the challenge.
- Journal cover icons and captions occupy separate rows: at 320px the cover is 144px tall and there is a 23px gap between the icon and caption. Shortened two long article titles and excerpts, including the stale FinChess name, while retaining existing article URLs.
- The header, footer, favicon, and generated social cards share the compact W3CHESS / PLAY-TO-EARN brand and geometric yellow knight. Full Web3Chess remains the metadata/legal name. The home social card and 320px/1024px headers were visually inspected.
- Reduced the Academy practice block and footer copy to fit phones without oversized paragraphs. Disabled the development status badge that overlapped the preview's mobile Play action.
- ESLint, type checking, whitespace checks, and the production build pass. The build used webpack because local Turbopack worker port binding was restricted in this environment; all 36 static page/image routes generated.
- Updated the existing local preview at port 3100. No push or production deployment performed.

## Dayos reference correction

- Re-audited the requested Refero style and the live Dayos source. The previous supporting audit described Fold, and the shipped convention incorrectly allowed a full yellow challenge surface. Added `DAYOS_AUDIT.md`, corrected the guide, and removed that surface scope from the theme.
- The challenge now uses the shared white Card and a gray desktop board workspace. Phones put the introduction before the board and retain its available width: 248px at a 320px viewport, 303px at 375px. The loaded board and controls fit at 320, 375, 768, 1024, and 1440px. All control buttons measured at least 44px tall.
- Ordinary headings now use Onest at 30–40px/500, with 1.1 leading; the hero and one dark statement retain the condensed poster voice. Supporting labels are neutral. Removed decorative hero grids, orbits, extra metadata, caption cards, and journal-cover circles. Existing contextual 3D art, image sizing, finite entrance, and reduced-motion handling remain.
- Checked all six main routes at 320, 375, 768, 1024, and 1440px: 30 route/width combinations, one H1 each, the corresponding hero artwork, and no document overflow. These checks used the development preview; the rebuilt production preview was then inspected on desktop and phone.
- Verified all three checkmate solutions in the new phone layout, plus hint expansion, solution reveal, and reset. Solved feedback and expanded content also fit without overflow.
- Inspected the compact phone footer: direct Play action, two-column links, desktop-only QR, and readable short legal copy. Saved desktop/mobile challenge and home-hero screenshots. The production browser reported no console errors.
- ESLint, type checking, content validation, whitespace checks, and the webpack production build pass; all 36 static page/image routes generated. Refreshed the local preview at port 3100. No push or production deployment performed.

## Telegram crown identity

- Replaced the rejected yellow knight with a vector crown based on the owner's Telegram logo: a rounded three-point outline and separate baseline in lilac on a deep violet tile. The website lockup uses lowercase `w3chess` in Onest 600 and a quieter `Play-to-earn` line. Full Web3Chess remains the metadata/legal name.
- The header, sticky navigation, mobile menu, footer, favicon, and generated social previews share the mark and wording. The 180px Apple touch icon is a real PNG; social previews use a bundled true semibold font. The home social image was inspected after the production build.
- Checked the production header at 320, 375, 640, 1024, and 1440px with no horizontal overflow. The mark measures 40px on phones and 44px from 640px; the complete lockup measures approximately 154px and 165px respectively. The mobile menu fits at 320px and the sticky navigation fits at 1024px.
- Visually inspected the inverse lockup in the phone footer. The final production browser reported no console errors, and temporary viewport overrides were reset.
- Added reusable transparent SVG lockups with outlined lettering, an SVG mark, a 512px avatar PNG, and font licensing/source notes under `website/public/brand/`.
- ESLint, type checking, whitespace checks, content validation, and the webpack production build pass; all 37 static page/image routes generated. Refreshed the production preview at port 3100. No Telegram avatar upload, Mini App change, push, or production deployment performed.

## Crown lockup refinement

- The website now uses an open violet crown with wider proportions, smooth corners, a separate base, and optical vertical centering. The rounded avatar tile is reserved for the favicon, touch icon, and avatar export. Light, dark, and monochrome SVG lockups share the same construction.
- Replaced the lowercase text with outlined `W3Chess` lettering in Onest 650, with font kerning and −0.035em tracking. Browser and social lettering share the vector paths; the brand does not depend on a font swap. Retained accessible text, the 12px live tagline, and full Web3Chess legal/metadata naming. Removed the obsolete build-time semibold font.
- The production header fits at 320, 375, 640, 1024, and 1440px, with no document overflow. The lockup measures approximately 184 × 44px on phones and 200 × 48px from 640px. The 320px menu keeps 44px between the logo and Close button. The 1024px sticky navigation measures 948px and fits inside the viewport.
- Visually inspected the mobile header/menu, dark footer, desktop header/sticky navigation, and generated home social image. Saved desktop and mobile proof. The browser reported no console errors; temporary viewport overrides were reset.
- Crown contrast is 5.82:1 on the canvas and 7.33:1 on white; the avatar crown/tile pair is 9.99:1. `npm run brand:build` regenerates reusable exports and metadata icons from shared sources.
- ESLint, type checking, content validation, whitespace checks, and the webpack production build pass; all 37 static page/image routes generated. Local preview only; no Telegram upload or production deployment.

## Publishing validation

- The default Turbopack production build used by Railway passes, with all 37 static page/image routes generated. ESLint, type checking, content validation, and whitespace checks also pass.
- The brand export script uses the installed TypeScript compiler to read shared constant modules, keeping it compatible with the project's Node 20 deployment runtime.

## Uppercase CHESS wordmark

- Applied the owner's shorter uppercase `CHESS` direction using the established Barlow Condensed 700 display font, with `Play-to-Earn` underneath in Onest 400. Browser, footer, menu, sharing previews, and reusable SVG lockups use the same lettering and crown sources. Export filenames remain compatible with existing links.
- The visible wordmark is 26px high on phones and 28px from 640px. The complete lockup measures approximately 133 × 44px on phones and 143 × 48px from 640px. Checked 320, 375, 640, 1024, and 1440px with no document overflow.
- Visually inspected the desktop header, mobile header/menu, inverse footer, and generated home sharing preview. The production preview reported no browser console errors. Included the existing Barlow Condensed OFL license with the reusable brand exports.
- Brand exports, ESLint, type checking, content validation, whitespace checks, and the default Turbopack production build pass; all 37 static page/image routes generated.

## Geometric rook logo

- Replaced the marketing website's crown with a flat geometric rook. The header and footer use the open violet/lilac mark; the favicon, touch icon, and avatar use the contained mark on the deep-violet tile. The Mini App and Telegram avatar are unchanged.
- Regenerated the light, inverse, and monochrome SVG lockups from one path in `src/lib/brand.ts`, along with the browser icon, touch icon, and 512px avatar. Removed the obsolete crown export.
- Inspected the mark at 16px, 32px, and 512px; the home page header and footer at 390px and 1440px; and the 1200 × 630px generated social image. The single filled silhouette remains identifiable without a gradient, outline detail, or glow.
- `brand:build`, type checking, ESLint, content validation, whitespace checks, and the webpack production build pass; all 37 static page/image routes generated.
