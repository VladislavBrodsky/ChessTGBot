from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.services.game_service import GameService
from app.services.telegram_bot import TelegramService
from pydantic import BaseModel
import uuid
from app.core.database import get_db, get_read_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.api.v1.deps import get_current_user, rate_limit
from app.models.user import User

settings = get_settings()

router = APIRouter()

class CreateGameResponse(BaseModel):
    game_id: str
    invite_link: str

@router.post("/create", response_model=CreateGameResponse, dependencies=[Depends(rate_limit(limit=5, window=60))])
async def create_game(
    type: str = "online",
    time_control: int = 600,
    wager: int = 0,
    difficulty: Optional[str] = "medium",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    game_id = str(uuid.uuid4())[:8] # Short ID
    service = GameService()
    
    is_bot_game = (type == "computer")
    
    # Verify and deduct balance if wager > 0 and type is online
    if not is_bot_game and wager > 0:
        from sqlalchemy import text
        from app.models.transaction import Transaction
        
        # Lock user balance to prevent race conditions atomically
        update_stmt = text(
            "UPDATE users SET balance = balance - :wager WHERE telegram_id = :telegram_id AND balance >= :wager RETURNING id"
        )
        res = await db.execute(update_stmt, {"wager": wager, "telegram_id": current_user.telegram_id})
        updated_id = res.scalar_one_or_none()
        
        if not updated_id:
            raise HTTPException(status_code=400, detail="Insufficient funds. Please top up your Web3 Wallet.")
        
        tx = Transaction(
            user_id=current_user.telegram_id,
            type="game_wager",
            amount=-wager,
            fee=0,
            status="completed",
            reference_id=game_id
        )
        db.add(tx)
        await db.commit()
    
    # Initialize Game in Redis
    await service.create_game(game_id, is_bot_game=is_bot_game, time_control_seconds=time_control, bid_amount=wager, difficulty=difficulty)
    
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
            invite_link = f"https://t.me/{bot_username}/app?startapp={game_id}"

    return CreateGameResponse(game_id=game_id, invite_link=invite_link)

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
    difficulty: Optional[str] = None

from typing import List, Optional

@router.get("/history/{game_id}", response_model=GameHistoryDetails)
async def get_game_history(
    game_id: str,
    db: AsyncSession = Depends(get_read_db),
    # Require authentication: this endpoint returns both players' telegram_ids,
    # names, ELO, and full move list. Game IDs are short (8 hex chars) and leak in
    # invite links, so leaving this open allowed anonymous enumeration/harvesting.
    current_user: User = Depends(get_current_user),
):
    from app.models.game_history import GameHistory
    from app.models.user import User
    from sqlalchemy.future import select
    from app.services.session_manager import SessionManager
    import json
    import asyncio

    session_mgr = SessionManager()
    cache_key = f"game_history:{game_id}"
    
    if session_mgr.redis and not session_mgr._use_memory:
        try:
            cached = await session_mgr.redis.get(cache_key)
            if cached:
                return GameHistoryDetails.model_validate_json(cached)
        except Exception:
            pass

    stmt = select(GameHistory).where(GameHistory.game_id == game_id)
    res = await db.execute(stmt)
    history = res.scalars().first()
    if not history:
        raise HTTPException(status_code=404, detail="Game history not found")

    # Fetch Player Names concurrently
    white_name = "White Player"
    black_name = "Black Player"
    white_coro = None
    black_coro = None

    if history.white_player_id != -1:
        white_coro = db.execute(select(User).where(User.telegram_id == history.white_player_id))
    if history.black_player_id != -1:
        black_coro = db.execute(select(User).where(User.telegram_id == history.black_player_id))

    # We gather the DB requests in parallel, preventing the N+1 waterfall
    results = await asyncio.gather(
        white_coro if white_coro else asyncio.sleep(0),
        black_coro if black_coro else asyncio.sleep(0)
    )

    if white_coro and results[0]:
        white_user = results[0].scalars().first()
        if white_user:
            white_name = white_user.first_name

    if black_coro and results[1]:
        black_user = results[1].scalars().first()
        if black_user:
            black_name = black_user.first_name

    try:
        moves_list = json.loads(history.moves_json) if history.moves_json else []
    except Exception:
        moves_list = []

    response_data = GameHistoryDetails(
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
        ended_at=history.ended_at.isoformat(),
        difficulty=history.difficulty
    )
    
    # Cache finished games indefinitely
    if session_mgr.redis and not session_mgr._use_memory and history.winner:
        try:
            await session_mgr.redis.set(cache_key, response_data.model_dump_json(), ex=86400 * 7) # cache for 7 days
        except Exception:
            pass

    return response_data


@router.get("/active")
async def get_active_game(
    current_user: User = Depends(get_current_user)
):
    service = GameService()
    active_game_id = await service.get_active_game_for_user(current_user.telegram_id)
    return {"active_game_id": active_game_id}

