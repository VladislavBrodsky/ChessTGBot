# ChessTGBot Brand & Design System

**Status:** Authoritative guide for the Telegram Mini App (`frontend/`)
**Identity:** Obsidian Chess — a premium, chess-first arena
**Last reviewed:** 2026-10-11
**Applies to:** every page, sheet, card, state, animation and visual asset in the Mini App. The marketing website (`website/`) has its own palette and components and never imports Mini App tokens.

Use this guide while designing, building and reviewing. It is a rulebook, not a mood board: every rule here is either enforced by a test/script (marked **⚙ enforced**) or is a review checklist item.

---

## 0. Architecture at a glance

```text
design-system/app/tokens.json        ← single source of truth for SCALE tokens (type, space, size, radius, z, motion)
        │  npm run tokens  (frontend/scripts/build-tokens.mjs;  `-- --check` in CI)
        ▼
frontend/src/styles/tokens.css       ← GENERATED. Never hand-edit.
frontend/src/styles/theme.css        ← Tailwind 4 `@theme` bridge: exposes tokens as utilities (text-brand-*, size-*, etc.)
frontend/src/styles/themes.css       ← COLOUR tokens per theme: dark (default) · light · nebula
frontend/src/styles/base.css         ← reset, typography roles, focus ring, RTL-neutral defaults
frontend/src/styles/components.css   ← primitives' CSS (button, input, switch, badge…)
frontend/src/styles/overlays.css     ← modal, drawer, sheet, toast
frontend/src/styles/features.css     ← feature-owned styling (game board, arena, chess clock…)
frontend/src/styles/motion-perf.css  ← keyframes, reduced-motion, content-visibility
frontend/src/styles/rtl.css          ← logical-property fixes for Arabic
frontend/src/styles/layout.css       ← page anatomy + semantic recipes (hero, stat, row, tile, podium, skeleton)
frontend/src/app/globals.css         ← only `@import "tailwindcss"` + the files above, in this order
frontend/src/components/ui/*.tsx     ← primitives (Button, Card, Badge, Skeleton, PageHeader, …)
```

Layer precedence: tokens → themes → base → components → overlays → features → motion → rtl → layout. Unlayered CSS beats Tailwind utilities, so recipe geometry that pages must be able to override lives in `@layer components`.

Tailwind 4 reads tokens **only** from `@theme`. There is no `tailwind.config.js`; a utility that is not declared in `@theme` produces no CSS (this silently broke the UI once — see memory notes). Add new utilities to `theme.css`.

---

## 1. Principles

1. **Chess-first.** The board, the clock and the next move dominate. Everything else supports them.
2. **One primary action per view.** One emerald gradient button/link in the first viewport; everything else is secondary or ghost.
3. **Calm under pressure.** Quiet surfaces, one border, restrained accent. Motion and glow are reserved for earned moments (win, level-up, box reveal).
4. **Honest data.** Loading ≠ empty ≠ zero ≠ error. Never invent counts, rewards, fees, balances or testimonials to fill a card.
   Planned prize concepts belong in separate, explicitly labelled previews with no entry control or live progress. Keep the active free box's odds and rewards distinct. A GRAM win reveal, confetti, balance, or payout state requires a server-confirmed award; see `marketing/GRAM_VAULT_SEASON_SPEC.md`.
5. **Tokens, not values.** No raw hex, no raw palette classes, no magic pixels. If a value is missing, add a token.
6. **Thumb-first.** Primary controls live in the lower two thirds. Hit areas are ≥44px.
7. **Predictable layout.** Skeletons match final geometry; layout shift is a bug (budget CLS ≤ 0.08, **⚙ enforced** by `e2e/layout-shift.spec.ts`).
8. **Works everywhere.** 320px → 1280px, dark/light/nebula, RTL, reduced motion, 10 locales.

---

## 2. Foundations

### 2.1 Colour

Colour tokens are per-theme in `themes.css`. Components use semantic names only.

