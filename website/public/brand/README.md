# CHESS sculpted crown identity

The marketing website uses a generated violet chess crown with restrained 3D depth, following the owner’s revised direction and the Telegram crown identity. The Mini App and Telegram avatar are separate brand surfaces.

- `w3chess-symbol.svg`: the open generated crown, with its PNG embedded for portability.
- `w3chess-mark.svg`: the contained color avatar, transparent outside its rounded tile.
- `w3chess-logo.svg`: transparent lockup for light backgrounds; lettering is outlined.
- `w3chess-logo-inverse.svg`: transparent lockup for dark backgrounds; lettering is outlined.
- `w3chess-logo-mono.svg`: single-ink lockup for print or monochrome use.
- `w3chess-avatar.png`: 512 × 512 color mark, suitable as a reusable avatar asset.

The website uses `BrandMark`, `BrandWordmark`, and `Logo`. The same violet crown and lilac bevel highlights appear on light and dark backgrounds. The contained avatar is reserved for avatars, favicon, and touch icon. Asset paths, a simplified single-ink silhouette, and copy are in `src/lib/brand.ts`; outlined lettering is in `src/lib/brand-lettering.ts`; brand colors are in the website tokens. Preserve proportions and clear space equal to half the symbol box width. Do not add glow, shadows, animation, or stretch the mark.

Wordmark: `CHESS`, the website's Barlow Condensed 700 display font, −0.01em tracking, normalized to a 28px visible height (26px on phones). The second line reads `Play-to-Earn` in Onest 400 at 12px, 0.035em tracking. Outlines use font kerning. The SVG lettering is shared with the browser and sharing previews so it never swaps with a fallback font. The wordmark outlines come from the existing `public/fonts/barlow-condensed-bold.ttf`; the tagline comes from [Google Fonts Onest](https://github.com/google/fonts/tree/main/ofl/onest), variable weight instantiated at 400. Preserve `OFL-Onest.txt` and `OFL-Barlow-Condensed.txt` with redistribution.

`CHESS` is the public visual wordmark. Full `Web3Chess` remains the legal, domain, and SEO name; export filenames retain the existing prefix for compatibility.

Run `npm run brand:build` from `website/` after changing the crown master, lettering sources, or brand colors. This rebuilds optimized artwork, SVG exports, the 64px PNG favicon, the 180px touch icon, and the 512px avatar from the shared construction. It uses the installed website dependencies and supports the project's Node 20 deployment runtime. Browser lettering has an adjacent accessible name, and every mark reserves its dimensions. Color SVGs embed raster artwork; the single-ink export remains a native vector.

These files do not change the live Telegram avatar or the Mini App branding.

## Generated artwork

- `chess-crown-source.png`: 512px transparent master, optimized from the built-in image generator output.
- `chess-crown-3d.webp`: 128px header/footer asset (about 7.4KB), crisp at the 44/48px display sizes.
- `chess-crown-3d.png`: 128px PNG for build-time social previews and portable color SVGs.
- [GENERATION.md](GENERATION.md): exact final prompt and generation method.

The build script sizes and encodes assets without changing their generated design. The Telegram avatar is not uploaded by this script.
