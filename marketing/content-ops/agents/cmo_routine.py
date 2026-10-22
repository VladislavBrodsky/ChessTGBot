"""CMO Daily 6:00 AM Executive Routine: Audit, Intelligence Scout, Bug Self-Healing & Viral Planning.

Executes the automated 6:00 AM morning protocol:
1. Performance Audit of the previous day across Telegram & X (impressions, CTR, bookmarks, member count).
2. Log & Health Audit: Detects bugs, bottlenecks, 400/403/429 errors, and executes self-healing fixes.
3. Viral Data & News Scraping: Scrapes trending chess moments, Grandmaster controversies, and meta tactics.
4. Competitor Intelligence Check: Monitors Telegram competitors (Chess.com RU, Levitov, TON chess bots).
5. 5-Post Viral Plan: Plans, QA-verifies, renders, and stages 5 viral posts following the CMO Content Strategy.
6. Executive Report Generation: Produces a structured C-level Markdown report in marketing/content-ops/reports/.
"""
from __future__ import annotations

import json
import logging
import os
import re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from pipeline import analytics, brand, cleanup, queue, renderer, telegram_publisher, x_publisher
from .audit import AuditAgent
from .chess_editor import ChessEditorAgent
from .cmo import CmoAgent, StrategicDirective
from .orchestrator import ContentEngineOrchestrator
from .qa_compliance import QaComplianceAgent
from .scraper import ScraperAgent
from .smm_copywriter import SmmCopywriterAgent

logger = logging.getLogger("cmo_routine")

HERE = Path(__file__).resolve().parent.parent
REPORTS_DIR = HERE / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
STATE_DIR = HERE / "state"
STATE_DIR.mkdir(parents=True, exist_ok=True)
ROUTINE_STATE_FILE = STATE_DIR / "cmo_routine_state.json"
AUTOPILOT_LOG = STATE_DIR / "autopilot.log"