| Role | Token / utility | Dark (default) | Light | Use |
| --- | --- | --- | --- | --- |
| Canvas | `--bg-primary` · `bg-brand-void` | `#000000` | `#F3F6FA` | Page background |
| Surface | `--bg-surface` · `bg-brand-surface` | `#0A0A0A` | `#FFFFFF` | Cards, rows, tiles |
| Elevated | `--bg-elevated` · `bg-brand-elevated` | `#121212` | `#EEF2F7` | Controls, selected, sheets |
| Raised | `--bg-raised` | `#1A1A1A` | — | Icon-tile gradient top, pressed |
| Border | `--border-muted` · `border-brand-border` | `#1F1F1F` | 8% slate | The only separator (1px) |
| Control border | `--control-border` | `#626262` | `#7C8798` | Inputs, switches (3:1 non-text contrast) |
| Text primary | `--text-primary` · `text-brand-primary` | `#F5F7FA` | `#0F172A` | Titles, values |
| Text muted | `--text-muted` · `text-brand-muted` | `#9AA3B2` | `#556275` | Labels, metadata (≥4.5:1 on every surface) |
| Action (emerald) | `--action-bg`, `--grad-action`, `--action-ink` | `#34D399` | `#10B981` | The primary next action, wins, verified |
| Premium (purple) | `--grad-premium`, `--badge-purple-ink` | `#8B5CF6→#6D28D9` | same | VIP, mystery boxes, premium tier |
| Gold | `--text-gold` | `#F5C451` | `#B8860B` | Rating/level highlights, warnings, countdowns |
| Danger | `--danger-ink`, rose | `#FB7185` | `#BE123C` | Resign, destructive confirm, errors |
| Info | cyan (`--badge-cyan-ink`) | — | — | Neutral informational status |

Rules
- **Meaning needs a second channel.** Colour is never the only signal — add an icon or a label.
- **No opacity on text** to dim it (`text-brand-muted`, not `text-white/60`) — it fails AA on some surfaces. **⚙ enforced** (`opacity-on-text`).
- **No raw palette classes** (`slate-*`, `zinc-*`, `gray-*`). **⚙ enforced** (`raw-palette-class`). White-on-colour pairs must be AA: use `purple-600`+, not `purple-500`, with white text.
- **No raw hex** in components. **⚙ enforced** (`raw-hex-colour`); tier artwork (`boxConfig.ts`), `global-error.tsx` and canvas gradient stops are the only allow-listed files. Tier/accent *text* mixes toward `--text-primary`: `color-mix(in srgb, ${accent} 55%, var(--text-primary))`.
- Gradients: only `--grad-action`, `--grad-premium`, hero-card radial accents. Max one saturated gradient surface per viewport.
- Light is a first-class theme: same hierarchy, same semantics, never inverted meanings. Nebula is optional/expressive; it may not change structure or contrast floors.

### 2.2 Typography

Font: **Outfit Variable**, self-hosted (no remote font host on first paint), with native fallbacks. Monospace for addresses, codes and transaction IDs.

Type is expressed as **roles** (tokens `--type-<role>-size/leading/weight/tracking`, classes `.t-<role>` e.g. `t-title-2`, `t-numeric-lg`). Pick the role by purpose, never by size.

| Role | Size / leading | Weight | Use |
| --- | --- | --- | --- |
| `display` | 40 / 1.1 | 700 | Hero headline, welcome |
| `title-1` | 28→32 fluid / 1.15 | 700 | **One per page** (`PageHeader`) |
| `title-2` | 20 / 1.3 | 700 | Section headings (`SectionHeader`), sheet titles |
| `title-3` | 17 / 1.35 | 650 | Card and list-row titles |
| `body-lg` | 16 / 1.5 | 400 | Reading text, **input text (16px stops iOS zoom)** |
| `body` | 14 / 1.5 | 400 | Default UI copy |
| `label` | 14 / 1.25 | 650 | Buttons, tabs, controls |
| `caption` | 12 / 1.4 | 500 | Metadata, helper text, badges |
| `eyebrow` | 12 / 1.4 | 650 · +0.08em | Micro-label above a value. Uppercase only in Latin/Cyrillic (disabled for `ar`, `hi`, `ja`, `zh`) |
| `numeric-xl` | 40 / 1 | 700 | Balance, rating hero numbers |
| `numeric-lg` | 28 / 1.1 | 700 | `ui-stat` values |
| `numeric` | 20 / 1.2 | 700 | Inline key figures |
| `numeric-sm` | 14 / 1.2 | 650 | Prices/XP inside rows |

