# Web3Chess Website: DESIGN.md

**System:** Fog Board, *"a tournament poster on fog"*
**Version:** 1.0 · 2026-09-11
**Scope:** the public marketing website for Web3Chess (web3chess.online, or wherever the owner places it; see §14.4).
**Not in scope:** the Telegram Mini App in `frontend/`, which keeps **Obsidian Chess** ([`BRAND_DESIGN_SYSTEM.md`](../../BRAND_DESIGN_SYSTEM.md)).
**Reference:** Fold (fold.money) via Refero Styles, audited and corrected in [`REFERENCE_AUDIT.md`](REFERENCE_AUDIT.md).

| File | What it is |
|---|---|
| `DESIGN.md` | This spec: foundations, components, pages, voice, build plan |
| [`REFERENCE_AUDIT.md`](REFERENCE_AUDIT.md) | What Fold actually does, measured, plus where Refero was wrong |
| [`tokens.json`](tokens.json) | Source of truth for tokens (W3C DTCG format) |
| [`theme.css`](theme.css) | Tailwind v4.1 theme: primitives, semantic roles, surfaces, base styles, utilities. Verified to compile. |
| [`tokens.ts`](tokens.ts) | Typed tokens for JS: motion, board, breakpoints, z-index, locales |

---

## 0. How to use this document

**Precedence when rules conflict:** owner instruction → this file → `tokens.json` → your judgment. If you invent something, add it here in the same change.

**Before building any section or component:**

1. Find its recipe in §8 (components) or §9 (pages). Don't invent a parallel pattern.
2. Use semantic utilities (`bg-canvas`, `text-fg-muted`, `border-line`), never raw hex. `theme.css` deletes Tailwind's default palette on purpose, so `bg-blue-500` won't compile.
3. Pick the surface (`data-surface`) before picking colors. Colors resolve from the surface.
4. Ship every state (§8.0) and every script (§3.7) before calling it done.
5. Run the Definition of Done (§14.6).

**Never import `theme.css` into `frontend/`.** The Mini App has its own dark system, its own invariants (safe areas, navbar, haptics) and a CI static-export guard.

---

## 1. Brand foundation

### 1.1 What Web3Chess is (the facts this site must not overstate)

- Real-time PvP chess that runs **inside Telegram** as a Mini App. Players find a match in seconds, and Telegram notifies them when an opponent is found ("You can close the app — we'll message you on Telegram").
- **Optional USDT wager matches** with selectable wager tiers. The platform takes a win commission; the app currently shows "3% win commission", but the figure comes from backend config, so render it, don't hard-code it (§10.4).
- **Wallet:** deposits in USDT (and TON), a transaction history, and withdrawals. Withdrawals below the review threshold wait for the owner's confirmation in the bot chat. TON Connect links the player's own wallet.
- **Academy:** a daily puzzle, mastery tracks (Origins & Motivation, Opening Principles, Tactical Patterns, Endgame Magic) and training against the A.I.
- **Progression:** XP, seasons, leaderboards, a Marketplace with Mystery Vault drops and board themes.
- **Premium membership** (monthly, or annual at −15%) and a **referral program** that pays USDT commission.
- 10 languages: en, es, fr, de, ru, pt, zh, hi, ar (RTL), ja.

**Custody.** Deposits are credited to a **platform balance** held in the master wallet. **The site must never call Web3Chess "non-custodial", "trustless" or "your keys, your coins".**

### 1.2 The site's single job

**Get a player from curiosity to their first match in Telegram.**

- **Primary action:** **Play in Telegram** (a deep link on mobile, a QR code on desktop).
- **Everything else supports one of three questions:**
  - *Is it real?* (demos, the live board)
  - *Is it fair?* (rules, fair play, how money moves)
  - *Is it for me?* (Academy, Premium, languages)

### 1.3 Audience

| Segment | What they need to see |
|---|---|
| Telegram-native casual players, mobile-first, often in the in-app browser | One tap to play, instant proof it's a real game |
| Improving players (≈800–1800 rating) | Academy, rated matchmaking, time controls |
| Crypto-comfortable players | USDT stakes, clear fees, withdrawal mechanics, TON |
| Referrers and communities | Referral economics, shareable pages, language coverage |

### 1.4 Personality

| We are | We are not |
|---|---|
| A tournament poster: bold, one clear message per section | A casino lobby: neon, jackpots, countdown pressure |
| Calm, exact, plain about money | A crypto launch site: gradients, "to the moon", vague APYs |
| Chess-literate: notation, clocks, real positions | Chess clip-art: knights wallpapered behind everything |
| Playful in exactly one place per page | Jokey everywhere |
| Light and airy, with one dark "arena" moment | Dark by default (that's the app's job) |

### 1.5 Design principles

1. **One sentence per section.** Every section is a poster headline plus one demonstration. If you need two headlines, you need two sections.
2. **Show the board.** Demonstrate with real positions, real notation and real UI, not adjectives.
3. **Ink before color.** Build the section in Fog, White and Ink first; add an accent only if a specific element needs to be found.
4. **Spend boldness once.** At most one Voltage, one Signal tile, one Ink band and one Night panel per page.
5. **Plain money.** Every number about money has a source, a unit and, where relevant, a risk note.
6. **Readable everywhere.** AA contrast, 10 languages, RTL, reduced motion, small phones inside Telegram.
7. **Fast is a feature.** The poster headline is live text, not an image. LCP under 2s on mid-range mobile.

### 1.6 Signature moves (what makes it *this* site)

| Move | What it is | Rule |
|---|---|---|
| **Poster headline** | 56–100px, weight 700, −0.03em tracking, Ink on Fog | One per page, in the hero only |
| **Pawn Tittle** | The dot of an "i" in the hero headline becomes a pawn head that pops in and tilts on hover | Hero only; fallback rules in §3.5 |
| **Fog lift** | White cards on the Fog canvas with a navy-tinted shadow, no borders | ≤3 surface levels |
| **Night panel** | A grain-textured `#071A22` panel showing the real Mini App, the bridge to Obsidian Chess | ≤1 per page |
| **Voltage move** | One `#FFFF00` moment: move of the day, a key fact, the team tile | ≤1 per page |
| **QR dock** | A fixed bottom-left QR code that opens the game in Telegram (desktop only) | Every page on ≥1024px |
| **Toppling king** | A 6-stage scroll sequence of the king tipping over. Laying down the king is how a player resigns. | Home philosophy section only |

---

## 2. Color

### 2.1 Primitive palette

All values come from `tokens.json`. Ratios are WCAG contrast against the named background.

| Token | Hex | Name | Role | Contrast notes |
|---|---|---|---|---|
| `ink` | `#20294C` | Board Ink | Headlines, body, primary button fill, `theme-color` | 12.55 on Fog · 14.16 on White |
| `royal` | `#0A2D67` | Royal Ink | Chip text, nav-chip text, secondary-action hover border | 12.70 on Paper |
| `steel` | `#375390` | Cornflower Steel | Icon strokes, outline button border and text, "draw" state | 6.64 on Fog |
| `hyacinth` | `#788DBA` | Hyacinth | Chip borders (50% alpha), Fog Board dark squares | **Never text on light** (2.95) |
| `dusk` | `#676B89` | Dusk | Secondary text | 4.60 on Fog · 5.20 on White · 4.98 on Paper · **not on Mist** (3.91) |
| `smoke` | `#979DB5` | Smoke | Secondary text **on dark only** | 6.62 on Night · 5.26 on Ink · **2.38 on Fog ✗** |
| `silver` | `#C7CBDB` | Silver Lining | Hairlines, dividers, nav-chip border; muted text on the Ink band | — |
| `mist` | `#DDDFE9` | Mist | Washes, nested fills, QR dock (50%), light squares | — |
| `fog` | `#F0F1F5` | Fog | Page canvas, inset chip fill | — |
| `paper` | `#FAFAFA` | Paper | Feature chip and badge fill | — |
| `white` | `#FFFFFF` | White | Card surface | 17.80 on Night |
| `abyss` | `#042939` | Abyss | Text on Voltage | 14.16 on Voltage |
| `night` | `#071A22` | Night | Night panel ground (with grain) | — |
| `night-raised` | `#103645` | Night Raised | Raised element on Night | White 12.84 · Smoke 4.77 |
| `signal` | `#459AF8` | Signal | Accent dots, active marks, live cursor, one Signal tile | **Not text on light** (2.57) · Ink on Signal 4.88 · **White on Signal 2.90 ✗** |
| `signal-ink` | `#1A63BF` | Signal Ink | Link text on light surfaces | 5.20 on Fog · 5.86 on White · 5.62 on Paper · **not on Mist** (4.41) |
| `signal-soft` | `#7DB8FA` | Signal Soft | Link text on dark surfaces | 8.57 on Night |
| `voltage` | `#FFFF00` | Voltage | One moment per page | Abyss 14.16 · Ink 13.19 |
| `king` | `#FFD700` | King Gold | **Logo king glyph only**, carried over from `frontend/public/icon.svg` | 10.10 on Ink |

**Signal = Telegram/TON.** Electric blue already reads as native to Telegram and TON, so the one chromatic accent doubles as an ecosystem cue. That's why it's the only blue.

### 2.2 Game semantics (state, never decoration)

| Meaning | On light | Fill | On dark | Used for |
|---|---|---|---|---|
| Win / positive delta | `win` `#047857` (4.86) | `win-fill` `#10B981` + Ink text (5.58) | `win-soft` `#34D399` (9.26) | Result chips, +rating, +USDT winnings |
| Loss / negative delta | `loss` `#BE123C` (5.57) | `loss-fill` `#E11D48` | `loss-soft` `#FB7185` (6.61) | −rating, losses, destructive actions |
| Draw / neutral | `steel` | `mist` | `smoke` | ½–½, pending |
| Live | — | `loss-fill` dot + `animate-live` | same | "Live" badge dot only |
| Premium | `premium` `#6D28D9` (6.29) | `premium` + White (7.10) | `premium-soft` `#A78BFA` | Premium badge, pricing highlight |
| Caution / notice | `caution` `#92400E` (6.28) | `mist` wash | `caution-soft` `#FBBF24` | Region notice, low clock time |

**Never convey state by color alone.** Pair it with a sign (`+`/`−`), a word ("Won") or an icon.

### 2.3 Surfaces

