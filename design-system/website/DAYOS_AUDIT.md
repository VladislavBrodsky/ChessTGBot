# Dayos / Refero audit

Audited 2026-10-07 against the [requested Refero style](https://styles.refero.design/style/ee403055-480e-4bd4-9216-07c9ae2dde2e) and its [Dayos source](https://www.dayos.com/). This is the current website reference. `REFERENCE_AUDIT.md` documents the earlier Fold direction and is historical.

## Findings

- The Refero style uses warm gray, white, and black for large surfaces. Yellow belongs to small highlights; it is not a full-section background. Mint punctuates labels and selected elements.
- Display headlines use condensed capitals, weight 700, and 0.9 leading. Secondary headings use a regular-width sans at approximately 40px, weight 450, and 1.1 leading. Treating every heading as a poster loses that hierarchy.
- Cards are flat and generously spaced. Rounded silhouettes and structural contrast provide definition without shadows, gradients, or decorative wireframes.
- Measured on the live source at a 1440px viewport: the H1 was 130px/700 with 117px leading; prominent section headings were 80px/700; later section headings were 40px/450 with 44px leading. On a 435px viewport, the corresponding display and secondary sizes were approximately 63px and 32px.
- The live Dayos site now also has a dark opening sequence. The requested Refero style and Web3Chess’s light marketing direction remain the relevant composition; do not import the Mini App’s dark system.

## Web3Chess translation

- Retain Barlow Condensed for the hero, numerical facts, and one dark content statement. Use Onest at 30–40px/500 for ordinary section headings and 24–32px/500 for card headings.
- Use the neutral `eyebrow` for supporting labels. Reserve mint pills for hero labels and useful metadata. Keep yellow in tiny accents and chess state highlights. The website's current rook symbol has its own violet/lilac logo identity; see `DESIGN.md` §6.5.
- The challenge is one white Card. Desktop: gray board workspace on the left, introduction and controls on the right. Phone: introduction, full available board width, then controls. Do not spend phone width on nested padding.
- Let the contextual chess sculpture carry the hero. Remove the grid, orbit, extra metadata, and white caption card; retain the restrained caption and bounded motion.
- Keep the footer compact: a direct Play action, grouped links, short legal text, and a desktop QR.
- These decisions are implementation conventions in `DESIGN.md` §0.1, not instructions from the external webpage.
