"""Fill the slots the canned pools cannot: ask the AI writer for fresh copy, then let QA, the CMO and the dispatch gate decide.

Why (2026-11-12 audit): the copywriter pools ran dry, so the CMO kept refusing recycled hooks and slots went out empty or as
reruns to the same 62 followers. This module only *drafts*. A rewritten entry goes back to `draft` (or `rejected` when QA
fails) exactly like a `daily.py submit`, and the next CMO release review approves it or not. Nothing here publishes.

Spend is bounded: at most `max_per_tick` calls per daemon tick, `max_per_day` per UTC day, and `MAX_ATTEMPTS` per slot.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path

from . import hygiene, queue, writer

logger = logging.getLogger("content_ops.ai_refill")

HERE = Path(__file__).resolve().parent.parent
DISCOVERY = HERE / "state" / "latest-discovery.json"
MAX_ATTEMPTS = 2
LEAD = timedelta(minutes=45)  # time left before the slot for render, QA and the CMO review
REPEAT_MARKERS = ("hook already ran", "near-identical", "recycled", "date badge")
# Every field a writer can set; cleared before a rewrite so nothing from the refused draft leaks into the new one.
CONTENT_KEYS = ("hook", "text", "cta", "extra_buttons", "creative", "chess", "sources", "format", "hashtags", "reveal",
                "docked_reply", "render", "cmo_review", "approval", "qa", "brief")
KINDS = {"telegram": "telegram", "x_post": "x"}


def settings() -> dict:
    defaults = {"enabled": True, "channels": ["telegram", "x"], "max_per_tick": 1, "max_per_day": 12}
    return {**defaults, **queue.CONFIG.get("ai_writer", {})}


def _repeat_refusal(entry: dict) -> bool:
    review = entry.get("cmo_review") or {}
    issues = " ".join(review.get("issues") or [])
    return review.get("approved") is False and any(marker in issues for marker in REPEAT_MARKERS)


def needs_refill(entry: dict, now: datetime) -> str | None:
    """Why this slot should be (re)written by the AI writer, or None to leave it alone."""
    channel = KINDS.get(entry.get("kind"))
    if channel is None or channel not in settings()["channels"] or not queue.enabled(channel):
        return None
    if not hygiene.in_current_plan(entry) or entry.get("scheduled_at", "") < queue.iso(now + LEAD):
        return None
    if (entry.get("ai_refill") or {}).get("attempts", 0) >= MAX_ATTEMPTS:
        return None
    status = entry.get("status")
    if status == "planned":
        return "empty slot"
    if status == "rejected":
        return "draft failed QA"
    if status == "draft" and _repeat_refusal(entry):
        return "CMO refused a recycled draft"
    return None


def candidates(now: datetime) -> list[tuple[dict, str]]:
    out = []
    for offset in (0, 1):
        day = (now.date() + timedelta(days=offset)).isoformat()
        for entry in queue.all_entries(day=day):
            reason = needs_refill(entry, now)
            if reason:
                out.append((entry, reason))
    return sorted(out, key=lambda pair: pair[0].get("scheduled_at", ""))


def written_today(now: datetime) -> int:
    today = now.date().isoformat()
    return sum(1 for e in queue.all_entries() if (e.get("ai_refill") or {}).get("last_at", "")[:10] == today)


def _research(now: datetime) -> dict | None:
    try:
        candidate = json.loads(DISCOVERY.read_text())
        captured = datetime.fromisoformat(candidate["captured_at"].replace("Z", "+00:00"))
    except (OSError, ValueError, KeyError, TypeError):
        return None
    return candidate if timedelta(0) <= now - captured <= timedelta(hours=36) else None


def brief_for(entry: dict, now: datetime) -> dict:
    """The normal writer brief plus what this audience has already seen, so the copy is new to them."""
    from agents.cmo import REPEAT_DAYS, CmoAgent

    brief = writer.brief_for(entry, research=_research(now))
    seen = CmoAgent().recent_posts(entry, now)
    brief["already_published"] = {
        "rule": f"Our followers saw these in the last {REPEAT_DAYS} days. Do not reuse their hooks, positions, angles or "
                "wording; write something they have not seen.",
        "posts": [{"hook": e.get("hook"), "opening": (e.get("text") or "")[:160]} for e in seen][-40:],
    }
    previous = (entry.get("cmo_review") or {}).get("issues") or (entry.get("qa") or {}).get("issues")
    if previous:
        brief["previous_draft_refused_because"] = previous
    return brief


def rewrite(entry: dict, reason: str, now: datetime) -> dict:
    """Draft one slot through the API and attach it through the normal submit path (QA, render, status)."""
    import daily  # the CLI module owns the submit path (_attach -> _gate); imported late to avoid a cycle

    brief = brief_for(entry, now)
    record = entry.get("ai_refill") or {}
    record = {**record, "attempts": record.get("attempts", 0) + 1, "last_at": queue.iso(now), "reason": reason}
    try:
        draft = writer.api_write(brief)
    except Exception as exc:  # refusal, network, bad JSON: count the attempt and leave the slot as it was
        entry["ai_refill"] = {**record, "error": str(exc)[:300]}
        queue.save(entry)
        raise
    record["writer"] = draft.pop("_writer", None)
    record.pop("error", None)
    for key in CONTENT_KEYS:
        entry.pop(key, None)
    entry["ai_refill"] = record
    daily._attach(entry, draft)
    return queue.load(entry["id"])


def run(now: datetime, dry_run: bool = False) -> dict:
    """One daemon tick's worth of refills. Returns {configured, candidates, written:[{id, status, issues}], errors}."""
    cfg = settings()
    result = {"configured": writer.api_configured(), "candidates": [], "written": [], "errors": []}
    if not cfg["enabled"]:
        return result
    pending = candidates(now)
    result["candidates"] = [{"id": e["id"], "reason": r} for e, r in pending]
    if dry_run or not result["configured"] or not pending:
        return result
    budget = min(cfg["max_per_tick"], cfg["max_per_day"] - written_today(now))
    for entry, reason in pending[:max(budget, 0)]:
        try:
            done = rewrite(entry, reason, now)
            result["written"].append({"id": done["id"], "status": done["status"], "issues": (done.get("qa") or {}).get("issues", [])})
        except Exception as exc:
            logger.warning(f"AI writer could not fill {entry['id']}: {exc}")
            result["errors"].append({"id": entry["id"], "error": str(exc)[:300]})
    return result
