"""The dispatch gate must keep stale, unreviewed and old-canvas entries from ever leaving the queue."""
import argparse
import copy
import sys
import tempfile
import unittest
from datetime import date, datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import autopilot
import daily
from agents.cmo import CmoAgent
from agents.publisher import PublisherAgent
from pipeline import gate, hygiene, queue, renderer, review, telegram_publisher

NOW = datetime(2099, 5, 1, 16, 0, tzinfo=timezone.utc)
TG = {"id": "2099-05-01-tg-4", "kind": "telegram", "date": "2099-05-01", "scheduled_at": "2099-05-01T15:30:00Z", "slot": 4,
      "category": "Tactics", "format": "puzzle", "cta": "puzzle", "hook": "Find the move before the clock does",
      "text": "<b>Find the move before the clock does</b>\nWhite to move. Three pawns guard the king, and one rook decides it.",
      "chess": {"fen": "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", "solution": ["Ra8#"], "claim": "mate_in_1"}, "sources": [],
      "qa": {"passed": True, "issues": []}, "status": "approved"}
X = {"id": "2099-05-01-x-5", "kind": "x_post", "date": "2099-05-01", "scheduled_at": "2099-05-01T15:00:00Z", "slot": 5,
     "category": "Tactics", "hook": "Find the mate in one", "text": "White to move. Three pawns guard the king.",
     "qa": {"passed": True, "issues": []}, "status": "approved"}


