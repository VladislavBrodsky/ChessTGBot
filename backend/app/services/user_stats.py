from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.crud import game_history as game_history_crud
from typing import Dict, List, Any

async def calculate_user_stats(db: AsyncSession, user: User, telegram_id: int) -> Dict[str, Any]:
    """Calculate comprehensive user statistics."""
    from sqlalchemy import select, func
    from app.models.user import User as UserModel
    
    # Basic stats from user model
    total_games = user.games_played
    wins = user.wins
    losses = user.losses
    draws = user.draws
    
    # Calculate global rank and percentile
    total_users_stmt = select(func.count(UserModel.id))
    total_users_res = await db.execute(total_users_stmt)
    total_users = total_users_res.scalars().first() or 1

    higher_elo_stmt = select(func.count(UserModel.id)).where(UserModel.elo > user.elo)
    higher_elo_res = await db.execute(higher_elo_stmt)
    higher_elo_count = higher_elo_res.scalars().first() or 0
    global_rank = higher_elo_count + 1

    percentile = round(((total_users - global_rank) / total_users * 100), 1) if total_users > 0 else 100.0
    
    # Calculate rates
    win_rate = round((wins / total_games * 100), 1) if total_games > 0 else 0.0
    loss_rate = round((losses / total_games * 100), 1) if total_games > 0 else 0.0
    draw_rate = round((draws / total_games * 100), 1) if total_games > 0 else 0.0
    
    # Chess.com standard score: win = 1.0, draw = 0.5, loss = 0.0
    total_score = float(wins * 1.0 + draws * 0.5)

    # Calculate current streak
    recent_games = await game_history_crud.get_user_recent_games(db, telegram_id, limit=20)
    current_streak = _calculate_current_streak(recent_games, telegram_id)
    
    # Calculate best streak
    best_streak = _calculate_best_streak(recent_games, telegram_id)
    
    # Get recent games for display (last 3)
    recent_games_display = await _format_recent_games(db, recent_games[:3], telegram_id)
    
    return {
        "win_rate": win_rate,
        "loss_rate": loss_rate,
        "draw_rate": draw_rate,
        "global_rank": global_rank,
        "percentile": percentile,
        "total_score": total_score,
        "current_streak": current_streak,
        "best_streak": best_streak,
        "recent_games": recent_games_display,
    }

def _calculate_current_streak(games: List, user_telegram_id: int) -> Dict[str, Any]:
    """Calculate the current win/loss streak."""
    if not games:
        return {"type": None, "count": 0}
    
    streak_type = None
    streak_count = 0
    
    for game in games:
        # Determine if user won, lost, or drew
        is_white = game.white_player_id == user_telegram_id
        
        if game.winner is None:
            # Draw breaks streak
            break
        elif (is_white and game.winner == 'w') or (not is_white and game.winner == 'b'):
            # Win
            if streak_type is None:
                streak_type = 'win'
            if streak_type == 'win':
                streak_count += 1
            else:
                break
        else:
            # Loss
            if streak_type is None:
                streak_type = 'loss'
            if streak_type == 'loss':
                streak_count += 1
            else:
                break
    
    return {"type": streak_type, "count": streak_count}

def _calculate_best_streak(games: List, user_telegram_id: int) -> Dict[str, Any]:
    """Calculate the best win streak from game history."""
    if not games:
        return {"wins": 0, "date": None}
    
    max_streak = 0
    current_streak = 0
    max_streak_date = None
    
    for game in reversed(games):  # Go from oldest to newest
        is_white = game.white_player_id == user_telegram_id
        
        if game.winner is None:
            # Draw breaks streak
            current_streak = 0
        elif (is_white and game.winner == 'w') or (not is_white and game.winner == 'b'):
            # Win
            current_streak += 1
            if current_streak > max_streak:
                max_streak = current_streak
                max_streak_date = game.ended_at
        else:
            # Loss
            current_streak = 0
    
    return {"wins": max_streak, "date": max_streak_date}

async def _format_recent_games(db: AsyncSession, games: List, user_telegram_id: int) -> List[Dict[str, Any]]:
    """Format recent games for frontend display with optimized bulk-fetching."""
    from sqlalchemy.future import select
    from app.models.user import User
    
    if not games:
        return []
    
    # 1. Collect all unique opponent IDs
    opponent_ids = {
        game.black_player_id if game.white_player_id == user_telegram_id else game.white_player_id
        for game in games
    }
    
    # 2. Bulk fetch all opponents in one query
    db_result = await db.execute(select(User).filter(User.telegram_id.in_(opponent_ids)))
    opponents_map = {u.telegram_id: u for u in db_result.scalars().all()}
    
    formatted_games = []
    
    for game in games:
        is_white = game.white_player_id == user_telegram_id
        opponent_id = game.black_player_id if is_white else game.white_player_id
        
        opponent = opponents_map.get(opponent_id)
        if opponent_id == -1:
            opponent_name = "A.I. Coach"
        else:
            if opponent:
                first = opponent.first_name or ""
                last = opponent.last_name or ""
                full_name = f"{first} {last}".strip()
                opponent_name = full_name if full_name else f"User_{opponent_id}"
            else:
                opponent_name = f"User_{opponent_id}"
        opponent_elo = opponent.elo if (opponent and opponent.elo is not None) else 1000
        
        # Determine result
        result = 'draw'
        if game.winner:
            if (is_white and game.winner == 'w') or (not is_white and game.winner == 'b'):
                result = 'win'
            else:
                result = 'loss'
        
        # Calculate ELO change for user (with null-guards for legacy/aborted matches)
        white_after = game.white_elo_after if game.white_elo_after is not None else 1000
        white_before = game.white_elo_before if game.white_elo_before is not None else 1000
        black_after = game.black_elo_after if game.black_elo_after is not None else 1000
        black_before = game.black_elo_before if game.black_elo_before is not None else 1000
        
        if is_white:
            elo_change = white_after - white_before
        else:
            elo_change = black_after - black_before
        
        formatted_games.append({
            "game_id": game.game_id,
            "opponent": {
                "name": opponent_name,
                "elo": opponent_elo
            },
            "result": result,
            "elo_change": elo_change,
            "played_at": game.ended_at.isoformat() if game.ended_at else None,
            "duration_seconds": game.duration_seconds
        })
    
    return formatted_games
