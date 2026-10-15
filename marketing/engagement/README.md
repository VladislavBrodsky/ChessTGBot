# Web3Chess engagement campaign kit

Prepared 11 October 2026 for **@chess_hub**. Virtual rewards are approved; TON prizes remain a proposal. Nothing in this kit is a Telegram Gift, NFT, cash balance, or transferable asset.

## The first offer

**Play 3 free AI games → unlock one free Epic Mystery Box.** Join the quest on Home first. Then complete three server-recorded AI games, each with at least 20 half-moves (10 moves per side). Wins, losses, and draws count. Earlier, aborted, and short games do not count. Qualifying free human games also count, and existing human-match eligibility is preserved for enrolled players. No stake or deposit is needed. The box is once per account, has no deadline, and costs no XP or money to open.

| Virtual reward | Chance | Fulfillment |
| --- | ---: | --- |
| 250 XP | 60% | Existing XP ledger; no referral kickback or booster multiplication |
| 1.5× XP boost for 24 hours | 30% | Existing booster fields; active stronger boost stays and gains 24 hours |
| Gold profile border | 10% | Existing profile inventory and avatar styling |

A duplicate border becomes 250 XP. The server makes the random selection; the client never rerolls it. Enrollment, reward, and receipt use the existing XP ledger. PostgreSQL user-row locking serializes enrollment and claims, and rewards commit with the receipt. Retrying a claim returns its original reward. No new database migration is needed. Pausing enrollment preserves existing players’ right to finish and claim.

The Home card displays progress and odds, rolls back failed optimistic actions, and opens free AI difficulty selection through `/[locale]/game?practice=1`. Copy covers all ten app languages. The disabled campaign stays hidden.

## Offers and viral loops

| Offer | Mechanism and player value | Share loop | Readiness |
| --- | --- | --- | --- |
| First Three / Epic Box | A small, concrete commitment; earned reveal; visible progress | A player invites a chess friend from Profile after claiming | Deployed and enabled; publishing verifies the live contract |
| Three Games, Three Better Habits | Saveable practice card: threats, recaptures, king safety | Forward the useful card to a friend; both try it | Uses existing practice and tasks |
| Puzzle Relay | One free position, answer behind a spoiler | Pass the puzzle, compare solutions, then explore Academy | Verified position; channel-ready |
| Back to the Board | A single useful return game; no streak guilt | Send the practice focus to an inactive chess friend | Uses existing practice |
| Two Friends, Better Ideas | Personal referral link plus a shared practice goal | New player repeats the invitation with their own link | Uses existing referrals; no new prize promised |
| Duo Drop | Proposed: both receive a non-transferable silver duo badge after a recruit completes three qualifying free games | Activated referrals earn the badge; link opens do not | Proposal; needs badge art, inventory display, attribution and capped claims |
| Seven-Day Knight | Proposed: play on seven distinct days within fourteen days for a season badge | Share actual milestone cards with personal invite links | Proposal; needs event-based day counting and badge fulfillment |
| Opening Passport | Proposed: four small opening lessons and practice goals unlock a board cosmetic | Share a completed lesson card; let a friend try one lesson | Proposal; needs explicit lesson eligibility and inventory grant |
| Community Checkmate | Proposed: a published target of distinct qualified players unlocks one virtual perk for eligible participants | Share a useful challenge and the real remaining count | Proposal; needs real aggregate counting, campaign dates and reward cap |
| Collector’s Set | Proposed: deterministic earned stamps; a complete set unlocks a named cosmetic | Share the completed collection card, then invite a friend to start theirs | Proposal; needs stamp persistence and duplicate handling |

Promote one gift quest at a time. Cosmetic titles, small XP awards and temporary boosts make inexpensive rewards, but each must have visible ownership or a usable benefit. A “rare” collectible needs a defined distribution rule; a random 10% border is not a limited edition or a scarce supply.

## Funnel and messages

Channel image → app Home → rules/odds → Join quest → free AI game → verified 1/3 → verified 2/3 → verified 3/3 → claim → confirmed reveal → personal invitation from Profile → recruit’s first game.

The ready-to-review channel captions are in `posts/`. `assets/` contains PNG exports and editable JSON specs; the reusable reward layout lives at `../templates/tg/templates/reward.mjs`. These use Web3Chess’s real logo, local fonts, and existing chess-chest artwork. They are template exports, not Canva account documents. Use the PNG as a Canva background if desired; change copy through the JSON spec to retain the tested layout.

