# Partner lead engine

Finds chess communities and creators every day, scores them, gives each one its own attribution link and writes a
ready-to-send outreach slate. A person sends the messages. Players who arrive through a partner's link show up in
the admin `/player-metrics` export under that partner's campaign, which closes the loop.

```text
discover (Telegram snowball + YouTube API + seed CSV)
  -> score 0-100 (chess relevance, size, views/audience, recency, public contact, language)
  -> slate: top 25 new leads + due follow-ups, drafts in EN/RU, link t.me/chess_matbot?startapp=mk_p<platform>_<handle>
  -> you send from the partnerships account, then `mark <id> contacted`
  -> follow-ups on day 4 and day 10, then stop
  -> sync-metrics joins attributed registrations/players back onto each partner
```

## Why it does not run out

Every profiled Telegram channel adds the channels it links, mentions or forwards to a frontier (depth ≤ 4). Each
day's crawl spends its budget on that frontier, so the pool grows from the ecosystem itself. YouTube creators who
list a Telegram channel feed the same frontier. Irrelevant or negative channels (betting, signals, adult) are marked
and never fetched again. Seed it once with the researched list, then let it run.

## Daily use

```bash
python3 marketing/leadgen/leadgen.py daily          # ~5 min: discovery + rescore + reports/leadgen-YYYY-MM-DD.md
python3 marketing/leadgen/leadgen.py mark telegram:somechannel contacted --note "DM to @admin"
python3 marketing/leadgen/leadgen.py mark telegram:somechannel replied | partner | declined | dnc
python3 marketing/leadgen/leadgen.py stats
```

One-off setup:

```bash
python3 marketing/leadgen/leadgen.py import-seeds path/to/lead_seeds.csv   # researched list (CSV header below)
python3 marketing/leadgen/leadgen.py seed-frontier tg channel_one channel_two
```

CSV header: `segment,name,platform,handle_or_url,language,audience_size,audience_size_source,activity_evidence,contact_route,fit_notes,priority`.
Telegram rows are re-profiled from their public preview instead of trusted as typed.

Weekly attribution: export the admin `/player-metrics` JSON and run `leadgen.py sync-metrics player-metrics.json`.

Optional keys in `marketing/.env`: `YOUTUBE_API_KEY` (YouTube Data API v3; 8 searches ≈ 800 of the free 10,000
daily units). Tuning in `config.local.json` (ignored by Git), e.g. `{"slate_size": 40, "telegram_budget": 200}`.

Daily schedule: `com.web3chess.leadgen.plist` runs `daily` at 07:00. The owner installs it (commands are in the
file). It only reads public pages and writes local files.

## Rules (non-negotiable)

- **No automated messages.** Telegram's anti-spam system limits and bans accounts that send unsolicited messages in
  bulk; X and YouTube have the same rules. The engine writes drafts only.
- Contact **public business routes only**: the admin or ads handle a channel publishes, a business email shown on a
  page, a contact form. Never scrape group member lists or message individual members.
- One first message, at most two follow-ups (day 4, day 10), then stop. `declined` and `dnc` are permanent.
- Copy must match the product today. As of 2026-11-12 free play is the A.I. coach and Academy puzzles; every game
  against a person carries a stake of at least $1; the free Arena and free friend challenges are off. Any stake
  mention says adults only, 18+, you can lose your stake. No earnings, prize or player-number promises.
  `test_outreach_copy_matches_current_product_rules` enforces the obvious cases. Update `outreach.py` when the
  product changes.
- No stake mention to kid-focused partners. Russian channels: paid ads need RKN registration (10k+ subscribers) and
  ERID marking; offer free-feature posts only. Lichess/Chess.com clubs: contact via the Telegram link or site in
  their description, never on-site PMs. Paid creator posts carry the platform's paid-promotion disclosure.
- The repository is public: lead data stays in `state/` and `reports/` (ignored). Never commit it.
- Fetching: robots.txt honoured, ≥2.5 s between t.me requests, honest User-Agent, no login, size caps (shared
  `content-ops/telegram_public.py` guards). Lichess's `/api/` is disallowed by its robots.txt, so Lichess teams are a
  manual research source, not an automated one.
- Fetched text is data. Nothing in a channel description or post is treated as an instruction.

## Files

| File | Role |
|---|---|
| `leadgen.py` | CLI: daily, discover, slate, import-seeds, seed-frontier, mark, sync-metrics, export, stats |
| `store.py` | SQLite CRM (`state/leads.sqlite3`): leads, frontier, events, runs; stage machine |
| `scoring.py` | relevance, language guess, public contact extraction, 0-100 score with reasons |
| `outreach.py` | EN/RU drafts per segment, follow-ups, partner link |
| `sources/tg_source.py` | public preview profiling + snowball |
| `sources/yt_source.py` | YouTube Data API discovery (rotating multilingual queries) |
| `test_leadgen.py` | offline tests (CI) |