Rules
- **Floor: 12px** for any rendered text. **⚙ enforced** (`sub-12px-text`; the Academy mini-board coordinate glyphs in a decorative `aria-hidden` preview are the tracked exception).
- Numbers are `tabular-nums`; values never wrap mid-figure.
- Body copy ≥ 1.4 line-height; headings ≤ 1.35.
- **Sentence case** everywhere; no hard-coded ALL-CAPS English (the `eyebrow` role handles caps via CSS so it can switch off per script). **⚙ enforced** (`uppercase-eyebrow-direct`).
- Letter-spacing comes from roles. Ad-hoc `tracking-[…]` is banned. **⚙ enforced**.
- Truncation: single-line titles `truncate` inside `min-w-0`; descriptions clamp to 2 lines; money/IDs never truncate in the middle of a figure (use `break-all` mono for addresses).
- One `<h1>` per page. Heading levels never skip.

### 2.3 Space

4px base grid. **Compose with the named gaps; use raw steps only inside a component.**

| Token | px | Meaning |
| --- | ---: | --- |
| `gap-inline` | 8 | Between inline items (icon↔label, badges) |
| `gap-stack` | 12 | Between stacked related elements |
| `gap-card` | 16 | Between sibling cards, inside a card between groups |
| `gap-section` | 24 | Between page sections |
| `gap-page` | 32 | Between major page zones (desktop) |
| `pad-sm / md / lg / xl` | 12 / 16 / 20 / 24 | Container padding (rows / cards / hero / sheets) |

Raw steps: `1`=4 `2`=8 `3`=12 `4`=16 `5`=20 `6`=24 `8`=32 `10`=40 `12`=48 `16`=64. Pair the gap to the **relationship**: closer = related. Within a card 16, between cards 16, between sections 24 — never the same value for both “inside” and “between sections”.

### 2.4 Size

All interactive and structural sizes are tokens (`--size-*`).

| Group | Tokens |
| --- | --- |
| Controls (hit area) | `control-compact` 36 (only inside a ≥44 row) · `control-sm` **44** · `control-md` 48 · `control-lg` 56 |
| Icons | `icon-xs` 14 · `sm` 16 · `md` 20 · `lg` 24 · `xl` 32 |
| Avatars | `xs` 24 · `sm` 32 · `md` 40 · `lg` 48 · `xl` 64 · `2xl` 96 |
| Icon tiles | `tile-sm` 32 · `md` 40 · `lg` 48 · `xl` 56 |
| Structure | `row-min` 64 · `stat-min` 96 · `quick-tile-min` 108 · `goal-tile-min` 148 · `nav-height` 68 (+safe area) |
| Chips/badges | `chip` 26 · `chip-counter` 20 |
| Progress | track `sm` 6 · `md` 8 · `lg` 12 · ring `sm` 48 · `md` 64 · `lg` 96 |

Rules: every touch control ≥ **44×44** (visually smaller icons get a padded hit area); primary buttons ≥ 48 tall; text fields ≥ 48 tall.

### 2.5 Radius

Radius **follows nesting** — an inner element is always at least one step smaller than its container.

`xs 6 · sm 8 · md 12 · lg 16 · xl 20 · 2xl 24 · 3xl 28 · pill 999`
Semantic: `chip 8 · control 12 · tile 12 · row 16 · card 20 · hero 24 · sheet 28`.
Board and avatars: the board sits in `.board-frame` (hero radius, 1px border, turn-state ring); avatars are circles; squares are never rounded.

### 2.6 Elevation & surfaces

Elevation = surface step + inset highlight, not blur. Standard surfaces: **1px border + `inset 0 1px 0 var(--border-highlight)`**. Only `ui-hero-card`, sheets and the nav carry a drop shadow (`--shadow-premium`, `--shadow-nav`).
- **No `backdrop-blur` in repeated items, lists, scrollers or timer-driven areas** (overdraw). Blur is allowed on one overlay backdrop and the nav.
- Surface ladder: canvas → surface → elevated → raised. A child is on the next step up from its parent, never the same step.

### 2.7 Z-index

`base 0 · content 10 · sticky 20 · nav 50 · overlay 100 · nested 110 · critical 120 · toast 140`. Overlays are ≥100 so they always cover the navbar.

### 2.8 Motion

Tokens: `instant 100ms · fast 160ms · base 240ms · slow 420ms · chart 700ms`; easing `standard`, `emphasized`, `exit`.
- Feedback 100–160ms; entrances 240–420ms; nothing blocks input.
- Animate **transform and opacity only**. No layout-property animation, no continuous infinite animation on ordinary UI.
- Respect `prefers-reduced-motion` and the in-app *Reduce motion* setting (`useAnimationsEnabled`): fall back to instant state changes; count-ups render the final value.
- Celebration (confetti, glow, shimmer) is allowed only for: win, level-up, claim, box reveal, streak milestone.
- Haptics (`telegramHaptic`): `selection` for tab/segment switches, `light` for taps, `medium` for confirmations, `success`/`error` for outcomes.

