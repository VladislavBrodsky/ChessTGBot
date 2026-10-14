"""Content Engine Orchestrator: Multi-Agent Workflow Coordinator.

Unifies CMO, Scraper, Audit, Planner, Chess Editor, SMM Copywriter, QA Compliance,
and Publisher agents into a high-performance content engine for Web3Chess (web3chess.online).
"""
from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .cmo import CmoAgent, StrategicDirective
from .scraper import ScraperAgent
from .audit import AuditAgent
from .planner import PlannerAgent
from .chess_editor import ChessEditorAgent
from .smm_copywriter import SmmCopywriterAgent
from .qa_compliance import QaComplianceAgent
from .publisher import PublisherAgent
from pipeline import queue, brand, renderer


class ContentEngineOrchestrator:
    """Master orchestrator managing autonomous and supervised content flows."""

    def __init__(self, plan_date: Optional[date] = None, primary_domain: str = "web3chess.online"):
        self.plan_date = plan_date or queue.utcnow().date()
        self.primary_domain = primary_domain
        self.cmo = CmoAgent(directive=StrategicDirective(primary_domain=self.primary_domain))
        self.scraper = ScraperAgent()
        self.audit = AuditAgent()
        self.planner = PlannerAgent(self.plan_date)
        self.chess_editor = ChessEditorAgent()
        self.copywriter = SmmCopywriterAgent(primary_domain=self.primary_domain)
        self.qa = QaComplianceAgent()
        self.publisher = PublisherAgent()

    def run_strategy_and_audit(self) -> Dict[str, Any]:
        """Runs CMO strategy alignment and competitive audit research."""
        strategy = self.cmo.get_strategy_brief()
        trends = self.scraper.get_curated_trend_signals()
        guardrails = self.audit.get_guardrails()
        return {
            "strategy": strategy,
            "trending_topics": trends,
            "guardrails": guardrails,
        }

    def plan_day(self, target_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """Invokes Planner to structure the day's slots."""
        d = target_date or self.plan_date
        return self.planner.generate_daily_plan(d)

    def create_first_flagship_post(self) -> Dict[str, Any]:
        """Creates and validates the first flagship viral FOMO post and paired blog article for web3chess.online.

        Topic: Smothered Mate & The 3-Second Blitz Scramble
        Hook: 'White to move. One knight move. Black's own rook closes the door.'
        Pillar: Tactics & Speed Chess Mastery
        """
        today_str = self.plan_date.isoformat()
        slot_id = f"{today_str}-tg-1"

        # 1. Chess verification via Chess Editor
        tactics_spec = self.chess_editor.get_stock_viral_position("smothered_mate")
        verification = self.chess_editor.verify_position_and_solution(
            tactics_spec["fen"], tactics_spec["solution"], tactics_spec["claim"]
        )
        if not verification["valid"]:
            raise RuntimeError(f"Chess editor failed verification: {verification['issues']}")

        # 2. Draft Telegram post via Copywriter Agent
        tg_post = self.copywriter.draft_viral_telegram_post(
            slot_id=slot_id,
            category="Tactics",
            hook="White to move. One knight move ends the game on the spot",
            body=(
                "Black's king on h8 is boxed in by its own rook on g8 and pawns on g7 and h7.\n\n"
                "Pick the winning move and react below:\n"
                "❤ Nf7#   🔥 Nxh7   👏 Ne6\n\n"
                "A knight check cannot be blocked. Answer reveal lands in replies at 14:30 UTC."
            ),
            cta="play",
            fen=tactics_spec["fen"],
            solution=tactics_spec["solution"],
            claim=tactics_spec["claim"],
            reveal_text=(
                "<b>Solved: Nf7#.</b>\n\n"
                "The king on h8 has no flight square: g8 holds its own rook, g7 and h7 hold its own pawns.\n"
                "A knight check cannot be blocked, and nothing on the board can capture on f7.\n\n"
                "Nxh7 fails to Kxh7, and Ne6 allows Black to untangle. The smothered mate is the ultimate lesson in luft."
            ),
        )

        # 3. Deterministic QA check
        qa_result = self.qa.inspect_telegram_post(tg_post)
        if not qa_result["passed"]:
            raise RuntimeError(f"QA inspection failed: {qa_result['issues']}")

        # 4. Attach and save into queue
        entry = queue.load(slot_id) if queue.path_for(slot_id).exists() else tg_post
        entry.update({
            k: v for k, v in tg_post.items()
            if k in {"hook", "text", "cta", "creative", "chess", "sources", "format", "reveal", "category"}
        })
        entry["qa"] = {**qa_result, "checked_at": queue.iso(queue.utcnow())}
        queue.set_status(entry, "approved", approved_by="cmo_orchestrator")
        queue.save(entry)

        # 5. Draft and stage the paired high-converting Blog article for web3chess.online
        art_id = f"{today_str}-art-1"
        existing_art_entry = queue.load(art_id) if queue.path_for(art_id).exists() else None
        
        if existing_art_entry and existing_art_entry.get("article"):
            blog_article = existing_art_entry["article"]
        else:
            article_slug = "smothered-mate-king-boxed-in-by-its-own-pieces"
            article_takeaways = [
                "List every check first. Here, the knight has exactly one, and it is mate.",
                "A king in the corner has three neighbouring squares. If its own pieces fill them, a knight check ends the game.",
                "A knight check cannot be blocked, which is why this pattern is so hard to defend once it appears.",
                "A forcing sacrifice can drag an enemy piece into the last empty square next to the king.",
                "Check your own corner king too: give it luft before a rook and pawns box it in.",
            ]
            article_blocks = [
                {
                    "type": "paragraph",
                    "text": "Most kings are chased into trouble. A few build the trouble themselves. In the position below, Black has a rook and two pawns against a lone knight, and White to move still ends the game at once. Give it a minute before you read on."
                },
                {
                    "type": "chess_position",
                    "fen": "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
                    "caption": "White to move. Black's king on h8 is surrounded by its own rook on g8 and pawns on g7 and h7. Find the only checking move."
                },
                {
                    "type": "heading",
                    "text": "Checks first, then the only check"
                },
                {
                    "type": "paragraph",
                    "text": "In any forcing position, list the checks before anything else. White's knight on g5 has exactly one checking move: Nf7+. Captures such as Nxh7 look greedy and fail to Kxh7, which leaves White a piece down for nothing. Quiet knight moves hand Black a free turn to untangle. The check is the one move that asks a question Black has to answer."
                },
                {
                    "type": "paragraph",
                    "text": "Now ask how Black could answer it. A king in check has three options: capture the checking piece, block the line, or step away. After Nf7+, none of them exists."
                },
                {
                    "type": "list",
                    "items": [
                        "Capture: the king on h8 is two files from f7, so it cannot take the knight. The rook on g8 moves along its rank and file, and f7 sits on a diagonal from it. The pawns on g7 and h7 capture towards f6 and h6, never f7.",
                        "Block: a knight jumps over everything in between, so there is no line to block.",
                        "Step away: the king's only neighbouring squares are g8, g7 and h7, and Black's own rook and pawns occupy every one of them."
                    ]
                },
                {
                    "type": "paragraph",
                    "text": "That is checkmate, written 1.Nf7#. The final position is below."
                },
                {
                    "type": "chess_position",
                    "fen": "6rk/5Npp/8/8/8/8/8/6K1 b - - 1 1",
                    "moves": ["Nf7#"],
                    "caption": "After 1.Nf7#. The king has no square, the knight cannot be captured and cannot be blocked.",
                    "initialFen": "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1"
                },
                {
                    "type": "heading",
                    "text": "The pattern: a king boxed in by its own pieces"
                },
                {
                    "type": "paragraph",
                    "text": "A king in the corner has only three neighbouring squares. When friendly pieces fill all three, the king has no flight square, and the attacker needs just one check that cannot be captured or blocked. Knights are ideal for the job because they jump the wall. The mate has a name that explains itself: smothered, because the king is smothered by its own army."
                },
                {
                    "type": "list",
                    "items": [
                        "Is the enemy king on the edge, ideally in a corner, with three or fewer neighbouring squares?",
                        "Are those squares occupied by its own rook, queen or pawns?",
                        "Can a knight reach a checking square where it cannot be captured?"
                    ]
                },
                {
                    "type": "paragraph",
                    "text": "The scan works in reverse as well. If your own king sits in the corner with a rook beside it and pawns in front, you have built the same box. One pawn move that gives the king a flight square, usually called luft, can turn a deadly pattern into an ordinary position. It costs a tempo and saves games."
                },
                {
                    "type": "heading",
                    "text": "A second board: build the box with a sacrifice"
                },
                {
                    "type": "paragraph",
                    "text": "Sometimes the box has one missing wall, and you can force your opponent to fill it. Look at the next position. Black's king on h8 has pawns on g7 and h7, but g8 is empty and the rook stands on f8. White has a queen on b3 and knights on e7 and g5."
                },
                {
                    "type": "chess_position",
                    "fen": "5r1k/4N1pp/8/6N1/8/1Q6/8/6K1 w - - 0 1",
                    "caption": "White to move and mate in two. The knight on e7 guards g8, and the queen on b3 aims along the diagonal at the same square."
                },
                {
                    "type": "paragraph",
                    "text": "The idea is 1.Qg8+. The queen lands next to the king, and Black has exactly one legal reply, 1...Rxg8. The king cannot capture the queen because the knight on e7 protects it, and every other square is blocked. That capture finishes the box: Black's rook now stands on g8, exactly where White wanted it. Then 2.Nf7# is the same smothered mate as before."
                },
                {
                    "type": "chess_position",
                    "fen": "6rk/4NNpp/8/8/8/8/8/6K1 b - - 1 2",
                    "moves": ["Qg8+", "Rxg8", "Nf7#"],
                    "caption": "After 1.Qg8+ Rxg8 2.Nf7#. Black's own rook supplied the last wall.",
                    "initialFen": "5r1k/4N1pp/8/6N1/8/1Q6/8/6K1 w - - 0 1"
                },
                {
                    "type": "heading",
                    "text": "Practise it"
                },
                {
                    "type": "list",
                    "items": [
                        "Set up the first position on a board and play 1.Nf7# until the picture is automatic.",
                        "In your next few games, pause before each knight move and count the enemy king's free neighbouring squares.",
                        "Check your own corner king the same way before you place a rook beside it. If it has no free neighbour, give it luft."
                    ]
                },
                {
                    "type": "callout",
                    "text": "Smothered mate in one sentence: if a king's neighbours are all its own pieces, a knight check ends the game."
                }
            ]
            blog_article = {
                "slug": article_slug,
                "title": "Smothered Mate: When a King Is Boxed In by Its Own Pieces",
                "subtitle": "A knight check cannot be blocked. Add a king with no free square and the game is over.",
                "excerpt": "Learn the smothered mate with two verified positions: how a corner king gets boxed in by its own rook and pawns, and how a queen sacrifice builds the box.",
                "metaDescription": "Learn the smothered mate with two verified positions. See how a king boxed in by its own pieces falls to a knight check, and how a sacrifice builds the trap.",
                "category": "Tactics",
                "author": {
                    "name": "Web3Chess Editorial",
                    "role": "Chess and product editorial",
                    "avatar": "",
                    "kind": "Organization"
                },
                "publishedAt": self.plan_date.isoformat(),
                "readingTime": "4 min read",
                "takeaways": article_takeaways,
                "content": article_blocks,
                "relatedSlugs": [
                    "opening-mastery-tactics",
                    "the-3-minute-blitz-blueprint-tactics-time-management"
                ],
                "sources": [
                    {
                        "title": "Smothered mate, definition and Philidor's legacy (Wikipedia)",
                        "url": "https://en.wikipedia.org/wiki/Smothered_mate"
                    },
                    {
                        "title": "Back-rank checkmate and luft (Wikipedia)",
                        "url": "https://en.wikipedia.org/wiki/Back-rank_checkmate"
                    }
                ],
                "cta": {
                    "label": "Practise tactics in the Academy",
                    "href": "/academy"
                }
            }

        # QA check on article
        art_qa = self.qa.inspect_blog_article(blog_article)
        if not art_qa["passed"]:
            raise RuntimeError(f"Article QA failed: {art_qa['issues']}")

        # Save article to queue and stage to blog
        art_entry = existing_art_entry or {
            "id": art_id, "kind": "article", "date": today_str, "slot": 1, "category": "Tactics",
            "scheduled_at": f"{today_str}T05:00:00Z", "status": "draft"
        }
        art_entry["article"] = blog_article
        art_entry["qa"] = {**art_qa, "checked_at": queue.iso(queue.utcnow())}
        queue.set_status(art_entry, "approved", approved_by="cmo_orchestrator")
        queue.save(art_entry)

        # Stage to website blog directory
        stage_result = self.publisher.stage_article_to_blog(art_entry)

        return {
            "status": "success",
            "telegram_post": {
                "id": slot_id,
                "hook": tg_post["hook"],
                "text": tg_post["text"],
                "cta": tg_post["cta"],
                "status": entry["status"],
            },
            "blog_article": {
                "id": art_id,
                "slug": blog_article.get("slug"),
                "title": blog_article["title"],
                "staged_path": stage_result.get("staged_path"),
            },
            "qa_summary": {
                "telegram_passed": qa_result["passed"],
                "article_passed": art_qa["passed"],
            },
        }

    def generate_full_daily_batch(self, target_date: Optional[date] = None) -> Dict[str, Any]:
        """Generates, verifies, approves and stages the complete 5 Telegram posts and 5 Blog articles for the day."""
        d = target_date or self.plan_date
        today_str = d.isoformat()
        self.plan_day(d)

        # -------------------------------------------------------------
        # 1. THE 5 TELEGRAM POSTS
        # -------------------------------------------------------------
        tg_specs = [
            # S1: Tactics - Arabian Mate
            {
                "slot": 1,
                "category": "Tactics",
                "hook": "White to move. The knight guards the escape squares. Find the mate",
                "body": (
                    "Black's king on h8 is locked down by White's knight on f6.\n"
                    "One rook move delivers instant checkmate.\n\n"
                    "Pick the winning move and react below:\n"
                    "❤ Rh7#   🔥 Ra8+   👏 Ne8\n\n"
                    "The king cannot capture what is protected. Full tactical breakdown lands at 14:30 UTC."
                ),
                "cta": "play",
                "fen": "7k/R7/5N2/8/8/8/8/6K1 w - - 0 1",
                "solution": ["Rh7#"],
                "claim": "mate_in_1",
                "reveal_text": (
                    "<b>Solved: Rh7#. The Arabian Mate.</b>\n\n"
                    "The knight on f6 covers g8 and h7, preventing the king from stepping away while simultaneously defending the rook on h7.\n"
                    "Because the rook is defended, the king cannot capture it.\n"
                    "Ra8+ fails to allow escape or lacks protection. In the corner, a rook and knight form an inescapable net."
                ),
            },
            # S2: Chess News - Digital Clock Scramble
            {
                "slot": 2,
                "category": "Chess News",
                "hook": "3 seconds on the digital clock. That was the margin between a win and a flag fall",
                "body": (
                    "Speed chess in 2026 is decided in the final five moves of the scramble.\n"
                    "When clocks dip under 10 seconds, calculation gives way to muscle memory and premove discipline.\n\n"
                    "Three golden rules for time trouble:\n"
                    "• Stop looking for perfection; find the forcing check.\n"
                    "• Never premove recaptures when your opponent has a check.\n"
                    "• Keep pawns connected so you never lose on pre-click lag.\n\n"
                    "The Web3Chess Mini App uses sub-50ms synchronized server clocks so your speed is never stolen by lag."
                ),
                "cta": "play",
                "fen": None,
                "solution": None,
                "claim": None,
                "reveal_text": None,
            },
            # S3: Academy / Openings - Blackburne-Shilling Trap
            {
                "slot": 3,
                "category": "Openings",
                "hook": "White grabbed the free pawn on e5. Seven moves later, checkmate arrived on f3",
                "body": (
                    "The Blackburne-Shilling Gambit looks like a beginner blunder when Black plays 3...Nd4.\n"
                    "White thought: \"A free pawn on e5 with an attack on f7!\"\n"
                    "Then came 4.Nxe5? Qg5! and White's king never saw move 8.\n\n"
                    "Greedy play in the opening gets punished fast.\n"
                    "The refutation is simple: 4.Nxd4! exd4 5.O-O, leaving White with superior development and complete center control.\n\n"
                    "Review the full refutation and trap defense inside the Academy."
                ),
                "cta": "academy",
                "fen": None,
                "solution": None,
                "claim": None,
                "reveal_text": None,
            },
            # S4: Chess Culture - Zwischenzug / Premove Delusion
            {
                "slot": 4,
                "category": "Chess Culture",
                "hook": "You premoved a recapture. Your opponent played an in-between check. Familiar pain?",
                "body": (
                    "The German masters named it a century ago: <i>Zwischenzug</i> (the in-between move).\n"
                    "In 3-minute blitz, 80% of lost pieces come from assuming the opponent will play the expected move.\n\n"
                    "Before you snatch a bishop back, ask:\n"
                    "Does my opponent have a forcing check first?\n\n"
                    "If they do, your premove just gave away a rook.\n"
                    "Train your eye to spot intermediate moves before your opponent spots them for you."
                ),
                "cta": "play",
                "fen": None,
                "solution": None,
                "claim": None,
                "reveal_text": None,
            },
            # S5: Product - Arena Flash Alert
            {
                "slot": 5,
                "category": "Product",
                "hook": "Arena Alert: The 20:00 UTC Blitz Arena registration locks in 15 minutes",
                "body": (
                    "⚡ <b>The night's premier global tournament window is open.</b>\n\n"
                    "3-Minute Blitz • Synchronized matchmaking • $500 USDT Vault.\n"
                    "Double-elimination bracket with live spectator room for community chat.\n\n"
                    "USDT matches are for adults (18+) where permitted. You can lose your stake.\n"
                    "Once the countdown hits zero, pairings lock automatically."
                ),
                "cta": "arena",
                "fen": None,
                "solution": None,
                "claim": None,
                "reveal_text": None,
            },
        ]

        tg_results = []
        for s in tg_specs:
            slot_id = f"{today_str}-tg-{s['slot']}"
            if s["category"] == "Product":
                post = self.copywriter.draft_fomo_arena_alert(
                    slot_id=slot_id,
                    tournament_name="Daily Blitz Vault ($500 USDT)",
                    start_time_utc="20:00 UTC",
                    minutes_remaining=15,
                )
            else:
                post = self.copywriter.draft_viral_telegram_post(
                    slot_id=slot_id,
                    category=s["category"],
                    hook=s["hook"],
                    body=s["body"],
                    cta=s["cta"],
                    fen=s["fen"],
                    solution=s["solution"],
                    claim=s["claim"],
                    reveal_text=s["reveal_text"],
                )
            qa_res = self.qa.inspect_telegram_post(post)
            if not qa_res["passed"]:
                raise RuntimeError(f"Post {slot_id} QA failed: {qa_res['issues']}")

            entry = queue.load(slot_id) if queue.path_for(slot_id).exists() else post
            entry.update({k: v for k, v in post.items() if k in {"hook", "text", "cta", "creative", "chess", "sources", "format", "reveal", "category"}})
            entry["qa"] = {**qa_res, "checked_at": queue.iso(queue.utcnow())}
            queue.set_status(entry, "approved", approved_by="cmo_orchestrator")
            queue.save(entry)
            tg_results.append({"id": slot_id, "hook": post["hook"], "status": "approved"})

        # -------------------------------------------------------------
        # 2. THE 5 BLOG ARTICLES FOR AUMERA.TOP
        # -------------------------------------------------------------
        article_specs = [
            # Art 1: Tactics - Arabian Mate
            {
                "slot": 1,
                "slug": "arabian-mate-rook-and-knight-coordination",
                "title": "The Arabian Mate: Ancient Geometry and Modern Speed Chess Finish",
                "subtitle": "The knight covers the flight squares while defending the rook on the edge.",
                "excerpt": "Master the Arabian mate with verified positions. Discover how the rook and knight coordinate to deliver inescapable checkmate against a cornered king.",
                "category": "Tactics",
                "reading_time": "4 min read",
                "cta_href": "/play",
                "cta_label": "Practice in Free A.I. Arena",
                "takeaways": [
                    "The knight and rook coordinate to form a complete mating net against a corner king.",
                    "A knight on the sixth rank (f6 or c6) covers both escape squares in the corner.",
                    "Because the knight directly protects the rook, the defender cannot capture the checking piece.",
                    "The pattern originated over 1,200 years ago in Shatranj and remains one of the most common blitz endings today.",
                ],
                "content": [
                    {
                        "type": "paragraph",
                        "text": "Few tactical geometries possess the longevity and lethal simplicity of the Arabian mate. Dating back over a millennium to Arabic Shatranj manuscripts from the 8th century, this two-piece combination remains one of the most decisive finishing weapons in modern 3-minute blitz. When a king is cornered, the board contracts into a tiny box where escaping squares are scarce and every tempo counts double."
                    },
                    {
                        "type": "chess_position",
                        "fen": "7k/R7/5N2/8/8/8/8/6K1 w - - 0 1",
                        "caption": "White to move. The knight on f6 seals the escape squares while defending the h7 outpost. Find the finishing strike."
                    },
                    {
                        "type": "heading",
                        "text": "The Geometry of the Escape Denial"
                    },
                    {
                        "type": "paragraph",
                        "text": "To execute the Arabian mate, an attacking knight establishes a dominant post on f6. From f6, the knight attacks g8 and h7. This dual-square coverage accomplishes two simultaneous tactical objectives: it deprives the Black king on h8 of its only legal diagonal escape square (g8), and it creates a protected landing strip for the white rook on h7. Because the knight directly guards h7, the Black king cannot capture the checking piece."
                    },
                    {
                        "type": "paragraph",
                        "text": "When White plays 1.Rh7#, the check is terminal. The rook attacks the king along the h-file. The king cannot step to g8 because the knight controls that square. The king cannot capture the rook on h7 because the knight directly defends it. And because a rook check is linear and delivered from point-blank range, no black piece can interpose. The game concludes in a textbook mating net."
                    },
                    {
                        "type": "heading",
                        "text": "Creating the Setup with Forcing Moves"
                    },
                    {
                        "type": "paragraph",
                        "text": "In practical play, the enemy king rarely walks into the corner voluntarily. Attackers must use forcing checks and piece sacrifices to herd the king toward the rim. A common tactical theme involves checking on the eighth rank to force the king into the corner, followed by transferring a rook along the seventh rank. Because the seventh rank is a natural highway for rooks, combining a seventh-rank rook with an advanced knight creates constant tactical threats that defenders struggle to neutralize."
                    },
                    {
                        "type": "paragraph",
                        "text": "In fast speed chess inside the Web3Chess Mini App, players often miss the setup because they search for complex queen combinations. The Arabian mate requires only two minor pieces operating in harmony. When you notice an enemy king isolated in a corner, immediately calculate whether your knight can reach the f6 or f3 outpost with tempo."
                    },
                    {
                        "type": "heading",
                        "text": "Step-by-Step Calculation Protocol"
                    },
                    {
                        "type": "list",
                        "items": [
                            "Step 1: Identify whether the opponent king is restricted to the corner h8 square or adjacent edge squares.",
                            "Step 2: Maneuver your knight to f6 to control both the escape square (g8) and the mate square (h7).",
                            "Step 3: Transfer your rook to the open seventh rank and deliver Rh7# with zero defensive interposition.",
                            "Step 4: Check for defensive resources such as back-rank checks before launching the final rook leap."
                        ]
                    },
                    {
                        "type": "callout",
                        "text": "Core Rule: A cornered king cannot survive against a coordinated rook and knight once the knight controls the escape flight squares."
                    }
                ],
            },
            # Art 2: Openings - Blackburne-Shilling Trap
            {
                "slot": 2,
                "slug": "survive-the-blackburne-shilling-gambit-trap",
                "title": "Survive the Blackburne-Shilling Gambit: Punish Greedy Blitz Traps",
                "subtitle": "When Black plays 3...Nd4 in the Italian Game, grabbing the e5 pawn walks straight into disaster.",
                "excerpt": "Learn how to spot and punish the Blackburne-Shilling Gambit. See why grabbing the e5 pawn fails and how 4.Nxd4 neutralizes Black trap.",
                "category": "Openings",
                "reading_time": "5 min read",
                "cta_href": "/academy",
                "cta_label": "Explore Opening Academy",
                "takeaways": [
                    "Black move 3...Nd4 violates opening principles by moving the same piece twice, but sets a deadly trap.",
                    "Grabbing the free e5 pawn with 4.Nxe5 walks directly into 4...Qg5, threatening both the knight and the g2 pawn.",
                    "Greedy play on f7 allows Black to deliver a smothered checkmate with 7...Nf3#.",
                    "White completely refutes the gambit by playing 4.Nxd4! exd4 5.O-O, maintaining superior development and control.",
                ],
                "content": [
                    {
                        "type": "paragraph",
                        "text": "The Italian Game (1.e4 e5 2.Nf3 Nc6 3.Bc4) is one of the most popular chess openings in history. However, blitz tournaments on Telegram are filled with speculative gambiteers looking for instant knockouts. One of the most famous traps is the Blackburne-Shilling Gambit, where Black plays 3...Nd4. This move openly defies classical opening principles by moving the same minor piece twice in the first three turns."
                    },
                    {
                        "type": "chess_position",
                        "fen": "r1bqkbnr/pppp1ppp/8/4N3/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 0 4",
                        "caption": "After White greedy 4.Nxe5?. The e5 pawn is poisoned, and Black queen counterattack is decisive."
                    },
                    {
                        "type": "heading",
                        "text": "How the Trap Snaps Shut"
                    },
                    {
                        "type": "paragraph",
                        "text": "Unprepared White players look at 3...Nd4 and assume Black made an elementary beginner mistake. The pawn on e5 appears undefended, and taking it with 4.Nxe5 attacks the vulnerable f7 square. But Black real idea is 4...Qg5! Suddenly, Black attacks White knight on e5 and the undefended pawn on g2. The white pieces are overextended, and the king remains uncastled in the center of the board."
                    },
                    {
                        "type": "paragraph",
                        "text": "If White continues greedily with 5.Nxf7, hoping for a royal fork of Black queen and rook, Black replies 5...Qxg2. White rook on h1 is trapped and cannot escape without heavy losses. After 6.Rf1 Qxe4+ 7.Be2, Black delivers the stunning smothered finish 7...Nf3#. White is checkmated with almost all pieces still on their starting squares, demonstrating how quickly early pawn greed can prove fatal."
                    },
                    {
                        "type": "heading",
                        "text": "The Correct Refutation: Play for Development"
                    },
                    {
                        "type": "paragraph",
                        "text": "Refuting opening traps does not require tactical wizardry; it requires discipline. When Black plays 3...Nd4, White simply trades off the jumping knight: 4.Nxd4! exd4 5.O-O. Black has spent two valuable tempi to trade their knight for White, leaving White safely castled with rapid development, open diagonals for bishops, and natural control of the central files."
                    },
                    {
                        "type": "paragraph",
                        "text": "Another completely playable alternative is 4.c3, kicking the knight back immediately and preparing to claim the center with d2-d4. By refusing to accept the bait on e5, White ensures that Black strange opening experiment results only in backward development and a weakened pawn structure on d4."
                    },
                    {
                        "type": "heading",
                        "text": "Why Central Control Trumps Material in Blitz"
                    },
                    {
                        "type": "paragraph",
                        "text": "Speed chess encourages impulsive pawn grabs because players believe an extra pawn guarantees an endgame win. In reality, opening initiatives are far more potent in 3-minute blitz than a solitary pawn advantage. When Black plays an offbeat sideline like 3...Nd4, do not try to punish them on the spot by force. Punish them positionally: complete king safety, open files for your rooks, and let their uncoordinated pieces collapse under natural pressure."
                    },
                    {
                        "type": "heading",
                        "text": "Key Defensive Principles Against Early Traps"
                    },
                    {
                        "type": "list",
                        "items": [
                            "Never grab central pawns without verifying your opponent queen activity and potential counter-forks.",
                            "When an opponent moves the same minor piece twice in the opening, look to trade it or castle safely.",
                            "Remember that 4.Nxd4 leaves Black with doubled d-pawns and zero tactical counterplay across the board."
                        ]
                    },
                    {
                        "type": "callout",
                        "text": "A tactical trap is only dangerous if you accept the bait. Trade off the active attacker and win on positional superiority."
                    }
                ],
            },
            # Art 3: Academy - The Art of Zwischenzug
            {
                "slot": 3,
                "slug": "the-art-of-the-in-between-move-zwischenzug",
                "title": "The Art of the In-Between Move: How Zwischenzug Wins Blitz Games",
                "subtitle": "Recapturing automatically is the fastest way to lose rating. Find the intermediate check first.",
                "excerpt": "Break the autopilot recapture habit. Learn how intermediate moves and forcing in-between checks turn lost positions into tactical brilliancies.",
                "category": "Academy",
                "reading_time": "5 min read",
                "cta_href": "/play",
                "cta_label": "Sharpen Your Tactics in Play",
                "takeaways": [
                    "Automatic recapturing is the most common tactical failure mode in 3-minute blitz.",
                    "A Zwischenzug (in-between move) disrupts the opponent expected exchange sequence.",
                    "Checks and captures take absolute priority over passive recaptures.",
                    "Pausing for two seconds before an obvious recapture can discover game-winning tactical intermediate moves.",
                ],
                "content": [
                    {
                        "type": "paragraph",
                        "text": "In competitive speed chess, human intuition operates on momentum. When your opponent captures your bishop, your brain automatically fires a reflex: capture them back immediately. This autopilot instinct is responsible for thousands of lost games every single day across all skill ratings. Breaking this cognitive habit is one of the quickest paths to gaining tactical rating points."
                    },
                    {
                        "type": "chess_position",
                        "fen": "r1bqkb1r/pppp1ppp/2n5/4P3/4n3/5N2/PPP2PPP/RNBQKB1R w KQkq - 1 5",
                        "caption": "White to move. Look for forcing intermediate ideas rather than routine passive defensive moves."
                    },
                    {
                        "type": "heading",
                        "text": "What is an In-Between Move?"
                    },
                    {
                        "type": "paragraph",
                        "text": "In German chess literature, this concept is called a Zwischenzug—an in-between move. Instead of playing the anticipated continuation, a player inserts a forcing check, threat, or capture that alters the evaluation of the board before resolving the original exchange. Because the intermediate move is forcing, the opponent cannot proceed with their original plan and is forced onto the defensive."
                    },
                    {
                        "type": "paragraph",
                        "text": "Consider a standard piece trade. If White takes Black knight on c6, Black natural reply is bxc6. But what if Black first plays ...Qh4+, forcing White king into the center or ruining their pawn structure, before recapturing on c6? That intermediate check completely changes the outcome of the game, turning a quiet exchange into a dynamic winning advantage for Black."
                    },
                    {
                        "type": "heading",
                        "text": "The Hierarchy of Forcing Moves"
                    },
                    {
                        "type": "paragraph",
                        "text": "Finding a Zwischenzug under clock pressure requires an established calculation filter. When looking at candidate moves during an opponent offensive, evaluate choices in strict order: checks come first, followed by direct captures of undefended pieces, followed by threats against high-value queens or rooks. Only after exhausting these forcing options should you settle for an automatic recapture."
                    },
                    {
                        "type": "heading",
                        "text": "Intermediate Moves in the Endgame"
                    },
                    {
                        "type": "paragraph",
                        "text": "Zwischenzugs are not restricted to complex middlegames; they decide simplified king and pawn endings with ruthless finality. An in-between check can deflect an enemy king away from defending a key pawn, or an intermediate pawn advance can cut off an opposing rook file before a promotion square is claimed. In fast endgames, inserting one single checking move often determines whether a pawn promotes with tempo or falls one square short of a queen."
                    },
                    {
                        "type": "paragraph",
                        "text": "When calculating forcing lines in blitz, remember that every threat limits the opponent choices. A quiet move allows them complete freedom of action, but an intermediate check forces their king to move, often stepping into a pin or blocking their own rooks. Practice recognizing intermediate checks during your daily puzzle training sessions."
                    },
                    {
                        "type": "heading",
                        "text": "The 3-Second Calculation Protocol"
                    },
                    {
                        "type": "paragraph",
                        "text": "To integrate the in-between move into your blitz instincts, build a strict two-step habit whenever an opponent initiates an exchange:"
                    },
                    {
                        "type": "list",
                        "items": [
                            "Step 1: Do not touch the mouse or screen immediately after a capture occurs.",
                            "Step 2: Ask: Do I have a forcing check that the opponent cannot ignore?",
                            "Step 3: Ask: Can I attack a higher-value piece (such as the queen) before taking back?",
                            "Step 4: Execute the intermediate move with confidence when the calculation confirms safety."
                        ]
                    },
                    {
                        "type": "callout",
                        "text": "Grandmasters do not calculate deeper than club players; they calculate forcing in-between moves that club players assume do not exist."
                    }
                ],
            },
            # Art 4: Chess News / Trends - Digital Clock Psychology
            {
                "slot": 4,
                "slug": "digital-clock-psychology-flagging-vs-increment-in-online-blitz",
                "title": "Digital Clock Psychology: Flagging, Delay, and Time Scramble Strategy",
                "subtitle": "In 3-minute blitz, seconds are as valuable as pawns. Master clock management and latency.",
                "excerpt": "Understand the mathematics and psychology of digital chess clocks. Discover how top blitz players manage the final 10 seconds and avoid flagging.",
                "category": "Chess News",
                "reading_time": "5 min read",
                "cta_href": "/play",
                "cta_label": "Test Your Speed on the Board",
                "takeaways": [
                    "In 3-minute blitz without increment, clock time is a physical piece on the board.",
                    "Pre-moving during a scramble carries severe risks if the opponent possesses intermediate checks.",
                    "Maintaining a 15-second time advantage forces the defender to commit tactical blunders.",
                    "Server latency compensation ensures Web3Chess matches are decided by calculation, not packet delay.",
                ],
                "content": [
                    {
                        "type": "paragraph",
                        "text": "In tournament chess, Garry Kasparov once famously noted that time is the third dimension of the board alongside space and material. In modern online blitz, time is often the only dimension that matters when the digital clock drops below twenty seconds. Players who dominate fast speed chess understand that the clock is not merely a referee; it is a tactical weapon."
                    },
                    {
                        "type": "heading",
                        "text": "The Mathematics of the Scramble"
                    },
                    {
                        "type": "paragraph",
                        "text": "In a 3+0 time control (3 minutes with zero increment per move), each player has exactly 180 seconds to complete the entire game. If an average blitz contest lasts 40 moves, each decision must be finalized in approximately 4.5 seconds. Spending 30 seconds on an opening novelty leaves you with less than two seconds per move for the endgame, virtually guaranteeing a time scramble blunder."
                    },
                    {
                        "type": "paragraph",
                        "text": "Top blitz tacticians practice time banking: they blitz out verified opening theory in the first ten moves, banking a 20-to-30 second surplus over their opponent. When tactical complications arrive on move 20, they can invest precious seconds while the opponent panics under the ticking red clock. This psychological imbalance forces the opponent to play hastily and blunder material."
                    },
                    {
                        "type": "heading",
                        "text": "The Psychology of Time Trouble Allocation"
                    },
                    {
                        "type": "paragraph",
                        "text": "A reliable pacing model divides your 180 seconds into three distinct phases: allocate 35 seconds to reach move 12 in the opening, 85 seconds to navigate middlegame complications up to move 30, and reserve 60 seconds for precision endgame play. If you find yourself spending more than 15 seconds on a single decision outside of a forced combination, make a solid practical move and preserve clock balance."
                    },
                    {
                        "type": "heading",
                        "text": "The Hidden Danger of Pre-moves"
                    },
                    {
                        "type": "paragraph",
                        "text": "Pre-moving is essential in bullet and sudden-death scrambles, but careless pre-moves lose hundreds of games every hour. A pre-moved recapture fails disastrously when the opponent plays an unexpected check or an in-between pawn push. The cardinal rule of pre-moving is simple: only pre-move when the opponent response is completely forced, such as responding to a double check or an inescapable checkmate sequence."
                    },
                    {
                        "type": "heading",
                        "text": "Sub-50ms Latency and Fair Speed Play"
                    },
                    {
                        "type": "paragraph",
                        "text": "Lag has historically ruined speed chess on mobile devices. The Web3Chess Telegram Mini App features authoritative clock synchronization with WebSocket ping compensation, ensuring that player moves register with zero local execution delay and fair time accounting across all devices."
                    },
                    {
                        "type": "list",
                        "items": [
                            "Never drop below 15 seconds unless you have a completely forced winning sequence on the board.",
                            "In dead-drawn endgames, play active moves with tempo rather than passive defense to maintain initiative.",
                            "Use premoves only when the opponent reply is strictly forced and cannot diverge from the expected path."
                        ]
                    },
                    {
                        "type": "callout",
                        "text": "A master player with 5 seconds will beat a beginner with 2 minutes. But two equal players will always be decided by who respects the digital clock."
                    }
                ],
            },
            # Art 5: Chess Culture - Synchronous Arena Matchmaking
            {
                "slot": 5,
                "slug": "synchronous-arena-matchmaking-vs-stale-queues",
                "title": "Synchronous Tournament Matchmaking: Why Scheduled Game Drops Beat Dead Queues",
                "subtitle": "Concentrating player liquidity into four global daily windows creates peak competition and fair pairings.",
                "excerpt": "Explore the architecture of synchronous chess arenas. See why daily scheduled tournament drops deliver faster matchmaking, tighter ratings, and higher stakes.",
                "category": "Chess Culture",
                "reading_time": "5 min read",
                "cta_href": "/play",
                "cta_label": "Join Today Arena Window",
                "takeaways": [
                    "Asynchronous matchmaking often leads to long wait times and rating mismatches.",
                    "Synchronized daily arena windows concentrate thousands of active players simultaneously.",
                    "Scheduled tournament drops create authentic FOMO and spectator community excitement.",
                    "Double-elimination formats guarantee that bad luck in one game does not eliminate a strong player.",
                ],
                "content": [
                    {
                        "type": "paragraph",
                        "text": "Online gaming has long struggled with the empty lobby dilemma: players log in at random hours, wait two minutes in a matchmaking queue, face an opponent 300 rating points away, and log off frustrated. In Q4 2026, competitive speed gaming has evolved toward synchronous event drops that concentrate audience attention into high-energy windows."
                    },
                    {
                        "type": "heading",
                        "text": "The Four Global Liquidity Windows"
                    },
                    {
                        "type": "paragraph",
                        "text": "Instead of diluting player activity across 24 hours, Web3Chess anchors global matchmaking to four daily tournament windows: 02:00, 08:00, 14:00, and 20:00 UTC. By synchronizing start times across Europe, Asia, and the Americas, thousands of players enter the matchmaking queue at the exact same second, creating instant game pairings with near-zero waiting time."
                    },
                    {
                        "type": "paragraph",
                        "text": "The result is instant pairings, tightly matched Elo ratings, and a lively community spectator lounge where eliminated players watch the quarter-finals and finals live in real time. Because the pool is dense, rating inflation and smurfing are substantially reduced compared to fragmented random matching."
                    },
                    {
                        "type": "heading",
                        "text": "Anti-Collusion and Rating Integrity"
                    },
                    {
                        "type": "paragraph",
                        "text": "In open 24-hour queues, bad actors can attempt to synchronize button clicks to match against colluding accounts or burner bots. Synchronous tournament brackets completely eliminate this vulnerability. Pairings are generated deterministically by the matchmaking server using Swiss and double-elimination seedings, preventing players from handpicking their opponents or farming artificial rating gains."
                    },
                    {
                        "type": "paragraph",
                        "text": "Player ratings in synchronous arenas reflect genuine head-to-head performance under uniform time controls. By competing against a broad cross-section of active tacticians in scheduled rounds, players receive an accurate rating calibration that measures speed, tactical sharpness, and competitive composure under real tournament pressure."
                    },
                    {
                        "type": "heading",
                        "text": "Community Spectating and Social Proof"
                    },
                    {
                        "type": "paragraph",
                        "text": "Chess is as thrilling to watch as it is to play. During live tournament windows, top-board matches broadcast to Telegram group chats and channel feeds, creating social proof and genuine excitement around the best tactical players on the leaderboard. Spectators can follow every brilliancy and blunder with real-time evaluation graphs."
                    },
                    {
                        "type": "heading",
                        "text": "Competitive Integrity and Transparent Settlement"
                    },
                    {
                        "type": "paragraph",
                        "text": "Transparent rules ensure player trust. In decided matches, the pot is settled transparently with 95% awarded to the victor, 3% retained for platform maintenance, and 2% allocated to community referral pools. USDT matches are for adults (18+) where permitted. You can lose your stake. Having verifiable rules guarantees that competitive integrity remains paramount."
                    },
                    {
                        "type": "list",
                        "items": [
                            "02:00 UTC: Asia-Pacific speed chess primetime and early tactical blitz.",
                            "08:00 UTC: European morning blitz & warm-up arena tournament bracket.",
                            "14:00 UTC: Global midday masterclass tournament with high-density matchmaking.",
                            "20:00 UTC: Americas evening championship and high-stakes prize vault action."
                        ]
                    },
                    {
                        "type": "callout",
                        "text": "True competitive integrity requires real competition. Scheduled arenas bring the world best speed chess minds to the same board at the same time."
                    }
                ],
            },
        ]

        art_results = []
        for a in article_specs:
            slot_id = f"{today_str}-art-{a['slot']}"
            article_doc = self.copywriter.draft_seo_blog_article(
                slug=a["slug"],
                title=a["title"],
                subtitle=a["subtitle"],
                excerpt=a["excerpt"],
                category=a["category"],
                takeaways=a["takeaways"],
                content_blocks=a["content"],
                reading_time=a["reading_time"],
                cta_href=a["cta_href"],
                cta_label=a["cta_label"],
            )
            qa_res = self.qa.inspect_blog_article(article_doc)
            if not qa_res["passed"]:
                raise RuntimeError(f"Article {a['slug']} QA failed: {qa_res['issues']}")

            entry = queue.load(slot_id) if queue.path_for(slot_id).exists() else {
                "id": slot_id, "kind": "article", "date": today_str, "slot": a["slot"], "category": a["category"],
                "scheduled_at": f"{today_str}T{queue.CONFIG['site']['slots_utc'][a['slot']-1]}:00Z", "status": "draft"
            }
            entry["article"] = article_doc
            entry["qa"] = {**qa_res, "checked_at": queue.iso(queue.utcnow())}
            queue.set_status(entry, "approved", approved_by="cmo_orchestrator")
            queue.save(entry)

            # Stage into website/src/content/articles/
            stage_res = self.publisher.stage_article_to_blog(entry)
            art_results.append({
                "id": slot_id,
                "slug": a["slug"],
                "title": a["title"],
                "staged_path": stage_res.get("staged_path"),
            })

        return {
            "status": "success",
            "date": today_str,
            "telegram_posts_created": len(tg_results),
            "blog_articles_created": len(art_results),
            "telegram_posts": tg_results,
            "blog_articles": art_results,
        }

    def generate_telegram_daily_batch(self, target_date: Optional[date] = None, render_images: bool = True) -> Dict[str, Any]:
        """Generates, verifies, renders, and stages 8 daily Telegram posts spaced every 3 hours.
        
        Pillars:
        - TG-1 (00:00 UTC): Tactics Puzzle (Back rank with 7h spoiler reveal)
        - TG-2 (03:00 UTC): Opening Trap (Blackburne-Shilling Gambiteer lesson)
        - TG-3 (06:00 UTC): Arena Vault FOMO (Morning Vault countdown with 18+ wager disclaimer)
        - TG-4 (09:00 UTC): Academy Pro Tip (Candidate move calculation & prophylactic thinking)
        - TG-5 (12:00 UTC): Speed Chess Culture (Zwischenzug / Premove tilt)
        - TG-6 (15:00 UTC): Match Rules & Fair Play (95% pot return & zero-cheat engine)
        - TG-7 (18:00 UTC): Product Architecture (Sub-50ms sync on Bot API 8.0)
        - TG-8 (21:00 UTC): Evening Tactics Puzzle (Arabian Mate with 7h spoiler reveal)
        """
        d = target_date or self.plan_date
        d_str = d.isoformat()
        results: List[Dict[str, Any]] = []

        slots_utc = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"]

        # 1. TG-1: Tactics
        p1 = self.copywriter.draft_viral_telegram_post(
            slot_id=f"{d_str}-tg-1",
            category="Tactics",
            hook="White to move. Black's king is boxed in. Spot the 1-move mate",
            body=(
                "Black's king on g8 has three pawns acting as walls.\n"
                "One rook move delivers instant checkmate.\n\n"
                "❤ Ra8#   🔥 Rd1   👏 f4\n"
                "Answer reveals in 7 hours."
            ),
            cta="play",
            fen="6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
            solution=["Ra8#"],
            claim="mate_in_1",
            reveal_text=(
                "<b>Solved: 1. Ra8#.</b>\n\n"
                "The back rank is completely undefended, delivering instantaneous checkmate."
            ),
        )
        p1["scheduled_at"] = f"{d_str}T{slots_utc[0]}:00Z"

        # 2. TG-2: Opening Trap
        p2 = self.copywriter.draft_opening_trap_telegram_post(
            slot_id=f"{d_str}-tg-2",
            trap_name="Blackburne-Shilling Gambit",
            hook="White grabbed the free pawn on e5. Seven moves later, checkmate arrived on f3",
            body=(
                "Greedy play in the opening gets punished fast in speed chess.\n"
                "When Black plays 3...Nd4, White thinks: 'A free pawn with an f7 attack!'\n"
                "Then came 4.Nxe5? Qg5! and White's king never survived past move 7.\n\n"
                "The refutation: 4.Nxd4! exd4 5.O-O, leaving White with superior development and complete center control."
            ),
            fen="r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
            solution=["Bxf7+"],
        )
        p2["scheduled_at"] = f"{d_str}T{slots_utc[1]}:00Z"

        # 3. TG-3: Arena Vault FOMO
        p3 = self.copywriter.draft_fomo_arena_alert(
            slot_id=f"{d_str}-tg-3",
            tournament_name="Morning Blitz Vault ($250 USDT)",
            start_time_utc="08:00 UTC",
            minutes_remaining=15,
            wager_entry=5,
        )
        p3["scheduled_at"] = f"{d_str}T{slots_utc[2]}:00Z"

        # 4. TG-4: Academy Pro Tip
        p4 = self.copywriter.draft_academy_lesson_telegram_post(
            slot_id=f"{d_str}-tg-4",
            topic="Candidate Moves",
            hook="Stop looking for the best move before you calculate all forcing checks",
            body=(
                "In 3-minute blitz, players jump at the first plausible recapture.\n\n"
                "Master players scan three things in under 2 seconds:\n"
                "1. Checks (every check must be calculated)\n"
                "2. Captures (every piece tension)\n"
                "3. Threats (forcing queen or rook moves)\n\n"
                "Review candidate calculation inside the free Web3Chess Academy."
            ),
        )
        p4["scheduled_at"] = f"{d_str}T{slots_utc[3]}:00Z"

        # 5. TG-5: Speed Chess Culture
        p5 = self.copywriter.draft_blitz_culture_telegram_post(
            slot_id=f"{d_str}-tg-5",
            hook="You premoved a recapture. Your opponent found an in-between check. Familiar pain?",
            body=(
                "The German masters named it a century ago: <i>Zwischenzug</i> (the in-between move).\n"
                "In 3-minute blitz, 80% of lost pieces come from assuming the opponent will play the expected recapture.\n\n"
                "Before snatching a piece back, always ask: Can they check me first?\n"
                "Train your eye to spot intermediate moves before your opponent spots them for you."
            ),
        )
        p5["scheduled_at"] = f"{d_str}T{slots_utc[4]}:00Z"

        # 6. TG-6: Match Rules & Fair Play
        p6 = self.copywriter.draft_match_rules_telegram_post(
            slot_id=f"{d_str}-tg-6",
            hook="How Web3Chess eliminates luck: 100% skill-based speed duels with instant settlement",
            body=(
                "Online chess platforms often suffer from bots, hidden fees, or delayed payouts.\n\n"
                "Web3Chess is built on zero-cheat transparency:\n"
                "• Microsecond monotonic server clocks prevent lag manipulation\n"
                "• 95% of every entry fee pool goes directly to the winner\n"
                "• Instant TON wallet delivery upon match finish"
            ),
        )
        p6["scheduled_at"] = f"{d_str}T{slots_utc[5]}:00Z"

        # 7. TG-7: Product Engineering
        p7 = self.copywriter.draft_engineering_telegram_post(
            slot_id=f"{d_str}-tg-7",
            hook="How we built sub-50ms board sync inside Telegram Mini Apps",
            body=(
                "FastAPI + Socket.IO real-time engine built for Bot API 8.0.\n\n"
                "• Microsecond server monotonic timestamps\n"
                "• Zero board lag on high-frequency mobile connections\n"
                "• Instant PvP matchmaking without leaving Telegram chats"
            ),
        )
        p7["scheduled_at"] = f"{d_str}T{slots_utc[6]}:00Z"

        # 8. TG-8: Evening Tactics Puzzle
        p8 = self.copywriter.draft_viral_telegram_post(
            slot_id=f"{d_str}-tg-8",
            category="Tactics",
            hook="White to move. The knight guards the escape squares. Find the mate",
            body=(
                "Black's king on h8 is locked down by White's knight on f6.\n"
                "One rook move delivers instant checkmate.\n\n"
                "❤ Rh7#   🔥 Ra8+   👏 Ne8\n"
                "Answer reveals in 7 hours."
            ),
            cta="play",
            fen="7k/R7/5N2/8/8/8/8/6K1 w - - 0 1",
            solution=["Rh7#"],
            claim="mate_in_1",
            reveal_text=(
                "<b>Solved: 1. Rh7#. The Arabian Mate.</b>\n\n"
                "The knight on f6 covers g8 and h7, defending the rook while sealing all flight squares."
            ),
        )
        p8["scheduled_at"] = f"{d_str}T{slots_utc[7]}:00Z"

        posts = [p1, p2, p3, p4, p5, p6, p7, p8]

        for p in posts:
            qa_res = self.qa.inspect_telegram_post(p)
            if not qa_res["passed"]:
                raise RuntimeError(f"Post {p['id']} QA failed: {qa_res['issues']}")
            p["qa"] = {**qa_res, "checked_at": queue.iso(queue.utcnow())}
            p["status"] = "approved"

            if render_images:
                renderer.render(p)

            queue.save(p)
            results.append({
                "id": p["id"],
                "category": p["category"],
                "scheduled_at": p["scheduled_at"],
                "qa_passed": True,
                "image": p.get("image"),
            })

        return {
            "status": "success",
            "date": d_str,
            "posts_created": len(results),
            "posts": results,
        }

    def generate_x_daily_batch(self, target_date: Optional[date] = None) -> Dict[str, Any]:
        """Generates, QA-gates, approves, and queues 3 high-impact daily posts for X (Twitter).
        
        - X-1 (Morning): Tactics & Calculation Bookmark Magnet
        - X-2 (Afternoon): Blitz Scramble & Spectator Drama
        - X-3 (Evening): Synchronized Arena Vault Alert (18+ compliant)
        """
        d = target_date or self.plan_date
        d_str = d.isoformat()
        results: List[Dict[str, Any]] = []

        # Slot X-1: Tactics
        x1_id = f"{d_str}-x-1"
        x1_tactics = self.chess_editor.get_stock_viral_position("smothered_mate")
        x1_post = self.copywriter.draft_x_single_post(
            slot_id=x1_id,
            category="Tactics",
            hook="White to move. One knight move ends the game on the spot",
            body=(
                "Black's king is boxed in on h8 by its own rook and pawns.\n\n"
                "What is White's only winning move? ♟️"
            ),
            docked_reply_text=(
                "Solution: 1. Nf7# (Smothered Mate).\n"
                "The knight delivers check, and the king cannot escape because g8, g7, and h7 are blocked.\n\n"
                f"Practise 50+ master patterns in our free Academy:\nhttps://{self.primary_domain}/academy"
            ),
            fen=x1_tactics["fen"],
            solution=x1_tactics["solution"],
            claim=x1_tactics["claim"],
            size="square",
        )
        x1_qa = self.qa.inspect_x_post(x1_post)
        if not x1_qa["passed"]:
            raise RuntimeError(f"X-1 QA failed: {x1_qa['issues']}")
        x1_post["qa"] = {**x1_qa, "checked_at": queue.iso(queue.utcnow())}
        x1_post["status"] = "approved"
        queue.save(x1_post)
        results.append({"id": x1_id, "pillar": "Tactics", "qa_passed": True})

        # Slot X-2: Culture / Blitz Scramble
        x2_id = f"{d_str}-x-2"
        x2_post = self.copywriter.draft_x_single_post(
            slot_id=x2_id,
            category="Chess Culture",
            hook="4 seconds left on the clock. Up a full queen",
            body=(
                "Black premoves into a back-rank mate.\n\n"
                "The clock does not care about your theoretical rating. Under 5 seconds, calculation collapses into survival."
            ),
            docked_reply_text=(
                "Speed chess is 20% opening theory, 80% nervous system control.\n\n"
                f"Challenge a friend to a 3-minute blitz duel in Telegram:\n{brand.TG_APP}"
            ),
            size="square",
        )
        x2_qa = self.qa.inspect_x_post(x2_post)
        if not x2_qa["passed"]:
            raise RuntimeError(f"X-2 QA failed: {x2_qa['issues']}")
        x2_post["qa"] = {**x2_qa, "checked_at": queue.iso(queue.utcnow())}
        x2_post["status"] = "approved"
        queue.save(x2_post)
        results.append({"id": x2_id, "pillar": "Chess Culture", "qa_passed": True})

        # Slot X-3: Arena Drop FOMO
        x3_id = f"{d_str}-x-3"
        x3_post = self.copywriter.draft_x_single_post(
            slot_id=x3_id,
            category="Product",
            hook="The 20:00 UTC Arena Vault opens in 15 minutes",
            body=(
                "$500 Prize Vault. Once the round timer starts, brackets lock.\n\n"
                "USDT matches are for adults (18+) where permitted. You can lose your stake."
            ),
            docked_reply_text=(
                "Enter the arena lobby inside Telegram:\n"
                f"{brand.TG_ARENA}"
            ),
            size="square",
        )
        x3_qa = self.qa.inspect_x_post(x3_post)
        if not x3_qa["passed"]:
            raise RuntimeError(f"X-3 QA failed: {x3_qa['issues']}")
        x3_post["qa"] = {**x3_qa, "checked_at": queue.iso(queue.utcnow())}
        x3_post["status"] = "approved"
        queue.save(x3_post)
        results.append({"id": x3_id, "pillar": "Product", "qa_passed": True})

        return {
            "status": "success",
            "date": d_str,
            "posts_created": len(results),
            "posts": results,
        }

    def create_flagship_x_thread(self, target_date: Optional[date] = None) -> Dict[str, Any]:
        """Creates, validates, and queues the flagship 5-tweet viral manifesto thread on X."""
        d = target_date or self.plan_date
        d_str = d.isoformat()
        thread_id = f"{d_str}-x-thread-flagship"

        thread = self.copywriter.draft_x_thread(
            thread_id=thread_id,
            topic="The Death of Tap-to-Earn: Why Intellectual Speed Chess is Taking Over Telegram",
            category="Product",
            hook_tweet_text=(
                "Tap-to-earn was an illusion.\n\n"
                "Millions clicked digital coins for months, only to receive dust tokens and inflation.\n\n"
                "The next phase of Web3 gaming is not clicking — it is intellectual mastery and skill-based PvP. Here is why speed chess is taking over: 🧵"
            ),
            body_tweets=[
                (
                    "In classical crypto games, token emissions dilute value.\n\n"
                    "In pure speed chess, value is zero-sum and skill-gated:\n"
                    "• No bots running scripts\n"
                    "• No fake grinding loops\n"
                    "• Every victory is calculated under a 3-minute clock\n\n"
                    "Rating cannot be bought."
                ),
                (
                    "The real bottleneck on Telegram wasn't interest — it was latency.\n\n"
                    "Classical Web3 chess forced on-chain transactions per move, destroying blitz flow.\n\n"
                    "We solved this with hybrid architecture:\n"
                    "• Sub-100ms state updates via WebSockets\n"
                    "• Instant matchmaking in Telegram Bot API 8.0"
                ),
                (
                    "Synchronized liquidity beats random queues.\n\n"
                    "4 daily global Arena Windows (02:00, 08:00, 14:00, 20:00 UTC).\n"
                    "Transparent settlement: 95% winner payout, 3% fee, 2% referral pool.\n\n"
                    "USDT matches: adults (18+) only. You can lose your stake."
                ),
            ],
            cta_tweet_text=(
                "Whether you want free daily grandmaster tactical drills or competitive blitz matches, the board is waiting.\n\n"
                "Play free on web or launch inside Telegram in one tap:"
            ),
            cta_link_url=f"https://{self.primary_domain}",
        )

        qa_res = self.qa.inspect_x_thread(thread)
        if not qa_res["passed"]:
            raise RuntimeError(f"X Thread QA failed: {qa_res['issues']}")

        thread["qa"] = {**qa_res, "checked_at": queue.iso(queue.utcnow())}
        thread["status"] = "approved"
        queue.save(thread)

        return {
            "status": "success",
            "thread_id": thread_id,
            "tweets_count": len(thread["tweets"]),
            "qa_passed": True,
            "thread": thread,
        }

    def generate_x_reply_sniper_kit(self) -> Dict[str, Any]:
        """Generates high-leverage comment scripts for top chess & TON ecosystem accounts."""
        targets = [
            {
                "account": "Hikaru Nakamura",
                "handle": "@Hikaru",
                "context": "Post-match blitz review or stream recap",
                "comment": (
                    "When calculation drops below 5 seconds, positional advantage stops existing. "
                    "In bullet, the player who creates dynamic tactical complications wins 80% of scramble games."
                ),
            },
            {
                "account": "GothamChess (Levy Rozman)",
                "handle": "@GothamChess",
                "context": "Blunder recap or 'guess the elo' post",
                "comment": (
                    "The most dangerous illusion in amateur blitz is thinking you are attacking when your king has no luft. "
                    "Back-rank checkmates never happen because of bad luck; they happen because players forget air."
                ),
            },
            {
                "account": "TON Blockchain",
                "handle": "@ton_blockchain",
                "context": "Telegram Mini Apps or Web3 gaming announcement",
                "comment": (
                    "Tap-to-earn proved Telegram's distribution power, but skill-based synchronous PvP is what proves long-term user retention. "
                    "Sub-100ms chess sync inside a Bot API 8.0 Mini App is a game changer for real gaming."
                ),
            },
            {
                "account": "Magnus Carlsen",
                "handle": "@MagnusCarlsen",
                "context": "Speed chess or freestyle chess discussion",
                "comment": (
                    "Intuition in time scrambles is just pattern recognition compressed into subconscious reflex. "
                    "The clock tests instinct more than raw calculation."
                ),
            },
        ]

        kit = []
        for t in targets:
            item = self.copywriter.draft_x_reply_sniper(
                target_account=t["account"],
                target_handle=t["handle"],
                trigger_context=t["context"],
                sniper_comment=t["comment"],
            )
            kit.append(item)

        return {
            "status": "success",
            "sniper_targets_count": len(kit),
            "targets": kit,
        }

    def generate_player_spotlight_batch(
        self,
        target_date: Optional[date] = None,
        player_name: str = "@grandmaestro",
        streak_count: int = 9,
        rating_gain: int = 65,
        winnings_usdt: float = 190.0,
        fen: Optional[str] = None,
        solution: Optional[List[str]] = None,
        time_control: str = "3+0 Blitz",
        render_images: bool = True,
    ) -> Dict[str, Any]:
        """Generates, QA-gates, renders creatives, and queues a multi-platform Player Spotlight campaign."""
        d = target_date or self.plan_date
        d_str = d.isoformat()
        clean_fen = fen or "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1"
        clean_sol = solution or ["Ra8#"]

        # 1. Telegram Spotlight Post
        tg_slot = f"{d_str}-tg-spotlight"
        tg_post = self.copywriter.draft_player_spotlight_post(
            slot_id=tg_slot,
            player_name=player_name,
            streak_count=streak_count,
            rating_gain=rating_gain,
            winnings_usdt=winnings_usdt,
            fen=clean_fen,
            solution=clean_sol,
            time_control=time_control,
            platform="telegram",
        )
        tg_qa = self.qa.inspect_telegram_post(tg_post)
        if not tg_qa["passed"]:
            raise RuntimeError(f"Telegram Spotlight QA failed: {tg_qa['issues']}")
        tg_post["qa"] = {**tg_qa, "checked_at": queue.iso(queue.utcnow())}
        tg_post["status"] = "approved"

        if render_images:
            renderer.render(tg_post)
        queue.save(tg_post)

        # 2. X Spotlight Post
        x_slot = f"{d_str}-x-spotlight"
        x_post = self.copywriter.draft_player_spotlight_post(
            slot_id=x_slot,
            player_name=player_name,
            streak_count=streak_count,
            rating_gain=rating_gain,
            winnings_usdt=winnings_usdt,
            fen=clean_fen,
            solution=clean_sol,
            time_control=time_control,
            platform="x",
        )
        x_qa = self.qa.inspect_x_post(x_post)
        if not x_qa["passed"]:
            raise RuntimeError(f"X Spotlight QA failed: {x_qa['issues']}")
        x_post["qa"] = {**x_qa, "checked_at": queue.iso(queue.utcnow())}
        x_post["status"] = "approved"

        if render_images:
            renderer.render(x_post)
        queue.save(x_post)

        return {
            "status": "success",
            "campaign": "Player Spotlight",
            "player": player_name,
            "streak": streak_count,
            "rating_gain": rating_gain,
            "telegram_post_id": tg_slot,
            "x_post_id": x_slot,
        }



