import json, sys, tempfile, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pipeline import brand, chesscheck, idea_bank, qa, queue, renderer, site_publisher, telegram_publisher, writer

class IdeaBank(unittest.TestCase):
    def test_every_idea_is_verified(self):
        for item in idea_bank.IDEAS:
            self.assertEqual(idea_bank.verify(item), [], item["id"])

    def test_false_claims_are_rejected(self):
        self.assertTrue(chesscheck.verify_puzzle("6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", ["Ra8#"], "mate_in_2"))
        self.assertTrue(chesscheck.verify_puzzle("6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", ["Rb1"], "mate_in_1"))
        self.assertTrue(chesscheck.verify_puzzle("6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", ["Qh5"], None))

class Qa(unittest.TestCase):
    base = {"id": "2026-10-11-tg-1", "category": "Tactics", "format": "puzzle", "cta": "puzzle", "hook": "Find the move before the clock does",
            "text": "<b>Find the move before the clock does</b>\nWhite to move. Three pawns guard the king, and one rook decides it.",
            "chess": {"fen": "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", "solution": ["Ra8#"], "claim": "mate_in_1"}, "sources": []}

    def test_clean_post_passes(self):
        self.assertEqual(qa.check_telegram(self.base), {"passed": True, "issues": []})

    def test_copied_wording_fails(self):
        post = {**self.base, "sources": [{"kind": "competitor", "excerpt": "Three pawns guard the king, and one rook decides it every time"}]}
        self.assertFalse(qa.check_telegram(post)["passed"])

    def test_wager_needs_disclosure(self):
        post = {**self.base, "format": "product", "cta": "arena", "chess": None, "text": "<b>Open the Arena</b>\nPick a time control and find an opponent."}
        self.assertFalse(qa.check_telegram(post)["passed"])
        post["text"] += "\nUSDT matches are for adults (18+) where permitted. You can lose your stake."
        self.assertTrue(qa.check_telegram(post)["passed"], qa.check_telegram(post))

    def test_income_claims_fail(self):
        post = {**self.base, "text": "<b>Hook</b>\nEarn $500 a day with guaranteed profit."}
        self.assertFalse(qa.check_telegram(post)["passed"])

    def test_unknown_links_and_startapp_fail(self):
        self.assertTrue(qa.check_link("https://evil.example/x"))
        self.assertTrue(qa.check_link("https://t.me/chess_matbot/Web3Chess?startapp=promo123"))
        self.assertEqual(qa.check_link("https://t.me/chess_matbot/Web3Chess?startapp=arena"), [])

    def test_html_balance(self):
        self.assertTrue(qa.telegram_html("<b>open")[0])
        self.assertTrue(qa.telegram_html("fish & chips")[0])
        self.assertEqual(qa.telegram_html("<b>ok</b> &amp; <i>fine</i>")[0], [])

class Utm(unittest.TestCase):
    def test_utm_only_on_web_links(self):
        self.assertEqual(brand.with_utm(brand.TG_APP, "c", "i"), brand.TG_APP)
        self.assertIn("utm_campaign=tactics", brand.with_utm(brand.SITE + "/academy", "tactics", "x"))

FEN = "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1"

