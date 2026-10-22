# Web3Chess Social Canvas Style Guide & Golden Standards

This guide defines the visual and copywriting standards for all social media graphics, campaign banners, and announcement canvases produced for Web3Chess (`web3chess.online` & `@chesshub_chat`).

All canvas generators, rendering scripts, and marketing workflows must adhere strictly to these standards. The live [Creatives Studio](https://web3chess.online/CREATIVES) is the editable source for campaign and article-share art. Keep its exported project JSON with every approved PNG. The older board renderer remains the source for chess puzzles and move reveals, where the exact legal position is essential.

## Platform output and approval

| Use | Canvas | Editorial rule |
| :--- | :--- | :--- |
| Telegram and X single-image posts | 1080×1080 | One hook and one action; review image and native caption together |
| Portrait social feed | 1080×1350 | Keep the key claim and logo inside the safe canvas, then preview in a phone feed |
| Stories | 1080×1920 | Reserve the upper and lower zones for platform controls; never place the CTA or disclaimer at the edge |
| Wide social and presentations | 1920×1080 | Recompose rather than stretch a square image |
| Blog share promotion | 1200×630 | Match the article's verified angle and link; preserve exact chess diagrams within the article |

Review source, offer, chess facts, required disclosures, readability, crop, destination, filename and rendered pixels before marking a post approved. A Studio graphic is promotional art, not evidence of a game result, live player count or prize. New platform accounts and distribution schedules require their own channel approval. No automatic reposting from this export step.

### Required content-to-canvas routing

- Telegram and X posts with a legal position, FEN, puzzle, trap, or reveal use the exact board renderer. Studio artwork must never replace the position being discussed
- Every other Telegram or X post with a creative uses an editable `/CREATIVES` Studio project. The queue stores that project beside the caption and renders the attached PNG from it
- The Studio headline, subtitle, tag, proof rows, action, URL pill, and compliance note must come from the reviewed post record. A generic campaign graphic cannot be reused for a different caption
- The action URL pill must name the actual destination behind the post button or docked reply. Telegram links show `t.me`; website links show the exact Web3Chess host
- Blog promotions use a 1200×630 Studio project and PNG named for the article slug. The website Open Graph route uses that image automatically when present
- The image and native caption are one review unit. A post cannot be approved when either part fails QA, the image is missing, or the project JSON is missing
- Prize amounts, deadlines, live participation, performance percentages, latency numbers, player results, and payout claims require a structured evidence record with a verified source. Without it, rewrite the claim using the product behavior that can be checked
- Exporting never publishes. Telegram, X, blog staging, and future platforms retain separate human review and distribution controls

### Context mapping

| Post context | 3D art | Proof icon direction |
| :--- | :--- | :--- |
| Academy, openings, calculation | Academy book | Learning, strategy, target |
| Blitz culture, time pressure | Chess clock | Time, strategy, community |
| Product journey, Telegram entry | Chess sculpture | Telegram, strategy, action |
| Match rules and USDT stakes | Balance scale | Coins, time, fair play |
| Fair play and engineering | Fair-play kings | Telegram, shield, system flow |
| Leaderboards and verified players | Chess sculpture | Trophy, community, target |

Use a different mapping only when the new art is more specific to the reviewed post. Decorative variety alone is not a valid reason.

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

### Engine implementation
Set the three `proofIcons` explicitly in the Studio project. Each icon should identify its own proof line; the offline editorial exporter rejects missing or unknown icons.

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
- **Useful hooks and real urgency**:
  - Focus on a concrete chess decision, a verifiable product action, or a real time-bound event with a sourced deadline.
  - *Poor / Generic*: `Bullet, blitz, and USDT stakes. Join our community.`
  - *Clear*: `60s blitz · Check the threat before you move`
  - *Alternative*: `Three practice games · One question after every move`

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