class CmoDailyRoutine:
    """Governs the 6:00 AM daily executive audit, intelligence scout, and 5-post content planning."""

    def __init__(self, target_date: Optional[date] = None, primary_domain: str = "web3chess.online"):
        self.target_date = target_date or queue.utcnow().date()
        self.yesterday = self.target_date - timedelta(days=1)
        self.primary_domain = primary_domain

        self.cmo = CmoAgent(StrategicDirective(primary_domain=self.primary_domain))
        self.scraper = ScraperAgent()
        self.audit = AuditAgent()
        self.copywriter = SmmCopywriterAgent(primary_domain=self.primary_domain)
        self.chess_editor = ChessEditorAgent()
        self.qa = QaComplianceAgent()
        self.orchestrator = ContentEngineOrchestrator(plan_date=self.target_date, primary_domain=self.primary_domain)

    # =========================================================================
    # 1. PREVIOUS DAY PERFORMANCE AUDIT
    # =========================================================================
    def audit_previous_day_performance(self) -> Dict[str, Any]:
        """Audits all content published yesterday and fetches real-time audience metrics."""
        y_str = self.yesterday.isoformat()
        yesterday_entries = queue.all_entries(day=y_str)

        tg_published = [e for e in yesterday_entries if e.get("kind") == "telegram" and e.get("status") == "published"]
        x_published = [e for e in yesterday_entries if e.get("kind") in ("x_post", "x_thread") and e.get("status") == "published"]
        failed_entries = [e for e in yesterday_entries if e.get("status") in ("failed", "rejected")]

        # Live Platform Metrics
        live_x = analytics.fetch_x_metrics(limit=25)
        live_tg = analytics.fetch_telegram_metrics()

        x_account = live_x.get("account", {})
        recent_tweets = live_x.get("recent_tweets", [])
        total_impressions = sum(t.get("public_metrics", {}).get("impression_count", 0) for t in recent_tweets)
        total_bookmarks = sum(t.get("public_metrics", {}).get("bookmark_count", 0) for t in recent_tweets)
        total_likes = sum(t.get("public_metrics", {}).get("like_count", 0) for t in recent_tweets)
        total_replies = sum(t.get("public_metrics", {}).get("reply_count", 0) for t in recent_tweets)

        x_available = bool(live_x.get("available"))
        bookmark_rate = round((total_bookmarks / max(total_impressions, 1)) * 100, 2) if x_available else None
        engagement_rate = round(((total_likes + total_replies + total_bookmarks) / max(total_impressions, 1)) * 100, 2) if x_available else None

        kpis = self.cmo.directive.target_kpis

        return {
            "audit_date": self.target_date.isoformat(),
            "analyzed_date": y_str,
            "telegram_published_count": len(tg_published),
            "x_published_count": len(x_published),
            "failed_count": len(failed_entries),
            "telegram_subscribers": live_tg.get("members"),
            "x_followers": x_account.get("followers") if x_available else None,
            "x_total_impressions": total_impressions if x_available else None,
            "x_bookmark_rate": f"{bookmark_rate}%" if x_available else None,
            "x_engagement_rate": f"{engagement_rate}%" if x_available else None,
            "metrics_availability": {"x": x_available, "telegram": bool(live_tg.get("available"))},
            "kpi_benchmarks": {
                "telegram_ctr_target": kpis.get("telegram_ctr"),
                "x_bookmark_rate_target": kpis.get("x_bookmark_rate"),
                "wager_compliance": "not independently audited",
            },
            "top_posts": [
                {"id": p["id"], "kind": p["kind"], "hook": p.get("hook", "")[:60]}
                for p in (tg_published[:3] + x_published[:3])
            ],
        }

    # =========================================================================
    # 2. LOG & HEALTH AUDIT (BUG DETECTION & SELF-HEALING)
    # =========================================================================
    def audit_logs_and_self_heal(self) -> Dict[str, Any]:
        """Scans logs for recent operational bottlenecks and applies automatic remedies."""
        issues_detected = []
        fixes_applied = []

        # Read last 300 lines of autopilot log
        if AUTOPILOT_LOG.exists():
            try:
                lines = AUTOPILOT_LOG.read_text().splitlines()[-300:]
                for line in lines:
                    if "KeyError" in line:
                        issues_detected.append(f"KeyError in logs: {line[-120:]}")
                    elif "Telegram sendPhoto failed: 400" in line:
                        issues_detected.append("Telegram 400 Bad Request encountered")
                    elif "media/upload.json on upload.twitter.com not allowed by policy" in line:
                        issues_detected.append("X media upload blocked by sandbox policy (bypass required)")
                    elif "X API error: status=403" in line and "You can only reply to or quote posts" in line:
                        issues_detected.append("X Free Tier reply limitation: direct unmentioned replies restricted")
            except Exception as e:
                issues_detected.append(f"Error reading log: {e}")

        # Deduplicate issues
        issues_detected = list(dict.fromkeys(issues_detected))

        # Self-Healing 1: Verify all approved posts for today/tomorrow have valid scheduled_at and images
        for check_day in [self.target_date, self.target_date + timedelta(days=1)]:
            d_str = check_day.isoformat()
            for entry in queue.all_entries(day=d_str):
                if entry.get("status") == "approved":
                    # Fix missing scheduled_at
                    if not entry.get("scheduled_at"):
                        slot = entry.get("slot", 1)
                        hh = f"{(slot - 1) * 3:02d}:00"
                        entry["scheduled_at"] = f"{d_str}T{hh}:00Z"
                        queue.save(entry)
                        fixes_applied.append(f"Injected missing scheduled_at for {entry['id']}")

                    # Fix missing rendered creative image
                    if entry.get("creative") and not entry.get("image"):
                        cand = queue.QUEUE / d_str / f"{entry['id']}.png"
                        if not cand.exists():
                            try:
                                renderer.render(entry)
                                queue.save(entry)
                                fixes_applied.append(f"Auto-rendered missing creative PNG for {entry['id']}")
                            except Exception as re_err:
                                issues_detected.append(f"Failed rendering creative for {entry['id']}: {re_err}")

        # Self-Healing 2: Purge published media to keep disk zero-bloat
        try:
            purge_res = cleanup.purge_published_media(dry_run=False)
            if purge_res.get("files_deleted", 0) > 0:
                fixes_applied.append(f"Purged {purge_res['files_deleted']} published media files ({purge_res['mb_freed']} MB freed)")
        except Exception as e:
            issues_detected.append(f"Media cleanup error: {e}")

        # Service Health Check
        launchd_healthy = False
        try:
            import subprocess
            out = subprocess.run(["launchctl", "list"], capture_output=True, text=True, timeout=5)
            if "com.web3chess.autopilot" in out.stdout:
                launchd_healthy = True
        except Exception:
            pass

        return {
            "health_status": "healthy" if len(issues_detected) <= 2 else "attention_required",
            "launchd_service_active": launchd_healthy,
            "issues_detected": issues_detected[:6],
            "fixes_applied": fixes_applied,
        }

    # =========================================================================
    # 3. SCRAPE UP-TO-DATE VIRAL NEWS, TRENDS & COMPETITORS
    # =========================================================================
    def scrape_viral_intel_and_competitors(self) -> Dict[str, Any]:
        """Gathers fresh signals from public feeds, competitor previews, and YouTube trends."""
        curated_signals = self.scraper.get_curated_trend_signals()
        competitor_posts = self.scraper.inspect_telegram_competitors(["chesscom_ru", "edchessss", "catizenann"])

        # Top competitor highlights
        competitor_insights = []
        for cp in competitor_posts[:5]:
            ch = cp.get("channel", "")
            views = cp.get("views", 0)
            txt = cp.get("text", "")[:120].replace("\n", " ")
            competitor_insights.append({
                "channel": f"@{ch}",
                "views": views,
                "angle": txt,
                "takeaway": "Focus on short-form puzzles with emoji response buttons",
            })

        if not competitor_insights:
            competitor_insights = [{
                "channel": "Unavailable",
                "views": None,
                "status": "unavailable",
                "angle": "No accessible competitor sample was collected",
                "takeaway": "Do not infer views, engagement, or performance without source data",
            }]

        # Trending Topics curated for Q4 2026
        trending_topics = [
            {
                "topic": "Flag Scramble under five seconds",
                "viral_angle": "How forcing moves and simple positions help when the clock is low.",
                "pillar": "Chess Culture",
                "target_format": "scramble_instinct",
            },
            {
                "topic": "Stafford Gambit refutation breakdown",
                "viral_angle": "Show one legal line and the defensive idea behind it.",
                "pillar": "Openings",
                "target_format": "trap",
            },
            {
                "topic": "Smothered Mate & Philidor's Legacy Queen Sacrifices",
                "viral_angle": "Sacrificing the queen to force the enemy rook into the king's escape box.",
                "pillar": "Tactics",
                "target_format": "puzzle",
            },
            {
                "topic": "Arena match setup: how to read a USDT match",
                "viral_angle": "Show the stake, displayed payout, and time control before matching.",
                "pillar": "Product",
                "target_format": "fomo_arena",
            },
            {
                "topic": "Product Flow Manifesto: from match setup to the Telegram board",
                "viral_angle": "Explain the choices a player sees before matching.",
                "pillar": "Product",
                "target_format": "contrarian_manifesto",
            },
        ]

        return {
            "curated_signals_count": len(curated_signals),
            "competitor_insights": competitor_insights,
            "top_trending_topics": trending_topics,
        }

    # =========================================================================
    # 4. PLAN 5 VIRAL POSTS FOLLOWING CONTENT STRATEGY
    # =========================================================================
    def plan_five_viral_posts(self) -> List[Dict[str, Any]]:
        """Plans, drafts, QA-gates, renders, and stages 5 viral posts for today's cycle."""
        d_str = self.target_date.isoformat()
        date_badge = self.target_date.strftime("%b %d")
        planned_results: List[Dict[str, Any]] = []

        # Define 5 high-converting slots
        # Slot 1: Tactics Drill with 6h spoiler reveal (07:30 UTC)
        # Slot 2: Viral Opening Trap (10:30 UTC)
        # Slot 3: Scramble Instinct / Culture (13:30 UTC)
        # Slot 4: evergreen Match Rules explainer (17:30 UTC)
        # Slot 5: 1-Tap Friend Challenge / Manifesto (20:30 UTC)

        post_specs = [
            # 1. Tactics
            {
                "slot_id": f"{d_str}-tg-viral-1",
                "type": "tactics",
                "time_utc": "07:30",
                "fen": "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
                "solution": ["Ra8#"],
                "claim": "mate_in_1",
                "tactic_name": "Back Rank Corridor",
                "hook": f"White to move. Black's king is boxed in ({date_badge})",
                "body": (
                    "Black's king on g8 has three pawns acting as walls.\n"
                    "One rook move delivers instant checkmate.\n\n"
                    "❤ Ra8#   🔥 Rd1   👏 f4\n"
                    "Answer reveals in 6 hours."
                ),
            },
            # 2. Opening Trap
            {
                "slot_id": f"{d_str}-tg-viral-2",
                "type": "trap",
                "time_utc": "10:30",
                "trap_name": "Blackburne-Shilling Gambit",
                "hook": f"White grabbed the free pawn on e5. Seven moves later, checkmate ({date_badge})",
                "body": (
                    "Greedy play in the opening gets punished fast in speed chess.\n"
                    "When Black plays 3...Nd4, White thinks: 'A free pawn with an f7 attack!'\n"
                    "Then came 4.Nxe5? Qg5! and White's king never survived past move 7.\n\n"
                    "The refutation: 4.Nxd4! exd4 5.O-O, leaving White with superior development and complete center control."
                ),
                "fen": "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
                "solution": ["Bxf7+"],
            },
            # 3. Scramble Instinct
            {
                "slot_id": f"{d_str}-tg-viral-3",
                "type": "scramble",
                "time_utc": "13:30",
                "hook": f"You premoved a recapture. Your opponent found an in-between check ({date_badge})",
                "body": (
                    "The German masters named it a century ago: Zwischenzug (the in-between move).\n\n"
                    "In blitz, automatic recaptures fail when a forcing check changes the move order.\n"
                    "Before snatching a piece back, ask:\n"
                    "Does my opponent have a forcing check first?"
                ),
            },
            # 4. Match setup explainer
            {
                "slot_id": f"{d_str}-tg-viral-4",
                "type": "arena",
                "time_utc": "17:30",
                "hook": f"Before a USDT match, check these three numbers ({date_badge})",
                "body": (
                    "Choose the stake, confirm the displayed payout, and check the time control before matching.\n\n"
                    "USDT matches: adults (18+) only. You can lose your stake."
                ),
            },
            # 5. Anti-Brainrot Duel
            {
                "slot_id": f"{d_str}-tg-viral-5",
                "type": "duel",
                "time_utc": "20:30",
                "hook": f"Challenge a Friend: Settle your chess debates in 3-minute blitz ({date_badge})",
                "body": (
                    "Share Web3Chess in a Telegram group or DM.\n\n"
                    "Both players can open the Mini App, choose the same time control, and decide how to play."
                ),
            },
        ]

        for idx, s in enumerate(post_specs, start=1):
            slot_id = s["slot_id"]
            if s["type"] == "tactics":
                post = self.copywriter.draft_interactive_academy_drill(
                    slot_id=slot_id,
                    fen=s["fen"],
                    solution=s["solution"],
                    tactic_name=s["tactic_name"],
                    claim=s["claim"],
                    hook=s["hook"],
                    body=s["body"],
                )
            elif s["type"] == "trap":
                post = self.copywriter.draft_opening_trap_telegram_post(
                    slot_id=slot_id,
                    trap_name=s["trap_name"],
                    hook=s["hook"],
                    body=s["body"],
                    fen=s["fen"],
                    solution=s["solution"],
                )
            elif s["type"] == "arena":
                post = self.copywriter.draft_fomo_arena_alert(
                    slot_id=slot_id,
                    tournament_name="Competitive match setup",
                    start_time_utc="18:00 UTC",
                    minutes_remaining=15,
                    wager_entry=5,
                )
                post["hook"] = s["hook"]
            elif s["type"] in ("scramble", "culture"):
                post = self.copywriter.draft_blitz_culture_telegram_post(
                    slot_id=slot_id,
                    hook=s["hook"],
                    body=s["body"],
                )
            elif s["type"] == "duel":
                post = self.copywriter.draft_viral_friend_duel(slot_id=slot_id)
                post["hook"] = s["hook"]
                if s.get("body"):
                    post["text"] = f"<b>{s['hook']}</b>\n\n{s['body'].strip()}"
            else:
                post = self.copywriter.draft_viral_telegram_post(
                    slot_id=slot_id,
                    category="Chess Culture",
                    hook=s["hook"],
                    body=s["body"],
                    cta="play",
                )

            post["slot"] = idx
            post["scheduled_at"] = f"{d_str}T{s['time_utc']}:00Z"

            # QA gates
            qa_res = self.qa.inspect_telegram_post(post)
            if not qa_res["passed"]:
                logger.warning(f"QA issues in {slot_id}: {qa_res['issues']}")
            post["qa"] = {**qa_res, "checked_at": queue.iso(queue.utcnow())}
            post["status"] = "draft"

            # Render creative visual
            try:
                renderer.render(post)
            except Exception as e:
                logger.warning(f"Rendering note for {slot_id}: {e}")
            if qa_res["passed"] and (post.get("render") or {}).get("ok") and queue.CONFIG["mode"]["telegram"] == "auto":
                post["status"] = "approved"

            queue.save(post)
            planned_results.append(post)

        return planned_results

    # =========================================================================
    # 5. GENERATE EXECUTIVE MARKDOWN BRIEFING
    # =========================================================================
    def generate_executive_report(
        self,
        audit_res: Dict[str, Any],
        health_res: Dict[str, Any],
        viral_intel: Dict[str, Any],
        planned_posts: List[Dict[str, Any]],
    ) -> str:
        """Constructs a comprehensive C-level markdown report."""
        d_str = self.target_date.isoformat()
        y_str = self.yesterday.isoformat()

        lines = [
            f"# Web3Chess CMO Daily Executive Intelligence Briefing",
            f"**Audit Timestamp:** `{d_str} 06:00 AM UTC` | **Cycle:** `{self.cmo.directive.quarter}`",
            f"**Strategic Mission:** *{self.cmo.directive.positioning}*\n",
            "---",
            "## 1. Previous Day Performance Audit (" + y_str + ")",
            "",
            "| Metric | Result | Target Benchmark | Status |",
            "|---|---|---|---|",
            f"| **Telegram Broadcasts** | `{audit_res['telegram_published_count']} published` | {len(queue.CONFIG['telegram']['slots_utc'])} daily slots | Active |",
            f"| **X (Twitter) Dispatches** | `{audit_res['x_published_count']} published` | {len(queue.CONFIG['x']['slots_utc'])} daily slots | Active |",
            f"| **Telegram Channel Members** | `{audit_res['telegram_subscribers'] if audit_res['telegram_subscribers'] is not None else 'unavailable'}` | Complete-window baseline | {'Measured' if audit_res['metrics_availability']['telegram'] else 'Unavailable'} |",
            f"| **X Impressions Tracked** | `{audit_res['x_total_impressions'] if audit_res['x_total_impressions'] is not None else 'unavailable'}` | Complete-window baseline | {'Measured' if audit_res['metrics_availability']['x'] else 'Unavailable'} |",
            f"| **X Bookmark Rate** | `{audit_res['x_bookmark_rate'] if audit_res['x_bookmark_rate'] is not None else 'unavailable'}` | `{audit_res['kpi_benchmarks']['x_bookmark_rate_target']}` | {'Measured' if audit_res['metrics_availability']['x'] else 'Unavailable'} |",
            f"| **Wager Disclosures** | `{audit_res['kpi_benchmarks']['wager_compliance']}` | Full review | Verify |",
            "",
            "### Top Content Dispatched Yesterday",
        ]
        for tp in audit_res.get("top_posts", []):
            lines.append(f"- **[{tp['kind'].upper()}]** `{tp['id']}` — \"{tp['hook']}\"")

        lines.extend([
            "",
            "---",
            "## 2. System Log Audit & Self-Healing Actions",
            f"**Operational Health Status:** `{health_res['health_status'].upper()}` | **LaunchAgent Supervisor:** `{'ACTIVE (24/7)' if health_res['launchd_service_active'] else 'MANUAL RUNNER'}`",
            "",
            "### Issues Detected & Resolved",
        ])
        if health_res.get("issues_detected"):
            for iss in health_res["issues_detected"]:
                lines.append(f"- ⚠️ **Flagged:** {iss}")
        else:
            lines.append("- No matching issues found in the available local log sample; full production health was not verified.")

        lines.append("\n### Self-Healing Remedies Applied")
        if health_res.get("fixes_applied"):
            for fix in health_res["fixes_applied"]:
                lines.append(f"- 🛠️ **Fixed:** {fix}")
        else:
            lines.append("- No automatic remedies were applied in this run.")

        lines.extend([
            "",
            "---",
            "## 3. Scraped Viral Trends & Competitor Intelligence",
            "",
            "### Evergreen angle hypotheses and observed source leads",
        ])
        for top in viral_intel.get("top_trending_topics", []):
            lines.append(f"- **{top['topic']}** (`{top['pillar']}`): {top['viral_angle']}")

        lines.append("\n### Competitor Intelligence Check")
        for comp in viral_intel.get("competitor_insights", []):
            observation = f"{comp['views']} views" if comp.get("views") is not None else "metrics unavailable"
            lines.append(f"- **{comp.get('channel', 'Unavailable')}** (`{observation}`): *\"{comp['angle']}\"* → Key Takeaway: {comp['takeaway']}")

        lines.extend([
            "",
            "---",
            "## 4. Planned 5 Viral Posts (Today's Executive Slate)",
            "",
            "| Slot | Scheduled (UTC) | Category | Hook | Status |",
            "|---|---|---|---|---|",
        ])
        for p in planned_posts:
            lines.append(f"| `{p['id']}` | `{p['scheduled_at'][11:16]} UTC` | **{p['category']}** | *\"{p['hook'][:65]}\"* | `{p['status']}` |")

        lines.extend([
            "",
            "---",
            "## 5. Strategic Directives for Today's Execution",
            "1. **Never End Hooks With a Period:** Dwell time and click curiosity thrive on open hooks or questions.",
            "2. **X Link Placement:** Keep root tweets focused on native media/text; place the approved destination in Reply #1 and measure the result.",
            "3. **Telegram Interactive CTAs:** Every puzzle must feature reaction voting buttons and deep-link to the Mini App (`startapp=academy` or `startapp=play`).",
            "4. **Strict 18+ Compliance:** Every wagering and Arena prize post must maintain the adult disclaimer.",
        ])

        report_content = "\n".join(lines)
        report_file = REPORTS_DIR / f"cmo-daily-audit-{d_str}.md"
        report_file.write_text(report_content)
        logger.info(f"CMO Executive Report saved to {report_file}")
        return report_content

    # =========================================================================
    # 6. ORCHESTRATE FULL ROUTINE
    # =========================================================================
    def run_full_routine(self, force: bool = False) -> Dict[str, Any]:
        """Runs the complete 6:00 AM protocol, generates the brief, and records routine state."""
        logger.info(f"Initiating CMO Daily Morning Routine for {self.target_date.isoformat()}...")

        # Step 1: Performance Audit
        perf_audit = self.audit_previous_day_performance()

        # Step 2: Log & Health Audit
        health_audit = self.audit_logs_and_self_heal()

        # Step 3: Viral & Competitor Intelligence
        viral_intel = self.scrape_viral_intel_and_competitors()

        # Step 4: Plan 5 Viral Posts
        planned_posts = self.plan_five_viral_posts()

        # Step 5: Generate Report
        report_text = self.generate_executive_report(
            audit_res=perf_audit,
            health_res=health_audit,
            viral_intel=viral_intel,
            planned_posts=planned_posts,
        )

        state_record = {
            "routine_date": self.target_date.isoformat(),
            "executed_at": queue.iso(queue.utcnow()),
            "yesterday": self.yesterday.isoformat(),
            "health_status": health_audit.get("health_status"),
            "planned_posts_count": len(planned_posts),
            "report_file": str(REPORTS_DIR / f"cmo-daily-audit-{self.target_date.isoformat()}.md"),
        }
        ROUTINE_STATE_FILE.write_text(json.dumps(state_record, indent=2) + "\n")

        return {
            "status": "success",
            "date": self.target_date.isoformat(),
            "performance": perf_audit,
            "health": health_audit,
            "intel": viral_intel,
            "planned_posts": planned_posts,
            "report": report_text,
        }
