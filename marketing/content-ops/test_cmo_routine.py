"""Unit tests for the CMO Daily 6:00 AM Routine & Autonomous Audit Engine."""
from __future__ import annotations

import json
import shutil
import sys
import unittest
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from agents.cmo_routine import CmoDailyRoutine
from pipeline import queue


class TestCmoRoutine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_date = date(2099, 1, 2)
        cls.test_dir = queue.QUEUE / "2099-01-02"
        cls.test_yesterday_dir = queue.QUEUE / "2099-01-01"

    @classmethod
    def tearDownClass(cls):
        if cls.test_dir.exists():
            shutil.rmtree(cls.test_dir, ignore_errors=True)
        if cls.test_yesterday_dir.exists():
            shutil.rmtree(cls.test_yesterday_dir, ignore_errors=True)

    def setUp(self):
        self.routine = CmoDailyRoutine(
            target_date=self.test_date,
            primary_domain="web3chess.online"
        )

    def test_init(self):
        self.assertEqual(self.routine.target_date, date(2099, 1, 2))
        self.assertEqual(self.routine.yesterday, date(2099, 1, 1))
        self.assertEqual(self.routine.primary_domain, "web3chess.online")
        self.assertIsNotNone(self.routine.cmo)
        self.assertIsNotNone(self.routine.scraper)
        self.assertIsNotNone(self.routine.audit)
        self.assertIsNotNone(self.routine.orchestrator)

    def test_audit_previous_day_performance(self):
        perf = self.routine.audit_previous_day_performance()
        self.assertEqual(perf["audit_date"], "2099-01-02")
        self.assertEqual(perf["analyzed_date"], "2099-01-01")
        self.assertIn("telegram_published_count", perf)
        self.assertIn("x_published_count", perf)
        self.assertIn("kpi_benchmarks", perf)
        self.assertIn("telegram_subscribers", perf)

    def test_audit_logs_and_self_heal(self):
        health = self.routine.audit_logs_and_self_heal()
        self.assertIn(health["health_status"], ("healthy", "attention_required"))
        self.assertIn("launchd_service_active", health)
        self.assertIsInstance(health["issues_detected"], list)
        self.assertIsInstance(health["fixes_applied"], list)

    def test_scrape_viral_intel_and_competitors(self):
        intel = self.routine.scrape_viral_intel_and_competitors()
        self.assertTrue(intel["curated_signals_count"] >= 3)
        self.assertTrue(len(intel["competitor_insights"]) >= 1)
        self.assertTrue(len(intel["top_trending_topics"]) >= 5)

        # Check trending topics contain required angles
        topics = [t["topic"] for t in intel["top_trending_topics"]]
        self.assertTrue(any("Flag Scramble" in t for t in topics))
        self.assertTrue(any("Stafford Gambit" in t for t in topics))
        self.assertTrue(any("Smothered Mate" in t for t in topics))
        self.assertTrue(any("Arena" in t for t in topics))
        self.assertTrue(any("Manifesto" in t for t in topics))

    def test_plan_five_viral_posts(self):
        posts = self.routine.plan_five_viral_posts()
        self.assertEqual(len(posts), 5)

        for p in posts:
            # 1. Valid ID and slot
            self.assertTrue(p["id"].startswith("2099-01-02-tg-"))
            self.assertEqual(p["status"], "approved")

            # 2. Hook Punctuation Law
            hook = p.get("hook", "")
            self.assertTrue(len(hook) > 0)
            self.assertFalse(hook.rstrip().endswith("."), f"Hook ends with period: {hook}")

            # 3. QA Gates passed
            qa_res = p.get("qa", {})
            self.assertTrue(qa_res.get("passed", False), f"QA issues for {p['id']}: {qa_res.get('issues')}")

            # 4. Creative image rendered
            render_res = p.get("render", {})
            self.assertTrue(render_res.get("ok", False) or render_res.get("skipped", False))
            self.assertTrue(Path(p["image"]).exists())

            # 5. Slot categories
            slot = p["slot"]
            if slot == 1:
                self.assertEqual(p["category"], "Tactics")
                self.assertIsNotNone(p.get("chess"))
                self.assertIn("reveal", p)
            elif slot == 2:
                self.assertEqual(p["category"], "Openings")
                self.assertIsNotNone(p.get("chess"))
            elif slot == 3:
                self.assertEqual(p["category"], "Chess Culture")
            elif slot == 4:
                self.assertEqual(p["category"], "Product")
                self.assertIn("18+", p["text"])
            elif slot == 5:
                self.assertEqual(p["category"], "Chess Culture")
                self.assertIn("Tap-to-earn", p["text"])

    def test_generate_executive_report(self):
        perf = self.routine.audit_previous_day_performance()
        health = self.routine.audit_logs_and_self_heal()
        intel = self.routine.scrape_viral_intel_and_competitors()
        posts = self.routine.plan_five_viral_posts()

        report = self.routine.generate_executive_report(
            audit_res=perf,
            health_res=health,
            viral_intel=intel,
            planned_posts=posts,
        )

        self.assertIn("# Web3Chess CMO Daily Executive Intelligence Briefing", report)
        self.assertIn("## 1. Previous Day Performance Audit", report)
        self.assertIn("## 2. System Log Audit & Self-Healing Actions", report)
        self.assertIn("## 3. Scraped Viral Trends & Competitor Intelligence", report)
        self.assertIn("## 4. Planned 5 Viral Posts", report)
        self.assertIn("Never End Hooks With a Period", report)

        # File persisted
        report_path = Path(__file__).resolve().parent / "reports" / "cmo-daily-audit-2099-01-02.md"
        self.assertTrue(report_path.exists())
        if report_path.exists():
            report_path.unlink()

    def test_run_full_routine(self):
        res = self.routine.run_full_routine()
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["date"], "2099-01-02")
        self.assertEqual(len(res["planned_posts"]), 5)
        self.assertIn("report", res)

        # Cleanup test report
        report_path = Path(__file__).resolve().parent / "reports" / "cmo-daily-audit-2099-01-02.md"
        if report_path.exists():
            report_path.unlink()


if __name__ == "__main__":
    unittest.main()
