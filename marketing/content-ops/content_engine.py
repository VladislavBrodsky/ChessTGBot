#!/usr/bin/env python3
"""Unified Multi-Agent Content & Marketing Engine CLI for Web3Chess (web3chess.online).

Usage:
  python3 marketing/content-ops/content_engine.py --status
  python3 marketing/content-ops/content_engine.py --run-strategy
  python3 marketing/content-ops/content_engine.py --first-post
  python3 marketing/content-ops/content_engine.py --plan [--days N]
  python3 marketing/content-ops/content_engine.py --stage
  python3 marketing/content-ops/content_engine.py --publish [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime
from pathlib import Path

# Add marketing/content-ops to python path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from agents import (
    CmoAgent,
    ScraperAgent,
    AuditAgent,
    PlannerAgent,
    ChessEditorAgent,
    SmmCopywriterAgent,
    QaComplianceAgent,
    PublisherAgent,
    ContentEngineOrchestrator,
)
from pipeline import queue


def main():
    parser = argparse.ArgumentParser(
        description="Unified Multi-Agent Marketing & Content Engine for Web3Chess (web3chess.online)"
    )
    parser.add_argument("--status", action="store_true", help="Display status of today's queued content slots")
    parser.add_argument("--run-strategy", action="store_true", help="Run CMO strategy brief and competitive research audit")
    parser.add_argument("--first-post", action="store_true", help="Create, validate and stage the first viral flagship post & article")
    parser.add_argument("--generate-today", action="store_true", help="Generate, QA-validate, approve and stage all 5 Telegram posts and 5 Blog articles for today")
    parser.add_argument("--plan", action="store_true", help="Generate daily slots for the calendar")
    parser.add_argument("--days", type=int, default=1, help="Number of days to plan (default: 1)")
    parser.add_argument("--stage", action="store_true", help="Stage all approved articles into website/src/content/articles/")
    parser.add_argument("--publish", action="store_true", help="Publish due Telegram broadcasts")
    parser.add_argument("--live", dest="dry_run", action="store_false", default=True, help="Execute live publication to Telegram (requires bot token)")
    parser.add_argument("--post-id", default=None, help="Specific post ID to publish (e.g. 2026-10-12-tg-1)")
    parser.add_argument("--date", default=None, help="Filter date (e.g. 2026-10-12)")
    parser.add_argument("--domain", default="web3chess.online", help="Target landing page domain (default: web3chess.online)")
    parser.add_argument("--tg-batch", action="store_true", help="Generate, QA-validate, render, and queue today's 8 viral Telegram posts")
    parser.add_argument("--x-batch", action="store_true", help="Generate, QA-validate, and queue today's daily X (Twitter) posts")
    parser.add_argument("--x-thread", action="store_true", help="Generate, QA-validate, and queue the flagship 5-tweet viral X manifesto thread")
    parser.add_argument("--x-sniper", action="store_true", help="Generate targeted high-leverage Reply Sniper scripts for top chess & TON accounts")
    parser.add_argument("--x-status", action="store_true", help="Display status of queued X (Twitter) posts and threads")
    parser.add_argument("--x-publish", action="store_true", help="Dispatch or dry-run export approved X (Twitter) posts and threads")
    parser.add_argument("--spotlight", action="store_true", help="Generate and queue high-FOMO Player Spotlight campaign across Telegram and X")
    parser.add_argument("--player", default="@grandmaestro", help="Player handle for spotlight (default: @grandmaestro)")
    parser.add_argument("--streak", type=int, default=9, help="Win streak count for spotlight (default: 9)")

    args = parser.parse_args()
    orchestrator = ContentEngineOrchestrator(primary_domain=args.domain)

    if args.status:
        entries = queue.all_entries(day=queue.utcnow().date().isoformat())
        print(f"\n=== Content Queue Status ({queue.utcnow().date().isoformat()}) ===")
        print(f"{'ID':<24} {'Time':<8} {'Kind':<10} {'Category':<14} {'Status':<12} {'Issues'}")
        print("-" * 75)
        for e in entries:
            issues_count = len((e.get("qa") or {}).get("issues", []))
            sched = e.get("scheduled_at", "")[11:16] + "Z"
            print(f"{e['id']:<24} {sched:<8} {e.get('kind', ''):<10} {e.get('category', ''):<14} {e.get('status', ''):<12} {issues_count}")
        print()

    elif args.x_status:
        entries = [
            e for e in queue.all_entries(day=queue.utcnow().date().isoformat())
            if e.get("kind") in ("x_post", "x_thread")
        ]
        print(f"\n=== X (Twitter) Queue Status ({queue.utcnow().date().isoformat()}) ===")
        print(f"{'ID':<28} {'Kind':<10} {'Category':<14} {'Status':<10} {'Hook/Topic'}")
        print("-" * 80)
        for e in entries:
            kind = e.get("kind", "")
            cat = e.get("category", "")
            status = e.get("status", "")
            hook = e.get("hook", "") or e.get("topic", "")
            if len(hook) > 40:
                hook = hook[:37] + "..."
            print(f"{e['id']:<28} {kind:<10} {cat:<14} {status:<10} {hook}")
        print()

    elif args.tg_batch:
        target_day = (
            datetime.strptime(args.date, "%Y-%m-%d").date()
            if args.date
            else queue.utcnow().date()
        )
        print(f"\n🚀 Generating Telegram Daily Batch (8 slots spaced every 3 hours for {target_day})...")
        res = orchestrator.generate_telegram_daily_batch(target_date=target_day)
        print("\n✅ Successfully generated, QA-approved, and queued Telegram posts:")
        print(json.dumps(res, indent=2, ensure_ascii=False))

    elif args.x_batch:
        print("\n🚀 Generating X (Twitter) Daily Batch (3 slots: Tactics, Culture, Arena)...")
        res = orchestrator.generate_x_daily_batch()
        print("\n✅ Successfully generated and queued X posts:")
        print(json.dumps(res, indent=2, ensure_ascii=False))

    elif args.x_thread:
        print("\n🧵 Generating Flagship 5-Tweet Viral Manifesto Thread for X...")
        res = orchestrator.create_flagship_x_thread()
        print("\n✅ Successfully generated, QA-validated, and queued X Thread:")
        print(json.dumps(res, indent=2, ensure_ascii=False))

    elif args.x_sniper:
        print("\n🎯 Generating High-Leverage Reply Sniper Kit for Top Accounts...")
        res = orchestrator.generate_x_reply_sniper_kit()
        print(json.dumps(res, indent=2, ensure_ascii=False))

    elif args.spotlight:
        print(f"\n🏆 Generating Player Spotlight Campaign for {args.player} (Streak: {args.streak})...")
        res = orchestrator.generate_player_spotlight_batch(
            player_name=args.player,
            streak_count=args.streak,
        )
        print("\n✅ Successfully generated, QA-validated, rendered, and queued Player Spotlight:")
        print(json.dumps(res, indent=2, ensure_ascii=False))

    elif args.run_strategy:
        result = orchestrator.run_strategy_and_audit()
        print("\n=== CMO Strategic Directives & Trend Audit ===")
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.first_post:
        print("\n🚀 Executing Multi-Agent Flagship Post & Article Generation Flow...")
        result = orchestrator.create_first_flagship_post()
        print("\n✅ Successfully created and staged flagship content:")
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.generate_today:
        print("\n🚀 Generating Full Daily Batch: 5 Viral Telegram Posts & 5 SEO Blog Articles...")
        result = orchestrator.generate_full_daily_batch()
        print("\n✅ Completed Full Daily Batch:")
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.plan:
        print(f"\n📅 Planning {args.days} day(s) across Telegram and Blog on {args.domain}...")
        orchestrator.plan_day()
        print("Plan complete. Slots initialized.")

    elif args.stage:
        print("\n📰 Staging approved articles to website/src/content/articles/...")
        reports = orchestrator.publisher.stage_all_approved_articles()
        print(json.dumps(reports, indent=2))

    elif args.x_publish:
        target_day = args.date or queue.utcnow().date().isoformat()
        mode_str = "LIVE" if not args.dry_run else "DRY-RUN (READY TO POST)"
        print(f"\n📡 Exporting/Dispatching X content ({mode_str}, date={target_day}, post_id={args.post_id})...")
        dispatch = orchestrator.publisher.dispatch_x_posts(
            day=target_day, post_id=args.post_id, dry_run=args.dry_run
        )
        print(json.dumps(dispatch, indent=2, ensure_ascii=False))

    elif args.publish:
        target_day = args.date or queue.utcnow().date().isoformat()
        mode_str = "LIVE" if not args.dry_run else "DRY-RUN"
        print(f"\n📡 Dispatching Telegram broadcasts ({mode_str}, date={target_day}, post_id={args.post_id})...")
        dispatch = orchestrator.publisher.dispatch_telegram_broadcast(
            dry_run=args.dry_run, day=target_day, post_id=args.post_id
        )
        print(json.dumps(dispatch, indent=2))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
