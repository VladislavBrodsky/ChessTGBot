# Engagement & virality plan: make the Mini App alive

**Date:** 2026-10-10 · **Owner:** Lead UI/UX + Frontend · **Scope:** every Mini App page (`frontend/`)
**Basis:** a walkthrough of all 13 routes in a 390×844 viewport with motion on (Home, Play lobby, live game, Academy, Themes, Achievements, Challenges, Marketplace, Wallet, Profile, Settings, Membership, Login) plus an inventory of what the code already does.

The design system is now consistent and fast. It is not yet **alive**. This plan adds reasons to open the app today, moments worth sharing, and motion that responds to the player, without lying to anyone.

---

## 1. What the walkthrough shows

### 1.1 Measured: the app is static after it loads
Running animations per page (counted with `document.getAnimations()` two seconds after load):

| Route | Running | Looping | Reading |
|---|---:|---:|---|
| Home | 5 | 0 | One-shot entrances only. Nothing moves after 1 s |
| Play lobby | 1 | 0 | Arena countdown is text, not motion |
| Academy / Themes / Achievements | 0 | 0 | Flat |
| Challenges / Profile / Wallet / Settings / Membership | 0 | 0 | Flat |
| Marketplace | 15 | 10 | The only page that feels alive (chest glows), also the only one with a perf risk |
| Live game | 2 | 2 | Clock pulse only |

### 1.2 Observed per page

| Page | What works | What makes it boring or leaks engagement |
|---|---|---|
| **Home** | Clear hero, one primary action, podium is attractive | No reason to act *now*: the streak is a tiny "3 w" in a stat row; the **Arena start time lives only in the Play lobby**; Daily Tasks sit below the fold; no unread/claimable signal on the nav; invite is not on Home at all |
| **Play lobby** | Wager chips, "Win up to", Arena banner, friend invite | Dense and transactional. Matchmaking is a spinner-type wait, not an event. The invite card is a row among rows |
| **Live game** | Board dominates, clocks, resign/draw | Moves, captures and checks have sound but no visual juice; no last-move trail, no capture burst, no check shake. Checkmate is a modal, not a moment |
| **Match result** | Stats ledger, "share ledger" | Share is a text via `switchInlineQuery`. No image card, no story share, no rematch-first layout, no "you beat X% of players" (real percentile exists in the user payload) |
| **Academy** | Daily puzzle, streak chip, progress card | A 100-tile grid where 99 tiles are locked reads as a wall, not a path. No "streak ends in 5 h" (a real deadline). "Hint of the day" is a bare card |
| **Challenges** | Claim button, task rows | Same referral block as Profile (duplicate). Invite link is shown as a raw URL. Tasks are a list, not a daily "path to done" with a payoff at the end |
| **Profile** | Hero, W-D-L, trend | No shareable identity card; achievements and themes are not showcased; referral duplicated |
| **Marketplace** | Best visuals in the app | Disabled "Need 4,150 XP" buttons are dead ends. There is no progress toward the next box, and no "you are 3 puzzles away" bridge back to Academy |
| **Wallet / Settings / Membership** | Clear and trustworthy | Intentionally calm. Keep calm, add only a success moment on deposit |
| **Nav** | Clean | No dots or badges: claimable tasks, Arena live, friend waiting, streak at risk |

### 1.3 What already exists (build on it, don't rebuild)
framer-motion in 59 files; `CountUp`, `Reveal`, `ProgressRing`; `react-confetti` on check-in, task success, unboxing, lessons, puzzles; WebAudio sound for move/capture/check/win/loss (`useAudio`); Telegram haptics in 38 files; daily check-in modal with streak; a real Arena schedule with countdown and XP prizes; seasonal box countdown; referral program with link, QR and earnings; `startapp` deep links to a game id; `addToHomeScreen` prompt; `switchInlineQuery` friend invite; reduced-motion switch (`useAnimationsEnabled`).

**Gaps in the Telegram surface:** no `shareToStory`, no shareable result image, no `shareMessage` with a prepared inline message, no nav badges, no bot nudges tied to personal state (the bot only runs a Mon/Wed/Fri broadcast).

---

## 2. Principles (read before building anything)

