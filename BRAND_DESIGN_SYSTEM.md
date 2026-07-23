# ChessTGBot Brand & UI System Guide

**Status:** Authoritative frontend guide
**Default identity:** Obsidian Chess
**Last reviewed:** 2026-07-15
**Applies to:** Every frontend page, modal, sheet, drawer, card, navigation item, state, animation, and visual asset.

This is the source of truth for ChessTGBot's product presentation. It is deliberately practical: use it when designing, reviewing, or implementing UI—not as a mood board after the work is done.

The app should feel like a premium chess arena: calm under pressure, competitive without being noisy, and precise without becoming cold. It is **chess-first**, not generic cyber, casino, or Web3 UI.

## How to use this guide

Before adding or changing visual UI:

1. Start with existing semantic tokens and shared primitives.
2. Choose the component recipe in this guide before inventing a new pattern.
3. Design every state: loading, empty, error, disabled, success, and reduced motion.
4. Verify the result on a narrow Telegram viewport, a desktop viewport, dark/light/Nebula themes, and RTL when the layout is directional.
5. Update this guide in the same change when a token, shared primitive, navigation convention, overlay convention, or theme behavior changes.

When this guide and a one-off visual preference conflict, preserve accessibility, safe-area behavior, semantic tokens, and shared primitives first. Document intentional exceptions in the relevant pull request or handoff.

---

## 1. Brand foundation

### 1.1 Product character

| We are | We are not |
| --- | --- |
| Premium, competitive, composed, and exact | Loud, cluttered, or attention-hungry by default |
| A modern chess arena with progression | A generic trading dashboard or crypto landing page |
| Cinematic in focused moments | Permanently animated or covered in effects |
| Editorial and confident | Decorative at the expense of hierarchy |
| Tactile and game-aware | Skeuomorphic, toy-like, or casino-like |

Chess cues should be restrained and meaningful. Use rank, board, piece, opening, tactic, clock, and progression motifs to clarify a feature. Do not wallpaper screens with chess pieces or turn ordinary controls into novelty ornaments.

### 1.2 Theme policy

**Obsidian Chess is the canonical default experience.** Its visual language is black/obsidian surfaces, disciplined white typography, and vibrant Web3 accents (Emerald, Purple, Blue) for achievement and progression.

Theme variants may change token values, but they must not change structural, accessibility, interaction, or safe-area rules.

| Theme | Intended role | Accent rule |
| --- | --- | --- |
| Default dark / Obsidian Chess | Primary production identity | Web3 vibrant colors (Emerald/Purple) for achievement/action/premium, silver for progression |
| Light | Accessibility and environmental preference | Preserve the same semantic roles and hierarchy; do not invert meanings |
| Nebula (`data-theme='nebula'`) | Optional expressive theme | Deep neon cyber treatments |

### 1.3 Color and token rules

Use semantic CSS tokens from [`frontend/src/app/globals.css`](frontend/src/app/globals.css). Components must not add raw hex colors, arbitrary rgba values, or one-off gradients unless a documented token is being introduced in `globals.css` and this guide is updated with it. The established Tailwind `rose-500`, `emerald-500`, `amber-500`, and `cyan-500` status utility families are the narrow exception for contextual status treatments; use them only with their documented meaning.

Core existing tokens and their intended meanings:

