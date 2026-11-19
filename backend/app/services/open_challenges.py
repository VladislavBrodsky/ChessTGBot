"""Open challenges: a staked game anyone can accept from the Play lobby for 30 minutes.

Why this exists: every human game is staked, and a matchmaking search lives for only
WAGERED_QUEUE_TTL_SECONDS (130 s) while the app stays open. With a handful of funded
players, two of them almost never search at the same moment. An open challenge keeps
the offer alive for 30 minutes and lists it for every player who opens Play, so a
second player can arrive later (or top up first) and still get the game.

Money: an open challenge is the same paid game as a friend invitation, with nothing
new on the ledger. The creator is debited at create (POST /game/create), the guest is
debited on an explicit accept (GameService.join_game with accept_wager), an unfilled
challenge is refunded by the durable sweeper after UNFILLED_WAGER_GRACE_SECONDS, and a
filled game whose first move never comes is aborted and refunded. This module only
keeps the public index and builds the lobby listing; it never moves money.
"""
from __future__ import annotations

import html
import logging
import time
from typing import Optional

from app.services.stale_game_sweeper import UNFILLED_WAGER_GRACE_SECONDS

logger = logging.getLogger(__name__)

OPEN_CHALLENGES_KEY = "games:open_challenges"
# The listing hides a challenge a little before the sweeper refunds it, so nobody
# opens one that is about to disappear.
OPEN_CHALLENGE_LISTED_SECONDS = UNFILLED_WAGER_GRACE_SECONDS - 60
# The creator has usually left by the time someone accepts. They get a Telegram
# deep link and this long to make (or answer) the first move before the normal
# first-move abort refunds both stakes. Same window as an accepted friend request.
ACCEPTED_FIRST_MOVE_GRACE_SECONDS = 180.0
MAX_LISTED = 10


def is_listable(state, now: float) -> bool:
    """True while an open challenge still waits for a guest and can be accepted."""
    if state is None or not getattr(state, "open_challenge", False) or state.is_game_over:
        return False
    if state.bid_amount <= 0 or not state.white_player_id or state.white_player_id <= 0:
        return False
    if state.black_player_id:
        return False
    created = state.created_at
    return bool(created) and now - created < OPEN_CHALLENGE_LISTED_SECONDS


async def publish(session_manager, game_id: str) -> None:
    """Add a game to the public index. Raises if shared storage is unavailable,
    so the caller can roll the create back instead of debiting for a challenge
    nobody can see."""
    if session_manager._use_memory or not session_manager.redis:
        session_manager._memory_store.setdefault(OPEN_CHALLENGES_KEY, set()).add(game_id)
        return
    await session_manager.redis.sadd(OPEN_CHALLENGES_KEY, game_id)


async def unpublish(session_manager, game_id: str) -> None:
    if session_manager._use_memory or not session_manager.redis:
        session_manager._memory_store.setdefault(OPEN_CHALLENGES_KEY, set()).discard(game_id)
        return
    await session_manager.redis.srem(OPEN_CHALLENGES_KEY, game_id)


async def _members(session_manager) -> list[str]:
    if session_manager._use_memory or not session_manager.redis:
        return list(session_manager._memory_store.get(OPEN_CHALLENGES_KEY, set()))
    raw = await session_manager.redis.smembers(OPEN_CHALLENGES_KEY)
    return [m.decode() if isinstance(m, bytes) else m for m in raw]


async def list_open(session_manager, viewer_id: Optional[int], now: Optional[float] = None) -> list[dict]:
    """Challenges a player can accept right now, plus the viewer's own (marked
    `mine`) so they can return to or cancel it. Filled, finished, expired and
    vanished games are pruned from the index as a side effect."""
    now = time.time() if now is None else now
    listed = []
    for game_id in await _members(session_manager):
        state = await session_manager.get_game(game_id)
        if not is_listable(state, now):
            await unpublish(session_manager, game_id)
            continue
        listed.append({
            "game_id": game_id,
            "bid_amount": state.bid_amount,
            "time_control": state.time_control_seconds,
            "creator_name": state.white_username or "Player",
            "creator_elo": state.white_elo or 1000,
            "created_at": int(state.created_at),
            "expires_at": int(state.created_at + OPEN_CHALLENGE_LISTED_SECONDS),
            "mine": viewer_id is not None and state.white_player_id == viewer_id,
        })
    # The viewer's own challenge first, then the one waiting longest.
    listed.sort(key=lambda c: (not c["mine"], c["created_at"]))
    return listed[:MAX_LISTED]


def accepted_message(guest_name: str, guest_elo: Optional[int], stake_cents: int, deep_link: str) -> str:
    """Telegram text for the creator. The guest's display name is user-controlled,
    so it is escaped before it enters a parse_mode=HTML message."""
    grace_minutes = int(ACCEPTED_FIRST_MOVE_GRACE_SECONDS // 60)
    return (
        f"⚔️ <b>Your ${stake_cents / 100:.2f} challenge was accepted</b>\n\n"
        f"👤 <b>{html.escape(str(guest_name or 'Opponent'))}</b> (ELO {guest_elo or 1000}) is at the board.\n\n"
        f"⏳ You have <b>{grace_minutes} minutes</b> to open it. If the first move doesn't come, "
        f"the game is cancelled and both stakes are refunded.\n\n"
        f"<a href=\"{deep_link}\">▶️ Open the board now</a>"
    )


async def notify_creator_accepted(state, game_id: str, guest_id: int) -> None:
    """Tell the creator, who has usually left the app, that a guest took the seat."""
    from app.services.telegram_bot import TelegramService

    creator_id = state.black_player_id if state.white_player_id == guest_id else state.white_player_id
    if not creator_id or creator_id <= 0:
        return
    if state.white_player_id == guest_id:
        guest_name, guest_elo = state.white_username, state.white_elo
    else:
        guest_name, guest_elo = state.black_username, state.black_elo
    deep_link = await TelegramService.create_invite_link(game_id)
    await TelegramService.send_notification(
        creator_id, accepted_message(guest_name, guest_elo, state.bid_amount, deep_link)
    )
