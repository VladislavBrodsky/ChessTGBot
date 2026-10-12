"""Tests for the Multi-Agent Content and Marketing Engine."""
from __future__ import annotations

import unittest
from datetime import date
from pathlib import Path

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


class TestAgents(unittest.TestCase):
    def setUp(self):
        self.orchestrator = ContentEngineOrchestrator(
            plan_date=date(2026, 10, 11),
            primary_domain="web3chess.online"
        )

    def test_cmo_strategy_brief(self):
        brief = self.orchestrator.cmo.get_strategy_brief()
        self.assertEqual(brief["quarter"], "Q4 2026")
        self.assertEqual(brief["primary_domain"], "web3chess.online")
        self.assertIn("golden_rules", brief)
        self.assertTrue(len(brief["viral_hook_formulas"]) >= 4)

    def test_scraper_trend_signals(self):
        trends = self.orchestrator.scraper.get_curated_trend_signals()
        self.assertTrue(len(trends) >= 3)
        self.assertTrue(any(t["category"] == "Tactics" for t in trends))

    def test_audit_post_analysis(self):
        sample_post = {
            "hook": "White to move. One knight move ends the game on the spot.",
            "text": "White to move. Answer with reactions: ❤ Nf7# 🔥 Nxh7",
            "category": "Tactics",
        }
        audit = self.orchestrator.audit.audit_post(sample_post)
        self.assertTrue(audit["overall_viral_score"] >= 80)
        self.assertTrue(len(audit["strengths"]) >= 2)

    def test_planner_blueprint(self):
        blueprint = self.orchestrator.planner.get_slot_blueprint(1)
        self.assertEqual(blueprint["slot"], 1)
        self.assertEqual(blueprint["utc_time"], "07:30")
        self.assertEqual(blueprint["pillar"], "Tactics")

    def test_chess_editor_validation(self):
        valid = self.orchestrator.chess_editor.verify_position_and_solution(
            "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1", ["Nf7#"], "mate_in_1"
        )
        self.assertTrue(valid["valid"])
        self.assertEqual(valid["issues"], [])

        invalid = self.orchestrator.chess_editor.verify_position_and_solution(
            "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1", ["Nxh7"], "mate_in_1"
        )
        self.assertFalse(invalid["valid"])

    def test_smm_copywriter_and_qa(self):
        post = self.orchestrator.copywriter.draft_viral_telegram_post(
            slot_id="2026-10-11-tg-1",
            category="Tactics",
            hook="White to move. One knight move ends the game on the spot.",
            body="Black's king on h8 is boxed in by its own rook on g8 and pawns on g7 and h7.\n❤ Nf7#   🔥 Nxh7   👏 Ne6\nAnswer lands in replies.",
            cta="play",
            fen="6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
            solution=["Nf7#"],
            claim="mate_in_1",
            reveal_text="<b>Solved: Nf7#.</b>\nThe king on h8 is trapped by its own pieces.",
        )
        qa_res = self.orchestrator.qa.inspect_telegram_post(post)
        self.assertTrue(qa_res["passed"], qa_res["issues"])

    def test_orchestrator_first_post_flow(self):
        result = self.orchestrator.create_first_flagship_post()
        self.assertEqual(result["status"], "success")
        self.assertTrue(result["qa_summary"]["telegram_passed"])
        self.assertTrue(result["qa_summary"]["article_passed"])
        self.assertEqual(result["telegram_post"]["status"], "approved")


if __name__ == "__main__":
    unittest.main()
