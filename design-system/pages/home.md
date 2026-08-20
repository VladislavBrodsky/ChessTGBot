# Home & Dashboard Page Specification

**Route:** `/[locale]/home`  
**Pattern:** Hero Overview + Competitive Podium + Quick Navigation  
**Primary Action:** Enter Arena / Quick Play (`/game`)

---

## Layout & Hierarchy

1. **Header & Profile Bar**:
   - Greeting ("Welcome back, [Name]") with fallback to "Combatant".
   - Quick actions: Notifications (bell), Settings (gear).
   - Rating and Level Pills (using `XPProgressBar`).
2. **Hero Feature Card**:
   - High-contrast Arena Quick-Play card (`variant="solid"` with subtle accent border).
   - Primary Emerald CTA button with 44px min-touch target.
3. **Podium Leaderboard Section**:
   - Top 3 podium styling: 1st (Gold/Emerald highlight), 2nd (Silver highlight), 3rd (Bronze highlight).
   - Tab switch between "Season" and "All-Time" using `SegmentedControl`.
   - Skeleton rows (`Skeleton`) rendered during data fetching.
4. **Recent News & Community**:
   - Compact editorial card with external link security (`rel="noopener noreferrer"`).

---

## 6-State Handling

- **Loading**: Render `HomeSkeleton` (Profile bone, Hero card bone, Leaderboard 3-row skeleton).
- **Error**: Show inline retry card for stats fetch failures; never wipe already cached balance.
- **Empty**: For unranked users, show "Play your first game to enter Season 1 Leaderboard".
