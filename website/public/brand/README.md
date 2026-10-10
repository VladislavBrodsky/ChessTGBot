# Web3Chess vector knight identity

The marketing website uses a custom knight and the full Web3Chess name. The mark shares the page's black and mint palette. It replaces the purple crown and the CHESS / Play-to-Earn lockup.

- `w3chess-mark.svg`: black tile and mint knight for light surfaces.
- `w3chess-mark-inverse.svg`: mint tile and black knight for Ink surfaces.
- `w3chess-symbol.svg`: single-ink open silhouette.
- `w3chess-logo.svg`, `w3chess-logo-inverse.svg`, `w3chess-logo-mono.svg`: portable lockups with outlined lettering.
- `w3chess-symbol.png`: 128px tile for build-time sharing previews.
- `w3chess-avatar.png`: 512px tile for metadata and reusable avatar artwork.
- `src/app/icon.png` and `apple-icon.png`: 64px and 180px metadata icons.

`BrandMark`, `BrandWordmark`, and `Logo` use this same construction. Navigation uses a 40px tile, a 10px gap, and 20px visible lettering. Reserve half a tile of clear space. Preserve proportions; do not add filters, animation, gradients, or shadows.

The native path and eye cutout are in `src/lib/brand.ts`. Outlined Onest 700 lettering is in `src/lib/brand-lettering.ts`. It is normalized to 20px visible height, with -10 font units of letter spacing. The outlines were constructed with FontTools from the official OFL [Onest variable source](https://github.com/google/fonts/blob/main/ofl/onest/Onest%5Bwght%5D.ttf), retrieved 2026-10-08. Keep `OFL-Onest.txt` with redistributed assets.

Run `npm run brand:build` after editing these shared sources. The build script uses installed website dependencies, supports Node 20, and regenerates all active logo exports and icons without a font or image-generation service. Color SVGs contain native geometry, with no embedded raster artwork. PNGs are rasterized from that geometry.

`public/fonts/onest-variable.woff2` is the official variable source restricted to weights 400–700 and compressed with FontTools/Brotli. `barlow-condensed-bold.woff2` is the compressed version of the existing licensed TTF. Next's local font loader serves these files; notation uses the system monospace stack. The original TTFs remain available to sharing previews. Keep both font licenses.

The older `chess-crown-*` assets and `GENERATION.md` are historical sources and are no longer referenced by the website. This change does not upload a Telegram avatar or alter Mini App artwork.
