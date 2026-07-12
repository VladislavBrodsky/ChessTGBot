from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models.user import User

router = APIRouter()


@router.get("/status")
async def arena_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Current/next daily arena: schedule, live standings, and my participation."""
    from app.models.arena import Arena
    from app.services.arena_service import (
        ArenaService, PRIZE_XP, PARTICIPATION_XP, _utcnow
    )

    service = ArenaService()
    now = _utcnow()

    # A live/settling arena wins; otherwise the next scheduled window.
    res = await db.execute(select(Arena).where(Arena.status.in_(["live", "settling"])))
    arena = res.scalars().first()
    if arena:
        starts_at, ends_at = arena.starts_at, arena.ends_at
        status = arena.status
    else:
        starts_at, ends_at = ArenaService.window_for(now)
        res = await db.execute(select(Arena).where(Arena.starts_at == starts_at))
        arena = res.scalars().first()
        status = arena.status if arena else "scheduled"

    standings = []
    me = None
    players = []
    if arena:
        players = await service.standings(db, arena.id, limit=0)
        tids = [p.user_id for p in players]
        names = {}
        if tids:
            ures = await db.execute(select(User.telegram_id, User.first_name, User.username)
                                    .where(User.telegram_id.in_(tids)))
            for tid, first_name, username in ures.all():
                names[tid] = username or first_name or f"User_{tid}"
        for rank, p in enumerate(players, start=1):
            row = {
                "rank": rank,
                "user_id": p.user_id,
                "name": names.get(p.user_id, f"User_{p.user_id}"),
                "score": p.score,
                "wins": p.wins,
                "draws": p.draws,
                "losses": p.losses,
                "games_played": p.games_played,
            }
            if p.user_id == current_user.telegram_id:
                me = row
            if rank <= 10:
                standings.append(row)

    return {
        "status": status,  # scheduled | live | settling | finished
        "starts_at": starts_at.isoformat() + "Z",
        "ends_at": ends_at.isoformat() + "Z",
        "server_now": now.isoformat() + "Z",
        "time_control_seconds": arena.time_control_seconds if arena else 300,
        "prizes_xp": PRIZE_XP,
        "participation_xp": PARTICIPATION_XP,
        "participants": len(players),
        "standings": standings,
        "me": me,
        "in_pool": current_user.telegram_id in service.pool,
    }
