#!/usr/bin/env python3
"""Autonomous Content Autopilot & Scheduler for Web3Chess.

Polls the file-backed queue, tracks publication cadence, and dispatches
due approved content across X (Twitter), Telegram, and the website blog.

Modes:
  --tick               Run a single check & dispatch tick, then exit.
  --daemon             Run continuously in background, sleeping between ticks.
  --interval-seconds   Seconds between daemon ticks (default: 300 = 5 minutes).
  --min-spacing        Minimum minutes required between successive X posts (default: 30).
  --live               Enable live dispatch to X and Telegram (default: dry-run).
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import signal
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from agents.publisher import PublisherAgent
from pipeline import queue, site_publisher, telegram_publisher

LOG_DIR = HERE / "state"
LOG_DIR.mkdir(parents=True, exist_ok=True)
STATE_FILE = LOG_DIR / "autopilot_state.json"
LOG_FILE = LOG_DIR / "autopilot.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("autopilot")


def load_state() -> Dict[str, Any]:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception as e:
            logger.warning(f"Could not load state file: {e}")
    return {"last_x_post_at": None, "last_tg_post_at": None, "ticks": 0}


def save_state(state: Dict[str, Any]) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2) + "\n")


def get_last_published_x_time() -> Optional[datetime]:
    """Finds the most recent publication timestamp across all X posts in the queue."""
    latest = None
    for entry in queue.all_entries():
        if entry.get("kind") in ("x_post", "x_thread") and entry.get("status") == "published":
            # Check x_receipt or published timestamp
            ts_str = (
                (entry.get("published") or {}).get("at")
                or entry.get("updated_at")
            )
            if ts_str:
                try:
                    dt = datetime.strptime(ts_str[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
                    if latest is None or dt > latest:
                        latest = dt
                except Exception:
                    pass
    return latest


def run_tick(
    dry_run: bool = True,
    min_spacing_minutes: int = 30,
    force_next: bool = False,
) -> Dict[str, Any]:
    """Executes a single check-and-dispatch pass across all content channels."""
    now = queue.utcnow()
    state = load_state()
    state["ticks"] = state.get("ticks", 0) + 1
    state["last_tick_at"] = queue.iso(now)

    results: Dict[str, Any] = {
        "timestamp": queue.iso(now),
        "dry_run": dry_run,
        "x_dispatched": [],
        "tg_dispatched": [],
        "reveals_dispatched": [],
        "articles_staged": 0,
        "next_up": None,
    }

    # 1. Stage any approved blog articles to website
    try:
        staged = site_publisher.stage_approved()
        results["articles_staged"] = len(staged)
    except Exception as e:
        logger.warning(f"Blog staging error: {e}")

    # 2. Check X publication queue
    last_x = get_last_published_x_time()
    can_post_x = True
    spacing_elapsed = None

    if last_x:
        spacing_elapsed = (now - last_x).total_seconds() / 60.0
        if not force_next and spacing_elapsed < min_spacing_minutes:
            can_post_x = False
            logger.info(
                f"X cadence cooldown: {spacing_elapsed:.1f}m elapsed since last post "
                f"(min {min_spacing_minutes}m required)."
            )

    publisher = PublisherAgent()

    # Look for eligible approved X entries
    due_x_entries = []
    now_iso = queue.iso(now)
    for entry in queue.all_entries():
        if entry.get("kind") in ("x_post", "x_thread") and entry.get("status") == "approved":
            sched = entry.get("scheduled_at")
            if sched and sched > now_iso:
                continue
            # If entry specifies a creative, verify that its image is rendered on disk
            if entry.get("kind") == "x_post" and entry.get("creative"):
                img_path = entry.get("image")
                if not img_path:
                    cand = queue.QUEUE / entry.get("date", entry["id"][:10]) / f"{entry['id']}.png"
                    if cand.exists():
                        img_path = str(cand)
                if not img_path:
                    continue
                p = Path(img_path)
                if not (p.exists() or (queue.ROOT / p).exists() or (queue.HERE / p).exists()):
                    continue
            due_x_entries.append(entry)

    if due_x_entries:
        next_entry = due_x_entries[0]
        results["next_up"] = {
            "id": next_entry["id"],
            "category": next_entry.get("category"),
            "hook": next_entry.get("hook"),
            "scheduled_at": next_entry.get("scheduled_at"),
        }

        if can_post_x:
            logger.info(f"Dispatching due X post: {next_entry['id']} (dry_run={dry_run})")
            dispatch_res = publisher.dispatch_x_posts(
                post_id=next_entry["id"],
                dry_run=dry_run,
            )
            results["x_dispatched"] = dispatch_res.get("entries", [])
            if not dry_run and dispatch_res.get("entries"):
                state["last_x_post_at"] = queue.iso(now)
    else:
        logger.info("No due approved X posts waiting in queue.")

    # 3. Check Telegram queue (if bot credentials available)
    token, channel = telegram_publisher._credentials()
    if token and channel:
        try:
            tg_posts = telegram_publisher.publish_due(dry_run=dry_run, limit=1)
            results["tg_dispatched"] = tg_posts
            reveals = telegram_publisher.publish_reveals(dry_run=dry_run)
            results["reveals_dispatched"] = reveals
            if tg_posts and not dry_run:
                state["last_tg_post_at"] = queue.iso(now)
        except Exception as e:
            logger.warning(f"Telegram dispatch error: {e}")

    save_state(state)
    return results


def daemon_loop(
    interval_seconds: int = 300,
    min_spacing_minutes: int = 30,
    dry_run: bool = True,
) -> None:
    """Runs continuous background polling loop."""
    logger.info(
        f"Starting Autopilot Daemon (interval={interval_seconds}s, "
        f"min_spacing={min_spacing_minutes}m, dry_run={dry_run})"
    )

    running = True

    def _sig_handler(sig, frame):
        nonlocal running
        logger.info(f"Received signal {sig}, terminating gracefully...")
        running = False

    signal.signal(signal.SIGINT, _sig_handler)
    signal.signal(signal.SIGTERM, _sig_handler)

    while running:
        try:
            res = run_tick(
                dry_run=dry_run,
                min_spacing_minutes=min_spacing_minutes,
            )
            dispatched_count = len(res.get("x_dispatched", [])) + len(res.get("tg_dispatched", []))
            if dispatched_count > 0:
                logger.info(f"Tick completed: {dispatched_count} posts dispatched.")
            elif res.get("next_up"):
                logger.info(f"Next due in queue: {res['next_up']['id']}")
        except Exception as e:
            logger.error(f"Autopilot tick failure: {e}", exc_info=True)

        # Sleep interval in small slices so shutdown is prompt
        for _ in range(interval_seconds):
            if not running:
                break
            time.sleep(1)

    logger.info("Autopilot daemon stopped.")


def main():
    parser = argparse.ArgumentParser(description="Web3Chess Autonomous Content Autopilot")
    parser.add_argument("--tick", action="store_true", help="Run a single evaluation pass and exit")
    parser.add_argument("--daemon", action="store_true", help="Run continuously in background")
    parser.add_argument("--interval-seconds", type=int, default=300, help="Daemon sleep interval (default: 300s)")
    parser.add_argument("--min-spacing", type=int, default=30, help="Min minutes between X posts (default: 30)")
    parser.add_argument("--force-next", action="store_true", help="Bypass spacing cooldown to dispatch next due item immediately")
    parser.add_argument("--live", dest="dry_run", action="store_false", default=True, help="Live mode (post to real APIs)")

    args = parser.parse_args()

    if args.daemon:
        daemon_loop(
            interval_seconds=args.interval_seconds,
            min_spacing_minutes=args.min_spacing,
            dry_run=args.dry_run,
        )
    else:
        res = run_tick(
            dry_run=args.dry_run,
            min_spacing_minutes=args.min_spacing,
            force_next=args.force_next,
        )
        print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()
