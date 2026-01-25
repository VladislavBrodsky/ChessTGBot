from fastapi import APIRouter, Depends, HTTPException
from app.services.game_service import GameService
from app.services.telegram_bot import TelegramService
from pydantic import BaseModel
import uuid

router = APIRouter()

class CreateGameResponse(BaseModel):
    game_id: str
    invite_link: str

@router.post("/create", response_model=CreateGameResponse)
async def create_game():
    game_id = str(uuid.uuid4())[:8] # Short ID
    service = GameService()
    
    # Initialize Game in Redis
    await service.create_game(game_id)
    
    # Generate Telegram Invite Link
    try:
        invite_link = await TelegramService.create_invite_link(game_id)
    except Exception as e:
        # Fallback if bot request fails (e.g. network)
        print(f"Failed to generate link: {e}")
        invite_link = f"https://t.me/placeholder_bot?startapp={game_id}"

    return CreateGameResponse(game_id=game_id, invite_link=invite_link)
