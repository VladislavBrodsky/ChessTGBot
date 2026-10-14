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


def get_last_published_tg_time() -> Optional[datetime]:
    """Finds the most recent publication timestamp across all Telegram posts in the queue."""
    latest = None
    for entry in queue.all_entries():
        if entry.get("kind") == "telegram" and entry.get("status") == "published":
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
    min_tg_spacing_minutes: int = 180,
    force_next: bool = False,
    force_next_tg: bool = False,
) -> Dict[str, Any]:
    """Executes a single check-and-dispatch pass across all content channels."""
    now = queue.utcnow()
    now_iso = queue.iso(now)
    state = load_state()
    state["ticks"] = state.get("ticks", 0) + 1
    state["last_tick_at"] = now_iso

    results: Dict[str, Any] = {
        "timestamp": now_iso,
        "dry_run": dry_run,
        "x_dispatched": [],
        "tg_dispatched": [],
        "reveals_dispatched": [],
        "articles_staged": 0,
        "next_up_x": None,
        "next_up_tg": None,
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
    if last_x:
        spacing_elapsed = (now - last_x).total_seconds() / 60.0
        if not force_next and spacing_elapsed < min_spacing_minutes:
            can_post_x = False
            logger.info(
                f"X cadence cooldown: {spacing_elapsed:.1f}m elapsed since last post "
                f"(min {min_spacing_minutes}m required)."
            )

    publisher = PublisherAgent()

    due_x_entries = []
    for entry in queue.all_entries():
        if entry.get("kind") in ("x_post", "x_thread") and entry.get("status") == "approved":
            sched = entry.get("scheduled_at")
            if sched and sched > now_iso:
                continue
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
        due_x_entries.sort(key=lambda e: e.get("scheduled_at") or e["id"])
        next_entry = due_x_entries[0]
        results["next_up_x"] = {
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

    # 3. Check Telegram publication queue
    token, channel = telegram_publisher._credentials()
    if token and channel:
        last_tg = get_last_published_tg_time()
        can_post_tg = True
        if last_tg:
            spacing_elapsed_tg = (now - last_tg).total_seconds() / 60.0
            if not force_next_tg and spacing_elapsed_tg < min_tg_spacing_minutes:
                can_post_tg = False
                logger.info(
                    f"Telegram cadence cooldown: {spacing_elapsed_tg:.1f}m elapsed since last post "
                    f"(min {min_tg_spacing_minutes}m required)."
                )

        due_tg_entries = []
        for entry in queue.all_entries():
            if entry.get("kind") == "telegram" and entry.get("status") == "approved":
                sched = entry.get("scheduled_at")
                if sched and sched > now_iso:
                    continue
                if entry.get("creative"):
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
                due_tg_entries.append(entry)

        if due_tg_entries:
            due_tg_entries.sort(key=lambda e: e.get("scheduled_at") or e["id"])
            next_tg = due_tg_entries[0]
            results["next_up_tg"] = {
                "id": next_tg["id"],
                "category": next_tg.get("category"),
                "hook": next_tg.get("hook"),
                "scheduled_at": next_tg.get("scheduled_at"),
            }

            if can_post_tg:
                logger.info(f"Dispatching due Telegram post: {next_tg['id']} (dry_run={dry_run})")
                try:
                    tg_outcome = telegram_publisher.publish_post_by_id(next_tg["id"], dry_run=dry_run)
                    results["tg_dispatched"] = [tg_outcome]
                    if not dry_run:
                        state["last_tg_post_at"] = queue.iso(now)
                except Exception as e:
                    logger.error(f"Telegram dispatch error for {next_tg['id']}: {e}")
        else:
            logger.info("No due approved Telegram posts waiting in queue.")

        # Always check for due puzzle reveals
        try:
            reveals = telegram_publisher.publish_reveals(dry_run=dry_run)
            results["reveals_dispatched"] = reveals
        except Exception as e:
            logger.warning(f"Telegram reveals error: {e}")

    save_state(state)
    return results


def daemon_loop(
    interval_seconds: int = 60,
    min_spacing_minutes: int = 30,
    min_tg_spacing_minutes: int = 180,
    dry_run: bool = True,
) -> None:
    """Runs continuous background polling loop."""
    logger.info(
        f"Starting Autopilot Daemon (interval={interval_seconds}s, "
        f"min_x_spacing={min_spacing_minutes}m, min_tg_spacing={min_tg_spacing_minutes}m, dry_run={dry_run})"
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
                min_tg_spacing_minutes=min_tg_spacing_minutes,
            )
            dispatched_count = len(res.get("x_dispatched", [])) + len(res.get("tg_dispatched", []))
            if dispatched_count > 0:
                logger.info(f"Tick completed: {dispatched_count} posts dispatched.")
        except Exception as e:
            logger.error(f"Autopilot tick failure: {e}", exc_info=True)

        for _ in range(interval_seconds):
            if not running:
                break
            time.sleep(1)

    logger.info("Autopilot daemon stopped.")


def main():
    parser = argparse.ArgumentParser(description="Web3Chess Autonomous Content Autopilot")
    parser.add_argument("--tick", action="store_true", help="Run a single evaluation pass and exit")
    parser.add_argument("--daemon", action="store_true", help="Run continuously in background")
    parser.add_argument("--interval-seconds", type=int, default=60, help="Daemon sleep interval (default: 60s)")
    parser.add_argument("--min-spacing", type=int, default=30, help="Min minutes between X posts (default: 30)")
    parser.add_argument("--min-tg-spacing", type=int, default=180, help="Min minutes between Telegram posts (default: 180)")
    parser.add_argument("--force-next", action="store_true", help="Bypass spacing cooldown to dispatch next due X item")
    parser.add_argument("--force-next-tg", action="store_true", help="Bypass spacing cooldown to dispatch next due Telegram item")
    parser.add_argument("--live", dest="dry_run", action="store_false", default=True, help="Live mode (post to real APIs)")

    args = parser.parse_args()

    if args.daemon:
        daemon_loop(
            interval_seconds=args.interval_seconds,
            min_spacing_minutes=args.min_spacing,
            min_tg_spacing_minutes=args.min_tg_spacing,
            dry_run=args.dry_run,
        )
    else:
        res = run_tick(
            dry_run=args.dry_run,
            min_spacing_minutes=args.min_spacing,
            min_tg_spacing_minutes=args.min_tg_spacing,
            force_next=args.force_next,
            force_next_tg=args.force_next_tg,
        )
        print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()