class Creative(unittest.TestCase):
    post = {"chess": {"fen": FEN}, "creative": {"template": "puzzle", "headline": "White to play.", "cta_label": "Answer", "fen": FEN}}

    def test_consistent_creative_passes(self):
        self.assertEqual(renderer.check(self.post), [])

    def test_intel_template_passes(self):
        post = {
            "creative": {
                "template": "intel",
                "headline": "Why Masters NEVER Premove",
                "cta_label": "Analyze live position",
                "category": "ENDGAME DISCIPLINE",
                "score": "98.4 / 100",
                "metrics": [
                    {"val": "+3.42", "label": "EVAL CRUSH"},
                    {"val": "0.04s", "label": "LATENCY"},
                ],
                "blueprint": "24.Rd7! cuts the king along the 7th rank",
            }
        }
        self.assertEqual(renderer.check(post), [])

    def test_image_must_show_the_checked_position(self):
        other = {**self.post, "creative": {**self.post["creative"], "fen": "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1"}}
        self.assertTrue(any("differs" in i for i in renderer.check(other)))

    def test_unknown_template_and_missing_fields(self):
        self.assertTrue(renderer.check({"creative": {"template": "billboard"}}))
        self.assertTrue(renderer.check({"creative": {"template": "puzzle", "headline": "x"}}))

    def test_wager_copy_in_image_needs_the_adult_line(self):
        bad = {"creative": {"template": "tip", "headline": "Stake 10 USDT", "cta_label": "Go", "steps": ["a", "b"]}}
        self.assertTrue(any("18+" in i for i in renderer.check(bad)))
        ok = {"creative": {**bad["creative"], "footer": "USDT matches are for adults (18+) where permitted. You can lose your stake."}}
        self.assertEqual(renderer.check(ok), [])

    def test_income_claims_in_image_fail(self):
        self.assertTrue(renderer.check({"creative": {"template": "tip", "headline": "Earn $500 a day", "cta_label": "Go", "steps": ["a", "b"]}}))

    def test_news_needs_a_source_credit(self):
        self.assertTrue(any("source" in i for i in renderer.check({"creative": {"template": "news", "headline": "h", "cta_label": "c", "subhead": "s"}})))

    def test_studio_promo_requires_approved_layout_and_claims(self):
        project = {
            "version": 1, "format": "square", "width": 1080, "height": 1080, "theme": "canvas",
            "title": "PLAY FROM TELEGRAM", "subtitle": "Open the board", "cta": "Play chess",
            "tag": "Chess", "urlLabel": "web3chess.online", "note": "No stake needed",
            "proofs": ["Open the app", "Choose a match", "Make a move"],
            "proofIcons": ["telegram-logo", "strategy", "target"],
            "layers": [{"kind": "sculpture"}],
        }
        post = {"creative": {"template": "product", "headline": "PLAY FROM TELEGRAM", "cta_label": "Play chess", "studio": project}}
        self.assertEqual(renderer.check(post), [])
        self.assertTrue(any("exact board" in i for i in renderer.check({**post, "chess": {"fen": FEN}})))
        self.assertTrue(any("banned claim" in i for i in renderer.check({"creative": {**post["creative"], "studio": {**project, "title": "Earn $500 a day"}}})))
        self.assertTrue(any("size" in i for i in renderer.check({"creative": {**post["creative"], "studio": {**project, "width": 900}}})))

    def test_promotional_posts_are_bound_to_an_editable_studio_project(self):
        post = {
            "id": "2099-01-01-tg-product", "kind": "telegram", "category": "Product", "cta": "play",
            "creative": {"template": "product", "headline": "PLAY IN TELEGRAM", "subhead": "Choose how to play",
                         "tag": "Product flow", "cta_label": "Open the Mini App",
                         "steps": ["Open the Mini App", "Choose how to play", "Make your first move"]},
        }
        renderer.prepare(post)
        studio = post["creative"]["studio"]
        self.assertEqual(studio["urlLabel"], "t.me")
        self.assertEqual(studio["title"], "PLAY IN TELEGRAM")
        self.assertEqual(studio["proofs"], post["creative"]["steps"])
        self.assertEqual(studio["layers"][0]["kind"], "sculpture")
        self.assertEqual(renderer.check(post), [])

    def test_exact_position_posts_never_receive_studio_art(self):
        post = {**self.post, "id": "2099-01-01-tg-board", "kind": "telegram", "category": "Tactics"}
        renderer.prepare(post)
        self.assertNotIn("studio", post["creative"])

    def test_studio_destination_and_caption_binding_are_enforced(self):
        post = {
            "id": "2099-01-01-tg-product", "kind": "telegram", "category": "Product", "cta": "play",
            "creative": {"template": "product", "headline": "PLAY IN TELEGRAM", "subhead": "Choose how to play",
                         "tag": "Product flow", "cta_label": "Open the Mini App"},
        }
        renderer.prepare(post)
        post["creative"]["studio"]["title"] = "UNRELATED CAMPAIGN"
        post["creative"]["studio"]["urlLabel"] = "web3chess.online"
        issues = renderer.check(post)
        self.assertTrue(any("title must match" in issue for issue in issues))
        self.assertTrue(any("CTA destination" in issue for issue in issues))

    def test_reveal_needs_a_verified_position_and_sane_delay(self):
        post = {**self.post, "reveal": {"after_hours": 7, "text": "Solved", "creative": {"template": "puzzle", "reveal": True, "moves": ["Nf7#"], "headline": "h", "cta_label": "c", "fen": FEN}}}
        self.assertEqual(renderer.check(post), [])
        self.assertTrue(renderer.check({**post, "reveal": {**post["reveal"], "after_hours": 60}}))
        self.assertTrue(renderer.check({"creative": None, "reveal": post["reveal"]}))

class Publisher(unittest.TestCase):
    def test_creative_without_image_never_falls_back_to_text(self):
        with self.assertRaises(RuntimeError):
            telegram_publisher.publish({"id": "x", "text": "t", "creative": {"template": "puzzle"}, "cta": "play"}, dry_run=True)

    def test_text_only_dry_run(self):
        out = telegram_publisher.publish({"id": "x", "text": "t", "cta": "play", "category": "Tactics"}, dry_run=True)
        self.assertEqual(out["would_send"], "message")

    def test_publish_due_handles_missing_scheduled_at_without_crashing(self):
        day = queue.QUEUE / "2099-01-01"
        day.mkdir(parents=True, exist_ok=True)
        try:
            entry = {
                "id": "2099-01-01-tg-1",
                "kind": "telegram",
                "date": "2099-01-01",
                "status": "approved",
                "text": "test post",
                "cta": "play",
                "category": "Tactics",
            }
            (day / "2099-01-01-tg-1.json").write_text(json.dumps(entry))
            report = telegram_publisher.publish_due(day="2099-01-01", dry_run=True)
            self.assertEqual(report, [])
        finally:
            (day / "2099-01-01-tg-1.json").unlink(missing_ok=True)
            if day.exists():
                day.rmdir()