| Role | Existing token / utility family | Use |
| --- | --- | --- |
| Void / page field | `--bg-primary`, `--color-brand-void`, `bg-brand-void` | Page backgrounds and deep negative space |
| Surface | `--bg-surface`, `--color-brand-surface`, `bg-brand-surface` | Standard cards, grouped content, navigation surfaces |
| Elevated surface | `--bg-elevated`, `--color-brand-elevated`, `bg-brand-elevated` | Selected states, controls, sheets, modest elevation |
| Bottom navigation | `--color-nav-surface`, `--color-nav-active`, `--color-nav-inactive`, `--color-nav-border`, `--shadow-nav` | Fixed primary navigation; preserves a clear, theme-appropriate boundary from page content and keeps inactive items readable against the navigation surface |
| Quiet border | `--border-muted`, `--color-brand-border`, `border-brand-border` | Separation, card edges, control outlines |
| Primary text | `--text-primary`, `--color-brand-primary`, `text-brand-primary` | Essential content and high-emphasis labels |
| Muted text | `--text-muted`, `--color-brand-muted`, `text-brand-muted` | Supporting copy; never the only carrier of critical information |
| Gold/Yellow | `--text-gold`, `--color-brand-gold`, `text-brand-gold` | **Warnings, alarms, and critical system messages only.** Do not use for achievements or primary actions. |
| Arena funding action | `--gradient-arena-action`, `--arena-action-foreground`, `--arena-action-shadow`, `--arena-panel-gradient`, `--arena-selection-gradient` | The single primary funding/play action in the Arena; use the documented gradient rather than a flat orange fill, while its surrounding setup controls remain quiet and token-based |
| Admin command center | `--admin-bg`, `--admin-surface`, `--admin-border`, `--admin-text`, `--admin-muted`, `--admin-accent-*` | Operational admin surfaces that intentionally stay dark across themes for contrast, chart legibility, and consistent scroll backgrounds |
| Silver | `--accent-silver`, silver text/border utilities where present | Progression, secured/locked systems, neutral premium elevation |
| Emerald | `emerald-500` plus `--color-emerald-opacity-10` / `--color-emerald-opacity-20` | Primary actions (Play, Top Up), positive confirmations, active states, success, confirmed. |
| Purple | `purple-500` plus `--color-purple-opacity-10` | Premium features, Memberships, Marketplace items, 'Play with Friend', digital goods. |
| Blue | `blue-500` plus `--color-blue-opacity-10` | Informational accents, secondary actions. |
| Amber | `amber-500` plus `--color-amber-opacity-10` | Attention, warning, limited time, pending action |
| Rose | `rose-500` plus `--color-rose-opacity-10` / `--color-rose-opacity-20` | Destructive action, failure, danger |
| Cyan | `cyan-500` plus `--color-cyan-opacity-10` | Informational or optional Nebula support |

Use color as an emphasis system, not as decoration:

- **Emerald** means an active primary choice, a reward, the most important action in a local context, or a currently healthy/live state.
- **Purple** means premium status, a marketplace item, or a special feature.
- **Silver** means progression, a protected/secured state, a secondary premium system, or a neutral ranked state.
- **Gold/Amber** means attention is needed, a warning, or an alarm; it is not a substitute for error, and must NEVER be used for positive achievements.
- **Rose** means a destructive or failed state and must be paired with clear copy.
- **White** carries the main hierarchy. A screen should remain intelligible in grayscale.

### 1.4 Typography

The application uses Outfit and Plus Jakarta Sans with an Inter fallback, plus Roboto Mono for compact data. Keep the existing font setup; do not introduce display fonts per feature.

| Role | Font and typical treatment | Use |
| --- | --- | --- |
| Display | Outfit, 700–800, tight but readable tracking | Hero title, rank/name moment, level number, high-value outcome |
| Title | Outfit or Plus Jakarta Sans, 600–700 | Page title, card heading, modal title |
| Body | Plus Jakarta Sans / Inter, 400–500 | Instructions, descriptions, explanatory content |
| Label | Outfit, 600–700, restrained uppercase tracking when useful | Small section labels, tabs, metadata keys, button labels |
| Numeric / data | Outfit 600–800; Roboto Mono only when alignment/scanning matters | ELO, XP, countdowns, amounts, tables |
| Mono data | Roboto Mono, 500–600 | IDs, hashes, technical values; avoid for normal copy |

Typography rules:

- Use sentence case for explanatory copy. Reserve uppercase, letter-spaced labels for short navigational or metadata labels.
- Do not use low-contrast microcopy to carry critical instructions, requirements, prices, or error information.
- Keep display headings short. Let the content, not tracking, provide the drama.
- Use tabular numbers or mono only where scanning and comparison benefit from it.
- Maintain logical heading order (`h1` → `h2` → `h3`). Styling a `div` to look like a heading is not a replacement.
- When a label wraps, preserve readable line-height and do not clip it to protect an artificial fixed height.

### 1.5 Shape, spacing, borders, and depth

Use a 4px base spacing rhythm. Prefer the existing Tailwind scale:

| Need | Typical values |
| --- | --- |
| Tight internal gap | `gap-1` / `gap-2` (4–8px) |
| Control / row gap | `gap-3` / `gap-4` (12–16px) |
| Card padding | `p-4` / `p-5` (16–20px); `p-6` only for roomy focal content |
| Section rhythm | `space-y-6` / `space-y-8` (24–32px) |
| Page rhythm | `py-5` to `py-8`, adjusted for safe areas and navigation |
| Compact radius | `rounded-lg` / `rounded-xl` |
| Standard card radius | `rounded-2xl` |
| Focal premium surface | `rounded-3xl` only when it is clearly a focal object |

