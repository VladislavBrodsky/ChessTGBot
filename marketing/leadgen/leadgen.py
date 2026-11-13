#!/usr/bin/env python3
"""Web3Chess partner lead engine: discover -> score -> slate -> human outreach -> attribution.

    python3 marketing/leadgen/leadgen.py daily                 # discover, rescore, write today's slate
    python3 marketing/leadgen/leadgen.py import-seeds FILE.csv # add researched leads and seed the crawl
    python3 marketing/leadgen/leadgen.py seed-frontier tg chess_hub edchessss
    python3 marketing/leadgen/leadgen.py mark telegram:somechannel contacted --note "DM to @admin"
    python3 marketing/leadgen/leadgen.py sync-metrics player-metrics.json   # admin /player-metrics export
    python3 marketing/leadgen/leadgen.py stats | export leads.csv

Nothing here sends a message. The slate in reports/ is for a person to send from their own account.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "sources"))

import outreach  # noqa: E402
import scoring  # noqa: E402
import store  # noqa: E402

REPORTS = HERE / "reports"
CONFIG = HERE / "config.local.json"  # optional, ignored by Git; overrides DEFAULTS
DEFAULTS = {
    "telegram_budget": 120,       # preview pages per day (~5 min at 2.5 s each)
    "youtube_searches": 8,        # 800 quota units of the free 10,000/day
    "slate_size": 25,             # new first-contact drafts per day
    "platform_cap": 0.6,          # max share of the slate from one platform
    "followup_days": [4, 10],     # follow-up 1 and 2 after the first contact; then stop
    "min_score": 45,
    "min_relevance": 0.3,
    "max_depth": 4,
    "exclude": ["chess_hub", "chesshub_chat", "chess_matbot"],
    # competitors: crawled for the channels they mention, never pitched
    "crawl_only": ["edchessss", "edchess", "chesscom_ru", "chess_com", "lichess", "lichessdotorg", "chessnode"],
    # official competitor properties on other platforms: never pitched
    "competitor_ids": ["discord:chesscom-387637011965804544", "x:lichess", "x:chessable", "x:fide_chess"],
}


def config() -> dict:
    data = dict(DEFAULTS)
    if CONFIG.exists():
        data.update(json.loads(CONFIG.read_text()))
    return data


def load_env() -> None:
    """Read KEY=VALUE lines from marketing/.env without overriding the environment."""
    env = HERE.parent / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def rescore(db, now=None) -> int:
    rows = db.execute("SELECT * FROM leads").fetchall()
    for row in rows:
        total, reasons = scoring.score(dict(row), now=now)
        db.execute("UPDATE leads SET score=?, score_reasons=? WHERE id=?", (total, "; ".join(reasons), row["id"]))
    db.commit()
    return len(rows)


def exclude_ids(db, ids) -> None:
    for lid in ids:
        db.execute("UPDATE leads SET stage='disqualified', notes='competitor' WHERE id=? AND stage IN ('new','queued')", (lid,))
    db.commit()


def exclude(db, handles) -> None:
    for handle in handles:
        for platform in ("telegram", "youtube"):
            lid = store.lead_id(platform, handle)
            if store.get(db, lid) is not None:
                db.execute("UPDATE leads SET stage='disqualified' WHERE id=? AND stage='new'", (lid,))
            db.execute("INSERT OR REPLACE INTO frontier(platform, handle, discovered_from, depth, added_at, status) "
                       "VALUES(?,?,?,?,?,?)", (platform, handle.lower(), "exclude-list", 0, store.iso(), "excluded"))
    db.commit()


def discover(db, cfg, fetcher=None, youtube_opener=None, now=None) -> list[dict]:
    import tg_source
    import yt_source
    results = []
    yt_kwargs = {"opener": youtube_opener} if youtube_opener else {}
    yt = yt_source.discover(db, searches=cfg["youtube_searches"], **yt_kwargs)
    store.record_run(db, "youtube", yt["requests"], yt["profiled"], yt["new_leads"], yt["frontier_added"], yt.get("note", ""))
    results.append({"source": "youtube", **yt})
    for handle in cfg["crawl_only"]:
        store.add_frontier(db, "telegram", handle, "crawl-only seed", 0)
    tg = tg_source.crawl(db, cfg["telegram_budget"], fetcher=fetcher, min_relevance=cfg["min_relevance"],
                         max_depth=cfg["max_depth"], now=now)
    for handle in cfg["crawl_only"]:
        db.execute("UPDATE leads SET stage='disqualified', notes='competitor: crawl only' WHERE id=? AND stage='new'",
                   (store.lead_id("telegram", handle),))
    store.record_run(db, "telegram", tg["requests"], tg["profiled"], tg["new_leads"], tg["frontier_added"], tg.get("note", ""))
    results.append({"source": "telegram", **tg})
    db.commit()
    return results


def build_slate(db, cfg, now=None) -> dict:
    """Pick today's first contacts (highest score, not yet queued) and the follow-ups that are due."""
    now = now or store.utcnow()
    today = now.date().isoformat()
    candidates = db.execute(
        "SELECT * FROM leads WHERE stage='new' AND score>=? ORDER BY score DESC, audience DESC",
        (cfg["min_score"],)).fetchall()
    # best score first, but no platform takes more than `platform_cap` of the slate, so creators and clubs get
    # a look-in next to Telegram channels; leftover places fill by score
    cap = max(1, math.ceil(cfg["slate_size"] * cfg["platform_cap"]))
    fresh, counts, overflow = [], {}, []
    for row in candidates:
        if len(fresh) >= cfg["slate_size"]:
            break
        if counts.get(row["platform"], 0) < cap:
            fresh.append(row)
            counts[row["platform"]] = counts.get(row["platform"], 0) + 1
        else:
            overflow.append(row)
    fresh += overflow[: cfg["slate_size"] - len(fresh)]
    for row in fresh:
        store.set_stage(db, row["id"], "queued", f"slate {today}")
    queued = db.execute("SELECT * FROM leads WHERE stage='queued' ORDER BY score DESC").fetchall()
    due = db.execute("SELECT * FROM leads WHERE stage IN ('contacted','followup_1') AND next_action_at IS NOT NULL "
                     "AND next_action_at<=? ORDER BY next_action_at", (store.iso(now),)).fetchall()
    db.commit()
    return {"date": today, "queued": queued, "followups": due}