1. **Real urgency only.** FOMO comes from facts the product really has: the Arena's start time, a streak's actual expiry, the daily reset, a season end, a friend who is actually waiting. No fake "12 players online", no invented countdowns, no "last chance" copy. This is also a hard rule in `STRATEGY.md` and the QA gates.
2. **Reward the play, not the spend.** Wagering stays opt-in, always with the 18+ / "You can lose your stake" disclosure, and is never the engine of a loop. After three consecutive losses show a calm "take a break or play a puzzle" card instead of a rematch-for-stakes push.
3. **Alive = responsive, not busy.** Motion answers a player action or a state change. Ambient motion is slow, small and rare: at most **two looping animations in any viewport**, paused off-screen, off entirely under reduced motion.
4. **Every screen has one "next".** The loop must always end with a visible next step: play again, claim, share, learn, invite.
5. **Performance is a feature.** Transform and opacity only; no animated blur; no new `backdrop-filter` in lists; keep CLS ≤ 0.08 and INP in the green.
6. **Own the Telegram-native moves.** Stories, inline share, prepared messages, home-screen shortcut, haptics, main button. These are where virality comes from inside Telegram.

---

## 3. The five loops

```text
A. Daily return   check-in → streak → today's path (puzzle + 1 game + claim) → Arena tonight → bot nudge tomorrow
B. Play           lobby → match found moment → game juice → mate moment → result → REMATCH / share / next
C. Learn          daily puzzle → streak protect → level-up burst → unlock (theme/box) → showcase on profile
D. Invite         challenge-a-friend link → friend plays (live "waiting" state) → both rewarded → friend lands in loop A
E. Collect        XP → box / theme progress bar → reveal → equip → share the pull
```

Every task below belongs to one of these loops and names the metric it should move.

---

## 4. The plan

**Progress (2026-10-10):** done: 1.3 Arena card on Home (reuses `ArenaBanner`, real schedule), 1.6 bounded ambient motion (`.fx-*` classes and a 7 s sheen on the primary action), 1.8 motion-budget test (`e2e/motion-budget.spec.ts`). Open: 1.1, 1.2, 1.4, 1.5, 1.7 (1.1 and 1.4 need the streak-expiry and claimable-state data first).

Effort: **S** ≤ 1 day · **M** 2-4 days · **L** 1-2 weeks. "BE" = needs a backend change.

### Phase 1: Alive Home and visible deadlines (week 1)

| # | Change | Loop | Effort | Notes |
|---|---|---|---|---|
| 1.1 | **Streak flame + "streak ends in 5 h 12 m" chip** in the Home hero and Academy header; flame breathes (scale 1→1.06, 2.4 s), turns amber under 6 h | A | M | Needs the real streak expiry: check that the check-in/study API exposes last-activity time, otherwise a small BE addition. Motion: one loop |
| 1.2 | **"Today" strip** on Home under the hero: three connected steps (check-in · puzzle · one game) with a ring that fills; finishing all three fires one burst and unlocks the claim | A | M | Reuses `ProgressRing`, daily tasks API |
| 1.3 | **Arena card on Home**: next start time with live countdown, prize XP, "Join" CTA; becomes "Live now" with a pulsing dot when open | A/B | S | Data and banner exist (lobby); move to Home. Real schedule only |
| 1.4 | **Nav dots and badges**: dot on Wallet/Quests when a task is claimable, Play when Arena is live or a friend is waiting, Learn when the streak is at risk | A | S | Persistent navbar stays; this is a badge, not a hide |
| 1.5 | **Invite on Home**: one compact "Challenge a friend" row (not a third stat tile) that opens the share sheet | D | S | Replace the duplicated referral block on Challenges with a link to Profile; one canonical invite card |
| 1.6 | **Ambient life, bounded**: primary CTA gets a slow sheen sweep every 6 s; podium crown gently bobs; XP bar glows when a level is near | A | S | Shared `.fx-sheen`, `.fx-breathe` classes; max two loops/viewport |
| 1.7 | **Number rolls everywhere** (balance, ELO, XP) via the existing `CountUp`, with a green/red delta chip after a game | A/B | S | |
| 1.8 | **Motion budget test**: e2e asserts Home has 1-3 looping animations and 0 with reduced motion | all | S | Add to `layout-shift.spec.ts` family |

