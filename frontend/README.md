# ChessTGBot Frontend Architecture (Next.js 16 + Tailwind 4)

Production-grade Telegram Mini App client built with Next.js 16 (App Router), Tailwind 4, Framer Motion, and Next-Intl.

---

## 🏛️ Architecture & Directory Structure

```text
frontend/src/
├── app/
│   ├── [locale]/             # Next-intl localized App Router routes
│   │   ├── academy/          # Tactics, puzzles, curriculum & themes gallery
│   │   ├── challenges/       # Daily quests & milestone achievements
│   │   ├── game/             # Live matchmaking, active chessboard & review
│   │   ├── home/             # Main Bento dashboard & quick play action
│   │   ├── login/            # Authentication & Telegram init gate
│   │   ├── marketplace/      # Web3 theme marketplace & digital items
│   │   ├── membership/       # VIP / Premium membership tiers
│   │   ├── profile/          # User stats, Elo history chart & streak tracker
│   │   ├── settings/         # Tactile preferences, audio & theme switches
│   │   └── wallet/           # TON Connect, USDT deposit/withdraw flows
│   ├── globals.css           # Semantic CSS variables, safe-area tokens & resets
│   └── layout.tsx            # Global providers (Theme, Navbar, User, Toast)
├── components/
│   ├── ui/                   # Shared UI primitives layer (Design System)
│   │   ├── Avatar.tsx        # Profile avatar with fallback initials & online dot
│   │   ├── Badge.tsx         # Semantic compact status badges
│   │   ├── Button.tsx        # Tactile buttons with loading & haptics
│   │   ├── Card.tsx          # Surface cards (glass, solid, premium, x-panel)
│   │   ├── Drawer.tsx        # Swipe-to-dismiss bottom sheet with handle
│   │   ├── EmptyState.tsx    # Contextual empty state with action CTA
│   │   ├── ErrorState.tsx    # Sanitized error banner with retry
│   │   ├── Input.tsx         # Accessible text inputs with error & icons
│   │   ├── Modal.tsx         # Centered modal with backdrop blur & ESC dismiss
│   │   ├── QuickPlayFAB.tsx  # Floating 1-tap quick matchmaking action pill
│   │   ├── SegmentedControl.tsx # Sliding pill tab toggle with spring physics
│   │   ├── Skeleton.tsx      # Geometry-matched shimmers (text, rect, list)
│   │   ├── Switch.tsx        # WAI-ARIA accessible toggle switch with haptics
│   │   ├── Tabs.tsx          # Tab list with sliding indicator & badges
│   │   └── Toast.tsx         # Non-blocking floating pill toast alerts
│   ├── game/                 # Chessboard, clock badges, matchmaking drawers
│   ├── Wallet/               # Deposit, withdraw, & TON Connect modals
│   ├── Navbar.tsx            # Persistent 5-button bottom navigation
│   └── LayoutWrapper.tsx     # Viewport & safe-area container wrapper
├── context/
│   ├── NavbarContext.tsx     # Overlay navbar suppression context
│   ├── ReducedMotionContext.tsx # User animation preference context
│   ├── ThemeContext.tsx      # Obsidian / Light / Nebula theme context
│   ├── ToastContext.tsx      # Global floating toast alert context
│   └── UserContext.tsx       # Real-time balance, ELO & user stats context
├── hooks/                    # Custom React hooks (useAudio, useSWRFetch, useTelemetry)
├── lib/                      # Utilities (apiFetch, telegram, clipboard, xpProgress)
└── tests/                    # Jest + Testing Library unit test suite
```

---

## 🧪 Testing & Quality Assurance

Run the test suite locally:
```bash
cd frontend
npm test
```

### Static Export Build & Verification
To verify the build and synchronize `backend/static_frontend/`:
```bash
cd frontend && npm run build:static
bash ../scripts/check-static-export-fresh.sh
```

---

## 📐 Mobile Safe-Area Invariants

- **iOS Telegram WebApp Safe Bottom**: Always use `var(--app-safe-bottom)` on fixed/floating bottom controls.
- **Minimum Touch Targets**: All interactive elements maintain `44px × 44px` hit areas (`min-h-[44px]`).
- **Haptic Tactility**: Interactive taps trigger `telegramHaptic` ('selection', 'light', 'medium', 'success', 'error').
