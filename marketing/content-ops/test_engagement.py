import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pipeline import engagement, qa, telegram_publisher


class EngagementTests(unittest.TestCase):
    snapshot = dict(opted_in=True, blocked=False, in_game=False, hours_since_last_message=48,
                    messages_last_7d=0, quest_state="claimable", quest_enabled=True,
                    name="<a>& Player")

    def test_html_escaped_and_reward_trigger_verified(self):
        result = engagement.recommend(self.snapshot)
        self.assertEqual(result["message_key"], "claim")
        self.assertIn("&lt;a&gt;&amp; Player", result["text"])
        self.assertEqual(qa.telegram_html(result["text"])[0], [])
        self.assertIsNone(engagement.recommend({**self.snapshot, "quest_enabled": False}))

    def test_opt_out_and_frequency_caps(self):
        for override in [{"opted_in": False}, {"blocked": True}, {"in_game": True},
                         {"hours_since_last_message": 23}, {"messages_last_7d": 3}]:
            self.assertIsNone(engagement.recommend({**self.snapshot, **override}))

    def test_live_contract_rejects_disabled_or_different_odds(self):
        live = dict(campaign_id=engagement.CAMPAIGN, enabled=True, target=3, minimum_plies=20,
                    game_type="computer", once_per_account=True, cash_value=False,
                    rewards=engagement.EXPECTED_REWARDS, duplicate_reward="xp_250")
        engagement.validate_live_catalog(live)
        for override in [{"enabled": False}, {"cash_value": True}, {"rewards": []}, {"target": 5}]:
            with self.assertRaises(RuntimeError):
                engagement.validate_live_catalog({**live, **override})

    def test_publisher_refuses_unreleased_reward_offer(self):
        post = dict(id="2026-10-11-growth-quest", text="One reward", cta="play", requires_campaign=engagement.CAMPAIGN)
        with patch.object(telegram_publisher, "_credentials", return_value=("test", "@chess_hub")), \
             patch.object(engagement, "assert_live_offer", side_effect=RuntimeError("not live")), \
             patch.object(telegram_publisher, "_deliver") as send:
            with self.assertRaises(RuntimeError):
                telegram_publisher.publish(post, dry_run=False)
            send.assert_not_called()

    def test_reward_ad_cannot_omit_launch_contract(self):
        post = dict(id="2026-10-11-growth-quest", text="One reward", hook="One reward",
                    category="Product", cta="play", creative={"template": "reward", "headline": "One reward", "cta_label": "Play"})
        self.assertFalse(qa.check_telegram(post)["passed"])
        with self.assertRaises(RuntimeError):
            engagement.assert_live_offer(post)


if __name__ == "__main__":
    unittest.main()
