"""Offline tests for the partner lead engine: no network, temp databases only.

Run: python3 -m unittest discover -s marketing/leadgen -p 'test_*.py'
"""
import csv
import json
import os
import re
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "sources"))

import leadgen  # noqa: E402
import outreach  # noqa: E402
import scoring  # noqa: E402
import store  # noqa: E402
import tg_source  # noqa: E402
import yt_source  # noqa: E402

NOW = datetime(2026, 11, 12, 12, 0, tzinfo=timezone.utc)
BACKEND_MK = re.compile(r"^mk_[A-Za-z0-9_-]{1,61}$")
BACKEND_CAMPAIGN = re.compile(r"^[a-z0-9][a-z0-9_-]{0,63}$")


def preview(handle, title, description, subscribers, posts, members=False):
    counter = "members" if members else "subscribers"
    msgs = []
    for i, (text, views, days_ago) in enumerate(posts, 1):
        when = (NOW - timedelta(days=days_ago)).isoformat()
        msgs.append(f'''<div class="tgme_widget_message_wrap"><div class="tgme_widget_message" data-post="{handle}/{i}">
<div class="tgme_widget_message_text js-message_text">{text}</div>
<div class="tgme_widget_message_footer"><span class="tgme_widget_message_views">{views}</span>
<a class="tgme_widget_message_date" href="https://t.me/{handle}/{i}"><time datetime="{when}"></time></a></div></div></div>''')
    return f'''<html><body><div class="tgme_channel_info"><div class="tgme_channel_info_header_title">{title}</div>
<div class="tgme_channel_info_description">{description}</div>
<div class="tgme_channel_info_counter"><span class="counter_value">{subscribers}</span> <span class="counter_type">{counter}</span></div></div>
{''.join(msgs)}</body></html>'''


PAGES = {
    "chesstactics": preview("chesstactics", "Chess Tactics Daily", "Daily chess puzzles. Ads: @tactics_admin",
                            "12.4K", [("Mate in 2! White to move. More at https://t.me/endgamelab", "3.1K", 1),
                                      ("Chess opening trap via @blitzworld", "2.9K", 2), ("Puzzle of the day", "3.4K", 4)]),
    "endgamelab": preview("endgamelab", "Шахматы: эндшпиль", "Канал о шахматах. По вопросам рекламы: @lab_manager",
                          "4,210", [("Эндшпиль: ладья против пешки", "900", 2), ("Шахматная задача", "1.1K", 3)]),
    "blitzworld": preview("blitzworld", "Crypto Signals VIP", "pump signals vip", "50K", [("BTC to the moon", "1K", 1)]),
}


GROUP_PAGE = """<html><body><div class="tgme_page_title" dir="auto"><span>Rumah Catur Online</span></div>
<div class="tgme_page_extra">2 115 members, 40 online</div>
<div class="tgme_page_description">Grup catur untuk semua. Turnamen Lichess tiap minggu. Admin: @rc_admin</div></body></html>"""


class FakeFetcher:
    def __init__(self, pages):
        self.pages, self.requests = pages, 0

    def __call__(self, url):
        self.requests += 1
        handle = url.rstrip("/").split("/")[-1].split("?")[0]
        if "/s/" not in url and handle in self.pages:
            return self.pages[handle]
        if "/s/" in url and handle == "rumahcatur":
            return "<html><body></body></html>"  # groups have no public preview
        if handle == "rumahcatur":
            return GROUP_PAGE
        if handle not in self.pages:
            raise OSError("404")
        return self.pages[handle]


