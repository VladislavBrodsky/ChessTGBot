# Website UI/UX audit — 2026-10-08

Scope: the live marketing website at https://web3chess.online and its `website/` implementation. Mini App code and unrelated working-tree changes are outside this change.

## Findings and implemented improvements

| Area | Evidence and bottleneck | Improvement |
| --- | --- | --- |
| First-screen structure | At 390 × 844, the main Play button began around 650px, after the decorative sculpture. | Actions and support now precede artwork on phones; the button begins around 376px. Tablet and desktop hero compositions remain distinct. |
| Brand | A tiny raster purple crown, generic CHESS label, and Play-to-Earn tagline introduced a separate palette and weaker name recognition. | Custom vector knight and full Web3Chess lettering, black/mint palette, light/dark/mono exports, favicon, touch icon, avatar, and sharing previews. |
| Typography | Supporting section headings were forced uppercase; grouped headings were 18px despite the documented 20px role. Technical mono appeared in ordinary metadata and section dividers. | Sentence-case 32–44px section titles, 20px grouped headings, quieter Onest metadata, and a smaller hero type scale. Condensed display type stays reserved for major statements and figures. |
| Tokens | Logo palette and typography disagreed across the spec, token JSON, TypeScript, and CSS. Controls repeated arbitrary dimensions. | Mirrored current brand/type/control/radius values, with shared 44/48/56px controls and 20/24px cards. Updated the authoritative website guide. Historical recipes remain explicitly subordinate to its current conventions. |
| Buttons | PlayButton and Button had separate sizes, variants, and hover rules; time and stake selectors repeated custom buttons; filters/sharing relied on forced utility overrides. | One shared button construction with size variants, pointer-only hover, focus/pressed/disabled states, a shared SegmentedControl for both demos, and a shared Input with high-contrast boundaries. |
| Icons | FAQ drew a separate plus icon; the puzzle picker used a text check glyph. Repeated book icons and Academy cards added decoration without new information. | Shared Phosphor plus/check icons and a single divided Academy list with level labels visible on phones. |
| Navigation | The large pill competed with the logo. Article descendants lacked the Blog active state. Same-page FAQ used a router link. A footer FAQ link was only about 31px wide. | Flat divided header, compact sticky bar, descendant active state, repeatable native FAQ anchors, and a 44px minimum footer target. |
| Puzzle structure | Selecting a different position required scrolling past the board on phones. Solved controls could be spread vertically by the spanning desktop board. | Position picker before the board on phones, beside it on desktop, and explicit grid rows to keep short solved controls at the top. |
| Loading and error layout | The existing static-board placeholder was useful, but repeated the same geometry separately from the selector and sharing controls. | Preserve the real static board, shared introduction and selector, matched button sizes and control order, reserved two-line board-caption geometry, readable loading copy, and local retry boundary. No fake data or blank guessed-height bars. |
| Puzzle states | Empty notation could be submitted. Invalid moves used the same neutral feedback treatment. Solved state offered three equally prominent actions. | Disabled empty submission, aria-invalid and text-labelled errors, and one primary Next position action. Solved and revealed progress remain distinct. |
| Keyboard access | The board library injected unnamed role=button keyboard drag targets inside an image-labelled board. | Remove those targets from Tab order; preserve pointer drag/tap and the complete labelled notation-input keyboard path. |
| Client work | Font builds fetched three families; the floating action queried the document repeatedly during scroll and did not react to workspace size changes. | Two compressed local WOFF2 families (about 97KB combined), native mono, cached route elements, and ResizeObserver updates. Board/rules loading remains deferred until near the viewport. |

No horizontal overflow was observed on the original 390px home page. This audit does not claim field Core Web Vitals or a measured LCP/INP improvement: font and scroll changes address source-level costs, while first-action position is a visible layout measurement.

## Verification

- Production build: passed, with all 37 generated pages and metadata endpoints.
- TypeScript, ESLint, content checks, and diff whitespace check: passed.
- SEO check: passed for 17 public pages and all 17 sitemap URLs.
- 320 × 800: Home, How It Works, Academy, Wagers, Fair Play, Journal, Play, Terms, Privacy; no horizontal overflow, one H1 per page, no broken loaded images.
- 768 × 1024: Home, Academy, Wagers, Journal; no overflow and correctly arranged tablet heroes/actions.
- 1024 × 900: all nine pages plus an article; no overflow, correct active navigation on descendants, header/footer targets at least 44px.
- 1440 × 900 and 390 × 844: final visual review and saved screenshots below.
- Interaction checks: invalid and successful typed moves, all three solutions, revealed answers excluded from solved progress, reset/next, clipboard feedback, time controls, 25 USDT example (47.50 USDT winner credit), search empty state and recovery, menu scroll lock, Escape, focus restoration and Shift+Tab cycling.
- Board keyboard check after fresh navigation: no unnamed drag targets in Tab order. Pointer controls and typed-move input remain available.

