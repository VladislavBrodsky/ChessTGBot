# ChessTGBot Master Design System

**Canonical Identity:** Obsidian Chess  
**Platform:** Telegram Mini App (Next.js 16 + Tailwind 4)  
**Governance Hierarchy:** `MASTER.md` is the global source of truth. Page-specific rules in `design-system/pages/[page].md` extend or customize this specification without violating core invariants.

---

## 1. Tokens & architecture

The full rulebook (foundations, semantics, composition, governance) is [`BRAND_DESIGN_SYSTEM.md`](../BRAND_DESIGN_SYSTEM.md). This file is the **implementation cookbook**: how to apply it in code.

```text
design-system/app/tokens.json  --npm run tokens-->  frontend/src/styles/tokens.css (GENERATED, never hand-edit)
frontend/src/styles/{theme,tokens,themes,base,components,overlays,features,motion-perf,rtl,layout}.css  <- imported in that order by app/globals.css
```

| Need | Use | Never |
|---|---|---|
| Colour | `bg-brand-void/surface/elevated`, `text-brand-primary/muted`, `border-brand-border`, `var(--action-bg)`, `--grad-action`, `--grad-premium`, `--text-gold`, `--danger-ink` | raw hex, `slate-*`/`zinc-*`, `text-*/60` opacity text |
| Type | role classes `t-display`, `t-title-1/2/3`, `t-body-lg`, `t-body`, `t-label`, `t-caption`, `t-eyebrow`, `t-numeric-xl/lg/''/sm` | `text-[11px]`, ad-hoc `tracking-[…]`, forced `uppercase` |
| Space | `gap-inline 8`, `gap-stack 12`, `gap-card 16`, `gap-section 24`, `gap-page 32`; `--pad-sm/md/lg/xl` | stacked `mt-*` on siblings, same gap for inside vs between |
| Size | `--size-control-sm 44`, `-md 48`, `-lg 56`, `--size-icon-*`, `--size-avatar-*`, `--size-tile-*`, `--size-row-min 64`, `--size-stat-min 96` | arbitrary `h-[37px]` |
| Radius | `--radius-chip 8 / control 12 / tile 12 / row 16 / card 20 / hero 24 / sheet 28` | inner radius >= outer radius |
| Z | `--z-nav 50 / overlay 100 / nested 110 / critical 120 / toast 140` | `z-[9999]` |
| Motion | `--duration-fast 160ms`, `--ease-emphasized`, transform/opacity only | animating width/height/top, infinite loops |

Tailwind 4 only reads `@theme` (see `styles/theme.css`); `tailwind.config.js` no longer exists. Declare new utilities there.

**Colour values** (dark default / light): canvas `#000000`/`#F3F6FA`, surface `#0A0A0A`/`#FFFFFF`, elevated `#121620`/`#EEF2F7`, border `#1F1F1F`, text `#F5F7FA`/`#0F172A`, muted `#9AA3B2`/`#556275`, action `#34D399`/`#10B981`, gold `#F5C451`/`#B8860B`, danger `#FB7185`/`#BE123C`. Full table in the brand guide.

---

## 2. Telegram Mini App & Layout Invariants

**Global structure:** Five labelled mobile navigation destinations (Home, Play, Academy, Wallet, Profile) become a `232px` sidebar on desktop. Secondary routes live in contextual cards and Profile. The page shell uses `.app-page` with `960px` maximum width and `16/24/32px` logical gutters; focused flows use `720px`. Each screen has a `PageHeader`, a clear primary action, grouped sections, and real state from the API. See `BRAND_DESIGN_SYSTEM.md` for composition, type scale, and reference-image audit.

**Typography:** Use the local platform sans and monospace stacks defined in `styles/theme.css`. Remote font fetches are not part of the Mini App build or first paint.

**Entry points:** `/[locale]/login` and shareable `/[locale]/qr` are public. The QR page uses the same Mini App surfaces and typography, accepts only a bounded referral code, and links to the configured official bot. Other application routes remain behind `AuthGuard`.

**Game reviews:** Profile history links to the static `/[locale]/game/review?gameId=…` route so an individual review survives a refresh in the committed monolith export. Keep game identifiers in the query string for newly created links; the older dynamic route remains for existing links on the standalone Next.js service.

