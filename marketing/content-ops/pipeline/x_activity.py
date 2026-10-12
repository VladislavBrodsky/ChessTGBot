"""X (Twitter) Activity API & Event-Driven Engagement Engine.

Handles real-time streaming and webhook events from the X platform (docs.x.com/x-api/activity/introduction):
- CRC (Challenge-Response Check) verification via HMAC-SHA256
- Webhook signature security verification
- Real-time 'Reply-to-Play' tactical move validation
- 'Comment-to-DM' frictionless conversion routing
- 'Reply Sniper' real-time target account listener
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import re
import secrets
from typing import Any, Dict, List, Optional

from . import brand


def calculate_crc_response(crc_token: str, consumer_secret: str) -> str:
    """Computes the expected response_token for X Activity API CRC verification."""
    mac = hmac.new(
        consumer_secret.encode("utf-8"),
        crc_token.encode("utf-8"),
        hashlib.sha256,
    )
    return f"sha256={base64.b64encode(mac.digest()).decode('utf-8')}"


def verify_webhook_signature(payload_bytes: bytes, signature_header: str, consumer_secret: str) -> bool:
    """Verifies that an incoming webhook payload originated from X using HMAC-SHA256."""
    if not signature_header or not consumer_secret:
        return False
    mac = hmac.new(
        consumer_secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    )
    expected = f"sha256={base64.b64encode(mac.digest()).decode('utf-8')}"
    return secrets.compare_digest(signature_header, expected)


def evaluate_tactical_reply(
    reply_text: str,
    expected_solution: List[str],
    primary_domain: str = "web3chess.online",
) -> Dict[str, Any]:
    """Evaluates a user's candidate move from a post.reply.create event.
    
    Returns an immediate, high-engagement response that boosts author reply velocity
    and rewards correct calculation with a free Mystery Box pass.
    """
    clean = re.sub(r"[^\w+#-]", " ", reply_text).upper()
    tokens = clean.split()
    
    # Normalize moves (e.g. NF7# -> NF7, RA8# -> RA8)
    normalized_solutions = [s.upper().replace("#", "").replace("+", "") for s in expected_solution]
    full_solutions = [s.upper() for s in expected_solution]

    is_correct = any(
        sol in tokens or norm in tokens
        for sol, norm in zip(full_solutions, normalized_solutions)
    )

    if is_correct:
        winning_move = expected_solution[0] if expected_solution else "decisive move"
        response_text = (
            f"Spot on! 🎯 {winning_move} is the winning line.\n\n"
            f"You unlocked an Epic Mystery Box pass. Claim your reward in Telegram:\n"
            f"{brand.TG_APP}"
        )
        return {
            "is_correct": True,
            "detected_move": winning_move,
            "response_text": response_text,
            "action": "reward_claim",
        }
    else:
        response_text = (
            "Close calculation! That move allows defensive counterplay.\n\n"
            f"Check your opponent's checks and luft, or solve it in the Academy:\n"
            f"https://{primary_domain}/academy"
        )
        return {
            "is_correct": False,
            "detected_move": None,
            "response_text": response_text,
            "action": "hint_retry",
        }


def route_keyword_intent(
    text: str,
    primary_domain: str = "web3chess.online",
) -> Optional[Dict[str, Any]]:
    """Detects conversion intent from comments or DMs (e.g., 'PLAY', 'ARENA', 'RULES')."""
    low = text.lower().strip()
    
    if re.search(r"\b(play|start|game|bot|mini\s*app)\b", low):
        return {
            "intent": "play",
            "reply_text": (
                "Launch your match in 1 tap without app downloads:\n"
                f"{brand.TG_APP}"
            ),
        }
    elif re.search(r"\b(arena|vault|tournament|stake)\b", low):
        return {
            "intent": "arena",
            "reply_text": (
                "Enter today's synchronized Arena lobby ($500 Vault):\n"
                f"{brand.TG_ARENA}\n\n"
                f"{brand.WAGER_DISCLOSURE}"
            ),
        }
    elif re.search(r"\b(academy|puzzle|learn|tactic)\b", low):
        return {
            "intent": "academy",
            "reply_text": (
                "Sharpen your board vision with 50+ master tactical drills:\n"
                f"https://{primary_domain}/academy"
            ),
        }
    return None


def match_sniper_target_post(
    author_handle: str,
    tweet_text: str,
) -> Optional[Dict[str, Any]]:
    """Identifies when a priority tracked account posts, providing a tailored high-IQ comment."""
    handle = author_handle.lower().lstrip("@")
    targets: Dict[str, Dict[str, str]] = {
        "hikaru": {
            "name": "Hikaru Nakamura",
            "default_angle": "Dynamic complications and time trouble survival in blitz.",
            "recommended_comment": (
                "When calculation drops below 5 seconds, positional advantage stops existing. "
                "In bullet, the player who creates dynamic complications wins 80% of scramble games."
            ),
        },
        "gothamchess": {
            "name": "GothamChess (Levy Rozman)",
            "default_angle": "King safety, luft, and avoiding amateur back-rank blunders.",
            "recommended_comment": (
                "The most dangerous illusion in amateur blitz is thinking you are attacking when your king has no luft. "
                "Back-rank checkmates never happen because of bad luck; they happen because players forget air."
            ),
        },
        "ton_blockchain": {
            "name": "TON Blockchain",
            "default_angle": "Skill-based synchronous PvP as the future of Telegram Mini Apps.",
            "recommended_comment": (
                "Tap-to-earn proved Telegram's distribution power, but skill-based synchronous PvP is what proves long-term user retention. "
                "Sub-100ms chess sync inside a Bot API 8.0 Mini App is a game changer for real gaming."
            ),
        },
        "magnuscarlsen": {
            "name": "Magnus Carlsen",
            "default_angle": "Intuition and subconscious pattern recognition under clock pressure.",
            "recommended_comment": (
                "Intuition in time scrambles is just pattern recognition compressed into subconscious reflex. "
                "The clock tests instinct more than raw calculation."
            ),
        },
    }

    if handle in targets:
        spec = targets[handle]
        return {
            "target": spec["name"],
            "handle": f"@{handle}",
            "tweet_text": tweet_text[:120],
            "recommended_comment": spec["recommended_comment"],
            "char_count": len(spec["recommended_comment"]),
            "urgency": "High (< 5 minutes for top-3 placement)",
        }
    return None
