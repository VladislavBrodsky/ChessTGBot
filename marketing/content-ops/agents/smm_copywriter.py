"""SMM & Copywriter Agent.

Produces high-converting Telegram channel broadcasts and comprehensive SEO blog articles
tailored for aumera.top and Web3Chess. Adheres to strict character limits, Bot API 8.0 HTML,
anti-brainrot tone, and deterministic conversion architecture.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from pipeline import brand, queue


class SmmCopywriterAgent:
    """Specialist writer for viral speed chess copy, tactical hooks, and SEO articles."""

    def __init__(self, primary_domain: str = "aumera.top"):
        self.primary_domain = primary_domain

    def draft_viral_telegram_post(
        self,
        slot_id: str,
        category: str,
        hook: str,
        body: str,
        cta: str = "play",
        fen: Optional[str] = None,
        solution: Optional[List[str]] = None,
        claim: Optional[str] = None,
        reveal_text: Optional[str] = None,
        options: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Crafts a verified Telegram broadcast dictionary ready for QA gates."""
        post: Dict[str, Any] = {
            "id": slot_id,
            "kind": "telegram",
            "date": slot_id[:10] if len(slot_id) >= 10 else queue.utcnow().date().isoformat(),
            "category": category,
            "format": "puzzle" if fen and solution else "product" if category == "Product" else "news",
            "hook": hook.strip(),
            "cta": cta,
            "text": f"<b>{hook.strip()}</b>\n\n{body.strip()}",
            "status": "draft",
            "sources": [{"kind": "own", "url": f"https://{self.primary_domain}"}],
        }

        if fen:
            post["chess"] = {
                "fen": fen,
                "solution": solution or [],
                "claim": claim,
            }
            post["creative"] = {
                "template": "puzzle",
                "size": "portrait",
                "tag": claim.replace("_", " ").title() if claim else "Tactics Challenge",
                "headline": "White to play.\n*One decisive move.*",
                "subhead": "Can you spot the tactical finish?",
                "fen": fen,
                "cta_label": "Solve in Mini App",
                "footer": "Answer with reactions or in replies.",
            }

        if reveal_text:
            post["reveal"] = {
                "after_hours": 7,
                "text": reveal_text.strip(),
                "creative": {
                    "template": "puzzle",
                    "size": "portrait",
                    "reveal": True,
                    "moves": solution or [],
                    "tag": "Solved",
                    "headline": "Decisive Strike.\n*The winning line.*",
                    "subhead": "Calculated to the end.",
                    "fen": fen or "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
                    "cta_label": "Play Next Puzzle",
                },
            }

        return post

    def draft_fomo_arena_alert(
        self,
        slot_id: str,
        tournament_name: str = "Daily Blitz Vault ($500 USDT)",
        start_time_utc: str = "20:00 UTC",
        minutes_remaining: int = 15,
        wager_entry: int = 5,
    ) -> Dict[str, Any]:
        """Crafts a high-urgency arena countdown alert adhering to 18+ wager disclosures."""
        hook = f"Arena Alert: {tournament_name} locks in {minutes_remaining} minutes."
        body = (
            f"⚡ <b>The {start_time_utc} Arena countdown is live.</b>\n\n"
            f"3-Minute Blitz • Double-elimination bracket • Instant TON settlement.\n"
            f"Free spectator lounge open for all community members.\n\n"
            f"USDT matches are for adults (18+) where permitted. You can lose your stake.\n"
            f"Registration locks the second the round clock starts."
        )
        return {
            "id": slot_id,
            "kind": "telegram",
            "date": slot_id[:10],
            "category": "Product",
            "format": "product",
            "hook": hook[:110],
            "cta": "arena",
            "text": body,
            "status": "draft",
            "sources": [{"kind": "own", "url": f"https://{self.primary_domain}/wagers"}],
            "creative": {
                "template": "product",
                "size": "portrait",
                "tag": "Daily Arena",
                "headline": "BLITZ ARENA.\n*VAULT CLOSES SOON.*",
                "subhead": f"{start_time_utc} • Instant PvP Matchmaking",
                "cta_label": "Enter Arena",
                "footer": "18+ only · You can lose your stake · Rules at aumera.top/wagers",
            },
        }

    def draft_seo_blog_article(
        self,
        slug: str,
        title: str,
        subtitle: str,
        excerpt: str,
        category: str,
        takeaways: List[str],
        content_blocks: List[Dict[str, Any]],
        reading_time: str = "4 min read",
        cta_href: str = "/play",
        cta_label: str = "Play Free Against A.I.",
    ) -> Dict[str, Any]:
        """Drafts a comprehensive Blog article JSON for aumera.top with structured data support."""
        return {
            "slug": slug,
            "title": title[:100],
            "subtitle": subtitle,
            "excerpt": excerpt,
            "metaDescription": excerpt[:160],
            "category": category,
            "author": {
                "name": "Web3Chess Editorial & Tactical Review",
                "role": "Speed Chess Grandmaster & Product Strategy",
                "avatar": "",
                "kind": "Organization",
            },
            "publishedAt": queue.utcnow().date().isoformat(),
            "readingTime": reading_time,
            "takeaways": takeaways,
            "content": content_blocks,
            "sources": [
                {
                    "title": "FIDE Official Laws of Chess",
                    "url": "https://handbook.fide.com",
                },
                {
                    "title": f"Web3Chess Academy on {self.primary_domain}",
                    "url": f"https://{self.primary_domain}/academy",
                },
            ],
            "cta": {
                "label": cta_label,
                "href": cta_href,
            },
            "relatedSlugs": [
                "the-3-minute-blitz-blueprint-tactics-time-management",
                "opening-mastery-tactics",
            ],
        }