Colors come from the surface scope, applied with `data-surface`. Components use semantic utilities, so they re-theme automatically.

| Surface | `data-surface` | Ground | Text / muted | Link | Elevation | Limit |
|---|---|---|---|---|---|---|
| **Canvas** (default) | — | Fog | Ink / Dusk | Signal Ink | Navy shadows | — |
| **Ink band** | `ink` | Ink `#20294C` | White / Silver | Signal Soft | Hairlines, no shadows | ≤1 per page |
| **Night panel** | `night` | Night `#071A22` + grain | White / Smoke | Signal Soft | Night Raised cards, hairlines | ≤1 per page |
| **Voltage** | `voltage` | `#FFFF00` | Abyss | Abyss (underlined) | Edge highlight only | ≤1 per page |
| **Signal tile** | `signal` | `#459AF8` | Ink | Ink (underlined) | None | ≤1 per page |

`[data-theme="dark"]` maps to the Night roles. A site-wide dark mode is **not planned for launch** (the poster-on-fog look *is* the identity), but the token wiring is ready if the owner wants it later.

### 2.4 Semantic utilities

| Utility | Canvas value | Use |
|---|---|---|
| `bg-canvas` | Fog | Page and section grounds |
| `bg-surface` | White | Cards, panels |
| `bg-inset` | Fog | Nav chips, inset controls on white |
| `bg-wash` | Mist | Nested fills, table stripes, QR dock |
| `bg-chip` | Paper | Feature chips, badges |
| `bg-inverse` / `text-fg-inverse` | Ink / White | Primary button |
| `text-fg` | Ink | Default text |
| `text-fg-muted` | Dusk | Secondary text |
| `text-fg-action` | Royal | Chip and nav-chip labels |
| `text-fg-link` | Signal Ink | Links |
| `text-fg-win` · `text-fg-loss` · `text-fg-premium` · `text-fg-caution` | — | Game semantics |
| `border-line` · `border-line-soft` · `border-line-strong` · `border-line-ghost` | Silver · Mist · Steel · Hyacinth 50% | Dividers · soft edges · outline buttons · chips |
| `text-icon` | Steel | Icons |
| `outline-focus` | Signal Ink | Focus ring (set globally) |

### 2.5 Fog Board (chessboard theme)

| Element | Value |
|---|---|
| Light square | `mist` `#DDDFE9` |
| Dark square | `hyacinth` `#788DBA` |
| Coordinates | `royal` on light squares, White on dark; 11px / 600. Decorative only, see §11 for the accessible equivalent. |
| Last move | Voltage at 45% over the square |
| Selected square | Signal at 35% |
| Move hint | Ink at 22%, a dot 28% of the square |
| Check | Radial `loss-fill` at 60% |
| White pieces | White fill, 1.5px Ink stroke |
| Black pieces | Ink fill, Fog hairline stroke |
| Board frame | 12px radius (`rounded-card`), `shadow-card`, no border |

Wire these into `react-chessboard` square styles through `tokens.ts → board`.

### 2.6 Color usage rules

- **Approximate ratio per viewport:** ~70% Fog/White · ~20% Ink (text, lines) · ~8% Steel/Mist structure · **≤2% accent**.
- **Shadows** are always navy-tinted `rgb(32 41 76 / …)`. Grey or black shadows are off-brand.
- **Pure black `#000`** is never used. Night `#071A22` is the darkest ground, and the Mini App preview inside it can show its own blacks.
- **No gradients** on backgrounds, buttons or text. Exceptions: the Fog Board check radial, and grain on the Night panel and Pawn Tittle.
- **Third-party brand colors** (Telegram `#2AABEE`, TON `#0098EA`, Tether `#26A17B`) appear only inside their official logos. Never use them as UI color.
- **Selection** is Voltage background with Ink text (`::selection`, set globally).

---

## 3. Typography

### 3.1 Families

| Role | Free default (ship this) | Licensed upgrade | Why |
|---|---|---|---|
| **Sans:** UI, body, every headline | **Onest** 400 / 600 / 700 | GT Walsheim Pro (Grilli Type) | Humanist-geometric with a generous x-height, like Walsheim. **Covers Latin and Cyrillic** (verified on Google Fonts). Figtree was rejected: Latin only, so `ru` would fall back. |
| **Accent:** stats, pull quotes | **Golos Text** 500 | GT America | Neo-grotesque contrast for numbers that must feel "reported". Latin + Cyrillic. |
| **Mono:** notation, clocks, addresses | **IBM Plex Mono** 400 / 500 / 600 | — | Scoresheet character; tabular digits. Latin + Cyrillic. |
| **Script fallbacks** | Noto Sans SC · Noto Sans JP · Noto Sans Devanagari · Noto Sans Arabic | — | Load only on those locales' routes (§3.7) |

Switching to the licensed fonts later is a change to `next/font/local` plus tokens only. The scale below doesn't change. Before buying, confirm the GT Walsheim Pro web license covers the Cyrillic you need.

### 3.2 Loading (Next.js `next/font`)

```ts
// website/src/app/fonts.ts
import { Onest, Golos_Text, IBM_Plex_Mono } from 'next/font/google';

export const onest = Onest({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '600', '700'],
  variable: '--font-onest',
  display: 'swap',
});
export const golos = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  weight: ['500'],
  variable: '--font-golos',
  display: 'swap',
});
export const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});
// <html lang={locale} dir={dir} className={`${onest.variable} ${golos.variable} ${plexMono.variable}`}>
```

- Preload only Onest (the LCP headline font). The accent and mono faces load on demand.
- Use `adjustFontFallback` (the default) to keep CLS under 0.05.

### 3.3 Type scale

The scale is fluid between 375px and 1280px viewports. Tokens live in `theme.css` and each utility carries size, line-height, tracking and weight.

| Utility | Mobile → Desktop | Line-height | Tracking | Weight | Family | Use |
|---|---|---|---|---|---|---|
| `text-display` | 56 → **100px** | 0.85 | −0.03em | 700 | Sans | Hero poster headline. **One per page.** |
| `text-heading-xl` | 40 → 64px | 1.0 | −0.03em | 700 | Sans | Big section statements, Ink band headline |
| `text-heading-lg` | 34 → 48px | 1.08 | −0.03em | 700 | Sans | Standard section H2 (the measured default) |
| `text-heading-md` | 26 → 32px | 1.2 | −0.03em | 700 | Sans | Card titles in bento, sub-sections, footer heading-link |
| `text-heading-sm` | 22 → 24px | 1.5 | −0.03em | 600 | Sans | Group labels, "Play on mobile" |
| `text-stat` | 32 → 42px | 1.0 | −0.02em | 500 | **Accent** | Metrics, ratings, prize figures |
| `text-lead` | 20 → 24px | 1.5 | 0 | 400 | Sans | Paragraph under an H1/H2 (max 2 sentences) |
| `text-title` | 20px | 1.5 | −0.01em | 600 | Sans | Card headings, FAQ questions |
| `text-chip` | 18px | 1.33 | 0 | 600 | Sans | Feature chips, nav chips |
| `text-body-lg` | 18px | 1.5 | 0 | 400 | Sans | Long-form article body |
| `text-body` | **17px** | 1.41 | 0 | 400 / 600 | Sans | Default UI and body text |
| `text-body-sm` | 16px | 1.5 | 0 | 400 | Sans | Secondary paragraphs, table cells |
| `text-label` | 14px | 1.43 | +0.01em | 600 | Sans | Form labels, table headers, meta |
| `text-caption` | 14px | 1.43 | 0 | 400 | Sans | Captions, legal lines, timestamps |
| `text-overline` | **12px** (floor) | 1.2 | +0.08em, uppercase | 600 | Sans | Eyebrows, badges, card meta |
| `text-button-sm` / `text-button` / `text-button-lg` | 15 / 17 / 20px | 1.33 / 1.41 / 1.2 | 0 | 600 | Sans | Buttons |
| notation | 15px | 1.6 | 0 | 500 | Mono | PGN, move lists, "1. e4 e5" |
| clock | 28px | 1.0 | −0.01em | 600 | Mono | Clocks in demos; `tabular-nums` |

### 3.4 Typographic rules

