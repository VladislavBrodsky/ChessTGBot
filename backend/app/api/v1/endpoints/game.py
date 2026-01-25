from fastapi import APIRouter, Depends, HTTPException
from app.services.game_service import GameService
from app.services.telegram_bot import TelegramService
from pydantic import BaseModel
import uuid
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud import user as user_crud
from app.core.config import get_settings

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
async def create_game(type: str = "online"):
    game_id = str(uuid.uuid4())[:8] # Short ID
    service = GameService()
    
    is_bot_game = (type == "computer")
    
    # Initialize Game in Redis
    await service.create_game(game_id, is_bot_game=is_bot_game)
    
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
            # Ensure we use a valid T.me link if possible
            invite_link = f"https://t.me/placeholder_bot?startapp={game_id}"

    return CreateGameResponse(game_id=game_id, invite_link=invite_link)

@router.post("/end", response_model=EndGameResponse)
async def end_game(req: EndGameRequest, db: AsyncSession = Depends(get_db)):
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

    new_winner_elo = service.calculate_new_elo(winner.elo, loser.elo, win_score)
    new_loser_elo = service.calculate_new_elo(loser.elo, winner.elo, lose_score)

    # Update DB
    await user_crud.update_elo(db, winner, new_winner_elo, 'draw' if req.draw else 'win')
    await user_crud.update_elo(db, loser, new_loser_elo, 'draw' if req.draw else 'loss')

    return EndGameResponse(
        status="success",
        winner_new_elo=new_winner_elo,
        loser_new_elo=new_loser_elo
    )
