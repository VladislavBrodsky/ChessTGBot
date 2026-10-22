#!/usr/bin/env python3
"""Autonomous Content Autopilot & Scheduler for Web3Chess.

Polls the file-backed queue, tracks publication cadence, and dispatches
due approved content across X (Twitter), Telegram, and the website blog.

Modes:
  --tick               Run a single check & dispatch tick, then exit.
  --daemon             Run continuously in background, sleeping between ticks.
  --interval-seconds   Seconds between daemon ticks (default: 300 = 5 minutes).
  --min-spacing        Minimum minutes required between successive X posts (default: 180).
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

from agents.orchestrator import ContentEngineOrchestrator
from agents.publisher import PublisherAgent
from pipeline import analytics, cleanup, queue, renderer, reply_sniper, site_publisher, telegram_publisher

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


def _has_valid_image(entry: Dict[str, Any]) -> bool:
    """Checks if an entry with a creative spec has its rendered PNG on disk."""
    if not entry.get("creative"):
        return True
    img_path = entry.get("image")
    if not img_path:
        cand = queue.QUEUE / entry.get("date", entry["id"][:10]) / f"{entry['id']}.png"
        if cand.exists():
            return True
        return False
    p = Path(img_path)
    return bool(p.exists() or (queue.ROOT / p).exists() or (queue.HERE / p).exists())


def _published_today(kind: str, day: str) -> int:
    return sum(1 for entry in queue.all_entries(day=day)
               if entry.get("kind") in ({"x_post", "x_thread"} if kind == "x" else {"telegram"})
               and entry.get("status") == "published")


def ensure_x_queue_replenished(now: datetime, render_images: bool = True, lookahead_days: int = 1) -> int:
    """Prepare missing X drafts while preserving reviewed or published entries."""
    created_total = 0
    today = now.date()

    for offset in range(lookahead_days + 1):
        target_day = today + timedelta(days=offset)
        target_day_str = target_day.isoformat()
        day_entries = [e for e in queue.all_entries(day=target_day_str) if e.get("kind") in ("x_post", "x_thread")]

        if len([e for e in day_entries if e.get("id", "").rsplit("-", 1)[-1].isdigit()]) < len(queue.CONFIG["x"]["slots_utc"]) or any(e.get("status") == "planned" for e in day_entries):
            try:
                logger.info(f"Proactive Buffer: Auto-generating X batch for {target_day_str}...")
                orchestrator = ContentEngineOrchestrator(plan_date=target_day)
                batch = orchestrator.generate_x_daily_batch(target_date=target_day, render_images=render_images)
                created = int(batch.get("posts_created", 0))
                created_total += created
                logger.info(f"Prepared {created} X queue slots for {target_day_str}.")
            except Exception as e:
                logger.error(f"Failed buffering X batch for {target_day_str}: {e}", exc_info=True)

    # Render any missing images across all approved X posts
    if render_images:
        for entry in queue.all_entries():
            if entry.get("kind") in ("x_post", "x_thread") and entry.get("status") == "approved":
                if entry.get("kind") == "x_post" and entry.get("creative") and not _has_valid_image(entry):
                    try:
                        logger.info(f"Rendering missing X creative for {entry['id']}...")
                        renderer.render(entry)
                        queue.save(entry)
                    except Exception as e:
                        logger.error(f"Failed rendering X creative for {entry['id']}: {e}")

    return created_total


def ensure_tg_queue_replenished(now: datetime, render_images: bool = True, lookahead_days: int = 1) -> int:
    """Prepare missing Telegram drafts while preserving reviewed or published entries."""
    created_total = 0
    today = now.date()

    for offset in range(lookahead_days + 1):
        target_day = today + timedelta(days=offset)
        target_day_str = target_day.isoformat()
        day_entries = [e for e in queue.all_entries(day=target_day_str) if e.get("kind") == "telegram"]

        if len([e for e in day_entries if e.get("id", "").rsplit("-", 1)[-1].isdigit()]) < len(queue.CONFIG["telegram"]["slots_utc"]) or any(e.get("status") == "planned" for e in day_entries):
            try:
                logger.info(f"Proactive Buffer: Auto-generating Telegram batch for {target_day_str}...")
                orchestrator = ContentEngineOrchestrator(plan_date=target_day)
                batch = orchestrator.generate_telegram_daily_batch(target_date=target_day, render_images=render_images)
                created = int(batch.get("posts_created", 0))
                created_total += created
                logger.info(f"Prepared {created} Telegram queue slots for {target_day_str}.")
            except Exception as e:
                logger.error(f"Failed buffering Telegram batch for {target_day_str}: {e}", exc_info=True)

    # Render any missing images across all approved Telegram posts
    if render_images:
        for entry in queue.all_entries():
            if entry.get("kind") == "telegram" and entry.get("status") == "approved":
                if entry.get("creative") and not _has_valid_image(entry):
                    try:
                        logger.info(f"Rendering missing Telegram creative for {entry['id']}...")
                        renderer.render(entry)
                        queue.save(entry)
                    except Exception as e:
                        logger.error(f"Failed rendering Telegram creative for {entry['id']}: {e}")

    return created_total


def run_tick(
    dry_run: bool = True,
    min_spacing_minutes: int = 180,
    min_tg_spacing_minutes: int = 180,
    force_next: bool = False,
    force_next_tg: bool = False,
    auto_replenish: Optional[bool] = None,
    enable_sniper: bool = False,
    min_sniper_spacing_minutes: int = 120,
    force_sniper: bool = False,
    audit_analytics: bool = False,
    min_audit_spacing_minutes: int = 180,
    run_cmo_routine: bool = False,
    enable_cmo_routine: Optional[bool] = None,
) -> Dict[str, Any]:
    """Executes a single check-and-dispatch pass across all content channels."""
    now = queue.utcnow()
    now_iso = queue.iso(now)
    today_utc = now.date().isoformat()
    earliest_due = queue.iso(now - timedelta(hours=3))
    should_replenish = (not dry_run) if auto_replenish is None else auto_replenish
    state = load_state()
    state["ticks"] = state.get("ticks", 0) + 1
    state["last_tick_at"] = now_iso

    results: Dict[str, Any] = {
        "timestamp": now_iso,
        "dry_run": dry_run,
        "x_replenished": 0,
        "tg_replenished": 0,
        "x_dispatched": [],
        "tg_dispatched": [],
        "reveals_dispatched": [],
        "articles_staged": 0,
        "next_up_x": None,
        "next_up_tg": None,
        "sniper": None,
        "audit": None,
        "cmo_routine": None,
    }

    # 1. Stage any approved blog articles to website
    if not dry_run:
        try:
            staged = site_publisher.stage_approved()
            results["articles_staged"] = len(staged)
        except Exception as e:
            logger.warning(f"Blog staging error: {e}")

    # 2. Check X publication queue (and auto-replenish if empty)
    if should_replenish:
        try:
            results["x_replenished"] = ensure_x_queue_replenished(now, render_images=True)
        except Exception as e:
            logger.error(f"X queue auto-replenish error: {e}", exc_info=True)

    last_x = get_last_published_x_time()
    can_post_x = _published_today("x", today_utc) < len(queue.CONFIG["x"]["slots_utc"])
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
        if entry.get("kind") in ("x_post", "x_thread") and entry.get("status") == "approved" and (entry.get("qa") or {}).get("passed"):
            if entry.get("date") != today_utc:
                continue
            sched = entry.get("scheduled_at")
            if not sched or sched < earliest_due:
                continue
            if sched and sched > now_iso and not force_next:
                continue
            if entry.get("kind") == "x_post" and entry.get("creative"):
                if not _has_valid_image(entry):
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

    # 3. Check Telegram publication queue (and auto-replenish if empty)
    token, channel = telegram_publisher._credentials()
    if token and channel:
        if should_replenish:
            try:
                results["tg_replenished"] = ensure_tg_queue_replenished(now, render_images=True)
            except Exception as e:
                logger.error(f"Telegram queue auto-replenish error: {e}", exc_info=True)

        last_tg = get_last_published_tg_time()
        can_post_tg = _published_today("telegram", today_utc) < len(queue.CONFIG["telegram"]["slots_utc"])
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
            if entry.get("kind") == "telegram" and entry.get("status") == "approved" and (entry.get("qa") or {}).get("passed"):
                if entry.get("date") != today_utc:
                    continue
                sched = entry.get("scheduled_at")
                if not sched or sched < earliest_due:
                    continue
                if sched and sched > now_iso and not force_next_tg:
                    continue
                if entry.get("creative") and not _has_valid_image(entry):
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

    # 4. Reply Sniper: comment on viral high-reach target tweets to siphon audience reach
    if enable_sniper:
        try:
            sniper_res = reply_sniper.snipe_next_target(
                dry_run=dry_run,
                min_cooldown_minutes=min_sniper_spacing_minutes,
                force=force_sniper,
            )
            results["sniper"] = sniper_res
            if sniper_res.get("sniped"):
                state["last_snipe_at"] = now_iso
                if not dry_run:
                    logger.info(f"Reply Sniper dispatched under {sniper_res.get('target')}: {sniper_res.get('reply_comment')}")
        except Exception as e:
            logger.warning(f"Reply sniper error: {e}")

    # 5. Periodic CMO Analytics Audit: track live reach, impressions, and follower velocity
    last_audit_str = state.get("last_audit_at")
    can_audit = audit_analytics
    if not can_audit:
        if not last_audit_str:
            can_audit = True
        else:
            try:
                last_audit_dt = datetime.strptime(last_audit_str[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
                if (now - last_audit_dt).total_seconds() / 60.0 >= min_audit_spacing_minutes:
                    can_audit = True
            except Exception:
                can_audit = True

    if can_audit and not dry_run:
        try:
            logger.info("Executing periodic CMO performance audit...")
            audit_report = analytics.audit_performance()
            results["audit"] = {
                "timestamp": audit_report.get("timestamp"),
                "x_impressions": audit_report.get("x_reach", {}).get("total_impressions"),
                "tg_members": audit_report.get("telegram_reach", {}).get("members"),
            }
            state["last_audit_at"] = now_iso
        except Exception as e:
            logger.warning(f"Analytics audit error: {e}")

    # 6. Daily 6:00 AM CMO Morning Routine: Audit previous day, check logs, self-heal, scrape viral trends, plan 5 posts
    from agents.cmo_routine import CmoDailyRoutine
    local_now = datetime.now().astimezone()
    today_local = local_now.date().isoformat()
    last_cmo_date = state.get("last_cmo_routine_date")

    cmo_active = False if enable_cmo_routine is None else enable_cmo_routine
    should_run_cmo = run_cmo_routine or (cmo_active and local_now.hour >= 6 and last_cmo_date != today_local)
    if should_run_cmo:
        try:
            logger.info(f"Triggering CMO 6:00 AM Daily Morning Routine for {today_local}...")
            cmo_routine = CmoDailyRoutine(target_date=local_now.date())
            routine_res = cmo_routine.run_full_routine()
            state["last_cmo_routine_date"] = today_local
            results["cmo_routine"] = {
                "date": today_local,
                "status": "success",
                "health": routine_res.get("health", {}).get("health_status"),
                "planned_posts": len(routine_res.get("planned_posts", [])),
                "report_file": str(HERE / "reports" / f"cmo-daily-audit-{today_local}.md"),
            }
            logger.info(f"CMO 6:00 AM Routine completed successfully for {today_local}.")
        except Exception as e:
            logger.error(f"CMO Daily Routine error: {e}", exc_info=True)
            results["cmo_routine_error"] = str(e)

    # 7. Zero-bloat cleanup: continuously purge any published media and release memory
    try:
        clean_res = cleanup.purge_published_media(dry_run=dry_run)
        results["media_cleaned"] = clean_res.get("files_deleted", 0)
        if clean_res.get("files_deleted", 0) > 0 and not dry_run:
            logger.info(f"Purged {clean_res['files_deleted']} published media files ({clean_res['mb_freed']} MB freed).")
    except Exception as e:
        logger.warning(f"Media cleanup error: {e}")

    save_state(state)
    return results


def daemon_loop(
    interval_seconds: int = 60,
    min_spacing_minutes: int = 180,
    min_tg_spacing_minutes: int = 180,
    min_sniper_spacing_minutes: int = 120,
    min_audit_spacing_minutes: int = 180,
    enable_sniper: bool = False,
    enable_cmo_routine: Optional[bool] = None,
    dry_run: bool = True,
) -> None:
    """Runs continuous background polling loop."""
    logger.info(
        f"Starting Autopilot Daemon (interval={interval_seconds}s, "
        f"min_x_spacing={min_spacing_minutes}m, min_tg_spacing={min_tg_spacing_minutes}m, "
        f"min_sniper_spacing={min_sniper_spacing_minutes}m, dry_run={dry_run})"
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
                enable_sniper=enable_sniper,
                min_sniper_spacing_minutes=min_sniper_spacing_minutes,
                min_audit_spacing_minutes=min_audit_spacing_minutes,
                enable_cmo_routine=enable_cmo_routine,
            )
            dispatched_count = len(res.get("x_dispatched", [])) + len(res.get("tg_dispatched", []))
            if dispatched_count > 0:
                logger.info(f"Tick completed: {dispatched_count} posts dispatched.")
            if res.get("sniper") and res["sniper"].get("sniped"):
                logger.info(f"Tick completed: Sniper replied to {res['sniper'].get('target_handle')}.")
            if res.get("cmo_routine"):
                logger.info(f"Tick completed: CMO routine generated {res['cmo_routine'].get('planned_posts')} posts.")
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
    parser.add_argument("--min-spacing", type=int, default=180, help="Min minutes between X posts (default: 180)")
    parser.add_argument("--min-tg-spacing", type=int, default=180, help="Min minutes between Telegram posts (default: 180)")
    parser.add_argument("--min-sniper-spacing", type=int, default=120, help="Min minutes between reply snipes (default: 120)")
    parser.add_argument("--min-audit-spacing", type=int, default=180, help="Min minutes between analytics audits (default: 180)")
    parser.add_argument("--force-next", action="store_true", help="Bypass spacing cooldown to dispatch next due X item")
    parser.add_argument("--force-next-tg", action="store_true", help="Bypass spacing cooldown to dispatch next due Telegram item")
    parser.add_argument("--snipe-now", action="store_true", help="Force an immediate Reply Sniper check and dispatch")
    parser.add_argument("--sniper", action="store_true", help="Explicitly enable replies to third-party X posts")
    parser.add_argument("--audit", action="store_true", help="Run an immediate CMO analytics audit")
    parser.add_argument("--cmo-routine", action="store_true", help="Execute the CMO 6:00 AM morning routine")
    parser.add_argument("--live", dest="dry_run", action="store_false", default=True, help="Live mode (post to real APIs)")

    args = parser.parse_args()

    if args.daemon:
        daemon_loop(
            interval_seconds=args.interval_seconds,
            min_spacing_minutes=args.min_spacing,
            min_tg_spacing_minutes=args.min_tg_spacing,
            min_sniper_spacing_minutes=args.min_sniper_spacing,
            min_audit_spacing_minutes=args.min_audit_spacing,
            enable_sniper=args.sniper,
            dry_run=args.dry_run,
        )
    else:
        res = run_tick(
            dry_run=args.dry_run,
            min_spacing_minutes=args.min_spacing,
            min_tg_spacing_minutes=args.min_tg_spacing,
            min_sniper_spacing_minutes=args.min_sniper_spacing,
            min_audit_spacing_minutes=args.min_audit_spacing,
            force_next=args.force_next,
            force_next_tg=args.force_next_tg,
            enable_sniper=args.sniper,
            force_sniper=args.snipe_now,
            audit_analytics=args.audit,
            run_cmo_routine=args.cmo_routine,
        )
        print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()