### 2.9 Iconography

`react-icons` (Fa/Lu set already in the bundle). 14/16/20/24 only (the `--size-icon-*` scale). Stroke weight stays consistent per surface. Decorative icons are `aria-hidden`; an icon-only control **must** have `aria-label`. **⚙ enforced** (`unnamed-icon-button`). Chess motifs (piece, board, clock, rank) are used where they clarify a feature, never as wallpaper.

---

## 3. Semantic layer

Pages are composed from **semantic recipes**, not utility soup. Each recipe owns geometry, type role and state styling.

| Recipe | Anatomy | Rules |
| --- | --- | --- |
| `ui-hero-card` (`--premium`, `--gold`) | Eyebrow → numeric-xl/title → meta → (one action) | **One per page.** Radius `hero`; quiet radial accent + faint board grid watermark; no extra border glow |
| `ui-stat` (`--accent --premium --gold --danger --info`) | `__label` (eyebrow) · `__value` (numeric-lg) · `__meta` (caption) | 2–3 column grid; min height `stat-min` 96; values tabular; the modifier carries meaning, not decoration |
| `ui-list-row` (`--interactive`) | Icon tile · title-3 + caption · trailing value/chevron | Min height 64; single border; no glow; interactive rows have hover + pressed + focus ring |
| `ui-icon-tile` (`--success --premium --gold --danger --info`) | Square tile `tile-md` | Colour comes only from the modifier |
| `ui-quick-tile` | Icon · label · (optional meta) | 2–4 up, min 108; whole tile is the hit area |
| `goal-tile` | Progress ring · title · reward | Min 148; the ring has an accessible name and value |
| `podium` | 2-1-3 order, rank medal, name, score | 1st gold, 2nd silver, 3rd bronze — with **rank numerals**, never colour alone |
| `board-frame` | Board + coordinate rim + radius | Board is never overlapped by controls |
| `skeleton` | Shimmer block with role-based height | See §6 |
| `ui-action-link--primary` | Emerald gradient, inner highlight, hover sheen | The page's single primary destination |
| `ui-eyebrow` | Eyebrow role | Label above a value |
| `Backdrop` (`components/ui/Backdrop.tsx`, `.ui-backdrop*`) | Masked grid, tilted checkerboard, two glows, four chess pieces | Entry surfaces only (login, invite/QR, auth splash). Tokens only, so it works in dark/light/nebula; two pieces float (transform), `still` freezes it; never behind app dashboards or the game board |

Compose with the shared primitives: `PageHeader`/`SectionHeader`/`ActionLink`/`PageUtilities`, `Card`, `Button`, `Badge`/`BadgeRow`, `Tabs`/`SegmentedControl`, `Modal`/`Drawer`, `EmptyState`/`ErrorState`, `Skeleton*`, `Toast`, `Switch`, `Input`, `Avatar`, `ProgressRing`, `CountUp`, `Reveal`, `QuickTile`.

---

## 4. Composition rules

### 4.1 Page anatomy (mobile-first)

```text
┌ safe-area top (--app-safe-top)
│ PageHeader        title-1 + one-line purpose + PageUtilities (≤2 icon buttons)
│ ── gap-section ──
│ Hero / live state ui-hero-card OR live game banner     ← ONE hero
│ ── gap-section ──
│ Primary action    ui-action-link--primary / Button primary  ← ONE primary
│ ── gap-section ──
│ SectionHeader (title-2 + optional ActionLink)
│   content group (stat grid, list, tiles)  gap-card
│ ── gap-section ── … more sections
│ ── page bottom: nav-height + --app-safe-bottom + gap-section
└ BottomNav (fixed, never hidden on main pages)
```

Order: **title → live account/game state → one next action → progress → supporting/editorial**. Nothing critical hides behind decorative graphics.

- Dashboard `PageHeader` backgrounds stay quiet: no grid, glow or animated backdrop behind headings. Side space is reserved only when a leading control or utility action exists; simple headers use the full available width at 320px.
- Document typography defaults belong in `@layer base` so `truncate`, `nowrap` and line-clamp utilities remain effective. Quick-tile counters use a reserved row beside the icon, never over its bounds.
- Profile identity uses one avatar/name group and one level/XP progress block. Rating belongs in the statistics group; do not repeat the same level or rating as extra hero badges. `Avatar` falls back to initials when an image fails to load.
- Play and Profile share `GameHistoryList`: the row opens the review, and sharing is a separate labelled action. Results include a written outcome as well as colour.