### Route hierarchy

| Route | First-screen purpose | Primary next action | Data that must be verified |
| --- | --- | --- | --- |
| Home | Account summary and orientation | Play chess | Rating, balance, daily goals, leaderboard |
| Play lobby | Select match parameters | Start match or AI practice | Balance, wager, arena schedule |
| Active game | Board, clocks, opponent, move controls | Make a move | Server game state and clock |
| Academy | Course and puzzle progression | Continue learning | Unlocks, completions, rewards |
| Challenges | Tasks and claimable rewards | Claim or complete task | Progress and claim state |
| Wallet | Balance and transaction history | Deposit or withdraw | Balance, address, fees, ledger |
| Profile | Identity, results, referrals | Review progress or invite | Stats, game results, referral earnings |
| Marketplace | Available items and owned state | Inspect or purchase | XP balance, price, inventory |
| Settings | App preferences and account controls | Change a preference | Persisted setting state |
| Membership | Benefits and purchase choices | Review an upgrade | Current tier and exact checkout terms |
| Login / QR | Authenticate or accept an invite | Continue in Telegram | Official bot identity and referral code |

Keep the primary action within the first viewport, secondary routes reachable without guessing, and transactional confirmations explicit. A loading or failed request must not be presented as a value of zero. Refreshing data should preserve the last confirmed value until a new response succeeds.

Home may include `EngagementQuest` as a secondary Card below the main Play action. Its server-recorded progress, pre-enrollment odds/rules Modal, optimistic rollback and confirmed reward reveal use shared primitives. The quest’s play action opens `/[locale]/game?practice=1` to select free AI difficulty directly. A disabled campaign stays hidden; existing enrolled players keep their claim rights when enrollment pauses.

Free friend challenges remain actionable when the balance service is loading or unavailable. Use the shared lobby action and localized free-invite copy; free rematches show one play-again action. Server-resolved `go_` launch tokens route only to known destinations after authentication. Expired invitations use `ErrorState` with retry and leave navigation available.

`InvitationProvider` owns friend launch previews and saved requests, and pauses first-run dialogs while an invitation is active. Use the shared Modal with real player name/rating, free/stake disclosure, clock, explicit request/accept/join actions and useful recovery. Pending requests remain in the Home inbox after closing the dialog; status refresh preserves the last confirmed state and offers a connection retry. Passive notifications only open on Home when no other dialog is visible. Do not force a game transition from a passive notification. Shared Main Mini App links strip `@`, omit assumed `/app` paths, and pass the intent through `startapp`; the bot fallback explains the extra tap.

Admin → Marketing uses `PlayerTrackingPanel`: shared Cards, Input, SegmentedControl and Buttons for measured player counts, mature retention denominators, acquisition sources and community-link creation. Unknown coverage is an em dash with explanatory text; zero is shown only after measurement begins. Retain the last confirmed response if refresh fails and display a status message. Do not reintroduce sample reach, funnel percentages or fabricated social proof.

For balance-funded play, upgrades, and deposits, disable the action or offer a retry while the balance or account identity is unverified. A deposit memo must use the account ID returned by the authenticated API; never manufacture a fallback ID or display a transfer destination before that identity is available.

1. **Safe Area Insets**:
   - Fixed bottom UI **must** use `var(--app-safe-bottom)` (the maximum of Telegram content, Telegram safe, and CSS environment bottom insets).
   - Fixed top bars **must** use `var(--app-safe-top)`.
   - Never use hardcoded bottom padding like `bottom-0 pb-4` for fixed bars.
2. **Touch Targets**:
   - Every interactive element (buttons, tabs, list toggles) **must** maintain a minimum `44px × 44px` hit area on mobile (`min-h-[44px]`).
   - Text fields are at least `48px` tall with `16px` input text. Browser zoom remains enabled. Icon buttons must have an accessible name; selected, focus, pressed, loading, disabled, and error states must be apparent beyond color.
