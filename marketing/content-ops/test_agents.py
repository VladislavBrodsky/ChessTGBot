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

    def test_x_single_post_and_qa(self):
        post = self.orchestrator.copywriter.draft_x_single_post(
            slot_id="2026-10-11-x-1",
            category="Tactics",
            hook="White to move. One knight move ends the game on the spot.",
            body="Black's king is boxed in on h8 by its own rook and pawns.\n\nWhat is White's only winning move? ♟️",
            docked_reply_text="Solution: 1. Nf7# (Smothered Mate).\n\nPractise on https://web3chess.online/academy",
            fen="6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
            solution=["Nf7#"],
            claim="smothered_mate",
        )
        qa_res = self.orchestrator.qa.inspect_x_post(post)
        self.assertTrue(qa_res["passed"], qa_res["issues"])

    def test_x_qa_rejects_link_in_root_tweet(self):
        post = {
            "hook": "Check out our game",
            "text": "Play chess on https://web3chess.online right now!",
            "category": "Product",
        }
        qa_res = self.orchestrator.qa.inspect_x_post(post)
        self.assertFalse(qa_res["passed"])
        self.assertTrue(any("root tweet must not contain outbound links" in i for i in qa_res["issues"]))

    def test_x_qa_rejects_overlength_tweet(self):
        post = {
            "hook": "Long tweet",
            "text": "A" * 290,
            "category": "Tactics",
        }
        qa_res = self.orchestrator.qa.inspect_x_post(post)
        self.assertFalse(qa_res["passed"])
        self.assertTrue(any("limit 280" in i for i in qa_res["issues"]))

    def test_x_qa_rejects_multiple_hashtags(self):
        post = {
            "hook": "Hashtag spam",
            "text": "White to move #chess #gaming #crypto #web3",
            "category": "Tactics",
        }
        qa_res = self.orchestrator.qa.inspect_x_post(post)
        self.assertFalse(qa_res["passed"])
        self.assertTrue(any("more than 1 hashtag" in i for i in qa_res["issues"]))

    def test_x_thread_and_qa(self):
        res = self.orchestrator.create_flagship_x_thread()
        self.assertEqual(res["status"], "success")
        self.assertTrue(res["qa_passed"])
        self.assertEqual(res["tweets_count"], 5)

    def test_x_orchestrator_daily_batch(self):
        batch = self.orchestrator.generate_x_daily_batch()
        self.assertEqual(batch["status"], "success")
        self.assertEqual(batch["posts_created"], 3)
        self.assertTrue(all(p["qa_passed"] for p in batch["posts"]))

    def test_x_reply_sniper_kit(self):
        kit = self.orchestrator.generate_x_reply_sniper_kit()
        self.assertEqual(kit["status"], "success")
        self.assertTrue(kit["sniper_targets_count"] >= 3)

    def test_x_activity_crc_and_signature(self):
        from pipeline import x_activity

        secret = "test_consumer_secret_123"
        crc_token = "crc_challenge_token_abc"
        response_token = x_activity.calculate_crc_response(crc_token, secret)
        self.assertTrue(response_token.startswith("sha256="))

        payload = b'{"event": "post.reply.create"}'
        import hmac, hashlib, base64
        mac = hmac.new(secret.encode(), payload, hashlib.sha256)
        valid_sig = f"sha256={base64.b64encode(mac.digest()).decode()}"
        self.assertTrue(x_activity.verify_webhook_signature(payload, valid_sig, secret))
        self.assertFalse(x_activity.verify_webhook_signature(payload, "sha256=invalid", secret))

    def test_x_activity_tactical_reply_evaluation(self):
        from pipeline import x_activity

        correct = x_activity.evaluate_tactical_reply("I think it is Nf7#!!", ["Nf7#"])
        self.assertTrue(correct["is_correct"])
        self.assertIn("Spot on!", correct["response_text"])

        incorrect = x_activity.evaluate_tactical_reply("Play Nxh7 instead", ["Nf7#"])
        self.assertFalse(incorrect["is_correct"])
        self.assertIn("Close calculation", incorrect["response_text"])

    def test_x_activity_intent_routing(self):
        from pipeline import x_activity

        play_intent = x_activity.route_keyword_intent("Can I play now?")
        self.assertIsNotNone(play_intent)
        self.assertEqual(play_intent["intent"], "play")

        arena_intent = x_activity.route_keyword_intent("Enter the arena vault")
        self.assertIsNotNone(arena_intent)
        self.assertEqual(arena_intent["intent"], "arena")

    def test_x_activity_sniper_match(self):
        from pipeline import x_activity

        match = x_activity.match_sniper_target_post("@Hikaru", "Just finished a crazy 1+0 bullet session")
        self.assertIsNotNone(match)
        self.assertEqual(match["target"], "Hikaru Nakamura")
        self.assertTrue(len(match["recommended_comment"]) > 20)


if __name__ == "__main__":
    unittest.main()