### 4.2 Grid & width

- `.app-page`: max **960px**, gutters 16 (mobile) / 24 (tablet) / 32 (desktop). `.app-page--focused`: **720px** for forms, reading, sheets-as-pages.
- ≥1024px: persistent **232px sidebar**, same route names/active state as the mobile nav. Content is centred in `.app-page`.
- Columns: **1** at <360, **2** for stat/quick tiles ≥360, **3** for stat rows ≥ 480 when labels fit, **12-col implicit** on desktop via `grid-cols-2 lg:grid-cols-12` split recipes — **never leave a half-empty column**: a two-column desktop layout must either balance (right column carries real content) or collapse to one `.app-page--focused` column. Tiles stretch (`min-w-0`, `1fr`); they do not hug the inline-start edge.
- Cards in one row share a height (`items-stretch`, `h-full` children).

### 4.3 Vertical rhythm

`gap-section` (24) between sections · `gap-card` (16) between cards and inside cards between groups · `gap-stack` (12) between title and content · `gap-inline` (8) between label and value. Use `space-y-*`/`gap-*` on the **parent**; do not stack `mt-*` on siblings.

### 4.4 Card anatomy

`[leading icon-tile | avatar]  [title-3 · caption]  [trailing value | chevron | badge]`. Leading element is fixed-size (`flex-none`); the text column is `min-w-0`; the trailing element never wraps below the title unless the row is explicitly stacked at 320px.

### 4.5 Hierarchy checklist (every screen)

1. Exactly one `<h1>` (`PageHeader`) and ≤1 hero.
2. Exactly one primary action in the first viewport.
3. ≤3 type sizes and ≤2 accent colours in one viewport section.
4. Secondary actions are `ghost`/`outline`; destructive actions are separate and confirm.
5. Numbers (money, rating, XP) use `numeric-*`; their labels use `eyebrow`/`caption`.

### 4.6 Thumb zone

Primary and frequent controls are reachable in the lower 60% of the screen. Destructive actions (resign, withdraw) are never adjacent to the primary action; they sit apart with ≥ `gap-section` or behind a confirm sheet.

### 4.7 Telegram & platform

- Fixed bottom elements use `var(--app-safe-bottom)`; fixed top use `var(--app-safe-top)`. It is a `max()` of Telegram content/safe insets and `env(safe-area-inset-bottom)` — **never a `var()` fallback chain** (Telegram defines the content inset as `0px` in iOS fullscreen and short-circuits the chain). **⚙ enforced** (`hardcoded-bottom-inset`).
- `viewport-fit=cover` is mandatory (`[locale]/layout.tsx`).
- The bottom navbar is **never** conditionally hidden on main dashboard pages. **⚙ enforced** (`navbar-hide-has-selector`). Overlays cover it with z ≥ 100.
- Mobile Settings keeps Profile highlighted as its parent destination (`aria-current="location"`); the desktop sidebar highlights Settings as the current page. The parent link remains actionable.
- Hide an HTML back link only when an authenticated Telegram host provides the native back button. The SDK's presence in an ordinary browser is not enough; retain visible browser navigation there.
- HTML is served `no-cache, must-revalidate`; hashed `/_next/static/*` is `immutable`.
- `DocumentStartup` renders critical script queues only in initial HTML/hydration. Use stable IDs and Next `Script` with `beforeInteractive`: Telegram SDK first, then theme/motion bootstrap. Loaded scripts stay in the document; client language navigation must not create script tags again.

### 4.8 RTL

Use logical properties (`ms-*`, `ps-*`, `start-*`, `text-start`, `inset-inline-*`). Directional icons (chevrons, arrows) flip via `rtl:` rules; **the chessboard never mirrors**. Numerals stay tabular. Verify every new layout in `ar`.

---

## 5. Component catalog

