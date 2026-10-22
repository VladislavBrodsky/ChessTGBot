# Creative distribution audit — 22 October 2026

## Decision

`/CREATIVES` is now the editable source for every non-position Telegram and X graphic and for blog share art. Legal chess positions, traps, puzzles and reveals remain on the exact board renderer.

## Flow checked

1. The reviewed caption and creative specification create one context-bound Studio project
2. QA checks headline, subtitle, tag, proof rows, CTA, destination host, disclosures and quantified claims
3. The offline renderer uses the same canvas code as `/CREATIVES`
4. Telegram and X attach the rendered square PNG recorded in the same queue entry
5. Blog staging can copy a reviewed 1200×630 PNG and its project JSON under the article slug; the Open Graph route selects it automatically
6. Portrait, story and wide assets remain review drafts until their channels are connected

## Current queue migration

- 9 legal-position posts remain on the verified board renderer
- 15 pending promotional posts now contain an editable Studio project and a newly rendered 1080×1080 PNG
- Contextual art mapping was applied: Academy book for lessons, chess clock for blitz culture, balance scale for match rules, fair-play kings for product flow, and chess sculpture for the Mini App journey
- All pending October 22–23 Telegram and X entries pass the updated deterministic QA gates
- Unsupported `$500` vault, countdown, `sub-50ms`, zero-lag, invented conversion and mystery-box reward claims were removed from pending posts
- The mystery-box copy now reflects the first-three-practice-game flow and the current in-app reward set
- Friend challenge copy now describes the real Telegram share flow without claiming a dedicated instant pairing link

## Published-post exception

Three X entries from 22 October were already marked published before this audit. The tactical board post is structurally valid. The other two contain an unsupported `85% of blitz wins` statement and an unverified vault campaign. The current publisher has no edit-in-place path, so this audit does not rewrite their historical records or silently post corrections. The new gates block those claims going forward.

## Daily editorial package

`drafts/2026-10-22/distribution.json` now binds native Telegram copy, X root plus docked reply, blog Open Graph art, and future-platform drafts to the correct PNG and editable project. Telegram and X use the square export; blog uses 1200×630; Instagram and stories remain disabled pending channel connection and approval.

## Publication state

No social post, blog update, Git push or deployment was performed by this audit.