class Resp:
    def __init__(self, data):
        self.data = json.dumps(data).encode()

    def read(self, n=-1):
        return self.data

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class LeadgenTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        self.db = store.open_db(self.tmp / "leads.sqlite3")

    def tearDown(self):
        self.db.close()
        self._tmp.cleanup()

    def test_campaign_ids_satisfy_backend_attribution_rules(self):
        for handle in ["ChessTactics", "a" * 40, "x-y_z", "Шахматы", "@Mixed_Case_99"]:
            campaign = store.campaign_for("telegram", handle)
            self.assertTrue(BACKEND_MK.fullmatch(campaign) and BACKEND_CAMPAIGN.fullmatch(campaign.lower()), campaign)
        self.assertEqual(outreach.partner_link("mk_ptg_abc"), "https://t.me/chess_matbot?startapp=mk_ptg_abc")

    def test_language_relevance_and_contact(self):
        self.assertEqual(scoring.guess_language("Шахматы: эндшпиль", "Канал о шахматах"), "ru")
        self.assertEqual(scoring.guess_language("Ajedrez para todos", "partida del día"), "es")
        self.assertEqual(scoring.guess_language("آموزش شطرنج", "گروه"), "fa")
        self.assertGreater(scoring.relevance("Chess Tactics Daily", "", ["Mate in 2", "hello"]), 0.6)
        self.assertEqual(scoring.relevance("Crypto Signals", "pump", ["BTC"]), 0.0)
        self.assertEqual(scoring.contact_route("Daily puzzles. Ads: @tactics_admin | mail me x@y.com", "chesstactics"),
                         "tg:@tactics_admin email:x@y.com")
        self.assertEqual(scoring.contact_route("Powered by @somebot", "c"), "")

    def test_score_prefers_mid_size_active_reachable_chess_channels(self):
        good = {"relevance": 1.0, "audience": 12_000, "median_views": 3_000, "last_post_at": (NOW - timedelta(days=1)).isoformat(),
                "contact_route": "tg:@a", "language": "en", "platform": "telegram"}
        stale = dict(good, last_post_at=(NOW - timedelta(days=90)).isoformat(), contact_route="")
        offtopic = dict(good, relevance=0.1)
        total, reasons = scoring.score(good, now=NOW)
        self.assertGreaterEqual(total, 85)
        self.assertTrue(any("sweet spot" in r for r in reasons))
        self.assertLess(scoring.score(stale, now=NOW)[0], total - 20)
        self.assertLessEqual(scoring.score(offtopic, now=NOW)[0], 25)

    def test_snowball_crawl_profiles_spreads_and_skips(self):
        db = self.db
        store.add_frontier(db, "telegram", "chesstactics", "manual", 0)
        fetcher = FakeFetcher(PAGES)
        stats = tg_source.crawl(db, budget=10, fetcher=fetcher, now=NOW)
        # the crawl follows what it finds in the same run: t.me link -> endgamelab, @mention -> blitzworld
        self.assertEqual((stats["new_leads"], stats["frontier_added"], stats["skipped"], stats["requests"]), (2, 2, 1, 3))
        lead = store.get(db, "telegram:endgamelab")
        self.assertEqual((lead["language"], lead["audience"], lead["contact_route"]), ("ru", 4210, "tg:@lab_manager"))
        self.assertEqual(lead["discovered_from"], "tg:chesstactics")
        self.assertIsNone(store.get(db, "telegram:blitzworld"))  # negative term: skipped, never a lead
        statuses = dict(db.execute("SELECT handle, status FROM frontier").fetchall())
        self.assertTrue(statuses["blitzworld"].startswith("skipped"))
        self.assertEqual(statuses["chesstactics"], "profiled")
        self.assertEqual(tg_source.crawl(db, budget=10, fetcher=fetcher, now=NOW)["requests"], 0)  # nothing re-fetched
        store.add_frontier(db, "telegram", "handleone", "m", 0)
        store.add_frontier(db, "telegram", "handletwo", "m", 0)
        self.assertEqual(tg_source.crawl(db, budget=1, fetcher=fetcher, now=NOW)["requests"], 1)  # budget is a hard cap

    def test_groups_without_preview_are_profiled_from_their_page(self):
        store.add_frontier(self.db, "telegram", "rumahcatur", "seed-csv", 0)
        fetcher = FakeFetcher({})
        stats = tg_source.crawl(self.db, budget=5, fetcher=fetcher, now=NOW)
        self.assertEqual((stats["new_leads"], stats["requests"]), (1, 2))
        lead = store.get(self.db, "telegram:rumahcatur")
        self.assertEqual((lead["segment"], lead["audience"], lead["language"], lead["contact_route"]),
                         ("telegram_chess_group", 2115, "id", "tg:@rc_admin"))

    def test_slate_mixes_platforms(self):
        for i in range(6):
            store.upsert(self.db, {"platform": "telegram", "handle": f"tgchess{i}", "name": f"Chess {i}", "segment": "telegram_chess_channel",
                                   "relevance": 1.0, "audience": 10_000, "median_views": 4_000, "contact_route": "tg:@a",
                                   "last_post_at": NOW.isoformat(), "language": "en"})
        store.upsert(self.db, {"platform": "youtube", "handle": "ytchess", "name": "YT Chess", "segment": "youtube_chess_creator",
                               "relevance": 0.8, "audience": 40_000, "contact_route": "email:a@b.co", "language": "en"})
        leadgen.rescore(self.db, now=NOW)
        slate = leadgen.build_slate(self.db, dict(leadgen.DEFAULTS, slate_size=3, min_score=10), now=NOW)
        platforms = [r["platform"] for r in slate["queued"]]
        self.assertEqual(len(platforms), 3)
        self.assertIn("youtube", platforms)

    def test_discovery_never_overwrites_stage_or_notes(self):
        db = self.db
        lead = tg_source.profile("chesstactics", PAGES["chesstactics"], now=NOW)[0]
        self.assertTrue(store.upsert(db, lead))
        store.set_stage(db, "telegram:chesstactics", "contacted", "sent to @tactics_admin")
        lead["audience"] = 13_000
        self.assertFalse(store.upsert(db, lead))
        row = store.get(db, "telegram:chesstactics")
        self.assertEqual((row["stage"], row["audience"]), ("contacted", 13_000))
        self.assertIn("tactics_admin", row["notes"])

    def test_slate_report_drafts_and_followups(self):
        db = self.db
        with mock.patch.object(leadgen, "REPORTS", self.tmp):
            for handle in ("chesstactics", "endgamelab"):
                store.upsert(db, tg_source.profile(handle, PAGES[handle], now=NOW)[0])
            leadgen.rescore(db, now=NOW)
            cfg = dict(leadgen.DEFAULTS, min_score=10)
            slate = leadgen.build_slate(db, cfg, now=NOW)
            self.assertEqual({r["id"] for r in slate["queued"]}, {"telegram:chesstactics", "telegram:endgamelab"})
            store.set_stage(db, "telegram:endgamelab", "contacted", next_action_at=store.iso(NOW - timedelta(hours=1)))
            slate = leadgen.build_slate(db, cfg, now=NOW)
            self.assertEqual([r["id"] for r in slate["followups"]], ["telegram:endgamelab"])
            text = leadgen.write_report(db, slate, [{"source": "telegram", "requests": 3}]).read_text()
        self.assertIn("startapp=mk_ptg_chesstactics", text)
        self.assertIn("Send to: **tg:@tactics_admin**", text)
        self.assertIn("Ещё раз здравствуйте", text)  # Russian channel gets the Russian follow-up
        self.assertNotIn("free friend", text.lower())
        self.assertNotIn("guarantee", text.lower())

    def test_outreach_copy_matches_current_product_rules(self):
        for segment, langs in outreach.OFFERS.items():
            for lang, text in langs.items():
                low = text.lower()
                self.assertIn("{link}", text, (segment, lang))
                for banned in ("free match", "free game against", "earn money", "guaranteed", "prize", "бесплатный матч"):
                    self.assertNotIn(banned, low, (segment, lang, banned))
                if "usdt" in low or "ставк" in low or "stake" in low:
                    self.assertTrue("18+" in text or "adults" in low, (segment, lang))

    def test_mark_schedules_followups_and_stops_after_two(self):
        db = self.db
        store.upsert(db, tg_source.profile("chesstactics", PAGES["chesstactics"], now=NOW)[0])
        args = type("A", (), {"lead_id": "telegram:chesstactics", "stage": "contacted", "note": "sent"})
        leadgen.cmd_mark(db, args, leadgen.DEFAULTS)
        self.assertIsNotNone(store.get(db, "telegram:chesstactics")["next_action_at"])
        args.stage = "followup_2"
        leadgen.cmd_mark(db, args, leadgen.DEFAULTS)
        self.assertIsNone(store.get(db, "telegram:chesstactics")["next_action_at"])  # no third nudge
        with self.assertRaises(ValueError):
            store.set_stage(db, "telegram:chesstactics", "spam_everyone")

    def test_import_seeds_and_sync_metrics(self):
        db = self.db
        seeds = self.tmp / "seeds.csv"
        with open(seeds, "w", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["segment", "name", "platform", "handle_or_url", "language", "audience_size", "audience_size_source",
                        "activity_evidence", "contact_route", "fit_notes", "priority"])
            w.writerow(["telegram_chess_channel", "X", "telegram", "https://t.me/s/SomeChess", "en", "", "", "", "unknown", "", "1"])
            w.writerow(["youtube_chess_creator", "Coach Y", "youtube", "https://www.youtube.com/@CoachY", "en", "45,000", "vidIQ",
                        "", "email:biz@coachy.com", "tactics", "1"])
            w.writerow(["telegram_chess_group", "Private", "telegram", "https://t.me/joinchat/abc", "en", "", "", "", "", "", "2"])
        self.assertEqual(leadgen.cmd_import(db, seeds), {"leads_added": 1, "telegram_queued": 1, "skipped": 1})
        row = store.get(db, "youtube:coachy")
        self.assertEqual((row["audience"], row["campaign"]), (45_000, "mk_pyt_coachy"))
        store.set_stage(db, "youtube:coachy", "partner")
        export = self.tmp / "metrics.json"
        export.write_text(json.dumps({"sources": [{"campaign": "mk_pyt_coachy", "registrations": 7, "players": 4},
                                                  {"campaign": "community", "registrations": 3, "players": 1}]}))
        self.assertEqual(leadgen.cmd_sync(db, export), {"sources": 2, "matched_leads": 1})
        row = store.get(db, "youtube:coachy")
        self.assertEqual((row["registrations"], row["players"], row["stage"]), (7, 4, "active"))

    def test_youtube_discovery_without_key_is_a_no_op(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            stats = yt_source.discover(self.db, key=None)
        self.assertEqual(stats["requests"], 0)
        self.assertIn("not set", stats["note"])

    def test_youtube_discovery_filters_and_feeds_telegram(self):
        def opener(request, timeout=20):
            if "/search?" in request.full_url:
                return Resp({"items": [{"id": {"channelId": "UC1"}}, {"id": {"channelId": "UC2"}}]})
            return Resp({"items": [
                {"id": "UC1", "snippet": {"title": "Chess With Ana", "customUrl": "@chesswithana",
                                          "description": "Chess lessons. Telegram: t.me/anachesschat business: ana@mail.com"},
                 "statistics": {"subscriberCount": "52000", "videoCount": "100", "viewCount": "5000000"}},
                {"id": "UC2", "snippet": {"title": "Cooking Show", "description": "recipes"},
                 "statistics": {"subscriberCount": "90000", "videoCount": "10", "viewCount": "100"}}]})

        stats = yt_source.discover(self.db, key="k", searches=1, opener=opener)
        self.assertEqual((stats["new_leads"], stats["skipped"]), (1, 1))
        row = store.get(self.db, "youtube:chesswithana")
        self.assertEqual(row["audience"], 52_000)
        self.assertIn("email:ana@mail.com", row["contact_route"])
        frm = self.db.execute("SELECT discovered_from FROM frontier WHERE handle='anachesschat'").fetchone()[0]
        self.assertEqual(frm, "yt:chesswithana")


if __name__ == "__main__":
    unittest.main()
