# Web3Chess: distribution channels and lead sources (checked 2026-11-12)

Companion to `lead_seeds.csv`. Every robots.txt result below was fetched on 2026-11-12. Treat anything marked "verify" as unconfirmed.

---

## (a) Discovery sources that can be queried repeatedly for new leads

| Source | Automated access? | How to use it daily | What it yields |
|---|---|---|---|
| **t.me/<handle>** and **t.me/s/<handle>** (public channel preview) | **Yes.** `t.me/robots.txt` returns 404, which RFC 9309 treats as no restrictions. Keep it polite: at least 2.5 s between requests, a page cap, an honest User-Agent, no login, no MTProto/userbot. | Start from seed handles. For each channel, parse subscriber or member count, description (admin @handles), the last post date, recent view counts, and **outbound @mentions and t.me links**. Queue the mentioned handles and keep any whose title or description matches a chess keyword in the 8 target languages (chess, шахмат, شطرنج, ajedrez, xadrez, satranç, catur, shaxmat, शतरंज). | Verified size and activity. Each snowball round finds new channels. The repo already has a guarded fetcher in `marketing/content-ops/telegram_public.py` (robots check, 2.5 s delay, caps), and the daily crawler is `marketing/leadgen/sources/tg_source.py`. t.me has **no search**, so discovery depends on seeds and mentions. |
| **Lichess API** `GET https://lichess.org/api/team/search?text=<kw>&page=N` | **Yes, through the official API.** The HTML `/team/search` page serves a Cloudflare challenge to scripts. robots.txt disallows `/api/` for *crawlers*, but the API is Lichess's documented programmatic interface. Follow its rules: one request at a time, and back off 60 s after an HTTP 429. | Run daily with keywords `telegram`, `t.me`, `шахматы`, `ajedrez`, `xadrez`, `catur`, `satranç`, `shaxmat`, `شطرنج`. Keep teams that have at least 300 members and a t.me link in the description. Use **team-level data only**: never harvest member lists. | Team name, member count, leader usernames, and the team's Telegram link. 5 pages found 75 Telegram-linked teams, the largest with 15,689 members. This is the best repeatable source of "admins who host sessions". |
| **YouTube Data API v3** (`search.list` type=channel, then `channels.list`) | **Yes, through the API.** YouTube robots.txt disallows `/results` (the search page), so do not scrape it. | `search.list` costs 100 quota units of the 10,000/day default, so about 90 searches a day. Search `q=chess` per language with `relevanceLanguage`, then `channels.list` for `statistics.subscriberCount` and `snippet.description`. Keep channels with 1k–200k subscribers and an upload in the last 30 days. Extract only emails and t.me links that are **printed in the description**. | Size, activity and public contact. vidIQ `channel_search` (5 credits a call) does the same with growth metrics and was used for this seed list. |
| **vidIQ TikTok discovery** | Licensed tool. TikTok's robots.txt blocks Claude agents, `/search` and `/search/user`. | Use the tool. Never scrape tiktok.com. | Handle, followers and recent views. |
| **tApps Center** `https://tapps.center` | **Yes.** robots.txt is `Allow: /` with a `sitemap.xml`. | Poll the sitemap daily for new Games and chess listings: competitors, and casual-game peers for cross-promotion. | Catalog listings. The site links `t.me/trendingapps`. |
| **Telegram Trending Apps channel** `t.me/s/trendingapps` | Yes (t.me). | Watch weekly for featured games and partner programs. | It has 3,535,977 subscribers. It ran a "Game Friday" chess feature in 2023 (post 93). |
| **Chess.com clubs**: PubAPI `https://api.chess.com/pub/club/{url-id}` | robots.txt allows `/club/` pages except `/club/*/join/`. PubAPI is the official read-only API. **Not tested in this run.** | Club IDs cannot be searched through the API. Collect them from creator descriptions and web search, then poll each club for member count and activity. | Club size and admins. |
| **tgstat.com / tgstat.ru** | robots.txt allows category and channel pages (it bans `/*/stat/*`, `/quotes`, `/share` and GPTBot), **but every request from a script got a Cloudflare JS challenge. Do not bypass it.** | **Manual only:** search categories for "шахматы" and "chess". | Rankings, ad prices, admin contacts. |
| **telemetr.io / telemetr.me** | telemetr.io: robots.txt allows catalog pages but returns a Cloudflare challenge, so manual only. telemetr.me: robots.txt **returned 502**. RFC 9309 treats an unreachable robots.txt as disallow, so do not automate. | Manual lookups only. | Subscriber history, ER. |
| **Combot** `combot.org/top/telegram/groups` | Allowed by robots.txt, but the page is rendered in JavaScript, so the HTML contains no data. | Manual. | Group rankings. |
| **Telega.io catalog** | robots.txt disallows `/tme/`, `/c/`, `/n/` and any `?sort=` or `?filter=` parameters. Plain catalog pages are allowed. Not tested. | Manual, or category pages without parameters. | Channels selling posts, with prices. |
| **FindMini** `findmini.app` | **No for AI agents.** robots.txt blocks ClaudeBot, anthropic-ai, GPTBot and others, and sets `Content-Signal: ai-train=no`. | Manual browsing only. | About 6,200 mini apps. |
| **X (x.com)** | **No.** robots.txt has `User-agent: * Disallow: /`. | Only the official paid X API, or manual. | Not collected. All X rows in the CSV are unverified. |
| **Reddit** | **No** (per your instruction and Reddit policy). | Manual reading only. Subreddit names come from search results. | |
| **Discord** server discovery pages / Disboard | Disboard publishes content signals. Discord has no public search API. | Manual. Ask moderators about partner channels. | |
| **Web search** (`site:t.me` plus language keywords) | Yes, through the search API. | Generates seeds weekly. It worked for Persian and Russian channels and poorly for Portuguese, Turkish and Indonesian. | New seed handles. |