### Phase 2: The game feels great and results travel (weeks 2-3)

| # | Change | Loop | Effort | Notes |
|---|---|---|---|---|
| 2.1 | **Match-found moment**: both avatars slide in, ELO counters, 3-2-1 with haptic ticks, board fades up | B | M | Replaces the spinner-then-jump |
| 2.2 | **Board juice**: last-move glow trail, capture puff (particles, transform-only), check = brief king-square pulse + haptic, premove arrows, smooth piece slide | B | M | Pure CSS/SVG overlay on the existing board; sound already exists |
| 2.3 | **Checkmate / resign moment** (about 1.2 s): king tips, board dims to a vignette, then the result sheet rises; draw and timeout get their own treatments | B | M | Respect reduced motion: skip to the sheet |
| 2.4 | **Result sheet redesign**: big ELO count-up with delta, real percentile ("you are ahead of 82% of players") from the user payload, and three actions in this order: **Rematch** · **Share** · **Next** | B | M | Rematch event already exists in the socket layer |
| 2.5 | **Share card renderer**: render a 1080×1920 / 1080×1080 card client-side (canvas) for win, puzzle solved, streak milestone, level-up, box pull; brand template reused from `marketing/templates/tg` | B/C/E | L | Real numbers only; no wager amounts on shareable cards by default |
| 2.6 | **Telegram story share**: `WebApp.shareToStory(mediaUrl, { text, widget_link })` with a `?startapp=ref_<code>` link; fall back to `switchInlineQuery` | D | M | Verify Bot API version support at runtime; feature-detect |
| 2.7 | **Friend duel link v2**: after creating a link show a live "Waiting for Ana…" card with a pulsing ring; when the friend opens it, a haptic + "Ana joined" and the board starts | D | M | Link and game-id deep link exist; add presence event (BE: small) |
| 2.8 | **Puzzle streak feedback**: correct = green ring + chime + XP fly-up to the XP bar; wrong = soft shake and "try the idea of …" hint; end of daily puzzle = streak flame ignites | C | M | |
| 2.9 | **Cool-down card** after 3 straight losses (take a break / puzzle) | B | S | Responsible-play guardrail, also lifts retention |

### Phase 3: Collection, status and the social graph (weeks 4-6)

| # | Change | Loop | Effort | Notes |
|---|---|---|---|---|
| 3.1 | **Box/theme progress bars** on Marketplace: "Pawn's Gambit: 850 / 5,000 XP" with a bridge button to the exact Academy puzzle count needed; no more dead disabled buttons | E | S | |
| 3.2 | **Reveal ceremony v2** for boxes: anticipation shake, light burst by rarity, shareable pull card | E | M | `UnboxingModal` exists; add rarity-specific FX |
| 3.3 | **Profile showcase**: equipped theme, top 3 achievements, longest streak, best win; a "Share my profile" card | E | M | |
| 3.4 | **Academy path**: replace the 100-tile wall with a winding path of 10 visible nodes + the next chest; locked beyond the next node is collapsed | C | M | Keeps all content; changes presentation |
| 3.5 | **Achievement toasts** (queued, one at a time) with tiny confetti and haptic | all | S | |
| 3.6 | **Bot nudges tied to personal state** (opt-in): "Your 7-day streak ends in 3 h", "Arena opens in 15 min", "Ana accepted your challenge" | A/D | L (BE) | Bot already sends broadcasts; add per-user triggers with frequency caps and a settings toggle |
| 3.7 | **Weekly league** (BE): 30-player brackets, promotion/demotion, ends Sunday 20:00 UTC; shown as a card with a real countdown and your position | A | L (BE) | The single strongest retention mechanic here; needs backend design |
| 3.8 | **Streak freeze** earned from puzzles (BE) | A/C | M (BE) | Gives the streak flame meaning without pushing spend |
| 3.9 | **Emoji status for streak** via `setEmojiStatus` after explicit user consent | D | M | Status is visible to friends; opt-in only. Verify API support first |

---

## 5. Effects and animation toolkit

One small, tested layer so every page uses the same motion language.

