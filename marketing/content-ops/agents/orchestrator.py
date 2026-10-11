"""Content Engine Orchestrator: Multi-Agent Workflow Coordinator.

Unifies CMO, Scraper, Audit, Planner, Chess Editor, SMM Copywriter, QA Compliance,
and Publisher agents into a high-performance content engine for Web3Chess and aumera.top.
"""
from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .cmo import CmoAgent
from .scraper import ScraperAgent
from .audit import AuditAgent
from .planner import PlannerAgent
from .chess_editor import ChessEditorAgent
from .smm_copywriter import SmmCopywriterAgent
from .qa_compliance import QaComplianceAgent
from .publisher import PublisherAgent
from pipeline import queue, brand


class ContentEngineOrchestrator:
    """Master orchestrator managing autonomous and supervised content flows."""

    def __init__(self, plan_date: Optional[date] = None, primary_domain: str = "aumera.top"):
        self.plan_date = plan_date or queue.utcnow().date()
        self.primary_domain = primary_domain
        self.cmo = CmoAgent()
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
        """Creates and validates the first flagship viral FOMO post and paired blog article for aumera.top.

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
            hook="White to move. One knight move ends the game on the spot.",
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

        # 5. Draft and stage the paired high-converting Blog article for aumera.top
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