**Suggested daily pipeline (about 15 minutes of machine time, polite rates):**
1. Lichess API team search, 9 keywords × 2 pages: new teams with t.me links.
2. Check every new handle on t.me, then snowball through the mentions of verified chess channels, capped at 150 t.me pages a day.
3. YouTube API search: about 30 language/keyword queries a day.
4. tApps sitemap diff.
5. Dedupe against `lead_seeds.csv` by URL, score with the same priority rule, and queue for a **human** to write outreach.

---

## (b) Outreach rules and limits (stay compliant)

**Telegram**
- Telegram's ToS forbids spam. Unsolicited DMs that recipients report get the sender account **limited**: it can then message only mutual contacts, and @SpamBot shows the status. Telegram publishes no safe number. Treat cold DMs as **manual, individually written, and a handful a day per aged account**, and send them only to the admin or "ads" handle the channel itself lists.
- **Never** use userbots or the MTProto API to mass-DM, mass-invite or scrape members. Telegram's API Terms prohibit flooding and spam, and doing so leads to account and app bans.
- A bot **cannot message a user first**: the user must /start it. Bot API rate limits (Telegram Bot FAQ) are about 30 messages/s overall, 1 message/s per chat, and 20 messages/min per group. These apply to our own broadcast bot, not to outreach.
- Prefer each channel's listed route: an "по вопросам рекламы" or "Связь:" handle, the channel's linked chat, or a paid placement through Telega.io.
- **Telegram Ads** (official policy page): ads run only in public channels with 1000+ subscribers, the minimum CPM is 0.1 Toncoin, and the link must point inside Telegram (bot or mini app links are fine). Check the Telegram ad policies on gambling and crypto before mentioning USDT stakes. **Lead every creative with free play** (AI practice, friend challenges).
- **Russia-specific (verify with counsel):** since late 2024, Russian law requires channels with 10k+ subscribers to be in the RKN registry before they may carry ads. Online ads aimed at RU users need ERID marking through an ad-data operator (ОРД). Crypto and gambling advertising is restricted. So in RU, advertise **only the free chess features**, and only in registered channels.
- **Age:** stakes are 18+. Skip stake messaging with kid-focused partners: ChessCoach Andras, chess-kids clubs, the Rumah Catur "young players" group, AAA CHESS.

**X**
- X rules ban bulk, duplicative or unsolicited automated DMs, and X caps daily DMs, more tightly for unverified accounts. A DM works only if the recipient has open DMs or follows you.
- Keep outreach manual: reply first, DM second. Don't automate. X's robots.txt also forbids crawling.

**YouTube**
- The About-page business email sits behind "View email address", which needs sign-in and a reCAPTCHA. **Do not automate it.** Collecting it in bulk breaks YouTube's ToS.
- Use only emails printed in descriptions (these are the CSV entries) or ones viewed manually.
- No promotional comments on creators' videos: YouTube treats them as spam.
- Sponsored integrations must be disclosed: YouTube's "includes paid promotion" box, FTC endorsement guidance, and local equivalents.

