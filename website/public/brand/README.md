# Website brand assets

The marketing website uses the owner’s text-only direction: **CHESS** with **Play-to-Earn** beneath it. Header, sticky navigation, phone menu, play handoff, footer, and sharing previews share the same outlined lettering. No chess-piece icon accompanies the lockup.

- `w3chess-logo.svg` and `w3chess-logo-mono.svg`: black text on a transparent canvas.
- `w3chess-logo-inverse.svg`: white text on a transparent canvas.
- `w3chess-mark.svg`, `w3chess-mark-inverse.svg`, and `w3chess-symbol.svg`: typographic C initial for metadata, derived from the CHESS lettering.
- `w3chess-symbol.png`, `w3chess-avatar.png`, `src/app/icon.png`, and `apple-icon.png`: rasterized metadata icons at 128, 512, 64, and 180px.

`Logo` and `BrandWordmark` use the same construction as the portable exports. CHESS has a 28px visible height, a 5px gap, and a 12px visible tagline. The total lockup is 86.503 × 45px; reserve 12px of clear space. Use black on light surfaces and white on Ink. Preserve proportions; do not add filters, animation, gradients, or shadows.

Outlined lettering is in `src/lib/brand-lettering.ts`: Barlow Condensed 700 for CHESS and the C initial; Onest 400 for Play-to-Earn. The outlines were constructed with FontTools from the existing licensed `public/fonts/barlow-condensed-bold.ttf` and `public/fonts/onest.ttf`. Keep `OFL-Barlow-Condensed.txt` and `OFL-Onest.txt` with redistributed assets.

Run `npm run brand:build` after editing the shared sources. The build script uses installed website dependencies, supports Node 20, and regenerates exports without fetching a font or using an image-generation service. SVGs contain native geometry; PNGs are rasterized from it. Sharing previews render the vector text directly.

The older `chess-crown-*` assets and `GENERATION.md` are historical sources and are no longer referenced by the website. The product’s metadata and legal name remains Web3Chess. This change does not upload a Telegram avatar or alter Mini App artwork.