**CSS layer (`styles/motion-perf.css` + new `fx.css`)**
`.fx-sheen` (diagonal highlight, 600 ms, every 6 s) · `.fx-breathe` (scale/opacity, 2.4 s) · `.fx-pop` (spring scale-in 240 ms) · `.fx-ring-pulse` (ring expands and fades) · `.fx-float-up` (XP/ELO delta numbers) · `.fx-shake` (wrong move, 280 ms) · `.fx-tilt` (pointer-driven 3D tilt for hero and collectible cards, desktop only).

**Motion variants (`lib/motionVariants.ts`)**
`listStagger`, `cardPop`, `sheetRise`, `numberRoll`, `burst(rarity)`. Entry stagger ≤ 40 ms per item, ≤ 6 items.

**Particles:** one `ParticleBurst` component (canvas, ≤ 60 particles, transform-only, auto-cleans) replacing ad-hoc `react-confetti` instances; presets for win, level-up, streak, rare box.

**Sound:** extend `useAudio` with `streak`, `levelup`, `claim`, `matchfound`, `rarePull`; one master mute in Settings; never autoplay before a user gesture.

**Haptics:** keep `telegramHaptic`; map events consistently (tap=light, claim=medium, win/levelup=success, wrong=error, countdown tick=selection).

**Guardrails:** `useAnimationsEnabled` gates every loop and burst; looping animations pause on `visibilitychange` and off-screen (IntersectionObserver); no layout-property animation; never animate over the board during play.

---

## 6. Copy and tone for the new moments

Short, concrete, no hype. Examples (all driven by real data): "Streak: 7 days. Ends in 5 h." · "Arena opens in 12 min. 500 XP to first place." · "You beat 82% of players this week." · "Ana is waiting at the board." · "3 puzzles to your next chest." Never: "Only N left", "everyone is playing", "don't miss out", or any earn/profit language.

---

## 7. How we know it worked

Instrument with the existing `/telemetry/log` before shipping each phase; compare against a 14-day baseline (cohorts by signup week).

| Question | Metric | Phase |
|---|---|---|
| Do people come back? | D1 / D7 return, streak ≥ 3 share, sessions per active day | 1 |
| Do they act on deadlines? | Tap-through on the Arena card; claims before expiry | 1 |
| Do games feel better? | Rematch rate, games per session, quit-before-first-move | 2 |
| Do results travel? | Share taps per game, story shares, new users with `ref_` attribution per share, invite-to-first-game rate | 2 |
| Does study stick? | Daily puzzle completion, streak length distribution | 2-3 |
| Is it still fast? | CLS ≤ 0.08, INP p75 ≤ 200 ms, looping animations per viewport ≤ 2, bundle growth ≤ 25 KB gz | all |

K-factor target to track: invites sent per active user × conversion of invite to first game. Public counts are not reach; do not publish growth claims until attribution is reliable.

---

## 8. Risks and decisions needed

1. **Backend scope.** Leagues (3.7), streak freeze (3.8), per-user bot nudges (3.6) and friend presence (2.7) need backend work. Phase 1 and most of Phase 2 do not.
2. **Wager adjacency.** Share cards and rematch prompts must not pair stake amounts with youth content or push staking after losses. Decision for the product owner: should share cards ever show money amounts? Recommendation: no.
3. **Telegram API support.** `shareToStory`, `setEmojiStatus` and `shareMessage` depend on the client's Bot API version. Feature-detect and fall back to inline share.
4. **Performance on low-end Android.** Ship FX behind a quick capability check (`deviceMemory`, `hardwareConcurrency`) and default to the lightweight preset.
5. **Piece artwork licence** (used in share cards) still needs legal sign-off; see `marketing/templates/tg/licenses/PIECES.txt`.

## 9. Suggested order of work

Week 1: 1.1-1.8 (alive Home, deadlines, badges, invite row, motion test). Weeks 2-3: 2.1-2.4 and 2.8-2.9 first (the game and result feel), then 2.5-2.7 (share cards, stories, duel link). Weeks 4-6: 3.1-3.5, with 3.6-3.9 scheduled with the backend team. Re-measure after each phase; cut anything that does not move its metric.
