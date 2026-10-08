# Marketing website audit — 2026-10-08

## Scope and evidence

Reviewed the live marketing site at `web3chess.online` on 390px and 1440px viewports: Home, How it works, Wagers, Academy, Fair Play, Journal, Play, Terms, Privacy, and an article. Checked the remaining article destinations and all internal links found on the primary pages. Every visited route returned 200; the sampled pages had one H1, no horizontal overflow, broken images, or browser exceptions. Checked the corresponding website source and product claims against the current frontend/backend.

The site has a consistent editorial visual system and useful working examples. Its main opportunity is the first-visit journey: visitors should experience chess before reading a long list of product facts or deciding whether to leave for Telegram. We should create social urgency through a real friend challenge, not fabricated activity, timers, rewards, or income claims.

## Page and component review

| Surface | Finding | Change in this pass |
| --- | --- | --- |
| Home hero and navigation | Strong visual identity and clear Telegram CTA; the free interactive proof sat below the facts card on an 11,225px phone page. | Moved the playable mate-in-one section immediately after the hero. Kept the primary Play action and quieter puzzle action. |
| Three-position challenge | Valid chess positions, hints, reveal, and puzzle-specific share links already worked. Completion had no visible journey across the three boards. | Added honest session-local solved progress, a next-position action, and share copy that reflects a solved board. Revealing an answer does not earn progress. |
| Product facts | “0 downloads” was less useful than the actual free entry path, and financial facts can dominate a newcomer’s first impression. | Replaced it with “Free A.I. practice” and placed the card after the playable board. The 95/3/2 split remains explicit. |
| How it works | Clear four-step match explanation and time-control preview; no broken flow found. | Retained the page structure and links. |
| Wagers | Good fee calculator, but gross winner credit and the player’s net result require different mental arithmetic. | Added net gain on a win and full stake loss on a loss, calculated from the same settlement constants. |
| Academy | The practice example and lesson tracks provide real utility. | Its shared challenge now has progress and a friend challenge. |
| Fair Play | Correctly distinguishes legal-move validation from proof of unaided play. | Kept that distinction and aligned the Terms/Privacy language with it. |
| Journal and articles | Category search, related reading, and article sharing work; all linked articles returned 200. | Retained these flows; shareability now also starts with a playable position. |
| Play handoff | On phones, the standalone Play page displayed a QR code the visitor would need another device to scan. | Added direct Telegram arena and browser sign-in choices; limited QR to desktop. |
| Terms and Privacy | Several claims did not match the code: automated Stockfish anti-cheat, TON wagers, account cool-off controls, and local storage used only for preferences. | Removed unsupported claims and disclosed web sign-in storage, game records, wallet transactions, and referral-abuse signals more accurately. Legal review is still needed for comprehensive policy coverage. |
| Header, footer, and global links | Consistent branding and navigation; all discovered internal routes returned 200. | No structural change needed in this pass. |

## Product direction and next experiments

The first-visit loop is **see a chess position → solve it → send the same position to a friend → choose free practice or a match**. This gives a concrete reason to share, with no invented social proof. A share URL must always land on the selected position. The website should describe wager risk as clearly as its potential outcome.

Measure this loop only after a privacy-reviewed first-party event plan exists. Useful events would be hero puzzle click, challenge loaded, move submitted, solved without reveal, puzzle share, Telegram handoff, browser sign-in handoff, and successful authenticated arrival in the app. Do not call a click a new player or a share a referral. Test alternate hero copy and puzzle placement against these outcomes when real data is available.

Before using event-based FOMO, connect the site to a verified backend schedule and show the event time, timezone, and availability. Do not add live opponent counts, reward claims, prize pools, or countdowns without a source. Other follow-ups: localize the public journey, review Terms/Privacy with counsel, and assess article depth and search demand from actual analytics.

## Follow-up: responsive space and construction

The subsequent pass reviewed all 17 content routes at phone and desktop widths, plus tablet breakpoints for the nine main/policy/handoff pages. Clean overflow alone was insufficient: Wagers still repeated its split in three tall cards, the challenge left a long empty column, and repeated journal category covers resembled skeletons.

| Surface | Structural correction |
| --- | --- |
| Wagers | Paired the calculator with its explanation/allocation on desktop; consolidated percentage cards and balance steps; preserved money units and risk details. |
| Home | Explanation precedes the wager controls on phones; shared split rhythm, a smaller time-control preview, and compact journal cards reduce unnecessary scrolling. |
| Academy | Introduction sits above board/controls; matched loading geometry; lesson tracks share a divided surface. |
| How It Works | Grouped journey/questions; aligned practice and player-match actions; retained the product handoff guide. |
| Fair Play | Grouped rule essentials and consistent phone hero action width; preserved the distinction between legal moves and outside assistance. |
| Journal/articles | Removed repeated empty category covers from summary cards. Featured artwork, article content, metadata, related reading, and URLs remain intact. |
| Footer/navigation | Full-width phone action, short labels, two-column community row, and a useful Ways to play route. Floating action hides when the actual footer enters view. |

Measured layout and interaction results are recorded in QA.md. The design conventions are documented in DESIGN.md v2.10. These checks do not assert a measured throttled performance score or that every future content/state combination is error-free.

## Academy follow-up: composition and active workspaces

The owner's next screenshot identified a remaining tablet usability problem: the challenge fit the page but its board was too small, while hero actions wrapped into a narrow column. The refinement uses a full tablet hero action row and a stacked challenge until 1024px. Native phone position selection preserves full names, numbered desktop choices stay visible, and feedback is visually distinct.

Academy now explains the three moves in its opening example and provides a clear lesson handoff. Floating marketing actions pause while visitors use puzzles, stake examples, and time-control previews. See DESIGN.md v2.11 for the shared conventions and the corresponding QA entry for measured reflow, loading stability, interaction checks, and limits.