1. **Poster tracking is −0.03em on every heading from 22px up.** Body text is never tracked negatively.
2. **Headings are Ink, weight ≥600.** Never set a headline in weight 400 (Fold's rule, and it holds).
3. **Hero headline:** ≤2 lines on desktop and ≤4 on a 375px phone. Centered. `text-wrap: balance` is applied globally.
4. **Center-align only text of ≤2 lines.** Anything longer is start-aligned (left in LTR, right in RTL).
5. **Measure:** body text ≤ 65ch (`max-w-prose`); leads ≤ 36ch.
6. **Uppercase-in-headline** (Fold's "OUR GOAL"): an overline phrase in uppercase *at headline size* as the first line of an H2. Max once per page. Latin and Cyrillic scripts only.
7. **Numbers:**
   - `tabular-nums` wherever digits align: tables, clocks, balances, leaderboards.
   - Minus sign is `−` (U+2212), set tight: `−12`, `+18`.
   - Money is always `12.40 USDT` (2 decimals, unit after, non-breaking space). TON uses up to 4 decimals.
   - Ratings are integers. Time controls use `3+2` (Mono).
8. **Inline links in body copy are always underlined** (`link-inline`). Standalone links (`link`) underline on hover.
9. **Minimum text size is 12px**, and 14px for anything a player must read to decide (fees, rules).
10. **Emoji are never used as icons or section markers.** The only "emoji-like" moment is the Pawn Tittle, and it is an SVG.

### 3.5 Pawn Tittle (signature)

The dot above an "i" in the hero headline is replaced by a **pawn head**: an Ink ball with a subtle grain, sized to the tittle. It pops in on load and tilts on hover. A pawn is a stem with a ball on top, just like an "i".

**Anatomy:**

```html
<h1 class="text-display text-fg text-center">
  <span class="sr-only">Skill is the only edge.</span>
  <span aria-hidden="true">
    Sk<span class="tittle-host">ı<span class="tittle"><svg><!-- pawn head --></svg></span></span>ll is the only edge.
  </span>
</h1>
```

**Spec:**

- **Glyph:** the host letter is a dotless **ı (U+0131)**, so the real dot never peeks out. The whole line is `aria-hidden` and duplicated in `sr-only`, so screen readers read "Skill", not "Skıll".
- **Size:** 0.2em × 0.2em. Position: centered over the stem at `top: 0.02em` (tune per font, then lock in a CSS variable `--tittle-offset`).
- **Look:** Ink fill, `grain-ink` overlay, a 1px White highlight at top-left (`shadow-edge`).
- **Load:** `animate-pop` (200ms, `ease-pop`) starting 300ms after first paint. It is scale-only and never changes opacity, so the headline is readable in the first frame.
- **Hover** (pointer devices only): `rotate(-12deg) scale(1.15)`, 75ms, `ease-pop`. **Tap** does nothing.
- **Reduced motion:** static, no pop, no tilt.
- **Fallbacks:**
  - Locales whose headline has no "i"/"j", or scripts without tittles (ru, zh, ja, hi, ar): use the **trailing pawn**, the same pawn head placed after the final punctuation at 0.3em.
  - Never force a word choice just to create an "i".

### 3.6 Headline writing patterns

- **Poster:** a short declarative sentence ending in a period. "Skill is the only edge."
- **Split lines:** break after the verb or at the natural pause. Never orphan a single word on the last line (balance handles most cases; check de and ru).
- **Section H2 + lead:** the H2 makes a claim, the lead proves it in ≤2 sentences.

### 3.7 Multilingual typography

| Locale | Font | Tracking | Line-height | Other |
|---|---|---|---|---|
| en es fr de pt | Onest | −0.03em | As scale | de/fr headlines run ~30% longer: test the hero at 375px |
| ru | Onest (Cyrillic) | −0.03em | As scale | Uppercase overlines allowed |
| zh, ja | Onest for Latin, then Noto Sans SC / JP | **0** | Display 1.12, body 1.7 | No uppercase; no Pawn Tittle; avoid italics |
| hi | Noto Sans Devanagari 400 / 700 | **0** | Display 1.25, body 1.7 | Conjuncts break with negative tracking |
| ar | Noto Sans Arabic 400 / 700 | **0** (spacing breaks joining) | Display 1.25, body 1.7 | `dir="rtl"`, logical properties, mirrored layout, numerals stay Western |

`theme.css` applies these through `:lang()`. Load script fonts only on their locale's layout, with subsets restricted to that script.

---

## 4. Layout

### 4.1 Grid and containers

| Token / utility | Width | Use |
|---|---|---|
| `shell-prose` | 640px | Articles, legal pages, FAQ answers |
| `shell-content` | 928px | Feature sections (the measured Fold width) |
| `shell-main` | 1024px | **Default page column**, nav, hero |
| `shell-wide` | 1200px | Footer bento, pricing comparison, leaderboard |
| Full bleed | 100% | Ink band and Night panel grounds (content inside still uses a shell) |

- `shell-*` = `min(100% − 2 × gutter, container)`, centered.
- **Gutter** (`px-gutter`) runs 24px → 48px.
- **Grid:** 12 columns inside the shell with a 24px column gap (16px below `md`). Use CSS grid with `gap`, never margins between siblings.
- **Density rule:** a text block never exceeds 60% of the viewport width on desktop. The rest is air.

### 4.2 Breakpoints

Tailwind defaults.

| Name | Min width | Layout shift |
|---|---|---|
| base | 0 | Single column, sticky bottom CTA bar, hamburger nav |
| `sm` | 640px | Chips wrap in rows of 2–3 |
| `md` | 768px | Split sections go 2-column (6/6); bento 2-up |
| `lg` | 1024px | Full nav chips, QR dock appears, split 5/7 asymmetry |
| `xl` | 1280px | Display type reaches 100px |
| `2xl` | 1536px | Nothing new. The layout stops growing; air increases. |

Test widths: **360, 390, 768, 1024, 1280, 1536**. 360px represents small Android phones in the Telegram in-app browser.

### 4.3 Section rhythm

- Vertical padding: `section-y` (64 → 120px). Adjacent Canvas sections share one padding, never stacking two.
- Heading → lead: 16px. Lead → demo or CTA: 32px (40px on desktop).
- Card padding: 24px (`p-card`). Panel padding: 24 → 48px (`p-panel`).
- Element gap: 8px base; chips 8px; buttons 12px apart; card grids 24px.

### 4.4 Composition patterns

| Pattern | Structure | Where |
|---|---|---|
| **Poster hero** | Centered: object cluster → display headline → lead → CTA row → "In public beta" note. Height set by content (never `100vh`). | Home, landing pages |
| **Split** | Text (5 cols) + demo (7 cols); alternate sides down the page. Mobile: text first, demo second. | Feature sections |
| **Chip field** | H2 + lead + a wrapped row of feature chips | Trust ("No …" chips), time controls |
| **Band** | Full-bleed Ink or Night ground, 24px radius inset at `shell-wide` on desktop (full bleed with no radius on mobile), 64px headline in White, demo inside | Wallet, "Inside the app" |
| **Bento** | 12-column grid of 24px-radius tiles with spans of 4/8/6 and row-span 2 | Footer, feature overview |
| **Statement** | Uppercase overline-in-headline H2 + short paragraph + illustration | Mission, philosophy |
| **Ledger** | A table or list of real rows (matches, transactions, fees) in a white card | Leaderboard, fees, wallet |

### 4.5 Layers (z-index)

| Layer | z | Elements |
|---|---:|---|
| base | 0 | Content |
| raised | 10 | Overlapping cards, the tittle |
| sticky | 40 | Sticky nav pill, mobile CTA bar |
| dock | 50 | QR dock |
| dropdown | 60 | Language menu, tooltips |
| overlay | 100 | Sheet and modal backdrop |
| modal | 110 | Modal, mobile nav sheet |
| toast | 140 | Toasts ("Link copied") |

This matches the Mini App scale at 0 / 40 / 50 / 100 / 110 / 140 so shared mental models hold.

---

## 5. Space, shape, elevation

### 5.1 Spacing scale

8px base with a 4px half-step, using Tailwind's default `--spacing: 0.25rem` multiplier.

| Token | px | Tailwind | Typical use |
|---|---:|---|---|
| 2xs | 4 | `1` | Icon-to-text inside a badge |
| xs | 8 | `2` | Base gap, chip gap |
| sm | 12 | `3` | Button gap, compact card rows |
| md | 16 | `4` | Heading → lead, list rows |
| lg | 24 | `6` | Card padding, grid gap |
| xl | 32 | `8` | Lead → CTA |
| 2xl | 48 | `12` | Within-section groups |
| 3xl | 64 | `16` | Minimum section padding |
| 4xl | 96 | `24` | Hero top on desktop |
| 5xl | 120 | `30` | Maximum section padding |
| 6xl | 160 | `40` | Space above the footer bento |
| `gutter` | 24 → 48 | `px-gutter` | Page side padding |
| `section` | 64 → 120 | `py-section` / `section-y` | Section padding |

### 5.2 Radius roles

Fold uses seven radii, not two. Each radius belongs to a role; don't pick by eye.

| Utility | px | Role |
|---|---:|---|
| `rounded-control` | 8 | Nav chips, icon buttons, inputs, selects, tooltips, table containers on mobile |
| `rounded-card` | 12 | Cards, QR dock, board frame, toasts |
| `rounded-media` | 16 | Images, screenshots, video, illustrations with plates |
| `rounded-device` | 20 | Screen inside a device frame |
| `rounded-panel` | 24 | Bento tiles, Ink and Night bands, modals, sheets (top corners), sticky nav pill |
| `rounded-frame` | 40 | Device outer frame |
| `rounded-pill` | 9999 | Buttons, feature chips, badges, toggles, segmented controls |

**Nested rule:** inner radius = outer radius − padding (minimum 4px). Board squares have 0 radius.

### 5.3 Elevation

All shadows are navy-tinted and exact to the measured site.

| Utility | Value | Use |
|---|---|---|
| `shadow-hairline` | `0 1px 4px rgb(32 41 76 / .04)` | Rows lifted off Fog without a card |
| `shadow-control` | `0 1px 4px rgb(32 41 76 / .10)` | Buttons, nav chips, icon buttons |
| `shadow-nested` | `0 4px 11px / .07, 0 1px 3px / .12` | Card inside a card, dropdowns |
| `shadow-float` | `0 6px 16px / .12, 0 1px 5px / .09` | Hero objects, device mockups, sticky nav pill |
| `shadow-card` | `0 9px 25px rgb(32 41 76 / .12)` | Default card, board frame |
| `shadow-edge` | `0 1px 0 rgb(255 255 255 / .53)` | Top highlight on Voltage and on the tittle |
| `inset-shadow-well` | `inset 0 0 4px rgb(32 41 76 / .05)` | Inputs, QR code well |

- **Surface levels:** at most three (Canvas → Card → Nested). A fourth level means the design needs restructuring.
- **Borders vs shadows:** on Canvas, cards use a shadow with no border. On Ink and Night surfaces, shadows are invisible, so use a 1px `border-line` hairline.
- **Hover elevation** (interactive cards only): `shadow-card` → `shadow-float` plus `translateY(-2px)`, 150ms `ease-standard`.

---

## 6. Iconography and imagery

### 6.1 Icons

- **Library:** `lucide-react` with `strokeWidth={1.5}`, at 20px inline and 24px standalone. Color: `text-icon` (Steel), or `currentColor` inside buttons.
- **Chess pieces:** a custom 6-piece SVG set drawn to the Fog Board spec (§2.5). Used in demos, the Pawn Tittle and small inline glyphs. Never use Unicode ♞ glyphs in production UI; they render inconsistently across platforms.
- **Brand marks:** official Telegram, TON and Tether (USDT) SVGs, unmodified, following each brand's guidelines. Monochrome Ink versions are allowed only where the brand provides them.
- **Directional icons** (arrows, chevrons) get `flip-rtl`.
- **Icon-only buttons** always have an `aria-label`.

### 6.2 Illustration direction: "the chess table, drawn"

The hero and statement sections use a **hand-drawn object illustration style**:

- Crisp shapes, true-to-life color and a small soft contact shadow.
- Objects float on Fog with **no background plate**, overlapping slightly.
- **Object vocabulary** (only this subject has these):

| Object | Detail to get right |
|---|---|
| Wooden chess clock | Two faces, one flag up |
| Ivory and ink pawns, a toppled king | — |
| Paper scoresheet with handwritten notation | `1. e4 e5 2. Nf3` |
| Tournament trophy | Small, not gaudy |
| USDT coin and TON coin | Official marks, flat, never 3D-extruded logos |
| Telegram paper plane | — |
| Phone showing the Mini App | Real screenshot inside a device frame |
| Coffee cup | The tournament hall's constant |

- **Palette inside illustrations:** true color, with Ink as the darkest value. No neon, no glow, no gradients.
- **Never:** photoreal 3D renders, glossy crypto coins, robots or "AI brain" imagery, casino chips, dice, money stacks, lightning bolts.
- **Commission or generate at 2× size**, export AVIF with WebP fallback, and ship the SVG version wherever the art is vector.

**Generation prompt template** (when AI-assisted art is used, retouch before shipping):

> Hand-drawn editorial illustration of a single [OBJECT] for a chess website, crisp clean shapes, subtle paper texture, true-to-life colors, darkest tone deep navy #20294C, small soft contact shadow directly beneath, isolated on plain #F0F1F5 background, no outline stroke, no gradient background, no text, no logo, three-quarter view, generous negative space.

### 6.3 Product imagery

- **Device mockups:** an iPhone-style frame (`rounded-frame` outer, `rounded-device` screen) with real Mini App screenshots.
  - Always ship a **light/dark pair**. The Mini App is dark (Obsidian), and its light theme exists too.
  - A "Toggle theme" pill cross-fades the pair: 200ms opacity, no layout shift.
- **Screenshots:** captured at 3× from production with realistic example data. **Never show real users' names, balances or wallet addresses.** Seed demo accounts instead.
- **Browser frame** (for web portal shots): 12px radius, a Mist top bar with three Silver dots, and a URL pill showing the real domain.
- **Photography:** only the real team, on the Voltage team tile. No stock photos.
- **Alt text:**
  - Mockups get a descriptive alt of 1–3 sentences: what's on screen and why it matters.
  - Decorative objects get `alt=""`.
  - The live board has `aria-label` plus a text move list.

### 6.4 Social and sharing images

**OG template** (1200 × 630):

- Fog ground.
- The poster headline in Onest 700 at −0.03em, 88px, Ink, left-aligned, max 2 lines.
- One illustration object on the right.
- Logo lockup bottom-left.

Generate per page with `next/og` and per locale; use Noto fonts for zh / ja / hi / ar. The same template powers Telegram link previews, so keep text inside the central 1000 × 500 safe area.

### 6.5 Logo

- **Mark:** the gold king (`king` `#FFD700`) on an Ink rounded square (radius = 25% of size), carried over from `frontend/public/icon.svg`, recolored from `#1A1A1A` to Ink for the website.
- **Wordmark:** lowercase `web3chess` in Onest 700 at −0.03em, Ink. Lowercase matches the poster voice.
- **Lockup:** mark (1.25× cap height) + 8px gap + wordmark. Clear space = mark width / 2. Minimum mark size is 24px.
- **On Ink or Night surfaces:** White wordmark; the mark keeps its Ink square with a 1px White/12% border.

---

## 7. Motion

### 7.1 Principles

1. **Motion explains a chess thing** (a move, a clock tick, a king falling) or confirms an action. It never decorates.
2. **Content is readable in the first frame.** No section waits at `opacity: 0` for JavaScript. Reveals are scroll-driven CSS (`reveal` utility) that degrade to fully visible.
3. **One orchestrated moment per page** (home: the toppling king). Everything else is micro.
4. **Transform and opacity only.** Never animate layout, filters or `backdrop-filter`.

### 7.2 Tokens

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 75ms | Tittle tilt, press-down |
| `--dur-fast` | 100ms | Link underline |
| `--dur-base` | 150ms | Color, border, shadow, hover lift |
| `--dur-medium` | 200ms | Theme cross-fade, tooltip, tittle pop |
| `--dur-slow` | 500ms | Mockup transforms, sheet open |
| `--dur-reveal` | 640ms | Section reveal (JS fallback timing) |
| `ease-standard` | `cubic-bezier(.4,0,.2,1)` | Default (measured) |
| `ease-pop` | `cubic-bezier(.06,.94,.67,1.01)` | Springy overshoot (measured) |
| `ease-enter` | `cubic-bezier(.2,0,0,1)` | Things arriving |
| `ease-exit` | `cubic-bezier(.4,0,1,1)` | Things leaving (use 0.75× duration) |
| `motion.spring.snappy` | stiffness 350, damping 25 | Toggles, segmented thumb (same as the Mini App) |
| `motion.spring.soft` | stiffness 170, damping 26 | Sheets, mockups settling |

### 7.3 Catalog

| Motion | Spec |
|---|---|
| **Pawn Tittle** | Pop on load (§3.5): 200ms `ease-pop`, 300ms delay. Hover: −12°, ×1.15, 75ms. |
| **Section reveal** | `reveal`: from translateY(16px) + opacity 0, driven by `animation-timeline: view()` over `entry 0%–55%`. Children stagger 60ms when done in JS. Elements already in view render complete. |
| **Hero objects** | Idle float of ±4px over 6s, alternating phase per object. Pointer parallax ≤12px on `lg+`. Disabled on touch devices and with reduced motion. |
| **Board move** | Piece slides 200ms `ease-standard`. Last-move highlight fades in 150ms. Demos auto-play one move every 1.6s and pause when off-screen or hovered. |
| **Clock** | Digits tick without animation. Under 10s the face turns `caution` (no pulsing; the Mini App's pulse rule is to avoid alarm spam). |
| **Live dot** | `animate-live`: an opacity pulse over 1.6s. |
| **Dash** | `animate-dash`: SVG strokes (move arrows, route lines) draw in 1.2s `ease-enter`. |
| **Toppling king** | 6 scroll-scrubbed stages: upright → wobble 6° → 18° → 40° → 72° → lying down with a small bounce. Scrubbed with `animation-timeline: view()` on a 200vh sticky stage. Reduced motion: shows stage 6 statically, with the caption. |
| **Mockup theme toggle** | Light/dark images stacked, 200ms opacity cross-fade. |
| **Hover lift** | Interactive cards only: −2px, `shadow-card` → `shadow-float`, 150ms. |
| **Button press** | `scale(.98)` for 75ms. No ripple. |
| **Sticky nav pill** | Appears after 480px of scroll: translateY(−8px) → 0 plus fade, 200ms `ease-enter`. Hides with `ease-exit`. |
| **Sheets and modals** | Backdrop fades in 200ms. Sheets rise with `spring.soft`; modals scale from .98, 200ms `ease-enter`. |
| **Toast** | Rises 8px + fade, 200ms; auto-dismisses after 4s; pauses on hover. |

### 7.4 Reduced motion

`prefers-reduced-motion: reduce` collapses all durations to 1ms (`theme.css`) and must also:

- Stop auto-playing board demos (show the final position plus a "Play moves" button).
- Disable parallax and idle floats.
- Show the final toppling-king stage.

Framer Motion: wrap the app in `<MotionConfig reducedMotion="user">`.

---

## 8. Components

### 8.0 Rules for every component

- **States:** default · hover (pointer only, via `@media (hover:hover)`) · focus-visible · active/pressed · disabled · loading. Data widgets also need empty, error and stale.
- **Focus:** a 2px `outline-focus` ring with 2px offset, set globally. Never remove it.
- **Hit area:** ≥44 × 44px on touch. Use padding or `::after` expansion when the visual is smaller.
- **Disabled:** 45% opacity plus `cursor: not-allowed`, and a reason shown nearby when it isn't obvious.
- **Logical properties** everywhere (`ps-*`, `me-*`, `start-*`, `text-start`) so RTL works automatically.
- **Copy** comes from `messages/<locale>.json` (next-intl). No hard-coded strings.
- **Build on Radix primitives** (or React Aria) for Dialog, Popover, Tabs, Accordion, Tooltip and Switch; style them with tokens.

### 8.1 Button

| Variant | Ground | Text | Border | Shadow | Hover | Use |
|---|---|---|---|---|---|---|
| **Primary** | `bg-inverse` (Ink) | White | — | `shadow-control` | Ground → Royal `#0A2D67` | The one main action per view: **Play in Telegram** |
| **Secondary** | `bg-surface` / transparent | Steel | 1.5px `border-line-strong` | — | Text and border → Royal | Supporting action: "See how wagers work" |
| **Inset** | `bg-inset` (Fog) | Royal, `text-chip` | 1px `border-line` (Silver) | `shadow-control` | Border → Royal | Nav chips, store/platform links (the measured Fold nav chip) |
| **Ghost** | Transparent | Ink | — | — | Ground → Mist | Tertiary actions in toolbars |
| **On dark** | White | Ink | — | — | Ground → Mist | Primary action on Ink or Night surfaces |
| **Link** | — | `text-fg-link` | — | — | Underline | "Read the manifesto →" |
| **Icon** | `bg-surface` | Steel | — | `shadow-control` | Ground → Fog | Close, copy, theme toggle. 8px radius, 8px padding. |

| Size | Height | Padding (x) | Type | Radius | Icon |
|---|---:|---:|---|---|---:|
| sm | 36px (hit area 44) | 14px | `text-button-sm` | pill | 16 |
| md | 48px | 20px | `text-button` | pill | 20 |
| lg | 56px | 28px | `text-button-lg` | pill | 20 |

- **Inset chip size** (measured): 40px high, 7/12 padding, `rounded-control`.
- **Pressed:** `scale(.98)`.
- **Loading:** label stays in place (invisible) with a 16px spinner centered, `aria-busy="true"`, width locked.
- **Icon placement:** leading icon for objects ("Telegram"), trailing arrow for navigation. Arrows flip in RTL.
- **Never:** Signal- or Voltage-filled buttons, gradients, more than one Primary in view, all-caps labels.

### 8.2 Play in Telegram CTA

The conversion component, used in the hero, the sticky nav pill, the mobile CTA bar, the final CTA and pricing.

- **Anatomy:** Primary button with the Telegram logo (monochrome White) + the label **"Play in Telegram"**. Beneath it, a `text-caption text-fg-muted` note: "Free to play · No download".
- **Link:** `https://t.me/<BOT_USERNAME>/app`. `BOT_USERNAME` comes from the backend `TELEGRAM_BOT_USERNAME` (currently defaulting to `FinChess_bot`; the codebase also references `Web3ChessBot`, so confirm the canonical bot before launch, §14.4). Read it from an env var at build time, never inline.
- **`startapp` warning.** The Mini App's home route treats **any `start_param` that isn't `ref_…` or `arena` as a game id** and navigates to `/game?id=…`, in `frontend/src/app/[locale]/home/page.tsx`. So, until the app whitelists a campaign prefix:

  | Parameter | Behaviour |
  |---|---|
  | none | Opens home. **Default for website CTAs.** |
  | `startapp=arena` | Opens matchmaking. Use on "Find a game" CTAs. |
  | `startapp=ref_<code>` | Referral landing pages only |
  | anything else | **Broken.** Don't add `site_*` tracking params until the app ignores an agreed prefix (e.g. `src_`). Track clicks on the website side instead (§12.4). |

- **Desktop behaviour:** the link still works (it opens Telegram Desktop or Web). Next to it, show "or scan with your phone" pointing to the QR dock.
- **In the Telegram in-app browser:** the same link opens the Mini App natively.

### 8.3 Navigation

**Top bar** (static, scrolls away):

- **Layout:** `shell-main`, 88px tall on desktop, 64px on mobile. Logo lockup at the start; inset link chips in the middle; Primary CTA at the end.
- **Desktop links:** How it works · Academy · Premium · Fair play · Blog, plus the language switcher.
- **Active page:** the chip gets a Royal border and `aria-current="page"`.

**Sticky nav pill** (`lg+`, after 480px of scroll):

- Centered, `top: 16px`, `rounded-panel` (24px).
- Ground: Fog at 85% + `backdrop-blur-sm` (8px). This single element is the only blur on the page besides the QR dock.
- `shadow-float`, 8px padding.
- Contents: mark only + 4 text links (`text-body` 600, Ink; active in Royal with a 4px Signal dot below) + a Primary sm CTA.

**Mobile** (<`lg`):

- **Bar:** logo + language icon button + menu icon button.
- **Menu:** a full-height sheet (`rounded-panel` top corners, `z-modal`) containing:
  - Links as `text-heading-md` rows with 56px targets.
  - The language list.
  - A Primary lg CTA pinned at the bottom with `padding-bottom: max(24px, env(safe-area-inset-bottom))`.
- **Behaviour:** focus is trapped inside; Esc and swipe-down close it.

**Language switcher:**

- Inset icon button (globe) → a popover listing the 10 languages **in their own names** (English, Español, Français, Deutsch, Русский, Português, 中文, हिन्दी, العربية, 日本語). The current language is checked.
- Changing language keeps the path (`/de/premium` → `/ru/premium`) and stores the preference in a cookie `NEXT_LOCALE`, matching next-intl.

**Skip link:** "Skip to content", visible on focus, top-start, `z-toast`.

### 8.4 QR dock (desktop) and mobile CTA bar

**QR dock** (`xl+`, every page):

- **Placement:** `position: fixed`, `inset-inline-start: 20px`, `bottom: 24px`, `z-dock`.
- **Breakpoint note:** Fold shows this from `lg`, but at 1024px our content column reaches the viewport edge and the dock overlaps it. Show it from `xl` instead.
- **Look:** 116 × 116px, Mist at 50% + 8px backdrop blur, `rounded-card`, 8px padding. Measured on Fold.
- **Contents:** a 100 × 100px QR code in an `inset-shadow-well` encoding the §8.2 link; a label tooltip on hover reads "Scan to play in Telegram".
- **Expanded on hover or focus** (200ms): the dock grows into a card with "Play on mobile" (`text-heading-sm`), "Scan with your phone camera" (`text-caption text-fg-muted`) and a Copy link icon button.
- **Hidden** when the final CTA section, which has its own QR, is in view.

**Mobile CTA bar** (<`lg`):

- **Appears** after the hero CTA scrolls out of view.
- **Placement:** fixed to the bottom, `z-sticky`, Fog at 92% with a top hairline, padding `12px 16px max(12px, env(safe-area-inset-bottom))`.
- **Contents:** a Primary md CTA at full width.
- **Hidden** while the mobile nav sheet is open or the footer is in view.

### 8.5 Chips, tags, badges

| Component | Spec | Use |
|---|---|---|
| **Feature chip** (measured) | `bg-chip` Paper, 1px `border-line-ghost`, `rounded-pill`, 8/16 padding, `text-chip` Royal, optional 20px Steel icon, 8px gap | Honest claims: "No download", "Free games", "10 languages". Negative-trust phrasing is encouraged. |
| **Filter tag** | Same as the feature chip at 36px high; selected state = Ink fill, White text, `aria-pressed` | Time controls "1+0 · 3+2 · 5+0 · 10+0", FAQ filters |
| **Badge** | `rounded-pill`, 4/10 padding, `text-overline` | **Live** (Loss dot + "Live"), **Beta** (Paper, ghost border, Ink), **New** (Signal Ink text on Paper), **Premium** (Premium text on Paper), **18+** (Ink outline) |
| **Category pill** | Fog fill, Steel icon, `text-overline` Dusk (on Fog 4.60) | Blog categories, Academy tracks |
| **Result chip** | `rounded-pill`, 2/8 padding, `text-label`: "Won" `text-fg-win` on Paper · "Lost" `text-fg-loss` · "Draw" Steel | Match history rows |

### 8.6 Cards and tiles

| Card | Spec |
|---|---|
| **Default card** | `bg-surface`, `rounded-card`, `p-card`, `shadow-card`, no border. Title `text-title`, body `text-body-sm text-fg-muted`, 8px row gap. |
| **Nested card** | `bg-surface` inside a `bg-wash` panel, or `bg-canvas` inside a card; `shadow-nested`, 16px padding. |
| **Interactive card** | Default card wrapped in a link/button with hover lift (§7.3) and a trailing arrow icon. The whole card is clickable, and it contains no other interactive elements. |
| **Bento tile** | `rounded-panel`, 24–32px padding, spans on a 12-column grid. Surfaces: Surface, Signal (1), Voltage (1), Night (1). |
| **Voltage card** | `data-surface="voltage"`, `rounded-card` or `rounded-panel` (bento), `shadow-edge`, content in Abyss at `text-heading-md` 600. One per page. |
| **Signal tile** | `data-surface="signal"`, `rounded-panel`, Ink text. Home: "Scan & play" QR tile in the footer. |
| **Night panel** | `data-surface="night"`, `rounded-panel`, `p-panel`, grain. Holds device mockups or app UI, with `bg-surface` (Night Raised) cards and hairline borders. |
| **Statement card** | No card at all: plain text on Canvas. Not everything is a card. |

### 8.7 Chess and game components

**Match card** (live and recent matches):

- **Container:** default card, 16px padding, 3-row grid.
- **Row 1:**
  - Badge (Live/Finished).
  - Time control in Mono (`3+2`).
  - Stake: `5.00 USDT` in `text-label tabular-nums`, or the "Free" chip.
- **Rows 2–3, one per player:**
  - 32px avatar (initials fallback on Mist).
  - Display name (`text-body` 600, truncated at 1 line, **HTML-escaped**).
  - Rating (Mono, Dusk).
  - Result or clock at the end.
- **Data honesty:** show public data only; respect privacy settings; examples must be labelled "Example" in demos.

**Leaderboard:**

- **Container:** white card holding a table, `shell-wide`.
- **Columns:** # · Player · Rating · Games · Win % · (Winnings USDT, only if the product publishes it).
  - Header in `text-label text-fg-muted`; rows 56px tall with `border-line-soft` dividers.
  - Top 3 get their rank in `text-stat` (1st in Ink on a Voltage wash is **not** allowed, to keep Voltage scarce; use `king` gold for the rank-1 crown icon only).
  - Current season switch: segmented control (Season / All-time).
- **Mobile:** collapses to rank + player + rating, with the rest in an expandable row.
- **States:** skeleton rows (10 × 56px), empty ("The season just started — play to take the first spot"), error (retry).

**Fog Board widget:**

- Square, `max-width: 480px`, `rounded-card` frame, `shadow-card`, colors from §2.5.
- **Modes:**
  - *static FEN*
  - *auto-play PGN* (1.6s per move, pauses on hover or when off-screen)
  - *puzzle* (a player drags or taps a move; correct → Win flash; wrong → Loss flash on the square + "Try again")
- **Engine:** `chess.js` for rules, `react-chessboard` for rendering (both already used in `frontend/`).
- **Accessible alternative:** a visible move list plus a text input for moves ("Type a move, e.g. Nf3").

**Move list:** Mono `notation`, two columns (white/black) with move numbers in Dusk; the current move gets a Mist wash; `ol` semantics.

**Clock:**

- Mono `clock`, `tabular-nums`, in a pill with `bg-surface`.
- The active side has an Ink fill and White digits; under 10s the digits turn `caution`.
- Format: `m:ss`, plus tenths under 10s.

**Wager tier selector (demo):**

- A segmented row of pills: Free · 1 · 5 · 10 · 25 USDT, with example tiers mirroring the app's config.
- Below it: "Winner receives" computed as `2 × stake − commission`, with the commission read from config. A `text-caption` risk note sits directly under it (§10.4).
- On the marketing site this is a **non-transactional demo**. It never takes input that implies a real bet.

**Rating delta:** `+12` in `text-fg-win` / `−8` in `text-fg-loss`, Mono, with a ▲/▼ icon for non-color redundancy.

### 8.8 Money and Web3 components

**Transaction row** (wallet demo on the Night panel):

- Leading 36px icon tile: deposit ↓, withdrawal ↑, wager ♟, winnings 🏆 — as SVG icons, not emoji.
- Title `text-body` 600 + meta `text-caption` (time).
- Trailing amount in `text-body` 600 `tabular-nums`: `+18.24 USDT` in win color, `−5.00 USDT` in default Ink/White (spending isn't a "loss").
- A status chip when not complete: "Pending confirmation" (caution) or "Processing".

**Address chip:**

- Mono `text-label`, truncated middle `UQBt…x7Qk`, `bg-inset`, `rounded-control`, followed by a Copy icon button.
- Toast "Address copied".
- Full value in `title` and `aria-label`.

**Transaction link:** "View on Tonviewer ↗" (`link`, `rel="noopener noreferrer"`, opens in a new tab with an external icon plus visually hidden "(opens in new tab)").

**Fee table:**

- Ledger pattern with Item · Fee · When it applies. Rows: Deposit fee · Win commission · Withdrawal fee · Premium price.
- **Values come from a config endpoint or CMS at build time. Never hard-code.**
- Footnote with the last-updated date.

**Asset marks:** USDT and TON official logos at 20px next to amounts in explanatory sections only (not in every row).

### 8.9 Pricing (Premium)

**Billing switch:**

- Segmented control, `rounded-pill`, Fog track, White thumb with `shadow-control` moving on `spring.snappy`.
- Options: "Monthly" / "Annual", with a "−15%" badge on Annual (real app copy).

**Plan cards (2):**

- **Basic**
  - Default card.
  - Plan name `text-title`, price `text-stat` (accent face) + `/month` `text-caption`.
  - A feature list (Check icons in Steel).
  - Secondary CTA.
- **Premium**
  - Default card with a 1.5px `border-line-strong` in Premium color and a "Premium" badge.
  - Primary CTA "Get Premium in Telegram".
  - **Premium never uses Voltage.**

**Feature rows (from real copy):**

- Play-to-Earn access
- Global ranking sync
- Custom board skins
- Ad-free
- 2× rewards & XP boost
- Priority matchmaking

**Comparison table:** a sticky header row on `md+`; `✓`/`—` with visually hidden "Included"/"Not included".

**Legal line:** "Subscriptions auto-renew until cancelled." (`text-caption`) under the cards.

### 8.10 Content components

| Component | Spec |
|---|---|
| **Section header** | Optional overline → H2 (`text-heading-lg`) → lead (`text-lead text-fg-muted`, ≤36ch). Start-aligned in splits, centered in hero/statement. |
| **Feature list** | 2-column grid on `md+`: 40px icon tile (Fog, Steel icon, `rounded-control`) + `text-title` + `text-body-sm` Dusk. |
| **Stat** | `text-stat` accent face + `text-caption` label beneath. **Real, sourced numbers only**, with a "Last updated" date where they change. No stats is better than invented stats. |
| **Testimonial** | White card, quote `text-body-lg`, 40px avatar, name + Telegram handle (with permission) + rating. Show a "Wall of love" as a masonry of 6–9 cards, real quotes only. |
| **FAQ accordion** | Each item: button row (`text-title`, 64px min height, plus/minus Steel icon rotating 45°, 150ms), panel `text-body text-fg-muted` ≤65ch, `border-line-soft` dividers. Uses `<details>`/Radix Accordion; deep-linkable by `#id`; `FAQPage` JSON-LD. |
| **Tabs** | Underline tabs: `text-body` 600 Dusk → Ink when active, with a 2px Ink indicator sliding 200ms. Arrow-key navigation. |
| **Tooltip** | Ink ground, White `text-caption`, `rounded-control`, 6/10 padding, 150ms fade, 8px offset. Never holds essential information. |
| **Toast** | `rounded-card`, Ink ground, White text, optional icon, bottom-center (above the mobile CTA bar), `z-toast`, `role="status"`. |
| **Modal / Sheet** | Ink backdrop at 40%. Modal: `rounded-panel`, White, 32px padding, max 560px, title `text-heading-md`. Sheet (mobile): top corners 24px, grab handle 36 × 4 Silver. Focus trap, Esc closes, `aria-modal`. |
| **Inputs** | 48px, `bg-surface`, 1px `border-line`, `rounded-control`, `inset-shadow-well`, `text-body`. Label `text-label` above, helper `text-caption` below, error `text-fg-loss` + icon. Focus: border Steel + ring. |
| **Newsletter / waitlist** | Email input + Secondary button in one row (stacked on mobile); consent caption with a privacy link. Success: inline "You're on the list." |
| **Toggle switch** (measured) | 38 × 22, 3px padding, `rounded-pill`; off = Smoke track, on = Ink track; White 16px thumb on `spring.snappy`; `role="switch"`. |
| **Device frame** | See §6.3; a "Toggle theme" Inset chip above the frame. |
| **Article** | `shell-prose`; H1 `text-heading-xl`; meta row (category pill, date, reading time); body `text-body-lg`, 24px paragraph gap; images `rounded-media` breaking out to `shell-content`; blockquote `text-heading-sm` with a 2px Ink start border; code in Mono on Fog. |
| **Breadcrumb** | `text-caption` Dusk, `/` separators, current page Ink; `BreadcrumbList` JSON-LD. |

### 8.11 Footer (bento)

- **Placement:** `shell-wide`, 160px above the footer.
- **Bento row** (12 columns, row-span 2 where noted):
  1. **Signal tile** (4 cols × 2 rows): QR 140px on White with `rounded-card` + "Scan & play" `text-heading-sm` in Ink.
  2. **Voltage tile** (4 × 2): team photo + "Built by chess players" + a Careers link. *(If no real team photo exists, use the move-of-the-day board instead. Never use stock photos.)*
  3. **Statement link** (4 × 2, no tile): "How money moves on Web3Chess." as a `text-heading-md` link → `/trust`.
- **Link columns** (3 on `md+`, accordions on mobile):
  - **Play:** Play in Telegram · Academy · Premium · Leaderboard · Referral program
  - **Company:** Manifesto · Blog · Brand kit · Careers · Contact
  - **Trust:** Fair play · How money moves · Responsible play · Terms · Privacy · Cookie settings
- **Community row:** Telegram channel and chat, X — official links from config only.
- **Legal line:** `text-caption` Dusk with © year, legal entity name, a risk sentence (§10.4), "18+".
- **Language switcher** repeated at the end.

### 8.12 Compliance components

| Component | Spec |
|---|---|
| **Risk note** | `text-caption text-fg-muted` with a 16px info icon: "Wager matches involve real money and you can lose your stake. Play responsibly. 18+." Required directly under **any** mention or demo of wagers, fees or winnings. |
| **Region notice** | Banner above the hero when geo headers indicate a restricted region: Mist wash, `text-fg-caution` icon, `text-body-sm`, dismissible. Copy owned by legal, reusing the app's `RegionPrompt` messages. The **free-play** CTA stays available. |
| **Cookie banner** | Bottom-start card (`rounded-card`, `shadow-float`, max 420px): Necessary-only is the default; "Accept all", "Necessary only" and "Settings" have equal visual weight (Secondary buttons). No analytics fire before consent (§12.4). |
| **Age note** | "18+" badge next to wager features and in the footer. |

### 8.13 Data states (live widgets: leaderboard, live matches, stats)

| State | Treatment |
|---|---|
| Loading | Geometry-matched skeletons: Mist blocks with a slow shimmer (1.6s), static under reduced motion |
| Stale / refreshing | Keep content visible; show a small "Updated 2 min ago" caption |
| Empty | Friendly one-liner + CTA, e.g. "No live games this minute — start one." |
| Error | Keep the section shell; show "Live data is unavailable right now." + Retry (Secondary sm). Never show raw errors. |
| Build-time fallback | Pages are statically generated with the last good snapshot, so the site never renders a blank widget when the API is down |

---

## 9. Pages

### 9.1 Sitemap

Every route is prefixed by locale: `/{en|es|fr|de|ru|pt|zh|hi|ar|ja}/…`

| Route | Page | Primary job |
|---|---|---|
| `/` | Home | Get to the first match |
| `/how-it-works` | How it works | Matchmaking, time controls, free vs wager matches |
| `/academy` | Academy | Daily puzzle demo, mastery tracks |
| `/premium` | Premium | Plans, comparison, FAQ |
| `/fair-play` | Fair play | Rules, anti-cheat approach, disconnects, disputes |
| `/trust` | How money moves | Deposits, balances, commission, withdrawals + confirmation, fees table, Tonviewer |
| `/leaderboard` | Leaderboard | Public season standings |
| `/referral` | Referral program | Economics + "Get your link in Telegram" |
| `/manifesto` | Manifesto | Long-form brand statement |
| `/blog`, `/blog/[slug]` | Blog | SEO, openings, product news |
| `/brand` | Brand kit | Logo downloads, colors, usage |
| `/legal/terms`, `/legal/privacy`, `/legal/responsible-play`, `/legal/cookies` | Legal | — |
| `/play` | QR / deep-link landing | Auto-opens Telegram on mobile; shows QR + CTA on desktop |
| `404`, `500` | Errors | A toppled king + "This position doesn't exist." + Home / Play |

### 9.2 Home, section by section

Headlines are drafts for copy review. Figures in {braces} come from config.

| # | Section | Pattern · surface | Content |
|---|---|---|---|
| 1 | Nav | Top bar | §8.3 |
| 2 | Hero | Poster hero · Canvas | Object cluster (clock, pawns, scoresheet, phone). **"Skill is the only edge."** with the Pawn Tittle on the "i" of *Skill*. Lead: "Real-time chess inside Telegram. Play rated games for free, or put USDT on the board against players at your level." CTA: Play in Telegram + "Free to play · No download". Beta badge if applicable. |
| 3 | Proof chips | Chip field · Canvas | "Runs inside Telegram" · "No download" · "10 languages" · "Free games, always" · "USDT & TON wallet" |
| 4 | Matchmaking | Split (text start) · Canvas | **"Find a game in seconds."** Lead from app copy: close the app and Telegram tells you when an opponent is found. Demo: match card cycling "Searching…" → found; time-control filter tags `1+0 3+2 5+0 10+0`. |
| 5 | Wagers | Split (demo start) · Canvas | **"Put something on the board."** Wager tier selector demo, "Winner receives" maths with {commission}, risk note. Secondary CTA "How money moves" → `/trust`. |
| 6 | Academy | Split · Canvas | **"Train before you stake."** Puzzle-mode Fog Board (daily puzzle, mate in 2) + mastery track chips + "Train against the A.I." |
| 7 | Inside the app | **Night panel** | **"This is the arena."** Light/dark device pair of real Mini App screens (home, game, wallet) + toggle. Bridges to Obsidian Chess. |
| 8 | Progression | Bento · Canvas | **"Every win moves you up."** Tiles: XP and levels · Seasons & leaderboard preview (top 5) · Mystery Vault drops · Board themes. |
| 9 | Money | **Ink band** | **"Your balance, in plain sight."** Transaction rows demo, "Withdrawals confirmed in Telegram", "Every payout verifiable on Tonviewer", fee table link. No custody claims (§1.1). |
| 10 | Premium teaser | Split · Canvas | Two plan cards (compact) + "Compare plans" → `/premium`. |
| 11 | Mission | Statement · Canvas | **"OUR GOAL / To make skill the only thing that counts."** + a short paragraph + "Read the manifesto →". |
| 12 | Philosophy | Toppling king · Canvas | **"YOU KNOW, / It's only a game, after all."** Scroll-scrubbed 6 stages; caption on responsible play. |
| 13 | FAQ | Accordion · Canvas | 6 questions: Is it free? · How do wager matches work? · What are the fees? · How do withdrawals work? · What if I disconnect? · Is it available in my country? |
| 14 | Move of the day | **Voltage** card · Canvas | One position (static FEN) + "Find the winning move — then play it for real." + CTA `startapp=arena`. |
| 15 | Footer | Bento footer | §8.11 |
| — | Persistent | QR dock (desktop) · mobile CTA bar | §8.4 |

**Page budget check:** 1 display headline · 1 Pawn Tittle · 1 Night · 1 Ink · 1 Voltage · 1 Signal (footer) ✓

### 9.3 Other page recipes

- **How it works:** poster hero ("From tap to checkmate.") → a 4-step sequence (open the bot → pick a time control → match → result and rating). Numbered, because it is a real sequence. Then free vs wager comparison → disconnect rules → CTA.
- **Academy:** hero with a live puzzle board → track cards (Beginner / Intermediate labels from app copy) → "Recent analysis" mockup → CTA "Start the daily puzzle" (link: no `startapp`).
- **Premium:** hero "Play with every advantage the rules allow." → billing switch + plan cards → comparison table → Premium FAQ → legal line.
- **Fair play:** prose page (`shell-prose`) — rules, what happens on disconnect/timeout, how disputes work. Only describe mechanisms that exist in the backend; legal review is required.
- **How money moves** (`/trust`): diagram (deposit → platform balance → match stake → winnings → withdrawal → owner confirmation → chain), fee table (§8.8), withdrawal timing expectations, Tonviewer explainer, risk note. Diagram as an inline SVG using Steel lines, `animate-dash` on scroll.
- **Leaderboard:** season switch + table (§8.7) + "Your rank lives in the app" CTA.
- **Referral:** hero "Bring a rival." → how commission works ({referral rate} from config) → example earnings clearly marked "Example" → CTA "Get your link in Telegram".
- **Blog:** index = featured article card (media 16:9) + a 3-column grid of article cards; article per §8.10; related articles; newsletter block.
- **Legal:** `shell-prose`, table of contents sidebar on `lg+`, last-updated date at the top.
- **`/play`:** on mobile, redirect immediately via `location.replace(t.me link)`, with a visible button as fallback. On desktop: a big QR (240px) in a white card + CTA + "Open Telegram Desktop".

---

## 10. Content and voice

### 10.1 Voice

Short. Direct. Chess-literate. Calm about money. A little dry humour, once per page.

| Do | Don't |
|---|---|
| "Find a game in seconds." | "Experience lightning-fast next-gen matchmaking!" |
| "Withdrawals are confirmed in Telegram before they're sent." | "Instant, secure, trustless withdrawals." |
| "You can lose your stake." | "Risk-free earnings." |
| "Play rated games for free." | "Unleash the Alpha." |

### 10.2 Vocabulary

| Use | Avoid |
|---|---|
| game, match, opponent, rating, time control, stake, winnings, commission, balance, withdrawal | combatant, protocols, matrix, degen, jackpot, bet (in headlines), profit, passive income, APY |
| "wager match" | "gambling", "betting" (unless legally required) |
| "Play in Telegram" | "Launch dApp", "Connect to start" |
| Chess terms used correctly (fork, pin, endgame, `3+2`) | Pieces used as decoration without meaning |

### 10.3 Formatting

- **Sentence case** for headings, buttons and navigation. Headlines may end with a period (poster style); buttons never do.
- **Money:** `12.40 USDT`, `0.5 TON`.
- **Percentages:** `3%` (no space).
- **Ratings:** `1,842` (locale-formatted).
- **Time controls:** `3+2`.
- **Dates:** localized via `Intl.DateTimeFormat`.
- **Numbers and currency** always use `Intl.NumberFormat` with the locale. Arabic keeps Western digits.

### 10.4 Money honesty rules

1. **No custody claims** that aren't true: never "non-custodial", "trustless", "your keys", "on-chain games".
2. **No outcome promises:** never "earn", "guaranteed", "passive income" or "profit" as a promise. "Win USDT from opponents" is acceptable next to a risk note.
3. **Every fee and percentage is rendered from config** with a last-updated date. The Mini App copy "3% win commission" is the current value but not a constant.
4. **A risk note** (§8.12) sits under every wager, fee or winnings mention.
5. **Examples are labelled "Example"** when they show amounts, players or balances.
6. **Region and age:** 18+ on wager features; free play is offered to everyone.
7. **Legal review** of `/trust`, `/fair-play`, legal pages and every wager-related headline is required before launch.

### 10.5 Localization

- **Source of truth:** `website/messages/{locale}.json` with ICU plurals. Reuse existing app strings where the meaning is identical.
- **Headline length:** keep the English hero ≤ 30 characters so de/ru fit in 4 lines at 375px.
- **Never** concatenate translated fragments. Pass variables (`{amount}`, `{commission}`).
- **RTL (ar):** `dir="rtl"` on `<html>`, logical CSS, mirrored splits (demo and text swap automatically), `flip-rtl` on arrows. The chessboard is **not** mirrored.
- **hreflang** for all 10 locales plus `x-default` → en.

---

## 11. Accessibility (WCAG 2.2 AA)

- [ ] **Contrast.** Only the approved pairs in §2.1/§2.2. Text ≥4.5:1, large text and UI boundaries ≥3:1. Signal, Hyacinth and Smoke are never text on light surfaces.
- [ ] **Keyboard.** Every interactive element is reachable in DOM order with a visible focus ring; no keyboard traps outside modals; Esc closes overlays.
- [ ] **Semantics.**
  - One `h1` per page and no skipped heading levels.
  - Landmarks: `header`, `nav`, `main`, `footer`.
  - Buttons are `<button>`, links are `<a>`.
- [ ] **Hit areas.** Targets ≥44 × 44px on touch and ≥24 × 24px everywhere (WCAG 2.5.8).
- [ ] **Links.** Inline links are underlined. External links say so. Link text makes sense out of context (no "click here").
- [ ] **Pawn Tittle.** The headline reads correctly to screen readers (sr-only duplicate, §3.5).
- [ ] **Chessboard.**
  - `role="img"` with `aria-label` describing the position, e.g. "Puzzle: White to move, mate in 2".
  - An adjacent move list plus a typed-move input for puzzles.
  - Coordinates are not the only way to identify squares.
- [ ] **Motion.** Reduced-motion variants for every motion (§7.4). No auto-playing content longer than 5s without a pause control: board demos pause on hover and focus and have a Pause button.
- [ ] **Media.** Descriptive alt text on mockups, `alt=""` on decoration, captions on any video.
- [ ] **Forms.** Visible labels, errors tied with `aria-describedby`, no placeholder-only labels.
- [ ] **Language.** `lang` on `<html>` and on inline foreign phrases.
- [ ] **Zoom.** Layout works at 200% zoom and 320px width without horizontal scrolling. Wide tables scroll inside their own container.
- [ ] **Live regions.** Toasts use `role="status"`; live match updates are throttled and not announced every tick.

---

## 12. Performance, SEO, analytics

### 12.1 Budgets (home page, mid-range Android over 4G)

| Metric | Budget |
|---|---|
| LCP | < 2.0s. The LCP element is the display headline text, **never an image**. |
| CLS | < 0.05 (font fallback metrics, fixed media dimensions) |
| INP | < 200ms |
| JS | ≤ 170 KB gz on first load; board and demos lazy-load when near the viewport |
| Fonts | Onest preload only; ≤ 3 families per locale |
| Images | AVIF/WebP via `next/image` with explicit `sizes`; hero cluster ≤ 120 KB total |

**Rendering rules:**

- Blur is limited to the QR dock and the sticky nav pill. No blur on scrolling lists.
- No infinite animations except the Live dot.
- Pages are statically generated (SSG/ISR) for every locale.

### 12.2 Metadata

**Per page:**

- `title` pattern: `{Page} · Web3Chess`. Home: `Web3Chess — Chess in Telegram`.
- Meta description ≤155 characters.
- Canonical URL, hreflang set, OG and Twitter tags using the §6.4 template.
- `theme-color` `#20294C`.

**Site-wide:**

- Manifest and icons derived from the king mark.
- `robots.txt`, and a `sitemap.xml` covering all locales.

### 12.3 Structured data (JSON-LD)

| Page | Schema types |
|---|---|
| Home | `Organization`, `WebSite`, `VideoGame` (genre Chess, `gamePlatform` "Telegram", `applicationCategory` "Game") |
| FAQ sections | `FAQPage` |
| Articles | `Article` + `BreadcrumbList` |
| Premium | `Product` with `Offer` values from config (only if prices are public) |

### 12.4 Analytics

Privacy-preserving (e.g. Plausible, or PostHog with cookieless mode), and **nothing fires before consent** where consent is required.

| Event | Properties |
|---|---|
| `cta_play_click` | `location` (hero, sticky_nav, mobile_bar, final, pricing, footer), `startapp` (none, arena, ref) |
| `qr_dock_expand` | — |
| `qr_dock_copy_link` | — |
| `language_change` | `from`, `to` |
| `faq_expand` | `id` |
| `pricing_toggle` | `period` |
| `demo_interact` | `demo` (puzzle, wager, matchmaking, theme_toggle) |
| `outbound_click` | `domain` |

Attribution is website-side only until the Mini App supports a campaign `startapp` prefix (§8.2).

---

## 13. Tokens in code

**Tailwind v4:**

```css
/* website/src/app/globals.css */
@import "tailwindcss";
@import "../../../design-system/website/theme.css";
```

```tsx
<section className="section-y">
  <div className="shell-content grid gap-6 md:grid-cols-12">
    <div className="md:col-span-5">
      <h2 className="text-heading-lg text-fg">Find a game in seconds.</h2>
      <p className="mt-4 text-lead text-fg-muted max-w-[36ch]">…</p>
    </div>
    <div className="md:col-span-7 rounded-card bg-surface p-card shadow-card">…</div>
  </div>
</section>

<section data-surface="ink" className="section-y">…</section>
```

**Naming conventions:**

- **Primitives** are named after the thing (`ink`, `fog`, `signal`) and used only inside `theme.css` or illustrations.
- **Components** use semantic utilities (`bg-surface`, `text-fg-muted`, `border-line`).
- **Radii** are roles (`rounded-card`), not sizes.
- **Spacing** is the Tailwind scale plus `gutter` / `section` / `card` / `panel`.

**JavaScript values:** `import { motion, board, z, breakpoints } from 'design-system/website/tokens'` (for framer-motion, react-chessboard, canvas).

**Changing a token:**

1. Edit `tokens.json`.
2. Mirror the change in `theme.css` and `tokens.ts`.
3. Update the tables in this file.
4. Re-run the contrast check for affected pairs.

Style Dictionary can automate the mirroring later; for now the three files are kept in sync by hand.

---

## 14. Build plan

### 14.1 Stack

- **Framework:** Next.js 16 (App Router, SSG/ISR), TypeScript, Tailwind CSS 4.1.
- **i18n and motion:** next-intl (same locale set as the app), framer-motion (with `MotionConfig reducedMotion="user"`).
- **UI libraries:** Radix UI primitives, `lucide-react`; `chess.js` + `react-chessboard` for boards (versions aligned with `frontend/`).
- **Media and testing:** `next/og` for OG images; Playwright for visual and accessibility smoke tests (axe).

### 14.2 Repository layout (proposed)

```text
website/                         # new Next.js app — separate from frontend/ (Mini App)
├── messages/{locale}.json
├── public/{illustrations,mockups,brand}/
├── src/
│   ├── app/[locale]/(marketing)/…   # routes per §9.1
│   ├── app/fonts.ts                 # §3.2
│   ├── app/globals.css              # imports design-system/website/theme.css
│   ├── components/ui/               # Button, Chip, Badge, Card, Input, Switch, Segmented, Tabs, Accordion, Tooltip, Toast, Modal, Sheet
│   ├── components/chess/            # FogBoard, MoveList, Clock, MatchCard, WagerTierDemo, RatingDelta
│   ├── components/money/            # TransactionRow, AddressChip, FeeTable, RiskNote
│   ├── components/brand/            # Logo, PawnTittle, TopplingKing, DeviceFrame, QrDock, PlayInTelegram
│   ├── components/sections/         # Hero, Split, ChipField, Band, Bento, Statement, FAQ, Footer
│   └── lib/{config.ts,analytics.ts,telegram-link.ts}
└── e2e/
```

It is a separate app so the Mini App's invariants (safe areas, navbar, static-export CI guard) stay untouched. It deploys as its own Railway service.

### 14.3 Phases

| Phase | Deliverables | Exit criteria |
|---|---|---|
| **P0 Foundations** | App scaffold, `theme.css` import, fonts, next-intl with 10 locales + RTL, layout shell, Logo, SEO base | Specimen page renders in all locales; Lighthouse ≥95 on an empty page |
| **P1 Primitives** | Button (all variants), Chip/Badge, Card family, Input, Switch, Segmented, Tabs, Accordion, Tooltip, Toast, Modal/Sheet, Skip link | Each has all states; axe clean; keyboard verified |
| **P2 Brand and chess** | PlayInTelegram, QrDock + mobile CTA bar, Nav (top, sticky pill, mobile sheet, language switcher), PawnTittle, FogBoard (static/auto-play/puzzle), MoveList, Clock, MatchCard, RatingDelta | Board accessible alternative works; tittle reads correctly to screen readers |
| **P3 Sections** | Hero, Split, ChipField, Night panel + DeviceFrame, Ink band + TransactionRow, Bento, Statement, TopplingKing, FAQ, Footer, RiskNote, CookieBanner | Home assembled with example data; page budget check passes (§9.2) |
| **P4 Pages** | Home, How it works, Academy, Premium, Trust, Fair play, Leaderboard, Referral, Blog, Legal, `/play`, 404/500 | Content reviewed; live data wired with fallbacks |
| **P5 Launch polish** | Illustrations, real screenshots, OG images per locale, analytics + consent, performance pass, QA matrix | Definition of Done met on every page |

### 14.4 Owner decisions (needed before or during P0)

1. **Domain.** `web3chess.online` currently serves the Mini App (root redirects to `/en/home`), and `frontend/src/lib/api.ts` maps that host to the API.
   - **Option A:** move the Mini App to `app.web3chess.online`. This needs a BotFather Web App URL change and an `api.ts` host-mapping update.
   - **Option B:** put the website on a new host.
2. **Canonical bot:** `FinChess_bot` (backend default) vs `Web3ChessBot` (in one lesson share link). Needed for every CTA and QR.
3. **Campaign attribution:** whether the Mini App should ignore a `src_` `startapp` prefix, which would allow website→app attribution (§8.2).
4. **Fonts:** ship the free trio, or buy GT Walsheim Pro + GT America web licenses (confirm Cyrillic coverage).
5. **Illustrations:** commission an illustrator (recommended) or use AI-assisted art with retouching (§6.2).
6. **Legal:** entity name for the footer, region restrictions, and review of wager, fee and trust copy (§10.4).
7. **Public data:** which figures may be shown publicly (leaderboard winnings, player counts) and their API source.
8. **Beta label:** whether "In public beta" appears in the hero.

### 14.5 QA matrix

| Axis | Cover |
|---|---|
| Viewports | 360 · 390 · 768 · 1024 · 1280 · 1536 |
| Browsers | iOS Safari · **Telegram in-app browser (iOS + Android)** · Chrome · Firefox · Samsung Internet · Safari macOS |
| Locales | en · de (long) · ru (Cyrillic) · ar (RTL) · ja/zh (CJK) · hi (Devanagari) |
| Preferences | Reduced motion · 200% zoom · keyboard only · VoiceOver/TalkBack spot check |
| Network | Slow 4G throttle · API down (fallback snapshots) |

### 14.6 Definition of Done (per page)

- [ ] Uses only system tokens and utilities; no raw hex values, no Tailwind default colors.
- [ ] Page budget: ≤1 display headline, ≤1 each of Ink / Night / Voltage / Signal.
- [ ] Every component state implemented; data widgets have loading, empty, error and fallback states.
- [ ] All copy in message files for 10 locales; no concatenation; ar RTL verified.
- [ ] Money copy passes §10.4; risk notes present; fees from config.
- [ ] CTAs use the canonical bot link and only allowed `startapp` values.
- [ ] Accessibility checklist (§11) passes; axe reports zero serious issues.
- [ ] Performance budgets (§12.1) met on a throttled mobile run.
- [ ] Metadata, OG image, JSON-LD and hreflang present.
- [ ] Reduced-motion and 360px layouts reviewed.

---

## 15. Do / Don't

**Do**

- Set the hero at `text-display` (700, −0.03em) and let nothing else compete with it.
- Keep text Ink, secondary Dusk, structure Steel, and shadows navy-tinted.
- Put White cards on Fog with `shadow-card`, and no borders on Canvas.
- Use radius roles: 8 control · 12 card · 16 media · 24 panel · pill for interactive pills.
- Spend Signal on dots, active marks and one tile; spend Voltage once.
- Demonstrate features with real boards, notation and real app UI.
- Render fees from config and add a risk note under every money mention.
- Underline inline links in body copy.

**Don't**

- Use Signal `#459AF8`, Hyacinth or Smoke as text on light surfaces.
- Put White text on Signal or Voltage.
- Add gradients, glows, neon or glassmorphism beyond the two approved blurs.
- Use pure black, grey shadows, or Tailwind default colors.
- Stack more than three surface levels.
- Center paragraphs longer than two lines.
- Use emoji as icons, or chess pieces as wallpaper.
- Claim "non-custodial", "trustless", "guaranteed" or "passive income".
- Add a `startapp` value the Mini App would misread as a game id.
- Import these tokens into `frontend/`.

---

## 16. Agent prompt guide

**Quick reference:** text `#20294C` · canvas `#F0F1F5` · card `#FFFFFF` · hairline `#C7CBDB` · secondary text `#676B89` · link `#1A63BF` · structure/icons `#375390` · accent dot `#459AF8` · shock `#FFFF00` (once) · dark panel `#071A22` · fonts Onest / Golos Text / IBM Plex Mono.

**Example component prompts:**

1. **Hero:**
   > Centered poster hero on `bg-canvas`. `text-display text-fg` headline "Skill is the only edge." with PawnTittle on the i of Skill. `text-lead text-fg-muted` max 36ch, 16px below. 32px below that, a `PlayInTelegram` lg button and a `text-caption text-fg-muted` note "Free to play · No download". Illustration cluster above, `alt=""`. Height from content, never 100vh.
2. **Split feature:**
   > `section-y`, `shell-content`, 12-column grid. Text in 5 columns (`text-heading-lg` + `text-lead text-fg-muted`), demo in 7 columns inside `rounded-card bg-surface p-card shadow-card`. On mobile the text stacks first. Alternate sides on the next section.
3. **Night panel:**
   > `data-surface="night"` `rounded-panel p-panel`, grain on. `text-heading-xl text-fg` "This is the arena." plus a light/dark DeviceFrame pair with a "Toggle theme" Inset chip. Cards inside use `bg-surface` with `border border-line`, no shadows.
4. **Feature chip:**
   > `bg-chip border border-line-ghost rounded-pill px-4 py-2 text-chip text-fg-action`, optional 20px `lucide` icon `strokeWidth 1.5` `text-icon`, `gap-2`.
5. **Match card:**
   > `rounded-card bg-surface p-4 shadow-card`. Row 1: Live badge, Mono `3+2`, stake `5.00 USDT` `tabular-nums`. Rows 2–3: avatar 32, escaped name `text-body font-semibold truncate`, rating Mono `text-fg-muted`, clock pill at the end. Label "Example" when data is not live.

---

*Changelog: 1.0 (2026-09-11) — initial system from the Fold audit, adapted to Web3Chess.*
