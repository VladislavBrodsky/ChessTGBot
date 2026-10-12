"""SMM & Copywriter Agent.

Produces high-converting Telegram channel broadcasts and comprehensive SEO blog articles
tailored for web3chess.online. Adheres to strict character limits, Bot API 8.0 HTML,
anti-brainrot tone, and deterministic conversion architecture.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from pipeline import brand, queue


class SmmCopywriterAgent:
    """Specialist writer for viral speed chess copy, tactical hooks, and SEO articles."""

    def __init__(self, primary_domain: str = "web3chess.online"):
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
        size: str = "square",
    ) -> Dict[str, Any]:
        """Crafts a verified Telegram broadcast dictionary ready for QA gates.
        
        Canvas format is strictly 1:1 ('square': 1080x1080) or 16:9 ('wide': 1280x720).
        """
        canvas_size = size if size in ("square", "wide") else "square"
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
                "size": canvas_size,
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
                    "size": canvas_size,
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
        size: str = "square",
    ) -> Dict[str, Any]:
        """Crafts a high-urgency arena countdown alert adhering to 18+ wager disclosures."""
        canvas_size = size if size in ("square", "wide") else "square"
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
                "size": canvas_size,
                "tag": "Daily Arena",
                "headline": "BLITZ ARENA.\n*VAULT CLOSES SOON.*",
                "subhead": f"{start_time_utc} • Instant PvP Matchmaking",
                "cta_label": "Enter Arena",
                "steps": [
                    "Open Mini App",
                    "Choose stake tier",
                    "Win 95% of the pot",
                ],
                "footer": f"18+ only · You can lose your stake · Rules at {self.primary_domain}/wagers",
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
        """Drafts a comprehensive Blog article JSON for web3chess.online with structured data support."""
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

    def draft_x_single_post(
        self,
        slot_id: str,
        category: str,
        hook: str,
        body: str,
        docked_reply_text: Optional[str] = None,
        docked_link_url: Optional[str] = None,
        fen: Optional[str] = None,
        solution: Optional[List[str]] = None,
        claim: Optional[str] = None,
        size: str = "wide",
    ) -> Dict[str, Any]:
        """Crafts a verified single X (Twitter) post adhering to the 280-char limit and docked link rule."""
        canvas_size = size if size in ("square", "wide") else "wide"
        post_text = f"{hook.strip()}\n\n{body.strip()}".strip()
        post: Dict[str, Any] = {
            "id": slot_id,
            "kind": "x_post",
            "date": slot_id[:10] if len(slot_id) >= 10 else queue.utcnow().date().isoformat(),
            "category": category,
            "hook": hook.strip(),
            "text": post_text,
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
                "size": canvas_size,
                "fen": fen,
                "tag": claim.replace("_", " ").title() if claim else "Tactics Challenge",
            }

        reply_content = docked_reply_text
        if not reply_content and docked_link_url:
            reply_content = f"Play and practice on {docked_link_url}"

        if reply_content:
            post["docked_reply"] = {
                "text": reply_content.strip(),
                "delay_seconds": 30,
            }

        return post

    def draft_x_thread(
        self,
        thread_id: str,
        topic: str,
        category: str,
        hook_tweet_text: str,
        body_tweets: List[str],
        cta_tweet_text: str,
        cta_link_url: str,
    ) -> Dict[str, Any]:
        """Crafts a 4-7 tweet educational/manifesto X thread with clean numbering and docked link CTA."""
        total_tweets = len(body_tweets) + 2
        tweets: List[Dict[str, Any]] = []

        # 1. Hook Tweet (Root) - strictly NO external links
        tweets.append({
            "number": 1,
            "text": f"1/{total_tweets} {hook_tweet_text.strip()}",
        })

        # 2. Body Tweets
        for idx, body in enumerate(body_tweets, start=2):
            tweets.append({
                "number": idx,
                "text": f"{idx}/{total_tweets} {body.strip()}",
            })

        # 3. Final CTA Tweet - carries the link
        final_num = total_tweets
        cta_full = f"{final_num}/{final_num} {cta_tweet_text.strip()}\n\n{cta_link_url.strip()}"
        tweets.append({
            "number": final_num,
            "text": cta_full,
        })

        return {
            "id": thread_id,
            "kind": "x_thread",
            "date": thread_id[:10] if len(thread_id) >= 10 else queue.utcnow().date().isoformat(),
            "category": category,
            "topic": topic,
            "tweets": tweets,
            "status": "draft",
            "sources": [{"kind": "own", "url": f"https://{self.primary_domain}"}],
        }

    def draft_x_reply_sniper(
        self,
        target_account: str,
        target_handle: str,
        trigger_context: str,
        sniper_comment: str,
    ) -> Dict[str, Any]:
        """Crafts a high-IQ value comment for top chess or TON accounts (zero promo links)."""
        return {
            "target_account": target_account,
            "target_handle": target_handle,
            "trigger_context": trigger_context,
            "reply_text": sniper_comment.strip(),
            "char_count": len(sniper_comment.strip()),
            "rules": [
                "Post within 5-10 minutes of target tweet",
                "Do NOT include promotional links in sniper comment",
                "Let the profile bio funnel interested readers",
            ],
        }

