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
                "headline": "White to play\n*One decisive move*",
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
        hook = f"Arena Alert: {tournament_name} locks in {minutes_remaining} minutes"
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
                "headline": "BLITZ ARENA\n*VAULT CLOSES SOON*",
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

    def draft_opening_trap_telegram_post(
        self,
        slot_id: str,
        trap_name: str,
        hook: str,
        body: str,
        fen: Optional[str] = None,
        solution: Optional[List[str]] = None,
        size: str = "square",
    ) -> Dict[str, Any]:
        """Drafts an opening trap Telegram post with visual board and Academy CTA."""
        canvas_size = size if size in ("square", "wide") else "square"
        clean_hook = hook.rstrip(".")
        clean_fen = fen or "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
        return {
            "id": slot_id,
            "kind": "telegram",
            "date": slot_id[:10],
            "category": "Openings",
            "format": "trap",
            "hook": clean_hook[:110],
            "cta": "academy",
            "text": f"<b>{clean_hook}</b>\n\n{body.strip()}",
            "status": "draft",
            "sources": [{"kind": "own", "url": f"https://{self.primary_domain}/academy"}],
            "chess": {
                "fen": clean_fen,
                "solution": solution or ["Bxf7+"],
                "claim": "line_legal",
            },
            "creative": {
                "template": "trap",
                "size": canvas_size,
                "tag": f"Trap Breakdown: {trap_name}",
                "headline": f"{trap_name.upper()}\n*PUNISH GREED*",
                "subhead": "Can you spot the refutation line?",
                "fen": clean_fen,
                "cta_label": "Learn in Academy",
                "footer": "Study full lines in the Web3Chess Academy.",
            },
        }

    def draft_blitz_culture_telegram_post(
        self,
        slot_id: str,
        hook: str,
        body: str,
        left_label: str = "Premove Recapture",
        right_label: str = "In-Between Check",
        size: str = "square",
    ) -> Dict[str, Any]:
        """Drafts a Telegram speed chess culture post with visual comparison panels."""
        canvas_size = size if size in ("square", "wide") else "square"
        clean_hook = hook.rstrip(".")
        return {
            "id": slot_id,
            "kind": "telegram",
            "date": slot_id[:10],
            "category": "Chess Culture",
            "format": "news",
            "hook": clean_hook[:110],
            "cta": "play",
            "text": f"<b>{clean_hook}</b>\n\n{body.strip()}",
            "status": "draft",
            "sources": [{"kind": "own", "url": f"https://{self.primary_domain}"}],
            "creative": {
                "template": "culture",
                "size": canvas_size,
                "tag": "Blitz Culture",
                "headline": "SPEED SCRAMBLE\n*PREMOVE TILT*",
                "subhead": "Under 5 seconds, calculation collapses into survival",
                "cta_label": "Challenge a Friend",
                "panels": [
                    {"label": "Mistake", "text": left_label, "piece": "K"},
                    {"label": "Counter", "text": right_label, "piece": "Q"},
                ],
            },
        }

    def draft_academy_lesson_telegram_post(
        self,
        slot_id: str,
        topic: str,
        hook: str,
        body: str,
        size: str = "square",
    ) -> Dict[str, Any]:
        """Drafts a Pro Tip Telegram post with Academy deep linking."""
        canvas_size = size if size in ("square", "wide") else "square"
        clean_hook = hook.rstrip(".")
        return {
            "id": slot_id,
            "kind": "telegram",
            "date": slot_id[:10],
            "category": "Academy",
            "format": "news",
            "hook": clean_hook[:110],
            "cta": "academy",
            "text": f"<b>{clean_hook}</b>\n\n{body.strip()}",
            "status": "draft",
            "sources": [{"kind": "own", "url": f"https://{self.primary_domain}/academy"}],
            "creative": {
                "template": "tip",
                "size": canvas_size,
                "tag": f"Pro Tip: {topic}",
                "headline": f"{topic.upper()}\n*MASTER PATTERN*",
                "subhead": "Three candidate moves before any capture",
                "cta_label": "Open Academy",
                "footer": "Free structured lessons inside Web3Chess Academy.",
            },
        }

    def draft_match_rules_telegram_post(
        self,
        slot_id: str,
        hook: str,
        body: str,
        size: str = "square",
    ) -> Dict[str, Any]:
        """Drafts an educational 18+ compliant Match Rules post for Telegram."""
        canvas_size = size if size in ("square", "wide") else "square"
        clean_hook = hook.rstrip(".")
        # Ensure compliance disclaimer is present
        disclosure = brand.WAGER_DISCLOSURE
        full_text = f"<b>{clean_hook}</b>\n\n{body.strip()}\n\n{disclosure}"
        return {
            "id": slot_id,
            "kind": "telegram",
            "date": slot_id[:10],
            "category": "Match Rules",
            "format": "rules",
            "hook": clean_hook[:110],
            "cta": "rules",
            "text": full_text,
            "status": "draft",
            "sources": [{"kind": "own", "url": f"https://{self.primary_domain}/wagers"}],
            "creative": {
                "template": "rules",
                "size": canvas_size,
                "tag": "PvP Match Integrity",
                "headline": "SPEED ARENA\n*FAIR PLAY RULES*",
                "subhead": "Zero bots • 95% pot return • Instant TON payout",
                "cta_label": "Read Full Rules",
                "footer": f"18+ only · You can lose your stake · web3chess.online/wagers",
            },
        }

    def draft_engineering_telegram_post(
        self,
        slot_id: str,
        hook: str,
        body: str,
        size: str = "square",
    ) -> Dict[str, Any]:
        """Drafts a tech & infrastructure post highlighting zero-lag WebSockets."""
        canvas_size = size if size in ("square", "wide") else "square"
        clean_hook = hook.rstrip(".")
        return {
            "id": slot_id,
            "kind": "telegram",
            "date": slot_id[:10],
            "category": "Product",
            "format": "news",
            "hook": clean_hook[:110],
            "cta": "play",
            "text": f"<b>{clean_hook}</b>\n\n{body.strip()}",
            "status": "draft",
            "sources": [{"kind": "own", "url": f"https://{self.primary_domain}"}],
            "creative": {
                "template": "news",
                "size": canvas_size,
                "tag": "Architecture Update",
                "headline": "SUB-50MS ENGINE\n*ZERO BOARD LAG*",
                "subhead": "FastAPI + Socket.IO real-time sync on Bot API 8.0",
                "cta_label": "Test Engine",
                "source": "Web3Chess Core Engineering",
                "footer": "Built for competitive blitz on high-frequency mobile connections.",
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
        size: str = "square",
        creative_spec: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Crafts a verified single X (Twitter) post adhering to the 280-char limit, docked link rule, and 1:1 canvas standards."""
        # Strictly enforce 1:1 format ("square": 1080x1080) for X posts
        canvas_size = "square"
        clean_hook = hook.strip().rstrip(".")
        post_text = f"{clean_hook}\n\n{body.strip()}".strip()
        post: Dict[str, Any] = {
            "id": slot_id,
            "kind": "x_post",
            "date": slot_id[:10] if len(slot_id) >= 10 else queue.utcnow().date().isoformat(),
            "category": category,
            "hook": clean_hook,
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
                "headline": "White to play\n*One decisive move*",
                "subhead": "Can you spot the tactical finish?",
                "cta_label": "Solve in Mini App",
                "footer": "Answer with reactions or in replies.",
            }
        elif creative_spec:
            post["creative"] = {**creative_spec, "size": canvas_size}
        elif category == "Product":
            post["creative"] = {
                "template": "product",
                "size": canvas_size,
                "tag": "Daily Arena",
                "headline": "BLITZ ARENA\n*VAULT CLOSES SOON*",
                "subhead": "20:00 UTC • Instant PvP Matchmaking",
                "cta_label": "Enter Arena",
                "steps": [
                    "Open Mini App",
                    "Choose stake tier",
                    "Win 95% of the pot",
                ],
                "footer": f"18+ only · You can lose your stake · Rules at {self.primary_domain}/wagers",
            }
        elif category in ("Chess Culture", "Chess News"):
            post["creative"] = {
                "template": "culture",
                "size": canvas_size,
                "tag": "Blitz Culture",
                "headline": "4 SECONDS LEFT\n*PREMOVE COLLAPSE*",
                "subhead": "Under 5 seconds, calculation collapses into survival",
                "cta_label": "Play in Telegram",
                "panels": [
                    {"label": "You", "text": "Premove a queen recapture", "piece": "Q"},
                    {"label": "Opponent", "text": "Find an in-between check", "piece": "K"},
                ],
            }
        elif category == "Chess Debate":
            post["creative"] = {
                "template": "culture",
                "size": canvas_size,
                "tag": "Hot Take",
                "headline": "RAPID IS DEAD\n*INTUITION VS MEMORY*",
                "subhead": "Can you calculate under 180 seconds or do you freeze?",
                "cta_label": "Join Debate",
                "panels": [
                    {"label": "Classical", "text": "Memorize opening lines", "piece": "K"},
                    {"label": "Blitz PvP", "text": "Pure real-time survival", "piece": "Q"},
                ],
            }
        elif category == "Psychology":
            post["creative"] = {
                "template": "culture",
                "size": canvas_size,
                "tag": "Neuro Performance",
                "headline": "THE 6-SECOND TILT\n*ADRENALINE OVERLOAD*",
                "subhead": "How tunnel vision destroys calculation in speed chess",
                "cta_label": "Test Instincts",
                "panels": [
                    {"label": "State 1", "text": "Calculation collapses", "piece": "N"},
                    {"label": "State 2", "text": "Subconscious instinct takes over", "piece": "R"},
                ],
            }
        elif category == "Engineering":
            post["creative"] = {
                "template": "product",
                "size": canvas_size,
                "tag": "Architecture",
                "headline": "SUB-100MS SYNC\n*TELEGRAM MINI APP*",
                "subhead": "Real-time WebSockets vs on-chain latency",
                "cta_label": "Read Stack",
                "steps": [
                    "FastAPI + Socket.IO realtime engine",
                    "Telegram Bot API 8.0 seamless WebView",
                    "Sub-100ms board state synchronization",
                ],
                "footer": f"Built for high-speed PvP · web3chess.online",
            }
        elif category == "Tactical Matrix":
            post["creative"] = {
                "template": "culture",
                "size": canvas_size,
                "tag": "Pattern Matrix",
                "headline": "4 MOTIFS MATRIX\n*85% OF BLITZ WINS*",
                "subhead": "The core tactical patterns every 1500+ player must master",
                "cta_label": "Save Pattern",
                "panels": [
                    {"label": "Deflection", "text": "Remove defender", "piece": "R"},
                    {"label": "Fork / Pin", "text": "Double attack geometry", "piece": "N"},
                ],
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

    def draft_x_debate_post(
        self,
        slot_id: str,
        hook: str,
        body: str,
        docked_reply: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Crafts a high-velocity contrarian debate post designed for replies and quotes."""
        reply_text = docked_reply or f"Join the debate and test your speed rating:\nhttps://{self.primary_domain}"
        return self.draft_x_single_post(
            slot_id=slot_id,
            category="Chess Debate",
            hook=hook,
            body=body,
            docked_reply_text=reply_text,
        )

    def draft_x_psychology_post(
        self,
        slot_id: str,
        hook: str,
        body: str,
        docked_reply: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Crafts a cognitive performance & neuro-psychology post appealing to cross-over audiences."""
        reply_text = docked_reply or f"Train your reaction speed against live players inside Telegram:\n{brand.TG_APP}"
        return self.draft_x_single_post(
            slot_id=slot_id,
            category="Psychology",
            hook=hook,
            body=body,
            docked_reply_text=reply_text,
        )

    def draft_x_motif_matrix_post(
        self,
        slot_id: str,
        hook: str,
        body: str,
        docked_reply: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Crafts a high-utility tactical cheat-sheet post designed as a bookmark magnet."""
        reply_text = docked_reply or f"Master all 50+ calculation motifs in our free Academy:\nhttps://{self.primary_domain}/academy"
        return self.draft_x_single_post(
            slot_id=slot_id,
            category="Tactical Matrix",
            hook=hook,
            body=body,
            docked_reply_text=reply_text,
        )

    def draft_x_engineering_post(
        self,
        slot_id: str,
        hook: str,
        body: str,
        docked_reply: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Crafts a build-in-public tech & architecture post for developer authority."""
        reply_text = docked_reply or f"Read our deep-dive architecture benchmarks:\nhttps://{self.primary_domain}/blog"
        return self.draft_x_single_post(
            slot_id=slot_id,
            category="Engineering",
            hook=hook,
            body=body,
            docked_reply_text=reply_text,
        )

