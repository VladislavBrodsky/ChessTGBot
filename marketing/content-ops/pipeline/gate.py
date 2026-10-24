"""Dispatch gate: the one place that decides whether a queue entry may leave the building.

Approval is a claim made once, by one person, about one version of the copy drawn on one version of the canvases.
Publishers used to keep their own ideas of "approved and due", and a daemon running last week's code kept sending last
week's approvals on last week's canvases. Every publisher (autopilot, daily.py, PublisherAgent, telegram_publisher) now
asks `blockers()`, and an empty list is the only thing that lets a post go out. Gates may be tightened, not loosened,
without CMO sign-off (OPERATIONS.md).
"""
from __future__ import annotations
import copy, hashlib, json
from datetime import datetime, timedelta
from pathlib import Path
from . import qa, queue, renderer

WINDOW = timedelta(hours=3)  # a missed slot is rescheduled on purpose, never sent late as catch-up
CONTENT_FIELDS = ("hook", "text", "cta", "extra_buttons", "creative", "chess", "reveal", "docked_reply", "hashtags", "topic", "tweets")
VOLATILE_REVEAL = ("image", "sent")  # filled in by the renderer and the reveal sender, not by the reviewer
CHECKS = {"telegram": qa.check_telegram, "x_post": qa.check_x_post, "x_thread": qa.check_x_thread}
APPROVERS = {"review": ("human",), "cmo": ("human", "agent:cmo")}  # who may approve, by config mode; "auto" needs no record


def channel(entry: dict) -> str:
    return "telegram" if entry.get("kind") == "telegram" else "x"


def content_hash(entry: dict) -> str:
    """Digest of everything a reviewer reads or sees: copy, buttons, creative spec and the answer reveal."""
    body = {k: entry[k] for k in CONTENT_FIELDS if entry.get(k) is not None}
    if isinstance(body.get("reveal"), dict):
        body["reveal"] = {k: v for k, v in body["reveal"].items() if k not in VOLATILE_REVEAL}
    return hashlib.sha256(json.dumps(body, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]


def approval(entry: dict, by: str) -> dict:
    """The record `daily.py approve` stores. It names the copy and the canvas version the reviewer actually looked at."""
    return {"by": by, "at": queue.iso(queue.utcnow()), "content": content_hash(entry),
            "canvas": (entry.get("render") or {}).get("canvas")}


def image_file(entry: dict) -> Path | None:
    candidates: list[Path] = []
    if entry.get("image"):
        path = Path(entry["image"])
        candidates += [path] if path.is_absolute() else [queue.ROOT / path, queue.HERE / path]
    candidates.append(queue.QUEUE / entry.get("date", entry["id"][:10]) / f"{entry['id']}.png")
    return next((p for p in candidates if p.exists()), None)


def window_blockers(entry: dict, now: datetime, due: bool = True) -> list[str]:
    """Only today's UTC queue may send, inside the slot's window. `due=False` also allows a slot that has not arrived."""
    scheduled = entry.get("scheduled_at")
    if entry.get("date") != now.date().isoformat():
        return [f"dated {entry.get('date')}, not today (UTC); older approvals need deliberate rescheduling"]
    if not scheduled:
        return ["no scheduled time"]
    if scheduled < queue.iso(now - WINDOW):
        return ["slot passed more than 3 hours ago; reschedule instead of catching up"]
    if due and scheduled > queue.iso(now):
        return [f"not due until {scheduled}"]
    return []


def approval_blockers(entry: dict) -> list[str]:
    mode = queue.CONFIG["mode"].get(channel(entry), "review")
    if mode == "auto":
        return []  # auto mode has no reviewer, so the canvas and QA gates below are the whole check
    record = entry.get("approval")
    if not isinstance(record, dict):
        return ["no approval record; the CMO review or a person (daily.py approve) must approve it"]
    out = []
    allowed = APPROVERS.get(mode, ("human",))
    if not str(record.get("by", "")).startswith(allowed):
        out.append(f"approved by {record.get('by')!r}, but {mode} mode accepts only {' or '.join(allowed)}")
    if record.get("content") != content_hash(entry):
        out.append("copy or creative was edited after approval")
    if entry.get("creative") and record.get("canvas") != (entry.get("render") or {}).get("canvas"):
        out.append("image was re-rendered after approval; review the new image")
    return out


def canvas_blockers(entry: dict) -> list[str]:
    """Is the image on disk drawn by the current renderer and templates? Cured by re-rendering, never by approving."""
    if not entry.get("creative"):
        return []
    render = entry.get("render") or {}
    engine = "board" if renderer.exact_board(entry) else "studio"
    if not render.get("ok"):
        return ["creative has not rendered" + (f": {str(render['error'])[:120]}" if render.get("error") else "")]
    if render.get("engine") != engine:
        return [f"image came from an older renderer (engine {render.get('engine') or 'unstamped'}, need {engine}); re-render"]
    if render.get("canvas") != renderer.canvas_version():
        return ["image predates the current canvas templates; re-render and re-review"]
    if not image_file(entry):
        return ["rendered image is missing from disk"]
    return []


def content_blockers(entry: dict) -> list[str]:
    """What stops this content shipping whoever approved it and whenever it is due: the canvas and today's QA rules."""
    out = canvas_blockers(entry)
    check = CHECKS.get(entry.get("kind"))
    if check:  # approvals are not permanent: rules added since the post was approved apply to it too
        out += [f"fails current QA: {issue}" for issue in check(copy.deepcopy(entry))["issues"]]
    return out


def blockers(entry: dict, now: datetime | None = None, *, due: bool = True) -> list[str]:
    """Reasons this entry must not be sent right now. Empty means cleared for dispatch."""
    now = now or queue.utcnow()
    if entry.get("status") != "approved":
        return [f"status is {entry.get('status')}, not approved"]
    out = [] if (entry.get("qa") or {}).get("passed") else ["no passing QA record"]
    return out + window_blockers(entry, now, due) + approval_blockers(entry) + content_blockers(entry)
