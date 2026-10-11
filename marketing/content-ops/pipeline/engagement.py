"""Lifecycle recommendations and live reward-claim gate. No DM delivery."""
from __future__ import annotations
import html
import json
from urllib.request import urlopen

CATALOG_URL = "https://api.web3chess.online/api/v1/gamification/engagement/catalog"
CAMPAIGN = "first-three-v1"
EXPECTED_REWARDS = [
    {"key": "xp_250", "probability_percent": 60},
    {"key": "boost_24h", "probability_percent": 30},
    {"key": "border_gold", "probability_percent": 10},
]

MESSAGES = {
    "welcome": "♟️ <b>{name}, your first three start here.</b>\n\nJoin the free quest on Home, then finish three qualifying AI games. Unlock one Epic Mystery Box with XP, an XP boost or a gold profile border. Every box contains a virtual reward. See odds and rules before joining.",
    "one_left": "♟️ <b>Two games done. One to go.</b>\n\nYour Epic Mystery Box is one qualifying free AI game away. Take your time: this quest has no deadline. Finish the game, then open your box on Home.",
    "claim": "🎁 <b>You earned it, {name}.</b>\n\nYour three qualifying games are complete. Your free Epic Mystery Box is ready on Home. Open it to reveal your virtual reward. One box per account; rewards have no cash value.",
    "comeback": "♟️ <b>A good comeback starts with one move.</b>\n\nTry a free AI game. This time, pause before every capture: what can your opponent take back? One game is enough to get going again.",
    "share": "♟️ <b>Pass the next move to a friend.</b>\n\nYour reward is claimed. Share your personal invite link from Profile with a friend who enjoys chess. Ask them to try a free AI game and compare what you learned.",
}


def recommend(snapshot: dict) -> dict | None:
    """Given verified events, propose one message. The caller records any send.

    Snapshot: opted_in, blocked, in_game, hours_since_last_message,
    messages_last_7d, days_inactive, quest_state, quest_progress, name.
    Never accepts progress inferred from clicks or message forwards.
    """
    if not snapshot.get("opted_in") or snapshot.get("blocked") or snapshot.get("in_game"):
        return None
    if snapshot.get("hours_since_last_message", 0) < 24 or snapshot.get("messages_last_7d", 3) >= 3:
        return None
    state = snapshot.get("quest_state")
    key = "claim" if state == "claimable" else "one_left" if state == "active" and snapshot.get("quest_progress") == 2 else "comeback" if snapshot.get("days_inactive", 0) >= 7 else "welcome" if state == "available" else "share" if state == "claimed" else None
    if not key:
        return None
    if key in {"welcome", "one_left", "claim"} and not snapshot.get("quest_enabled"):
        return None
    name = html.escape(str(snapshot.get("name") or "Chess player"), quote=True)
    return {"message_key": key, "text": MESSAGES[key].format(name=name), "cta": "play"}


def validate_live_catalog(live: dict):
    expected = {
        "campaign_id": CAMPAIGN, "enabled": True, "target": 3, "minimum_plies": 20,
        "game_type": "computer", "once_per_account": True, "cash_value": False,
        "rewards": EXPECTED_REWARDS, "duplicate_reward": "xp_250",
    }
    if any(live.get(key) != value for key, value in expected.items()):
        raise RuntimeError("Reward campaign is not live with the advertised rules; keep the post in draft")


def assert_live_offer(post: dict):
    requirement = post.get("requires_campaign")
    if post.get("creative", {}).get("template") == "reward" and requirement is None:
        raise RuntimeError("Reward ads require an explicit live campaign")
    if requirement is None:
        return
    if requirement != CAMPAIGN:
        raise RuntimeError("Unknown reward campaign")
    try:
        with urlopen(CATALOG_URL, timeout=15) as response:
            live = json.load(response)
        validate_live_catalog(live)
    except Exception:
        raise RuntimeError("Reward campaign is not confirmed live; deploy and enable it before posting") from None
