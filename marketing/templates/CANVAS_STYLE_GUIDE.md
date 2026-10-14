# Web3Chess Social Canvas Style Guide & Golden Standards

This guide defines the visual and copywriting standards for all social media graphics, campaign banners, and announcement canvases produced for Web3Chess (`web3chess.online` & `@chesshub_chat`).

All canvas generators, rendering scripts, and marketing workflows must adhere strictly to these standards.

---

## 1. Context-Connected Icons

Every item in a list or proof card must have an icon that directly represents the context and meaning of the text. Never repeat a generic icon (like multiple clocks or checkmarks) across distinct concepts.

| Context | Recommended Phosphor Icon | Example Copy |
| :--- | :--- | :--- |
| **Speed / Time Controls** | `lightning` (⚡) | `1+0 Bullet & 3+2 Blitz`, `Fast Blitz (60s)` |
| **Crypto Gains / Wagers / Stakes** | `coins` (🪙) or `scales` (⚖️) | `Equal USDT stakes`, `Instant USDT payouts` |
| **Telegram Community / Social** | `telegram-logo` (✈️) | `Community @chesshub_chat`, `Telegram Arena` |
| **A.I. Training / Academy** | `graduation-cap` (🎓) or `strategy` (♟️) | `Learn opening principles`, `Master endgames` |
| **Security / Fair Play** | `shield-check` (🛡️) | `Anti-cheat engine`, `Transparent settlement` |
| **Tournaments / Leaderboard** | `trophy` (🏆) or `crown-simple` (👑) | `Daily leaderboard prizes`, `Seasonal cup` |

### Engine Implementation
In `marketing/templates/renderer.js`, proof rows support explicit icon arrays (`d.proofIcons = ['lightning', 'coins', 'telegram-logo']`) or automatic context mapping based on keywords (`bullet`, `blitz`, `usdt`, `stake`, `chat`, `@`).

---

## 2. Compact Single-Line Typography

Text rows must never break awkwardly onto an orphaned second line (e.g. single words like *"Blitz"*, *"stakes"*, or *"@chesshub_chat"* stranded alone).

- **List Items**: Width must be at least `390px` (or full width in wide format) with `size: 24px` and `maxLines: 1`. Each item must fit on a single horizontal line vertically centered with its 28px icon.
- **Subtitles (Deck / Body)**:
  - Max character length for single-line subtitles is **50–54 characters** (e.g., `60s blitz · Instant USDT payouts · The arena is live`).
  - If a 2-line subtitle is required, split explicitly with `\n` to maintain visual symmetry and balance.
- **Letter Spacing & Weight**: Use `font: 'body'` (Onest) at `weight: 600` for proof rows and `weight: 400–500` for body copy. Headlines use `font: 'display'` (Barlow Condensed Bold 700) with `leading: 0.88`.

---

## 3. Transparent Canvas Integration

- **No Opaque Card Boxes**: Do not wrap list items inside solid white (`#FFFFFF`) rounded rectangles on the light canvas.
- **Floating Elements**: Icons, text, and subtle 1px divider lines (`C.line` / `#D4D4D4`) float directly on the background surface (`#E5E5E5` / Warm Canvas).
- This creates an airy, editorial "Fog Board" aesthetic consistent with the brand guidelines.

---

## 4. Action Bar & Footer Hierarchy

The bottom interactive and regulatory zone uses a strict dual-element structure:

1. **Dual-Action Bar (`action-panel`)**:
   - Black background (`#0A0A0A`), 14px border radius.
   - Left side: Prominent call-to-action text in white (e.g., `Join the community`, `Enter the arena`).
   - Right side: Mint green accent pill (`#B4F4A4`, `action-pill`) with dark text displaying the destination URL and arrow (e.g., `web3chess.online ↗`).
2. **Single-Line Compliance Note (`note`)**:
   - Positioned beneath the action bar in muted slate (`#666666`).
   - Strictly reserved for regulatory and platform disclaimers: `USDT matches · 18+ where permitted · Telegram @chesshub_chat`.
   - Never duplicate `web3chess.online` in the note; it is already prominently featured in the action button above it.
   - Must fit on a single line with `maxLines: 1`.

---

## 5. Brand Identity & Lockup

- **Official Wordmark**: Use the official vector mark: text-only "**CHESS**" (Barlow Condensed Bold 700) with "**Play-to-Earn**" (Onest 400) beneath it (from `website/public/brand/w3chess-logo.svg`).
- **No Purple Rooks**: Do not use the deprecated purple chess piece icon or outdated multi-color lockups.
- **Aspect Ratio**: The mark maintains an exact width-to-height aspect ratio (~1.92).

---

## 6. Copywriting & FOMO Standards

- **Zero Terminal Periods**: Headings, subheads, tags, proof rows, button labels, and footer notes **MUST NEVER** end with a period (`.`).
- **Viral & FOMO Phrasing**:
  - Focus on **speed**, **real crypto gains**, and **live urgency**.
  - *Poor / Generic*: `Bullet, blitz, and USDT stakes. Join our community.`
  - *High-Converting / FOMO*: `60s blitz · Instant USDT payouts · The arena is live`
  - *Alternative*: `Fast blitz · Real USDT stakes · Win & cash out live`

---

## 7. Canonical Code Example

When defining a campaign object for `W3Renderer.scene(campaign, format)`:

```javascript
const speedChessCampaign = {
  id: 'tempo',
  number: '05',
  name: 'Speed Chess & USDT Stakes',
  purpose: 'Speed & Wagers',
  icon: 'lightning',
  theme: 'canvas',                         // Light warm-canvas background
  art: 'sculpture',                        // Official 3D porcelain knight sculpture
  tag: 'Speed & Stakes',                   // Mint pill badge
  headline: 'SPEED CHESS\nREAL USDT STAKES', // 2-line punchy Barlow headline (no periods)
  body: 'Fast 60s blitz · Equal stakes · Instant settlement', // Single-line subtitle
  cta: 'Enter the arena',                  // Action verb in CTA bar
  note: 'USDT matches · 18+ where permitted · Telegram @chesshub_chat', // Single-line disclaimer
  proof: [
    '1+0 Bullet & 3+2 Blitz',              // Item 1: Speed time controls
    'Equal USDT stakes',                   // Item 2: Crypto gains & wager
    'Instant on-chain payouts'             // Item 3: Direct wallet settlement
  ],
  proofIcons: [
    'lightning',                           // ⚡ Speed chess
    'coins',                               // 🪙 Crypto & USDT stakes
    'wallet'                               // 👛 On-chain payout
  ]
};
```

---

## 8. Golden Reference Exports

Inspect the approved golden standard renders in the repository:
- **Square (1:1 / 1080×1080)**: [`marketing/content-ops/queue/2026-10-14/web3_speed_chess_announcement_canvas.png`](file:///Users/grandmaestro/Developer/ChessTGBot/marketing/content-ops/queue/2026-10-14/web3_speed_chess_announcement_canvas.png)
- **Portrait (4:5 / 1080×1350)**: [`marketing/content-ops/queue/2026-10-14/web3_speed_chess_announcement_portrait.png`](file:///Users/grandmaestro/Developer/ChessTGBot/marketing/content-ops/queue/2026-10-14/web3_speed_chess_announcement_portrait.png)
- **Wide (16:9 / 1920×1080)**: [`marketing/content-ops/queue/2026-10-14/web3_speed_chess_announcement_wide.png`](file:///Users/grandmaestro/Developer/ChessTGBot/marketing/content-ops/queue/2026-10-14/web3_speed_chess_announcement_wide.png)
