# Web3Chess campaign templates

Open `studio.html` in a browser. It runs locally without an account, installation or network requests. Keep the adjacent files together; alternatively extract `exports/w3chess-campaign-kit.zip` and open its `studio.html`.

Select a family and format, edit the hook/support/label/action, choose a brand surface, and download a PNG or SVG. Save settings to move a draft between computers. The safe-area overlay is for preview only and never appears in exports. The caption is a starting point; review it when you change the visual message.

## Included

- Seven campaign families × four layouts = 28 base images.
- Puzzle answer card × four layouts = 4 additional images.
- Eight extra 9:16 compositions for the conservative Reels guide, including the puzzle answer.
- 40 final-resolution PNGs and 40 SVG sources with embedded fonts and artwork.
- Editable local studio, collection preview, format preview, campaign playbook and export manifest.
- Current open violet rook / outlined CHESS lockup, Barlow Condensed Bold, Onest, contextual 3D sculpture family, and the existing vendored Phosphor regular icon pack. Licenses are included.

## Architecture

`campaigns.js` holds copy, verified destinations, measurement goals and format definitions. `renderer.js` composes a scene graph per format. Its semantic layers are background, brand, hook, proof, action. Native canvas and SVG exports share the same scene; rendering never crops a single master. Text is measured with the bundled fonts. Headline height determines the next row; artwork and proof receive their own space above the action. PNG and SVG use the same measured alphabetic baselines. Headlines fit within a bounded type scale; badge labels keep their fixed type size and wrap or move to a new row. Overlong content blocks exports instead of disappearing silently. PNG is the authoritative final rendition. SVG retains text and named groups; some design editors ignore embedded fonts and require Barlow Condensed Bold and Onest installed from `website/public/fonts/`.

`build-assets.mjs` bundles the existing marketing tokens, fonts, mark, icons and artwork into `assets.js`. `studio.js` handles local editing, persistence and export. Brand data is self-contained; the studio does not upload campaign content or contact external services. Rebuild assets when their source changes. Re-export the pack afterwards.

The public marketing palette comes from `design-system/website/tokens.json`, with the current shipped Concrete Poster conventions in `design-system/website/DESIGN.md`. These templates are marketing artifacts outside `frontend/`. The accompanying badge audit updates the website and game badge primitives separately, using each product’s own tokens. It includes actual-component fixtures and browser measurement evidence.

| Canvas | Production resolution | Composition | House safe area |
| --- | --- | --- | --- |
| 1:1 | 1080 × 1080 | Hook → compact proof row → action | 64px outer guide |
| 4:5 | 1080 × 1350 | Hook → expanded sculpture / proof → action | 64px outer guide |
| 9:16 | 1080 × 1920 | Central message stack; generous UI bands | Story: x72–1008 / y250–1570; Reels: x72–936 / y270–1248 |
| 16:9 | 1920 × 1080 | Copy / action left; large evidence right | 96px sides / 72px top and bottom |

Safe areas are internal working envelopes, not universal platform certification. Select **Story** or **Reels / short video** when working in 9:16. The default Story reserves 250px above and 350px below. Reels reserves 270px above, 672px below, and a 144px right rail. The entire foreground is protected, including proof cards, art, icons, board coordinates and stake terms; there are no exempt footer slogans or numbers. Guides are on by default and shaded outside the protected box. They are never exported. A 24px internal inset gives all foreground elements extra breathing room inside the guide.

Check the selected platform’s current preview with the actual caption, sticker, CTA and disclosure. [TikTok’s official specifications](https://ads.tiktok.com/resources/help/article/tiktok-auction-in-feed-ads?lang=en-GB) explain that caption length and additional formats change safe zones. These files are static images/keyframes; a video placement requires a finished video. See [the layout audit](AUDIT.html), `exports/safe-zone-proof.png` and `exports/placement-preview.png`.

The current website open violet rook and outlined CHESS wordmark come directly from `website/public/brand/`. Barlow is reserved for poster headlines. Canvas, paper and ink are the authoring surfaces; mint stays in small accents, and obsolete full-canvas mint/yellow saved themes migrate to paper without deleting saved copy.

The PNGs are static social images or video keyframes. Motion direction is in `playbook.html`; no finished videos or soundtracks are included. Match promotions retain stake terms. Free practice never claims cash rewards. No invented testimonials, user counts, prizes, guarantees or campaign deep-link IDs are supplied.

## Rebuild / verify

Use the Node runtime and packages returned by Codex’s workspace dependency loader. Run `node marketing/templates/build-assets.mjs`, then `node marketing/templates/export-pack.mjs`. If the runtime cannot resolve its packages, set `W3_NODE_MODULES` to that bundled runtime’s `node_modules` directory. The exporter uses Playwright and JSZip from the runtime. It launches a local headless browser, rejects external requests, renders every scene, and verifies text fit and the complete foreground against the selected guide, component separation, three surfaces, both hooks, and deliberate failures for unsafe proof/art/logo/icons/terms, collisions and overlong copy. The studio is also inspected in the actual browser at 320px and 390px. `exports/qa-report.json` records the image checks. `exports/ui-qa-report.json` records the actual browser controls, viewport widths and guide alignment; the exporter includes this separate record when available.

Puzzle source: `website/src/content/challenges.ts`, `back-rank` position (`6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1`). White plays `Ra8#`. Product copy and destinations follow `website/src/content/home.ts`, `website/src/lib/config.ts`, and the friend-invite flow. Re-check those sources when product facts change.

## Badge rules

One passive campaign label belongs in the header. It uses Onest 30px/500, a fixed 30px Phosphor icon, 10px icon gap, 20px inline padding and a minimum 54px height. It keeps at least half a mark of clearance from the logo. A label that cannot fit beside the logo moves to its own row; text and icons never shrink to squeeze beside another element. The measured row determines the headline position. Badges are included in all foreground bounds and component collision checks. Supporting proof rows keep neutral text rather than repeated mint tags. The canonical website rules are in `design-system/website/DESIGN.md` §8.5.


The broader badge verification is in `exports/badge-qa-report.json`. Run `node marketing/templates/build-badge-audit.mjs` after the game static build to regenerate the isolated component samples (set `W3_WEBSITE_STATIC` to the current website build’s static directory). Check those fixtures through the browser at 320, 390 and 1280px and update the measurement report, then run `node marketing/templates/check-badge-qa.mjs` to verify geometry and measured contrast. The audit fixture contains test labels, not account states.