Borders should be quiet: typically one muted 1px border, strengthened only for focus, an active selection, or ranked emphasis. Prefer tonal separation and disciplined spacing over multiple bright borders.

Use the existing shadows such as `--shadow-premium`, `--shadow-neon`, and `--shadow-inner-glow` sparingly. A glow is a focal cue, not a surface fill. One major glow or lighting treatment per screen is normally sufficient.

---

## 2. Layout and component recipes

### 2.1 Page shells and responsive layout

Build mobile-first. The Telegram Mini App is a first-class environment, not a reduced desktop page.

Required page-shell behavior:

- Use the app shell and `LayoutWrapper`; do not recreate safe-area and navbar behavior inside individual pages.
- Respect `viewport-fit=cover` and the shared `--app-safe-bottom` variable. It combines Telegram and iOS inset values correctly with `max()`.
- Keep one vertical document scroll chain. Page-level `html`, `body`, and the app shell may use `overflow-x: clip` to prevent horizontal bleed, but must not use `overflow-x: hidden` or suppress overscroll on intermediary containers; reserve vertical overscroll behavior for the document root.
- Never hard-code a bottom inset such as `bottom-0 pb-4` for a fixed element that can meet iOS or Telegram chrome. Fixed bottom elements must incorporate `var(--app-safe-bottom)`.
- Leave clearance for the fixed bottom navigation on dashboard pages. Do not hide the navbar conditionally to make room for an overlay; overlays sit above it.
- Use centered content widths appropriate to the content: a narrow mobile feed often starts with `max-w-sm`, standard content with `max-w-xl`, and broad desktop content with `max-w-3xl`. Do not stretch a dense card list across an ultra-wide desktop just because space is available.
- Desktop sidebars are supporting navigation, not a reason to duplicate primary controls in the body.
- The starfield is environmental background, not content. It must remain low contrast, static or near-static, and must never reduce text contrast.

Recommended structure:

```tsx
// Page content lives inside the existing application shell.
export function RankingPage() {
  return (
    <main className="mx-auto w-full max-w-xl space-y-6 px-4 pb-32 pt-6 sm:px-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-muted">Season 1</p>
        <h1 className="mt-2 text-3xl font-extrabold text-brand-primary">Global ranking</h1>
      </header>
      <Leaderboard />
    </main>
  );
}
```

Keep page headers concise:

- Optional eyebrow: context such as season, mode, or collection.
- One clear `h1`.
- Optional one-line supporting description or live-status treatment.
- Actions only when they change the next decision; do not add decorative metadata to fill empty space.

### 2.2 Shared primitives come first

Before creating a custom component, check these primitives:

- [`Card`](frontend/src/components/ui/Card.tsx)
- [`Button`](frontend/src/components/ui/Button.tsx)
- [`Badge`](frontend/src/components/ui/Badge.tsx)

They already carry shared sizing, focus, radius, and theme behavior. Extend a primitive when a repeated need emerges; do not copy its classes into multiple feature components.

### 2.3 Cards and “boxes”

Cards should feel like chess cases, boards, rank plates, or restrained vaults—not generic rounded rectangles stacked inside one another.

`Card` variants and when to use them:

| Variant | Use | Avoid |
| --- | --- | --- |
| `glass` | Lightweight grouping over an intentional background | Making every list row glass |
| `solid` | Dense information, forms, stable panel backgrounds | Adding a second visual border inside it |
| `premium` | One high-value focal object: reward, selected level, featured offer | Applying it to every card in a grid |
| `cyber` | Existing legacy/Nebula-specific treatment | New default Obsidian Chess work unless explicitly themed |

Card rules:

- A card needs one job: group content, make a selection, or spotlight a focal action.
- Avoid nested cards. Use a divider, a subtle background shift, or spacing for subgroups inside a parent card.
- Give the card a readable hierarchy: label/context → title/value → support → action or state.
- Do not put a chip, badge, heavy border, gradient, glow, image, and button all at the same visual weight.
- Use images within bounded aspect-ratio containers so loading does not shift the layout.

