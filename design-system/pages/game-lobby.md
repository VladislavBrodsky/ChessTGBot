# Game Lobby Specification

**Route:** `/[locale]/game` (Lobby mode)  
**Pattern:** Clear match setup + real arena state + matchmaking state machine
**Primary Action:** Find Opponent / Play AI

---

## Layout & Hierarchy

1. **Wager & Stakes Dial**:
   - Scrollable wager carousel ($0, $1, $5, $10, $25, $50, Custom).
   - Centered alignment with smooth scroll snapping and light haptic feedback on active change.
2. **Time Control Selector**:
   - Blitz (3m), Rapid (5m, 10m), Classical (15m).
   - High contrast selected indicator using `border-emerald-500/50 bg-emerald-500/10`.
3. **Action Area**:
   - Large Primary Button: "Find Match" or "Play vs AI".
   - AI opens a difficulty drawer, then creates a real computer game. Keep practice distinguishable from rated or wagered play.
   - Rake info drawer trigger (`RakeInfoDrawer` using `Drawer` primitive).
4. **Matchmaking Overlay**:
   - Smooth animated radar scanner during matchmaking.
   - Cancel button and notification toggle.
   - Do not show estimated active-player counts or other unsupported demand signals. Invalid arena dates show the loading/empty treatment, never a NaN countdown.