def pipeline_counts(db) -> dict:
    counts = {s: 0 for s in store.STAGES}
    for stage, n in db.execute("SELECT stage, COUNT(*) FROM leads GROUP BY stage"):
        counts[stage] = n
    return counts


def write_report(db, slate, discovery, path: Path | None = None) -> Path:
    REPORTS.mkdir(parents=True, exist_ok=True)
    path = path or REPORTS / f"leadgen-{slate['date']}.md"
    counts = pipeline_counts(db)
    frontier = db.execute("SELECT COUNT(*) FROM frontier WHERE status='pending'").fetchone()[0]
    lines = [f"# Partner lead slate, {slate['date']}", "",
             "Send each message yourself from the partnerships account to the public contact shown. "
             "After sending, run `leadgen.py mark <id> contacted`. Replies: `mark <id> replied` / `partner` / `declined`. "
             "Anyone who asks not to be contacted: `mark <id> dnc`.", "",
             "## Pipeline", "",
             "| " + " | ".join(counts) + " |", "|" + "---|" * len(counts), "| " + " | ".join(str(v) for v in counts.values()) + " |", "",
             f"Discovery frontier waiting: {frontier} handles."]
    for run in discovery:
        lines.append(f"- {run['source']}: {run.get('requests', 0)} requests, {run.get('profiled', 0)} profiled, "
                     f"{run.get('new_leads', 0)} new leads, {run.get('frontier_added', 0)} new candidates"
                     + (f" ({run['note']})" if run.get("note") else ""))
    active = db.execute("SELECT * FROM leads WHERE registrations>0 OR players>0 ORDER BY players DESC LIMIT 20").fetchall()
    if active:
        lines += ["", "## Partners with attributed players", "", "| Lead | Campaign | Registrations | Players |", "|---|---|---|---|"]
        lines += [f"| {r['name']} | `{r['campaign']}` | {r['registrations']} | {r['players']} |" for r in active]
    lines += ["", f"## First contacts ({len(slate['queued'])})", ""]
    for row in slate["queued"]:
        d = outreach.draft(row)
        lines += [f"### {row['name'] or row['handle']} · score {row['score']}",
                  f"`{row['id']}` · {row['segment']} · {row['url']} · audience {row['audience'] or 'unknown'}"
                  f" ({row['audience_source'] or 'unverified'}) · median views {row['median_views'] or 'n/a'} · lang {row['language']}",
                  f"Send to: **{d['channel']}**  ", f"Why: {row['score_reasons']}", "", "```text", d["text"], "```", ""]
    lines += [f"## Follow-ups due ({len(slate['followups'])})", ""]
    for row in slate["followups"]:
        kind = "followup_1" if row["stage"] == "contacted" else "followup_2"
        d = outreach.draft(row, kind)
        lines += [f"### {row['name'] or row['handle']} ({kind.replace('_', ' ')})", f"`{row['id']}` · send to **{d['channel']}**",
                  "", "```text", d["text"], "```", ""]
    path.write_text("\n".join(lines) + "\n")
    return path