```tsx
<Card variant="solid" className="space-y-4 p-5">
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-muted">Arena rating</p>
      <h2 className="mt-1 text-xl font-bold text-brand-primary">Your next move</h2>
    </div>
    <Badge variant="amber">Season 1</Badge>
  </div>
  <p className="text-sm leading-6 text-brand-muted">Win a ranked game to begin your climb.</p>
  <Button variant="primary" className="w-full">Enter arena</Button>
</Card>
```

### 2.4 Buttons, badges, tabs, and segmented controls

Buttons represent an action; badges communicate compact status. Do not use badges as buttons or buttons as passive labels.

| Pattern | Rule |
| --- | --- |
| Primary button | One primary action per decision area where possible. Use `Button variant="primary"`. |
| Secondary button | Use `secondary`, `glass`, or `outline` for alternatives that are genuinely lower emphasis. |
| Destructive action | Use a destructive semantic treatment and confirmation when the action is hard to reverse. `Button` does not currently expose a destructive variant, so use its `outline` variant with the documented rose state class until a shared variant is added. Never make a destructive action look like a gold reward. |
| Loading button | Preserve its width, disable repeat submission, announce progress, and keep the label understandable. |
| Icon-only button | Give it an accessible name (`aria-label`), a visible or programmatic tooltip where needed, and a 44px default hit area. |
| Badge | Keep it short, non-wrapping where practical, and semantically tied to a clear label/value. |
| Tabs / segmented controls | Use when the content changes in place between peer views. Make the selected state obvious with more than color and preserve keyboard semantics. |

Do not create custom `<div onClick>` controls. Use a real `button`, `a`, input, or the shared primitive as appropriate.

### 2.5 Lists, stat rows, forms, and states

**List rows** should have a predictable scan path: identity/rank → primary label → supporting metadata → right-aligned outcome or trailing action. Keep row-height consistent within a list unless a deliberate featured row is present.

**Stat rows** should pair a short label with a high-legibility value. Do not use muted text for the value that answers the user’s question.

**Forms** should show label, control, help text when necessary, inline validation, and submit outcome. Placeholder text is not a label. Keep destructive or financial confirmations explicit.

**Empty states** must explain what is empty, why it may be empty, and the best next step. Use a restrained chess motif only when it aids recognition.

**Loading states** should reserve the final layout with skeletons for content that is expected soon. Do not block the entire page with a spinner for a background refresh.

**Error states** must identify the failed area, offer a recovery action when possible, and preserve any safely entered user data. Never surface raw backend exception text as UI copy.

```tsx
if (isLoading) return <LeaderboardSkeleton aria-label="Loading leaderboard" />;

if (error) {
  return (
    <Card variant="solid" role="alert" className="space-y-3 p-5">
      <h2 className="text-lg font-bold text-brand-primary">The leaderboard is unavailable</h2>
      <p className="text-sm text-brand-muted">Your position is safe. Try again in a moment.</p>
      <Button variant="secondary" onClick={refetch}>Try again</Button>
    </Card>
  );
}
```

### 2.6 Leaderboards and competitive hierarchy

Leaderboards are a chess podium, not a generic table.

- Establish rank, player, competitive signal, and ELO in the first viewport.
- Emerald or Purple is reserved for first place or the primary leader. Silver belongs to second/progression; bronze is contextual for third.
- Use a durable identity treatment (avatar, fallback initials, verified/online state if available) without allowing imagery to dominate the row.
- Make score alignment stable; use tabular numerals when it helps scanning.
- Explain ties, season, refresh cadence, and ranking rules in concise supporting UI, not dense permanent copy.
- On a partial list, say how many contenders are shown and provide an explicit “View all” action.
- Never use color alone to convey rank; retain the numeric rank and medal/piece treatment.

### 2.7 XP, levels, and progression

Progress must answer: **where am I, what is next, and what action moves me forward?**

- Make the current level/achievement the focal object.
- Use an emerald or purple fill for earned/active achievement progress and silver for neutral/secured progress. The unfilled track remains dark and quiet.
- Always pair the bar with textual values such as current XP, target XP, and percentage or remaining XP. Color cannot be the only progress signal.
- Use the shared `frontend/src/lib/xpProgress.ts` helper for every XP/level view. It mirrors the backend’s 350-XP level curve and handles the intentional high-watermark level after XP is spent; never recreate a level curve in a page or component.
- Reserve a bounded bar height and avoid animated shimmer loops. On value change, a short transform/opacity transition is enough.
- Use the same semantic treatment for locked rewards: silver/quiet for locked, emerald/purple for earned/selectable, emerald for claimed/success.

