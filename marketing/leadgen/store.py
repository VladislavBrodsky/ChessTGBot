"""SQLite CRM for partner leads: leads, a discovery frontier and an event log.

The database lives in marketing/leadgen/state/ (ignored by Git). Every lead row is a public
channel, creator or community, never a private person. Stages move forward through
STAGES; `dnc` (do not contact) and `declined` are terminal and are never put on a slate again.
"""
from __future__ import annotations

import json
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_DB = HERE / "state" / "leads.sqlite3"

STAGES = ["new", "queued", "contacted", "followup_1", "followup_2", "replied", "partner", "active", "declined", "dnc", "disqualified"]
TERMINAL = {"declined", "dnc", "disqualified"}
OPEN_OUTREACH = {"contacted", "followup_1", "followup_2"}

SCHEMA = [
    """CREATE TABLE IF NOT EXISTS leads(
        id TEXT PRIMARY KEY, segment TEXT, platform TEXT, handle TEXT, url TEXT, name TEXT,
        language TEXT, audience INTEGER, audience_source TEXT, median_views INTEGER,
        last_post_at TEXT, posts_30d INTEGER, relevance REAL, description TEXT,
        contact_route TEXT, score INTEGER, score_reasons TEXT, stage TEXT DEFAULT 'new',
        campaign TEXT, players INTEGER DEFAULT 0, registrations INTEGER DEFAULT 0,
        source TEXT, discovered_from TEXT, first_seen TEXT, last_checked TEXT,
        next_action_at TEXT, notes TEXT)""",
    """CREATE TABLE IF NOT EXISTS frontier(
        platform TEXT, handle TEXT, discovered_from TEXT, depth INTEGER, added_at TEXT,
        status TEXT DEFAULT 'pending', tried_at TEXT, PRIMARY KEY(platform, handle))""",
    """CREATE TABLE IF NOT EXISTS events(
        id INTEGER PRIMARY KEY AUTOINCREMENT, lead_id TEXT, at TEXT, kind TEXT, detail TEXT)""",
    """CREATE TABLE IF NOT EXISTS runs(
        id INTEGER PRIMARY KEY AUTOINCREMENT, started_at TEXT, source TEXT, requests INTEGER,
        profiled INTEGER, new_leads INTEGER, frontier_added INTEGER, note TEXT)""",
]

SLUG_RE = re.compile(r"[^a-z0-9]+")


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def iso(dt: datetime | None = None) -> str:
    return (dt or utcnow()).isoformat().replace("+00:00", "Z")


def lead_id(platform: str, handle: str) -> str:
    return f"{platform}:{handle.lower().lstrip('@')}"


def campaign_for(platform: str, handle: str) -> str:
    """Attribution id for the partner link. Must satisfy the backend's mk_ rules:
    `^mk_[A-Za-z0-9_-]{1,61}$` and, lower-cased, `^[a-z0-9][a-z0-9_-]{0,63}$`."""
    prefix = {"telegram": "tg", "youtube": "yt", "x": "x", "tiktok": "tt", "twitch": "tw"}.get(platform, "o")
    slug = SLUG_RE.sub("_", handle.lower().lstrip("@")).strip("_")[:52] or "lead"
    return f"mk_p{prefix}_{slug}"


def open_db(path: Path | str = DEFAULT_DB) -> sqlite3.Connection:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    for statement in SCHEMA:
        db.execute(statement)
    db.commit()
    return db


def get(db, lid: str):
    return db.execute("SELECT * FROM leads WHERE id=?", (lid,)).fetchone()


def log(db, lid: str, kind: str, detail: str | dict = "") -> None:
    if isinstance(detail, dict):
        detail = json.dumps(detail, ensure_ascii=False, sort_keys=True)
    db.execute("INSERT INTO events(lead_id, at, kind, detail) VALUES(?,?,?,?)", (lid, iso(), kind, detail))


FIELDS = ["segment", "platform", "handle", "url", "name", "language", "audience", "audience_source",
          "median_views", "last_post_at", "posts_30d", "relevance", "description", "contact_route",
          "source", "discovered_from"]


def upsert(db, lead: dict) -> bool:
    """Insert or refresh a lead's observed fields. Returns True when the lead is new.
    Stage, notes, campaign and outreach history are never overwritten by discovery."""
    lid = lead_id(lead["platform"], lead["handle"])
    existing = get(db, lid)
    now = iso()
    values = {k: lead.get(k) for k in FIELDS}
    if existing is None:
        db.execute(
            f"INSERT INTO leads(id, {', '.join(FIELDS)}, campaign, stage, first_seen, last_checked) "
            f"VALUES(?, {', '.join('?' for _ in FIELDS)}, ?, 'new', ?, ?)",
            (lid, *values.values(), campaign_for(lead["platform"], lead["handle"]), now, now),
        )
        log(db, lid, "discovered", {"source": lead.get("source"), "from": lead.get("discovered_from")})
        return True
    # keep previously observed values when a new observation lacks them
    merged = {k: (v if v not in (None, "") else existing[k]) for k, v in values.items()}
    db.execute(
        f"UPDATE leads SET {', '.join(f'{k}=?' for k in merged)}, last_checked=? WHERE id=?",
        (*merged.values(), now, lid),
    )
    return False


def set_stage(db, lid: str, stage: str, note: str = "", next_action_at: str | None = None) -> None:
    if stage not in STAGES:
        raise ValueError(f"Unknown stage {stage!r}; use one of {', '.join(STAGES)}")
    if get(db, lid) is None:
        raise KeyError(f"No lead {lid!r}")
    db.execute("UPDATE leads SET stage=?, next_action_at=?, notes=TRIM(COALESCE(notes,'') || ? ) WHERE id=?",
               (stage, next_action_at, f"\n[{iso()[:10]}] {stage}: {note}" if note else "", lid))
    log(db, lid, f"stage:{stage}", note)


def add_frontier(db, platform: str, handle: str, discovered_from: str, depth: int) -> bool:
    handle = handle.lower().lstrip("@")
    if get(db, lead_id(platform, handle)) is not None:
        return False
    cur = db.execute(
        "INSERT OR IGNORE INTO frontier(platform, handle, discovered_from, depth, added_at) VALUES(?,?,?,?,?)",
        (platform, handle, discovered_from, depth, iso()),
    )
    return cur.rowcount > 0


def next_frontier(db, platform: str, limit: int):
    return db.execute(
        "SELECT * FROM frontier WHERE platform=? AND status='pending' ORDER BY depth ASC, added_at ASC LIMIT ?",
        (platform, limit),
    ).fetchall()


def mark_frontier(db, platform: str, handle: str, status: str) -> None:
    db.execute("UPDATE frontier SET status=?, tried_at=? WHERE platform=? AND handle=?",
               (status, iso(), platform, handle.lower()))


def record_run(db, source: str, requests: int, profiled: int, new_leads: int, frontier_added: int, note: str = "") -> None:
    db.execute("INSERT INTO runs(started_at, source, requests, profiled, new_leads, frontier_added, note) VALUES(?,?,?,?,?,?,?)",
               (iso(), source, requests, profiled, new_leads, frontier_added, note))
