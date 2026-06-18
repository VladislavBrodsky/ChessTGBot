from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.models.game_history import GameHistory
from datetime import datetime, timezone
from typing import List, Optional

async def create_game_history(
    db: AsyncSession,
    game_id: str,
    white_player_id: int,
    black_player_id: int,
    winner: Optional[str],
    result_type: str,
    white_elo_before: int,
    white_elo_after: int,
    black_elo_before: int,
    black_elo_after: int,
    total_moves: int = 0,
    duration_seconds: Optional[int] = None,
    final_fen: Optional[str] = None,
    game_type: str = 'online',
    created_at: Optional[datetime] = None,
    ended_at: Optional[datetime] = None,
    bid_amount: int = 0,
    platform_rake: int = 0,
    payout_amount: int = 0,
    moves_json: Optional[str] = None,
    commit: bool = True
) -> GameHistory:
    """Create a new game history record."""
    db_game = GameHistory(
        game_id=game_id,
        white_player_id=white_player_id,
        black_player_id=black_player_id,
        winner=winner,
        result_type=result_type,
        white_elo_before=white_elo_before,
        white_elo_after=white_elo_after,
        black_elo_before=black_elo_before,
        black_elo_after=black_elo_after,
        total_moves=total_moves,
        duration_seconds=duration_seconds,
        final_fen=final_fen,
        game_type=game_type,
        created_at=created_at or datetime.now(timezone.utc).replace(tzinfo=None),
        ended_at=ended_at or datetime.now(timezone.utc).replace(tzinfo=None),
        bid_amount=bid_amount,
        platform_rake=platform_rake,
        payout_amount=payout_amount,
        moves_json=moves_json
    )
    db.add(db_game)
    if commit:
        await db.commit()
        await db.refresh(db_game)
    else:
        await db.flush()
        await db.refresh(db_game)
    return db_game

async def get_user_recent_games(db: AsyncSession, telegram_id: int, limit: int = 10) -> List[GameHistory]:
    """Get recent games for a user."""
    result = await db.execute(
        select(GameHistory)
        .filter(
            (GameHistory.white_player_id == telegram_id) | 
            (GameHistory.black_player_id == telegram_id)
        )
        .order_by(desc(GameHistory.ended_at))
        .limit(limit)
    )
    return result.scalars().all()

async def get_user_game_count(db: AsyncSession, telegram_id: int) -> int:
    """Get total number of games played by user."""
    from sqlalchemy import func
    result = await db.execute(
        select(func.count(GameHistory.id))
        .filter(
            (GameHistory.white_player_id == telegram_id) | 
            (GameHistory.black_player_id == telegram_id)
        )
    )
    return result.scalar() or 0