def cmd_mark(db, args, cfg) -> None:
    next_at = None
    if args.stage in ("contacted", "followup_1"):
        index = 0 if args.stage == "contacted" else 1
        next_at = store.iso(store.utcnow() + timedelta(days=cfg["followup_days"][index]))
    store.set_stage(db, args.lead_id, args.stage, args.note or "", next_at)
    db.commit()
    print(f"{args.lead_id} -> {args.stage}" + (f" (next follow-up {next_at[:10]})" if next_at else ""))


SEGMENTS = {"telegram_chess_channel", "telegram_chess_group", "youtube_chess_creator", "twitch_chess_streamer",
            "x_chess_account", "tiktok_chess_creator", "chess_coach", "chess_club_online", "discord_chess_server",
            "ton_gaming_community"}


def handle_from(platform: str, value: str) -> str:
    value = value.strip().rstrip("/")
    for marker in ("t.me/s/", "t.me/", "youtube.com/@", "youtube.com/channel/", "x.com/", "twitter.com/", "tiktok.com/@",
                   "twitch.tv/", "lichess.org/team/", "discord.gg/", "discord.com/servers/", "discord.com/invite/"):
        if marker in value:
            return value.split(marker, 1)[1].split("/")[0].split("?")[0].lstrip("@").lower()
    if "://" in value:  # any other page: its last path segment, or the host
        parts = [p for p in value.split("://", 1)[1].split("?")[0].split("/") if p]
        value = parts[-1] if len(parts) > 1 else (parts[0] if parts else "")
    return value.lstrip("@").lower()


