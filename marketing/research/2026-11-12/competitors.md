# Web3Chess competitor intelligence: how competitors promote themselves

**Observation date:** 2026-11-12 (all "observed" numbers were read from public pages that day unless a different date is given)
**Scope:** public pages only, no logins. Traffic metrics (Similarweb/Semrush) are covered by another agent and are left out here.
**Labels:** **[observed]** = I read the number myself from a public page or public API on 2026-11-12. **[reported]** = the company or a publication states it and I give the source. **[unverified]** = a third-party or self-reported claim I could not confirm, or sources that disagree.

---

## 0. Key takeaways (read this first)

1. **No chess app on Telegram has scale yet.** The biggest Telegram chess bot that shows a monthly-user count is EdChess, at **20,890 monthly users [observed]**. Chess Now has **13,154 [observed]**. findmini.app lists about 20 chess mini apps, and most of them are tiny or dormant. The "chess on Telegram" category leader slot is still open.
2. **The nearest direct competitor is EdChess** (Telegram, TON/GRAM rewards, tournaments, Puzzle Pass). Its channel is big (35.6K ENG + 12.2K RU subscribers) but engagement is weak and falling: ~1.2K views per post in late October fell to ~270 by 12 November. Its prizes are small ($30 arenas) and mostly paid in tokens, gems or items.
3. **Anichess is the best-funded web3 chess project** (Animoca Brands + Chess.com, Base chain, $CHECK token). It grows through Chess.com distribution, streamer leagues, a Masters League with promotion/relegation, and a buy-in "Gambit" mode with a referral share of platform fees. It is **not on Telegram**, its own YouTube channel is tiny (1.13K subscribers), and its prizes are paid in a volatile token.
4. **Immortal Game is effectively dead as a web3 competitor.** It dropped play-to-earn and NFTs in December 2023 after "heavy cheating", and its site returned HTTP 402 on 2026-11-12. The lesson for us: money chess without strong anti-cheat collapses.
5. **Mainstream chess grows through SEO, app stores, events and creators**, not paid ads. Chess.com reported 85.8M SEO clicks and ~16.8M app installs in a single quarter, and its affiliate program *bans* paid ads.
6. **The Telegram mini-app playbook has changed.** Referral trees and airdrop farming produced the 2024 spikes (Notcoin, Hamster Kombat) and then the crashes (Hamster went from 300M users to 41M in 3 months). What still works in 2026: retention-first design, Stars/real payments as anti-sybil, revenue-share affiliates, catalog and Apps-tab presence, and in-chat sharing.
7. **Copy/compliance alerts:**
   - **TON was renamed GRAM (ticker GRAM) around 15 June 2026** [reported, several exchanges]. EdChess already says "earn GRAM rewards". Any Web3Chess copy that says "TON" looks dated.
   - **Telegram Ads prohibits ads for real-money gaming (§5.6).** Paid Telegram Ads can only promote the free side of Web3Chess.

---

## 1. Mainstream chess

