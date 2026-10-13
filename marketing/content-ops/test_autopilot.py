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
        res = autopilot.run_tick(dry_run=True, min_spacing_minutes=0, force_next=True)
        self.assertTrue(res["dry_run"])
        self.assertIn("timestamp", res)
        self.assertIn("next_up", res)

    def test_get_last_published_x_time(self):
        last_dt = autopilot.get_last_published_x_time()
        self.assertIsInstance(last_dt, datetime)
        self.assertEqual(last_dt.tzinfo, timezone.utc)

    def test_cadence_cooldown_enforcement(self):
        # When cooldown is very high (e.g. 9999 minutes), no post should dispatch without force
        res = autopilot.run_tick(dry_run=True, min_spacing_minutes=9999, force_next=False)
        self.assertEqual(len(res["x_dispatched"]), 0)


if __name__ == "__main__":
    unittest.main()