| Component | Sizes / variants | Notes |
| --- | --- | --- |
| `Button` | `sm 44 · md 48 · lg 56` · `primary · secondary · action · destructive · outline · ghost` | One `primary`/`action` per view. Busy state keeps width. Haptic on press |
| `Input` | height 48, 16px text | Label above, helper/error below, error uses `aria-describedby` |
| `Switch` | 44 hit area | `role=switch`, optimistic with rollback |
| `Tabs` / `SegmentedControl` | segment ≥44 | Sliding indicator; `selection` haptic; keyboard arrows |
| `Badge` / `BadgeRow` | 26 tall, 12/18 type, 8 radius | See §5.1 |
| `Card` | `solid · glass · premium · cyber · x-panel` | Prefer recipes (`ui-hero-card`, `ui-list-row`) for new work; no `backdrop-blur` in lists |
| `Modal` / `Drawer` | radius `sheet 28`, max-height respects safe areas | Focus trap, ESC, scroll lock, focus return |
| `PageHeader` / `SectionHeader` | title-1 / title-2 | One per page / per section |
| `EmptyState` / `ErrorState` | icon tile + title-3 + body + one action | Error text sanitized, retry available |
| `Skeleton` family | see §6 | Geometry-matched |
| `Toast` | z 140 | Non-blocking, never the only record of a money event |
| `Avatar` | `xs…2xl` | Online dot anchored; level/tier text in a reserved row below |
| `ProgressRing` / `Progress` | track 6/8/12 | Always has `role=progressbar`, name and value |

### 5.1 Badge rules

- Default: 12/18 sans, weight 600, normal case/tracking, min height 26, padding 3/8, radius 8, one quiet border; icon 14 with 6 gap. Labels wrap; never shrink text or icons.
- Text meets 4.5:1 on its real surface in **all three themes** (light neutral ink `#475569`, amber `#92400E`).
- Variants: `secondary` neutral · `primary/outline` emphasis · `emerald` verified success · `rose` error/loss · `amber` warning · `purple` premium · `cyan` info.
- Badges are passive. Interactive filters are `Tabs`/`SegmentedControl`/`Button` with a 44px target.
- Text badges never cover avatars, artwork, the board, prices or actions; at 320px they wrap below the title (`min-w-0` on the title container).
- Add a badge only when it explains real category, eligibility, progress, result or state.

---

## 6. Loading, empty, error — the six-state pattern

Every data-driven surface designs: **loading · empty · error · disabled · success · reduced-motion**.

### 6.1 Skeleton architecture

`components/ui/Skeleton.tsx` — skeletons are **sized from the same tokens as the real content** so nothing shifts.

| Piece | Use |
| --- | --- |
| `Skeleton textRole="body\|caption\|title-2\|numeric-lg…"` | A text line sized from the role's line-height (not an arbitrary `h-4`) |
| `Skeleton variant="circular\|rectangular"` + `width/height` | Avatars, tiles, bars (use `--size-*`) |
| `StatTileSkeleton` | Mirrors `.ui-stat` (use `metaLines` to match the real tile) |
| `BreakdownSkeleton` | Mirrors the profile W-D-L card |
| `SkeletonList` | N `ui-list-row`-shaped rows |

Rules
- **A skeleton reserves the loaded geometry.** If the loaded block has an optional row, reserve its min-height while loading (`min-h-[var(--size-control-sm)]`).
- Use the real container classes with skeleton children rather than a parallel layout.
- Skeletons are `aria-hidden`; the region sets `aria-busy`.
- Preserve stale successful content during refresh; do not flash a skeleton over data you already have.
- Shared task consumers use one SWR cache entry (`useTasks`), including optimistic claims and rollback. Swap initial skeletons directly for loaded content; do not fade out a skeleton before mounting its replacement.
- The route shell must render independently of the TON SDK. `WalletDialogs` loads wallet providers inside closeable dialogs, with a matching loading surface. Opening Top Up or completing a deposit never starts matchmaking automatically; the user must press the match action.
- Transaction history is a ledger, not a reconstructed balance series: the API omits some balance-affecting entries and is paginated. A balance chart requires complete, ordered snapshots from the backend.
- Lessons and game reviews keep their real page heading during loading/error states. Lesson completion reports confirmed progress; the completion endpoint returns total XP and cannot support a guessed reward amount.
- Do not use `content-visibility:auto` on above-the-fold regions (causes blank-block artifacts in full-page screenshots and paint pop-in).
- **⚙ enforced:** `e2e/layout-shift.spec.ts` asserts CLS < **0.08** loading→loaded on home, profile, wallet, challenges, marketplace.

### 6.2 Empty & error

Empty: icon tile, one-line reason, **one** action that resolves it. Error: plain-language message (never a stack/ID), `Retry`. Zero is a real number — never show an empty state for a successful `0`.

---

## 7. Patterns