# The fixtures above are written against the original six-slot day with X switched on. These tests exercise the gate,
# not the cadence (that lives in pipeline/config.json and is checked in test_pipeline.Plan), so they pin that plan.
SIX_SLOT_PLAN = {
    "telegram": {"slots_utc": ["06:30", "09:30", "12:30", "15:30", "18:30", "21:30"],
                 "formats": ["tactics", "opening_trap", "mystery_drop", "academy_lesson", "friend_duel", "match_setup"],
                 "rotation": {day: ["Tactics", "Chess News", "Academy", "Openings", "Chess Culture", "Product"]
                              for day in queue.WEEKDAYS}},
    "x": {"slots_utc": ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"], "enabled": True},
}
_PLAN_PATCHES = [patch.dict(queue.CONFIG[channel], values) for channel, values in SIX_SLOT_PLAN.items()]


def setUpModule():
    for p in _PLAN_PATCHES:
        p.start()


def tearDownModule():
    for p in reversed(_PLAN_PATCHES):
        p.stop()


def reviewed(entry, by="human:test"):
    entry = copy.deepcopy(entry)
    entry["approval"] = gate.approval(entry, by)
    return entry


class PublishedCorpus(unittest.TestCase):
    def test_channel_corpus_reads_post_copy_instead_of_article_blocks(self):
        entries = [
            {"kind": "telegram", "status": "published", "text": "<b>Telegram lesson</b>"},
            {"kind": "x_post", "status": "published", "text": "X lesson"},
            {"kind": "x_thread", "status": "published", "tweets": [{"text": "Thread one"}, {"text": "Thread two"}]},
            {"kind": "article", "status": "published", "article": {"content": [{"text": "Article lesson"}]}},
        ]
        with patch.object(queue, "all_entries", side_effect=lambda kind=None, **_: [e for e in entries if kind is None or e["kind"] == kind]):
            self.assertEqual(daily._published_corpus("telegram"), ["Telegram lesson"])
            self.assertEqual(daily._published_corpus("x_post"), ["X lesson"])
            self.assertEqual(daily._published_corpus("x_thread"), ["Thread one Thread two"])
            self.assertEqual(daily._published_corpus("article"), ["Article lesson"])


class RenderInputIsolation(unittest.TestCase):
    def test_overlapping_renders_get_distinct_temporary_specs_and_clean_them_up(self):
        seen = []
        output_paths = []

        def fake_run(command, **_kwargs):
            spec_path = Path(command[2])
            output_path = Path(command[3])
            self.assertTrue(spec_path.exists())
            self.assertTrue(output_path.exists())
            seen.append(spec_path)
            output_paths.append(output_path)
            return SimpleNamespace(returncode=1, stderr="expected test failure", stdout="")

        entry = {"id": "2099-05-01-x-1", "date": "2099-05-01"}
        with tempfile.TemporaryDirectory() as directory, \
                patch.object(queue, "QUEUE", Path(directory)), \
                patch.object(renderer.subprocess, "run", side_effect=fake_run):
            renderer._render_spec(entry, {"template": "tip"}, "", 1)
            renderer._render_spec(entry, {"template": "tip"}, "", 1)

        self.assertEqual(len(seen), 2)
        self.assertNotEqual(seen[0], seen[1])
        self.assertTrue(all(not path.exists() for path in seen))
        self.assertNotEqual(output_paths[0], output_paths[1])
        self.assertTrue(all(not path.exists() for path in output_paths))


class DispatchGate(unittest.TestCase):
    def test_person_approved_current_entry_is_cleared(self):
        self.assertEqual(gate.blockers(reviewed(TG), NOW), [])

    def test_approvals_written_by_unaccountable_code_are_not_enough(self):
        self.assertIn("accepts only", " ".join(gate.blockers(reviewed(TG, "cmo_orchestrator"), NOW)))

    def test_cmo_approval_counts_in_cmo_mode_only(self):
        with patch.dict(queue.CONFIG["mode"], {"telegram": "cmo"}):
            self.assertEqual(gate.blockers(reviewed(TG, "agent:cmo"), NOW), [])
        with patch.dict(queue.CONFIG["mode"], {"telegram": "review"}):
            self.assertIn("accepts only human", " ".join(gate.blockers(reviewed(TG, "agent:cmo"), NOW)))

    def test_approved_status_alone_is_not_an_approval(self):
        # the old autopilot set status=approved itself, with no record of who looked at what
        self.assertIn("no approval record", " ".join(gate.blockers(TG, NOW)))

    def test_editing_after_approval_invalidates_it(self):
        entry = reviewed(TG)
        entry["text"] += "\nExtra line nobody reviewed."
        self.assertIn("edited after approval", " ".join(gate.blockers(entry, NOW)))

    def test_only_todays_open_slots_send(self):
        yesterday = {**reviewed(TG), "date": "2099-04-30", "scheduled_at": "2099-04-30T15:30:00Z"}
        self.assertIn("not today", " ".join(gate.blockers(yesterday, NOW)))
        missed = {**reviewed(TG), "scheduled_at": "2099-05-01T12:30:00Z"}
        self.assertIn("slot passed", " ".join(gate.blockers(missed, NOW)))
        early = {**reviewed(TG), "scheduled_at": "2099-05-01T18:30:00Z"}
        self.assertIn("not due until", " ".join(gate.blockers(early, NOW)))
        self.assertEqual(gate.blockers(early, NOW, due=False), [])

    def test_rules_added_after_approval_apply_to_old_approvals(self):
        entry = reviewed({**TG, "text": TG["text"] + "\nSub-50ms board sync inside Telegram."})
        self.assertIn("fails current QA", " ".join(gate.blockers(entry, NOW)))

    def test_auto_mode_needs_no_person_but_keeps_the_content_gates(self):
        with patch.dict(queue.CONFIG["mode"], {"telegram": "auto"}):
            self.assertEqual(gate.blockers(TG, NOW), [])
            self.assertTrue(gate.blockers({**TG, "text": "Earn $500 a day with guaranteed profit."}, NOW))


class CanvasStamp(unittest.TestCase):
    def post(self, **render):
        return {"id": "2099-05-01-tg-4", "date": "2099-05-01", "creative": {"template": "tip", "headline": "A", "cta_label": "B"},
                "render": {"ok": True, **render}}

    def test_image_without_engine_stamp_is_refused(self):
        self.assertIn("older renderer", " ".join(gate.canvas_blockers(self.post())))

    def test_image_drawn_by_old_templates_is_refused(self):
        self.assertIn("predates the current canvas", " ".join(gate.canvas_blockers(self.post(engine="studio", canvas="0ld"))))

    def test_current_stamp_still_needs_the_file(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(queue, "QUEUE", Path(directory)):
            post = self.post(engine="studio", canvas=renderer.canvas_version())
            self.assertIn("missing from disk", " ".join(gate.canvas_blockers(post)))
            (Path(directory) / "2099-05-01").mkdir()
            (Path(directory) / "2099-05-01" / "2099-05-01-tg-4.png").write_bytes(b"png")
            self.assertEqual(gate.canvas_blockers(post), [])

    def test_exact_positions_must_come_from_the_board_engine(self):
        post = {**self.post(engine="studio", canvas=renderer.canvas_version()), "chess": TG["chess"]}
        self.assertIn("need board", " ".join(gate.canvas_blockers(post)))

    def test_changing_a_template_changes_the_canvas_version(self):
        with tempfile.TemporaryDirectory() as directory:
            template = Path(directory) / "tip.mjs"
            template.write_text("v1")
            with patch.object(renderer, "_canvas_files", return_value=[template]), patch.object(renderer, "_canvas_memo", None):
                first = renderer.canvas_version()
                self.assertEqual(renderer.canvas_version(), first)
                template.write_text("v2 with a new layout")
                self.assertNotEqual(renderer.canvas_version(), first)

    def test_rerender_after_approval_requires_a_new_look(self):
        entry = {**reviewed({**self.post(engine="studio", canvas="old"), "status": "approved"})}
        entry["render"]["canvas"] = "new"
        self.assertIn("review the new image", " ".join(gate.approval_blockers(entry)))


class PublishersUseTheGate(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        patches = [patch.object(queue, "QUEUE", Path(self.directory.name)), patch.object(queue, "utcnow", return_value=NOW)]
        for p in patches:
            p.start()
            self.addCleanup(p.stop)
        self.addCleanup(self.directory.cleanup)

    def test_telegram_refuses_an_unreviewed_approved_post(self):
        queue.save(copy.deepcopy(TG))
        with self.assertRaisesRegex(ValueError, "no approval record"):
            telegram_publisher.publish_post_by_id(TG["id"], dry_run=True)
        self.assertEqual(telegram_publisher.publish_due(now=NOW, dry_run=True), [])

    def test_telegram_sends_the_reviewed_post(self):
        queue.save(reviewed(TG))
        self.assertEqual(telegram_publisher.publish_post_by_id(TG["id"], dry_run=True)["would_send"], "message")

    def test_x_dispatch_follows_the_same_rule(self):
        queue.save(copy.deepcopy(X))
        self.assertEqual(PublisherAgent().dispatch_x_posts(dry_run=True)["count"], 0)
        queue.save(reviewed(X))
        self.assertEqual(PublisherAgent().dispatch_x_posts(dry_run=True)["count"], 1)

    def test_autopilot_holds_back_the_legacy_backlog_and_says_why(self):
        queue.save(copy.deepcopy(X))
        with tempfile.TemporaryDirectory() as state, patch.object(autopilot, "STATE_FILE", Path(state) / "state.json"):
            held = autopilot.run_tick(dry_run=True, force_next=True, force_next_tg=True)
            self.assertEqual(held["x_dispatched"], [])
            self.assertIn("no approval record", " ".join(held["blocked"][X["id"]]))
            queue.save(reviewed(X))
            sent = autopilot.run_tick(dry_run=True, force_next=True, force_next_tg=True)
            self.assertEqual([item["id"] for item in sent["x_dispatched"]], [X["id"]])


class CmoRelease(unittest.TestCase):
    """cmo mode: the CMO agent approves automatically, and the approval is as binding as a person's."""
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        for p in (patch.object(queue, "QUEUE", Path(self.directory.name)), patch.object(queue, "utcnow", return_value=NOW),
                  patch.dict(queue.CONFIG["mode"], {"telegram": "cmo", "x": "cmo"})):
            p.start()
            self.addCleanup(p.stop)
        self.addCleanup(self.directory.cleanup)
        self.cmo = CmoAgent()

    def draft(self, base=TG, **fields):
        entry = {**base, "status": "draft", **fields}
        queue.save(entry)
        return entry

    def test_clean_current_draft_is_approved_with_a_binding_record(self):
        entry = self.draft()
        out = self.cmo.release_review(entry, NOW)
        stored = queue.load(TG["id"])
        self.assertEqual(out["decision"], "approved")
        self.assertEqual((stored["status"], stored["approval"]["by"]), ("approved", "agent:cmo"))
        self.assertEqual(gate.blockers(stored, NOW), [])
        stored["text"] += "\nEdited after the CMO approved."
        self.assertIn("edited after approval", " ".join(gate.blockers(stored, NOW)))

    def test_recycled_hooks_are_refused_not_approved(self):
        queue.save({**TG, "id": "2099-04-29-tg-4", "date": "2099-04-29", "status": "published", "scheduled_at": "2099-04-29T15:30:00Z"})
        out = self.cmo.release_review(self.draft(), NOW)
        self.assertEqual(out["decision"], "refused")
        self.assertIn("already ran", " ".join(out["reasons"]))
        self.assertEqual(queue.load(TG["id"])["status"], "draft")
        self.assertEqual(self.cmo.release_review(queue.load(TG["id"]), NOW)["decision"], "held")  # not re-argued every tick

    def test_date_badged_hooks_are_refused(self):
        out = self.cmo.release_review(self.draft(hook="Find the move before the clock does (Oct 25)"), NOW)
        self.assertIn("date badge", " ".join(out["reasons"]))

    def test_the_cmo_cannot_approve_what_the_gate_would_block(self):
        out = self.cmo.release_review(self.draft(text=TG["text"] + "\nSub-50ms board sync inside Telegram."), NOW)
        self.assertEqual(out["decision"], "refused")
        self.assertIn("fails current QA", " ".join(out["reasons"]))

    def test_late_and_legacy_entries_are_left_alone(self):
        late = self.draft(scheduled_at="2099-05-01T09:30:00Z", id="2099-05-01-tg-2")
        legacy = self.draft(id="2099-05-01-tg-viral-1")
        self.assertEqual({self.cmo.release_review(e, NOW)["decision"] for e in (late, legacy)}, {"skipped"})

    def test_dry_run_reports_without_approving(self):
        out = self.cmo.release_day(NOW, days=1, dry_run=True) if self.draft() else []
        self.assertEqual([d["decision"] for d in out], ["would approve"])
        self.assertEqual(queue.load(TG["id"])["status"], "draft")

    def test_autopilot_tick_runs_the_review_before_dispatch(self):
        self.draft(base=X, id="2099-05-01-x-4")  # slot 4 is the 15:00 X slot
        with tempfile.TemporaryDirectory() as state, patch.object(autopilot, "STATE_FILE", Path(state) / "state.json"):
            res = autopilot.run_tick(dry_run=True)
        self.assertEqual([d["decision"] for d in res["cmo_review"]], ["would approve"])


class ApproveCommand(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        for p in (patch.object(queue, "QUEUE", Path(self.directory.name)), patch.object(queue, "utcnow", return_value=NOW)):
            p.start()
            self.addCleanup(p.stop)
        self.addCleanup(self.directory.cleanup)

    def decide(self, command, entry_id):
        daily.cmd_decide(argparse.Namespace(command=command, ids=[entry_id], by="tester"))

    def test_approval_names_the_person_and_the_content_they_reviewed(self):
        queue.save({**TG, "status": "draft"})
        self.decide("approve", TG["id"])
        stored = queue.load(TG["id"])
        self.assertEqual((stored["status"], stored["approval"]["by"]), ("approved", "human:tester"))
        self.assertEqual(stored["approval"]["content"], gate.content_hash(stored))
        self.assertEqual(gate.blockers(stored, NOW), [])

    def test_a_draft_on_an_old_canvas_cannot_be_approved(self):
        queue.save({**TG, "status": "draft", "creative": {"template": "puzzle", "headline": "A", "cta_label": "B"}, "render": {"ok": True}})
        with self.assertRaises(SystemExit):
            self.decide("approve", TG["id"])
        self.assertEqual(queue.load(TG["id"])["status"], "draft")

    def test_rejecting_removes_the_approval(self):
        queue.save(reviewed(TG))
        self.decide("reject", TG["id"])
        stored = queue.load(TG["id"])
        self.assertEqual(stored["status"], "rejected")
        self.assertNotIn("approval", stored)


class QueueRepair(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        for p in (patch.object(queue, "QUEUE", Path(self.directory.name)), patch.object(queue, "utcnow", return_value=datetime(2099, 5, 1, 7, tzinfo=timezone.utc))):
            p.start()
            self.addCleanup(p.stop)
        self.addCleanup(self.directory.cleanup)
        self.now = queue.utcnow()

    def entry(self, entry_id, **fields):
        base = {**TG, "id": entry_id, "date": entry_id[:10], "scheduled_at": f"{entry_id[:10]}T06:30:00Z", **fields}
        queue.save(base)
        return base

    def test_repair_archives_legacy_entries_and_demotes_unreviewed_approvals(self):
        self.entry("2099-04-30-tg-1")                       # yesterday, never sent
        self.entry("2099-05-01-tg-viral-1")                 # five-post routine, outside the plan
        self.entry("2099-05-01-tg-1", approval={"by": "cmo_orchestrator"})  # in plan, approved by code
        self.entry("2099-05-01-tg-2", scheduled_at="2099-05-01T09:30:00Z", status="draft")
        self.entry("2099-04-30-tg-2", status="published")
        self.entry("2099-04-30-tg-3", status="failed")
        report = hygiene.repair(self.now, render=False)
        self.assertEqual(sorted(report["archived"]), ["2099-04-30-tg-1", "2099-05-01-tg-viral-1"])
        self.assertEqual(report["demoted"], ["2099-05-01-tg-1"])
        demoted = queue.load("2099-05-01-tg-1")
        self.assertEqual(demoted["status"], "draft")
        self.assertNotIn("approval", demoted)
        self.assertIn("held", demoted)
        self.assertTrue((queue.QUEUE / "_archive" / "2099-04-30" / "2099-04-30-tg-1.json").exists())
        self.assertFalse(queue.path_for("2099-04-30-tg-1").exists())
        self.assertEqual(queue.load("2099-04-30-tg-2")["status"], "published")
        self.assertEqual(queue.load("2099-04-30-tg-3")["status"], "failed")  # send outcome is reconciled by a person
        self.assertEqual({e["id"] for e in queue.all_entries()}, {"2099-05-01-tg-1", "2099-05-01-tg-2", "2099-04-30-tg-2", "2099-04-30-tg-3"})

    def test_review_sheet_lists_what_a_person_can_approve(self):
        self.entry("2099-05-01-tg-2", scheduled_at="2099-05-01T09:30:00Z", status="draft")
        with tempfile.TemporaryDirectory() as out:
            page, ready = review.build(Path(out), date(2099, 5, 1), 1)
        self.assertEqual(ready, ["2099-05-01-tg-2"])
        self.assertIn("daily.py approve 2099-05-01-tg-2", page)


class DaemonFreshness(unittest.TestCase):
    def test_fingerprint_follows_engine_sources_but_not_tests(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(queue, "HERE", Path(directory)):
            (Path(directory) / "pipeline").mkdir()
            (Path(directory) / "pipeline" / "config.json").write_text("{}")
            (Path(directory) / "pipeline" / "qa.py").write_text("x = 1")
            first = hygiene.engine_fingerprint()
            (Path(directory) / "test_qa.py").write_text("y = 2")
            self.assertEqual(hygiene.engine_fingerprint(), first)
            (Path(directory) / "pipeline" / "qa.py").write_text("x = 22")
            self.assertNotEqual(hygiene.engine_fingerprint(), first)

    def test_daemon_exits_for_a_restart_when_its_code_changes(self):
        with tempfile.TemporaryDirectory() as state, patch.object(autopilot, "STATE_FILE", Path(state) / "state.json"), \
                patch("signal.signal"), patch.object(hygiene, "engine_fingerprint", side_effect=["boot", "edited"]), \
                patch.object(autopilot, "run_tick") as tick:
            autopilot.daemon_loop(interval_seconds=1)
            tick.assert_not_called()
            self.assertEqual(autopilot.load_state()["daemon"]["fingerprint"], "boot")


if __name__ == "__main__":
    unittest.main()