class BlogCreative(unittest.TestCase):
    def test_stages_exact_blog_canvas_with_editable_project(self):
        with tempfile.TemporaryDirectory(dir=queue.ROOT) as tmp:
            folder = Path(tmp)
            image = folder / "blog.png"
            project = folder / "blog.project.json"
            image.write_bytes(b"\x89PNG\r\n\x1a\n" + b"\0" * 8 + (1200).to_bytes(4, "big") + (630).to_bytes(4, "big"))
            project.write_text(json.dumps({"version": 1, "format": "custom", "width": 1200, "height": 630}))
            out = folder / "out"
            original = site_publisher.SOCIAL_ART
            site_publisher.SOCIAL_ART = out
            try:
                result = site_publisher._stage_blog_creative({"blog_creative": {
                    "image": str(image.relative_to(queue.ROOT)),
                    "project": str(project.relative_to(queue.ROOT)),
                }}, "reviewed-article")
            finally:
                site_publisher.SOCIAL_ART = original
            self.assertIsNotNone(result)
            self.assertTrue((out / "reviewed-article.png").exists())
            self.assertTrue((out / "reviewed-article.project.json").exists())

class WagerWords(unittest.TestCase):
    def test_substrings_do_not_trigger_the_wager_rule(self):
        self.assertEqual(qa.compliance("A costly mistake in a great spot with potential."), [])

    def test_real_wager_words_still_do(self):
        self.assertTrue(qa.compliance("Put a stake on the arena match."))
        self.assertTrue(qa.compliance("Your stakes are real."))

    def test_no_wager_required_is_not_a_wager_promotion(self):
        self.assertEqual(qa.compliance("No deposit and no wager are required"), [])


class Claims(unittest.TestCase):
    def test_unsupported_prize_and_latency_claims_fail(self):
        base = {"text": "The $500 USDT vault closes soon with sub-50ms sync", "hook": "A live vault",
                "creative": {"template": "product", "headline": "A live vault", "cta_label": "Open"}}
        issues = qa.evidence_claims(base)
        self.assertGreaterEqual(len(issues), 2)

    def test_verified_claim_evidence_must_match_and_use_an_allowed_source(self):
        post = {"text": "The $500 USDT prize is live", "hook": "Verified campaign",
                "creative": {"template": "product", "headline": "Verified campaign", "cta_label": "Open"},
                "claim_evidence": [{"claim": "$500 USDT prize", "source": "https://web3chess.online/rules", "verified": True}]}
        self.assertEqual(qa.evidence_claims(post), [])

class Queue(unittest.TestCase):
    def test_render_specs_are_not_queue_entries(self):
        day = queue.QUEUE / "2099-01-01"
        day.mkdir(parents=True, exist_ok=True)
        try:
            (day / "x-tg-1.spec.json").write_text('{"template": "puzzle"}')
            self.assertEqual(queue.all_entries(day="2099-01-01"), [])
        finally:
            (day / "x-tg-1.spec.json").unlink(); day.rmdir()

class Plan(unittest.TestCase):
    def test_configured_slots_are_three_hours_apart_and_use_known_pillars(self):
        cfg = queue.CONFIG["telegram"]
        hours = [int(s[:2]) * 60 + int(s[3:]) for s in cfg["slots_utc"]]
        self.assertGreaterEqual(len(hours), 5)
        self.assertTrue(all(b - a >= queue.CONFIG["telegram"]["min_gap_hours"] * 60 for a, b in zip(hours, hours[1:])))
        for day, pillars in cfg["rotation"].items():
            self.assertEqual(len(pillars), len(hours), day)
            self.assertTrue(set(pillars) <= set(brand.CATEGORIES), day)
        # wager content only on Wednesday evening, and never beside youth-adjacent Academy slots
        self.assertEqual([d for d, p in cfg["rotation"].items() if "Match Rules" in p], ["wed"])

    def test_brief_carries_audit_patterns_for_the_pillar(self):
        brief = writer.brief_for({"id": "x", "kind": "telegram", "date": "2026-10-11", "slot": 1, "category": "Tactics", "scheduled_at": "2026-10-11T07:30:00Z"})
        self.assertIn("avoid", brief["competitor_patterns"])
        self.assertEqual(brief["creative_default"]["template"], "puzzle")

if __name__ == "__main__":
    unittest.main()