- **Overlays**: a sheet for choices and confirmations on mobile (`Drawer`), a centred `Modal` for blocking decisions. Only one overlay layer at a time except `nested` (z 110) dialogs inside gameplay. Focus enters on open and returns to the trigger.
- **Money flows**: amount, fee, destination and status are always visible before confirm; reuse the exact numbers from the API; the confirm button repeats the amount. Wager UI states “You can lose your stake”, 18+, and is never shown to youth content.
- **Progression/gamification**: reward chips use `ui-icon-tile--gold/success`; streaks and tasks come from verified events; claim is optimistic with rollback; celebration respects reduced motion.
  Earned promotional boxes show eligibility, exact odds, duplicate handling and virtual-only terms before enrollment. Progress comes from server-recorded qualifying games; reveal only a confirmed reward. The First Three quest is once per account, has no deadline, and opens free AI practice directly. Pausing new enrollment must preserve existing claim rights; channel ads require the live campaign contract to match their copy.
- **Game screen**: board + clocks dominate; controls sit beneath/beside, never over the board; clock ticks are isolated in `ChessClockBadge` (4Hz) so the board never re-renders; `BoardA11y` names pieces for assistive tech.
- **Lists**: `ui-list-row`, 8-12px gap, virtualise beyond ~60 rows, no per-row blur.
- **Settings**: preferences come first; Account and Help share a balanced secondary column on desktop and stack on mobile. Use quiet card headings and consistent 64px-minimum rows with in-flow copy, switches and directional chevrons. Language belongs with preferences; FAQs open in a shared Drawer; account refresh and admin tools use progressive disclosure. Keep local preferences persisted, connect the sound switch to game audio, localize request feedback, and prevent overlapping saves. Do not duplicate Academy/Marketplace navigation or promote a membership hero above basic settings.
- **Leaderboard previews**: show the labeled simulation directly in the Home leaderboard during local development on a loopback hostname. Reserve its space with the shared skeleton until the browser supplies its hostname; do not flash the API ladder or fetch it in preview mode. Production renders API standings only. Keep one compact, persistent Demo label identifying generated profiles and GRAM/XP figures; do not repeat long notices, day counters or playback controls. GRAM/XP examples never merge into verified standings or create account balances, XP grants, wallet events or transactions. Update every 30 minutes (48 steps per day), using stable profile keys for restrained position transitions. Pause updates when hidden, offscreen or reduced motion is enabled.
  GRAM uses the official locally served diamond mark, preserving its colors. Prefix illustrative profit totals with `+`; show daily example gains separately. Starting values may grow beyond their initial range. Progression is cumulative without a yearly reset; varied daily budgets drive ranking changes. Numeric count-ups and a single short opacity/scale response may accompany updates; no perpetual glow, invented win notifications or implied live account activity.
  Home shows ten preview profiles and a Show Top 50 button opening the shared Drawer with all fifty. Reuse the same row and metric anatomy; local portraits use their own asset IDs, and other profiles use shared initials avatars. Do not reuse a portrait for multiple identities, request nonexistent photos, or merge generated GRAM figures into real standings. The backend's current ELO and XP units cannot stand in for verified GRAM balances or earnings.

---

## 8. Content & i18n

- All interface copy lives in `frontend/src/messages/*.json` (10 locales), including accessible names, loading states and status badges. Shared primitives use the `Common` namespace; feature components own their translator instead of receiving an untyped translation function through props. Proper names and authored API lesson content retain their supplied language unless the content API supplies a translation.
- Add keys to **all** locales. `npm run check:messages` validates recursive key parity, duplicate keys, ICU syntax and arguments, and function-scoped translation calls. Its regression fixtures format review move counts in every locale. Keep dynamic key families explicit and covered by tests.
- Sentence case. Verbs for actions (“Start game”, “Withdraw”). No jargon, no fabricated claims, no income promises.
- Budget for 40% longer strings (de/ru) and for 320px; no fixed-width labels.
- Numbers/dates/currency via `Intl` for the active locale; money keeps tabular numerals.
- Telegram bot/HTML messages: HTML-escape every user-controlled string before `parse_mode="HTML"`.

---

## 9. Accessibility & performance budgets

Puzzle positions must be validated before board rendering. Completion UI shows verified totals or explicit server-provided rewards, never a guessed XP/ELO grant. Public login and referral QR pages reserve intrinsic image geometry, fit within 320px, and include both application safe-area insets. Login fallback copy reports unavailability without claiming a browser blocker was detected.

