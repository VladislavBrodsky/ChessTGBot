# ChessTGBot Master Design System

**Canonical Identity:** Obsidian Chess  
**Platform:** Telegram Mini App (Next.js 16 + Tailwind 4)  
**Governance Hierarchy:** `MASTER.md` is the global source of truth. Page-specific rules in `design-system/pages/[page].md` extend or customize this specification without violating core invariants.

---

## 1. Core Visual Tokens & Semantic Roles

| Role | Semantic CSS Variable / Utility | Intended Meaning & Usage |
|---|---|---|
| **Void / Canvas** | `--bg-primary`, `bg-brand-void` (`#000000`) | Background surface; deep contrast floor (X "Lights Out"). |
| **Surface** | `--bg-surface`, `bg-brand-surface` (`#0A0A0A`) | Standard cards, lists, grouped items. |
| **Elevated Surface** | `--bg-elevated`, `bg-brand-elevated` (`#111111`) | Selected states, controls, sheets, active tabs. |
| **Borders** | `--border-muted`, `border-brand-border` (`#1F1F1F`) | Subtle separation; 1px quiet outline. |
| **Primary Text** | `--text-primary`, `text-brand-primary` (`#FFFFFF`) | High-emphasis headers, active labels, values. |
| **Muted Text** | `--text-muted`, `text-brand-muted` (`#9A9FA8`) | Supporting labels, timestamps, metadata. |
| **Emerald (Accent)** | `text-emerald-400`, `bg-emerald-500` | Primary actions (Play, Deposit), active states, wins. |
| **Purple (Premium)** | `text-purple-400`, `bg-purple-500` | VIP, Marketplace mystery boxes, premium tiers. |
| **Silver (Progression)**| `--accent-silver`, silver gradient | XP ranks, secured/locked items, neutral podium (2nd). |
| **Amber / Gold** | `--text-gold`, `amber-500` | Alarms, warnings, time-critical countdowns only. |
| **Rose (Danger)** | `rose-500`, `text-rose-400` | Resign match, destructive confirm, errors. |

---

## 2. Telegram Mini App & Layout Invariants

**Global structure:** Five labelled mobile navigation destinations (Home, Play, Academy, Wallet, Profile) become a `232px` sidebar on desktop. Secondary routes live in contextual cards and Profile. The page shell uses `.app-page` with `960px` maximum width and `16/24/32px` logical gutters; focused flows use `720px`. Each screen has a `PageHeader`, a clear primary action, grouped sections, and real state from the API. See `BRAND_DESIGN_SYSTEM.md` for composition, type scale, and reference-image audit.

**Typography:** Use the local platform sans and monospace stacks defined in `globals.css`. Remote font fetches are not part of the Mini App build or first paint.

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

## 5. UI Primitives Catalog (`frontend/src/components/ui/`)

All new pages and feature refactors MUST reuse existing design system primitives:

| Component | Path | Description & Props |
|---|---|---|
| **Avatar** | `Avatar.tsx` | Fallback initials, online indicator dot, rating badges (`size: xs/sm/md/lg/xl`). |
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
