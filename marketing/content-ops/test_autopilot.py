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


if __name__ == "__main__":
    unittest.main()
