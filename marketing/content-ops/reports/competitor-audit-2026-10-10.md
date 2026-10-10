# Competitor and viral-source audit, 10 October 2026

Prepared by the Competitive Intelligence Analyst for the CMO. Scope: two public Telegram channels (chesscom_ru and edchessss), a verified list of further sources to monitor, and a ranked set of formats, slots and hook templates for the 5-posts-per-day Telegram plan and the 5-articles-per-day blog plan. Raw data: `marketing/content-ops/state/telegram_posts.sqlite3` (ignored by Git). Machine-readable twin: `competitor-audit-2026-10-10.json`. Scraper: `telegram_public.py`; analysis: `telegram_audit.py`.

## 1. What the data says (read this first)

1. **Reach barely depends on format; engagement does.** Inside each channel, the median views of every content type sit between 0.9x and 1.25x the channel's age-matched baseline. What moves is the reaction rate: short culture captions and image-only posts earn about double the channel median in chesscom_ru (39.4 and 29.1 vs 18.6 reactions per 1K views), and emoji-as-answer puzzles earn about 40% more in EdChess (16.0 vs 11.3, p=0.003).
2. **A big subscriber count is not reach.** chesscom_ru (9,490 subscribers) gets a median of 4,760 views per post, about 50% of subscribers. EdChess (36,900 subscribers) gets 2,110, about 6%, and its median fell from 4,100 (March 2026) to 1,840-1,940 (August-September 2026).
3. **Cadence is falling at both channels.** chesscom_ru averaged 1.03 posts a day over ten months but published only 11 in the last 30 days. EdChess averages 0.65 a day (29 in the last 30). Neither publishes 5 a day, so our plan enters a thinly occupied space; the risk is dilution, not competition (chesscom_ru's per-post views drop about 7-10% when four or more posts land inside 24 hours).
4. **Time of day has almost no measurable effect on normalised views** (4-hour block medians 0.97-1.08x in both channels). The slot plan therefore optimises spacing and time zones and is a test, not an established optimum.
5. **The competitor with a product (EdChess) promises earnings; the one with reach (chesscom_ru) never sells.** 99 of 329 EdChess posts say "earn" and 5 contain any risk wording. Do not follow it. chesscom_ru has 0 hashtags, 0 buttons and a link on 17.5% of posts, and still out-reaches EdChess per subscriber by roughly eight times.

## 2. Methodology and limitations

**Collection.** `telegram_public.py` reads `https://t.me/s/<channel>` and pages backwards with `?before=<id>`. It honours robots.txt (t.me/robots.txt returned 404, meaning no restrictions), waits at least 2.5 seconds between requests, caps pages (default 25, hard ceiling 60), sends the User-Agent `Web3ChessContentResearch/1.0`, accepts only HTTPS to t.me, rejects non-public IPs, caps response size, never logs in, never downloads media and never stores image URLs. 46 requests per scrape; no blocking, CAPTCHA or rate-limit response was encountered.

**Sample.** chesscom_ru: 326 posts from 2025-11-25 to 2026-10-08. EdChess: 329 posts from 2025-05-24 to 2026-10-10. Albums count as one post. Service messages (pins) are skipped.

**Normalisation.** For every post, `x baseline` = its views divided by the median views of the 30 mature posts closest to it in age. Posts younger than 7 days are provisional and excluded from rankings. Reaction rate = visible reactions divided by views, shown per 1,000 views; reaction-rate rankings ignore posts below the channel's 25th views percentile (3,540 views for chesscom_ru, 1,432 for EdChess). Group comparisons use permutation tests on medians.

**Limitations.**
- Only public preview data: views (rounded by Telegram, for example 2.19K), reactions (visible counts only), dates and text. No reach, no unique viewers, no demographics, no click or conversion data, and no replies or forward counts (the preview does not expose them for these channels).
- Views accumulate with age and a single snapshot cannot show the curve. Posts younger than 7 days are excluded from rankings and baselines (1 chesscom_ru post, 7 EdChess posts). A second snapshot was taken a few hours after the first and stored as a separate observation, but that gap is too short to estimate growth. Re-run the scraper weekly to build real age curves.
- Normalisation: each post is compared with the median views of the 30 mature posts closest to it in age, which also controls for audience growth and decline. This controls for time, not for topic or for paid promotion.
- Subscribers are the current count; the past subscriber count of each channel is unknown. EdChess early posts (2025) have lower views partly because the channel was smaller.
- Content-type and hook labels are rule-based first passes with manual corrections on the lists shown. They are judgement calls. Medal-list and news categories overlap.
- Statistical tests are permutation tests on medians with no correction for the 24 comparisons made; read p-values below about 0.01 as suggestive and anything near 0.05 as noise.
- Images and video are not visible in the preview and were deliberately not downloaded, so visual hooks, thumbnails and meme content could not be judged. Image-only posts are therefore a known gap.
- Three EdChess posts show 8x to 32x baseline views; they look paid or partner-boosted. They are shown but should not be read as organic virality.
- The two channels are not comparable by raw views: chesscom_ru has about 0.50 views per subscriber, EdChess about 0.06. EdChess's subscriber base is large but its posts reach a small share of it.
- Reddit: three content requests (the .json endpoint twice, RSS once) were made to test access before robots.txt was read, then robots.txt itself, then one more request to the r/AnarchyChess page after it had been read, which was a mistake. reddit.com/robots.txt disallows all automated access, so no further Reddit requests were made and no Reddit post data was used or stored.
- YouTube channel pages (youtube.com/@handle, about 20 requests, allowed by its robots.txt) were opened only to confirm the handles resolve; YouTube feeds were not requested.
- The vidIQ index supplied YouTube channel ids and subscriber counts; those figures are third-party estimates. The YouTube Data API itself was not called.

## 3. chesscom_ru (Chess.com - Шахматы, Russian)

Profile: public channel, 9,490 subscribers at capture, text-led news with one image or an album, no hashtags, no inline buttons, reactions on every post. Views per post: median 4,760, 10th to 90th percentile 2,988 to 6,366, maximum 9,710.

### Cadence and timing
1.03 posts per day over 317.2 days; median gap 20.5 hours, 90th percentile 48.8 hours, longest gap 13.0 days. Last 30 days: 11 posts; last 90 days: 35.

Posts by UTC hour (hour:count): 00:9 05:1 06:3 07:7 08:11 09:23 10:31 11:34 12:22 13:18 14:15 15:19 16:21 17:18 18:18 19:15 20:14 21:11 22:13 23:23.

| UTC block | Mature posts | Median x baseline |
|---|---|---|
| 00-03 | 9 | 1.05 |
| 04-07 | 11 | 1.08 |
| 08-11 | 99 | 1.04 |
| 12-15 | 74 | 0.98 |
| 16-19 | 71 | 1.06 |
| 20-23 | 61 | 1.02 |

By weekday (mature posts): Mon n=55 median 1.0, Tue n=67 median 1.0, Wed n=53 median 1.06, Thu n=34 median 1.05, Fri n=31 median 1.08, Sat n=41 median 1.0, Sun n=44 median 1.02.

Best hours: activity peaks at 09-12 UTC (34% of posts) with a second wave 16-19 UTC; normalised views are flat across the day, so there is no proven best hour. Tuesday is the busiest day (Titled Tuesday coverage).

Posts per day matter more than hour: with four or more posts within +/-12 hours, median x baseline is 0.96 (4-6 posts) and 0.98 (7+) against 1.07 for posts that stand alone.

### Media, length and conventions
| Media | Posts | Share | Median x baseline | Median reactions per 1K views |
|---|---|---|---|---|
| photo | 175 | 53.7% | 1.03 | 21.0 |
| photo (album) | 141 | 43.3% | 1.02 | 16.4 |
| video | 5 | 1.5% | 1.0 | 33.8 |
| none | 2 | 0.6% | 0.87 | 12.0 |
| poll | 2 | 0.6% | 0.85 | 11.1 |
| link-preview | 1 | 0.3% | 1.1 | 18.2 |

Characters per post (percentiles): p10 20, p25 103, p50 192, p75 233, p90 276; maximum 1159.

| Text length (chars) | Posts | Share | Median x baseline | Median reactions per 1K views |
|---|---|---|---|---|
| 101-300 | 228 | 70% | 1.02 | 18.0 |
| 1-100 | 57 | 18% | 1.07 | 23.8 |
| 0 (media only) | 22 | 7% | 1.01 | 28.8 |
| 301-600 | 18 | 6% | 1.07 | 15.6 |
| 601+ | 1 | 0% | 1.1 | 18.2 |

Conventions observed: one headline sentence naming a person plus a verb and result, usually ending with an emoji (trophy 111 posts, lightning 86); medal lines using the gold, silver and bronze medal emojis; a camera-emoji photo credit line in 125 posts; a paperclip line linking a game or results table in 81 posts; the microphone emoji for quotes; the puzzle-piece emoji for puzzles. No hashtags, no inline buttons; 27 posts edited (live "UPD" updates). Top reactions: heart (15,781), thumbs up, laughing face, fire, lightning.

Reaction rate fell from 22.0 (Dec 2025) to 10.6-12.8 per 1K (May-Aug 2026), then rose to 23.5 in September (world team olympiad coverage):

| Month | Posts | Median views (posts older than 7 days) | Median reactions per 1K views |
|---|---|---|---|
| 2025-11 | 10 | 4815.0 | 32.3 |
| 2025-12 | 81 | 4190 | 22.0 |
| 2026-01 | 35 | 5070 | 19.2 |
| 2026-02 | 29 | 5830 | 20.8 |
| 2026-03 | 33 | 4290 | 20.2 |
| 2026-04 | 59 | 3390 | 15.3 |
| 2026-05 | 20 | 4835.0 | 12.8 |
| 2026-06 | 19 | 4890 | 12.4 |
| 2026-07 | 12 | 5860.0 | 10.6 |
| 2026-08 | 13 | 5560 | 10.9 |
| 2026-09 | 14 | 4330.0 | 23.5 |
| 2026-10 | 1 | None | None |

### Performance by content type
| Content type (first-pass rules, reviewed) | Posts | Share | Median x baseline | Median reactions per 1K views | Share of channel top decile |
|---|---|---|---|---|---|
| live standings / round result | 95 | 29% | 1.0 | 16.6 | 0.12 |
| results table (medals) | 51 | 16% | 1.06 | 15.0 | 0.19 |
| winner announcement | 29 | 9% | 1.06 | 20.6 | 0.19 |
| image/video only (no caption) | 20 | 6% | 1.02 | 29.1 | 0.03 |
| puzzle (find the move) | 20 | 6% | 1.08 | 15.2 | 0.03 |
| preview / schedule | 18 | 6% | 0.96 | 16.2 | 0.09 |
| record / first-ever / milestone | 15 | 5% | 1.24 | 23.2 | 0.16 |
| rating / ranking update | 15 | 5% | 1.02 | 18.0 | 0.03 |
| blunder / drama moment | 15 | 5% | 0.94 | 23.6 | 0.0 |
| audience prompt / UGC | 11 | 3% | 0.98 | 20.5 | 0.03 |
| quote / interview | 10 | 3% | 1.16 | 30.9 | 0.09 |
| meme / humour caption | 9 | 3% | 0.96 | 37.6 | 0.0 |
| history / anniversary / tribute | 8 | 2% | 1.07 | 37.4 | 0.0 |
| channel / admin note | 5 | 2% | 1.03 | 18.2 | 0.03 |
| other / unclassified | 2 | 1% | 1.08 | 17.4 | 0.0 |
| native poll / quiz | 2 | 1% | 0.85 | 11.1 | 0.0 |
| did-you-know fact | 1 | 0% | 0.96 | 41.0 | 0.0 |

### Performance by hook pattern
| Hook pattern | Posts | Median x baseline | Median reactions per 1K views |
|---|---|---|---|
| emoji-led news headline (⚡ / 🏆) | 101 | 1.02 | 18.0 |
| plain news headline (name + verb + result) | 78 | 1.0 | 19.3 |
| medal list (🥇🥈🥉 results) | 51 | 1.06 | 15.0 |
| no caption (image or clip carries it) | 20 | 1.02 | 29.1 |
| puzzle prompt (position image + one-line task) | 20 | 1.08 | 15.2 |
| question to the audience | 16 | 0.96 | 18.3 |
| number-first shock stat | 13 | 1.08 | 24.2 |
| short caption / meme | 10 | 0.97 | 39.4 |
| quote card (player voice) | 8 | 1.06 | 22.7 |
| record / superlative claim | 7 | 1.27 | 30.2 |
| native poll | 2 | 0.85 | 11.1 |

### Group comparisons (mature posts)
| Group vs all other mature posts | n | Median x baseline: group vs rest | Median reactions per 1K views: group vs rest |
|---|---|---|---|
| record/superlative | 7 | 1.27 vs 1.02 (p=0.0084) | 30.2 vs 18.89 (p=0.0336) |
| number-first shock stat | 13 | 1.08 vs 1.02 (p=0.3475) | 24.17 vs 18.77 (p=0.0896) |
| puzzle prompt | 20 | 1.08 vs 1.02 (p=0.2278) | 15.22 vs 19.17 (p=0.126) |
| short caption / meme | 10 | 0.97 vs 1.02 (p=0.4419) | 39.36 vs 18.57 (p=0.0006) |
| medal list | 51 | 1.06 vs 1.01 (p=0.1624) | 15.03 vs 19.62 (p=0.008) |
| no caption | 20 | 1.02 vs 1.02 (p=0.8882) | 29.13 vs 18.18 (p=0.0008) |
| history/tribute | 8 | 1.07 vs 1.02 (p=0.5321) | 37.41 vs 18.68 (p=0.002) |
| album (2+ images) | 141 | 1.02 vs 1.02 (p=0.8544) | 16.43 vs 20.99 (p=0.0004) |

### Top 25 by normalised views
| # | Date (UTC) | Media | Views | x baseline | Reactions per 1K views | Content type | Hook | Evidence excerpt (short) |
|---|---|---|---:|---:|---:|---|---|---|
| 1 | [2026-04-03](https://t.me/chesscom_ru/9429) | photo x2 | 6,610 | 2.23 | 10.1 | record / first-ever / milestone | number-first shock stat | 67 минут 44 секунды Столько Хикару думал над 13-м ходом в сегодняшней партии 🤯 Рекорд турн… (How long Hikaru thought on move 13 (67 min 44 s); Candidates record) |
| 2 | [2026-04-01](https://t.me/chesscom_ru/9410) | photo | 6,690 | 2.22 | 14.9 | rating / ranking update | rating-ladder comparison | Жавохир Синдаров уже восьмой в лайф-рейтинге ФИДЕ 📈 Фаби добирается до Хикару 🔥 (Sindarov now 8th on the live FIDE list; Fabi closing on Hikaru) |
| 3 | [2026-01-02](https://t.me/chesscom_ru/9253) | photo | 7,050 | 2.01 | 16.6 | preview / schedule | official list announcement | ФИДЕ объявила всех участником турниров претендентов 2026 🏆 Фабиано Каруана Аниш Гири Матти… (FIDE names the full 2026 Candidates field) |
| 4 | [2025-11-25](https://t.me/chesscom_ru/9104) | photo | 9,390 | 1.99 | 34.9 | quote / interview | player quote + audience question | ❓ Как вы будете праздновать выход в Турнир претендентов? 🎙️ Андрей Есипенко: «Наверное, я … (How will you celebrate qualifying? Esipenko quote) |
| 5 | [2025-12-31](https://t.me/chesscom_ru/9248) | photo x4 | 6,570 | 1.92 | 16.1 | winner announcement | wrap-up + seasonal greeting | Чемпионат мира по рапиду и блицу 2025 официально завершен 🏆 Всех с Наступающим Новым годом… (World Rapid & Blitz 2025 officially over; New Year greeting) |
| 6 | [2026-04-09](https://t.me/chesscom_ru/9471) | photo | 5,530 | 1.82 | 17.5 | record / first-ever / milestone | record + winning streak | ⚡️ Есть шестая победа и рекорд турниров претендентов! Жавохир Синдаров продолжает творить … (Sixth win, Candidates record; "making history") |
| 7 | [2026-01-19](https://t.me/chesscom_ru/9280) | photo x2 | 8,980 | 1.80 | 6.6 | live standings / round result | round result + standings | Маттиас Блюбаум победил Винсента Каймера и присоединился к лидерам! Tata Steel Chess / Тур… (Tata Steel round 3: Blubaum beats Keymer, joins leaders) |
| 8 | [2026-01-03](https://t.me/chesscom_ru/9254) | photo | 6,550 | 1.80 | 24.7 | audience prompt / UGC | community nostalgia + question | Скриншот из нашего чата от 1 января 2022 года 😍 А как вы встретили Новый год? 🎄 (Screenshot from our chat, 1 Jan 2022; how did you spend New Year?) |
| 9 | [2026-04-15](https://t.me/chesscom_ru/9509) | photo x5 | 6,360 | 1.76 | 13.5 | live standings / round result | human moment photo | Вайшали и её семья 😍 Пару минут спустя после победы в турнире претенденток 🏆 📸 M.Walusza /… (Vaishali with her family minutes after winning the Candidates) |
| 10 | [2026-05-06](https://t.me/chesscom_ru/9547) | photo x3 | 8,120 | 1.69 | 5.5 | preview / schedule | standings + trivia aside | Ханс Ниманн и Уэсли Со лидируют после второго игрового дня Super Rapid & Blitz Poland 🏆 Из… (Niemann and So lead after day 2; Gukesh beat his future rival) |
| 11 | [2025-12-30](https://t.me/chesscom_ru/9246) | photo | 5,690 | 1.67 | 38.8 | winner announcement | champion headline | Магнус Карлсен — чемпион мира по блицу 2025 🏆 Он защитил свой титул третий раз подряд, поб… (Carlsen world blitz champion 2025, third title in a row) |
| 12 | [2026-03-20](https://t.me/chesscom_ru/9378) | photo | 5,960 | 1.66 | 13.8 | record / first-ever / milestone | celebrity-investor news | Нападающий сборной Норвегии и Манчестер Сити Эрлинг Холанн стал одним из инвесторов Total … (Haaland among investors in a chess world tour) |
| 13 | [2026-01-06](https://t.me/chesscom_ru/9256) | photo | 6,850 | 1.61 | 21.2 | results table (medals) | medal list | Магнус Карлсен выиграл первый Титульный Вторник 2026 года 🏆 🥇 Магнус Карлсен - 9,5 🥈 Винсе… (Carlsen wins first Titled Tuesday of 2026; medal list + table link) |
| 14 | [2026-08-04](https://t.me/chesscom_ru/9635) | photo | 9,210 | 1.60 | 10.9 | results table (medals) | medal list + streak-ending | Магнус Карлсен выиграл Титульный Вторник впервые с 20 января 2026 года! Поздравляем 👏 🥇 Ма… (Carlsen wins Titled Tuesday for the first time since January) |
| 15 | [2026-02-22](https://t.me/chesscom_ru/9347) | photo | 9,710 | 1.59 | 28.8 | image/video only (no caption) | no caption |  (Image-only post (picture not visible in the preview)) |
| 16 | [2026-07-11](https://t.me/chesscom_ru/9620) | photo x2 | 8,590 | 1.56 | 5.4 | channel / admin note | event preview + results | На днях стартовал Speed Chess Championship 2026 среди женщин! Уже прошли первые матчи 1/8 … (Women's Speed Chess Championship: round-of-16 results) |
| 17 | [2025-12-24](https://t.me/chesscom_ru/9166) | photo | 5,100 | 1.54 | 30.2 | record / first-ever / milestone | record | Хикару Накамура установил очередной рекорд Chess.com! 3441 пункт в блиц 🤩 (Hikaru sets another Chess.com record: 3441 blitz) |
| 18 | [2026-01-05](https://t.me/chesscom_ru/9255) | photo | 5,890 | 1.52 | 32.8 | quote / interview | status-change trivia | 👑 17-й чемпион мира Дин Лижэнь не играл в классику больше года! Таким образом, он перешел … (Ding Liren has not played classical for a year, so he drops off the active list) |
| 19 | [2025-12-29](https://t.me/chesscom_ru/9203) | photo | 4,970 | 1.52 | 21.5 | record / first-ever / milestone | quirky opening + live update | Александр Бортник начал партию с Магнусом Карсеном ходом 1.а3 ☺️ Пока у обоих шахматистов … (Opponent opens 1.a3 against Magnus; both 4.5/5; update: draw) |
| 20 | [2026-09-08](https://t.me/chesscom_ru/9655) | photo | 7,940 | 1.52 | 5.3 | results table (medals) | medal list | Ле Куанг Льем — победитель Титульного Вторника 🎉 🥇 Ле Куанг Льем - 9,5 🥈 Хикару Накамура -… (Le Quang Liem wins Titled Tuesday) |
| 21 | [2025-12-24](https://t.me/chesscom_ru/9165) | photo | 4,960 | 1.50 | 13.5 | results table (medals) | medal list | Ян-Кшиштоф Дуда выиграл Титульный Вторник 🏆 🥇 Ян-Кшиштоф Дуда - 9,5/11 🥈 Максим Вашье-Лагр… (Duda wins Titled Tuesday) |
| 22 | [2026-01-01](https://t.me/chesscom_ru/9252) | photo | 5,020 | 1.45 | 44.6 | live standings / round result | holiday + clock pun | ⚡️ Официально: у 2025 закончилось время! Всех с Новым 2026 годом! 🎄 (Officially: 2025 ran out of time; Happy 2026) |
| 23 | [2025-12-30](https://t.me/chesscom_ru/9239) | photo | 4,900 | 1.43 | 14.5 | preview / schedule | scoreboard | Результаты полуфиналов после двух партий: Абдусатторов 2:0 Эригайси Карлсен 1:1 Каруана (Semifinal results after two games) |
| 24 | [2025-12-26](https://t.me/chesscom_ru/9169) | photo | 4,670 | 1.43 | 17.8 | live standings / round result | highlight + game link | Александр Грищук поставил красивый мат во втором туре чемпионата мира по рапиду 🎄 📎 Партия… (Grischuk plays a beautiful mate in round 2) |
| 25 | [2026-06-23](https://t.me/chesscom_ru/9607) | photo x5 | 7,100 | 1.43 | 9.2 | quote / interview | team win | Команда “Dragon Chilling” во главе с Дин Лижэнем оформила золотой дубль, выиграв командные… (Dragon Chilling (Ding Liren) wins team rapid and blitz double) |

Pattern: star-name news (Hikaru, Sindarov, Carlsen) and record claims lead; 3 of the top 25 are Titled Tuesday medal lists, which win on reach but not on reactions (see tests). Numbers at the start ("67 min 44 s") and a rating-ladder comparison head the list.

### Top 25 by reaction rate (posts above the 25th views percentile)
| # | Date (UTC) | Media | Views | x baseline | Reactions per 1K views | Content type | Hook | Evidence excerpt (short) |
|---|---|---|---:|---:|---:|---|---|---|
| 1 | [2025-11-30](https://t.me/chesscom_ru/9116) | photo | 4,740 | 1.00 | 62.9 | history / anniversary / tribute | birthday | Сегодня 16-му чемпиону мира Магнусу Карлсену исполняется 35 лет 🎉 (Magnus Carlsen turns 35) |
| 2 | [2026-03-22](https://t.me/chesscom_ru/9379) | photo | 3,630 | 1.02 | 54.0 | history / anniversary / tribute | birthday + good-luck wish | Сегодня Андрею Есипенко исполняется 24 года 🎉 Поздравляем Андрея с Днём Рождения и желаем … (Esipenko turns 24, good luck at the Candidates) |
| 3 | [2026-04-10](https://t.me/chesscom_ru/9478) | photo | 3,930 | 1.26 | 47.6 | quote / interview | one-line reaction | Ханс поддерживает Синдарова! (Hans supports Sindarov!) |
| 4 | [2026-02-12](https://t.me/chesscom_ru/9334) | photo | 5,570 | 0.99 | 45.8 | image/video only (no caption) | no caption |  (Image-only post) |
| 5 | [2026-04-14](https://t.me/chesscom_ru/9494) | photo | 4,790 | 1.37 | 45.7 | winner announcement | winner + next step | Жавохир Синдаров досрочно побеждает в турнире претендентов 2026 🏆 Он сыграет матч на перве… (Sindarov wins the Candidates early; faces Gukesh in the title match) |
| 6 | [2026-01-01](https://t.me/chesscom_ru/9252) | photo | 5,020 | 1.45 | 44.6 | live standings / round result | holiday + clock pun | ⚡️ Официально: у 2025 закончилось время! Всех с Новым 2026 годом! 🎄 (Officially: 2025 ran out of time; Happy 2026) |
| 7 | [2026-01-27](https://t.me/chesscom_ru/9303) | photo | 4,880 | 0.98 | 43.9 | meme / humour caption | one-line meme | Хотя бы ещё одну! ("At least one more!" caption) |
| 8 | [2026-02-19](https://t.me/chesscom_ru/9345) | photo | 7,030 | 1.17 | 43.5 | history / anniversary / tribute | obituary | Вчера ушёл из жизни известный шахматист Ян Тимман Ему было 74 года. Соболезнования родным … (Jan Timman has died, aged 74) |
| 9 | [2025-12-14](https://t.me/chesscom_ru/9153) | photo | 5,620 | 1.11 | 42.3 | history / anniversary / tribute | personal news | Поздравляем Хикару и Атусу с рождением ребёнка 💚 (Congratulations to Hikaru and Atusu on their baby) |
| 10 | [2026-03-25](https://t.me/chesscom_ru/9383) | photo | 4,290 | 1.33 | 42.2 | image/video only (no caption) | no caption |  (Image-only post) |
| 11 | [2025-11-25](https://t.me/chesscom_ru/9103) | photo | 4,010 | 0.85 | 42.1 | meme / humour caption | humour caption | Андрей нашел самый эффектный выигрыш сегодня 🎉 (Andrei found the most spectacular win of the day) |
| 12 | [2025-11-28](https://t.me/chesscom_ru/9111) | photo x2 | 4,560 | 0.96 | 41.0 | did-you-know fact | did-you-know fact | 🏆 Интересный факт: обоим победителям кубка мира 2025 всего по 19 лет 🗓️ Причем они родилис… (Both World Cup winners are 19 and share almost a birthday) |
| 13 | [2026-02-01](https://t.me/chesscom_ru/9311) | photo | 4,700 | 0.92 | 40.6 | winner announcement | winner + nickname | Нодирбек Абдусатторов — победитель Tata Steel Chess Masters 2026 🏆 Узбекистанский гроссмей… (Abdusattorov wins Tata Steel Masters ("chess Wimbledon")) |
| 14 | [2025-11-26](https://t.me/chesscom_ru/9106) | photo | 5,070 | 1.07 | 40.4 | record / first-ever / milestone | record | Жавохир Синдаров — победитель Кубка мира 2025 🏆 В финале он победил Вэй И со счётом 2,5:1,… (Sindarov wins the World Cup 2025, youngest winner) |
| 15 | [2026-01-16](https://t.me/chesscom_ru/9276) | photo | 5,110 | 1.01 | 40.1 | results table (medals) | medal list | Ян Непомнящий выиграл Титульную Пятницу 🏆 🥇 Ян Непомнящий - 9,5 🥈 Амин Табатабаи - 8,5 🥉 Р… (Nepomniachtchi wins Titled Friday) |
| 16 | [2025-12-30](https://t.me/chesscom_ru/9246) | photo | 5,690 | 1.67 | 38.8 | winner announcement | champion headline | Магнус Карлсен — чемпион мира по блицу 2025 🏆 Он защитил свой титул третий раз подряд, поб… (Carlsen world blitz champion 2025, third title in a row) |
| 17 | [2026-01-30](https://t.me/chesscom_ru/9306) | photo | 4,410 | 0.87 | 37.6 | meme / humour caption | emoji-only | 🚩 (Single red flag emoji) |
| 18 | [2026-03-02](https://t.me/chesscom_ru/9360) | video | 5,440 | 0.89 | 37.5 | meme / humour caption | emoji-only clip | 🐴 (Single horse emoji on a video) |
| 19 | [2025-12-06](https://t.me/chesscom_ru/9129) | photo | 4,210 | 0.89 | 35.9 | live standings / round result | performance stat | Нодирбек Абдусатторов немного сбавил темп под конец турнира! Его перформанс составил 2932 … (Abdusattorov slows at the end; performance 2932) |
| 20 | [2025-12-04](https://t.me/chesscom_ru/9126) | photo | 4,660 | 0.98 | 35.4 | image/video only (no caption) | no caption |  (Image-only post) |
| 21 | [2026-02-27](https://t.me/chesscom_ru/9352) | photo | 6,210 | 1.03 | 35.3 | channel / admin note | milestone thank-you | 250 миллионов пользователей на Chess.com 🏆 Спасибо каждому из вас!!! (250 million users on Chess.com, thank you) |
| 22 | [2026-07-20](https://t.me/chesscom_ru/9626) | photo | 5,290 | 0.90 | 35.2 | channel / admin note | seasonal greeting | Друзья, всех с Международным Днем Шахмат! 🎉 Извините, что с опозданием 🥺 Играйте в шахматы… (World Chess Day greeting (posted late, with an apology)) |
| 23 | [2025-11-25](https://t.me/chesscom_ru/9104) | photo | 9,390 | 1.99 | 34.9 | quote / interview | player quote + audience question | ❓ Как вы будете праздновать выход в Турнир претендентов? 🎙️ Андрей Есипенко: «Наверное, я … (How will you celebrate qualifying? Esipenko quote) |
| 24 | [2026-01-20](https://t.me/chesscom_ru/9283) | photo | 4,040 | 0.80 | 33.9 | audience prompt / UGC | caption-this prompt | Друзья, тут нужно придумать подпись к фото 😍 📸 Леннарт Утс / Tata Steel Chess (Caption this photo (audience prompt)) |
| 25 | [2026-01-20](https://t.me/chesscom_ru/9282) | video | 4,380 | 0.87 | 33.8 | blunder / drama moment | clip + human moment | Василий Иванчук прошел контроль, сделав 40-й ход с одной секундой на часах ⏰ Зрители в зал… (Ivanchuk makes move 40 with one second left; hall applauds) |

Pattern: the highest reaction rates come from low-effort, human posts: birthdays, one-line captions, emoji-only posts, image-only posts, an obituary and a family news item. They do not out-reach news posts.

### Bottom decile (32 posts, 12 lowest shown) for contrast
| # | Date (UTC) | Media | Views | x baseline | Reactions per 1K views | Content type | Hook | Evidence excerpt (short) |
|---|---|---|---:|---:|---:|---|---|---|
| 1 | [2026-09-28](https://t.me/chesscom_ru/9674) | photo x4 | 2,190 | 0.41 | 26.5 | results table (medals) | medal list (🥇🥈🥉 results) | Итоги Всемирной шахматной Олимпиады 2026 в Самарканде 🏆 🥇 Узбекистан - 20 🥈 Индия - 18 🥉 Г… |
| 2 | [2026-09-27](https://t.me/chesscom_ru/9659) | photo x4 | 2,820 | 0.53 | 23.8 | winner announcement | emoji-led news headline (⚡ / 🏆) | Женская Сборная Китая — победители Всемирной Шахматной Олимпиады 2026 среди женщин 🏆 📸 ФИД… |
| 3 | [2026-09-28](https://t.me/chesscom_ru/9678) | photo x4 | 2,850 | 0.54 | 13.0 | results table (medals) | medal list (🥇🥈🥉 results) | Всемирная шахматная Олимпиада среди женщин 2026 🏆 🥇 Китай - 20 🥈 Казахстан - 18 🥉 Индия - … |
| 4 | [2026-09-27](https://t.me/chesscom_ru/9663) | photo x5 | 3,000 | 0.57 | 46.7 | results table (medals) | medal list (🥇🥈🥉 results) | Сборная Узбекистана выигрывает Всемирную шахматную Олимпиаду 2026 🏆 🥇Состав команды: Нодир… |
| 5 | [2026-09-27](https://t.me/chesscom_ru/9669) | photo x5 | 3,040 | 0.58 | 28.3 | winner announcement | emoji-led news headline (⚡ / 🏆) | Женская сборная Казахстана второй раз подряд выигрывает серебряные медали Всемирной шахмат… |
| 6 | [2026-04-14](https://t.me/chesscom_ru/9495) | photo | 2,280 | 0.63 | 108.3 | audience prompt / UGC | short caption / meme | Мой чемпион❤️ |
| 7 | [2026-09-28](https://t.me/chesscom_ru/9682) | photo x2 | 3,450 | 0.65 | 30.7 | quote / interview | quote card (player voice) | 🎙️ Жавохир Синдаров после победы в Самарканде: Все знают, что я должен сделать дальше 👑 Ма… |
| 8 | [2026-05-04](https://t.me/chesscom_ru/9540) | photo x2 | 3,430 | 0.71 | 14.0 | quote / interview | quote card (player voice) | Нодирбек Абдусатторов: «Я знаю, что он так постоянно делает! Это его поведение, его решени… |
| 9 | [2025-12-09](https://t.me/chesscom_ru/9133) | photo x2 | 3,520 | 0.71 | 19.9 | preview / schedule | question to the audience | Жавохир Синдаров выиграл круговой турнир Freestyle Chess в Кейптауне с результатом 5,5/7 ⚡… |
| 10 | [2026-09-28](https://t.me/chesscom_ru/9684) | poll | 3,840 | 0.73 | 13.8 | native poll / quiz | native poll | Кто победит в матче на первенство мира 2026? 👑 |
| 11 | [2026-05-03](https://t.me/chesscom_ru/9538) | photo x2 | 3,520 | 0.73 | 11.9 | live standings / round result | emoji-led news headline (⚡ / 🏆) | Магнус одерживает первую победу в TePe Sigeman ⚡️ 📎 Результаты 2-го тура: Гранделиус 0:1 К… |
| 12 | [2026-07-01](https://t.me/chesscom_ru/9616) | none | 4,190 | 0.76 | 10.7 | channel / admin note | plain news headline (name + verb + result) | Желаем удачи Илье и команде канала! В будущем ждем большого камбэка! Спасибо, Левитовчесс! |

Pattern: the bottom decile is dominated by bursts: the five Olympiad result posts published inside 25 hours on 27-28 September (0.41-0.58x; 12 days old at capture, so mature by our 7-day rule), and the cluster of live-round posts on 29-30 December during the world rapid and blitz event (0.7-0.9x). Per-post views fall when several posts on one subject land together.

## 4. edchessss (EdChess [ENG], Mini App competitor)

Profile: English-language channel of a Telegram chess Mini App with tournaments and token prizes ($TON, $GRAM, USDT). 36,900 subscribers at capture. Views per post: median 2,110, 10th to 90th percentile 963 to 3,849, maximum 34,400 (a partner collaboration post).

### Cadence and timing
0.65 posts per day over 504.0 days; median gap 26.2 hours, 90th percentile 70.1 hours, longest gap 7.0 days. Last 30 days: 29 posts; last 90 days: 77.

Posts by UTC hour (hour:count): 03:1 06:2 07:21 08:29 09:26 10:25 11:40 12:44 13:51 14:26 15:36 16:16 17:7 18:5.

| UTC block | Mature posts | Median x baseline |
|---|---|---|
| 00-03 | 1 | 1.01 |
| 04-07 | 23 | 0.97 |
| 08-11 | 117 | 0.99 |
| 12-15 | 153 | 1.01 |
| 16-19 | 28 | 0.97 |

By weekday (mature posts): Mon n=68 median 0.95, Tue n=41 median 0.95, Wed n=56 median 1.0, Thu n=46 median 1.07, Fri n=38 median 1.03, Sat n=48 median 1.01, Sun n=25 median 0.93.

Best hours: 11-13 UTC holds 41% of posts; tournaments start at 15:00-17:00 UTC. Monday is the busiest day (the weekly agenda post). Normalised views are flat across hours.

### Media, length and conventions
| Media | Posts | Share | Median x baseline | Median reactions per 1K views |
|---|---|---|---|---|
| photo | 261 | 79.3% | 0.99 | 11.7 |
| video | 25 | 7.6% | 1.03 | 20.7 |
| photo (album) | 16 | 4.9% | 0.86 | 12.2 |
| other | 15 | 4.6% | 1.09 | 7.7 |
| poll | 5 | 1.5% | 1.16 | 5.7 |
| link-preview | 4 | 1.2% | 1.13 | 7.7 |
| none | 3 | 0.9% | 0.58 | 13.9 |

Characters per post (percentiles): p10 173, p25 256, p50 509, p75 929, p90 1348; maximum 2597.

| Text length (chars) | Posts | Share | Median x baseline | Median reactions per 1K views |
|---|---|---|---|---|
| 601+ | 142 | 43% | 0.97 | 13.4 |
| 301-600 | 85 | 26% | 0.98 | 11.1 |
| 101-300 | 82 | 25% | 1.02 | 11.6 |
| 0 (media only) | 20 | 6% | 1.09 | 7.5 |

Conventions observed: a leading emoji headline on 215 of 329 posts (65%); a deep link or bot link on 92% of posts; since 2 July 2026 one to four inline URL buttons on 57 posts (for example open a tournament list or a quest page) using Mini App `startapp` routes; reaction answers written as "emoji - option" lines; a recurring "What to do this week" post on Mondays; paid star reactions appear on some posts. Only 5 posts contain risk or disclaimer wording; 99 contain "earn". Top reactions: heart, fire, thumbs up, trophy, clapping.

Audience trend: median views peaked at 4,100 in March 2026 and halved by August:

| Month | Posts | Median views (posts older than 7 days) | Median reactions per 1K views |
|---|---|---|---|
| 2025-05 | 8 | 562.5 | 32.8 |
| 2025-06 | 14 | 1125.0 | 12.0 |
| 2025-07 | 16 | 1430.0 | 17.2 |
| 2025-08 | 21 | 964 | 20.7 |
| 2025-09 | 12 | 1090.0 | 18.5 |
| 2025-10 | 17 | 1100 | 37.6 |
| 2025-11 | 17 | 1470 | 26.9 |
| 2025-12 | 21 | 2050 | 11.1 |
| 2026-01 | 14 | 3230.0 | 8.6 |
| 2026-02 | 15 | 3750 | 9.9 |
| 2026-03 | 19 | 4100 | 13.0 |
| 2026-04 | 20 | 2760.0 | 12.9 |
| 2026-05 | 26 | 3205.0 | 8.3 |
| 2026-06 | 24 | 2750.0 | 9.5 |
| 2026-07 | 22 | 2700.0 | 9.2 |
| 2026-08 | 27 | 1840 | 11.4 |
| 2026-09 | 27 | 1940 | 10.4 |
| 2026-10 | 9 | 1535.0 | 11.5 |

### Performance by content type
| Content type (first-pass rules, reviewed) | Posts | Share | Median x baseline | Median reactions per 1K views | Share of channel top decile |
|---|---|---|---|---|---|
| Puzzle Pass / quest reminder | 76 | 23% | 0.97 | 11.0 | 0.09 |
| tournament today / weekend call | 69 | 21% | 1.0 | 16.5 | 0.16 |
| partner tournament promo (x partner, prize) | 51 | 16% | 1.02 | 17.1 | 0.41 |
| weekly agenda ("what to do this week") | 43 | 13% | 0.97 | 9.2 | 0.09 |
| react-to-vote puzzle | 33 | 10% | 1.04 | 15.8 | 0.09 |
| reaction bait (drop a heart if ...) | 16 | 5% | 1.03 | 12.5 | 0.06 |
| media the preview cannot render | 15 | 5% | 1.09 | 7.7 | 0.03 |
| product update / how-to guide | 9 | 3% | 0.89 | 9.7 | 0.0 |
| find-the-checkmate (answer in chat) | 6 | 2% | 0.94 | 11.1 | 0.0 |
| native poll / quiz | 5 | 2% | 1.16 | 5.7 | 0.06 |
| network status / ops notice | 4 | 1% | 0.62 | 16.3 | 0.0 |
| community / creators / social ask | 2 | 1% | 0.8 | 25.6 | 0.0 |

### Performance by hook pattern
| Hook pattern | Posts | Median x baseline | Median reactions per 1K views |
|---|---|---|---|
| prize / reward amount in the headline | 90 | 0.97 | 11.1 |
| emoji-as-answer vote (each reaction = an option) | 50 | 1.04 | 16.0 |
| plain announcement | 49 | 1.01 | 11.6 |
| deadline / "today" reminder | 45 | 1.01 | 14.1 |
| partner collab "X × Y" + prize amount | 37 | 0.97 | 20.4 |
| recurring weekly agenda post | 35 | 0.93 | 9.0 |
| no caption (image or clip carries it) | 15 | 1.09 | 7.7 |
| native poll | 5 | 1.16 | 5.7 |
| announcement headline | 3 | 0.87 | 9.9 |

### Group comparisons (mature posts)
| Group vs all other mature posts | n | Median x baseline: group vs rest | Median reactions per 1K views: group vs rest |
|---|---|---|---|
| emoji-as-answer vote | 50 | 1.04 vs 0.98 (p=0.0542) | 15.97 vs 11.32 (p=0.0034) |
| partner collab | 37 | 0.97 vs 1.0 (p=0.4579) | 20.39 vs 11.35 (p=0.0008) |
| weekly agenda | 34 | 0.93 vs 1.0 (p=0.0452) | 8.99 vs 12.23 (p=0.0428) |
| native poll | 4 | 1.16 vs 1.0 (p=0.1478) | 5.68 vs 11.76 (p=0.2026) |

### Top 25 by normalised views
| # | Date (UTC) | Media | Views | x baseline | Reactions per 1K views | Content type | Hook | Evidence excerpt (short) |
|---|---|---|---:|---:|---:|---|---|---|
| 1 | [2025-06-02](https://t.me/edchessss/326) | photo | 34,400 | 32.45 | 0.7 | partner tournament promo (x partner, prize) | emoji-as-answer vote (each reaction = an option) | 🐸 EdChess × MemHustle: the degen series 🐸 What's the most meme-worthy chess piece? Horsey.… |
| 2 | [2025-08-07](https://t.me/edchessss/359) | photo | 10,200 | 10.48 | 3.0 | partner tournament promo (x partner, prize) | partner collab "X × Y" + prize amount | 👊 EdChess × FightMe: chess 'em up! Together with a game app FightMe we’re hosting a bullet… |
| 3 | [2025-08-06](https://t.me/edchessss/358) | video | 8,300 | 8.43 | 2.8 | partner tournament promo (x partner, prize) | partner collab "X × Y" + prize amount | 🗓 EdChess x ONTON: a TON-charged chess tournament! What’s next on the calendar? A chess to… |
| 4 | [2025-06-12](https://t.me/edchessss/330) | photo | 3,200 | 3.02 | 3.8 | partner tournament promo (x partner, prize) | partner collab "X × Y" + prize amount | 👊 EdChess × FightMe: Time to Brawl for 15 $TON! We’re teaming up with FightMe for a blitz … |
| 5 | [2025-06-08](https://t.me/edchessss/329) | photo | 2,800 | 2.64 | 5.4 | partner tournament promo (x partner, prize) | partner collab "X × Y" + prize amount | 👾 EdChess × ArtiTap: PvP battle for 20 $TON! 👾 Together with the RPG game ArtiTap, we’re l… |
| 6 | [2025-07-05](https://t.me/edchessss/344) | photo | 3,720 | 2.60 | 7.3 | partner tournament promo (x partner, prize) | partner collab "X × Y" + prize amount | 😒 EdChess × Totemancer for 60 $TON—hunt for totems and winning combos! We’re joining two b… |
| 7 | [2026-04-13](https://t.me/edchessss/525) | photo | 5,490 | 1.98 | 22.0 | weekly agenda ("what to do this week") | recurring weekly agenda post | 🔫 What to do on EdChess this week 🔫 What are your plans for the week? Let’s meet in the Ed… |
| 8 | [2025-06-22](https://t.me/edchessss/338) | photo | 2,160 | 1.97 | 7.4 | partner tournament promo (x partner, prize) | plain announcement | 🔎 WANTED: Calling All Chess Creators! Are you passionate about chess content? Run a channe… |
| 9 | [2026-04-08](https://t.me/edchessss/524) | photo | 6,350 | 1.96 | 34.6 | react-to-vote puzzle | emoji-as-answer vote (each reaction = an option) | What’s the best move in the position above? React to the post: ❤️ — Qh7+ 👏 — Bxe6+ 🔥 — Bd5… |
| 10 | [2025-09-10](https://t.me/edchessss/385) | photo | 1,740 | 1.85 | 12.1 | reaction bait (drop a heart if ...) | plain announcement | 🔥 EdChess — trending and topping the charts! 🔥 On PlayToEarn, the EdChess platform keeps h… |
| 11 | [2026-04-15](https://t.me/edchessss/526) | photo | 5,110 | 1.84 | 29.0 | react-to-vote puzzle | emoji-as-answer vote (each reaction = an option) | What does your intuition tell you? React to the post: ❤️ — Rf1 👏 — Qe8 🔥 — Qf8 🤔 — Rxd5 Ho… |
| 12 | [2025-06-27](https://t.me/edchessss/339) | video | 2,160 | 1.83 | 13.4 | partner tournament promo (x partner, prize) | partner collab "X × Y" + prize amount | ⚪️ EdChess × Bitpapa — $100 USDT up for grabs in the first tournament of a big new series!… |
| 13 | [2026-04-06](https://t.me/edchessss/523) | photo | 5,870 | 1.63 | 19.1 | weekly agenda ("what to do this week") | recurring weekly agenda post | 🔫 What to do on EdChess this week 🔫 Play blitz and bullet every day for $TON prizes! Also,… |
| 14 | [2025-09-17](https://t.me/edchessss/386) | video | 1,450 | 1.51 | 20.0 | tournament today / weekend call | prize / reward amount in the headline | 👑 LEGENDARY SEPTEMBER BULLET: ARE YOU THE LEGEND? 👑 🔔 Today at 5:00 PM UTC Tonight’s the c… |
| 15 | [2025-06-20](https://t.me/edchessss/337) | photo | 1,580 | 1.49 | 12.7 | partner tournament promo (x partner, prize) | prize / reward amount in the headline | Bitpapa Tournament Updates 🔥 The Bitpapa tournament series is right around the corner — wi… |
| 16 | [2025-09-20](https://t.me/edchessss/387) | photo | 1,430 | 1.47 | 17.5 | tournament today / weekend call | deadline / "today" reminder | 👑 Tournament Weekend on EdChess 👑 🔔 ELITE BULLET ARENA №3 — TODAY AT 5:00 PM UTC We’ve got… |
| 17 | [2026-07-27](https://t.me/edchessss/621) | photo | 3,130 | 1.44 | 8.3 | weekly agenda ("what to do this week") | recurring weekly agenda post | What to do in EdChess this week? 💎 A new Puzzle Pass is now live in EdChess! This season b… |
| 18 | [2026-04-18](https://t.me/edchessss/527) | photo | 3,950 | 1.44 | 12.9 | reaction bait (drop a heart if ...) | emoji-as-answer vote (each reaction = an option) | We’re meeting this weekend for two royal tournaments and one free tournament! 🏆 ➡️ Pick yo… |
| 19 | [2026-01-19](https://t.me/edchessss/472) | photo x2 | 4,210 | 1.41 | 9.0 | Puzzle Pass / quest reminder | announcement headline | ⬛️ New Puzzle Pass EMCD × EdChess with a brand-new board 🔥 ➡️Start Puzzle Pass right now T… |
| 20 | [2026-07-24](https://t.me/edchessss/620) | photo | 3,280 | 1.41 | 13.7 | react-to-vote puzzle | emoji-as-answer vote (each reaction = an option) | What's the best move for white here? React with your answer: ❤️ — Bxe7 👏 — Qh5 🔥 — Nxe6 🤔 … |
| 21 | [2025-09-08](https://t.me/edchessss/384) | photo | 1,310 | 1.39 | 14.5 | tournament today / weekend call | emoji-as-answer vote (each reaction = an option) | 🔫 Weekly Clash: Legends of the Week! ➡️ Play online mode Every week we update Weekly Clash… |
| 22 | [2025-07-01](https://t.me/edchessss/340) | poll | 1,890 | 1.38 | 0.0 | native poll / quiz | native poll | What tournament duration works best for you? |
| 23 | [2025-08-10](https://t.me/edchessss/361) | video | 1,350 | 1.37 | 19.3 | tournament today / weekend call | prize / reward amount in the headline | 🔫 Bigger prizes, smarter payouts, way more winners! New tournament rules in partnership wi… |
| 24 | [2026-09-19](https://t.me/edchessss/672) | other | 2,570 | 1.35 | 12.8 | media the preview cannot render | no caption (image or clip carries it) |  |
| 25 | [2026-04-04](https://t.me/edchessss/522) | video | 5,170 | 1.34 | 24.6 | tournament today / weekend call | plain announcement | Prepared something new to help you win your weekend tournaments? ➡️ Pick your tournament 💬… |

Pattern: the top six by reach are all partner collaboration posts ("EdChess x partner" with a prize amount) from mid-2025 at 2.6x to 32x baseline; the top three (32x, 10x, 8x) are almost certainly boosted or cross-promoted; the next tier is emoji-as-answer puzzles and weekly agenda posts from April 2026 when the channel was at its largest.

### Top 25 by reaction rate (posts above the 25th views percentile)
| # | Date (UTC) | Media | Views | x baseline | Reactions per 1K views | Content type | Hook | Evidence excerpt (short) |
|---|---|---|---:|---:|---:|---|---|---|
| 1 | [2026-04-01](https://t.me/edchessss/519) | photo | 2,740 | 0.69 | 43.4 | react-to-vote puzzle | emoji-as-answer vote (each reaction = an option) | A weird puzzle, isn't it Which promotion wins in the position above? And why? Your idea? D… |
| 2 | [2026-03-30](https://t.me/edchessss/514) | photo x4 | 2,710 | 0.67 | 42.4 | tournament today / weekend call | prize / reward amount in the headline | 🛡 Tournament Leagues on EdChess 💎 More chances to win prizes! Even with a large number of … |
| 3 | [2026-03-29](https://t.me/edchessss/513) | photo | 2,930 | 0.72 | 40.6 | reaction bait (drop a heart if ...) | deadline / "today" reminder | We’ve got the Elite and Free tournaments back-to-back today, think you can handle it? ➡️ P… |
| 4 | [2026-03-31](https://t.me/edchessss/518) | photo | 2,760 | 0.69 | 36.6 | weekly agenda ("what to do this week") | recurring weekly agenda post | 🔫 What to do on EdChess this week 🔫 In this week’s tournaments, you can already try out le… |
| 5 | [2025-11-06](https://t.me/edchessss/422) | photo | 1,470 | 1.13 | 35.4 | reaction bait (drop a heart if ...) | plain announcement | 🌐 We're going global: EdChess meets Farhan Chess 👋 We’re partnering with Farhan Chess whic… |
| 6 | [2026-04-08](https://t.me/edchessss/524) | photo | 6,350 | 1.96 | 34.6 | react-to-vote puzzle | emoji-as-answer vote (each reaction = an option) | What’s the best move in the position above? React to the post: ❤️ — Qh7+ 👏 — Bxe6+ 🔥 — Bd5… |
| 7 | [2026-03-27](https://t.me/edchessss/512) | photo | 4,150 | 1.02 | 33.3 | react-to-vote puzzle | emoji-as-answer vote (each reaction = an option) | Which side has the better position on the board? Drop your reaction on the post: ❤️ — +1 👏… |
| 8 | [2025-11-19](https://t.me/edchessss/429) | photo | 1,550 | 0.95 | 32.3 | react-to-vote puzzle | emoji-as-answer vote (each reaction = an option) | 🧩 Which move for White wins this position? 💬 Drop your reactions: 🔥 — Kc3 💯 — Ke3 ❤️ — h5 … |
| 9 | [2026-04-01](https://t.me/edchessss/520) | photo | 3,550 | 0.89 | 31.8 | product update / how-to guide | plain announcement | 👏 Vote for EdChess on Identity! 👏 EdChess now has a page on IdentityHub, a new platform th… |
| 10 | [2026-04-15](https://t.me/edchessss/526) | photo | 5,110 | 1.84 | 29.0 | react-to-vote puzzle | emoji-as-answer vote (each reaction = an option) | What does your intuition tell you? React to the post: ❤️ — Rf1 👏 — Qe8 🔥 — Qf8 🤔 — Rxd5 Ho… |
| 11 | [2026-03-18](https://t.me/edchessss/508) | photo | 4,400 | 1.07 | 28.9 | react-to-vote puzzle | emoji-as-answer vote (each reaction = an option) | Evaluating the endgame. Which side is better in the position above? Vote: ❤️ — +2 😎 — = 🔥 … |
| 12 | [2025-07-10](https://t.me/edchessss/346) | video | 1,450 | 1.03 | 27.6 | partner tournament promo (x partner, prize) | partner collab "X × Y" + prize amount | 👛 EdChess × Tonkeeper for 30 $TON—earn $TON for making cool moves! 🔔 Tonkeeper Tournament … |
| 13 | [2026-04-04](https://t.me/edchessss/522) | video | 5,170 | 1.34 | 24.6 | tournament today / weekend call | plain announcement | Prepared something new to help you win your weekend tournaments? ➡️ Pick your tournament 💬… |
| 14 | [2025-11-30](https://t.me/edchessss/434) | photo | 1,650 | 0.89 | 24.2 | tournament today / weekend call | plain announcement | Chess is awesome because of those epic comebacks, when it looks like everything is lost 🙏 … |
| 15 | [2025-11-26](https://t.me/edchessss/433) | photo | 2,120 | 1.23 | 24.1 | react-to-vote puzzle | emoji-as-answer vote (each reaction = an option) | We’re looking for the best defensive move in the position above, drop your reaction: 🔥 — R… |
| 16 | [2026-03-16](https://t.me/edchessss/507) | photo | 4,620 | 1.13 | 23.8 | weekly agenda ("what to do this week") | recurring weekly agenda post | 🔫 What to Do on EdChess This Week 🔫 This week is packed with tournaments, so jump in and p… |
| 17 | [2025-12-03](https://t.me/edchessss/436) | photo x6 | 1,850 | 0.97 | 23.8 | Puzzle Pass / quest reminder | prize / reward amount in the headline | 🧩 New Puzzle Pass in EdChess! 🧩 ➡️ Start Puzzle Pass now The new Puzzle Pass season is liv… |
| 18 | [2026-06-05](https://t.me/edchessss/573) | photo | 3,590 | 1.16 | 23.4 | react-to-vote puzzle | emoji-as-answer vote (each reaction = an option) | Which team is better? React to the post: ❤️ — Team 1 🔥 — Team 2 Then grab your rewards in … |
| 19 | [2026-03-24](https://t.me/edchessss/511) | photo | 5,180 | 1.26 | 23.4 | Puzzle Pass / quest reminder | prize / reward amount in the headline | There are 2 extra days to finish Puzzle Pass 🎁 ➡️ Complete Puzzle Pass Show off your rewar… |
| 20 | [2026-03-21](https://t.me/edchessss/509) | photo | 5,090 | 1.21 | 23.2 | Puzzle Pass / quest reminder | deadline / "today" reminder | 🏆 This weekend, we’ve got four tournaments lined up, including one partner event ➡️ Pick y… |
| 21 | [2025-11-22](https://t.me/edchessss/431) | photo | 1,870 | 1.11 | 23.0 | react-to-vote puzzle | plain announcement | Alekhine’s gun is the strongest heavy-piece battery out there. Have you ever had it on the… |
| 22 | [2025-12-01](https://t.me/edchessss/435) | photo | 1,920 | 1.03 | 22.9 | weekly agenda ("what to do this week") | emoji-as-answer vote (each reaction = an option) | 🔫 What to do in EdChess this week 🔫 🗳 Save this post so you don’t miss anything We’re kick… |
| 23 | [2025-11-14](https://t.me/edchessss/427) | photo | 1,600 | 1.14 | 22.5 | react-to-vote puzzle | deadline / "today" reminder | Also another smothered mate, a pawn checkmate, and a queen sacrifice made on pure instinct… |
| 24 | [2026-03-23](https://t.me/edchessss/510) | photo | 5,150 | 1.25 | 22.3 | weekly agenda ("what to do this week") | recurring weekly agenda post | 🔫 What to Do on EdChess This Week 🔫 Pick your tournament for this week and finish your Puz… |
| 25 | [2025-07-21](https://t.me/edchessss/353) | video | 1,720 | 1.29 | 22.1 | tournament today / weekend call | emoji-as-answer vote (each reaction = an option) | 🔫 Online Mode Just Got an Upgrade — Welcome to Weekly Crypto Clash! The EdChess online mod… |

Pattern: 10 of 25 use the emoji-as-answer mechanic (position image, one question, each reaction maps to a move or evaluation). Four of the top five were posted between 29 March and 1 April 2026 (a tournament and April Fools event week, views 0.67-0.72x), so some of the lift is event-driven. The reactions are not rewarded in the post text, but most vote posts end with a line about earning $TON in tournaments.

### Bottom decile (32 posts, 12 lowest shown) for contrast
| # | Date (UTC) | Media | Views | x baseline | Reactions per 1K views | Content type | Hook | Evidence excerpt (short) |
|---|---|---|---:|---:|---:|---|---|---|
| 1 | [2025-05-30](https://t.me/edchessss/320) | video | 474 | 0.43 | 38.0 | tournament today / weekend call | prize / reward amount in the headline | 🏆 EDCHESS BLITZ CUP — WHO’S TAKING IT? 🏆 Right after the Daily Crypto Clash, we’re launchi… |
| 2 | [2025-05-28](https://t.me/edchessss/318) | photo | 504 | 0.45 | 37.7 | partner tournament promo (x partner, prize) | partner collab "X × Y" + prize amount | 🪙 EdChess × TONPoker for $100: Final Table — Let’s Go All-In! 🔊 Final Tournament — TODAY a… |
| 3 | [2025-05-27](https://t.me/edchessss/317) | video | 509 | 0.46 | 49.1 | tournament today / weekend call | prize / reward amount in the headline | 👉 Daily Crypto Clash: The Royal Daily $TON Crypto Game! Listen up, legends! Crypto Game ju… |
| 4 | [2025-05-30](https://t.me/edchessss/321) | photo | 536 | 0.48 | 31.7 | tournament today / weekend call | prize / reward amount in the headline | 🔥 Daily Crypto Clash: 6x Prizes This Saturday! 🔥 We recently kicked off Daily Crypto Clash… |
| 5 | [2025-06-01](https://t.me/edchessss/325) | none | 580 | 0.52 | 19.0 | network status / ops notice | plain announcement | 🌤 TON Network Status Transactions are flowing again. We thank the TON Core engineers and t… |
| 6 | [2025-05-26](https://t.me/edchessss/316) | photo | 589 | 0.53 | 25.5 | partner tournament promo (x partner, prize) | partner collab "X × Y" + prize amount | 🧪 EdChess × Anycraft: The Alchemy of Victory for 30 $TON We’re teaming up with Anycraft — … |
| 7 | [2025-05-31](https://t.me/edchessss/322) | photo | 602 | 0.54 | 28.2 | Puzzle Pass / quest reminder | prize / reward amount in the headline | 🔥 DAILY CRYPTO CLASH x6 EXTENDED FOR ONE MORE DAY! Legends, good news for you: 1️⃣ Today w… |
| 8 | [2025-07-12](https://t.me/edchessss/348) | photo | 792 | 0.56 | 24.0 | partner tournament promo (x partner, prize) | partner collab "X × Y" + prize amount | 😒 EdChess × Totemancer with 30 $TON up for grabs: claim your chess totem! 🔔Totemancer Open… |
| 9 | [2025-06-01](https://t.me/edchessss/324) | none | 647 | 0.58 | 13.9 | network status / ops notice | plain announcement | ☁️ TON Network Status Transactions are not processed by the TON network at the moment, TON… |
| 10 | [2025-05-24](https://t.me/edchessss/308) | photo x8 | 650 | 0.58 | 33.8 | community / creators / social ask | plain announcement | 👨‍🎨 Spice up your home screen with legendary chess quotes! And hey — don't forget to add t… |
| 11 | [2025-06-07](https://t.me/edchessss/328) | photo | 702 | 0.63 | 24.2 | partner tournament promo (x partner, prize) | partner collab "X × Y" + prize amount | 🔮 EdChess × Predicta: The Final is Here Magnus took the win at Norway Chess — but at what … |
| 12 | [2026-04-22](https://t.me/edchessss/532) | photo | 1,870 | 0.63 | 11.8 | Puzzle Pass / quest reminder | deadline / "today" reminder | This is the board you can unlock with your first Puzzle Pass. Go ahead and try it out! Tod… |

Pattern: early-channel promos (May-June 2025), network-status notices, how-it-works guides and quest reminders. Network-status notices (median 0.62x) are the weakest content type.

## 5. Twelve formats and hook patterns ranked for Web3Chess

Ranking blends strength of evidence (n and p-value), reach and engagement effect, brand fit and compliance risk. "Evidence" cites the competitor channel it comes from.

| Rank | Format / hook | Evidence | Strength | How we adapt it | Risk / guardrail |
|---|---|---|---|---|---|
| 1 | Emoji-as-answer position puzzle | EdChess, n=50 posts: 16.0 vs 11.3 reactions per 1K views (permutation p=0.003); reach +5% vs baseline (p=0.054). 10 of its top 25 reaction-rate posts use it. | Strong (n, p-value, repeated across 16 months) | Tactics, slot 1. One position image, four candidate moves each mapped to a reaction, reveal the same day as a threaded reply. Our own positions (Lichess CC0 data or verified games), our own explanation. | Do not turn the reactions into a prediction market or a prize draw. No "react to earn". EdChess adds a tournament line mentioning $TON earnings under most vote posts; its reactions themselves are not rewarded, but the funnel claim is exactly what we must not copy. |
| 2 | Short culture caption or image-only meme | chesscom_ru: short captions n=10 at 39.4 vs 18.6 reactions per 1K (p<0.001); image-only posts n=20 at 29.1 vs 18.2 (p<0.001); reach flat (1.02 vs 1.02). 15 of the top 25 reaction-rate posts are this family (captions, emoji-only, image-only, birthdays, greetings). | Strong for engagement, none for reach | Chess Culture, slot 4. One restrained joke about a real chess feeling, on our own licensed art (violet rook, outlined CHESS wordmark). Never reuse a community meme image. | Competitor images are not visible in the preview, so the visual hook is unmeasured. Humour must not mock real players or young players. |
| 3 | Record or first-ever claim with a number up front | chesscom_ru: record/superlative n=7 at 1.27x baseline vs 1.02 (p=0.008), 30.2 vs 18.9 reactions per 1K (p=0.034); number-first opening n=13 at 1.08x (p=0.35). The top two posts by normalised views use a number-first or rating-ladder hook. | Moderate (small n for records; effect matches the top lists) | Chess News, slot 2. A verified record, then one original lesson from the position that produced it. The number leads the first line. | Verify against a primary source before posting; never state a record you cannot cite. |
| 4 | "This day in chess" history, birthdays and tributes | chesscom_ru: history/anniversary/tribute n=8 at 37.4 vs 18.7 reactions per 1K (p=0.002); the two highest reaction-rate posts of the channel are birthdays (62.9 and 54.0 per 1K). | Moderate (n=8; consistent in the top list) | Chess Culture or News, slot 4 about twice a week. A dated fact plus the decisive position from that game. Our own copy. | Tributes after a death are not engagement material: use a plain, factual tone and no promotion beside them. |
| 5 | Puzzle prompt with a same-day reveal | chesscom_ru: puzzle prompts n=20 at 1.08x baseline (p=0.23) with 15.2 reactions per 1K (below the channel median of 19, p=0.13): steady reach, weak engagement because answers happen elsewhere. | Moderate (reach), weak (engagement) | Tactics, slot 1, always combined with format 1 so the answer happens in the post. Reveal as a threaded reply the same day. | Open-loop rule from STRATEGY.md: the payoff must land in the same asset sequence. |
| 6 | Short attributed quote card | chesscom_ru: quote/interview n=10 at 1.16x baseline and 30.9 reactions per 1K; the fourth-ranked post by reach is a quote plus a question (1.99x, 9.4K views). | Weak to moderate | Chess News, slot 2. A short public quote (under about 15 words), exact and attributed, then our chess explanation of the position it refers to. | Quote accurately and briefly; no invented quotes; link the primary source. |
| 7 | Audience prompt or UGC call | chesscom_ru: audience prompts n=11 at 0.98x baseline, 20.5 reactions per 1K (neutral); the "caption this photo" post is in the top 25 by reactions, the chat-screenshot post ranks 8th by reach, but the revived "brilliant move from a subscriber" series sits in the bottom decile (0.84x). | Weak (neutral on average) | Chess Culture, slot 5 on Tue and Fri. "Send us the best move you ever played" style, only if we really will feature entries. | Do not promise a feature we will not deliver; get permission before showing anyone's game or name. |
| 8 | Human-moment photo or behind-the-scenes | chesscom_ru: the champion's family photo (1.76x) and the in-chat screenshot (1.80x) rank 8th and 9th by reach. | Weak (qualitative, n small) | Chess Culture. Our own team or community moments, with consent. Not stock sentiment. | Event photos belong to FIDE and photographers: never reuse. |
| 9 | Native poll as a prediction | chesscom_ru: a prediction poll about the world title match drew 1,160 voters on 3,840 views (30%) but only 0.73x baseline and 13.8 reactions per 1K; EdChess polls n=5 at 1.16x with 5.7 reactions per 1K. | Insufficient (n=2 and n=5) | Test one poll per week in slot 5 on Tue. Treat voters as the metric. | Polls are anonymous but must not collect personal data or run a prize draw. |
| 10 | Drama-moment replay, built from our own board animation | chesscom_ru: blunder/drama posts n=15 at 0.94x baseline but 23.6 reactions per 1K; the five video posts reach 33.8 reactions per 1K. | Weak (n=5 videos) | Chess News or Culture. Animate the position, never the broadcast footage. | Competitor clips are not ours to reuse; show the position, not the clip. |
| 11 | Milestone and thank-you posts | chesscom_ru: "250 million users" milestone at 35.3 reactions per 1K; World Chess Day greeting at 35.2. | Weak (n=2) | Product or Culture, only with our real numbers and dates. | No invented counts or audience claims (STRATEGY rule against unsupported audience claims). |
| 12 | Co-branded challenge announcement with explicit rules | EdChess: partner collaboration posts n=37 at 20.4 vs 11.4 reactions per 1K (p<0.001) but reach 0.97x baseline (p=0.46); 5 of its top six by reach are partner posts (2.6x to 32x baseline; the top three at 8x to 32x look paid or boosted), so reach is not organic evidence. | Strong for reactions, unclear for reach | Product slot, later. A friendly, free-to-enter chess challenge with a partner community and plain rules. | Never attach a USDT stake or prize pool to a partner promo without 18+ and loss disclosures; keep it away from youth audiences. |

**Avoid (evidence from the same data):**

- **Weekly "what to do this week" agenda posts.** EdChess n=34: 0.93x baseline (p=0.045) and 9.0 vs 12.2 reactions per 1K (p=0.043), the weakest recurring format.
- **Medal lists and results tables as an engagement driver.** chesscom_ru n=51: 15.0 vs 19.6 reactions per 1K (p=0.008). Keep as a utility only when we add a chess lesson.
- **Long text (over 600 characters) as default.** EdChess: 43% of posts exceed 600 characters; shorter posts (101-300) reach 1.02x vs 0.97x. chesscom_ru has 70% of posts between 101 and 300 characters.
- **Burst posting of four or more posts inside a day on one topic.** chesscom_ru: median x baseline 1.07 when posts stand alone vs 0.96 with 4-6 posts within +/-12 hours (rank correlation -0.18). Observational only.
- **"Earn" and prize-pool headlines.** EdChess: 99 of 329 posts say "earn" and 237 mention prizes, wins or rewards; only 5 contain any risk wording. Reach and reactions are no better for them (0.99x vs 1.02x).

## 6. Recommended 5-posts-per-day Telegram slot plan (UTC)

All times are UTC. They are a hypothesis built on competitor activity windows and spacing, not on measured Web3Chess audience data. Keep gaps of three hours or more (observed per-post dilution when four or more posts cluster). Run each slot for four weeks, then compare each slot with its own median.

| Slot | UTC | Pillar | Format | Rationale |
|---|---|---|---|---|
| S1 | 07:30 | Tactics | Emoji-as-answer position puzzle (format 1) | Europe morning, India early afternoon (13:00 IST); competitors post from 07:00 UTC (EdChess) and 09:00 UTC (chesscom_ru). |
| S2 | 11:00 | Chess News | Record / number-first news with one original lesson (formats 3, 6) | The densest posting window in both channels (chesscom_ru 09-12 UTC holds 34% of posts; EdChess 11-13 UTC holds 41%). |
| S3 | 14:30 | Openings / Academy | Single-image micro-lesson: "survive the trap" or "one better decision"; reply with puzzle reveal | Single images beat albums on engagement in chesscom_ru (21.0 vs 16.4 reactions per 1K). Time slot is a hypothesis. |
| S4 | 17:30 | Chess Culture | Short caption / meme or "this day in chess" (formats 2, 4) | Second chesscom_ru activity window (16-19 UTC) and EdChess event time (17:00 UTC). US East Coast mid-afternoon. |
| S5 | 20:30 | Rotating | Mon Product, Tue prediction poll, Wed Match Rules, Thu Product, Fri audience prompt, Sat weekly puzzle recap, Sun long-read teaser | Evening in Europe and the US; the only slot that carries product or wager content, at most three times a week. |

Weekly rotation (35 posts: Tactics 8, Chess News 8, Openings/Academy 7, Culture 9, Product 2, Match Rules 1):

| Day | S1 07:30 | S2 11:00 | S3 14:30 | S4 17:30 | S5 20:30 |
|---|---|---|---|---|---|
| Mon | Tactics | Chess News | Academy | Culture | Product |
| Tue | Tactics | Chess News | Openings | Culture | Culture (poll) |
| Wed | Tactics | Chess News | Academy | Culture | Match Rules (18+) |
| Thu | Tactics | Chess News | Openings | Culture | Product |
| Fri | Tactics | Chess News | Academy | Culture | Culture (audience prompt) |
| Sat | Tactics | Chess News | Openings | Culture | Tactics (weekly recap) |
| Sun | Tactics | Chess News | Academy | Culture | Chess News / Academy (long-read teaser) |

Rules for the plan:
- Product and Match Rules together are 3 of 35 posts (9%). EdChess is promotion-heavy and underperforms on reach per subscriber.
- Reveals are threaded replies to the puzzle, not extra posts.
- Match Rules runs only on Wednesday S5 with the disclosure line (H10). Keep S4 on Wednesday free of youth content.
- Blog: the five daily articles map to the same five pillars; each slot may end with one link line to the matching article.

## 7. Ten reusable hook templates (our voice)

Voice: a chess-literate friend, short, concrete, restrained wit; no hype, no income claims, no fake urgency. Placeholders are in braces.

| ID | Pattern | Template | Pillar | Note |
|---|---|---|---|---|
| H1 | Emoji-as-answer puzzle | White to move. One of these wins; the other three lose material.<br>❤ Nxe6   🔥 Qh5   👏 Bd5   🤔 Rf1<br>Answer in the replies at 14:30 UTC. | Tactics | Only post a promised reveal time you will keep. |
| H2 | Number-first | {number} {unit}. That is how long {player} thought about one move. The position: | Chess News | Verify the number against the broadcast or the primary report. |
| H3 | Record plus lesson | {player} is the first to {verified record}. The idea behind it fits on one board. | Chess News | Cite the source in the first reply. |
| H4 | Threat check | Before you move: what is {Black/White} threatening? | Academy | Matches the existing STRATEGY test pair. |
| H5 | Defender's view | You are Black. Move 4 looks natural. It is also where the trap starts. | Openings | Show the defender's resource, not just the trap. |
| H6 | Reveal | Yesterday's position, solved: {move}. The capture most people tried fails to {refutation}. | Tactics | Post as a threaded reply to the puzzle. |
| H7 | Culture caption | Evaluation: +3.0. Me, one move later: where did my queen go? | Chess Culture | Own art only; no player named for the joke. |
| H8 | This day in chess | On this day in {year}, {event}. The final position: | Chess Culture / News | Fact-check dates; no promotion next to tributes. |
| H9 | Friend challenge | The group chat has opinions. Give them a board. | Product | Free practice or friendly match first; adult wager content stays on its own post. |
| H10 | Rules clarity (adults only) | A payout and a profit are different numbers: a 19 USDT receipt on a 10 USDT stake is a 9 USDT gain. Optional. 18+ only. You can lose your stake. Rules: {link} | Match Rules | Mandatory disclosure line; never paired with youth content (see compliance). |

## 8. CTA patterns

| CTA | Mechanics | Evidence | Use |
|---|---|---|---|
| Reaction-as-answer | Each reaction is one answer to the position | EdChess: 16.0 vs 11.3 reactions per 1K (p=0.003) | Primary engagement CTA for Tactics. |
| Same-day reply reveal | Answer arrives in the thread, not in a different channel | Not testable from public data; follows the STRATEGY open-loop rule | Pair with every puzzle. |
| Single deep-link button to the Mini App | One inline button ("Play this position") to the @chess_matbot Mini App or https://app.web3chess.online; verify the real startapp/attribution parameter first (STRATEGY.md) | EdChess has used 1-4 buttons per post since 2 Jul 2026 (57 posts); button posts and no-button posts sit near the same baseline reach; conversion is unmeasured in public data | Use for Product and Academy posts; one button, never more than two. |
| Comment prompt ("Your move?") | Asks for a specific, answerable opinion | chesscom_ru audience prompts: 20.5 reactions per 1K (neutral); EdChess "ask-audience" posts 10.3 | Use sparingly; the reaction mechanic works better than an open question. |
| Native poll | One-tap participation | chesscom_ru: 1,160 voters on 3,840 views (30%) | Test one per week. |
| Blog article link at the end of a post | A plain link line such as "Full breakdown: {url}" | chesscom_ru: 17.5% of posts end with a link; same reach as no-link posts (1.06 vs 1.02) | Use for the 5 daily articles; one link per post. |
| Join / subscribe line | Avoid as a standing line | chesscom_ru: 4 posts, 8.6 reactions per 1K, the lowest | Do not use. |

## 9. Compliance notes

1. Any post that mentions a stake, a payout, a pot, USDT matches or settlement must carry "18+ only" and "you can lose your stake" in the same post, in the same language, above the link. Do not shorten to an icon.
2. No income, "earn", "win money", salary, passive-income or profit-expectation language. This is the main contrast with EdChess, whose headlines promise $TON, $GRAM and USDT prizes while only 5 of its 329 posts show any risk wording.
3. Never pair wager content with youth content: no wager post within six hours of a post about players under 18, school chess, kids, juniors or youth events, and never on the same slot sequence as Academy material aimed at beginners or children. Chess news channels regularly cover child prodigies (for example a 12-year-old grandmaster-norm story in chesscom_ru), so the news slot needs a youth check before the evening slot.
4. No fake urgency, countdowns, limited seats or "last chance" copy unless a real, sourced deadline exists. Competitors use "only N days left" for in-app quests; do not copy that.
5. Restrict wager messaging by jurisdiction exactly as the product does; confirm the current geo rules with the product owner before the first Match Rules post (not verified here).
6. Telegram's own advertising and bot rules may restrict crypto and gambling content in paid placements; check the current policy before buying any promotion (not verified here).
7. Reuse: competitor text, photos (FIDE and photographer credits), clips and memes stay theirs. We keep only short evidence excerpts in internal research. Rebuild the idea with our own position, wording and licensed brand art.
8. Anything quoted from a person must be exact, short and attributed; obituaries and tributes get no commercial context.
9. Public view counts are not reach and not conversion. Do not publish claims about our audience or results until attribution (STRATEGY.md measurement plan) exists.

## 10. Further sources to monitor

Full detail, feed URLs and evidence are in `marketing/content-ops/sources.json` under `viral_sources` (existing `sources` untouched). Summary by priority (1 low, 5 high). "Verified" means the URL resolved on 2026-10-10 and the evidence column says what was checked.

| Priority | Source | Kind | Language | Audience | Verified | Automation | URL |
|---|---|---|---|---|---|---|---|
| 5 | Chess.com - Шахматы (RU) | telegram_public_preview | ru | 9.49K subscribers | yes | allowed | https://t.me/chesscom_ru |
| 5 | GothamChess (Levy Rozman) | youtube_channel | en | 8.2M subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@GothamChess |
| 5 | Lichess daily puzzle API | json_api | en | n/a | yes | allowed | https://lichess.org/api/puzzle/daily |
| 4 | Chess.com | youtube_channel | en | 2.95M subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@chess |
| 4 | Chess.com news (RSS) | feed | en | Chess.com is the largest chess site; the official YouTube channel has 2.95M subscribers (vidIQ) | yes | allowed | https://www.chess.com/rss/news |
| 4 | ChessBase English (RSS) | feed | en | Long-running chess news publisher | yes | allowed | https://en.chessbase.com/feed |
| 4 | EdChess [ENG] | telegram_public_preview | en | 36.9K subscribers | yes | allowed | https://t.me/edchessss |
| 4 | Eric Rosen | youtube_channel | en | 707K subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@eric-rosen |
| 4 | FIDE official news (RSS) | feed | en | Governing body; FIDE's YouTube channel has 387K subscribers (vidIQ) | yes | allowed | https://www.fide.com/feed/ |
| 4 | GMHikaru | youtube_channel | en | 3.25M subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@gmhikaru |
| 4 | Lichess official blog (Atom) | feed | en | Open-source platform with a very large player base (no exact figure verified) | yes | allowed | https://lichess.org/blog.atom |
| 4 | Telegram News (official) | telegram_public_preview | en | 9.37M subscribers | yes | allowed | https://t.me/telegram |
| 4 | Левитов о шахматах | telegram_public_preview | ru | 18.6K subscribers | yes | allowed | https://t.me/levitovchess |
| 3 | Anna Cramling | youtube_channel | en | 1.68M subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@AnnaCramling |
| 3 | Catizen Announcement | telegram_public_preview | en | 3.47M subscribers | yes | allowed | https://t.me/catizenann |
| 3 | ChessBase India | youtube_channel | en | 3.05M subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@chessbaseindiachannel |
| 3 | ChessBase Spanish (RSS) | feed | es | Spanish-language edition | yes | allowed | https://es.chessbase.com/feed |
| 3 | ChessMaster (Максим Омариев) | youtube_channel | ru | 674K subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@chessmasterclub |
| 3 | ChessNode | Announcements | telegram_public_preview | en | 18.7K subscribers | yes | allowed | https://t.me/chessnode |
| 3 | FIDE chess | youtube_channel | en | 387K subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@fide_chess |
| 3 | Pavel Durov | telegram_public_preview | en | 10.5M subscribers | yes | allowed | https://t.me/durov |
| 3 | Timchess | youtube_channel | ru | 134K subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@timchess |
| 3 | Top Chess | youtube_channel | en | 861K subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@TopChess |
| 3 | agadmator | youtube_channel | en | subscriber count not retrieved | yes | allowed | https://www.youtube.com/@agadmator |
| 3 | goofygen | youtube_channel | en, ta | 1.21M subscribers (vidIQ, breakout flag) | yes | allowed | https://www.youtube.com/@goofygen_chess |
| 3 | r/AnarchyChess | reddit_manual | en | unverified | NO | manual only | https://www.reddit.com/r/AnarchyChess/ |
| 3 | r/chess | reddit_manual | en | large community (no figure verified) | yes | manual only | https://www.reddit.com/r/chess/ |
| 2 | Blum | telegram_public_preview | en | 13.7M subscribers | yes | allowed | https://t.me/blumcrypto |
| 2 | Chess.com chess memes article series | web_page_manual | en | n/a | yes | manual only | https://www.chess.com/article/view/chess-memes |
| 2 | Chess.com published-data API: daily puzzle | json_api | en | n/a | yes | allowed | https://api.chess.com/pub/puzzle |
| 2 | ChessXD | youtube_channel | en | 356K subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@chessxd |
| 2 | DOGS Community | telegram_public_preview | en | 6.82M subscribers | yes | allowed | https://t.me/dogs_community |
| 2 | Hamster Kombat Announcement | telegram_public_preview | en | 20.4M subscribers | yes | allowed | https://t.me/hamster_kombat |
| 2 | Lichess TV channels API | json_api | en | n/a | yes | allowed | https://lichess.org/api/tv/channels |
| 2 | Magnus Carlsen | youtube_channel | en | 1.64M subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@themagnuscarlsen |
| 2 | Notcoin Community | telegram_public_preview | en | 8.34M subscribers | yes | allowed | https://t.me/notcoin |
| 2 | Pepe Cuenca | youtube_channel | es | 135K subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@ajedrezconpepecuenca |
| 2 | X, Instagram and TikTok accounts of chess brands and creators | social_manual | en | unverified | NO | manual only | https://x.com/lichess |
| 2 | chess24 | youtube_channel | en | 580K subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@chess24 |
| 2 | chessbrah | youtube_channel | en | 415K subscribers (vidIQ) | yes | allowed | https://www.youtube.com/@chessbrah |
| 2 | Шахматы CHESS & LESSONS | telegram_public_preview | ru | 4.56K subscribers | yes | allowed | https://t.me/ChessAndLessons |
| 1 | Chess Memes (Reddit reposts) | telegram_public_preview | en | 215 subscribers | yes | allowed | https://t.me/chessmemes |
| 1 | Daniel Naroditsky legacy channel | youtube_channel | en | unverified | NO | manual only | https://www.youtube.com/@GMNaroditsky |
| 1 | Other chess Mini Apps seen only in directory listings (Chesscoin, Chessio, TON Chess, NinjaChess) | competitor_watch | en | Chessio channel showed 2 subscribers | NO | manual only | https://t.me/chessio_official |
| 1 | Tomarket Announcement | telegram_public_preview | en | 6.37M subscribers | yes | allowed | https://t.me/tomarket_ai |
| 1 | t.me/lichess (unclear ownership) | telegram_public_preview | en | 286 subscribers | NO | allowed | https://t.me/lichess |

Notes:
- Telegram discovery: search engines surfaced almost no usable English or Spanish chess channels, and about 85 guessed usernames mostly returned no preview. The verified English and Spanish list is therefore short (EdChess, ChessNode; Spanish only through ChessBase). Use Telegram's in-app search and the chess.com RU channel's cross-links to extend it, then verify each with a preview fetch.
- Reddit cannot be monitored automatically (robots disallow, 403 on JSON). Treat r/chess and r/AnarchyChess as manual idea sources.
- YouTube: use the official Data API; do not crawl the feed endpoint (robots disallow).
- Daily puzzle APIs (Lichess, Chess.com) give raw positions; write our own explanation and art.
- X, Instagram and TikTok: no permitted unauthenticated route found.

## 11. Next steps

1. Schedule `scrape-telegram` weekly (two requests per page, about three minutes per channel) so the observation table builds real view-age curves.
2. Start our own measurement: per-slot median views, reactions per 1K, and attributed first games (STRATEGY.md measurement plan).
3. Re-run this audit after four weeks of the slot plan and compare with these baselines.
4. Review the rule-based labels in `telegram_audit.py` after reading 30 more posts; add Spanish and English channels once found.
