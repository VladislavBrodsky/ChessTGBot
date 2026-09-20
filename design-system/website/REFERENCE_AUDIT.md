# Fold Reference Audit

**Reference:** Refero Styles: *Fold, "Bauhaus poster on fog"* (`styles.refero.design/style/4d1d50ff-18b8-4acf-a356-48eb5c414711`). Source site: https://fold.money
**Audited:** 2026-09-11
**Feeds:** [`DESIGN.md`](DESIGN.md). This file explains *why* the Web3Chess website system looks the way it does.

## Method

1. **Refero export read in full:** the extended DESIGN.md, the Tailwind v4 export and the CSS-variables export.
2. **Live site measured:** fold.money loaded in a browser at a **1024px-wide viewport**.
   - `getComputedStyle` sampled on every element, with frequency counts for text colors, background colors, radii, box-shadows and font-size/weight pairs.
   - Targeted reads of headings, paragraphs, nav, chips, fixed/sticky elements, images (sources, sizes, alt text), transitions and keyframe names.
3. **Contrast computed:** WCAG 2.2 contrast ratios for every text/background pairing the reference actually uses.

> Only one desktop width was measured. Fold's mobile layout was not measured, so every mobile rule in DESIGN.md is our own decision.

---

## 1. Why the look works: the load-bearing ideas

1. **Poster-scale headline.** One 100px / 700 headline with tight tracking makes the page read like a poster, not a web app. Nothing else on the page comes close in size.
2. **One ink, many tints.** Text, borders, icons and even shadows all come from one navy family (`#20294C`). Shadows are `rgba(32, 41, 76, …)`, so elevation never turns grey or dirty.
3. **The 5% lift.** Cards sit on a Fog canvas (`#F0F1F5`) as white surfaces. They separate through lightness plus a soft navy shadow, not borders.
4. **Achromatic discipline, then a shock.** The page is nearly colorless. Electric Blue and Voltage Yellow appear in two or three deliberate places, so they land hard.
5. **One joke, placed precisely.** The emoji in the hero *replaces the dot of the "i"* in "painfully". It is a letter part, not decoration beside the text.
6. **Objects, not stock.** The page uses hand-drawn object illustrations and vernacular icons only its audience would recognize (tea glass, autorickshaw, Swiggy). There is no photography except the team photo.
7. **Demonstrate, don't describe.** Features are shown through interactive demos (search, theme toggle) and real-looking UI cards.
8. **Air.** Content columns are 928–1024px inside a full-bleed canvas, sections are tall, and the page is 13,044px long at 1024px.

---

## 2. Refero's claims vs. the measured site

| Property | Refero says | Measured on fold.money | What Web3Chess uses |
|---|---|---|---|
| Hero tracking | −12.5px (−0.125em) | **−3px (−0.03em)** | −0.03em. Refero is off by 4×; −0.125em would make glyphs collide. |
| Hero line-height | 0.91 in one table, 0.85 in another | **85px = 0.85** | 0.85 |
| Section H2 | 64px, −2.56px, lh 0.85 | **48px / 700 / 52px / −1.44px** on most sections; 64px / 700 / 64px / −1.92px on two | Two section steps, both −0.03em |
| Heading tracking | −0.03em to −0.04em, varies by size | **−0.03em on every heading from 24px to 100px** | One `poster` tracking token |
| 42px heading | GT Walsheim Pro 500 | 42px / 500 exists, but set in **GT America** (2 uses) | `stat` step in the accent face |
| Body size | 18px / 600 "body", 16px "body-sm" | **17px dominates** (17/600 ×26, 17/400 ×22). Leads are 24/400/36; secondary paragraphs are 16/400/24 in Dusk | Body = 17px |
| Tags | 10px / 600 uppercase, +0.4px | Feature chips are **18px / 600 `#0A2D67` on `#FAFAFA`**, with a 1px border in Hyacinth at 50%. 10px appears only in tiny labels | Chips 18px; 12px minimum for labels |
| Radii | "Only 12px and 9999px" | **12px (31 elements), 8px (20), 9999px (19), 24px (14), 16px (8), 20px (4)**, plus 40px, 36px top-only and 33px | Seven radius roles (DESIGN.md §5.2) |
| Navigation | Sticky pill, 24px radius, 32/16 padding, Electric Blue active state | **Not sticky, no pill.** A row of separate link chips: Fog fill, 1px `#C7CBDB` border, 8px radius, 7/12 padding, 18px / 600 `#0A2D67`, sm shadow; hover border turns `#0A2D67` | Keep the chips. A sticky condensed pill after the hero is **our addition**. |
| Fixed elements | "Persistent QR module" | **The only fixed element.** Bottom 24px, left 20px, 116×116, `#DDDFE9` at 50% with an 8px backdrop blur, 12px radius, 8px padding, z-index 50; QR image 100×100 | QR dock, desktop only |
| Page width | 1200px | Content 928 / 976 / 1024px; footer 1200px; mobile width `calc(100vw − 48px)` | Main 1024px, wide 1200px, 24px mobile gutter |
| Flatness | "Strictly flat, no patterns" | A **noise texture** (`bg-noise`) on the dark `#071A22` mockup panel and on the hero's tittle dot | Grain allowed on Night panels and the tittle only |
| Electric Blue | "Never fills a button or large surface" | **Fills a 309×420 "Scan & Download" footer tile** with a 24px radius | One Signal tile per page, with ink text |
| Voltage Yellow | 12px-radius highlight card | One **24px-radius "Team" bento tile** with the team photo | One Voltage moment per page |
| Dark surfaces | Abyss `#042939` for illustration borders only | A **full-width Ink `#20294C` band** (web dashboard section, white 64px headline), plus `#071A22` and `#103645` panels | Two dark surfaces: Ink band and Night panel |
| Primary CTA | Navy filled pill, 16/12 padding | The landing page has **no filled navy CTA**; conversion runs through the QR dock and store chips. The only other button is a small "Play" pill (Fog fill, 1px Hyacinth border, 8/12) | Web3Chess needs a real CTA, so we keep Refero's ink pill spec |
| Colors missing from Refero | — | **`#0A2D67`** royal navy (×25: chip and nav text, hover borders), `#FAFAFA` chip fill, `#DCE1E9`, `#071A22`, `#103645`, `#3B9DFB` | Added to the palette |
| Motion | Not documented | Tailwind default **150ms `cubic-bezier(.4,0,.2,1)`**; links 100ms; emoji **75ms `cubic-bezier(.06,.94,.67,1.01)`** at −12°; keyframes `opacity`, `scaleUp`, `reveal`, `dash` (SVG line draw), `pulse`; 500ms transforms on mockups; 200ms opacity theme swap | Motion tokens (DESIGN.md §7) |
| Imagery | "3D-style rendered objects" | The hero art is a **hand-drawn** colorful illustration (its own alt text says so); categories use flat SVG icons | Hand-drawn object style |
| `theme-color` meta | — | `#20294C` | Ink |

