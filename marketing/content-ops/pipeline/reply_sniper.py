"""Automated Reply Sniper for High-Reach Chess & Web3 Accounts on X.

Monitors premier chess influencers and ecosystem accounts:
- @chesscom (720k+ followers)
- @GMHikaru (629k+ followers)
- @GothamChess (447k+ followers)
- @MagnusCarlsen (1.1M+ followers)
- @ton_blockchain (2.2M+ followers)

Generates contextual, high-IQ commentary within minutes of publication to siphon
massive algorithmic reach into @defi_ambassador profile views.
Enforces the X Golden Rule: Zero links in top-level replies to secure top reply ranking.
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests

from . import queue, x_publisher

logger = logging.getLogger("reply_sniper")

STATE_DIR = Path(__file__).resolve().parents[1] / "state"
SNIPER_STATE_FILE = STATE_DIR / "sniped_tweets.json"

# Tracked authority targets with verified X user IDs
TARGET_ACCOUNTS = {
    "chesscom": {
        "id": "20745074",
        "name": "Chess.com",
        "handle": "@chesscom",
        "focus": "Viral puzzles, community debates, brilliant moves, casual engagement",
    },
    "GMHikaru": {
        "id": "64324543",
        "name": "Hikaru Nakamura",
        "handle": "@GMHikaru",
        "focus": "Bullet scrambles, speed chess psychology, dynamic tactics, tournament play",
    },
    "GothamChess": {
        "id": "996785343008595969",
        "name": "GothamChess (Levy Rozman)",
        "handle": "@GothamChess",
        "focus": "Amateur blunders, king safety/luft, opening traps, instructional insights",
    },
    "MagnusCarlsen": {
        "id": "30352096",
        "name": "Magnus Carlsen",
        "handle": "@MagnusCarlsen",
        "focus": "Subconscious pattern recognition, endgame purity, intuition under pressure",
    },
    "ton_blockchain": {
        "id": "1442437262663319565",
        "name": "TON Blockchain",
        "handle": "@ton_blockchain",
        "focus": "Telegram Mini Apps, synchronous PvP gaming, crypto mass adoption",
    },
}

# Contextual high-IQ commentary bank mapped to semantic triggers
REPLY_TEMPLATES: Dict[str, List[str]] = {
    "are_you_good": [
        "Good enough to calculate a 5-move tactic in 2 seconds, but humble enough to hang mate in 1 the instant my clock dips below 3 seconds. The board humbles everyone.",
        "Good enough to spot brilliant exchange sacrifices on move 20, but amateur enough to forget back-rank luft on move 40. Speed chess is 80% psychology.",
        "Rating says 1900, but time scramble calculation says 900. Under 5 seconds, nobody is truly good—we are all just guessing with style.",
    ],
    "brilliant_move": [
        "Kasparov’s 24.Rxd4!! against Topalov (Wijk aan Zee 1999) remains unmatched. Sacrificing the exchange not for a cheap tactic, but to drag the black king across the entire board into a geometric mating net.",
        "The most aesthetic brilliancies aren’t queen sacrifices—they are quiet pawn moves in the endgame that place the opponent in inescapable zugzwang.",
        "A move is only truly brilliant if it looks completely absurd on move 1 and completely inevitable on move 5.",
    ],
    "blitz_scramble": [
        "When the clock drops below 5 seconds, positional advantage stops existing. In scrambles, the player creating dynamic complications wins 80% of the time.",
        "Intuition in time scrambles is just pattern recognition compressed into subconscious reflex. The clock tests instinct far more than raw calculation.",
        "The fastest way to lose a won position in blitz is trying to play the cleanest engine line instead of the most uncomfortable human move.",
    ],
    "blunder_luft": [
        "The most dangerous illusion in blitz is thinking you are attacking when your king has zero air. Back-rank mates aren’t bad luck; they’re negligence.",
        "90% of amateur blitz losses come from one disease: calculating your opponent's moves instead of calculating your own king's escape squares.",
        "It takes 40 moves to build a positional masterpiece and exactly 0.5 seconds of premove carelessness to hang it all.",
    ],
    "ton_gaming": [
        "Tap-to-earn was phase 1. Real retention on Telegram Mini Apps will be driven by synchronous, skill-based PvP with sub-100ms latency.",
        "The real superpower of Telegram Bot API 8.0 isn't just payments—it's giving 900M users instant access to competitive multiplayer games in 1 tap.",
        "Gaming on TON succeeds when the gameplay is genuinely addictive first, and the blockchain settlement is invisible second.",
    ],
    "bongcloud": [
        "2.Ke2 is the only opening where both players' evaluation bar and heart rate double on move 2. Unironically unrefutable under 3 seconds.",
        "The Bongcloud (2.Ke2) doesn't violate opening principles—it asserts psychological dominance before the opponent even touches their clock.",
    ],
    "general_chess": [
        "Chess calculation is easy when you have 3 minutes. The true test of mastery is whether your subconscious intuition makes the right move in 1.5 seconds.",
        "Tactics are what you do when there is something to do; strategy is what you do when there is nothing to do. In blitz, it's tactics 100% of the time.",
        "The hardest piece to play against isn’t the opponent’s queen—it’s your own clock when you start second-guessing your first instinct.",
    ],
}


def load_sniper_state() -> Dict[str, Any]:
    """Loads the history of sniped tweets and timestamps."""
    if SNIPER_STATE_FILE.exists():
        try:
            return json.loads(SNIPER_STATE_FILE.read_text())
        except Exception as e:
            logger.warning(f"Failed to read sniper state: {e}")
    return {"last_snipe_at": None, "sniped_tweets": {}}


def save_sniper_state(state: Dict[str, Any]) -> None:
    """Persists sniper state to disk."""
    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        SNIPER_STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n")
    except Exception as e:
        logger.error(f"Failed to save sniper state: {e}")


# Negative keywords to strictly avoid sensitive, personal, or off-topic tweets
EXCLUDED_KEYWORDS = [
    "rip", "passed", "passing", "sadden", "death", "died", "mourn", "funeral",
    "condolences", "trist", "gått bort", "tribute", "tragic", "rest in peace", "sorrow",
    "deadlock",
]

CHESS_RELEVANCE_KEYWORDS = [
    "chess", "blitz", "bullet", "rapid", "elo", "grandmaster", "gm", "move", "tactic",
    "blunder", "puzzle", "board", "queen", "king", "rook", "bishop", "knight", "pawn",
    "scramble", "mate", "luft", "endgame", "opening", "ton", "mini app", "pvp",
    "speedrun", "premove", "rating", "brilliant", "tournament", "fide", "clock",
]


def is_tweet_eligible(text: str) -> bool:
    """Ensures a tweet is safe, on-topic, and not solemn/sensitive or personal vacation/off-topic."""
    low = text.lower()
    if any(k in low for k in EXCLUDED_KEYWORDS):
        return False
    # Must explicitly mention chess, speed tactics, rating, or gaming
    return any(k in low for k in CHESS_RELEVANCE_KEYWORDS)


def classify_tweet_intent(text: str, target_handle: str) -> str:
    """Identifies the conversational topic of a target tweet to pick the best commentary."""
    low = text.lower()
    if any(k in low for k in ["ke2", "bongcloud"]):
        return "bongcloud"
    elif any(k in low for k in ["good at chess", "rate your", "your rating", "how good", "be honest"]):
        return "are_you_good"
    elif any(k in low for k in ["brilliant", "best move", "favorite game", "sacrifice", "immortal"]):
        return "brilliant_move"
    elif any(k in low for k in ["blunder", "hang", "mistake", "back rank", "choke", "tilt"]):
        return "blunder_luft"
    elif any(k in low for k in ["scramble", "time trouble", "flag", "bullet", "blitz", "speedrun", "clock"]):
        return "blitz_scramble"
    elif "ton" in target_handle.lower() or any(k in low for k in ["telegram", "mini app", "ton", "web3", "pvp"]):
        return "ton_gaming"
    elif "hikaru" in target_handle.lower() or "magnus" in target_handle.lower():
        return "blitz_scramble"
    elif "gotham" in target_handle.lower():
        return "blunder_luft"
    return "general_chess"


def select_sniper_reply(target_handle: str, tweet_text: str) -> str:
    """Selects the sharpest commentary based on target intent and variety."""
    intent = classify_tweet_intent(tweet_text, target_handle)
    templates = REPLY_TEMPLATES.get(intent, REPLY_TEMPLATES["general_chess"])
    
    # Pick template deterministically by tweet hash to maintain testability and avoid repetition
    idx = abs(hash(tweet_text)) % len(templates)
    comment = templates[idx]
    
    # Ensure under 280 chars
    if len(comment) > 275:
        comment = comment[:272] + "..."
    return comment


def fetch_candidate_target_tweets(auth: Optional[Any] = None) -> List[Dict[str, Any]]:
    """Fetches latest public tweets from tracked target accounts."""
    if auth is None:
        try:
            auth = x_publisher.get_oauth1_auth()
        except Exception as e:
            logger.warning(f"Cannot get X auth for sniper: {e}")
            return []

    state = load_sniper_state()
    sniped_ids = state.get("sniped_tweets", {})
    candidates: List[Dict[str, Any]] = []

    for name, info in TARGET_ACCOUNTS.items():
        uid = info["id"]
        try:
            res = requests.get(
                f"https://api.x.com/2/users/{uid}/tweets?max_results=5&tweet.fields=created_at,text,public_metrics",
                auth=auth,
                timeout=10,
            )
            if not res.ok:
                continue
            data = res.json().get("data", [])
            for tweet in data:
                tid = str(tweet.get("id"))
                if tid in sniped_ids:
                    continue
                # Ignore @ replies by the target to other people (we want root posts)
                text = tweet.get("text", "")
                if text.startswith("@") and not text.startswith("@defi_ambassador"):
                    continue
                if not is_tweet_eligible(text):
                    continue

                candidates.append({
                    "target_name": info["name"],
                    "target_handle": info["handle"],
                    "tweet_id": tid,
                    "text": text,
                    "created_at": tweet.get("created_at"),
                    "impressions": tweet.get("public_metrics", {}).get("impression_count", 0),
                    "likes": tweet.get("public_metrics", {}).get("like_count", 0),
                    "replies": tweet.get("public_metrics", {}).get("reply_count", 0),
                })
        except Exception as e:
            logger.warning(f"Error fetching tweets for {name}: {e}")

    # Prioritize newest / highest impression tweets
    candidates.sort(key=lambda c: (c.get("impressions", 0), c.get("created_at", "")), reverse=True)
    return candidates


def snipe_next_target(
    dry_run: bool = True,
    min_cooldown_minutes: int = 60,
    force: bool = False,
) -> Dict[str, Any]:
    """Identifies the single best target tweet and dispatches a high-IQ sniper reply."""
    state = load_sniper_state()
    now = queue.utcnow()
    now_iso = queue.iso(now)

    last_snipe_str = state.get("last_snipe_at")
    if last_snipe_str and not force:
        try:
            last_dt = datetime.strptime(last_snipe_str[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
            elapsed_m = (now - last_dt).total_seconds() / 60.0
            if elapsed_m < min_cooldown_minutes:
                return {
                    "sniped": False,
                    "reason": f"Cooldown active ({elapsed_m:.1f}m < {min_cooldown_minutes}m required)",
                }
        except Exception:
            pass

    candidates = fetch_candidate_target_tweets()
    if not candidates:
        return {"sniped": False, "reason": "No unsniped candidate tweets found from targets"}

    target = candidates[0]
    comment = select_sniper_reply(target["target_handle"], target["text"])

    result = {
        "sniped": True,
        "dry_run": dry_run,
        "target": target["target_name"],
        "target_handle": target["target_handle"],
        "target_tweet_id": target["tweet_id"],
        "target_text": target["text"][:120],
        "target_impressions": target["impressions"],
        "reply_comment": comment,
        "timestamp": now_iso,
    }

    if not dry_run:
        try:
            disp = x_publisher.post_tweet(text=comment, reply_to_id=target["tweet_id"])
            reply_id = disp.get("data", {}).get("id")
            result["reply_tweet_id"] = reply_id
            result["reply_url"] = f"https://x.com/defi_ambassador/status/{reply_id}" if reply_id else None

            # Update sniper state
            state["last_snipe_at"] = now_iso
            state.setdefault("sniped_tweets", {})[target["tweet_id"]] = {
                "sniped_at": now_iso,
                "target_handle": target["target_handle"],
                "target_tweet_id": target["tweet_id"],
                "reply_id": reply_id,
                "comment": comment,
            }
            save_sniper_state(state)
            logger.info(f"Sniper SUCCESS: replied to {target['target_handle']} (tweet {target['tweet_id']})")
        except Exception as e:
            err_str = str(e)
            if "403" in err_str:
                logger.info(
                    f"[X Free Tier Limitation] Automated reply blocked by X API (requires Basic tier to reply to unmentioned third parties). "
                    f"Saved high-IQ comment to sniper_recommendations.json for 1-click deployment to {target['target_handle']}."
                )
                rec_file = STATE_DIR / "sniper_recommendations.json"
                try:
                    recs = json.loads(rec_file.read_text()) if rec_file.exists() else []
                except Exception:
                    recs = []
                recs.insert(0, {
                    "timestamp": now_iso,
                    "target": target["target_name"],
                    "handle": target["target_handle"],
                    "target_url": f"https://x.com/{target['target_handle'].lstrip('@')}/status/{target['tweet_id']}",
                    "impressions": target["impressions"],
                    "recommended_comment": comment,
                })
                try:
                    rec_file.write_text(json.dumps(recs[:50], indent=2, ensure_ascii=False) + "\n")
                except Exception:
                    pass
                result["sniped"] = False
                result["status"] = "saved_for_manual_or_basic_tier"
                result["target_url"] = f"https://x.com/{target['target_handle'].lstrip('@')}/status/{target['tweet_id']}"
                state["last_snipe_at"] = now_iso
                save_sniper_state(state)
            else:
                logger.error(f"Sniper dispatch failed: {e}", exc_info=True)
                result["sniped"] = False
                result["error"] = err_str
    else:
        logger.info(f"[DRY-RUN] Would snipe {target['target_handle']} ({target['tweet_id']}): {comment}")

    return result