The first sandboxed build failed because its CSS worker could not bind a local port. Moving aside that cached compiler error and rerunning with the permitted local worker resolved it. The final production build, including the last refinements, passed.

Screenshots: [desktop](ui-audit/desktop-after.jpg), [mobile](ui-audit/mobile-after.jpg).

The production site is unchanged until these repository changes are deployed. No Mini App rebuild was required because this change only edits the marketing website and its own design tokens.

## Second pass — composition and semantic polish

The owner requested a further review of the current local preview. This pass uses the first-pass screenshots above as its baseline.

| Remaining issue | Implemented correction |
| --- | --- |
| The desktop hero delayed the first playable content, and repeated large gaps fragmented the story. | Shorter lead, bounded 480px artwork, 24–36px section padding, and 40–64px supporting-page gaps. At 1440 × 900, the challenge Card begins at 726px rather than approximately 866px. Home document height falls from 6773px to 6174px. These are layout measurements, not performance metrics. |
| Forced breaks made ordinary headings awkward at intermediate widths. | Natural wrapping and balanced sentence-case headings on Home, Academy, and Wagers; display breaks remain reserved for the major poster statements. |
| Board coordinates shared squares with pieces; pale squares blended into the inset and rounded corners clipped the board edges. | Shared BoardFrame with external 12px rank/file coordinates, a hairline edge, and a mirrored 4px board-radius token. Static and interactive boards share geometry. Library notation is disabled to prevent duplication. |
| Unsolved progress looked as dark as completed progress. | Neutral empty segments and semantic green solved segments, alongside an explicit text count. Revealing an answer still does not count as solving it. |
| The tablet featured story stacked a large decorative media block, and regular cards repeated two links to one story. | Featured copy and small contextual artwork share a row from 768px. Each story has one descriptive link, a card-level keyboard focus outline, and a non-focusable reading cue. The home preview avoids an orphan third card at tablet widths. |
| Category buttons created several rows on phones. Form values inherited the labels’ bold weight. | Shared native topic Select below 1024px, pressed topic buttons above, labelled search with a matching vendored Phosphor icon, and explicit regular-weight form values. |
| The Play route left two buttons floating above a large QR card without explaining their destinations. | Two shared cards explain Telegram and browser access, with bottom-aligned 56px actions. The compact QR handoff sits beside its explanation from 768px. |
| A tall responsible-play decoration competed with the main story. | A compact, divided semantic aside preserves the useful advice. Main Home sections and shared heroes are named regions associated with their live headings. |
| Policy headings retained poster utilities despite their reading-oriented role; Fair Play actions did not align. | Remove the policy display utilities so the shared Onest reading style applies. Align Fair Play card actions and supporting notes at the bottom. Policy text and mechanics are unchanged. |
| Hidden navigation/CTA effects still measured layout at the opposite breakpoint. | Skip desktop sticky-nav calculations below 1024px and phone CTA calculations above it. |

### Second-pass verification

- Final production build, including the final form/policy/card fixes: all 37 pages and metadata endpoints generated successfully.
- TypeScript (production build), ESLint, content validation, SEO validation, and whitespace checks: passed.
- Home, How It Works, Academy, Wagers, Fair Play, Journal, Play, Terms, and Privacy at 320px and 1024px: no horizontal overflow, one H1 each, no duplicate IDs.
- Home, Academy, Wagers, and Journal at 768 × 1024: no overflow or duplicate IDs; featured story uses the compact two-column composition.
- Phone primary action begins at 349px at 390 × 844, compared with 376px after the first pass and approximately 650px before it. The hero artwork loads successfully.
- Typed Ra8 and tapped Qxg7 solve their positions. Revealing Qxg7 leaves the solved count unchanged; retry then tapping the move increments it. External files/ranks render once; the board has no unnamed keyboard drag tab stops.
- Phone journal: Openings returns two stories; a nonmatching search gives the empty state; Show all stories restores eight. Native selects and search preserve their visible labels.
- Phone menu: Shift+Tab cycles from Close to the final Play link; Escape closes, restores focus to Open menu, and releases body scroll lock.

Final screenshots: [desktop](ui-audit/desktop-polished.jpg), [phone](ui-audit/mobile-polished.jpg), [tablet journal](ui-audit/journal-tablet-polished.jpg). Changes are local and have not been deployed to production.