| Area | Requirement |
| --- | --- |
| Contrast | Text 4.5:1 (3:1 for ≥24px or bold ≥19px), UI/graphics 3:1 — in dark **and** light **and** nebula |
| Touch | ≥44×44, ≥8px between adjacent targets |
| Focus | Visible ring on every interactive element; order follows reading order |
| Names | Every control, image, progress and rank tile has an accessible name/role |
| Zoom | Reflows at 320px and 200% zoom; browser zoom never disabled |
| Motion | `prefers-reduced-motion` + in-app setting honoured |
| Layout shift | CLS ≤ 0.08 on tracked routes (**⚙ enforced**) |
| Interaction | Optimistic UI ≤ 100ms; no main-thread task > 50ms from animation code |
| Bundle | No remote font host; images sized (`width/height`); heavy boards/dialogs `dynamic()`-imported |
| Runtime audit | Playwright + axe-core on 16 routes × dark/light, 320/390/1280, en/ar/ru/de/ja: 0 serious/critical violations |

---

## 10. Governance

**Source of truth order:** `tokens.json` (scale) → `themes.css` (colour) → this guide → `design-system/MASTER.md` (implementation cookbook) → page notes in `design-system/pages/`.

**Change process**
1. Need a value that doesn't exist? Add a token (`tokens.json` + `npm run tokens`, or `themes.css` for colour) — don't inline it.
2. Need a new pattern? Check §3/§5 first; propose a recipe, implement in `layout.css` (`@layer components` for overridable geometry), add the skeleton twin, document it here.
3. Update this guide and `MASTER.md` in the **same change**.

**Automated checks** (run in CI):

| Command | What it guards |
| --- | --- |
| `npm run tokens -- --check` | `tokens.css` matches `tokens.json` |
| `npm run check:design` | Ratchet on raw palette classes, raw hex, sub-12px text, opacity text, arbitrary tracking, hard-coded bottom inset, navbar `:has()` hides, unnamed icon buttons, uppercase-eyebrow. Baseline in `scripts/design-rules-baseline.json`; counts may only go down |
| `npm run check:messages` | 10-locale key parity |
| `npm run test:ci` | Unit tests incl. UI primitives |
| `npx playwright test e2e/ui-system.spec.ts e2e/layout-shift.spec.ts` | Every route renders; CLS budget |
| `bash scripts/check-static-export-fresh.sh` | `backend/static_frontend` rebuilt (`npm run build:static`) |

**Review checklist (PR):** one h1 · one hero · one primary action · skeleton twin · all six states · 320px · light + dark · `ar` · reduced motion · no raw colour/size · copy in all locales · docs updated.

**Primary references:** [Apple HIG — Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/), [Telegram Mini Apps](https://core.telegram.org/bots/webapps).


Native GRAM wallet values keep two concepts separate: available USDT principal has an informational GRAM estimate from cached TonAPI native-coin and USDT rates; earned GRAM uses the exact, once-per-source server ledger in nano units. Never credit an estimate, fabricate a fallback price, label balances as profit, or add sample profiles to production rankings. Quotes expire after 15 minutes and update independently of balances. GRAM reward credits currently have no withdrawal path; the wallet explains this. Real GRAM rankings are opt-in, default off, and expose aggregate estimated value only. Subscription prizes require live Telegram membership proof. Referral GRAM requires a confirmed USDT deposit and three completed human wager games after attribution, with the configured minimum move count. Credit notifications are delivered after commit through a leased outbox; unknown delivery is never blindly retried. The shared GramAmount uses the official local mark, localized exact amounts, bidi isolation and one brief transform/opacity pulse for a confirmed increase, respecting reduced motion.

### Quick Match and action sheets

Quick Match offers paid stakes only ($1, $3, $5, $10, $25); the Popular badge sits in flow on $10. Use the shared Drawer with its optional `footer`: the header and safe-area action stay visible while only the body scrolls. The portal covers the dashboard navbar at overlay level 100; do not hide that navbar. `useDialog` locks both document and body scrolling, restores their previous inline styles after the final dialog closes, and focuses without moving the page. Drawer motion also honors the OS and in-app reduced-motion preferences.

A paid Quick Match joins the real server queue once per explicit action. Never create an AI game with a generated human identity or add artificial matchmaking delays. Closing a pending join requests cancellation after the server acknowledges its stake reservation; closing a confirmed search waits for cancellation acknowledgement. A confirmed match opens immediately. Top Up opens a separate sheet and refreshes the balance without starting a paid search. Unknown balances cannot be used to enter a queue. Payout copy includes the stake and states the 95% pot share; it is not net profit.
