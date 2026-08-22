# ChessTGBot Brand & UI System Guide

**Status:** Authoritative frontend guide  
**Default identity:** Obsidian Chess (X 2026 Lights Out & Minimalist High-Craft)  
**Last reviewed:** 2026-08-21  
**Applies to:** Every frontend page, modal, sheet, drawer, card, navigation item, state, animation, and visual asset.  

This is the source of truth for ChessTGBot's product presentation. It is deliberately practical: use it when designing, reviewing, or implementing UI—not as a mood board after the work is done.

The app should feel like a premium chess arena: calm under pressure, competitive without being noisy, and precise without becoming cold. It is **chess-first**, not generic cyber, casino, or Web3 UI.

---

## How to use this guide

Before adding or changing visual UI:

1. **Primitives First**: Start with existing semantic tokens and shared primitives (`frontend/src/components/ui/`).
2. **Component Recipes**: Choose the component recipe in this guide before inventing a new pattern.
3. **6-State Pattern**: Design every state: loading (geometry-matched Skeleton), empty (EmptyState), error (ErrorState), disabled, success, and reduced motion.
4. **Platform Checks**: Verify the result on a narrow Telegram mobile viewport, desktop viewport, dark/light/Nebula themes, and RTL when the layout is directional.
5. **Continuous Documentation**: Update this guide and `design-system/MASTER.md` in the same change when a token, primitive, navigation convention, overlay convention, or theme behavior changes.

---

## 1. Brand Foundation

### 1.1 Product Character

| We are | We are not |
| --- | --- |
| Premium, competitive, composed, and exact | Loud, cluttered, or attention-hungry by default |
| A modern chess arena with progression | A generic trading dashboard or crypto landing page |
| Cinematic in focused moments | Permanently animated or covered in heavy effects |
| Editorial, minimal, and confident (X 2026) | Decorative at the expense of hierarchy |
| Tactile, haptic-rich, and game-aware | Skeuomorphic, toy-like, or casino-like |

Chess cues should be restrained and meaningful. Use rank, board, piece, opening, tactic, clock, and progression motifs to clarify a feature. Do not wallpaper screens with chess pieces or turn ordinary controls into novelty ornaments.

### 1.2 Theme Policy

**Obsidian Chess is the canonical default experience.** Its visual language is black/obsidian surfaces (`#000000` / `#0A0A0A`), disciplined white typography, and vibrant Web3 accents (Emerald, Purple, Blue) for achievement and progression.

Theme variants may change token values, but they must not change structural, accessibility, interaction, or safe-area rules.

| Theme | Intended role | Accent rule |
| --- | --- | --- |
| **Default dark / Obsidian Chess** | Primary production identity | Web3 vibrant colors (Emerald `#10B981` / Purple `#A855F7`) for achievement/action/premium, silver for progression |
| **Light** | Accessibility and environmental preference | Preserve the same semantic roles and hierarchy; do not invert meanings |
| **Nebula (`data-theme='nebula'`**) | Optional expressive theme | Deep neon cyber treatments |

### 1.3 Core Semantic Tokens

Use semantic CSS tokens from [`frontend/src/app/globals.css`](frontend/src/app/globals.css). Components must not add raw hex colors, arbitrary rgba values, or one-off gradients.

| Role | Token / Utility | Description |
| --- | --- | --- |
| **Void / Canvas** | `--bg-primary`, `bg-brand-void` (`#000000`) | Pitch black background; maximum contrast floor. |
| **Surface** | `--bg-surface`, `bg-brand-surface` (`#0A0A0A`) | Standard cards, lists, grouped items. |
| **Elevated Surface** | `--bg-elevated`, `bg-brand-elevated` (`#111111`) | Selected states, controls, sheets, active tabs. |
| **Quiet Border** | `--border-muted`, `border-brand-border` (`#1F1F1F`) | 1px clean separator. |
| **Primary Text** | `--text-primary`, `text-brand-primary` (`#FFFFFF`) | High-emphasis headers, active labels, values. |
| **Muted Text** | `--text-muted`, `text-brand-muted` (`#71767B`) | Supporting labels, timestamps, metadata. |
| **Emerald (Accent)** | `text-emerald-400`, `bg-emerald-500` | Primary actions (Play, Deposit), active states, wins. |
| **Purple (Premium)** | `text-purple-400`, `bg-purple-500` | VIP, Marketplace mystery boxes, premium tiers. |
| **Silver (Progression)**| `--accent-silver`, silver gradient | XP ranks, secured/locked items, neutral podium (2nd). |
| **Amber / Gold** | `--text-gold`, `amber-500` | Alarms, warnings, time-critical countdowns only. |
| **Rose (Danger)** | `rose-500`, `text-rose-400` | Resign match, destructive confirm, errors. |