**Email (creators, coaches, clubs)**
- US CAN-SPAM: accurate sender, a clear commercial intent, a postal address, and opt-outs honored within 10 business days.
- EU/UK GDPR + ePrivacy: B2B outreach on legitimate interest to an address the person published, minimal data, opt-out in every mail, delete on request.
- Canada CASL: a conspicuously published business address is OK only if the message relates to the person's role.
- One personal email plus at most one follow-up.

**Lichess and Chess.com**
- Lichess is non-commercial. Its ToS forbids spam and advertising in messages, forums and teams, and unsolicited promotional PMs to team leaders can get the account closed. **Contact clubs through the Telegram link or website in the team description, not Lichess PMs.**
- Chess.com community policies likewise ban unsolicited promotion in messages, clubs and forums.
- Join a forum discussion only where it is genuinely relevant (for example, the "telegram chess channels?" thread), and disclose the affiliation.

**Reddit, Discord, TikTok**
- Follow each subreddit's self-promotion rules and read Reddit manually only.
- Discord's ToS bans unsolicited DMs and spam: go through server moderators and partnership channels.
- On TikTok, use the commercial-content disclosure toggle for paid posts. DMs are limited (mutual follows, adults).

---

## (c) The 5 highest-leverage opportunities

1. **Catalog presence on Telegram (free, permanent distribution).**
   - Set the Main Mini App in @BotFather so the bot profile shows a Launch button and the app appears in in-app search.
   - Submit to the **Telegram Apps Center** (route per guides: @app_moderation_bot; verify first).
   - Apply through TON's tApps featuring page.
   - Pitch **@trendingapps** (3.54M subscribers; it ran a chess "Game Friday" feature) and **PlayDeck** for a feature.
   - Effort is about one day of assets: screenshots, a 30-s video, and a description that leads with "free".

2. **Lichess-team ↔ Telegram community admins: the "session host" segment.**
   - These clubs already run Telegram chats plus online arenas: ChessCS (2,886-subscriber channel, 653-member chat), Levitov (12,993-member team, 18.6k TG channel), IM Matvey Galchenko (23k TG), City Chess (10.8k TG), Rumah Catur (2,115-member group), Telegram Satranç (TR), Crypto chess (4,619-member team).
   - Offer a free branded weekly **arena inside Telegram**, which no Lichess link can do, plus a club leaderboard. Optional 18+ stake rooms only where the community is adult and crypto-native.
   - The Lichess API refills this list daily.

3. **RU and Persian Telegram chess media, paid or reciprocal posts.**
   - Шахматы+ (33.4k), Левитов о шахматах (18.6k), Crestbook (9.9k), Moscow Chess Federation (6.3k), Iran Chess Association (13.1k), CHESS & LESSONS (4.6k).
   - Native posts can be bought through Telega.io or the channels' listed contacts. Expect ~8–35K views per post on the larger ones.
   - In Russia, comply with RKN/ERID rules and advertise free features only.

4. **English adult-improver creators and coaches (affiliate or referral deals).**
   - Journey to Grandmaster (73.7k, explicitly adults and seniors), Perpetual Chess Podcast, Blunder Man, Chess Coach Kevin, Dr. Can's Chess Clinic, Coach Daniel Greiner, GM Noel Studer.
   - Hook: "free AI practice and friend challenges inside Telegram, with no app install." The ask is a description link or one segment, with creator-specific codes for attribution.
   - Plus the RU/PT breakout channels (Romaleili runs weekly subscriber tournaments; Humberto Haik, Miya Chess and Dorian Chess are growing 10–18% a month).

5. **A small, measured paid test inside Telegram.**
   - **Telegram Ads:** minimum CPM 0.1 TON. Target chess and board-game channels; ads run only in channels with 1000+ subscribers.
   - **AdsGram:** in-mini-app and channel traffic. Third-party listings quote a minimum of about 10 USDT a day; AdsGram's own blog says about $100 to start.
   - Run 2 weeks with free-play creatives only, attributed through the existing funnel telemetry, before scaling Telega.io channel buys.

**Competitors seen while researching (monitor, don't pitch):**
- EdChess (`edchess_bot`, already linked from the K2N_chess Lichess team)
- ChessNode (`chessnode`, `chessnode_bot`)
- Take Take Take (YouTube 200k)
- Chess TON / Tonches (`chess_ton`, `tonchess`): tiny and dormant
