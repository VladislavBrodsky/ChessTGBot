"""Missing platform metrics must stay distinct from measured zero activity."""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent))

from pipeline import analytics


class TestAnalyticsAvailability(unittest.TestCase):
    def test_x_account_failure_does_not_create_zero_metrics(self):
        response = Mock(ok=False, status_code=403)
        with patch.object(analytics.x_publisher, "get_oauth1_auth", return_value=object()), patch.object(analytics.requests, "get", return_value=response):
            result = analytics.fetch_x_metrics()
        self.assertEqual(result["error"], "account_http_403")
        self.assertFalse(result.get("available", False))

    def test_audit_marks_missing_platform_metrics_unavailable(self):
        with tempfile.TemporaryDirectory() as temp_dir, patch.object(analytics, "fetch_x_metrics", return_value={"account": {}, "recent_tweets": [], "error": "account_http_403"}), patch.object(analytics, "fetch_telegram_metrics", return_value={"members": None, "available": False}), patch.object(analytics.queue, "all_entries", return_value=[]), patch.object(analytics, "STATE_DIR", Path(temp_dir)), patch.object(analytics, "METRICS_FILE", Path(temp_dir) / "metrics.json"):
            report = analytics.audit_performance()
        self.assertIsNone(report["x_reach"]["total_impressions"])
        self.assertIsNone(report["x_reach"]["engagement_rate_pct"])
        self.assertFalse(report["telegram_reach"]["available"])


if __name__ == "__main__":
    unittest.main()
