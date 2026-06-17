from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.services.game_service import GameService
from app.services.telegram_bot import TelegramService
from pydantic import BaseModel
import uuid
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud import user as user_crud
from app.core.config import get_settings
from app.api.v1.deps import get_current_user
from app.models.user import User

settings = get_settings()

router = APIRouter()

class CreateGameResponse(BaseModel):
    game_id: str
    invite_link: str

class EndGameRequest(BaseModel):
    game_id: str
    winner_id: int
    loser_id: int
    draw: bool = False

class EndGameResponse(BaseModel):
    status: str
    winner_new_elo: int
    loser_new_elo: int

@router.post("/create", response_model=CreateGameResponse)
async def create_game(
    type: str = "online",
    time_control: int = 600,
    current_user: User = Depends(get_current_user)
):
    game_id = str(uuid.uuid4())[:8] # Short ID
    service = GameService()
    
    is_bot_game = (type == "computer")
    
    # Initialize Game in Redis
    await service.create_game(game_id, is_bot_game=is_bot_game, time_control_seconds=time_control)
    
    # Generate Telegram Invite Link
    if is_bot_game:
        # No invite link for bot game, or link back to the app?
        invite_link = f"{settings.WEBAPP_URL}?startapp={game_id}"
    else:
        try:
            invite_link = await TelegramService.create_invite_link(game_id)
        except Exception as e:
            # Fallback if bot request fails (e.g. network)
            print(f"Failed to generate link: {e}")
            bot_username = settings.TELEGRAM_BOT_USERNAME or "FinChess_bot"
            invite_link = f"https://t.me/{bot_username}/chess?startapp={game_id}"

    return CreateGameResponse(game_id=game_id, invite_link=invite_link)

@router.post("/end", response_model=EndGameResponse)
async def end_game(
    req: EndGameRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.telegram_id not in (req.winner_id, req.loser_id):
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You are not a player in this game"
        )

    service = GameService()
    
    # Fetch Users
    winner = await user_crud.get_user_by_telegram_id(db, req.winner_id)
    loser = await user_crud.get_user_by_telegram_id(db, req.loser_id)

    # Auto-create if not exist (for MVP)
    if not winner:
        winner = await user_crud.create_user(db, req.winner_id, f"User_{req.winner_id}")
    if not loser:
        loser = await user_crud.create_user(db, req.loser_id, f"User_{req.loser_id}")

    # Calculate ELO
    win_score = 0.5 if req.draw else 1.0
    lose_score = 0.5 if req.draw else 0.0

    k_winner = service.calculate_k_factor(winner.elo, winner.games_played)
    k_loser = service.calculate_k_factor(loser.elo, loser.games_played)

    new_winner_elo = service.calculate_new_elo(winner.elo, loser.elo, win_score, k=k_winner)
    new_loser_elo = service.calculate_new_elo(loser.elo, winner.elo, lose_score, k=k_loser)

    # Update DB
    await user_crud.update_elo(db, winner, new_winner_elo, 'draw' if req.draw else 'win')
    await user_crud.update_elo(db, loser, new_loser_elo, 'draw' if req.draw else 'loss')

    return EndGameResponse(
        status="success",
        winner_new_elo=new_winner_elo,
        loser_new_elo=new_loser_elo
    )

class GameHistoryDetails(BaseModel):
    game_id: str
    white_player_id: int
    black_player_id: int
    winner: Optional[str]
    result_type: str
    white_name: str
    black_name: str
    white_elo_before: int
    white_elo_after: int
    black_elo_before: int
    black_elo_after: int
    total_moves: int
    final_fen: Optional[str]
    moves: List[str]
    game_type: str
    ended_at: str

from typing import List, Optional

@router.get("/history/{game_id}", response_model=GameHistoryDetails)
async def get_game_history(game_id: str, db: AsyncSession = Depends(get_db)):
    from app.models.game_history import GameHistory
    from app.models.user import User
    from sqlalchemy.future import select
    import json

    stmt = select(GameHistory).where(GameHistory.game_id == game_id)
    res = await db.execute(stmt)
    history = res.scalars().first()
    if not history:
        raise HTTPException(status_code=404, detail="Game history not found")

    # Fetch Player Names
    white_name = "White Player"
    black_name = "Black Player"

    if history.white_player_id == -1:
        white_name = "AI Engine"
    else:
        white_res = await db.execute(select(User).where(User.telegram_id == history.white_player_id))
        white_user = white_res.scalars().first()
        if white_user:
            white_name = white_user.first_name

    if history.black_player_id == -1:
        black_name = "AI Engine"
    else:
        black_res = await db.execute(select(User).where(User.telegram_id == history.black_player_id))
        black_user = black_res.scalars().first()
        if black_user:
            black_name = black_user.first_name

    try:
        moves_list = json.loads(history.moves_json) if history.moves_json else []
    except Exception:
        moves_list = []

    return GameHistoryDetails(
        game_id=history.game_id,
        white_player_id=history.white_player_id,
        black_player_id=history.black_player_id,
        winner=history.winner,
        result_type=history.result_type or "checkmate",
        white_name=white_name,
        black_name=black_name,
        white_elo_before=history.white_elo_before,
        white_elo_after=history.white_elo_after,
        black_elo_before=history.black_elo_before,
        black_elo_after=history.black_elo_after,
        total_moves=history.total_moves,
        final_fen=history.final_fen,
        moves=moves_list,
        game_type=history.game_type,
        ended_at=history.ended_at.isoformat()
    )