3. **Z-Index Layering Scale**:
   - `0–10`: Base page content and cards
   - `20`: Sticky sub-headers and filters
   - `50`: Persistent bottom Navbar
   - `100`: Standard Overlays (Modals, Drawers, Sheets)
   - `110`: Nested gameplay dialogs
   - `120`: Critical system error alerts
   - `140`: Floating Non-Blocking Toasts (`ToastProvider`)

---

## 3. Anti-Pattern Rules (Zero Tolerance)

1. **No Unlabeled Icon Buttons**: All `<button>` or `<Link>` elements containing only an icon must include an explicit `aria-label`.
2. **No Emojis as Functional Icons**: Use vector icons (`react-icons/fa`, `react-icons/fi`, etc.) for all system navigation and actions.
3. **No Heavy Backdrop-Blur on Scrollable Lists**: Do not apply `backdrop-blur-md` or `backdrop-blur-[20px]` to repeating list rows or scrolling cards. Use hardware-accelerated solid/semi-translucent colors (`bg-brand-surface border border-brand-border`).
4. **No Raw Backend Errors**: Never output raw exception traces to users. Always route errors through sanitized user-friendly copy and provide a "Try Again" recovery CTA.
5. **No Full-Screen Spinners on Background Refresh**: Retain current content during background SWR revalidation; reserve full skeletons only for initial data fetching.
6. **No Infinite GPU Blurs**: Prohibit continuous 80px CSS blur animations on idle screens.
7. **No Invented Data**: Do not populate empty cards with fake tasks, stats, balances, activity, participant counts, or prize claims. Treat unavailable data separately from zero.
   The planned 100 GRAM Vault is a separate preview card with a passive status badge and rules modal. It has no join/open control, countdown, generated counter, confetti, or simulated prize. State clearly that the current free box cannot award GRAM and that boxes 1–800 would have no jackpot chance under the proposed rules. Live states must come from the server contract in `marketing/GRAM_VAULT_SEASON_SPEC.md`.
8. **Stable Route Shell**: Load TON providers only inside lazy wallet dialogs (`WalletDialogs`), with a closeable skeleton. Do not remount authenticated pages when navigating. Deposits refresh the balance; they never automatically enter a match.
   `DocumentStartup` emits stable Next `Script` queues with `beforeInteractive` for initial HTML/hydration only: load Telegram SDK before the preference bootstrap, preserve theme/motion before hydration, and leave loaded scripts intact on client locale navigation.
9. **Quiet Dashboard Headers**: `PageHeader` has no decorative grid or glow. Reserve side control space only when controls exist. Profile shows level/XP once and rating in its statistics group.
10. **Visible Browser Back Links**: Hide HTML back links only inside a Telegram host with nonempty init data and a native back button; SDK presence alone does not prove a native control exists.

---

## 4. Mandatory 6-State Pattern

Every async screen and data-backed component must implement:
1. **Initial Loading**: Geometry-matched `Skeleton` components (zero layout shifts).
2. **Background Refreshing**: Quiet, non-blocking indicator while keeping content interactive.
3. **Empty State**: Contextual `EmptyState` explaining why content is missing + primary CTA.
4. **Error State**: Sanitized `ErrorState` with retry button.
5. **Disabled State**: Visual opacity + reason tooltip or explanatory subtext.
6. **Success / Action State**: Immediate visual confirmation + `telegramHaptic` tactile response.

---

## 4.1 Composition recipes (`frontend/src/styles/layout.css`)

Pages compose recipes; they do not hand-roll cards.

```tsx
<main className="app-page">                       {/* 960px, gutters 16/24/32; add app-page--focused for 720px forms */}
  <PageHeader title={t('title')} description={t('purpose')} />   {/* the only h1 */}

  <section className="ui-hero-card p-5 md:p-6">   {/* ONE hero per page */}
    <p className="ui-eyebrow">{t('rating')}</p>
    <p className="t-numeric-xl tabular-nums">{rating}</p>
  </section>

  <SectionHeader title={t('stats')} />
  <div className="grid grid-cols-2 gap-3">          {/* 2 cols >= 360; items min-w-0 and stretch */}
    {stats ? <div className="ui-stat ui-stat--accent">
        <span className="ui-stat__label">{t('wins')}</span>
        <span className="ui-stat__value">{stats.wins}</span>
        <span className="ui-stat__meta">{t('this_week')}</span>
      </div>
    : <StatTileSkeleton metaLines={1} />}            {/* geometry twin: same classes, same line heights */}
  </div>

  <ul className="space-y-2">
    <li className="ui-list-row ui-list-row--interactive">
      <span className="ui-icon-tile ui-icon-tile--gold size-[var(--size-tile-md)]">{icon}</span>
      <div className="min-w-0 flex-1"><p className="t-title-3 truncate">{title}</p><p className="t-caption text-brand-muted">{meta}</p></div>
    </li>
  </ul>
</main>
```