### 2.8 Marketplace, academy, and chess-specific content

**Marketplace:** one featured offer may be premium; the rest should be calm, comparable, and data-led. Show price, availability, item identity, and action without requiring a hover state. Do not treat every item as a “limited drop.”

**Academy:** prioritize lesson title, expected time, level, and completion status. Use clear reading hierarchy; rewards are supporting information, not the lesson’s title.

**Chess content:** use board coordinates, piece names, clocks, rank notation, and tactical patterns only when they explain the feature. A piece icon should be recognizable at small sizes and should not replace essential text.

### 2.9 Bottom navigation

Bottom navigation is a product anchor and must use a single semantic chess-piece language:

| Destination | Semantic icon |
| --- | --- |
| Home | King |
| Marketplace | Queen |
| Play (center action) | Knight |
| Academy / Learn | Pawn |
| Quests | Rook |

Rules:

- Use the existing vector icon system (currently `react-icons/fa`) consistently. Do not mix a chess piece with a generic gamepad, gem, graduation cap, trophy, or emoji in the same navigation system.
- Keep Play as the centered primary destination. It may use a compact emerald/purple focal treatment in the bar; the other destinations stay calm and comparable.
- The active destination uses the Obsidian Chess active treatment: clear contrast plus emerald/purple emphasis. Do not rely on color alone; preserve active surface/label distinction.
- Primary mobile destinations have a 44px default touch target, including safe-area clearance.
- Labels remain visible for primary destinations. Do not hide them only to fit decorative icons.
- The navigation stays available on dashboard pages. Full-screen overlays cover it with the approved overlay layer; they do not alter global navbar visibility through ad hoc CSS.

### 2.10 Modals, bottom sheets, drawers, alerts, and celebrations

Use an overlay only when it protects the current context. Use a new page for a deep, multi-step, linkable workflow.

| Pattern | Choose it for |
| --- | --- |
| Centered modal | Focused confirmation, small form, irreversible decision, compact detail |
| Bottom sheet | Mobile selection, quick action, compact contextual menu |
| Drawer | Contextual secondary detail that may remain open while scanning content |
| Alert | Time-sensitive system or transaction status requiring acknowledgement |
| Celebration | A meaningful win, promotion, or claim—not ordinary navigation success |

Overlay requirements:

- Render through a portal when the component can otherwise be clipped by a stacking context or scrolling parent.
- Use the shared `NavbarContext` (`pushHide` / `popHide`) for any overlay that intentionally covers the application navigation. Never use `:has()`, route-specific navbar hiding, or stale local state to hide it.
- Backdrop: use a quiet obsidian scrim with optional restrained blur. The backdrop separates context; it must not become a light show.
- Trap focus while a modal dialog is open, move focus to a meaningful element on open, restore focus to the trigger on close, support Escape where the platform permits it, and provide an explicit close control.
- Do not make a destructive/financial confirmation dismissible by accidental backdrop tap unless the user can safely resume without loss.
- On mobile sheets, provide enough bottom padding for `--app-safe-bottom`.

Approved z-index scale:

| Layer | z-index | Examples |
| --- | ---: | --- |
| Base content | `0`–`10` | Page sections, cards, local decorations |
| Sticky/local controls | `20` | In-content sticky controls |
| App navigation | `50` | Bottom navigation, persistent app chrome |
| Standard overlay | `100` | Modal, sheet, menu backdrop/content |
| Stacked gameplay overlay | `110` | Nested game/drawer flow when unavoidable |
| System-critical alert | `120` | Blocking global alert/confirmation |

Do not add values such as `z-[9999]` or `z-[99999]`. If the scale does not solve a real relationship, document and extend the scale before use.

```tsx
function ConfirmLeaveDialog({ open, onClose }: Props) {
  const { pushHide, popHide } = useNavbar();

  useEffect(() => {
    if (!open) return;
    pushHide();
    return () => popHide();
  }, [open, popHide, pushHide]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end bg-black/70 p-4 sm:items-center sm:justify-center" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-title"
        className="w-full max-w-md rounded-3xl border border-brand-border bg-brand-surface p-5 pb-[calc(1.25rem+var(--app-safe-bottom))] shadow-[var(--shadow-premium)] sm:pb-5"
      >
        <h2 id="leave-title" className="text-xl font-bold text-brand-primary">Leave this match?</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">The current game will be forfeited.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>Keep playing</Button>
          <Button variant="outline" className="border-rose-500/40 text-rose-500 hover:bg-rose-500/10">Leave match</Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
```

