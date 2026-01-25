from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.crud import game_history as game_history_crud
from typing import Dict, List, Optional, Any
from datetime import datetime

async def calculate_user_stats(db: AsyncSession, user: User, telegram_id: int) -> Dict[str, Any]:
    """Calculate comprehensive user statistics."""
    
    # Basic stats from user model
    total_games = user.games_played
    wins = user.wins
    losses = user.losses
    draws = user.draws
    
    # Calculate win rate
    win_rate = round((wins / total_games * 100), 1) if total_games > 0 else 0.0
    
    # Calculate current streak
    recent_games = await game_history_crud.get_user_recent_games(db, telegram_id, limit=20)
    current_streak = _calculate_current_streak(recent_games, telegram_id)
    
    # Calculate best streak
    best_streak = _calculate_best_streak(recent_games, telegram_id)
    
    # Get recent games for display (last 3)
    recent_games_display = await _format_recent_games(db, recent_games[:3], telegram_id)
    
    return {
        "win_rate": win_rate,
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
    """Format recent games for frontend display."""
    from app.crud import user as user_crud
    
    formatted_games = []
    
    for game in games:
        is_white = game.white_player_id == user_telegram_id
        opponent_id = game.black_player_id if is_white else game.white_player_id
        
        # Fetch opponent info
        opponent = await user_crud.get_user_by_telegram_id(db, opponent_id)
        opponent_name = opponent.first_name if opponent else f"User_{opponent_id}"
        opponent_elo = opponent.elo if opponent else 1000
        
        # Determine result
        result = 'draw'
        if game.winner:
            if (is_white and game.winner == 'w') or (not is_white and game.winner == 'b'):
                result = 'win'
            else:
                result = 'loss'
        
        # Calculate ELO change for user
        if is_white:
            elo_change = game.white_elo_after - game.white_elo_before
        else:
            elo_change = game.black_elo_after - game.black_elo_before
        
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