def cmd_import(db, path: Path) -> dict:
    """Import a researched CSV (segment,name,platform,handle_or_url,language,audience_size,...).
    Telegram rows are queued for profiling instead of trusted as-is; other platforms become leads."""
    added = queued = skipped = 0
    with open(path, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            segment = (row.get("segment") or "").strip()
            raw_url = (row.get("handle_or_url") or "").strip()
            platform = (row.get("platform") or "").strip().lower().split("/")[-1] or ("telegram" if segment.startswith("telegram") else "")
            if "t.me/" in raw_url:
                platform = "telegram"
            handle = handle_from(platform, row.get("handle_or_url") or "")
            if segment not in SEGMENTS or not handle or "joinchat" in handle or handle.startswith("+"):
                skipped += 1
                continue
            if platform == "telegram":
                queued += store.add_frontier(db, "telegram", handle, "seed-csv", 0)
                continue
            audience = row.get("audience_size", "").replace(",", "").strip()
            lead = {"platform": platform, "handle": handle, "url": (row.get("handle_or_url") or "").strip(),
                    "name": row.get("name"), "segment": segment, "language": (row.get("language") or "")[:2].lower() or None,
                    "audience": int(audience) if audience.isdigit() else None,
                    "audience_source": row.get("audience_size_source") or None,
                    "description": (row.get("fit_notes") or "")[:500], "relevance": 0.8,
                    "contact_route": "" if (row.get("contact_route") or "unknown").strip().lower() == "unknown" else row["contact_route"].strip(),
                    "source": "seed-csv", "discovered_from": path.name}
            added += store.upsert(db, lead)
    db.commit()
    return {"leads_added": added, "telegram_queued": queued, "skipped": skipped}


def cmd_sync(db, path: Path) -> dict:
    """Join the admin /player-metrics export (sources: campaign, registrations, players) onto leads."""
    data = json.loads(Path(path).read_text())
    sources = data.get("sources", data.get("data", {}).get("sources", []))
    matched = 0
    for src in sources:
        row = db.execute("SELECT * FROM leads WHERE campaign=?", (src.get("campaign"),)).fetchone()
        if not row:
            continue
        matched += 1
        db.execute("UPDATE leads SET registrations=?, players=? WHERE id=?",
                   (int(src.get("registrations") or 0), int(src.get("players") or 0), row["id"]))
        if int(src.get("players") or 0) > 0 and row["stage"] in ("partner", "replied", "contacted", "followup_1", "followup_2"):
            store.set_stage(db, row["id"], "active", f"{src.get('players')} attributed players")
    db.commit()
    return {"sources": len(sources), "matched_leads": matched}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--db", default=str(store.DEFAULT_DB))
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("daily", help="discover, rescore, build slate, write report")
    sub.add_parser("discover")
    sub.add_parser("slate")
    seed = sub.add_parser("seed-frontier")
    seed.add_argument("platform", choices=["tg"])
    seed.add_argument("handles", nargs="+")
    imp = sub.add_parser("import-seeds")
    imp.add_argument("csv", type=Path)
    mark = sub.add_parser("mark")
    mark.add_argument("lead_id")
    mark.add_argument("stage", choices=store.STAGES)
    mark.add_argument("--note")
    syn = sub.add_parser("sync-metrics")
    syn.add_argument("json", type=Path)
    exp = sub.add_parser("export")
    exp.add_argument("csv", type=Path)
    sub.add_parser("stats")
    args = parser.parse_args(argv)

    load_env()
    cfg = config()
    db = store.open_db(args.db)
    exclude(db, cfg["exclude"])
    exclude_ids(db, cfg["competitor_ids"])
    if args.cmd in ("daily", "discover"):
        discovery = discover(db, cfg)
        rescore(db)
        if args.cmd == "daily":
            path = write_report(db, build_slate(db, cfg), discovery)
            print(f"slate written: {path}")
        print(json.dumps(discovery, indent=1))
    elif args.cmd == "slate":
        rescore(db)
        print(f"slate written: {write_report(db, build_slate(db, cfg), [])}")
    elif args.cmd == "seed-frontier":
        n = sum(store.add_frontier(db, "telegram", h, "manual", 0) for h in args.handles)
        db.commit()
        print(f"{n} handles added to the Telegram frontier")
    elif args.cmd == "import-seeds":
        print(json.dumps(cmd_import(db, args.csv)))
    elif args.cmd == "mark":
        cmd_mark(db, args, cfg)
    elif args.cmd == "sync-metrics":
        print(json.dumps(cmd_sync(db, args.json)))
    elif args.cmd == "export":
        rows = db.execute("SELECT * FROM leads ORDER BY score DESC").fetchall()
        with open(args.csv, "w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow(rows[0].keys() if rows else ["id"])
            writer.writerows([tuple(r) for r in rows])
        print(f"{len(rows)} leads exported to {args.csv}")
    elif args.cmd == "stats":
        print(json.dumps({"pipeline": pipeline_counts(db),
                          "frontier": dict(db.execute("SELECT status, COUNT(*) FROM frontier GROUP BY status").fetchall()),
                          "by_segment": dict(db.execute("SELECT segment, COUNT(*) FROM leads GROUP BY segment").fetchall()),
                          "runs": [dict(r) for r in db.execute("SELECT * FROM runs ORDER BY id DESC LIMIT 5")]}, indent=1))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
