"""Real, cheap lobby numbers for the Play screen: how many players are waiting for an opponent right now and how many
human games finished in the last 24 hours.

Both numbers are measured, never estimated or padded. The Mini App shows them only when they are above zero, so a quiet
lobby looks quiet instead of being filled with invented activity. Results are cached briefly so a lobby full of clients
polling every few seconds costs one queue scan and one COUNT query per window, not one per client.
"""
from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from typing import Awaitable, Callable, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.game_history import GameHistory

SEARCHING_TTL_SECONDS = 5.0
GAMES_TTL_SECONDS = 60.0


async def _count_games_24h(db: AsyncSession) -> int:
    since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24)
    result = await db.execute(
        select(func.count(GameHistory.id)).where(GameHistory.ended_at >= since, GameHistory.game_type == "online")
    )
    return int(result.scalar() or 0)


async def _recent_results(db: AsyncSession, limit: int = 5) -> list[dict]:
    """Anonymous, real recent decisive human games: no names, ids or money amounts."""
    since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24)
    rows = (await db.execute(
        select(GameHistory)
        .where(GameHistory.ended_at >= since, GameHistory.game_type == "online", GameHistory.winner.in_(["w", "b"]))
        .order_by(GameHistory.ended_at.desc())
        .limit(limit)
    )).scalars().all()
    results = []
    for game in rows:
        before = game.white_elo_before if game.winner == "w" else game.black_elo_before
        after = game.white_elo_after if game.winner == "w" else game.black_elo_after
        gain = (after - before) if isinstance(before, int) and isinstance(after, int) else None
        results.append({
            "result_type": game.result_type if game.result_type in {"checkmate", "resignation", "timeout", "abandon"} else "checkmate",
            "elo_gain": gain if gain is not None and gain > 0 else None,
            "ended_at": game.ended_at.replace(tzinfo=timezone.utc).isoformat() if game.ended_at else None,
        })
    return results


async def _count_searching(exclude_user_id: Optional[int]) -> int:
    from app.services.matchmaker import MatchmakerService

    counts = await MatchmakerService().get_queue_counts(0, 600, exclude_user_id=exclude_user_id)
    return int(counts.get("real_total_opponents", 0))


class LobbyStatsService:
    def __init__(
        self,
        searching_counter: Callable[[Optional[int]], Awaitable[int]] = _count_searching,
        games_counter: Callable[[AsyncSession], Awaitable[int]] = _count_games_24h,
        recent_counter: Callable[[AsyncSession], Awaitable[list[dict]]] = _recent_results,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._searching_counter = searching_counter
        self._games_counter = games_counter
        self._recent_counter = recent_counter
        self._clock = clock
        self._searching_total: Optional[tuple[float, int, Optional[int]]] = None
        self._games: Optional[tuple[float, int, list[dict]]] = None

    async def get(self, db: AsyncSession, viewer_id: Optional[int]) -> dict:
        now = self._clock()
        # The searching figure excludes the viewer, so it is cached per viewer id.
        cached = self._searching_total
        if cached is None or now - cached[0] > SEARCHING_TTL_SECONDS or cached[2] != viewer_id:
            try:
                searching = await self._searching_counter(viewer_id)
            except Exception:  # a queue-store hiccup must never break the lobby
                searching = 0
            self._searching_total = (now, max(0, searching), viewer_id)
        if self._games is None or now - self._games[0] > GAMES_TTL_SECONDS:
            try:
                games = await self._games_counter(db)
                recent = await self._recent_counter(db)
            except Exception:
                games = self._games[1] if self._games else 0
                recent = self._games[2] if self._games else []
            self._games = (now, max(0, games), recent)
        return {"searching": self._searching_total[1], "games_24h": self._games[1], "recent": self._games[2], "counted_at": int(time.time())}


lobby_stats_service = LobbyStatsService()
