"""Queue and daemon hygiene: keep the active queue to the current plan and say what stands between a draft and the channel.

The autopilot is a long-lived process, so a commit does not reach it by itself. `engine_fingerprint()` lets it notice
that its code or config changed on disk and exit for launchd to restart it, and lets `daily.py doctor` show whether the
running daemon is the code in the checkout.
"""
from __future__ import annotations
import hashlib, json, os, re, subprocess, sys
from datetime import datetime, timedelta
from pathlib import Path
from . import gate, queue, renderer

SLOT_ID = re.compile(r"^\d{4}-\d{2}-\d{2}-(tg|x)-([1-6])$")
KINDS = ("telegram", "x_post", "x_thread")
LOOKAHEAD_DAYS = 7
LAUNCHD_LABEL = "com.web3chess.autopilot"
STATE_FILE = queue.HERE / "state" / "autopilot_state.json"


def engine_fingerprint() -> str:
    """Digest of the Python sources and config the autopilot runs on (size and mtime, so it is cheap to poll)."""
    files = [*queue.HERE.glob("*.py"), *queue.HERE.glob("agents/*.py"), *queue.HERE.glob("pipeline/*.py"),
             queue.HERE / "pipeline" / "config.json"]
    digest = hashlib.sha256()
    for path in sorted(p for p in files if p.exists() and not p.name.startswith("test_")):
        stat = path.stat()
        digest.update(f"{path.relative_to(queue.HERE)}:{stat.st_mtime_ns}:{stat.st_size}".encode())
    return digest.hexdigest()[:12]


def in_current_plan(entry: dict) -> bool:
    """A slot of the current plan: id `<date>-tg|x-N` with N within the configured slots, scheduled at the configured UTC time for N."""
    match = SLOT_ID.match(entry["id"])
    if not match:
        return False
    slots = queue.CONFIG["telegram" if match.group(1) == "tg" else "x"]["slots_utc"]
    n = int(match.group(2))
    if n > len(slots):  # the plan shrank (2026-11-12: Telegram 6 -> 2); higher slots are no longer part of it
        return False
    return entry.get("scheduled_at") == f"{entry.get('date')}T{slots[n - 1]}:00Z"


def review_state(entry: dict, now: datetime | None = None) -> tuple[str, list[str]]:
    """Where an unpublished entry stands: cleared | review | fix | late | legacy, with the reasons."""
    now = now or queue.utcnow()
    if entry.get("date", "") < now.date().isoformat():
        return "legacy", ["dated before today"]
    if not in_current_plan(entry):
        return "legacy", ["not part of the current slot plan"]
    if entry.get("scheduled_at", "") < queue.iso(now - gate.WINDOW):
        return "late", ["slot passed more than 3 hours ago"]
    if entry.get("status") == "approved" and not gate.blockers(entry, now, due=False):
        return "cleared", []
    fix = gate.content_blockers(entry)
    if fix:
        return "fix", fix
    return "review", gate.approval_blockers(entry) if entry.get("status") == "approved" else []


def archive(entry: dict, reason: str, dry_run: bool = False) -> None:
    """Move an entry out of the active queue (the glob never looks two levels down). Its spec stays; images are
    deleted because they re-render from the spec."""
    if dry_run:
        return
    source = queue.path_for(entry["id"], entry.get("date"))
    target = queue.QUEUE / "_archive" / entry["date"] / source.name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps({**entry, "archived": {"reason": reason, "at": queue.iso(queue.utcnow())}},
                                 indent=2, ensure_ascii=False) + "\n")
    for sibling in source.parent.glob(f"{entry['id']}.*"):
        sibling.unlink()


def repair(now: datetime | None = None, dry_run: bool = False, render: bool = True) -> dict:
    """Bring the active queue back to the current plan.

    - unpublished entries from before today, outside the slot plan, or absurdly far ahead are archived;
    - approvals that are not fully cleared (no person, edited since, drawn on an older canvas) go back to draft;
    - drafts whose slot is still open are re-rendered so they show the current canvases.
    `publishing` and `failed` entries are never touched: their send outcome needs a human to reconcile the receipt."""
    now = now or queue.utcnow()
    today = now.date()
    report: dict = {"archived": [], "demoted": [], "rendered": [], "render_failed": []}
    for entry in queue.all_entries():
        if entry.get("kind") not in KINDS or entry.get("status") not in ("approved", "draft"):
            continue
        day = datetime.fromisoformat(entry["date"]).date()
        state, reasons = review_state(entry, now)
        if state == "legacy" or day > today + timedelta(days=LOOKAHEAD_DAYS):
            archive(entry, reasons[0] if state == "legacy" else "dated too far ahead", dry_run)
            report["archived"].append(entry["id"])
            continue
        if entry["status"] == "approved" and state != "cleared":
            entry.pop("approval", None)
            entry["held"] = {"reason": "; ".join(reasons) or "approval is not valid for the current content", "at": queue.iso(now)}
            entry["status"] = "draft"
            if not dry_run:
                queue.set_status(entry, "draft")
            report["demoted"].append(entry["id"])
        if render and state != "late" and entry["status"] == "draft" and gate.canvas_blockers(entry):
            if dry_run:
                report["rendered"].append(entry["id"])
                continue
            renderer.render(entry)
            queue.save(entry)
            (report["rendered"] if (entry.get("render") or {}).get("ok") else report["render_failed"]).append(entry["id"])
    return report


def daemon_report() -> list[str]:
    """Is the autopilot loaded, alive, and running the code that is on disk?"""
    lines = []
    if sys.platform == "darwin":
        out = subprocess.run(["launchctl", "print", f"gui/{os.getuid()}/{LAUNCHD_LABEL}"], capture_output=True, text=True)
        lines.append(f"launchd job {LAUNCHD_LABEL}: " + ("loaded" if out.returncode == 0 else "not loaded"))
    try:
        daemon = json.loads(STATE_FILE.read_text()).get("daemon") or {}
    except (OSError, ValueError):
        daemon = {}
    pid = daemon.get("pid")
    alive = False
    if pid:
        try:
            os.kill(pid, 0)
            alive = True
        except OSError:
            pass
    if not alive:
        lines.append("daemon process: not running")
        return lines
    current = engine_fingerprint()
    lines.append(f"daemon process: pid {pid} since {daemon.get('started_at')}")
    lines.append("daemon code: " + ("matches the checkout" if daemon.get("fingerprint") == current
                                    else "STALE, it booted on older code or config than the checkout has (it exits and restarts itself on its next tick)"))
    return lines
