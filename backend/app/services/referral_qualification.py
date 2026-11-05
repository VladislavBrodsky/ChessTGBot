"""Shared qualification filters for referral credits and read-only progress."""
from sqlalchemy import or_
from app.models.game_history import GameHistory


def qualifying_referral_games(telegram_id, referred_at, min_moves):
    return (
        or_(
            GameHistory.white_player_id == telegram_id,
            GameHistory.black_player_id == telegram_id,
        ),
        GameHistory.total_moves >= min_moves,
        GameHistory.game_type == "online",
        GameHistory.bid_amount > 0,
        GameHistory.white_player_id > 0,
        GameHistory.black_player_id > 0,
        GameHistory.white_player_id != GameHistory.black_player_id,
        GameHistory.result_type.in_(["checkmate", "resignation", "timeout", "draw", "stalemate", "insufficient_material", "threefold_repetition", "fifty_move", "agreed_draw"]),
        GameHistory.ended_at >= referred_at,
    )
