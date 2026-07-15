# Marketplace — Audit, Plan & Roadmap

_Owner: PM + UI/UX. Last updated: 2026-07-15._

Telegram Mini App XP marketplace: Mystery Boxes, Premium subscriptions, Board Themes.
Goal: turn the current "incomplete/broken" first pass into a **viral, ultra-premium, modern** experience — with a **unique, eye-catching design for each Mystery Box**.

Files in scope:
- `src/app/[locale]/marketplace/page.tsx` (462 lines — orchestrator)
- `src/components/Marketplace/MysteryBoxCard.tsx` (recolored-but-identical boxes)
- `src/components/Marketplace/UnboxingModal.tsx` (reveal animation)
- `backend/app/api/v1/endpoints/marketplace.py` (`/unbox`, `/purchase`)

---

## 1. Audit findings

### 🔴 Critical (broken / risky)
- [ ] **C1 — All 5 boxes look identical.** `tierStyles` only swaps colors; every box renders the same crystal/vault silhouette. Directly contradicts the "unique design per box" goal.
- [ ] **C2 — `alert()` used for every success/error/insufficient-funds path.** Native browser alerts are jarring inside Telegram WebView and break the premium feel. A toast system already exists in the page — unify on it.
- [ ] **C3 — One-tap Premium purchase with no confirmation.** Tapping a subscription card instantly spends 15,000–120,000 XP (only an alert after). Needs a confirm sheet.
- [ ] **C4 — No affordability gating in UI.** Cards always look enabled; the user only learns they can't afford a box after tapping. Should visually gate + show shortfall.
- [ ] **C5 — Loot-box odds are hidden.** Boxes award real value (Premium) with zero disclosed drop rates. Trust + loot-box-compliance risk. Surface odds per box.

### 🟠 High (quality gaps)
- [ ] **H1 — No i18n.** `useTranslations` is imported but titles, box names, descriptions, and all alerts are hardcoded English. App ships 10 locales; Marketplace is English-only.
- [ ] **H2 — Theme previews hardcoded.** Only `neon` / `wood` / default are handled (page.tsx ~L379); any other theme code silently falls back to gray. Make it data-driven from the backend theme row.
- [ ] **H3 — Raw prize metadata shown to users.** Reveal shows `type` as literal `refund` / `boost` / `cosmetic`; generic icons; no tier-scaled celebration (no confetti, no rarity intensity).
- [ ] **H4 — No loading / empty / error states** for boxes (only themes have a spinner). No skeletons.
- [ ] **H5 — Low-contrast micro-typography.** 9–11px text at opacity 30–40 is on-brand but borderline unreadable; fails accessibility contrast.

### 🟡 Medium (polish / product)
- [ ] **M1 — Marketplace has no post-unbox home.** Prizes go to inventory but there's no "recently won" strip or link to inventory from here.
- [ ] **M2 — XR (real-currency) path is dead in UI.** Backend supports dual currency; frontend hardcodes `selectedCurrency='xp'`. Confirm product intent (XP-only) and document, or wire XR.
- [ ] **M3 — Balance banner is static.** Doesn't react to affordability, no shimmer/animation on change after a spend.
- [ ] **M4 — No haptic/motion choreography** tuned per rarity (legendary should feel bigger than common).
- [ ] **M5 — Seasonal box has no "limited / countdown" treatment** despite being a seasonal drop.

---

## 2. Unique Mystery Box design system (the headline)

Each box gets a distinct **silhouette + material + motion + accent**, not a recolor.

| Tier | Name | Concept | Material / silhouette | Signature motion | Accent |
|------|------|---------|----------------------|------------------|--------|
| common | Bronze — **Novice Crate** | rugged starter chest | riveted wooden crate, banded corners | slow gentle bob | warm bronze `#CD7F32` |
| rare | Silver — **Steel Vault** | secure metal safe | brushed-steel safe + combo dial | metallic sheen sweep | cool silver `#C0C0C0` |
| epic | Gold — **Royal Coffer** | ornate treasure chest | gold-trimmed chest, gem clasp, coins | radiant pulse + sparkle | gold `#FFD700` |
| legendary | Platinum — **Prism Reliquary** | floating diamond monolith | iridescent prism, orbiting light rings | levitation + orbiting particles | prism white/holo |
| seasonal | Genesis — **Ember Relic** | molten limited relic | obsidian orb, fire cracks, ribbon | ember particles + glow throb | ember orange/red |

Shared premium layer: 1px gradient border, layered radial glows, rarity-scaled hover parallax, "?" core, price chip, affordability state, odds toggle.

---

## 3. Roadmap (phased)

### Phase 1 — Foundation & correctness _(ship first)_
- [x] Toast/notification system replaces all `alert()` (C2) → `telegramAlert`/`telegramConfirm`
- [x] Affordability gating on every card + shortfall hint (C4) → `Need {amount} more XP`
- [x] Confirm sheet for Premium purchases (C3) → `telegramConfirm` on unbox + purchase + theme buy
- [x] Loading skeletons + error states (H4) → balance + theme skeletons
- [x] Full i18n pass — extract every string to `messages/*.json` (H1) → `Marketplace` ns × 10 locales

### Phase 2 — Unique box redesign _(the viral moment)_
- [x] Refactor `MysteryBoxCard` to per-tier renderers (C1) → `MysteryBoxArt.tsx` + `boxConfig.ts`
- [x] Build 5 distinct box SVG/CSS art components (§2) — verified live in preview
- [x] Rarity-scaled glow, hover parallax, ambient particles
- [x] Odds/"what's inside" expandable panel per box (C5) → real backend odds in `boxConfig.drops`
- [x] Seasonal countdown + limited badge (M5) → `SeasonalCountdown.tsx` + ribbon

### Phase 3 — Unboxing experience
- [x] Tier-scaled reveal choreography + confetti for epic/legendary (H3) → `INTENSITY` map
- [x] Friendly prize labels + rarity-colored prize card (H3) → `prize_kind_*` + tier theme
- [x] Per-rarity haptics (M4) → `telegramHaptic` scaled by intensity
- [x] "Recently won" strip on marketplace (M1) → localStorage-backed
- [ ] Inventory deep-link from marketplace (M1, follow-up)

### Phase 4 — Polish & product
- [x] Data-driven theme previews (H2) → `THEME_SWATCHES` map w/ neutral fallback
- [x] Animated/affordability-aware balance header (M3)
- [ ] Contrast/accessibility pass (H5) — partial; low-opacity micro-type still to audit
- [ ] Decide + document XR vs XP-only (M2) — currently XP-only in UI (backend supports both)
- [ ] Localize box brand names / reward labels / taglines (i18n follow-up — currently English brand strings)
- [ ] `npm run build:static` + commit `backend/static_frontend` (CLAUDE.md rule) — **ship gate**

---

## 4. Definition of done
- Every box visually unique and premium; unbox feels rewarding and rarity-scaled.
- Zero `alert()`; all feedback via in-app toasts/sheets.
- Every user-facing string localized across all 10 locales.
- Affordability + confirmation guard every XP spend.
- Odds visible before purchase.
- Static export rebuilt; CI `static-export-fresh` green.
