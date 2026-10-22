from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Literal
from app.services.game_service import GameService
from app.services.telegram_bot import TelegramService
from pydantic import BaseModel, Field
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

ALLOWED_GAME_TYPES = {"online", "computer"}
MIN_TIME_CONTROL_SECONDS = 60
MAX_TIME_CONTROL_SECONDS = 3600
MIN_WAGER_CENTS = 100


def normalise_create_request(game_type: str, time_control: int, wager: int) -> tuple[bool, int, int]:
    """Validate a create-game request and return (is_bot_game, time_control, stake_cents).

    A bot game never carries a stake: the stored value is forced to 0, so no later path (abort refund, settlement)
    can ever pay out money that was never debited. Friend games may be free; positive stakes must be at least $1.00, and every game
    needs a bounded clock so a rigged huge time control cannot defeat timeout-based forfeits.
    """
    if game_type not in ALLOWED_GAME_TYPES:
        raise HTTPException(status_code=400, detail="Unknown game type.")
    if not MIN_TIME_CONTROL_SECONDS <= time_control <= MAX_TIME_CONTROL_SECONDS:
        raise HTTPException(status_code=400, detail="Invalid time control.")
    is_bot_game = game_type == "computer"
    if is_bot_game:
        return True, time_control, 0
    if wager < 0 or 0 < wager < MIN_WAGER_CENTS:
        raise HTTPException(status_code=400, detail="Minimum wager is $1.00 (100 cents).")
    return False, time_control, wager


@router.post("/create", response_model=CreateGameResponse, dependencies=[Depends(rate_limit(limit=5, window=60))])
async def create_game(
    type: str = "online",
    time_control: int = 600,
    wager: int = 100,
    difficulty: Optional[str] = "medium",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    game_id = uuid.uuid4().hex
    service = GameService()

    is_bot_game, time_control, wager = normalise_create_request(type, time_control, wager)

    from app.services.player_tracking import create_launch
    launch = None if is_bot_game else await create_launch(db, destination="game", game_id=game_id,
                                 campaign="friend_challenge", inviter_id=current_user.telegram_id)

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

    # Initialize Game in Redis
    try:
        state = await service.create_game(game_id, is_bot_game=is_bot_game, time_control_seconds=time_control, bid_amount=wager, difficulty=difficulty)
        state.white_player_id = current_user.telegram_id
        state.white_username = current_user.first_name
        state.white_elo = current_user.elo
        state.invite_token = launch.token if launch else None
        if not is_bot_game and wager == 0:
            state.first_move_grace_seconds = 180.0
        from app.services.engagement_campaign import ensure_enrolled
        await ensure_enrolled(db, current_user)
        await service.session_manager.save_game(game_id, state)
        await db.commit()
    except Exception:
        await db.rollback()
        # The unshared game was never returned to a client and no debit committed.
        try:
            await service.session_manager.delete_game(game_id)
        except Exception:
            pass
        raise

    from app.services.mini_app_links import app_link
    invite_link = app_link(f"go_{launch.token}") if launch else ""
    return CreateGameResponse(game_id=game_id, invite_link=invite_link)


@router.get("/launch/{token}")
async def resolve_player_launch(token: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.services.player_tracking import resolve_launch, attribute_launch
    launch = await resolve_launch(db, token)
    if not launch:
        raise HTTPException(status_code=404, detail="This invitation is unavailable or expired")
    if launch.destination == "game":
        state = await GameService().session_manager.get_game(launch.game_id)
        if state is None or state.is_game_over:
            raise HTTPException(status_code=410, detail="This game invitation has expired")
    await attribute_launch(db, current_user, launch)
    await db.commit()
    return {"destination": launch.destination, "game_id": launch.game_id}


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

from typing import List, Optional  # noqa: E402

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


@router.get("/lobby-stats", dependencies=[Depends(rate_limit(limit=30, window=60))])
async def get_lobby_stats(
    db: AsyncSession = Depends(get_read_db),
    current_user: User = Depends(get_current_user),
):
    """Measured lobby activity (players waiting, human games in the last 24 h). Never padded; zero is a valid answer."""
    from app.services.lobby_stats import lobby_stats_service

    return await lobby_stats_service.get(db, current_user.telegram_id)


@router.get("/active")
async def get_active_game(
    current_user: User = Depends(get_current_user)
):
    service = GameService()
    active_game_id = await service.get_active_game_for_user(current_user.telegram_id)
    return {"active_game_id": active_game_id}



class FriendLaunchRequest(BaseModel):
    parameter: str = Field(min_length=1, max_length=64)


class FriendResponseRequest(BaseModel):
    action: Literal['accept', 'decline', 'cancel']


@router.post('/friends/preview', dependencies=[Depends(rate_limit(limit=30, window=60))])
async def preview_friend_invitation(payload: FriendLaunchRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.services.friend_invites import preview, remember_launch
    result = await preview(db, current_user, payload.parameter)
    await remember_launch(db, current_user, payload.parameter)
    await db.commit()
    return result


@router.get('/friends/inbox', dependencies=[Depends(rate_limit(limit=60, window=60))])
async def friend_invitation_inbox(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.services.friend_invites import inbox
    return await inbox(db, current_user)


@router.post('/friends/dismiss')
async def dismiss_friend_launch(payload: FriendLaunchRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.services.friend_invites import dismiss_launch
    await dismiss_launch(db, current_user.telegram_id, payload.parameter)
    return {'ok': True}


@router.post('/friends/requests', dependencies=[Depends(rate_limit(limit=5, window=60))])
async def request_friend_game(payload: FriendLaunchRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Reusable ref_ links are public acquisition links. Older clients treated
    # them as play requests and could notify the referral owner every time a
    # stranger opened a campaign link. Direct games now use their scoped go_
    # invitation; keep this legacy endpoint closed so stale clients cannot spam.
    raise HTTPException(status_code=410, detail={"code": "referral_practice_only"})


@router.post('/friends/{invite_id}/respond', dependencies=[Depends(rate_limit(limit=10, window=60))])
async def respond_friend_game(invite_id: str, payload: FriendResponseRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.services.friend_invites import respond
    return await respond(db, current_user, invite_id, payload.action)
