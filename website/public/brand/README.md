# W3Chess crown identity

Website adaptation of the owner's Telegram crown, supplied 2026-10-07.

- `w3chess-crown.svg`: the open violet symbol used by the website lockup.
- `w3chess-mark.svg`: the contained color avatar, transparent outside its rounded tile.
- `w3chess-logo.svg`: transparent lockup for light backgrounds; lettering is outlined.
- `w3chess-logo-inverse.svg`: transparent lockup for dark backgrounds; lettering is outlined.
- `w3chess-logo-mono.svg`: single-ink lockup for print or monochrome use.
- `w3chess-avatar.png`: 512 × 512 color mark, suitable as a reusable avatar asset.

The website uses `BrandMark`, `BrandWordmark`, and `Logo`. The open crown is violet on light backgrounds and lilac on dark backgrounds. The contained avatar is reserved for avatars, favicon, and touch icon. Crown geometry and copy are in `src/lib/brand.ts`; outlined lettering is in `src/lib/brand-lettering.ts`; brand colors are in the website tokens. Preserve proportions and clear space equal to half the symbol box width. Do not add glow, shadows, animation, or stretch the mark.

Wordmark: `W3Chess`, Onest 650, −0.035em tracking, normalized to a 24px visible height. Tagline: Onest 400 at 12px, 0.035em tracking. Outlines use font kerning. The SVG lettering is shared with the browser and sharing previews so it never swaps with a fallback font. Source: [Google Fonts Onest](https://github.com/google/fonts/tree/main/ofl/onest), variable weight instantiated at 650 for the wordmark and 400 for the tagline. Preserve `OFL-Onest.txt` with redistribution.

Run `npm run brand:build` from `website/` after changing the vector sources or brand colors. This rebuilds all SVG exports, the favicon, the 180px touch icon, and the 512px avatar from the shared construction. It uses the installed website dependencies and supports the project's Node 20 deployment runtime. Browser lettering has an adjacent accessible name, and every SVG reserves its dimensions.

These files do not change the live Telegram avatar or the Mini App branding.
