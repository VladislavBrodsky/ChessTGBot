# Telegram + blog image engine

Renders on-brand 1080x1350 / 1080x1080 / 1280x720 images (and 1200x630 blog covers) from a small JSON spec.
Offline and deterministic: the same spec gives byte-identical PNGs. Every render passes a QA gate that throws
a clear error instead of producing a broken image.

```bash
node render.mjs samples/puzzle.json out/puzzle.png     # one image
node preview.mjs                                       # all samples + out/contact-sheet.png
node preview.mjs --matrix                              # every sample at every allowed size (QA matrix)
node preview.mjs --edge                                # edge cases: samples/edge/*.json (_expect ok|fail)
node preview.mjs --all
node build-pieces.mjs                                  # regenerate pieces.json (only needed if react-chessboard changes)
```

```js
import { render, createRenderer } from './render.mjs';
const png = await render(spec, 'out/x.png');           // Buffer; second argument optional
const r = await createRenderer();                      // reuse one Chromium for many images
await r.render(spec1, 'a.png'); await r.render(spec2, 'b.png'); await r.close();
```

Requirements: Node 20+, and `frontend/node_modules` (playwright, chess.js, react, react-dom, react-chessboard) with
Chromium installed. Nothing is installed by these scripts. Override the location with `W3_FRONTEND_NODE_MODULES`.
Errors from `render()` are `QaError` (has `.problems[]`) for layout failures or plain `Error` for bad specs.

## Spec

| field | type | notes |
|---|---|---|
| `template` | string | `puzzle trap poll news culture tip rules product cover` (required) |
| `size` | `portrait` (1080x1350, default) `square` (1080x1080) `wide` (1280x720) | `cover` template is always 1200x630 |
| `headline` | string | required. Rendered uppercase in Barlow Condensed and shrunk to fit. Markup: `*accent*`, `{Ra8#}` keeps its case (use for chess notation), `\n` line break |
| `subhead` | string | optional supporting line |
| `tag` | string | chip in the header (default per template) |
| `cta_label` | string | required. Text in the footer strip, next to the only link shown: `web3chess.online` |
| `footer` | string | optional one-line note above the strip (e.g. "Solution in the next post.") |
| `theme` | `ink` (default) `paper` `mint` | ink = black poster; paper = warm canvas with voltage-yellow markers; mint = rare, celebratory |
| `fen` | string | must be a legal position (validated with chess.js) |
| `orientation` | `white` `black` | default: side to move |
| `highlight` | squares[] | yellow squares, `[]` is fine |
| `arrow` | `{from,to}` | yellow arrow (L-shaped for knight moves) |
| `moves` | SAN[] | see per template |
| `options` | `[{label,square}]` | poll, 2-3 entries |
| `steps` | string[] | tip (2-4), product (exactly 3) |
| `stake` | number | rules |
| `reveal` | bool | puzzle answer variant |
| `_anything` | any | keys starting with `_` are ignored (notes). Any other unknown key is an error |

Per template:

* **puzzle** `fen` required. Board is the hero; side-to-move pill (header on stack sizes). `reveal: true` + `moves` (legal
  solution, replayed from `fen`) draws the arrow and a "Solution 1. Ra8#" chip; `arrow` overrides.
* **trap** `fen` (critical position) + `moves` (2-12 SAN chips; last chip is highlighted, or set `trap_index`). Optional
  `start_fen` replays `moves` and requires the result to equal `fen`. `move_number`, `first` set chip numbering.
* **poll** `fen` + `options` (letters A/B/C go on the target squares; labels <= 24 chars).
* **news** `subhead` (our own summary, required) + `source` (outlet name, rendered "Source: X"); optional `fen` for the
  board texture. Do not state facts you have not verified; this template is for our take.
* **culture** `panels: [{label, text, piece}, {...}]` (`piece` = K Q R B N P, or `wN`/`bP`; colour auto-contrasts).
* **tip** `steps` 2-4 short items; optional `fen` (+`arrow`, `highlight`) draws a small board (portrait/square only).
* **rules** `stake` -> pot = 2x -> winner receives 95% (3% platform + 2% referral). Constants mirror
  `website/src/lib/config.ts` `SETTLEMENT`; amounts must be whole cents. The line "USDT matches are for adults (18+)
  where permitted. You can lose your stake." is always rendered and cannot be removed. Also shows net win / loss.
* **product** `steps` (3 titles) around the website's 3D sculpture. If the image mentions USDT matches, put the 18+ line in `footer`.
* **reward** `steps` (exactly 3, 1–40 characters) + `reward_note` (1–120 characters). Ink theme only, using the game's existing Epic chess-chest art. The reward note must include the advertised odds; the caption must include qualification, duplicate handling, and virtual-only terms. `marketing/engagement/render-kit.mjs` exports the release kit in portrait, square and wide sizes. Never publish a free-box claim before the live campaign contract is enabled.
* **cover** 1200x630 blog cover: `tag` = category, `headline` = title, optional `fen` (else the sculpture).