---

## 3. Details Refero missed entirely

- **The "i" tittle.** In "Be 😜 painfully aware." a 24px Fog circle with grain covers the dot of the "i" (top 18%, left 30% of the word). The emoji scales in on top of it using the `scaleUp` keyframe, a 75ms springy ease and a −12° rotation. Web3Chess adapts this as the **Pawn Tittle** (DESIGN.md §3.5).
- **Light/dark mockup pairs.** Product screenshots ship in both app themes, switched with a "Toggle Theme" control that cross-fades over 200ms.
- **Live demos inside the page.** A "Show Next Search Item" button cycles a working search UI.
- **Trust stated as what the product *doesn't* do.** Negative chips such as "No Email scraping" and "No SMS scraping".
- **Bento footer.**
  - A blue QR tile.
  - A yellow team tile with a photo.
  - "Our approach to Privacy." set as a 32px / 700 heading-sized link.
  - Three link columns and a legal line, with 300px of space above the footer.
- **Overline-in-headline.** "OUR GOAL" and "YOU KNOW," are set in uppercase *inside* the H2 at the same size, not as small eyebrows.
- **Descriptive alt text.** Every product mockup has multi-sentence alt text; decorative icons have `alt=""`.
- **Small controls.**
  - Toggle switch: 38×22, 3px padding, 33px radius, Smoke track.
  - Icon button: white fill, 8px radius, 8px padding, sm shadow.
  - Beta pill ("Early Alpha"): `#FAFAFA` fill, Hyacinth border at 50%, 8/16 padding, 17px / 400.

---

## 4. Contradictions inside the Refero document

1. **Midnight Navy's role.** It is described as a "violet text accent… do not promote it to the primary CTA color", while the component spec makes it the filled primary button. This is a copy-paste error: navy is the text and CTA ink.
2. **Electric Blue as a fill.** The agent guide lists "primary action: #459af8 (filled action)", but the Do's say Electric Blue "should never fill a button or large surface".
3. **Line-heights.** Display line-height is 0.91 in the type table but 0.85 in the scale preview. heading-lg has the same 0.85 vs 0.91 split.
4. **Body weight.** The table sets `body` at weight 600; the Don'ts say body copy is "18px weight 400 in Dusk".
5. **Radii.** The rules allow only two radii, but the CSS export defines 8, 12, 16, 20, 24, 33, 36, 40 and 9999px.
6. **Tracking.** The export lists −0.125em (hero), −0.040em (64px) and −0.030em (24–32px). The measured value is −0.03em everywhere.
7. **Patterns.** "No patterns" conflicts with the noise texture in production.

---

## 5. Accessibility findings (WCAG 2.2 AA)

