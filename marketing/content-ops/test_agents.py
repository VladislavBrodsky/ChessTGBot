"""Tests for the Multi-Agent Content and Marketing Engine."""
from __future__ import annotations

import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

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
    @classmethod
    def tearDownClass(cls):
        from pipeline import queue
        import shutil
        for day in ("2099-01-01", "2099-01-02"):
            test_dir = queue.QUEUE / day
            if test_dir.exists():
                shutil.rmtree(test_dir, ignore_errors=True)

    def setUp(self):
        self.orchestrator = ContentEngineOrchestrator(
            plan_date=date(2099, 1, 1),
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
            "hook": "White to move. One knight move ends the game on the spot",
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
            hook="White to move. One knight move ends the game on the spot",
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
            hook="White to move. One knight move ends the game on the spot",
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
        self.assertTrue(any("more than 3 hashtags" in i for i in qa_res["issues"]))

        # 2-3 hashtags should pass
        valid_post = {
            "hook": "Clean hashtags",
            "text": "White to move under 5 seconds #Chess #SpeedChess",
            "category": "Tactics",
        }
        valid_qa = self.orchestrator.qa.inspect_x_post(valid_post)
        self.assertTrue(valid_qa["passed"])

    def test_x_thread_and_qa(self):
        res = self.orchestrator.create_flagship_x_thread()
        self.assertEqual(res["status"], "success")
        self.assertTrue(res["qa_passed"])
        self.assertEqual(res["tweets_count"], 5)

    def test_x_orchestrator_daily_batch(self):
        batch = self.orchestrator.generate_x_daily_batch()
        self.assertEqual(batch["status"], "success")
        self.assertEqual(batch["posts_created"], 6)
        self.assertTrue(all(p["qa_passed"] for p in batch["posts"]))

    def test_render_failure_rejects_batch_instead_of_reporting_success(self):
        from pipeline import queue, renderer

        orchestrator = ContentEngineOrchestrator(
            plan_date=date(2099, 1, 2),
            primary_domain="web3chess.online",
        )

        def fail_render(post):
            post.pop("image", None)
            post["render"] = {"ok": False, "skipped": False, "error": "browser failed"}
            return post

        with patch.object(renderer, "render", side_effect=fail_render):
            batch = orchestrator.generate_x_daily_batch(render_images=True)

        self.assertEqual(batch["status"], "needs_attention")
        self.assertTrue(all(not item["qa_passed"] for item in batch["posts"]))
        self.assertTrue(all(item["render_ok"] is False for item in batch["posts"]))
        self.assertTrue(all("creative render failed" in issue for item in batch["posts"] for issue in (queue.load(item["id"])["qa"]["issues"])))

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
        self.assertNotIn("$500", arena_intent["reply_text"])

    def test_x_activity_sniper_match(self):
        from pipeline import x_activity

        match = x_activity.match_sniper_target_post("@Hikaru", "Just finished a crazy 1+0 bullet session")
        self.assertIsNotNone(match)
        self.assertEqual(match["target"], "Hikaru Nakamura")
        self.assertTrue(len(match["recommended_comment"]) > 20)

    def test_x_post_creative_must_be_square(self):
        post = self.orchestrator.copywriter.draft_x_single_post(
            slot_id="2026-10-12-x-test",
            category="Tactics",
            hook="White to move. Find the mate",
            body="Tactical calculation challenge.",
            fen="6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
            solution=["Nf7#"],
            claim="mate_in_1",
            size="square",
        )
        qa_res = self.orchestrator.qa.inspect_x_post(post)
        self.assertTrue(qa_res["passed"])

        # Force a non-square canvas (e.g. wide) and assert QA rejection
        bad_post = dict(post)
        bad_post["creative"] = dict(post["creative"])
        bad_post["creative"]["size"] = "wide"
        bad_qa = self.orchestrator.qa.inspect_x_post(bad_post)
        self.assertFalse(bad_qa["passed"])
        self.assertTrue(any("1:1 format" in issue for issue in bad_qa["issues"]))

    def test_cmo_x_post_alignment(self):
        good_post = {
            "kind": "x_post",
            "category": "Tactics",
            "hook": "White to move. One knight move ends the game on the spot?",
            "text": "White to move. One knight move ends the game on the spot?\n\nBlack is boxed in.",
            "docked_reply": {"text": "Solution: 1. Nf7#"},
            "creative": {"size": "square"},
        }
        res = self.orchestrator.cmo.review_slot_alignment(good_post)
        self.assertTrue(res["approved_by_cmo"])
        self.assertTrue(res["viral_score"] >= 80)

        # Post with link in root text violates Docked Link Law
        bad_post = dict(good_post)
        bad_post["text"] = "White to move. Play now at https://web3chess.online"
        bad_res = self.orchestrator.cmo.review_slot_alignment(bad_post)
        self.assertFalse(bad_res["approved_by_cmo"])
        self.assertTrue(any("Docked Link Law" in issue for issue in bad_res["strategic_notes"]))

    def test_x_publisher_image_dispatch(self):
        from unittest.mock import patch
        from pipeline import x_publisher

        with patch.object(x_publisher, "get_oauth1_auth", return_value=object()), patch("requests.post") as mock_post:
            mock_post.return_value.ok = True
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {"data": {"id": "1234567890"}}

            res = x_publisher.post_tweet(
                text="Test tweet from @defi_ambassador",
                media_ids=["9876543210"],
            )
            self.assertEqual(res["data"]["id"], "1234567890")
            called_json = mock_post.call_args[1]["json"]
            self.assertEqual(called_json["media"], {"media_ids": ["9876543210"]})
    def test_extended_viral_categories(self):
        cw = self.orchestrator.copywriter
        qa = self.orchestrator.qa

        # 1. Debate post
        debate = cw.draft_x_debate_post(
            slot_id="2026-10-12-x-debate",
            hook="Rapid chess is dead. Intuition beats memory",
            body="If you cannot calculate under 180 seconds with 0 increment, your rating is artificial.\n\nAre you a calculation player or an opening memory player?",
        )
        res_debate = qa.inspect_x_post(debate)
        self.assertTrue(res_debate["passed"], res_debate["issues"])
        self.assertEqual(debate["creative"]["tag"], "Hot Take")

        # 2. Psychology post
        psych = cw.draft_x_psychology_post(
            slot_id="2026-10-12-x-psych",
            hook="What happens to your brain at 6 seconds on the clock",
            body="Under severe time trouble, rational calculation collapses into pure tunnel vision.\n\nPattern recognition is the only survival instinct.",
        )
        res_psych = qa.inspect_x_post(psych)
        self.assertTrue(res_psych["passed"], res_psych["issues"])

        # 3. Motif matrix post
        matrix = cw.draft_x_motif_matrix_post(
            slot_id="2026-10-12-x-matrix",
            hook="The 4 tactical motifs to scan before every blitz move",
            body="Pin, Fork, Deflection, Decoy.\n\nSave this calculation matrix before your next speed session.",
        )
        res_matrix = qa.inspect_x_post(matrix)
        self.assertTrue(res_matrix["passed"], res_matrix["issues"])

        # 4. Engineering post
        eng = cw.draft_x_engineering_post(
            slot_id="2026-10-12-x-eng",
            hook="How we eliminated board lag on Telegram with sub-100ms sync",
            body="FastAPI + Socket.IO real-time engine built for zero-latency blitz PvP on Bot API 8.0.",
        )
        # 5. Player spotlight post (Telegram and X)
        spot_tg = cw.draft_player_spotlight_post(
            slot_id="2026-10-12-tg-spotlight",
            player_name="grandmaestro",
            streak_count=9,
            rating_gain=65,
            winnings_usdt=190.0,
            fen="6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
            solution=["Ra8#"],
            time_control="3+0 Blitz",
            platform="telegram",
            verified_source_url="https://web3chess.online/leaderboard",
        )
        res_spot_tg = qa.inspect_telegram_post(spot_tg)
        self.assertTrue(res_spot_tg["passed"], res_spot_tg["issues"])
        self.assertEqual(spot_tg["category"], "Player Spotlight")

        spot_x = cw.draft_player_spotlight_post(
            slot_id="2026-10-12-x-spotlight",
            player_name="grandmaestro",
            streak_count=9,
            rating_gain=65,
            winnings_usdt=190.0,
            fen="6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
            solution=["Ra8#"],
            time_control="3+0 Blitz",
            platform="x",
            verified_source_url="https://web3chess.online/leaderboard",
        )
        res_spot_x = qa.inspect_x_post(spot_x)
        self.assertTrue(res_spot_x["passed"], res_spot_x["issues"])
        self.assertIn("#SpeedChess", spot_x["text"])

    def test_viral_showcase_formats(self):
        showcase = self.orchestrator.generate_viral_showcase_batch(render_images=False)
        self.assertEqual(showcase["status"], "success")
        self.assertEqual(showcase["posts_created"], 4)
        self.assertTrue(all(p["qa_passed"] for p in showcase["posts"]))

    def test_viral_telegram_mystery_box(self):
        cw = self.orchestrator.copywriter
        qa = self.orchestrator.qa
        post = cw.draft_mystery_box_drop("2099-01-01-tg-box", "Epic")
        res = qa.inspect_telegram_post(post)
        self.assertTrue(res["passed"], res["issues"])
        self.assertEqual(post["cta"], "mystery_box")
        self.assertEqual(post["category"], "Product")

    def test_viral_telegram_friend_duel(self):
        cw = self.orchestrator.copywriter
        qa = self.orchestrator.qa
        post = cw.draft_viral_friend_duel("2099-01-01-tg-duel")
        res = qa.inspect_telegram_post(post)
        self.assertTrue(res["passed"], res["issues"])
        self.assertEqual(post["cta"], "duel_friend")
        self.assertEqual(post["category"], "Chess Culture")

    def test_viral_telegram_interactive_academy_drill(self):
        cw = self.orchestrator.copywriter
        qa = self.orchestrator.qa
        post = cw.draft_interactive_academy_drill(
            slot_id="2099-01-01-tg-drill",
            fen="6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
            solution=["Ra8#"],
            tactic_name="Back Rank",
            claim="mate_in_1"
        )
        res = qa.inspect_telegram_post(post)
        self.assertTrue(res["passed"], res["issues"])
        self.assertEqual(post["cta"], "academy_app")
        self.assertIn("reveal", post)

    def test_viral_telegram_daily_batch(self):
        batch = self.orchestrator.generate_telegram_daily_batch(target_date=date(2099, 1, 1), render_images=False)
        self.assertEqual(batch["status"], "success")
        self.assertEqual(batch["posts_created"], 6)
        self.assertTrue(all(p["qa_passed"] for p in batch["posts"]))

    def test_viral_youtube_breakdowns(self):
        from pipeline.idea_bank import VIRAL_YOUTUBE_VAULT
        cw = self.orchestrator.copywriter
        qa = self.orchestrator.qa
        for i, entry in enumerate(VIRAL_YOUTUBE_VAULT):
            tg_post = cw.draft_viral_youtube_breakdown(f"2099-01-01-tg-yt-{i}", entry, platform="telegram")
            res_tg = qa.inspect_telegram_post(tg_post)
            self.assertTrue(res_tg["passed"], f"TG {entry['id']} issues: {res_tg['issues']}")

            x_post = cw.draft_viral_youtube_breakdown(f"2099-01-01-x-yt-{i}", entry, platform="x")
            res_x = qa.inspect_x_post(x_post)
            self.assertTrue(res_x["passed"], f"X {entry['id']} issues: {res_x['issues']}")


if __name__ == "__main__":
    unittest.main()




