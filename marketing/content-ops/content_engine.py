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
    parser.add_argument("--dry-run", action="store_true", default=True, help="Run Telegram publishing in dry-run mode (default: True)")
    parser.add_argument("--domain", default="web3chess.online", help="Target landing page domain (default: web3chess.online)")

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

    elif args.publish:
        print(f"\n📡 Dispatching Telegram broadcasts (dry_run={args.dry_run})...")
        dispatch = orchestrator.publisher.dispatch_telegram_broadcast(dry_run=args.dry_run)
        print(json.dumps(dispatch, indent=2))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
