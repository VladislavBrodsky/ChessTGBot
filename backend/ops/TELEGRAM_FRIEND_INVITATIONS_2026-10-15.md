# Telegram friend invitations — 15 October 2026

Implementation is local and has not been deployed by this task. Deploy the API, migration and frontend together before sharing new links. Physical Telegram iOS/Android acceptance remains a release check.

## Reported failure and root causes

The reported link was `https://t.me/@chess_matbot/app?startapp=4e044c66`.

- `@` belongs to a displayed username, not the bot username segment of a Telegram link. The game screen interpolated the unnormalised configured username.
- `/app` assumes a named Mini App short name. The bot has a Main Mini App configured; new links use `https://t.me/chess_matbot?startapp=...` without that assumption.
- `4e044c66` is an older game identifier, not a referral code. A finished or missing game cannot be recovered from that identifier. The new preview says when a link is expired/full instead of silently returning Home.
- Referral links previously opened bot chat with `?start=ref_CODE`, recorded attribution only for new accounts, and never represented a play request. Home explicitly ignored `ref_` when routing. Opening the menu later discarded the original intent.

Read-only Telegram `getMe` and `getWebhookInfo` checks confirmed the expected bot username, `has_main_web_app=true`, a configured webhook, zero pending updates and no reported delivery error. No real notifications or configuration changes were made during validation.

Telegram documents [Main Mini App and bot links](https://core.telegram.org/api/links) separately: `startapp` opens the configured Main Mini App; a bot `start` link requires the user to press Start. A bot update cannot force a user's app open. The legacy bot reply therefore offers an explicit Open invitation button and explains that the invitation is saved for a later Open App launch.

## Two deliberate flows

| Shared link | Recipient | Sender |
| --- | --- | --- |
| Direct free game (`go_TOKEN`, with legacy game IDs still accepted) | Opens the app, sees the actual host, clock and free/staked amount, then explicitly joins | Already waiting on the board; normal realtime join updates the game |
| Reusable friend/referral link (`ref_CODE`) | Opens a named invitation, sends a free 10-minute play request, sees a waiting state and can forward the saved request in Telegram | Sees an in-app request, plus a best-effort bot notice, then accepts or declines; acceptance creates one free game for both players |
| Saved request (`fi_TOKEN`) | Only the two participants can open it; shows the latest pending/ready/declined/cancelled/expired status | Same durable request and game, including after restart or app reopening |

Accepting a request opens the board for the accepter. The waiting player gets a realtime hint and refreshed Open game action. Closing the modal keeps active requests in Home → Play with friends. Recent declines and cancellations also stay visible there, so a returning player gets a clear outcome. No passive notification forcibly replaces a game. First-run onboarding/region/check-in dialogs pause while the invitation is being resolved or shown. All ten app languages and bot invitation instructions are translated. Free play never depends on wallet availability. Staked game previews disclose the actual amount and label the explicit action with the amount before joining.

## Recovery and safeguards

- A validated bot `/start` and signed Mini App launch store one expiring intent per player in SQL. Opening the normal bot menu can recover it without URL parameters. A dismissed intent cannot be resurrected by replaying the same or an older signed session; a newer intent wins.
- Browser extraction handles `startapp`, legacy `start`, `tgWebAppStartParam`, SDK `start_param` and Telegram hash parameters. Explicit URL intent wins over stale SDK state. Session consumption is scoped to the authenticated player and prevents repeat navigation when returning Home.
- Request creation is rate-limited and deduped by the sorted player pair. Only the link owner accepts; only the requester cancels. Forwarding a private request to a third player does not grant access. Self-invitations, full games, busy players and expired links have clear outcomes.
- A renewable shared pair lock and a SQL row lock serialize acceptance. A preassigned game ID and active-player claims prevent duplicate games. If the game was saved before the SQL status commit failed, the next view recovers that same game. The existing sweeper handles first-move grace after worker loss.
- Inbox reads are bounded to twenty recent invitations with a single batched opponent-profile query. Visible clients refresh every twelve seconds, on foreground and on an authenticated per-user realtime hint. Hidden clients do not poll. Live inbox/preview reads bypass the generic read cache. Connection failures preserve the last confirmed state and offer retry.
- Bot notices escape player names and reserve each recipient/event once before attempting delivery. Bot permissions, blocked chats or Telegram failures do not affect the SQL inbox. A reservation is not proof of delivery; the Send request in Telegram action provides a direct fallback.
- Pending requests expire in 24 hours; launch intents expire in 24 hours. Daily maintenance removes expired intents and requests older than thirty days. The migration indexes participant IDs, creation time and expiry.
- Playing with an existing friend does not reassign the paid referrer or count an old account as a new acquisition. New-account source attribution keeps the existing ten-minute grace and immutable first-source rules. Free game DAU still requires a server-accepted move; opening an invitation alone is not a player-day.

## Local validation

- Full backend regression: **738 passed, 15 skipped** in the normal SQLite-backed run; the opt-in services are intentionally absent there. A separate real PostgreSQL 16 / Redis 7 run passed **all 12 checks**, including two API processes, returning accounts, simultaneous request/acceptance, legal moves, zero balances, cross-worker private-room hints, reconnects, shared state and settlement recovery. Telegram and money delivery were stubbed in the local workers.
- Frontend regression: **41 suites / 179 assertions passed**. Link tests include the exact reported `@chess_matbot` / `4e044c66` example, all launch-input formats and explicit-query priority; the first-run test verifies an invitation pauses onboarding without marking it completed.
- Pilot browser journeys: **11 passed**, covering 320px English, 390px Arabic and desktop; balance-unavailable free challenges; campaign creation; direct and saved referral launches; host acceptance with onboarding pending; the reported legacy game format; expired-link exit; Arabic light/reduced-motion layout; the public QR entry; and a declined request visible after reopening Home. English dark and Arabic light invitation screenshots were inspected. The direct-link journey also passed from the Main Mini App root URL through the locale/Home redirect.
- All **1,296 message keys** validate across ten locales. Design checks and zero-warning lint passed. The invitation migration was upgraded, downgraded and upgraded again on a separate real PostgreSQL test database. Production static export includes TypeScript validation and 213 generated pages; the rebuilt export is synchronized to `backend/static_frontend`. All 302 source/public/config files matched the build snapshot, and all 1,397 exported files matched after synchronization. The commit-based staleness guard reported no commit difference in this uncommitted checkout; the fresh build and these hash checks establish working-tree freshness.
- These are local browser/server checks, not a physical Telegram client test or a production deployment. No production game was modified and no real invite notice was sent.

## Release and manual acceptance

1. Apply migrations through `e2b9c651a403` before starting the updated API. `friend_invites` and `player_launch_intents` are additive; older code can ignore them. Do not downgrade while the new API is serving requests.
2. Deploy the API and frontend/static export together. Keep the pilot's existing single-replica operational gate until the wider paid-game crash-recovery and production load gates are met.
3. With two real consenting accounts on iOS and Android, copy a new game link: it must have no `@` username segment or assumed `/app` path. Test direct open, cold start, join, one legal move each and reconnect.
4. Share a referral link to a new and an existing account. Check named preview → request → host accept → both open the same free board. Repeat with the bot-chat legacy link, press Start, then separately open the ordinary menu and confirm recovery.
5. Check notification delivery when permitted, blocked-bot fallback, duplicate taps, decline/cancel, self-link, an expired game and an already busy player. Verify no wallet debit and no new-acquisition count for the old account.

No production-capacity certification follows from these local checks. See the pilot release and scale audit for load/soak, infrastructure and paid-path gates.