Recipe -> skeleton twin: `ui-stat` -> `StatTileSkeleton`; `ui-list-row` -> `SkeletonList`; profile W-D-L card -> `BreakdownSkeleton`; text -> `<Skeleton textRole="body|caption|title-2|numeric-lg" />`. Rules for skeletons: reserve the loaded geometry (including optional rows, via `min-h-[var(--size-control-sm)]`), keep stale data during refresh, `aria-hidden` + `aria-busy` on the region.

Task lists share `useTasks` for deduplicated requests, optimistic claims and rollback. Play/Profile history uses `GameHistoryList` with real review links and separate labelled share controls. Avatars recover from broken images with initials. Transaction history displays dated, ordered ledger entries; it must not infer a balance chart from incomplete transactions.

Typography defaults use `@layer base` so truncation and wrapping utilities work. QuickTile counters occupy a reserved row beside the icon. Lessons/reviews retain page headings during loading/errors, and lesson success never guesses an XP award from total XP.

Puzzle detail validates the returned position before mounting a board, uses the cached request and matching skeleton, and displays only server-confirmed account totals after completion. Login and referral QR frames use responsive intrinsic images and shared cards with the same top/bottom safe-area rules; an unavailable login widget offers a retry without guessing the cause.

The default dark foundation uses `#000000` canvas, `#0A0A0A` surfaces and 1px `#1F1F1F` borders. `TelegramInit` is the single owner of host colour updates: it checks API capabilities, deduplicates unchanged colours and uses the legacy header keyword on hosts before 6.9. `ThemeContext` owns only browser theme tokens.

Desktop (>= 1024px): a two-column split must balance; if the second column has nothing real to show, stay in one `.app-page--focused` column. Never leave tiles hugging the inline-start edge of a half-empty row.

Settings uses Preferences, Account and Help cards. Its responsive two-column layout keeps all everyday preferences visible; mobile stacks them before account links. `settings-row` reserves icon/copy/control space and a 64px minimum; descriptions wrap, chevrons mirror in RTL, and the shared Switch labels remain clickable. Language uses the same row anatomy. FAQs live in a shared Drawer with native disclosures; account tools expand on demand. Sound is a shared persisted preference read by game audio, and server-backed changes disable repeated saves and roll back on failure.
Mobile Settings highlights Profile as its parent with `aria-current="location"`, while the desktop sidebar marks Settings as the current page. Both links retain their normal navigation behavior.

**Quality gates:** `npm run check:design` (ratchet), `npm run tokens -- --check`, `e2e/layout-shift.spec.ts` (CLS < 0.08), `e2e/ui-system.spec.ts` (every route renders). Details in the brand guide section 10.

## 5. UI Primitives Catalog (`frontend/src/components/ui/`)

Shared primitives resolve their default accessible names and loading/error copy from `Common` in the active next-intl provider. Pass translated custom labels when a feature needs a more specific name. Never use a raw message key as visible UI, and allow translated control labels to wrap at 320px.

All new pages and feature refactors MUST reuse existing design system primitives:

| Component | Path | Description & Props |
|---|---|---|
| **Avatar** | `Avatar.tsx` | Fallback initials, online indicator dot, rating badges (`size: xs/sm/md/lg/xl`). |
| **Badge / BadgeRow** | `Badge.tsx` | In-flow semantic metadata; 26px default / 20px inline counters, wrapping labels and fixed icons. |
| **Button** | `Button.tsx` | Primary, secondary, action, destructive, outline, ghost variants with haptics and loading states. |
| **Card** | `Card.tsx` | `glass`, `solid`, `premium`, `cyber`, `x-panel` surface cards. |
| **Drawer** | `Drawer.tsx` | Mobile swipe-to-dismiss bottom sheet with header, handle, and safe area padding. |
| **EmptyState** | `EmptyState.tsx` | Centered empty state with icon, title, description, and action CTA. |
| **ErrorState** | `ErrorState.tsx` | Error banner/card with error icon, title, message, and `onRetry` action. |
| **Input** | `Input.tsx` | Accessible form text input with `label`, `error`, `helperText`, `leftIcon`, `rightIcon`. |
| **PageHeader** | `PageHeader.tsx` | PageHeader, SectionHeader, PageUtilities, ActionLink for consistent screen hierarchy. |
| **Modal** | `Modal.tsx` | Accessible dialog modal with ESC key dismiss and backdrop lock. |
| **SegmentedControl**| `SegmentedControl.tsx`| Sliding pill toggle selector with tactile haptics. |
| **Skeleton** | `Skeleton.tsx` | `text`, `circular`, `rectangular` shimmers and `SkeletonList`. |
| **Switch** | `Switch.tsx` | WAI-ARIA accessible toggle switch with spring thumb and Telegram haptic feedback. |
| **Tabs** | `Tabs.tsx` | WAI-ARIA tab list with sliding indicator badge and badges. |
| **Toast** | `Toast.tsx` | Global floating non-blocking pill toasts (`useToast().success/error/info`). |

Keyboard patterns in shared controls use roving selection for Tabs/SegmentedControl and dialog focus management in Modal/Drawer. Respect reduced motion and Telegram haptics on state changes. Check `320px` reflow, desktop, light theme, and Arabic RTL before shipping a visual change.

Home displays the disclosed `LeaderboardPreview` on every host, including production. Its portraits, GRAM/XP example figures and Top 50 render directly, without a hostname gate or a leaderboard API dependency. One sticky, compact Demo label identifies generated profiles and figures. Live standings are a separate, explicit view: fetch real API data only when opened, retain default-off account balance privacy, and never mix generated financial figures into that ranking. Keep the preview mounted when switching views so its selected ladder and progression persist; hidden/offscreen/foreground checks stop its 30-minute timer. All copy is localized and motion respects reduced-motion preferences.
GRAM readouts use the official local vector mark and shared CountUp. Keep the running total and daily example gain in separate lines; gain feedback is a single short opacity/scale transition, disabled with reduced motion. Initial GRAM ranges describe starting values, not a ceiling on cumulative progression. All gain captions are localized; the disclosure stays visible while scrolling.
Home shows ten of fifty preview profiles; Show Top 50 opens the shared Drawer with all ranks and the same GRAM/XP tab state. Scroll the list within 50dvh so tabs and dismissal remain reachable. Keep one compact attribution visible inside the Drawer, preserve focus return and safe areas, and use shared initials avatars when no original portrait exists. Preview rows never fetch nonexistent assets or mix generated financial figures with production ELO/XP data. A real GRAM ladder requires its own verified backend metric.

## Badge composition rules

Use `frontend/src/components/ui/Badge.tsx` and `BadgeRow` for passive metadata across pages, cards, lists and controls. Themes change semantic colors, not placement or geometry.

- Default badge: 12px/18px platform sans, weight 600, normal case/tracking, minimum 26px height, 3px/8px padding, 8px radius and one quiet border. Optional icon: fixed 14px, 6px icon/label gap. Labels wrap at the available width; never shrink text or icons to force a fit. Counter size: minimum 20px, 1px/6px padding, used only inside a control that retains its 44px hit target.
- Badge text must meet 4.5:1 contrast on its actual surface in dark, light and Nebula themes. Light neutral ink uses `#475569`; amber uses `#92400E`. Do not inherit pale gold or reduced-opacity text for a status.
- Variants: secondary for neutral metadata; primary/outline for emphasis; emerald for verified success; rose for errors/loss; amber for warnings; purple for premium; cyan for informational status. Use theme-safe ink colors. Do not fade claimed/completed status to illegibility or add glow/pulse to ordinary metadata.
- Keep text badges in flow. Rows use `BadgeRow` or wrapping flex with an 8px gap; headings have a separate row or at least 8px separation beside a badge. At 320px or with long translated labels, wrap below the title or other metadata instead of overlaying it. Set title containers to `min-w-0`.
- Text badges must not cover avatars, artwork, the board, prices or actions. Avatar online dots can stay anchored to the image; level/tier text appears in a reserved row below it. Avatar image bounds stay separate from text metadata.
- Badges are not buttons: interactive filters stay in Tabs/SegmentedControl/Button with haptics, keyboard selection and a 44px target. Counters use the shared counter badge rather than independent padding/position rules. Badge icons are decorative when their label supplies the meaning.
- Add metadata only when it explains real category, eligibility, progress, result or state; ordinary section labels stay plain. Preserve complete financial/age qualifications. The marketing website uses its own palette and `website/src/components/ui/Badge.tsx`; never import website tokens into the Mini App.


