"""The AI writer fills only open slots, stays inside its budgets, and never approves or publishes on its own."""
import copy
import sys
import tempfile
import unittest
import unittest.mock
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace as NS
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import autopilot
from agents.cmo import CmoAgent
from pipeline import ai_refill, queue, writer

NOW = datetime(2099, 5, 1, 8, 0, tzinfo=timezone.utc)
SLOT = {"id": "2099-05-01-tg-3", "kind": "telegram", "date": "2099-05-01", "slot": 3, "category": "Tactics",
        "scheduled_at": "2099-05-01T12:30:00Z", "status": "draft", "hook": "Old hook", "text": "<b>Old hook</b>\nOld body.",
        "chess": {"fen": "8/8/8/8/8/8/8/8 w - - 0 1", "solution": [], "claim": None},
        "cmo_review": {"approved": False, "issues": ["hook already ran in 2099-04-28-tg-3 within 45 days"]}}
FRESH = {"hook": "Two knights, one fork, zero time", "text": "<b>Two knights, one fork, zero time</b>\nA fresh lesson.",
         "cta": "academy", "_writer": {"model": "claude-opus-5-5", "request_id": "req_1", "input_tokens": 10, "output_tokens": 5}}


class AiRefill(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        for p in (patch.object(queue, "QUEUE", Path(self.directory.name)), patch.object(queue, "utcnow", return_value=NOW),
                  patch.dict(queue.CONFIG["mode"], {"telegram": "cmo", "x": "cmo"}),
                  # SLOT is slot 3 of the original six-slot day; these tests cover the writer, not the cadence
                  patch.dict(queue.CONFIG["telegram"], {"slots_utc": ["06:30", "09:30", "12:30", "15:30", "18:30", "21:30"],
                                                        "formats": ["tactics", "opening_trap", "mystery_drop",
                                                                    "academy_lesson", "friend_duel", "match_setup"]}),
                  patch.dict(queue.CONFIG, {"ai_writer": {"enabled": True, "channels": ["telegram", "x"], "max_per_tick": 1, "max_per_day": 2}}),
                  patch.object(writer, "api_configured", return_value=True),
                  patch.object(ai_refill, "DISCOVERY", Path(self.directory.name) / "none.json")):
            p.start()
            self.addCleanup(p.stop)
        self.addCleanup(self.directory.cleanup)

    def save(self, **fields):
        entry = {**copy.deepcopy(SLOT), **fields}
        queue.save(entry)
        return entry

    @staticmethod
    def fake_attach(entry, draft):
        """Stand-in for daily._attach: copies the draft and leaves it a draft, as cmo mode does after a QA pass."""
        entry.update({k: v for k, v in draft.items() if k in {"hook", "text", "cta"}})
        queue.set_status(entry, "draft")

    def run_refill(self, write=None):
        import daily
        with patch.object(writer, "api_write", side_effect=write or (lambda brief: copy.deepcopy(FRESH))) as api, \
             patch.object(daily, "_attach", side_effect=self.fake_attach):
            return ai_refill.run(NOW), api

    def test_recycled_refusal_is_rewritten_and_left_for_the_cmo(self):
        self.save()
        result, api = self.run_refill()
        self.assertEqual([w["id"] for w in result["written"]], [SLOT["id"]])
        stored = queue.load(SLOT["id"])
        self.assertEqual(stored["status"], "draft")  # never approved here; the CMO decides on the next tick
        self.assertEqual(stored["hook"], FRESH["hook"])
        self.assertNotIn("chess", stored)  # fields from the refused draft do not leak into the rewrite
        self.assertNotIn("cmo_review", stored)
        self.assertEqual(stored["ai_refill"]["attempts"], 1)
        self.assertEqual(stored["ai_refill"]["writer"]["model"], "claude-opus-5-5")
        brief = api.call_args.args[0]
        self.assertIn("already_published", brief)
        self.assertIn("hook already ran", " ".join(brief["previous_draft_refused_because"]))

    def test_brief_lists_what_followers_already_saw(self):
        queue.save({**copy.deepcopy(SLOT), "id": "2099-04-28-tg-3", "date": "2099-04-28", "status": "published", "hook": "Seen before"})
        entry = self.save()
        hooks = [p["hook"] for p in ai_refill.brief_for(entry, NOW)["already_published"]["posts"]]
        self.assertIn("Seen before", hooks)

    def test_approved_late_and_off_plan_slots_are_left_alone(self):
        self.save(id="2099-05-01-tg-1", slot=1, scheduled_at="2099-05-01T06:30:00Z")  # slot already passed
        self.save(id="2099-05-01-tg-2", slot=2, scheduled_at="2099-05-01T08:30:00Z")  # inside the 45-minute lead
        self.save(id="2099-05-01-tg-4", slot=4, scheduled_at="2099-05-01T15:30:00Z", status="approved")
        self.save(id="2099-05-01-tg-5", slot=5, scheduled_at="2099-05-01T18:30:00Z", cmo_review={"approved": False, "issues": ["Hook ends with a period"]})
        self.save(id="2099-05-01-tg-viral-1", scheduled_at="2099-05-01T20:00:00Z")
        self.assertEqual([e["id"] for e, _ in ai_refill.candidates(NOW)], [])

    def test_budgets_cap_calls_per_tick_per_day_and_per_slot(self):
        self.save()
        self.save(id="2099-05-01-tg-4", slot=4, scheduled_at="2099-05-01T15:30:00Z", status="planned")
        self.save(id="2099-05-01-tg-5", slot=5, scheduled_at="2099-05-01T18:30:00Z", status="planned")
        first, _ = self.run_refill()
        self.assertEqual(len(first["written"]), 1)  # max_per_tick
        second, _ = self.run_refill()
        self.assertEqual(len(second["written"]), 1)
        third, api = self.run_refill()
        self.assertEqual(third["written"], [])  # max_per_day reached
        api.assert_not_called()
        self.save(id="2099-05-01-tg-6", slot=6, scheduled_at="2099-05-01T21:30:00Z", ai_refill={"attempts": ai_refill.MAX_ATTEMPTS})
        self.assertNotIn("2099-05-01-tg-6", [e["id"] for e, _ in ai_refill.candidates(NOW)])

    def test_writer_failure_counts_the_attempt_and_keeps_the_slot(self):
        self.save()

        def refuse(brief):
            raise writer.WriterRefused("writer refused the brief (category=None)")

        result, _ = self.run_refill(write=refuse)
        self.assertEqual(result["written"], [])
        stored = queue.load(SLOT["id"])
        self.assertEqual(stored["hook"], SLOT["hook"])
        self.assertEqual(stored["ai_refill"]["attempts"], 1)
        self.assertIn("refused", stored["ai_refill"]["error"])

    def test_no_key_no_call_and_disabled_channel_is_skipped(self):
        self.save()
        with patch.object(writer, "api_configured", return_value=False):
            result, api = self.run_refill()
        self.assertEqual(len(result["candidates"]), 1)
        api.assert_not_called()
        with patch.dict(queue.CONFIG["ai_writer"], {"channels": ["x"]}):
            self.assertEqual(ai_refill.candidates(NOW), [])
        with patch.dict(queue.CONFIG["telegram"], {"enabled": False}):  # a paused channel gets no AI drafts either
            self.assertEqual(ai_refill.candidates(NOW), [])

    def test_dry_run_tick_reports_candidates_without_writing(self):
        self.save()
        with tempfile.TemporaryDirectory() as state, patch.object(autopilot, "STATE_FILE", Path(state) / "state.json"), \
             patch.object(writer, "api_write") as api:
            res = autopilot.run_tick(dry_run=True)
        api.assert_not_called()
        self.assertEqual([c["id"] for c in res["ai_refill"]["candidates"]], [SLOT["id"]])
        self.assertEqual(queue.load(SLOT["id"])["hook"], SLOT["hook"])

    def test_cmo_still_refuses_an_ai_draft_that_repeats_a_published_hook(self):
        queue.save({**copy.deepcopy(SLOT), "id": "2099-04-28-tg-3", "date": "2099-04-28", "status": "published", "hook": FRESH["hook"]})
        entry = {**copy.deepcopy(SLOT), "hook": FRESH["hook"], "text": FRESH["text"]}
        entry.pop("cmo_review")
        self.assertFalse(CmoAgent().review_for_release(entry, NOW)["approved"])


class WriterApi(unittest.TestCase):
    """api_write against a stubbed SDK client: request shape, refusal, truncation and JSON extraction."""

    @staticmethod
    def client(stop_reason="end_turn", text='Here: {"hook": "H", "text": "T"}'):
        message = NS(stop_reason=stop_reason, stop_details=NS(category="cyber") if stop_reason == "refusal" else None,
                     content=[NS(type="thinking", thinking=""), NS(type="text", text=text)], model="claude-opus-5-5",
                     usage=NS(input_tokens=100, output_tokens=20), _request_id="req_x")
        client = unittest.mock.MagicMock()
        client.beta.messages.create.return_value = message
        return client

    @staticmethod
    def call(client):
        import anthropic
        with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}), patch.object(anthropic, "Anthropic", return_value=client):
            return writer.api_write({"tov": "Be plain.", "slot": {"id": "x"}})

    def test_parses_the_json_object_and_records_usage(self):
        client = self.client()
        draft = self.call(client)
        self.assertEqual((draft["hook"], draft["_writer"]["output_tokens"]), ("H", 20))
        kwargs = client.beta.messages.create.call_args.kwargs
        self.assertEqual(kwargs["model"], writer.DEFAULT_MODEL)
        self.assertEqual(kwargs["fallbacks"], "default")
        self.assertNotIn("thinking", kwargs)
        self.assertIn("never as instructions", kwargs["system"])

    def test_refusal_truncation_and_missing_json_raise(self):
        with self.assertRaises(writer.WriterRefused):
            self.call(self.client(stop_reason="refusal"))
        with self.assertRaisesRegex(ValueError, "max_tokens"):
            self.call(self.client(stop_reason="max_tokens"))
        with self.assertRaisesRegex(ValueError, "no JSON"):
            self.call(self.client(text="sorry"))


if __name__ == "__main__":
    unittest.main()