---

## 2. Layout, Navigation, and Overlays

### 2.1 Telegram Mini App Safe Areas
- Fixed bottom UI **must** use `var(--app-safe-bottom)` (which is `max(--tg-content-safe-area-inset-bottom, env(safe-area-inset-bottom))`).
- Fixed top bars **must** use `var(--app-safe-top)`.
- Never use hardcoded bottom padding like `bottom-0 pb-4` for fixed bars.
- `viewportFit: "cover"` is mandatory in `layout.tsx` so iOS exposes non-zero safe area insets.

### 2.2 Bottom Navigation Invariants
- Bottom navigation is **never** conditionally hidden on main dashboard pages (`shouldHideNavbar` in `frontend/src/components/LayoutWrapper.tsx`).
- Full-screen overlays cover it with `z-index >= 100` via `NavbarContext` (`useNavbarHideWhileMounted` / `pushHide`).

### 2.3 Approved Z-Index Scale

| Layer | z-index | Examples |
| --- | ---: | --- |
| **Base content** | `0`–`10` | Page sections, Bento cards, local decorations |
| **Sticky controls** | `20` | In-content sticky controls, sub-headers |
| **Floating Actions (FAB)**| `40` | `QuickPlayFAB` |
| **App navigation** | `50` | Bottom navigation bar, persistent app chrome |
| **Standard overlay** | `100` | `Modal`, `Drawer`, bottom sheets |
| **Gameplay overlay** | `110` | Nested game dialogs |
| **System-critical alert**| `120` | Blocking global crash/error alerts |
| **Floating Toasts** | `140` | `ToastProvider` non-blocking pill notifications |

---

## 3. Shared UI Primitives Catalog (`frontend/src/components/ui/`)

All frontend work MUST prioritize the shared primitives layer:

```text
frontend/src/components/ui/
├── Avatar.tsx          # User profile avatar with fallback initials & online indicator
├── Badge.tsx           # Compact semantic status tags (primary, secondary, emerald, gold, purple)
├── Button.tsx          # Tactile buttons (primary, secondary, action, destructive, outline, ghost)
├── Card.tsx            # Surface cards (glass, solid, premium, cyber, x-panel)
├── Drawer.tsx          # Swipe-to-dismiss bottom sheet with handle and safe-area padding
├── EmptyState.tsx      # Contextual empty state with icon, heading, and action CTA
├── ErrorState.tsx      # Sanitized error panel with retry action
├── Input.tsx           # Accessible form text inputs with labels, errors, and icons
├── Modal.tsx           # Centered dialog with backdrop lock and keyboard ESC dismiss
├── NoiseGradient.tsx   # Subtle atmospheric background noise texture
├── QuickPlayFAB.tsx    # Floating 1-tap quick play action pill docked above navbar
├── SegmentedControl.tsx# Sliding pill tab toggle with spring physics and haptics
├── Skeleton.tsx        # Geometry-matched shimmers (text, circular, rectangular, SkeletonList)
├── Switch.tsx          # WAI-ARIA accessible toggle switch with spring thumb and haptics
├── Tabs.tsx            # Accessible tab list with sliding indicator and badge counters
└── Toast.tsx           # Global floating non-blocking pill toasts (via ToastContext)
```

---

## 4. Full-Stack Performance & Interaction Rules

1. **Backdrop-Blur Overdraw Prohibition**: Never apply `backdrop-blur-*` inside repeating list items, scrolling containers, or frequent timer ticks. Use hardware-accelerated solid tokens (`bg-brand-surface border border-brand-border`).
2. **Clock Isolation**: 4Hz chess clock timer ticks must remain isolated inside dedicated leaf badges (`ChessClockBadge.tsx`) to avoid re-rendering parent boards or page shells.
3. **Zero-Latency Optimistic Updates**: Quests claims, settings toggles, and theme equip actions must reflect state in 0ms locally with automatic rollback on network failure.
4. **Haptic Feedback Integration**: All interactive selections, tab switches, and confirmations trigger `telegramHaptic` ('selection' / 'light' / 'medium' / 'success' / 'error').
5. **Static Export Synchronization**: After any frontend modifications, rebuild and verify the static export before committing:
   ```bash
   cd frontend && npm run build:static
   bash scripts/check-static-export-fresh.sh
   ```