The example illustrates structure and safe-area intent. Production dialogs also need focus management and the appropriate destructive variant/confirmation behavior.

---

## 3. Interaction, accessibility, and performance

### 3.1 Interaction and motion

The product should feel responsive, not hyperactive.

| Motion tier | Duration | Use |
| --- | ---: | --- |
| Immediate feedback | 150ms | Press, hover, focus, toggle state |
| Standard transition | 200ms | Tab/segment selection, card state, compact expand/collapse |
| Context transition | 300ms | Modal/sheet entrance, page focal reveal, progress update |

Motion rules:

- Animate `transform` and `opacity` by default. Avoid layout-affecting animation (`height`, `top`, `left`, `width`) unless it is essential and measured.
- Use one decorative continuous motion source per screen at most, and only when it supports the focal moment.
- Do not use permanent pulsing, shimmering, floating, rotating, or confetti effects merely to make an idle screen feel active.
- Any celebration must have a short, finite duration and a reduced-motion fallback.
- Respect both the existing reduced-motion/lite-device support in `globals.css` and the user’s `prefers-reduced-motion` preference. Reduced-motion mode removes decorative motion rather than making the interface feel broken.
- Preserve instant feedback for controls even when decorative motion is reduced: focus, selected state, and status text still change.

Reference: [MDN: `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion).

### 3.2 Accessibility baseline

Every new UI must meet WCAG 2.2 AA expectations in supported themes.

- Maintain sufficient text, icon, control, focus, and state contrast. Test real muted text over the actual surface, not against a flat mockup.
- The formal WCAG target-size minimum is **24 × 24 CSS pixels**. ChessTGBot’s default for primary mobile controls is **44 × 44 CSS pixels**; use 44px for buttons, icon controls, tabs, and primary navigation unless a documented dense-data exception applies.
- Provide a clearly visible keyboard focus indicator. It must not be removed without an equally visible replacement.
- Use semantic HTML: headings, landmarks, `button`, `label`, lists, tables, dialogs, and links where their native behavior applies.
- Icon-only controls require an accessible name such as `aria-label`; informative icons need text or a suitable accessible description.
- Do not rely on placeholder text, color, sound, animation, or hover alone to convey meaning.
- Announce asynchronous status changes with an appropriate `role="status"`, `aria-live`, or `role="alert"` without repeatedly interrupting screen readers.
- Ensure dialogs have a name, modal semantics, focus management, Escape support where applicable, and an explicit close path.
- All user-facing copy is localized. Avoid string concatenation that breaks word order. Verify directional layouts in RTL; use logical properties and `start`/`end` alignment where possible.

Reference: [WCAG 2.2 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

### 3.3 Performance budget and implementation behavior

Premium UI must still be light. Every visual addition should be judged against startup, input responsiveness, memory, battery, and rendering stability in Telegram’s WebView.

Required practices:

- Prefer Server Components. Add `'use client'` only to the smallest interactive boundary that needs browser APIs, state, effects, animation, or event handlers.
- Fetch data at the page/feature boundary. Avoid duplicate client fetches for the same data and avoid serial request waterfalls.
- Cancel or ignore stale requests when an interactive view closes, changes selection, or unmounts.
- Keep the current screen stable while a destination is loading. Do not add a root-level route template animation or full-screen route fallback that fades/replaces every navigation; use local skeletons only for the content that is genuinely unavailable.
- Warm the always-visible primary navigation routes after the first paint, so route code is ready before the user taps. Do not prefetch an unbounded set of rarely used or privileged screens.
- Short-lived client read caches may make repeated visits immediate, but they must be scoped to the active authentication session, bypass money/live-game/admin data, and clear after a successful mutation. Never persist authenticated API responses in local storage for perceived speed.
- Background refreshes must not replace a usable screen with a global loading state. Preserve last-good content and use local pending indicators.
- Use `next/image` for local visual assets and bounded remote imagery when compatible with the image source. Supply dimensions or an aspect-ratio container to prevent layout shift.
- Lazy-load below-the-fold imagery and heavy/optional visual features. Do not lazy-load the primary action or content that must appear immediately.
- Keep illustrations, chest art, board art, and confetti assets bounded in dimension and file weight. Do not ship oversized source images into a small card.
- Avoid continuous filters, huge blur regions, box-shadow stacks, and animated gradients on scrolling lists; they are costly on mobile GPUs.
- Virtualize or paginate long lists when a large number of rows can be shown. Never render a “Top 50” plus all avatars/effects if only five rows are visible.
- Use stable keys, avoid recomputing expensive visual data on every render, and keep animation libraries scoped to focal elements.
- Use skeletons that match final geometry. They reduce layout movement and perceived latency.
- Test foreground and background states. Telegram WebViews can be resource-constrained after returning to the app.

### 3.4 Safe rendering and managed HTML

- Do not introduce `dangerouslySetInnerHTML` in new UI unless the content has been sanitized with an approved, explicit sanitization path.
- Treat API content, names, descriptions, Markdown/HTML, and remote metadata as untrusted until validated and escaped for their rendering context.
- Never render raw server errors, stack traces, or database messages in the UI.
- User-controlled strings in any HTML-capable rendering flow must be escaped/sanitized before display.

---

## 4. Implementation standards

### 4.1 Approved class and composition patterns

Prefer semantic tokens and reusable composition over a long string of raw visual values.

```tsx
// Page rhythm and readable width
<main className="mx-auto w-full max-w-xl space-y-6 px-4 pb-32 pt-6 sm:px-6" />

// Quiet default surface
<Card variant="solid" className="border-brand-border p-5" />

// High-emphasis action
<Button variant="primary" size="md" className="w-full sm:w-auto">Continue</Button>

// Destructive action until a shared destructive Button variant exists.
<Button variant="outline" className="border-rose-500/40 text-rose-500 hover:bg-rose-500/10">Delete saved line</Button>

// Contextual state, not an interactive control
<Badge variant="emerald">Live</Badge>

// Accessible icon control: use an actual button and retain a target area
<button type="button" aria-label="Close panel" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" />
```

When a class string repeatedly appears across features, move the pattern into a primitive or documented utility rather than copying it.

### 4.2 State patterns

Every async feature has these states:

| State | Required UI behavior |
| --- | --- |
| Initial loading | Reserve space with a skeleton or a concise centered loader for the focal view |
| Background refreshing | Keep current content visible; use a local status cue |
| Empty | Explain the absence and offer the next meaningful action |
| Error | Identify the failed area, preserve safe user context, and offer retry/recovery |
| Disabled | Explain why the action is unavailable; never make it look broken |
| Success | Confirm the outcome in clear text; use color/animation as secondary reinforcement |

Loading skeletons should not impersonate final text too precisely, flash aggressively, or animate indefinitely in reduced-motion mode.

### 4.3 Do / do not

| Do | Do not |
| --- | --- |
| Use `Card`, `Button`, and `Badge` before building a custom equivalent | Copy component styling into feature files |
| Use `--app-safe-bottom` for fixed bottom UI | Hard-code iOS/Telegram bottom padding values |
| Use the approved z-index scale | Add `z-[9999]` to “fix” a stacking bug |
| Use emerald or purple for a focused achievement or action | Paint every card, label, and border with neon |
| Use silver for progression/secured states | Treat silver as a faint, unreadable text color |
| Keep default UI obsidian/white/emerald/purple/silver | Use yellow or gold for anything other than warnings/errors |
| Use chess-piece navigation semantics | Substitute generic icons for primary chess destinations |
| Give icon controls labels and 44px targets | Use unlabeled 20px clickable SVGs |
| Build error/empty/loading states | Leave a blank panel while a request is pending |
| Use finite, transform/opacity motion | Add permanent pulse, shimmer, or blur animation |
| Use `next/image` and bounded media | Use unbounded image dimensions that shift a card |
| Sanitize managed content | Insert API/user HTML directly into the DOM |

### 4.4 Legacy reconciliation

The existing application contains cyber and purple visual treatments. They are not automatically defects, but their placement matters:

- Treat purple/cyan-heavy treatments as **Nebula-only** or legacy until a feature is deliberately designed for that theme.
- New default screens, cards, overlays, and navigation should use Obsidian Chess tokens and hierarchy.
- Do not perform broad cosmetic rewrites solely to remove legacy styling. Reconcile a component when it is touched for feature work, accessibility, or performance work, and keep the change scoped.
- When a legacy `cyber` treatment remains, ensure it still honors contrast, reduced motion, responsive layout, and safe-area rules.

---

## 5. Governance and acceptance

### 5.1 Pre-merge design checklist

Complete this checklist for every new or materially changed screen, overlay, card family, navigation item, or animation.

#### Brand and structure

- [ ] Uses existing semantic tokens; no new raw color values in a component.
- [ ] Uses `Card`, `Button`, and `Badge` where applicable before custom UI.
- [ ] Reads as Obsidian Chess in the default theme; purple remains Nebula-only.
- [ ] Has one clear primary action and a readable hierarchy.
- [ ] Avoids unnecessary nested cards, borders, glows, badges, and competing accents.
- [ ] Uses the documented chess-icon meaning when part of chess navigation or hierarchy.

#### Responsive and Telegram behavior

- [ ] Works at narrow mobile width and a wide desktop width without clipped labels or controls.
- [ ] Fixed bottom UI includes `var(--app-safe-bottom)` and clears the bottom navigation where needed.
- [ ] An overlay uses `NavbarContext` rather than CSS/route hacks to cover navigation.
- [ ] Uses the documented z-index scale; no ad hoc extreme z-index values.
- [ ] RTL layout has been checked when content order, icons, or alignment can be directional.

#### Accessibility and copy

- [ ] Text, icons, focus, disabled, and status states meet AA contrast expectations.
- [ ] Interactive targets meet 44px product default or have a documented dense-data exception; never below 24px minimum.
- [ ] Keyboard focus is visible and dialog focus behavior is correct.
- [ ] Semantic elements, accessible names, heading order, and live-status messaging are present.
- [ ] All user-facing strings are localized; no text is conveyed only through color, icon, hover, or animation.

#### States and motion

- [ ] Loading, empty, error, disabled, and success states are designed and tested.
- [ ] Motion uses 150/200/300ms tiers and transform/opacity where possible.
- [ ] Reduced-motion and lite-device behavior remains useful and non-distracting.
- [ ] Decorative infinite animation is absent or limited to one purposeful focal element.

#### Performance and safety

- [ ] Client component boundaries are minimal and page data fetching avoids duplicate/waterfall requests.
- [ ] Navigation keeps the current screen stable, uses local loading states, and does not add a global fade or full-screen route loader.
- [ ] Any client-side read cache is short-lived, session-scoped, excludes sensitive/live data, and is invalidated after mutations.
- [ ] Images are bounded, use `next/image` where appropriate, and do not cause layout shift.
- [ ] Heavy effects, long lists, and background refreshes have been considered on a mobile WebView.
- [ ] Stale/cancelled requests cannot overwrite current UI state.
- [ ] Managed HTML is sanitized; no unsafe HTML injection or raw backend errors are introduced.

### 5.2 Change governance

This guide must be updated in the same change whenever any of the following changes:

- a semantic color, type, spacing, elevation, or motion token;
- shared `Card`, `Button`, `Badge`, navigation, or overlay APIs;
- bottom navigation icon meaning or visibility behavior;
- Telegram safe-area or fixed-element convention;
- theme role or Nebula/default-theme behavior;
- accessibility, reduced-motion, or performance standard.

Reviewers should request a guide update when a repeated visual decision is made without documentation. The goal is to make the next implementation faster and more consistent—not to create documentation debt.

### 5.3 Current source map

These files are the current implementation references for this guide:

- [`frontend/src/app/globals.css`](frontend/src/app/globals.css) — theme tokens, global typography, safe-area variables, reduced-motion/lite effects, RTL support.
- [`frontend/src/components/ui/Card.tsx`](frontend/src/components/ui/Card.tsx) — card variants and shared card API.
- [`frontend/src/components/ui/Button.tsx`](frontend/src/components/ui/Button.tsx) — action variants, sizes, and shared interaction behavior.
- [`frontend/src/components/ui/Badge.tsx`](frontend/src/components/ui/Badge.tsx) — compact semantic status variants.
- [`frontend/src/context/NavbarContext.tsx`](frontend/src/context/NavbarContext.tsx) — navigation-covering overlay behavior.
- [`frontend/src/components/LayoutWrapper.tsx`](frontend/src/components/LayoutWrapper.tsx) — application shell and navigation layout conventions.

If this guide disagrees with implementation, do not silently copy the discrepancy. Decide whether the implementation is the intended source of truth, then update either the code or this guide in the same scoped change.