| Text / background | Ratio | Normal text (4.5) | Large text (3.0) | Where Fold uses it |
|---|---:|:---:|:---:|---|
| Ink `#20294C` / Fog `#F0F1F5` | 12.55 | ✅ | ✅ | All primary text |
| Royal `#0A2D67` / Paper `#FAFAFA` | 12.70 | ✅ | ✅ | Chips, nav chips |
| Steel `#375390` / Fog | 6.64 | ✅ | ✅ | Icons, outline buttons |
| Dusk `#676B89` / Fog | 4.60 | ✅ (barely) | ✅ | Secondary copy |
| Dusk / Mist `#DDDFE9` | 3.91 | ❌ | ✅ | Must be avoided |
| Smoke `#979DB5` / Fog | 2.38 | ❌ | ❌ | "Currently in public beta", 18px |
| Hyacinth `#788DBA` / Fog | 2.95 | ❌ | ❌ | Borders only; also fails the 3:1 non-text minimum as a sole boundary |
| Electric Blue `#459AF8` / Fog | 2.57 | ❌ | ❌ | **Every text link**, including 16px body links |
| Electric Blue / White | 2.90 | ❌ | ❌ | Links on cards |
| White / Electric Blue | 2.90 | ❌ | ❌ | "Scan & Download" 24px text on the blue tile |

Other issues:

- 10px text sits below a comfortable reading floor.
- Inline links inside Dusk paragraphs differ by color alone (WCAG 1.4.1).
- Scroll animations (falling coin, reveal) need a reduced-motion path; this was not verified on the live site.

**Fixes adopted in the Web3Chess system:**

- **Link color:** text links use **Signal Ink `#1A63BF`**: 5.20:1 on Fog, 5.86:1 on white.
- **Link underlines:** links inside paragraphs are always underlined.
- **Smoke:** used only on dark surfaces (6.62:1 on Night).
- **Hyacinth:** borders only.
- **Colored tiles:** ink text on Signal (4.88:1) and on Voltage (13.19:1).
- **Label size:** 12px minimum.
- **Reduced motion:** every motion has a reduced-motion variant.

---

## 6. Page anatomy (top to bottom, 13,044px tall at 1024px)

1. **Nav row.** Lowercase "fold" wordmark (24px / 700, Dusk) and link chips.
2. **Hero.**
   - Hand-drawn object cluster.
   - 100px headline with the emoji tittle.
   - 24px / 400 lead paragraph.
   - "Download Fold app" at 24px / 600 in Dusk, plus "Currently in public beta" and the QR code.
3. **Trust block.** A phone-frame illustration with a lock; explains the regulated bank-connection rails.
4. **Mockups.** iOS and web screenshots with the light/dark toggle.
5. **"Stop recording expenses manually."** 48px H2 plus the negative chips.
6. **"More than a row in a spreadsheet."** Category icons, a merchant map with pins, a transaction card.
7. **"Search. Recall Filter"** Interactive search demo.
8. **"Inform & Delight."** 64px H2, an analytics mockup and a feature list.
9. **Ink band.** "Never visit your Bank's website again." in white at 64px, with a browser mockup, an "Early Alpha" pill and a feature grid.
10. **Mission.** "OUR GOAL / To separate anxiety from money." at 48px, with a banknote illustration and a manifesto link.
11. **Philosophy.** "YOU KNOW, It's just money, after-all." with a coin falling in 6 stages.
12. **Bento footer.** Blue QR tile, yellow team tile, privacy heading-link, link columns, legal line, © line.

**Rhythm:** every section pairs **one poster sentence with one demonstration**.

---

## 7. Keep / adapt / reject for Web3Chess

**Keep (measured values):**

- Palette hex values.
- −0.03em poster tracking.
- The 100 / 64 / 48 / 32 / 24px heading steps.
- The navy-tinted shadow set.
- Radius roles 8 / 12 / 16 / 24 / 9999px.
- Link-chip nav, QR dock, Ink band, bento footer.
- 150ms standard easing and the 75ms pop ease.
- Light/dark mockup pairs, negative trust chips, alt-text discipline.

**Adapt:**

| Fold | Web3Chess |
|---|---|
| Emoji tittle | **Pawn Tittle**: the dot of an "i" becomes a pawn head. A pawn is literally a stem with a ball on top. |
| Falling coin, 6 stages | **Toppling king**, 6 stages: laying down your king is how a chess player resigns. |
| Lifestyle objects (pizza, tea glass) | Chess and Telegram-native objects: clock, scoresheet, pawn, trophy, USDT coin, paper plane |
| Electric Blue | **Signal**: reads as native to Telegram and TON |
| Voltage Yellow | One **"move of the day"** moment per page, echoing the gold king logo |
| `#071A22` mockup panel | **Night panel**: the visual bridge to the dark Obsidian Chess Mini App |

**Reject or fix:**

- Electric Blue as link text (fails AA).
- Smoke or Hyacinth text on light surfaces.
- White text on Electric Blue.
- 10px labels.
- Inline links distinguished by color alone.
- Refero's −0.125em tracking and "two radii only" rule.
- The missing primary button: Web3Chess needs **Play in Telegram**.

**Do not copy:**

- Fold's illustrations, screenshots, headlines, wordmark or team photo.
- The literal "Be 😜 painfully aware." execution.

We adopt **techniques and measured values, never assets**. GT Walsheim Pro and GT America are commercial Grilli Type fonts that require a web license. DESIGN.md defaults to free Google-hosted substitutes with Cyrillic coverage.
