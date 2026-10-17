"""Tests for autonomous marketing autopilot and scheduler."""
from __future__ import annotations

import unittest
from datetime import datetime, timezone, timedelta
from pathlib import Path
from unittest.mock import patch, MagicMock

import autopilot
from pipeline import queue


class TestAutopilot(unittest.TestCase):

    def test_load_and_save_state(self):
        state = autopilot.load_state()
        self.assertIsInstance(state, dict)
        state["test_key"] = "test_val"
        autopilot.save_state(state)
        reloaded = autopilot.load_state()
        self.assertEqual(reloaded.get("test_key"), "test_val")

    def test_run_tick_dry_run(self):
        res = autopilot.run_tick(
            dry_run=True,
            min_spacing_minutes=0,
            min_tg_spacing_minutes=0,
            force_next=True,
            force_next_tg=True,
        )
        self.assertTrue(res["dry_run"])
        self.assertIn("timestamp", res)
        self.assertIn("next_up_x", res)
        self.assertIn("next_up_tg", res)

    def test_get_last_published_x_time(self):
        last_dt = autopilot.get_last_published_x_time()
        self.assertIsInstance(last_dt, datetime)
        self.assertEqual(last_dt.tzinfo, timezone.utc)

    def test_get_last_published_tg_time(self):
        last_dt = autopilot.get_last_published_tg_time()
        self.assertIsInstance(last_dt, datetime)
        self.assertEqual(last_dt.tzinfo, timezone.utc)

    def test_cadence_cooldown_enforcement(self):
        # When cooldown is very high (e.g. 9999 minutes), no post should dispatch without force
        res = autopilot.run_tick(
            dry_run=True,
            min_spacing_minutes=9999,
            min_tg_spacing_minutes=9999,
            force_next=False,
            force_next_tg=False,
        )
        self.assertEqual(len(res["x_dispatched"]), 0)
        self.assertEqual(len(res["tg_dispatched"]), 0)

    def test_auto_replenish_generates_non_duplicate_x_batch(self):
        import shutil
        from datetime import date
        test_dt = datetime(2099, 2, 1, 12, 0, 0, tzinfo=timezone.utc)
        test_dir = queue.QUEUE / "2099-02-01"
        try:
            with patch.object(autopilot, "ensure_x_queue_replenished", wraps=autopilot.ensure_x_queue_replenished):
                created = autopilot.ensure_x_queue_replenished(test_dt, render_images=False)
                # If other approved posts exist in real queue, created may be 0; test direct orchestrator batch too
                orch = autopilot.ContentEngineOrchestrator(plan_date=date(2099, 2, 1))
                batch = orch.generate_x_daily_batch(target_date=date(2099, 2, 1), render_images=False)
                self.assertEqual(batch["posts_created"], 3)
                hooks = [queue.load(p["id"])["hook"] for p in batch["posts"]]
                self.assertEqual(len(set(hooks)), 3)
        finally:
            if test_dir.exists():
                shutil.rmtree(test_dir, ignore_errors=True)

    def test_reply_sniper_intent_classification(self):
        from pipeline import reply_sniper
        self.assertEqual(
            reply_sniper.classify_tweet_intent("be honest: are you good at chess?", "@chesscom"),
            "are_you_good",
        )
        self.assertEqual(
            reply_sniper.classify_tweet_intent("Share a BRILLIANT move you have played recently", "@chesscom"),
            "brilliant_move",
        )
        self.assertEqual(
            reply_sniper.classify_tweet_intent("500 horses watching you blunder your knight", "@chesscom"),
            "blunder_luft",
        )
        self.assertEqual(
            reply_sniper.classify_tweet_intent("Scramble battle in 3-minute blitz", "@GMHikaru"),
            "blitz_scramble",
        )
        self.assertEqual(
            reply_sniper.classify_tweet_intent("Telegram Mini Apps and TON ecosystem gaming", "@ton_blockchain"),
            "ton_gaming",
        )

    def test_reply_sniper_eligibility_filter(self):
        from pipeline import reply_sniper
        # Sensitive or condolences posts must be strictly excluded
        self.assertFalse(reply_sniper.is_tweet_eligible("I am saddened by the passing of King Harald."))
        self.assertFalse(reply_sniper.is_tweet_eligible("Rest in peace my dear friend, condolences to family."))
        self.assertFalse(reply_sniper.is_tweet_eligible("Playing Deadlock tomorrow with the boys."))
        # Valid chess discussions must be included
        self.assertTrue(reply_sniper.is_tweet_eligible("be honest: are you good at chess?"))
        self.assertTrue(reply_sniper.is_tweet_eligible("What move wins here?"))
        self.assertTrue(reply_sniper.is_tweet_eligible("Speedrun time scramble highlights"))

    def test_reply_sniper_dry_run_dispatch(self):
        from pipeline import reply_sniper
        mock_candidates = [{
            "target_name": "Chess.com",
            "target_handle": "@chesscom",
            "tweet_id": "test_999999",
            "text": "be honest: are you good at chess?",
            "created_at": "2026-10-17T00:00:00Z",
            "impressions": 50000,
            "likes": 1000,
            "replies": 200,
        }]
        with patch.object(reply_sniper, "fetch_candidate_target_tweets", return_value=mock_candidates):
            res = reply_sniper.snipe_next_target(dry_run=True, force=True)
            self.assertTrue(res["sniped"])
            self.assertTrue(res["dry_run"])
            self.assertEqual(res["target_handle"], "@chesscom")
            self.assertIn("good", res["reply_comment"].lower())
            self.assertNotIn("http", res["reply_comment"])  # Zero links in top-level sniper reply

    def test_telegram_cross_pollination_notification(self):
        from pipeline import telegram_publisher
        res = telegram_publisher.notify_x_post_in_channel(
            post_id="2026-10-17-x-1",
            hook="Is a 3-minute scramble decided by calculation or instinct?",
            x_url="https://x.com/defi_ambassador/status/123456789",
            dry_run=True,
        )
        self.assertTrue(res["dry_run"])
        self.assertEqual(res["post_id"], "2026-10-17-x-1")
        self.assertIn("123456789", res["x_url"])

    def test_autopilot_tick_with_sniper_and_audit(self):
        mock_candidates = [{
            "target_name": "Hikaru Nakamura",
            "target_handle": "@GMHikaru",
            "tweet_id": "test_hikaru_1",
            "text": "Scramble madness in the final round",
            "created_at": "2026-10-17T00:00:00Z",
            "impressions": 100000,
            "likes": 2000,
            "replies": 500,
        }]
        from pipeline import reply_sniper
        with patch.object(reply_sniper, "fetch_candidate_target_tweets", return_value=mock_candidates):
            res = autopilot.run_tick(
                dry_run=True,
                enable_sniper=True,
                force_sniper=True,
                audit_analytics=True,
            )
            self.assertIn("sniper", res)
            self.assertTrue(res["sniper"]["sniped"])
            self.assertEqual(res["sniper"]["target_handle"], "@GMHikaru")


if __name__ == "__main__":
    unittest.main()