Native GRAM wallet values keep two concepts separate: available USDT principal has an informational GRAM estimate from cached TonAPI native-coin and USDT rates; earned GRAM uses the exact, once-per-source server ledger in nano units. Never credit an estimate, fabricate a fallback price, label balances as profit, or add sample profiles to verified account rankings. Quotes expire after 15 minutes and update independently of balances. GRAM reward credits currently have no withdrawal path; the wallet explains this. Real GRAM rankings are opt-in, default off, and expose aggregate estimated value only. Subscription prizes require live Telegram membership proof. Referral GRAM requires a confirmed USDT deposit and three completed human wager games after attribution, with the configured minimum move count. Credit notifications are delivered after commit through a leased outbox; unknown delivery is never blindly retried. The shared GramAmount uses the official local mark, localized exact amounts, bidi isolation and one brief transform/opacity pulse for a confirmed increase, respecting reduced motion.

Quick Match uses the shared Drawer `footer` slot for a fixed action below an independently scrolling body. Keep the header reachable, honor `--app-safe-bottom`, and cover the bottom navbar with the body portal. The shared dialog hook owns stack-aware root/body scroll locks and returns focus without scrolling. Drawer entrances and exits become immediate with reduced motion. Wager badges stay in flow on $10; no Free stake appears here. Paid starts use acknowledged server matchmaking, cancellation releases the reserved stake, and deposit verification never starts a paid search automatically. Do not substitute a generated identity for an AI opponent or introduce fake search delays.

## Shared header and overlay anatomy

Dashboard `PageHeader` uses logical start alignment, with one h1 and a purpose beneath it; the icon, back link and utilities stay in normal flow. Login and QR entry screens explicitly opt into `align="center"`. Play uses one `LobbyHero` for its balance and two live activity metrics. Academy uses one progression hero; challenge and tactics cards are supporting surfaces.

`Modal` and `Drawer` share `DialogHeader`: a named h2, optional purpose and a 44px close control. Header and optional `footer` never scroll; only `.ui-dialog-body` owns vertical scrolling. Avoid additional height-capped scrolling lists inside it. Both portal to the body, clamp to the safe viewport and use the same `useDialog` stack for focus, Escape, background scroll locks and focus restoration. `Drawer.maxHeight` accepts a CSS length (default `85dvh`), not a utility class. Use `layer={110}` for a nested rematch or checkout and `120` for system/reward notices. Pending transactions may keep dismissal inactive until the response resolves.

Skeletons reuse loaded geometry and typography roles; missing values remain unknown. Finished-game money arrives in cents and is converted once for USDT readouts. Draws/aborts show a returned stake; wins show the confirmed credited payout, including stake, with no guessed ELO or payout. Custom-stake previews mirror the backend’s separately rounded 3% and 2% fee allocation.

Full-screen onboarding is the walkthrough exception: body portal, the same dialog stack, pinned steps/actions and a scrollable middle stage. Critical game failures use `Modal role="alertdialog"` with one reload action.

Loading quest cards reserve their header, progress area and action before account
stats arrive. Skeleton children must use valid HTML containers; never place a
block placeholder inside a paragraph. Wallet loading labels keep the final action
label and control geometry, with disabled/busy state carrying request status.

SnapPicker recenters on an actual size change, using the latest selection. Keep
its ResizeObserver mounted during swipes so an intermediate selection cannot
interrupt scrolling.