### 1.1 Chess.com — active, dominant
- **Hook (homepage title/description, observed):** "Chess.com - Play Chess Online - Free Games". The description reads "Play chess online for free on Chess.com with over 250 million members… Have fun playing with friends or challenging the computer!" The CTA leads with *free*, *social proof (250M)* and *friends or computer*.
- **Scale ([reported], Board Report 2026 Q2, https://www.chess.com/board-reports/2026-q2):**
  - Members: 267M+ (30 Jun 2026)
  - Registrations: 14.2M in Q2 (+27.5% YoY)
  - Average DAU: 10.2M (+25.7% YoY)
  - Games: 2.8B in Q2
- **Acquisition channels, by Chess.com's own numbers (same report):**
  - **SEO:** 85.8M clicks per quarter (+7.4% YoY) and 476M impressions. The top initiatives were "Chess Strategy for Beginners", a voice-control post and a US-states map.
  - **ASO:**
    - iOS: 8.4M installs in Q2, rated 4.8 from 2.4M reviews
    - Google Play: 8.4M installs, rated 4.7 from 3.2M reviews
    - In-app events: 35M impressions and 175K downloads
    - Spring Sale promo on Google Play: 4M impressions and 23K downloads
  - **Social:** 590M impressions per quarter, 13.4M interactions and 335K new followers. The top post ("Pawn Pants") had 9.4M impressions. Their Reddit community has 64K+ members, and the Community Club has 148,819 members.
  - **Events/creators:**
    - PogChamps 7 averaged 220K viewers (peak 244K).
    - 2026 YTD: 71.9M event impressions and 7.9M broadcast hours.
    - Q2 brand partners: Anichess, Revolut, Secretlab, Neuro.
    - Two new YouTube series are planned.
    - Viewership trend: PogChamps has declined since its pandemic peak. PogChamps 2 (2020) had 1.54M hours watched against 720K for PogChamps 6 (2025) [unverified; Chess Watch via third-party summary].
  - **Celebrity/earned media ([reported], State of Chess, 21 Mar 2025, https://www.chess.com/news/view/2025-state-of-chess):** Carlsen on Joe Rogan (4.7M YouTube views), an NBA star in Washington Square Park, an NFL Films BlitzChamps documentary, an Esports World Cup partnership and Freestyle Friday.
  - **Product-led retention:** a new puzzle experience with "worlds, tiers, prestige, points, streaks, bonuses, and friend challenges" (same source). A Friends & Family Diamond plan shares up to 6 seats.
  - **Affiliate program ([reported], updated 26 Jan 2026, https://www.chess.com/amp/article/affiliate-program-for-partners-of-chesscom):**
    - 15% of membership revenue, including renewals for as long as the member stays subscribed
    - Attribution: 30 days for new users, 24 hours for existing users
    - $50 minimum payout via PayPal
    - Affiliates must be 18+ with an account at least 60 days old
    - **Paid advertising of affiliate links is prohibited**, and disclosure ("#ad") is required
  - Promotions: the Spring Sale (50% off Premium) was called "most successful mid-year sale ever", with no numbers given.
- **Audience [observed]:**
  - YouTube @chess: 2.98M subscribers, ~7.5K videos
  - Top creator GothamChess (YouTube): 8.6M subscribers
  - X, TikTok and Instagram follower counts: not captured [unverified]
- **What's working:** compounding SEO plus ASO, and a creator ecosystem (Chess.com does not need to pay for ads). Events produce content that can be clipped.
- **Gaps we can exploit:**
  - No money play for ordinary users; cash prizes exist only in select official events (e.g. the $5K Daily Chess Championship).
  - Not inside Telegram.
  - Heavy fair-play burden: 106K accounts closed in February 2025 alone.
  - "Play for USDT with equal stakes" and "no download, inside Telegram" are not their game.

### 1.2 Lichess — active, nonprofit
- **Hook (observed og:description):** "Free online chess server… No registration, no ads, no plugin required." Its acquisition hook is *zero friction*.
- **Model and scale ([reported], End of Year Update 2025, lichess.org blog via search snippet; WebFetch got 403):**
  - Donation-funded
  - Open database of 7B+ rated games and 900K+ broadcast games
  - New mobile app officially released in 2025 after a year in beta
  - Finances judged stable enough to hire part-time staff
  - No reliable MAU or games-per-day figure was found [unverified]
- **Acquisition:** word of mouth, the open-source/"no ads" brand, no-account play, broadcasts, team and Swiss tournaments hosted by communities (Lichess4545, third-party cash/crypto tournament teams such as "ChessNode" and "TheChessBitcoin" also run on Lichess teams). There is no paid marketing.
- **Audience [observed]:** YouTube @lichessdotorg has 75.5K subscribers. Reddit counts could not be read because the Reddit API blocked automated requests [unverified].
- **Gap:** no money play at all, and no Telegram presence. **Lichess teams are a public place where crypto-chess communities already gather** (e.g. lichess.org/team/chessnode). These can be used for organic outreach under Lichess's rules.

---

## 2. Web3 / play-to-earn chess

### 2.1 Anichess (Animoca Brands × Chess.com) — active, best funded
- **Hook:** the page title is "Anichess - Chess with a Drop of Magic". The site is a JS-only SPA, so the body text could not be read. The product is "spell chess" (classic chess plus random spells) on **Base**, with no gas fees on moves.
- **Money mechanics ([reported], egamers.io, 27 Sep 2026, https://egamers.io/anichess-launches-round-1-of-its-gambit-series-with-10000-check-on-the-leaderboard/):**
  - **Gambit mode** (introduced with Season 7, March 2026): winner takes all, 100 $CHECK buy-in, plus a 15 $CHECK platform fee per match in Season 7.
  - **Season 7:** >1M $CHECK in total rewards. 250K $CHECK paid weekly to the top 50 players **ranked by total buy-ins**, with a minimum of 15 matches. Double points during a daily 3-hour "Peak Hours" window.
  - **Referral:** referrers earn **10% of the platform fees paid by players they bring in, starting from each new player's 3rd match**. This is anti-sybil by design.
  - **Season 8:** 700K $CHECK in total (600K in the Gambit pool).
  - **Season 10:** 300K $CHECK, split equally between Playoffs, Masters League and events. Season 10 is the final rating reset.
  - **Gambit Series:** 4 rounds, 10K $CHECK per round on the leaderboard.
  - $CHECK is reported as listed on Coinbase [reported].
- **Acquisition tactics ([reported]):**
  - **Chess.com distribution:** co-developed with Chess.com; a $10K Anichess × Chess.com tournament; an "Anichess Creator Challenge" on chess.com; Chess.com lists Anichess as a Q2-2026 brand partner.
  - **Star power:** Magnus Carlsen partnership (The Block); King's Gambit debuted at the Speed Chess Championship 2025 Finals (Animoca).
  - **Esports:** Team Secret partnership (2024).
  - **Streamers:**
    - "Anichess Streamers League": 8 Twitch streamers, 10K $CHECK to the winner
    - "Pengu Blast Arena": 4 streamers on Twitch (egamers.io)
  - **Competitive ladder as content:** Masters League (8 players, 100K $CHECK per season, best-of-5 round robin, promotion/relegation from 64-player Playoffs). This gives a story every week. Coverage: https://egamers.io/?p=113161
  - **Event cadence:** nightly $CHECK tournaments "with four free entries", plus Halloween and seasonal events.
  - **Crypto-native distribution:**
    - Nansen Points partnership distributing 2.5M $CHECK (nansen.ai)
    - Genesis Ethernal NFT holder airdrop
    - Coinbase listing
    - Heavy coverage on event-aggregator sites (egamers.io lists each event)
  - **Galxe/Zealy/TaskOn:** no evidence found.
- **Audience:**
  - Discord: **36,861 members, 796 online [observed via public Discord invite API]**
  - YouTube @Anichess: **1.13K subscribers [observed]**
  - Players: "more than 1 million players" [reported, self-claimed, unverified]
  - X follower count: not captured [unverified]
- **What's working:** borrowed audiences (Chess.com, Carlsen, streamers), plus seasons/leagues that create recurring news. Referral pays on *fees*, not signups.
- **Weaknesses we can exploit:**
  - Prizes are in volatile $CHECK, and Gambit leaderboards reward *buy-in volume*, which reads as whale-friendly.
  - Spells add a learning curve.
  - Needs a Base wallet, so there is onboarding friction.
  - No Telegram app.
  - Its own YouTube/video presence is negligible.

### 2.2 Immortal Game — inactive as web3; treat as dead
- Ended play-to-earn, closed its NFT marketplace and shut down its CMT token on **13 Dec 2023**, citing "heavy cheating" (Decrypt https://decrypt.co/209533/…, Blockworks, Cointelegraph).
- It had raised a $15.5M Series A led by The Chernin Group (Sep 2022) [reported].
- **www.immortal.game returned HTTP 402 on 2026-11-12 [observed]**, typical of lapsed hosting. A formal shutdown notice was not found [unverified].
- **Lesson:** a cash/token incentive multiplied cheating, and that killed the economy. Web3Chess's USDT stakes need visible fair-play enforcement, and we should *market* that enforcement.

### 2.3 Pixie Chess — new entrant, pre-scale
- Announced a **$5.2M seed on 2 Apr 2026** for on-chain chess with collectible pieces that carry abilities, plus player-funded tournaments [reported, pulse.bot; the article fetch failed, details come from the search snippet].
- pixiechess.xyz is live (HTTP 200) but JS-only. Launch status, chain and audience: [unverified].
- Watch item: they are "player-funded tournaments", which is the same buy-in prize-pool model as ours.

### 2.4 ChessNode — Telegram + web, dormant
- **Hook:** chessnode.io's title is "Play-to-earn chess crypto game, cryptocurrency and NFTs". The bot @chessnode_bot says "Play chess, win and get rewards."
- **Channel:** @chessnode announcements has **18,000 subscribers [observed]**. Its last post is dated **21 Jul 2026 [observed]**, so it has been dormant for about 4 months.
- **Past post views:** 818 to 19.5K. The best-performing posts were a player-count feature (19.5K) and the launch of a free puzzles site (8.27K).
- **Rewards and tactics:** rewards in its own STEIN token, top-10 leaderboards, polls/quizzes, cheat-report instructions, and an anti-fraud hold on rewards. A Lichess team is used as a funnel (USDT-prize tournaments, per that team page). There is a public partnership contact (@dmykov).
- **Opportunity:** an orphaned audience of about 18K chess-crypto subscribers. A partnership or cross-promo approach is plausible.

### 2.5 Long tail of crypto chess (mostly hackathon or tiny; none showed traction)
- PowChess (BSV, HandCash wallets)
- ChessFish (crypto wagers; PlayToEarn listing)
- Pixel Chess (ETH fixed wager tiers, 1.9x payout)
- Chess Arena (Solana escrow)
- Lawb Chess (EVM, agent and human play)
- déchecs (open-source wagered server)
- MetaChess, Arcadia Chess (2024 press release)

None of these showed social traction worth tracking [observed via search; no metrics verified].

---

## 3. Chess for money / skill wagering (fiat)

| Platform | Model | Compliance framing (as stated) | Notes |
|---|---|---|---|
| **Skillz-powered chess apps**: "Chess for Cash: Online Matches" (Tall Troll Games), "Real Money Chess Prizes Skillz", "Chess Payday", "Real Chess Clash" | Head-to-head cash tournaments, same board and time limits, Skillz wallet | 18+, rated "Gambling". Chess for Cash disables cash play in **AZ, AR, CT, DE, LA, MT, SC, SD, TN** and Chess Payday in **AR, CT, DE, LA, SD**; residents of those states play with virtual currency only | Chess for Cash: 4.4★ from **91 ratings**, last update **v1.0.4, 20 Jul 2022 [observed, App Store]**. Reviews allege AI opponents and withdrawal friction (checks or fees, bonus cash not withdrawable) [unverified user claims]. Real Chess Clash advertises PayPal/Venmo withdrawals. |
| **Checkmate.live** | Free speed chess plus video-supervised "Echess" events with the Asian Chess Federation (52 national federations); a treasury funds prize pools; "credits, loot, crypto" per its Substack | **Age 15+**, features restricted under 18; **VPN/proxy banned, location verification required**; "Neutral by Design" | Hook (observed title): "Play Chess Online Free \| ACF Echess & Pro Online Chess Tournaments". Partners: VADR Media (fair-play partner), UTS AI Institute. No social sizes listed. |
| **Federation and site cash events** | US Chess "Monthly Master Mania" online cash-prize tournaments; Chess.com $5K Daily Chess Championship | Run as sanctioned tournaments, not wagering | Shows that cash prize *tournaments* are a mainstream, acceptable frame. |
| **India: WinZO, MPL, etc.** | Real-money skill games | **India's Promotion and Regulation of Online Gaming Act 2025** (assent 22 Aug 2025) bans online money games *including skill games*, plus their ads and payments. Dream11, WinZO, Zupee and MPL suspended paid formats; WinZO moved into Brazil and the US (The Week, Bar & Bench) | **Geo-block India for staked matches.** Readings differ on whether chess for stakes is covered; the cautious reading is that it is. |

**Takeaway:** the fiat skill-money players are stale (2022-era apps) and tied to US state lists. Their trust signal is weak: reviews keep asking whether opponents are real and whether payouts work. Web3Chess can win on **verifiable payouts** (on-chain withdrawals anyone can check on tonviewer) and **real PvP proof**. We should copy their compliance framing: 18+, a restricted-jurisdiction list, "skill, equal stakes" and a free-play fallback.

---

## 4. Chess inside Telegram

**How I measured:** I searched findmini.app for "chess", which returned 20 apps. I then read each bot's public t.me page; Telegram shows "N monthly users" only on some bot pages, and "n/a" below means the page did not show a count. I read channel pages at t.me/<channel> on 2026-11-12.

| Bot | Positioning (bot description, observed) | Monthly users | Channel / size | Status and notes |
|---|---|---|---|---|
| **EdChess** @edchess_bot | "Play chess for free on Telegram… earn GRAM rewards" (edchess.io) | **20,890 [observed]** | @edchessss (ENG) **35,586**; @edchessssss (RU) **12,219**, plus chats | Active, posting ~daily. Listed on PlayToEarn (Alpha), DappRadar, Product Hunt. Shortlisted in 3 categories of the PlayToEarn Blockchain Game Awards 2026. |
| **Chess Now** @ChessNowBot | "Chess matches with friends, colleagues, or fellow group members without leaving Telegram" | **13,154 [observed]** | none found | Won 1st place in the Telegram Mini App Contest (open source). Pure **group-chat viral loop**, no money. |
| **Chess ❤️** @ChessContestBot | "Create game, share link with friend, play chess!" | n/a | none | **Featured in @trendingapps "Game Friday" (channel: 3,535,977 subscribers [observed])**, i.e. free editorial distribution. |
| ChessNode @chessnode_bot | play-to-earn, STEIN token | n/a | @chessnode 18,000 | Dormant since 21 Jul 2026 (see 2.4). |
| GGS Chess PvP @ggschessbot | "Play chess against other players for Telegram stars" | n/a | none found | A Stars-wagering competitor; scale unknown. |
| ChessPoint @chesspointbot | tournaments, puzzles, "TON prizes in selected events" (findmini) | n/a | t.me/chesspoint has 1 subscriber (may not be theirs) | Tiny. |
| Chessio @chessiobot | "Play, Solve and Compete to Earn!" | n/a | t.me/chessio has 9 | Tiny. |
| Chess War @chesswar_bot | "Up your earnings and earn airdrops" | n/a | — | Airdrop-bait positioning. |
| Chess GoWin @chess_gowin_bot | "Chess game with mining $GOW" | n/a | — | Tap-to-earn hybrid. |
| Chess Royale, Ninja Chess, Tate Chess, Ch8ss, MChess, KoyChess, Chess (@chessc_bot) | variants / casual / vs-AI | n/a | — | No traction signals. |
| **Web3Chess (us, for reference)** | @chess_hub "Web3 Chess - Play & Earn" | — | **61 [observed]** | — |

### 4.1 EdChess deep dive (nearest competitor)

**Content cadence and formats** (@edchessss, 19 Oct to 12 Nov 2026, observed). About one post per day:
- a weekly schedule post
- weekly updates
- "Puzzle Pass" quests: a 2-week pass with a free tier and a Premium tier, chest keys, and a grand-prize chest
- endgame puzzles
- polls
- video teasers (an auto-play-for-offline-users feature and "playstyle characters")
- award-voting quests

Almost every post ends with "Your move?" plus emoji-reaction choices, and almost every post deep-links into the bot.

**Prizes:**
- "Board League Arena" tournaments with **$30 prize pools**; 55% of the October arena pool went to *rare board owners*, which is an NFT/cosmetic-holder perk
- "Daily Crypto Clash"
- gems (~2 to 5 per win)
- small GRAM rewards for quests, e.g. **0.2 GRAM for voting for EdChess in the Blockchain Game Awards**
- "happy hours" with double points

**Engagement:** views per post fell from ~1.2K (26 Oct) to ~264–277 (12 Nov) on 35.6K subscribers. That is a roughly 1–3% view rate, which suggests a mostly inactive, airdrop-era subscriber base.

**Referral:** no referral mechanic was visible in the channel.

**Where they're weak:**
- tiny prize pools paid in gems, tokens or items
- money play tied to owning NFT-like items
- declining reach
- English and Russian only

**Where they're strong:**
- they are already in every catalog
- daily posting
- retention loops through Puzzle Pass and quests
- they used awards voting as a growth event

### 4.2 Patterns across Telegram chess

The only bots with *verified* scale grew through **(a) in-chat sharing / group play** (Chess Now, Chess ❤️) or **(b) crypto rewards plus catalogs** (EdChess). Nobody runs a creator program, Telegram Ads at visible scale, or a revenue-share referral. Nobody promotes USDT-denominated, equal-stake PvP with public payout proof.

---

## 5. Telegram mini-app growth playbook 2025–2026

### 5.1 What drove the big spikes
- **Notcoin:**
  - Users: 35M+ in about 2 months [reported, team via Coinlive]; the founder separately cites a ~30M peak (Cointelegraph) [the two figures conflict]
  - **94% of users came from referrals** [reported, team claim, unverified]
  - **"Squads" tied to Telegram channels** (30K+ squads) turned every channel admin into a recruiter
  - Premium users earned referral multipliers
- **Hamster Kombat:**
  - Fixed referral bounties: 5,000 coins per invite, 25,000 for a Premium invite
  - **Upgrade cards gated by the number of invited friends** ("invite 9 friends")
  - Tasks: join the channel, watch YouTube videos, follow socials
  - **Daily combo/cipher** brought people back every day and fuelled third-party "today's combo" SEO and YouTube content (Decrypt, CoinMarketCap guides)
  - Reached 300M registrations [reported]
- **Catizen:**
  - The game itself had IAP from day one: 95% of revenue came from IAP, with 800K paying users at $33 ARPPU by Sep 2024 [reported, company], and later claims of 1M+ payers and $25M+ revenue [unverified]
  - It then became a **platform**: Catizen game center/Studio, bringing WeChat mini-games to Telegram
  - A 2026 post-mortem calls it "the only clear mass-scale success" (dev.to/ton-adoption, 24 May 2026)
- **Cross-promo between mini apps:** "tasks" lists (subscribe to channel X, open mini app Y) became a traded commodity. Ad networks now sell this as a format: Adsgram "task" ads send users to a channel or mini app for an in-app reward. Billing is CPM, optimized toward tCPC/tCPA [reported, Adsgram blog].

### 5.2 Native Telegram distribution levers (2024–2026)
- **Affiliate Programs (Telegram, 4 Dec 2024):** a developer sets a % of future Stars revenue paid to referrers. *Any user or channel* can browse and join programs from its Star Balance, sorted by revenue or potential profit, and commissions arrive in real time (https://telegram.org/blog/affiliate-programs-ai-sticker-search). **This is a free, built-in marketplace of channel-owner affiliates.** It covers Stars revenue only.
- **Mini App Store / Apps tab in global search:**
  - Telegram ranks "popular Main Mini Apps" (`bots.getPopularAppBots`, core.telegram.org)
  - Developers can upload **video and screenshot media previews**
  - Telegram claimed 500M MAU interacting with mini apps when the store launched (Game World Observer, Aug 2024) [reported]
- **Telegram Apps Center (tApps):** submission through **@app_moderation_bot** is free, with a security review. Categories are Productivity & Learning, Entertainment & Social, Finance & Shopping (Adsgram blog, 25 Feb 2025).
- **Independent catalogs:** findmini.app (has a Strategy & Board category), PlayToEarn, DappRadar, Product Hunt. EdChess is on all of them.
- **Curator channels:** @trendingapps (3.54M subscribers) runs "Game Friday" features, as with ChessContestBot.

### 5.3 Telegram Ads: rules and minimums
- **Official getting-started page (ads.telegram.org/getting-started, observed):**
  - **CPM floor: 0.1 Toncoin.** Third-party sources say the TON cabinet is now the "Gram cabinet".
  - No published minimum budget.
  - Ads run only in **public channels with 1,000+ subscribers**, targeted *by channel*.
  - **Links must point to a Telegram channel or bot; external sites are not allowed.**
  - Ads are reviewed. Targeting and budget cannot be edited after submission (budget cannot be decreased).
- **Ad guidelines (ads.telegram.org/guidelines, observed):**
  - **§5.6 prohibits "online or offline gambling, gaming, or casino-based activities involving real money"**, including fantasy sports, odds and tips.
  - §5.7 bans get-rich-quick claims and investment promises with guaranteed returns.
  - Bots must be genuinely interactive; redirect-only bots are not allowed.
  - Crypto is not banned outright.
  - **Implication:** advertise free AI practice, puzzles and tournaments. Never advertise the USDT stakes.
- **Third-party minimums and CPMs [unverified, these conflict]:**
  - Budget floors: "€2 self-serve", "~€500 via reseller", "100 TON (~$600–800)"
  - Crypto-audience CPM: "$0.5–1.5" or "$5–15"
  - Through Adsgram: minimum daily budget 10 USDT and minimum CPM 1 USDT (GetApp listing); Adsgram recommends a 100–250 USDT first test
  - Telegram Ads' native targeting is channel-only. Geo, Premium-user and mini-app placements need networks such as Adsgram, OnClicka or RichAds (invitemember blog, 21 Oct 2025)

### 5.4 What stopped working
- **Post-airdrop churn:**
  - Hamster Kombat fell from ~300M users (Aug 2024) to ~41M (Nov 2024) per Helika; the team says peak MAU was 155M
  - Helika put Q4-2024 Telegram game retention at **5–20%**, against 20–30% for traditional games, with "volatile and low" ARPU (The Block, 7 Feb 2025)
  - TapSwap lost 80%+ during its airdrop delay, and >90% of clones closed [unverified, dev.to post-mortem]
- **Giveaway bursts:** MopsStarsBot went from 436K to 2.29M MAU in one day after a free-Stars giveaway, but **only 8% stayed** (okhlopkov.com, August 2026 trends). Giveaway bots are down 59% from their peak.
- **Tactics named as dead in 2026** (dev.to post-mortem; opinion source):
  - referral-link spam and mass registration drives
  - "guaranteed airdrop" messaging
  - pure-tap gameplay
  - anonymous teams
  - after-the-fact sybil filtering, which reads as bait-and-switch
- **Still growing in 2026 (okhlopkov):** "gift casinos" grew +104% to 3.78M MAU. This shows demand for wagering on Telegram, and also the brand and regulatory company Web3Chess should *not* keep: skill chess must stay clearly separated from casino mechanics.
- **Measurement caveat:** public bot MAU excludes activity inside Mini Apps (okhlopkov), so the t.me "monthly users" counts above undercount.

---

## 6. Comparison table

| | Chess.com | Lichess | Anichess | EdChess | Chess Now / Chess ❤️ | ChessNode | Skillz chess apps | Checkmate.live |
|---|---|---|---|---|---|---|---|---|
| **Status 2026-11-12** | Active, dominant | Active | Active (Season 10) | Active | Active | Dormant since Jul 2026 | Stale (2022 builds) | Active |
| **Platform** | Web + apps | Web + apps | Web (Base) | Telegram mini app | Telegram (group chats) | Telegram + web | iOS/Android | PWA |
| **Verified audience** | 267M members, 10.2M DAU (reported); YouTube 2.98M | YouTube 75.5K | Discord 36.9K, YouTube 1.13K | 20.9K MAU; channels 35.6K + 12.2K | 13.2K MAU (Chess Now) | 18K channel subscribers | 91 ratings (Chess for Cash) | n/a |
| **Main levers** | SEO, ASO, creators, events (PogChamps), 15% affiliate, sales | Word of mouth, "no ads", open source, broadcasts | Chess.com and Carlsen, streamer leagues, seasons, fee-share referral, token listings | Catalogs, daily channel posts, Puzzle Pass quests, awards voting, small arenas | In-chat share links, contest win, curator feature | Token rewards, leaderboards, puzzles site, Lichess team | App-store search, Skillz network | Federation partnership (ACF) |
| **Hook** | "Play chess online for free… 250M members" | "No registration, no ads" | "Chess with a Drop of Magic" | "Play free… earn GRAM rewards" | "Play with friends without leaving Telegram" | "Play-to-earn chess crypto game" | "Win real prizes" | "Play free… pro online tournaments" |
| **Money** | Event prizes only | None | $CHECK buy-in, winner takes all | Gems/GRAM, $30 arenas, NFT-holder share | None (GGS: Stars) | STEIN token | Cash entry fees | Treasury prize pools |
| **Exploitable gap** | No stakes; not in Telegram | No money; no Telegram | Volatile token, wallet friction, spells, no Telegram, weak video | Tiny prizes, declining reach, NFT-gated, no referral | No progression or money | Abandoned audience | Trust (AI opponents, payouts), stale | Niche, federation-centric |

---

## 7. Ten tactics Web3Chess should copy or adapt
Ranked by expected impact relative to effort, for a ~$1,000 / 90-day budget.

**Budget split:** ~$350 prize pools, ~$300 creators, ~$250 paid tests, ~$100 reserve.

1. **Be listed everywhere Telegram users browse** ($0, ~1 day). *Copies EdChess; uses Telegram's Apps tab.*
   - Submit to tApps Center through @app_moderation_bot, findmini.app (Strategy & Board), PlayToEarn, DappRadar and Product Hunt.
   - Configure the **Main Mini App with a video preview and screenshots** so the bot can rank in the Apps tab of global search.
   - Pitch @trendingapps' "Game Friday" (3.54M subscribers; it featured ChessContestBot).
   - This is the cheapest distribution in the category.
2. **A "challenge this chat" viral loop** ($0, dev effort; high impact). *Copies Chess Now / Chess ❤️, the only Telegram chess bots that grew without tokens.*
   - Every finished game and every puzzle result gets a one-tap "challenge a friend / post to group" share, using inline mode or prepared share messages with a deep link and `start` parameter.
   - Groups can start a free game in one tap.
   - Track K-factor per share surface.
3. **Club and channel "squads" with weekly club-vs-club arenas** (medium effort, high impact). *Adapts Notcoin squads and Anichess leagues.*
   - Let any Telegram chess channel or group admin create a club. Members' free-play results feed a weekly club leaderboard.
   - The winning club's admin gets a featured slot in @chess_hub plus a small USDT bonus.
   - This turns the hundreds of small chess channels into recruiters, with no money required from players.
4. **Revenue-share referrals, not signup bounties** (low effort; medium-high impact, compounding). *Copies Anichess's 10% of platform fees from the referee's 3rd match and Chess.com's 15% recurring.*
   - Pay referrers a share of rake from *staked* matches, only after the referee has played N real games. This is anti-sybil by design.
   - Mirror it as a **Telegram Affiliate Program** (Stars share on cosmetics/marketplace) so channel owners can discover Web3Chess from their Star Balance for free.
5. **A weekly free-entry prize arena with a small, real USDT pool** (~$25–30/week, ≈$350 over 90 days). *Copies EdChess's $30 arenas and Anichess's nightly tournaments with free entries.*
   - Free entry keeps this a *sponsored tournament*, not gambling. Pay out in USDT and post the **tonviewer payout link** in the channel each week.
   - This builds the trust signal no competitor shows (Skillz apps' reviews are full of payout doubts) and gives us weekly content.
6. **Season / Puzzle Pass with streaks** (medium effort; retention). *Copies EdChess's Puzzle Pass and Chess.com's new puzzle worlds, streaks and friend challenges.*
   - Run 2–4 week seasons with a free track (cosmetics) and an optional premium track (Stars).
   - The daily puzzle doubles as channel content: ChessNode's free-puzzles post was its best organic post (8.27K views).
   - Retention is where Telegram games die (5–20%), so this protects every other tactic.
7. **A micro-streamer and creator arena** (~$300). *Adapts the Anichess Streamers League (8 Twitch streamers) and Chess.com's affiliate model.*
   - Recruit 3–5 small chess streamers or Telegram chess-channel admins (RU, ES, PT, TR, ID, where Telegram is strong) at $50–100 each.
   - Each plays a "Streamer vs Viewers" free arena inside the mini app, with their own referral link (rev-share from tactic 4).
   - Measure by referred players who play 5+ games.
8. **Small paid tests: Telegram Ads in chess channels and Adsgram task ads** (~$250).
   - Telegram Ads: pick chess-niche channels with 1,000+ subscribers, CPM floor 0.1 TON/GRAM, landing on the bot. **Creative must sell free AI practice and puzzles only** (§5.6 bans real-money gaming ads).
   - Adsgram "task" ads: ~$100–150 for "open mini app / join @chess_hub".
   - Kill any channel with D7 retention below ~10%.
9. **SEO long-tail hub on web3chess.online** ($0, ongoing). *Copies Chess.com's 85.8M clicks per quarter from beginner content.*
   - Target low-competition queries where crypto-chess sites have only thin pages:
     - "play chess in Telegram"
     - "chess for USDT / crypto, is it legal"
     - "TON → GRAM chess"
     - puzzle-of-the-day pages
     - "how stakes and payouts work"
   - **Update all copy from TON to GRAM** (rename around 15 Jun 2026).
10. **Event-hijack and cross-promo swaps** ($0–100).
    - Swap channel-subscription tasks with non-competing TON/GRAM mini apps; the task list is the cheapest way to swap audiences.
    - Enter award votes (EdChess uses the PlayToEarn Blockchain Game Awards as an engagement event).
    - Approach ChessNode's team (public partnership contact) about their dormant 18K-subscriber channel.
    - Run free, clippable "Freestyle/960 Friday"-style formats timed to big chess events.

---

## 8. Tactics to avoid

- **Airdrop, points-farming or "earn" promises.** These caused Hamster Kombat's 300M→41M crash and the clone die-off. They also run into Telegram Ads §5.7 (get-rich-quick) and attract sybils. Keep the "Play & Earn" framing secondary. (Note: @chess_hub's title is currently "Web3 Chess - Play & Earn".)
- **Fixed per-signup referral bounties**, such as Hamster's 5,000 coins per invite. These invite sybil farms and bait-and-switch backlash when filtered later. Pay on real activity or rake only.
- **Advertising USDT stakes**, in Telegram Ads (§5.6), to minors, or into restricted geographies. Keep stakes opt-in, 18+ and geo-gated: at minimum India (Online Gaming Act 2025), and consider the US states Skillz apps exclude (AZ, AR, CT, DE, LA, MT, SC, SD, TN). Lead with free practice.
- **Casino-adjacent mechanics** (crash/mines, gift casinos, loot-box odds). Gift casinos are booming on Telegram, but mixing them with skill chess destroys the "skill, not gambling" position.
- **Giveaway blasts and bought subscribers.** Only 8% of giveaway-acquired users stayed (MopsStarsBot). EdChess's 35.6K-subscriber channel getting ~270 views per post shows what inflated audiences look like.
- **Launching money features without visible anti-cheat.** Immortal Game's play-to-earn economy died of "heavy cheating". Publish fair-play stats, as Chess.com does with 106K closures per month.
- **Token launches or token-denominated prizes.** Anichess and EdChess pay in volatile or illiquid units (CHECK, GRAM, gems, STEIN). USDT plus transparency is our differentiator; don't dilute it.
- **Big-ticket celebrity events** (PogChamps-style) at this budget. Even Chess.com's flagship has lost about half its hours watched since 2020 [unverified]. Borrow creators' audiences through rev-share instead.
- **Doorway or clone bot networks** for Telegram search capture (a 2026 trend per okhlopkov). This risks bans and undermines a money product's trust.

---

## Sources (accessed 2026-11-12)
- Chess.com Board Report 2026 Q2: https://www.chess.com/board-reports/2026-q2
- Chess.com State of Chess 2025: https://www.chess.com/news/view/2025-state-of-chess
- Chess.com affiliate program: https://www.chess.com/amp/article/affiliate-program-for-partners-of-chesscom
- Chess.com / Lichess homepages (titles and descriptions, observed): https://www.chess.com/ , https://lichess.org/
- Lichess End of Year Update 2025 (search snippet; direct fetch 403): https://lichess.org/@/Lichess/blog/lichess-end-of-year-update-2025/YRiNKoaQ
- YouTube channel pages (observed): youtube.com/@chess, /@lichessdotorg, /@Anichess, /@GothamChess
- Anichess Gambit Series and Season 7/8 details: https://egamers.io/anichess-launches-round-1-of-its-gambit-series-with-10000-check-on-the-leaderboard/
- Anichess Masters League and Season 10: https://egamers.io/?p=113161
- Anichess Streamers League: https://egamers.io/anichess-streamers-league-stage-3-guarantees-a-first-time-winner-after-last-weeks-finalists-step-aside/
- Anichess × Chess.com tournament: https://www.chess.com/news/view/announcing-anichess-x-chesscom-tournament
- Anichess Creator Challenge: https://www.chess.com/news/view/announcing-anichess-creator-challenge
- Nansen × Anichess $CHECK: https://www.nansen.ai/post/anichess-nansen-permissionless-rewards
- Anichess Discord (public invite API, observed): https://discord.com/invite/anichess
- Immortal Game ends play-to-earn: https://decrypt.co/209533/checkmate-immortal-game-ditches-chess-nfts-crypto-token-over-heavy-cheating , https://blockworks.co/news/chess-app-suffers-heavy-cheating
- Pixie Chess seed: https://www.pulse.bot/gaming/deals/pixie-chess-secures-52m-seed-funding-to-launch-on-chain-chess-platform-7bdd737f-717d-4538-bd3b-0f5863df8fd7
- findmini chess search: https://www.findmini.app/search/?q=chess
- t.me pages (observed): t.me/edchess_bot, t.me/ChessNowBot, t.me/ChessContestBot, t.me/edchessss, t.me/edchessssss, t.me/chessnode, t.me/s/trendingapps/103, t.me/chess_hub
- EdChess site: https://edchess.io/ ; PlayToEarn listing: https://playtoearn.com/blockchaingame/edchessio
- ChessNode: https://www.chessnode.io/ ; https://lichess.org/team/chessnode
- Chess for Cash (App Store): https://apps.apple.com/app/id1586330040 ; Chess Payday: https://apps.apple.com/app/id1609406107
- Checkmate.live: https://playbook.checkmate.live/about-checkmate-live/about-checkmate , https://www.checkmate.live/
- India Online Gaming Act 2025: https://www.theweek.in/theweek/business/2025/08/30/real-money-gaming-impact-india.html , https://www.barandbench.com/view-point/game-over-rules-reset-by-indias-online-gaming-act
- Telegram Ads getting started: https://ads.telegram.org/getting-started ; guidelines: https://ads.telegram.org/guidelines
- Telegram Ads 2026 (third party): https://blog.invitemember.com/telegram-ads-in-2026-setup-costs-and-requirements/ ; https://tgads.net/blog/en-ton-vs-eur-telegram-ads-2026
- Adsgram: https://cointelegraph.com/news/telegram-adsgram-launch-devs-earn-ton-ads ; https://www.getapp.co.uk/software/2367007/adsgram ; https://adsgram.ai/blog/adsgram/telegram-apps-center-your-gateway-to-mini-apps-bots
- Telegram Affiliate Programs: https://telegram.org/blog/affiliate-programs-ai-sticker-search
- Telegram Mini App Store / popular apps: https://core.telegram.org/method/bots.getPopularAppBots ; https://gameworldobserver.com/2024/08/01/telegram-mini-app-store-500-million-mau-browser
- Helika Q4 2024 Telegram games: https://www.theblock.co/post/339563/telegram-games-had-trouble-earning-revenue-retaining-users-in-q4-report
- Notcoin growth: https://www.coinlive.com/news/a-conversation-with-notcoin-builders-how-to-achieve-the-fastest ; https://cointelegraph.com/news/crypto-game-notcoin-30-million-users-founder-interview
- Hamster Kombat mechanics: https://decrypt.co/235021/hamster-kombat-tips-earn-free-coins-telegram-game-airdrop ; https://kakapo.decrypt.co/237629/hamster-kombat-keeps-demanding-more-friends-enough-already
- Catizen: https://cointelegraph.com/news/telegram-clicker-game-catizen-reaches-800-k-paying-users-first-6-months
- Tap-to-earn post-mortem 2026: https://dev.to/ton-adoption/tap-to-earn-after-hamster-kombat-what-survived-in-2026-531c
- Telegram bot trends Aug 2026: https://okhlopkov.com/en/articles/telegram-bot-trends-august-2026/
- TON → GRAM rename: https://support.bitvavo.com/hc/en-us/articles/47544804986769 ; https://crypto.news/what-is-gram-the-complete-guide-to-the-toncoin-rebrand/