| Moment | Message | Action |
| --- | --- | --- |
| New player, before joining | “Your first three start here. Join the free quest, finish three qualifying AI games, then reveal your reward.” | Join on Home |
| First game completed | “First game recorded. Two to go. In the next game, look for an undefended piece before each move.” | Continue free practice |
| Two games completed | “Two games done. One to go. Your Epic Mystery Box is one qualifying game away. Take your time: there is no deadline.” | Continue free practice |
| Ready to claim | “You earned it. Your three qualifying games are complete. Open your free Epic Mystery Box on Home.” | Claim, never purchase |
| Reward confirmed | “Your reward is yours. Give a chess friend a practice goal and share your personal link from Profile.” | Optional user-initiated share |
| Seven days inactive | “A good comeback starts with one move. Try a free AI game and check every recapture.” | One useful return game |

The lifecycle recommender in `../content-ops/pipeline/engagement.py` consumes verified state and returns escaped HTML copy. It never sends private messages. Private-message delivery needs a separate authorized integration, opt-in, persisted send receipts, and last-message timestamps. Its cap is one message per 24 hours and three per rolling seven days; blocked users, opt-outs, and users in a game are suppressed. Completed tasks suppress completion reminders. Keep relevant in-app hints after 1/3 and 2/3; do not broadcast an individual player’s progress to the channel.

Psychology is a hypothesis to test: clear effort before reward, visible progress toward a finite goal, a reward reveal, earned identity, and a useful reason to invite a friend. Progress incentives have experimental support in other settings, but that does not establish this app’s lift. [Nunes and Drèze, Journal of Consumer Research](https://academic.oup.com/jcr/article-abstract/32/4/504/1787425). Use actual progress, actual scarcity, and actual player outcomes. Do not invent winner stories, urgency, expiring rewards, or near-miss animations.

## Channel sequence

Use these as a proposed sequence, not an active schedule. Keep existing editorial content between offers; test at most three promotional posts a week before increasing volume.

1. Practice lead magnet: `practice-lead-magnet.json` — useful now and tied to existing features.
2. Epic launch: `epic-launch.json` — **only after deployment and enablement**.
3. Puzzle relay: `puzzle-relay.json` — solvable directly in Telegram; Academy is the next action.
4. Friend loop: `friend-loop.json` — share a personal invite with one relevant friend.
5. Comeback: `comeback.json` — one practical focus for returning players.

The launch caption includes every probability and meaningful qualification. The image carries the concise headline. [Telegram’s Bot API](https://core.telegram.org/bots/api#sendphoto) supports photo captions and inline buttons; captions must fit the 1,024-character limit after entity parsing. Do not expose bot tokens in copy, logs, scripts or receipts.

## Release and posting

The launch release enables `ENGAGEMENT_CAMPAIGN_ENABLED` by default after the backend and frontend have been deployed and verified. Set it to false in the backend environment to pause new enrollment while preserving existing players’ claim rights. Verify the quest and public contract before publishing any future offer. The public `/api/v1/gamification/engagement/catalog` contract makes the channel publisher refuse a disabled or mismatched offer. The first-three campaign identifier must remain stable once players enroll.

```sh
node marketing/engagement/render-kit.mjs
python3 marketing/engagement/channel.py marketing/engagement/posts/practice-lead-magnet.json
```

Those commands render and preview without posting. To send one inspected post, supply `W3_TG_BOT_TOKEN` securely in the runner environment and run:

```sh
python3 marketing/engagement/channel.py marketing/engagement/posts/practice-lead-magnet.json --send --channel @chess_hub
```

The bot must have permission to post in the channel. The sender records a stable post/channel receipt before transmission. An uncertain Telegram response stays reserved for inspection, rather than automatically sending again. Do not run the unrelated daily queue publisher to send this kit. No future schedule or private broadcast has been enabled.

## Measure quality, not just opens

Enrollment and claims can be counted from the existing XP ledger using reasons `engagement_enrolled` and `engagement_box_claim`, with the stable campaign ID. Qualifying game counts come from the same history query used by the server. Track enrollment → first qualifying game → third game → claim, median time to completion, seven-day return, qualifying activated referrals, and reward mix. A box is an activation incentive only if retained play improves.

Telegram views, forwards and reactions are channel metrics, not verified task completion. Existing plain Mini App links do not provide per-post attribution; do not claim a post generated particular games without connecting campaign attribution. Use a randomized 10% holdout of otherwise eligible accounts in a later experiment; the current release does not implement experiment assignment. Compare retained qualifying players per 1,000 exposed eligible users, not raw box opens. Stop an offer when farming, excessive reminder opt-outs or reward inflation outweigh retained play.

No 100 TON headline is prepared for posting. A future funded prize campaign needs a reserved budget, explicit probability and eligibility rules, an auditable drawing method, claim handling, and appropriate review for its intended markets before launch.

For channel publishing, save the marketing bot token as `W3_TG_BOT_TOKEN` in the ignored local `backend/.env` file. Keep `TELEGRAM_BOT_TOKEN` reserved for the main chess bot. The marketing bot must have Post Messages permission in `@chess_hub`. Pass `--env-file /absolute/path/to/backend/.env` to the channel command; never commit tokens.