## QA gate (render fails with a list of problems)

Headline/text that does not fit at its minimum size or exceeds max lines; any element overflowing its box; anything
outside the 56px safe margin (text is measured by glyph ink, not just boxes); overlapping text; chip rows over their row
limit; WCAG AA contrast for every text node (3:1 large, 4.5:1 body, opacity included); text below the size floor
(portrait/square 22px, wide 20px, cover 17px); board squares < 28px; missing fonts; any non-`file:`/`data:` request; illegal
FEN or SAN; inconsistent trap line; unsupported poll/steps counts; stakes that do not split into cents.
Expected-failure examples are in `samples/edge/fail-*.json`.

## Design rules

* **Look**: Concrete Poster pushed harder. Black poster canvas (ink) or warm canvas (paper), oversized Barlow Condensed
  Bold caps, Onest 500-700 for everything else, a high-contrast board as the hero, layered depth (soft gradients, faint
  board motif, grain via SVG noise, 1px light edge highlights, soft shadows), tight 56px frame.
* **Colour** (`design-system/website/tokens.json`): carbon `#000`, paper `#fff`, canvas `#e5e5e5`, mist `#f3f3f3`,
  ash `#c6c6c6`, smoke `#979797`, slate `#444`, mint `#d1ffca`, voltage `#fff100`. **Mint = brand/go**: accent word,
  tag chip, CTA strip. **Yellow = attention**, small areas only: highlighted squares, arrows, solution chip, trap stripes,
  winner payout, step discs. Board squares are `#f3f3f3` / `#979797` as in the game's board tokens.
* **Grid**: 56px safe margin on all sides; header row, flexible body, CTA strip. Stack sizes (portrait/square) go
  headline -> hero -> extras; split sizes (wide/cover) put text left and a square hero on the right with the strip
  spanning the bottom.
* **Type scale** (px): headline fitted between max and min per size - portrait 168-66, square 140-56, wide 120-48, cover
  100-44 (templates start lower so the hero keeps room); subhead 34/30/28/24; chip 24/22/20/17; CTA 34/30/27/22; URL 26/24/22/19;
  board coordinates 24/22/20/17. Headlines <= 2 lines on board posts (3-5 on news/product), line-height .9.
* **Boards**: integer pixel squares (crisp edges), 8 coordinates in the frame ring, piece art scaled 1.1x inside the square.
* **Logo**: `website/public/brand/w3chess-logo*.svg` (knight tile + Web3Chess wordmark), inverse on ink.

## Pieces (`pieces.json`)

`build-pieces.mjs` renders react-chessboard's `defaultPieces` (the same art the game shows) with `react-dom/server`
into 12 `<svg viewBox="0 0 45 45">` strings (keys `wP wN wB wR wQ wK bP ...`). The engine strips the wrapper and ids and
draws them inline. Licence/provenance: `licenses/PIECES.txt` (react-chessboard is MIT; the artwork looks like the
Cburnett set, which needs attribution - recorded there, legal sign-off recommended).

## Adding a template

1. Create `templates/<id>.mjs` exporting `{ id, defaults:{theme,tag}, required:[...], extraFields:[...], sizes?, defaultSize?, validate(spec), build(spec,{size,themeName}) }`.
   `build` returns `{ lead, hero, after, headExtra, bgExtra, css }` as HTML strings (see `puzzle.mjs`). Use `h1()`, `subhead()`,
   `boardHtml()` and the `data-*` hooks: `data-fit` (+`data-fit-max/min/lines`, `data-fit-fill`), `data-nowrap`, `data-max-lines`,
   `data-max-rows`, `data-safe`, `data-bg` (contrast background), `data-bleed` (decorative, exempt), `data-overlap-ok`.
2. Register it in `templates/index.mjs`.
3. Add `samples/<id>.json`, run `node preview.mjs --all` (the matrix renders it at every size) and add edge cases if needed.
4. Add its fields to this README.

## Files

`render.mjs` engine + CLI - `preview.mjs` samples/matrix/edge/contact sheet - `build-pieces.mjs` - `pieces.json` -
`lib/` (`frame.mjs` sizes, themes, base CSS; `board.mjs`; `chess.mjs`; `assets.mjs`; `ui.mjs`; `page.js` in-page fitting + QA) -
`templates/` - `samples/` (+`edge/`) - `licenses/` - `out/` (generated; only `contact-sheet.png` is tracked).

## Licences

Fonts: SIL OFL (Barlow Condensed, Onest). Pieces: see `licenses/PIECES.txt`. Logo/sculpture: Web3Chess artwork.
Details: `licenses/FONTS-AND-BRAND-ASSETS.txt`.
