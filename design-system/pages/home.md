# Home & Dashboard Page Specification

**Route:** `/[locale]/home`  
**Pattern:** Profile summary + primary Play action + verified progress + quick destinations
**Primary Action:** Enter Arena / Quick Play (`/game`)

---

## Layout & Hierarchy

1. **PageHeader and profile:** Greeting, rating, wins, and games use authenticated account data. Notification and settings utilities remain discoverable.
2. **Primary action:** One high-contrast Play destination leads to the game lobby. Secondary Academy, Challenges, and Marketplace links follow; Profile and Wallet stay in primary navigation.
3. **Daily goals and leaderboard:** Render actual tasks and standings only. A missing feed becomes a clear empty/loading/error state, never a fabricated task or podium.
4. **Editorial content:** Show dated, verifiable updates only when a live content source exists. Static claims and relative timestamps must not appear as current news.

---

## 6-State Handling

- **Loading**: Render `HomeSkeleton` (Profile bone, Hero card bone, Leaderboard 3-row skeleton).
- **Error**: Show inline retry card for stats fetch failures; never wipe already cached balance.
- **Empty**: For unranked users, show "Play your first game to enter Season 1 Leaderboard".
