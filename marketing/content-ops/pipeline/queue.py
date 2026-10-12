"""File-backed content queue: queue/YYYY-MM-DD/<id>.json. Status lives in the file so any runner can resume."""
from __future__ import annotations
import json
from datetime import date, datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
ROOT = HERE.parents[1]
QUEUE = HERE / "queue"
CONFIG = json.loads((Path(__file__).resolve().parent / "config.json").read_text())
STATUSES = ("planned", "draft", "approved", "publishing", "rejected", "published", "failed")
WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def path_for(entry_id: str, day: str | None = None) -> Path:
    day = day or entry_id[:10]
    return QUEUE / day / f"{entry_id}.json"

def save(entry: dict) -> Path:
    path = path_for(entry["id"], entry.get("date"))
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(entry, indent=2, ensure_ascii=False) + "\n")
    tmp.replace(path)
    return path

def load(entry_id: str) -> dict:
    return json.loads(path_for(entry_id).read_text())

def all_entries(kind: str | None = None, status: str | None = None, day: str | None = None) -> list[dict]:
    out = []
    pattern = f"{day}/*.json" if day else "*/*.json"
    for file in sorted(QUEUE.glob(pattern)):
        if file.name.endswith(".spec.json"): continue  # render inputs written by pipeline.renderer, not entries
        entry = json.loads(file.read_text())
        if kind and entry.get("kind") != kind: continue
        if status and entry.get("status") != status: continue
        out.append(entry)
    return out

def plan_day(day: date, kind: str) -> list[dict]:
    """Create empty `planned` entries for the day's slots (idempotent)."""
    norm_kind = "telegram" if kind == "telegram" else "x" if kind in ("x", "x_post") else "site"
    cfg = CONFIG.get(norm_kind, CONFIG.get("telegram"))
    categories = cfg["rotation"][WEEKDAYS[day.weekday()]]
    prefix = "tg" if norm_kind == "telegram" else "x" if norm_kind == "x" else "art"
    entry_kind = "telegram" if norm_kind == "telegram" else "x_post" if norm_kind == "x" else "article"
    entries = []
    for slot, (hhmm, category) in enumerate(zip(cfg["slots_utc"], categories), start=1):
        entry_id = f"{day.isoformat()}-{prefix}-{slot}"
        if path_for(entry_id).exists():
            entries.append(load(entry_id)); continue
        hh, mm = map(int, hhmm.split(":"))
        when = datetime(day.year, day.month, day.day, hh, mm, tzinfo=timezone.utc)
        entry = {"id": entry_id, "kind": entry_kind, "date": day.isoformat(), "slot": slot, "category": category,
                 "scheduled_at": iso(when), "status": "planned", "qa": None}
        save(entry); entries.append(entry)
    return entries

def set_status(entry: dict, status: str, **extra) -> dict:
    assert status in STATUSES
    entry["status"] = status
    entry.update(extra)
    entry["updated_at"] = iso(utcnow())
    save(entry)
    return entry
