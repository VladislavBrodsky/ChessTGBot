import asyncio
import random
import time
import logging

logger = logging.getLogger(__name__)

# How long an offline-notified player gets to make their first move before the
# game aborts (vs. the standard 30s when both players are at the board).
OFFLINE_FIRST_MOVE_GRACE_SECONDS = 180.0

# One background matchmaking poller per user; a re-join replaces the old one.
_active_matchmaking_pollers: dict = {}


async def _sid_connected(sid: str) -> bool:
    """Whether a socket id belongs to a currently connected session."""
    if not sid:
        return False
    try:
        await sio.get_session(sid)
        return True
    except Exception:
        return False

def ws_correlation(event_name: str):
    def decorator(func):
        import functools
        from app.core.logger import request_id_var
        
        if asyncio.iscoroutinefunction(func):
            @functools.wraps(func)
            async def wrapper(sid, *args, **kwargs):
                game_id_str = ""
                try:
                    session = await sio.get_session(sid)
                    game_id = session.get('game_id')
                    if game_id:
                        game_id_str = f":{game_id}"
                except Exception:
                    pass
                
                req_id = f"ws:{sid}{game_id_str}:{event_name}"
                token = request_id_var.set(req_id)
                try:
                    return await func(sid, *args, **kwargs)
                finally:
                    request_id_var.reset(token)
            return wrapper
        else:
            @functools.wraps(func)
            def wrapper(sid, *args, **kwargs):
                req_id = f"ws:{sid}:{event_name}"
                token = request_id_var.set(req_id)
                try:
                    return func(sid, *args, **kwargs)
                finally:
                    request_id_var.reset(token)
            return wrapper
    return decorator

from app.core.socket import sio  # noqa: E402
from app.services.game_service import GameService  # noqa: E402
from app.core.security import validate_init_data, extract_client_ip, hash_ip  # noqa: E402
from app.api.v1.deps import auth_ip_is_blocked, register_auth_failure  # noqa: E402
from app.services.matchmaker import MatchmakerService  # noqa: E402
from app.core.database import AsyncSessionLocal  # noqa: E402
from app.crud import user as user_crud  # noqa: E402
from app.models.transaction import Transaction  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.gamification import Referral  # noqa: E402

from sqlalchemy import select, and_  # noqa: E402

# ---------------------------------------------------------------------------
# Pending draw-offer tracking
# ---------------------------------------------------------------------------
# A draw may only be settled when the opponent has an outstanding offer. We store
# the offer in Redis (shared across workers) with a short TTL, falling back to an
# in-process dict when Redis is unavailable (dev/memory mode, single process).
# NOTE: GameService exposes Redis via `.session_manager.redis` — there is no
# `GameService.redis` attribute (using it raises AttributeError).
_PENDING_DRAW_TTL = 120  # seconds
_pending_draw_fallback: dict[str, int] = {}


async def _set_pending_draw(service: GameService, game_id: str, offered_by: int) -> None:
    redis = service.session_manager.redis
    if redis:
        await redis.set(f"pending_draw:{game_id}", str(offered_by), ex=_PENDING_DRAW_TTL)
    else:
        _pending_draw_fallback[game_id] = offered_by


async def _get_pending_draw(service: GameService, game_id: str) -> int | None:
    redis = service.session_manager.redis
    if redis:
        val = await redis.get(f"pending_draw:{game_id}")
        return int(val) if val is not None else None
    return _pending_draw_fallback.get(game_id)


async def _clear_pending_draw(service: GameService, game_id: str) -> None:
    redis = service.session_manager.redis
    if redis:
        await redis.delete(f"pending_draw:{game_id}")
    else:
        _pending_draw_fallback.pop(game_id, None)


async def refund_pending_matchmaking_wager(db, user_id: int):
    # Fetch user just to make sure they exist
    user = await user_crud.get_user_by_telegram_id(db, user_id)
    if user:
        result = await db.execute(
            select(Transaction).where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == "game_wager",
                    Transaction.status == "pending",
                    Transaction.reference_id == "matchmaking"
                )
            )
        )
        txs = result.scalars().all()
        if txs:
            for tx in txs:
                refund_amount = abs(tx.amount)
                # Atomically credit refund if refund_amount > 0
                if refund_amount > 0:
                    await user_crud.atomic_credit(db, user_id, refund_amount, commit=False)
                tx.status = "failed"
                tx.reference_id = "matchmaking_refunded"
                db.add(tx)
                logger.info(f"[TRANSACTION] user_id={user_id} | type=game_refund | amount={refund_amount} cents (${refund_amount/100:.2f}) | fee=0 cents ($0.00) | reference_id=matchmaking_refunded | status=completed")
                print(f"Refunded matchmaking wager of {refund_amount} to User {user_id}")
            await db.commit()
            return True
    return False

@sio.event
@ws_correlation('connect')
async def connect(sid, environ, auth):
    """
    Handle connection with auth handshake.
    """
    try:
        user_id = None
        user_data = None

        # Capture a salted hash of the client IP up-front. Used both for the
        # anti-collusion matchmaking guard (2a) and the failed-auth throttle (2b).
        ip_hash = hash_ip(extract_client_ip(environ))

        # 2b: reject sockets from IPs with too many recent failed auth attempts.
        if await auth_ip_is_blocked(ip_hash):
            print(f"Socket {sid} rejected: too many failed auth attempts from this IP")
            return False

        # Check if we have auth and initData
        if auth and auth.get('initData'):
            init_data = auth.get('initData')
            try:
                user_data = validate_init_data(init_data)
                user_id = user_data.get('id')
            except Exception as e:
                # If validation fails but we are in dev/testing, use fallback
                from app.core.config import get_settings
                settings = get_settings()
                if settings.TESTING or settings.ENV == "development":
                    print(f"Dev fallback: InitData validation failed: {e}")
                    from app.core.security import parse_init_data_unverified
                    user_data = parse_init_data_unverified(init_data)
                    user_id = user_data.get('id')
                else:
                    await register_auth_failure(ip_hash)
                    raise e

        # If no user_id found (e.g. testing in desktop browser tab), check if we are in dev/testing
        if not user_id:
            from app.core.config import get_settings
            settings = get_settings()
            if settings.TESTING or settings.ENV == "development":
                user_id = 123456789
                user_data = {'id': user_id, 'first_name': 'Protagonist', 'username': 'Protagonist'}
                print(f"Dev fallback: Authorized socket {sid} as mock User {user_id}")
            else:
                await register_auth_failure(ip_hash)
                raise Exception("Unauthorized: initData missing or invalid")

        # Save user_id to session
        await sio.save_session(sid, {'user_id': user_id, 'user_data': user_data, 'ip_hash': ip_hash})
        print(f"Socket {sid} connected as User {user_id}")
        # Run self-healing zombie wager routine on socket connect (in background with jitter to prevent mass-reconnect DDOS)
        if user_id:
            async def _heal_wagers():
                import random
                import asyncio
                await asyncio.sleep(random.uniform(0.1, 3.0))
                try:
                    async with AsyncSessionLocal() as db:
                        await GameService().heal_zombie_wagers(db, user_id)
                except Exception as e:
                    logger.error(f"Error healing wagers for {user_id}: {e}")
            
            asyncio.create_task(_heal_wagers())

            # Point any persisted (free-game) matchmaking entry at this fresh
            # socket so a match found while the app was closed reaches us.
            try:
                await MatchmakerService().update_sid(user_id, sid)
            except Exception as e:
                logger.warning(f"Failed to refresh matchmaking sid for user {user_id}: {e}")

            # Same for a live arena pool entry
            try:
                from app.services.arena_service import ArenaService
                ArenaService().update_sid(user_id, sid)
            except Exception as e:
                logger.warning(f"Failed to refresh arena sid for user {user_id}: {e}")
        
    except Exception as e:
        print(f"Socket connection rejected: {e}")
        return False # Reject connection

@sio.event
@ws_correlation('disconnect')
async def disconnect(sid):
    """
    Handle user disconnection: clean up matchmaking queues.
    """
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        game_id = session.get('game_id')
        if user_id:
            # Wagered queues die with the socket (the wager is refunded and the
            # money paths assume no lingering entry). FREE queue entries persist:
            # the player can close the app and gets a Telegram notification when
            # an opponent is found (see establish_match).
            async with AsyncSessionLocal() as db:
                await refund_pending_matchmaking_wager(db, user_id)
            await MatchmakerService().remove_from_queue(user_id, only_wagered=True)
            print(f"Socket {sid} (User {user_id}) disconnected; wagered matchmaking entries removed (free entries persist).")

            # Arena pool requires presence — pairing an away player just burns
            # the abort timer, so drop them (their score keeps; they can rejoin).
            try:
                from app.services.arena_service import ArenaService
                ArenaService().leave(user_id)
            except Exception:
                pass
            
            # Auto-abort friendly game lobby if creator disconnects before opponent joins
            if game_id:
                service = GameService()
                state = await service.get_game_state(game_id)
                if state and not state.is_game_over:
                    if state.white_player_id == user_id and not state.black_player_id:
                        logger.info(f"Creator {user_id} disconnected from lobby {game_id}. Aborting game and refunding.")
                        state.is_game_over = True
                        state.result_type = 'aborted'
                        await service.session_manager.save_game(game_id, state)
                        await service.end_game(game_id, state)
                        await sio.emit('game_state', state.model_dump(), room=game_id)
    except Exception as e:
        print(f"Error on socket disconnect: {e}")

@sio.event
@ws_correlation('join_room')
async def join_room(sid, data):
    """
    Data expects: {'room': 'game_id'} (user_id inferred from auth)
    """
    room = data.get('room')
    
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    
    if room:
        if user_id:
            await sio.save_session(sid, {**session, 'game_id': room})
        service = GameService()
        if user_id:
            state = await service.session_manager.get_game(room)
            if state and state.white_player_id and state.black_player_id:
                if user_id not in (state.white_player_id, state.black_player_id):
                    await sio.emit('error', {'message': 'Forbidden: You are not a player in this game.'}, room=sid)
                    return
        
        await sio.enter_room(sid, room)
        print(f"Socket {sid} (User {user_id}) joined room {room}")
        
        # Try to join/assign player if user_id present
        if user_id:
            old_state = await service.session_manager.get_game(room)
            had_both_players = (old_state and old_state.white_player_id and old_state.black_player_id)
            
            try:
                state = await service.join_game(room, user_id)
            except ValueError as e:
                await sio.emit('error', {'message': str(e)}, room=sid)
                return
            
            # If both players are now present for the first time in a friendly PVP game, start the game and schedule abort timer
            if state and not had_both_players and state.white_player_id and state.black_player_id:
                # Broadcast the state change to the entire room
                await sio.emit('game_state', state.model_dump(), room=room)
                
                # Start White's first-move abort timer if it's not a bot game
                if state.black_player_id != -1:
                    service.start_abort_monitor(room, expected_move_count=0, time_limit=30.0, player_color='w')
            elif state:
                # Just send state to this user
                await sio.emit('game_state', state.model_dump(), room=sid)
        else:
            state = await service.get_game_state(room)
            if state:
                await sio.emit('game_state', state.model_dump(), room=sid)

        # Recovery/Reconnection timer restart handler
        # Fetch fresh state. If it is active and has started (last_move_at is set), spin up a timeout monitor
        state = await service.get_game_state(room)
        if state and not state.is_game_over and state.last_move_at is not None:
            active_turn = state.turn
            time_left = state.white_time_left if active_turn == 'w' else state.black_time_left
            service.start_timeout_monitor(room, len(state.move_history), time_left, active_turn)

async def establish_match(user_id: int, user_sid: str, opponent_id: int, opponent_sid: str, bid_amount: int, time_control: int):
    # Generate clean unique game_id
    game_id = f"match_{min(user_id, opponent_id)}_{max(user_id, opponent_id)}_{int(asyncio.get_event_loop().time())}"
    
    service = GameService()
    state = await service.create_game(game_id, is_bot_game=False, time_control_seconds=time_control, bid_amount=bid_amount)

    # Free-game queue entries persist across disconnects, so a matched player
    # may be away from the app. Detect that up front: an offline player is
    # assigned Black (so the online player's game starts immediately), gets a
    # Telegram notification with a deep link, and both first moves get an
    # extended abort window.
    user_online = await _sid_connected(user_sid)
    opponent_online = await _sid_connected(opponent_sid)
    offline_player_ids = [
        pid for pid, online in ((user_id, user_online), (opponent_id, opponent_online)) if not online
    ]

    if user_online != opponent_online:
        state.white_player_id = user_id if user_online else opponent_id
        state.black_player_id = opponent_id if user_online else user_id
    elif random.random() < 0.5:
        state.white_player_id = user_id
        state.black_player_id = opponent_id
    else:
        state.white_player_id = opponent_id
        state.black_player_id = user_id

    if offline_player_ids:
        state.first_move_grace_seconds = OFFLINE_FIRST_MOVE_GRACE_SECONDS

    state.bid_amount = bid_amount
    
    # Resolve pending wagers if stakes are greater than 0
    async with AsyncSessionLocal() as db:
        white = await user_crud.get_user_by_telegram_id(db, state.white_player_id, for_update=True)
        black = await user_crud.get_user_by_telegram_id(db, state.black_player_id, for_update=True)
        
        if bid_amount > 0:
            # Fetch pending transactions
            res_w = await db.execute(
                select(Transaction).where(
                    and_(
                        Transaction.user_id == state.white_player_id,
                        Transaction.type == "game_wager",
                        Transaction.status == "pending",
                        Transaction.reference_id == "matchmaking"
                    )
                ).order_by(Transaction.created_at.desc()).limit(1)
            )
            tx_w = res_w.scalars().first()
            
            res_b = await db.execute(
                select(Transaction).where(
                    and_(
                        Transaction.user_id == state.black_player_id,
                        Transaction.type == "game_wager",
                        Transaction.status == "pending",
                        Transaction.reference_id == "matchmaking"
                    )
                ).order_by(Transaction.created_at.desc()).limit(1)
            )
            tx_b = res_b.scalars().first()
            
            if not tx_w or not tx_b:
                # Rollback and clean up queues (just in case they need refunding)
                await db.rollback()
                # Refund anyone who got deducted if one of the transaction gets lost/mismatched
                async with AsyncSessionLocal() as refund_db:
                    await refund_pending_matchmaking_wager(refund_db, user_id)
                    await refund_pending_matchmaking_wager(refund_db, opponent_id)
                await MatchmakerService().remove_match_pair(bid_amount, user_id, opponent_id, time_control=time_control)
                await sio.emit('matchmaking_error', {'message': 'Matchmaking transaction reconciliation failed.'}, room=user_sid)
                return
            
            # Update status to completed
            tx_w.status = "completed"
            tx_w.reference_id = game_id
            tx_b.status = "completed"
            tx_b.reference_id = game_id
            
            db.add(tx_w)
            db.add(tx_b)
        
        # Cache player usernames and ELOs
        state.white_username = white.first_name if white else f"User_{state.white_player_id}"
        state.white_elo = white.elo if white else 1000
        state.black_username = black.first_name if black else f"User_{state.black_player_id}"
        state.black_elo = black.elo if black else 1000
        
        # Log queue_matched telemetry for both players
        from app.services.telemetry_service import log_backend_telemetry
        await log_backend_telemetry(db, user_id, "queue_matched", {
            "bid_amount": bid_amount,
            "time_control": time_control,
            "game_id": game_id,
            "opponent_id": opponent_id
        })
        await log_backend_telemetry(db, opponent_id, "queue_matched", {
            "bid_amount": bid_amount,
            "time_control": time_control,
            "game_id": game_id,
            "opponent_id": user_id
        })
        
        await db.commit()
        if bid_amount > 0:
            logger.info(f"[TRANSACTION] user_id={state.white_player_id} | type=game_wager | amount=-{bid_amount} cents (-${bid_amount/100:.2f}) | fee=0 cents ($0.00) | reference_id={game_id} | status=completed")
            logger.info(f"[TRANSACTION] user_id={state.black_player_id} | type=game_wager | amount=-{bid_amount} cents (-${bid_amount/100:.2f}) | fee=0 cents ($0.00) | reference_id={game_id} | status=completed")

    # Save state after caching players
    await service.session_manager.save_game(game_id, state)

    # Send automated matchmaking Telegram notifications
    try:
        from app.services.telegram_bot import TelegramService
        # White Player Notification
        msg_w = (
            f"<b>🎮 Wager Chess Battle Connected! (White)</b>\n\n"
            f"• <b>Opponent:</b> @{state.black_username or 'Opponent'} (ELO {state.black_elo})\n"
            f"• <b>Match Wager Bid:</b> -${bid_amount / 100:.2f} USDT\n\n"
            f"<i>Your wager has been locked. The board is ready in the Chess Mini App. Make your first move! ♟️⚡️</i>"
        )
        await TelegramService.send_notification(state.white_player_id, msg_w)
        
        # Black Player Notification
        msg_b = (
            f"<b>🎮 Wager Chess Battle Connected! (Black)</b>\n\n"
            f"• <b>Opponent:</b> @{state.white_username or 'Opponent'} (ELO {state.white_elo})\n"
            f"• <b>Match Wager Bid:</b> -${bid_amount / 100:.2f} USDT\n\n"
            f"<i>Your wager has been locked. White is setting up the first move. Keep your eyes on the board! ♟️🛡️</i>"
        )
        await TelegramService.send_notification(state.black_player_id, msg_b)
    except Exception:
        pass

    # Players matched while away from the app get an urgent Telegram call-back
    # with a deep link into the game — this is what makes the persistent free
    # queue usable: queue up, close the app, get pinged when someone appears.
    if offline_player_ids:
        try:
            from app.services.telegram_bot import TelegramService
            deep_link = await TelegramService.create_invite_link(game_id)
            grace_minutes = int(OFFLINE_FIRST_MOVE_GRACE_SECONDS // 60)
            for pid in offline_player_ids:
                opp_name = state.white_username if pid == state.black_player_id else state.black_username
                opp_elo = state.white_elo if pid == state.black_player_id else state.black_elo
                msg = (
                    f"⚔️ <b>Opponent Found — You're Up!</b>\n\n"
                    f"👤 <b>{opp_name or 'Opponent'}</b> (ELO {opp_elo or 1000}) is at the board waiting for you.\n\n"
                    f"⏳ You have <b>{grace_minutes} minutes</b> to return and make your move, "
                    f"or the game will be cancelled.\n\n"
                    f"<a href=\"{deep_link}\">▶️ Open the board now</a>"
                )
                await TelegramService.send_notification(pid, msg)
        except Exception as e:
            logger.warning(f"Failed to send offline match notification for game {game_id}: {e}")

    # Move both sockets into game room
    await sio.enter_room(user_sid, game_id)
    await sio.enter_room(opponent_sid, game_id)

    # Notify user_id player
    await sio.emit('match_found', {
        'game_id': game_id,
        'color': 'w' if state.white_player_id == user_id else 'b',
        'opponent_id': opponent_id,
        'bid_amount': bid_amount
    }, room=user_sid)

    # Notify opponent player
    await sio.emit('match_found', {
        'game_id': game_id,
        'color': 'w' if state.white_player_id == opponent_id else 'b',
        'opponent_id': user_id,
        'bid_amount': bid_amount
    }, room=opponent_sid)

    # Broadcast initial state to the room
    await sio.emit('game_state', state.model_dump(), room=game_id)
    print(f"Matchmaker: Created wager game {game_id} for User {user_id} and {opponent_id} with bid {bid_amount}")

    # Start White's first-move abort timer (extended when a player was offline)
    service.start_abort_monitor(
        game_id,
        expected_move_count=0,
        time_limit=state.first_move_grace_seconds or 30.0,
        player_color='w'
    )

async def establish_arena_game(user_id: int, user_sid: str, opponent_id: int, opponent_sid: str, time_control: int, arena_id: int):
    """Create a free arena game between two pooled players.

    Lean sibling of establish_match: no wagers, no collusion checks (arena
    pairing is server-driven), game id prefixed with the arena id so
    GameService.end_game can route the result to ArenaService.record_result.
    Returns the game_id, or None on failure.
    """
    # Arena play requires both players present: a dead socket here means the
    # player dropped between join and pairing — evict them instead of creating
    # a game that can only abort (and would re-pair them in a loop).
    from app.services.arena_service import ArenaService
    arena_service = ArenaService()
    dropped = [
        (pid, psid) for pid, psid in ((user_id, user_sid), (opponent_id, opponent_sid))
        if not await _sid_connected(psid)
    ]
    if dropped:
        for pid, _ in dropped:
            arena_service.leave(pid)
            logger.info(f"Arena {arena_id}: evicted disconnected user {pid} at pairing time")
        return None

    game_id = f"arena{arena_id}_{min(user_id, opponent_id)}_{max(user_id, opponent_id)}_{int(time.time())}"

    service = GameService()
    state = await service.create_game(game_id, is_bot_game=False, time_control_seconds=time_control, bid_amount=0)

    if random.random() < 0.5:
        state.white_player_id, state.black_player_id = user_id, opponent_id
    else:
        state.white_player_id, state.black_player_id = opponent_id, user_id

    async with AsyncSessionLocal() as db:
        white = await user_crud.get_user_by_telegram_id(db, state.white_player_id)
        black = await user_crud.get_user_by_telegram_id(db, state.black_player_id)
        state.white_username = white.first_name if white else f"User_{state.white_player_id}"
        state.white_elo = white.elo if white else 1000
        state.black_username = black.first_name if black else f"User_{state.black_player_id}"
        state.black_elo = black.elo if black else 1000

    await service.session_manager.save_game(game_id, state)

    await sio.enter_room(user_sid, game_id)
    await sio.enter_room(opponent_sid, game_id)
    await sio.emit('match_found', {
        'game_id': game_id,
        'color': 'w' if state.white_player_id == user_id else 'b',
        'opponent_id': opponent_id,
        'bid_amount': 0,
        'arena': True
    }, room=user_sid)
    await sio.emit('match_found', {
        'game_id': game_id,
        'color': 'w' if state.white_player_id == opponent_id else 'b',
        'opponent_id': user_id,
        'bid_amount': 0,
        'arena': True
    }, room=opponent_sid)
    await sio.emit('game_state', state.model_dump(), room=game_id)

    service.start_abort_monitor(game_id, expected_move_count=0, time_limit=30.0, player_color='w')
    return game_id

@sio.event
@ws_correlation('join_arena')
async def join_arena(sid, data):
    """Join the currently LIVE daily arena; pairing is server-driven."""
    from app.services.arena_service import ArenaService
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        if not user_id:
            await sio.emit('arena_error', {'message': 'Unauthorized connection'}, room=sid)
            return
        arena_service = ArenaService()
        if arena_service.current_arena_id is None:
            await sio.emit('arena_error', {'message': 'No arena is live right now.'}, room=sid)
            return
        async with AsyncSessionLocal() as db:
            user = await user_crud.get_user_by_telegram_id(db, user_id)
            elo = getattr(user, 'elo', 1000) if user else 1000
            joined = await arena_service.join(db, arena_service.current_arena_id, user_id, sid, elo=elo)
        if joined:
            await sio.emit('arena_status', {'status': 'joined', 'arena_id': arena_service.current_arena_id}, room=sid)
        else:
            await sio.emit('arena_error', {'message': 'No arena is live right now.'}, room=sid)
    except Exception as e:
        print(f"Error joining arena: {e}")
        await sio.emit('arena_error', {'message': 'Server arena error.'}, room=sid)

@sio.event
@ws_correlation('leave_arena')
async def leave_arena(sid, data):
    """Leave the arena waiting pool (a game in progress still finishes)."""
    from app.services.arena_service import ArenaService
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        if user_id:
            ArenaService().leave(user_id)
            await sio.emit('arena_status', {'status': 'left'}, room=sid)
    except Exception as e:
        print(f"Error leaving arena: {e}")

async def run_background_matchmaker_polling(user_id: int, sid: str, bid_amount: int, time_control: int, user_elo: int, ip_hash: str = None, referrer_id: int = None):
    """
    Background loop that runs for a matchmaking player when they are not matched
    immediately. Allows ELO thresholds and time-control pools to expand over time.

    FREE searches are persistent: the entry survives socket disconnects, this
    poller keeps working for up to FREE_QUEUE_TTL_SECONDS, and a match found
    while the player is away triggers a Telegram call-back (establish_match).
    WAGERED searches keep the short window — the wager is locked while queued.
    """
    matchmaker = MatchmakerService()
    ttl = MatchmakerService.queue_ttl(bid_amount)
    logger.info(f"Starting background matchmaking polling for user {user_id} (bid {bid_amount}, up to {int(ttl)}s)")

    matched = False
    last_known_sid = sid
    started = time.time()
    try:
        while True:
            elapsed = time.time() - started
            if elapsed >= ttl - 5:
                break
            # Poll fast while a live match is most likely, then back off
            await asyncio.sleep(2.0 if elapsed < 120 else 10.0)

            # Verify the user is still queued (they may have been matched by the
            # other side's poller, cancelled, or expired)
            entry_info = await matchmaker.find_user_entry(user_id)
            if not entry_info:
                logger.info(f"User {user_id} is no longer in matchmaking queue. Exiting background loop.")
                matched = True
                break
            # The entry's sid is refreshed on reconnect — always use the latest
            last_known_sid = entry_info['entry'].get('sid', last_known_sid)

            opponent = await matchmaker.try_match_and_pop(bid_amount, user_id, user_elo=user_elo, time_control=time_control, ip_hash=ip_hash, referrer_id=referrer_id)
            if opponent:
                logger.info(f"Background matchmaker found opponent {opponent['user_id']} for user {user_id}")
                try:
                    await establish_match(user_id, last_known_sid, opponent['user_id'], opponent['sid'], bid_amount, opponent.get('matched_time_control', time_control))
                    matched = True
                except Exception as e:
                    logger.error(f"Error establishing background match: {e}")
                break
    except asyncio.CancelledError:
        # Replaced by a newer poller for the same user (re-join) — the queue
        # entry itself is managed by join/leave/disconnect handlers.
        return
    finally:
        if _active_matchmaking_pollers.get(user_id) is asyncio.current_task():
            _active_matchmaking_pollers.pop(user_id, None)

    if not matched:
        logger.info(f"Matchmaking timed out for user {user_id} after {int(ttl)}s.")
        
        async with AsyncSessionLocal() as db:
            from app.services.telemetry_service import log_backend_telemetry
            await log_backend_telemetry(db, user_id, "queue_timeout", {
                "bid_amount": bid_amount,
                "time_control": time_control,
                "duration_waited": ttl
            })
            if bid_amount > 0:
                await refund_pending_matchmaking_wager(db, user_id)
                
        await matchmaker.remove_from_queue(user_id)
        if bid_amount > 0:
            message = 'No opponent found within the time limit. Your wager has been fully refunded.'
        else:
            message = 'No opponent found this time. Tap Play to search again.'
        await sio.emit('matchmaking_status', {'status': 'idle', 'message': message}, room=last_known_sid)
        # If the player closed the app while a free search was running, tell
        # them the search ended so the silence isn't mistaken for still-queued.
        if bid_amount == 0 and not await _sid_connected(last_known_sid):
            try:
                from app.services.telegram_bot import TelegramService
                await TelegramService.send_notification(
                    user_id,
                    "⏳ <b>Search ended</b> — no opponent turned up this time.\n\n"
                    "Open the app and tap <b>Play</b> to search again. ♟️"
                )
            except Exception as e:
                logger.warning(f"Failed to send matchmaking timeout notification to {user_id}: {e}")

@sio.event
@ws_correlation('join_matchmaking')
async def join_matchmaking(sid, data):
    """
    Join matchmaking queue for a specific bid tier.
    Data expects: {'bid_amount': int, 'time_control': int} (in cents / seconds)
    """
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        if not user_id:
            await sio.emit('matchmaking_error', {'message': 'Unauthorized connection'}, room=sid)
            return

        ip_hash = session.get('ip_hash')

        bid_amount = int(data.get('bid_amount', 0))
        time_control = int(data.get('time_control', 600))
        if bid_amount < 0:
            await sio.emit('matchmaking_error', {'message': 'Invalid bid amount'}, room=sid)
            return

        user_elo = 1000
        referrer_tid = None
        # 1. Verify player balance, check for existing pending queue wager, and deduct wager immediately
        async with AsyncSessionLocal() as db:
            user = await user_crud.get_user_by_telegram_id(db, user_id, for_update=True)
            if not user:
                await sio.emit('matchmaking_error', {'message': 'User profile not found'}, room=sid)
                return

            # Prevent duplicate matchmaking joins
            res = await db.execute(
                select(Transaction).where(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.type == "game_wager",
                        Transaction.status == "pending",
                        Transaction.reference_id == "matchmaking"
                    )
                )
            )
            if res.scalars().first():
                await sio.emit('matchmaking_error', {'message': 'Already in matchmaking queue.'}, room=sid)
                return

            # Atomically debit wager from player's balance if wager > 0
            if bid_amount > 0:
                user = await user_crud.atomic_debit(db, user_id, bid_amount, commit=False)
                if not user:
                    await sio.emit('matchmaking_error', {
                        'message': 'Insufficient funds. Please top up your Web3 Wallet.'
                    }, room=sid)
                    return

                # Log pending transaction
                tx = Transaction(
                    user_id=user_id,
                    type="game_wager",
                    amount=-bid_amount,
                    status="pending",
                    reference_id="matchmaking"
                )
                db.add(tx)
                await db.commit()
                logger.info(f"[TRANSACTION] user_id={user_id} | type=game_wager | amount=-{bid_amount} cents (-${bid_amount/100:.2f}) | fee=0 cents ($0.00) | reference_id=matchmaking | status=pending")
            
            user_elo = getattr(user, 'elo', 1000)

            # Resolve the user's direct referrer (telegram_id) for the anti-collusion
            # guard — a referrer must not be ranked-matched with their own referee.
            # Referral.*_id columns are DB users.id, so we join back to User for the tid.
            try:
                ref_row = await db.execute(
                    select(User.telegram_id)
                    .select_from(Referral)
                    .join(User, User.id == Referral.referrer_id)
                    .where(Referral.referred_user_id == user.id)
                    .limit(1)
                )
                referrer_tid = ref_row.scalar_one_or_none()
            except Exception as e:
                logger.warning(f"Anti-collusion: failed to resolve referrer for user {user_id}: {e}")

        # 2. Add to matchmaking queue
        matchmaker = MatchmakerService()
        await matchmaker.add_to_queue(user_id, bid_amount, sid, elo=user_elo, time_control=time_control, ip_hash=ip_hash, referrer_id=referrer_tid)
        queue_counts = await matchmaker.get_queue_counts(
            bid_amount,
            time_control,
            exclude_user_id=user_id,
        )
        
        # Log queue_join telemetry
        from app.services.telemetry_service import log_backend_telemetry
        async with AsyncSessionLocal() as db:
            await log_backend_telemetry(db, user_id, "queue_join", {
                "bid_amount": bid_amount,
                "time_control": time_control,
                "elo": user_elo,
                **queue_counts,
            })

        await sio.emit('matchmaking_status', {
            'status': 'searching',
            'bid_amount': bid_amount,
            'time_control': time_control,
            'duration_waited': 0,
            'notify_when_matched': False,
            **queue_counts,
        }, room=sid)

        # 3. Find and pop matching opponent atomically
        opponent = await matchmaker.try_match_and_pop(bid_amount, user_id, user_elo=user_elo, time_control=time_control, ip_hash=ip_hash, referrer_id=referrer_tid)
        if opponent:
            await establish_match(user_id, sid, opponent['user_id'], opponent['sid'], bid_amount, opponent.get('matched_time_control', time_control))
        else:
            # Spawn the background polling task to allow ELO thresholds to expand
            # and match dynamically. One poller per user: a re-join (e.g. after
            # reopening the app with a persisted free search) replaces the old one.
            previous = _active_matchmaking_pollers.get(user_id)
            if previous and not previous.done():
                previous.cancel()
            _active_matchmaking_pollers[user_id] = asyncio.create_task(
                run_background_matchmaker_polling(user_id, sid, bid_amount, time_control, user_elo, ip_hash=ip_hash, referrer_id=referrer_tid)
            )

    except Exception as e:
        print(f"Error joining matchmaking: {e}")
        await sio.emit('matchmaking_error', {'message': 'Server matchmaking error.'}, room=sid)

@sio.event
@ws_correlation('enable_matchmaking_notifications')
async def enable_matchmaking_notifications(sid, data):
    """Keep a free search alive when the player leaves and notify on a match."""
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        if not user_id:
            await sio.emit(
                'matchmaking_notifications_status',
                {'enabled': False, 'error': 'Unauthorized connection'},
                room=sid,
            )
            return

        found = await MatchmakerService().set_notification_opt_in(user_id)
        if not found:
            await sio.emit(
                'matchmaking_notifications_status',
                {'enabled': False, 'error': 'Notification mode is available for active free searches only.'},
                room=sid,
            )
            return

        joined_at = found['entry'].get('joined_at', time.time())
        duration_waited = max(0, time.time() - joined_at)
        expires_in = max(
            0,
            int(MatchmakerService.FREE_QUEUE_TTL_SECONDS - duration_waited),
        )
        from app.services.telemetry_service import log_backend_telemetry
        try:
            async with AsyncSessionLocal() as db:
                await log_backend_telemetry(db, user_id, "queue_notify_opt_in", {
                    "bid_amount": 0,
                    "time_control": found['time_control'],
                    "duration_waited": duration_waited,
                    "expires_in_seconds": expires_in,
                })
        except Exception as telemetry_error:
            logger.warning(
                f"Notification opt-in persisted for {user_id}, but telemetry failed: "
                f"{telemetry_error}"
            )

        await sio.emit(
            'matchmaking_notifications_status',
            {'enabled': True, 'expires_in_seconds': expires_in},
            room=sid,
        )
    except Exception as e:
        logger.warning(f"Failed to enable matchmaking notifications for {sid}: {e}")
        await sio.emit(
            'matchmaking_notifications_status',
            {'enabled': False, 'error': 'Could not enable Telegram notifications.'},
            room=sid,
        )


@sio.event
@ws_correlation('get_matchmaking_queue_size')
async def get_matchmaking_queue_size(sid, data):
    """Return a verified queue snapshot for the selected matchmaking pool."""
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        if not user_id:
            return

        matchmaker = MatchmakerService()
        found = await matchmaker.find_user_entry(user_id)
        if found:
            bid_amount = found['bid_amount']
            time_control = found['time_control']
        else:
            data = data or {}
            bid_amount = int(data.get('bid_amount', 0))
            time_control = int(data.get('time_control', 600))
            if bid_amount < 0 or time_control <= 0 or time_control > 7200:
                return

        queue_counts = await matchmaker.get_queue_counts(
            bid_amount,
            time_control,
            exclude_user_id=user_id,
        )
        await sio.emit('matchmaking_queue_size', {
            'bid_amount': bid_amount,
            'time_control': time_control,
            **queue_counts,
        }, room=sid)
    except (TypeError, ValueError):
        return
    except Exception as e:
        logger.warning(f"Failed to report matchmaking queue size for {sid}: {e}")


@sio.event
@ws_correlation('check_matchmaking')
async def check_matchmaking(sid, data):
    """
    Report whether the user has a live matchmaking search (used by the client
    on mount to restore the searching UI after the app was closed/reopened,
    since free searches persist server-side).
    """
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        if not user_id:
            return
        found = await MatchmakerService().find_user_entry(user_id)
        logger.info(f"check_matchmaking: user {user_id} -> {'searching ' + str((found['bid_amount'], found['time_control'])) if found else 'idle'}")
        if found:
            joined_at = found['entry'].get('joined_at', time.time())
            queue_counts = await MatchmakerService().get_queue_counts(
                found['bid_amount'],
                found['time_control'],
                exclude_user_id=user_id,
            )
            await sio.emit('matchmaking_status', {
                'status': 'searching',
                'bid_amount': found['bid_amount'],
                'time_control': found['time_control'],
                'duration_waited': max(0, time.time() - joined_at),
                'notify_when_matched': bool(
                    found['entry'].get('notify_when_matched', False)
                ),
                **queue_counts,
            }, room=sid)
        else:
            await sio.emit('matchmaking_status', {'status': 'idle'}, room=sid)
    except Exception as e:
        print(f"Error checking matchmaking state: {e}")

@sio.event
@ws_correlation('leave_matchmaking')
async def leave_matchmaking(sid, data):
    """
    Cancel matchmaking and leave the queue.
    """
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        if user_id:
            import time
            matchmaker = MatchmakerService()
            entry_info = await matchmaker.find_user_entry(user_id)
            duration_waited = None
            bid_amount = 0
            time_control = 600
            if entry_info:
                bid_amount = entry_info.get('bid_amount', 0)
                time_control = entry_info.get('time_control', 600)
                joined_at = entry_info['entry'].get('joined_at')
                if joined_at:
                    duration_waited = time.time() - joined_at

            task = _active_matchmaking_pollers.pop(user_id, None)
            if task and not task.done():
                task.cancel()
            
            async with AsyncSessionLocal() as db:
                from app.services.telemetry_service import log_backend_telemetry
                await log_backend_telemetry(db, user_id, "queue_abandon", {
                    "bid_amount": bid_amount,
                    "time_control": time_control,
                    "duration_waited": duration_waited
                })
                await refund_pending_matchmaking_wager(db, user_id)
            
            await matchmaker.remove_from_queue(user_id)
            await sio.emit('matchmaking_status', {'status': 'idle'}, room=sid)
            print(f"Socket {sid} (User {user_id}) manually left matchmaking queue.")
    except Exception as e:
        print(f"Error leaving matchmaking: {e}")

@sio.event
@ws_correlation('make_move')
async def make_move(sid, data):
    """
    Data expects: {'game_id': '...', 'uci': 'e2e4'}
    """
    game_id = data.get('game_id')
    uci = data.get('uci')
    
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    
    if game_id and uci:
        service = GameService()
        
        current_state = await service.get_game_state(game_id)
        if not current_state:
             await sio.emit('error', {'message': 'Game not found'}, room=sid)
             return

        is_white = (current_state.white_player_id == user_id)
        is_black = (current_state.black_player_id == user_id)
        
        if not (is_white or is_black):
             await sio.emit('error', {'message': 'You are not a player in this game'}, room=sid)
             return
             
        turn_color = current_state.turn
        is_white_bot = (current_state.white_player_id == -1)
        is_black_bot = (current_state.black_player_id == -1)
        
        if turn_color == 'w':
             if is_white_bot:
                  if not is_black:
                       await sio.emit('error', {'message': 'Not your turn'}, room=sid)
                       return
             else:
                  if not is_white:
                       await sio.emit('error', {'message': 'Not your turn'}, room=sid)
                       return
        elif turn_color == 'b':
             if is_black_bot:
                  if not is_white:
                       await sio.emit('error', {'message': 'Not your turn'}, room=sid)
                       return
             else:
                  if not is_black:
                       await sio.emit('error', {'message': 'Not your turn'}, room=sid)
                       return

        new_state = await service.make_move(game_id, uci, preloaded_state=current_state)
        if new_state:
            await sio.emit('game_state', new_state.model_dump(), room=game_id)
            
            # Start timer monitoring for the new turn if game is not over
            if not new_state.is_game_over:
                active_turn = new_state.turn
                time_left = new_state.white_time_left if active_turn == 'w' else new_state.black_time_left
                service.start_timeout_monitor(game_id, len(new_state.move_history), time_left, active_turn)
                
                # If White just moved (move history length is 1), Black has 30 seconds to make their first move
                # (extended when the match was established while Black was offline)
                if len(new_state.move_history) == 1 and new_state.black_player_id != -1:
                    service.start_abort_monitor(game_id, expected_move_count=1, time_limit=new_state.first_move_grace_seconds or 30.0, player_color='b')
            
        else:
            await sio.emit('error', {'message': 'Illegal move'}, room=sid)

@sio.event
@ws_correlation('resign')
async def resign(sid, data):
    """
    Data expects: {'game_id': '...'}
    """
    game_id = data.get('game_id')
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    
    if game_id and user_id:
        service = GameService()
        resigned_state = await service.resign_game(game_id, user_id)
        if resigned_state:
            await sio.emit('game_state', resigned_state.model_dump(), room=game_id)

@sio.event
@ws_correlation('abort_game')
async def abort_game(sid, data):
    """
    Allow the creator to cancel/abort a game before it starts (e.g. while waiting for an opponent)
    """
    game_id = data.get('game_id')
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    
    if game_id and user_id:
        service = GameService()
        state = await service.get_game_state(game_id)
        if state and not state.is_game_over:
            # Verify that the user is the creator (white player) and the opponent hasn't joined or no moves made
            if state.white_player_id == user_id and (not state.black_player_id or len(state.move_history) == 0):
                state.is_game_over = True
                state.result_type = 'aborted'
                await service.session_manager.save_game(game_id, state)
                await service.end_game(game_id, state)

@sio.event
@ws_correlation('offer_draw')
async def offer_draw(sid, data):
    """
    Data expects: {'game_id': '...'}
    """
    game_id = data.get('game_id')
    session = await sio.get_session(sid)
    user_id = session.get('user_id')

    if game_id and user_id:
        service = GameService()
        state = await service.get_game_state(game_id)
        if state and not state.is_game_over:
            # Only a player in the game may offer a draw.
            if user_id not in (state.white_player_id, state.black_player_id):
                await sio.emit('error', {'message': 'Forbidden: You are not a player in this game.'}, room=sid)
                return
            # Persist the pending offer so acceptance can be verified. Without a
            # recorded offer, accept_draw could be used to unilaterally settle a
            # draw (refunding both wagers) to escape a losing position.
            await _set_pending_draw(service, game_id, user_id)
            await sio.emit('draw_offered', {'game_id': game_id, 'offered_by': user_id}, room=game_id)

@sio.event
@ws_correlation('accept_draw')
async def accept_draw(sid, data):
    """
    Data expects: {'game_id': '...'}
    """
    game_id = data.get('game_id')
    session = await sio.get_session(sid)
    user_id = session.get('user_id')

    if game_id and user_id:
        service = GameService()
        state = await service.get_game_state(game_id)
        if state:
            if user_id not in (state.white_player_id, state.black_player_id):
                await sio.emit('error', {'message': 'Forbidden: You are not a player in this game.'}, room=sid)
                return
            if state.is_game_over:
                return
            # Require a pending draw offer made by the OPPONENT. A player must never
            # be able to force a draw on their own — that would let a losing player
            # convert a loss into a full wager refund unilaterally.
            offered_by = await _get_pending_draw(service, game_id)
            if offered_by is None:
                await sio.emit('error', {'message': 'No active draw offer found or it has expired.'}, room=sid)
                return
            if offered_by == user_id:
                await sio.emit('error', {'message': 'You cannot accept your own draw offer.'}, room=sid)
                return
            # Consume the offer so it cannot be replayed.
            await _clear_pending_draw(service, game_id)
            draw_state = await service.settle_draw(game_id)
            if draw_state:
                await sio.emit('game_state', draw_state.model_dump(), room=game_id)

@sio.event
@ws_correlation('offer_rematch')
async def offer_rematch(sid, data):
    """
    Data expects: {'game_id': '...', 'double_stakes': bool}
    """
    game_id = data.get('game_id')
    double_stakes = data.get('double_stakes', False)
    
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    user_data = session.get('user_data') or {}
    
    if game_id and user_id:
        service = GameService()
        state = await service.get_game_state(game_id)
        if state:
            if not state.is_game_over:
                await sio.emit('error', {'message': 'Cannot offer rematch. The game is still in progress.'}, room=sid)
                return
            opponent_id = state.black_player_id if state.white_player_id == user_id else state.white_player_id
            if opponent_id and opponent_id != -1:
                current_wager = getattr(state, "bid_amount", 0)
                new_wager = current_wager * 2 if double_stakes else current_wager
                
                # Store pending rematch details in Redis
                import json
                await service.session_manager.redis.set(f"pending_rematch:{game_id}", json.dumps({
                    'challenger_id': user_id,
                    'wager': new_wager,
                    'double_stakes': double_stakes
                }), ex=300) # 5 minutes expiry
                
                await sio.emit('rematch_offered', {
                    'game_id': game_id,
                    'challenger_id': user_id,
                    'challenger_name': user_data.get('first_name', 'Opponent'),
                    'wager': new_wager,
                    'double_stakes': double_stakes
                }, room=game_id)

@sio.event
@ws_correlation('accept_rematch')
async def accept_rematch(sid, data):
    """
    Data expects: {'game_id': '...'}
    """
    game_id = data.get('game_id')
    
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    
    if game_id and user_id:
        service = GameService()
        state = await service.get_game_state(game_id)
        if state:
            opponent_id = state.black_player_id if state.white_player_id == user_id else state.white_player_id
            if opponent_id and opponent_id != -1:
                # 1. Fetch pending rematch details from Redis
                import json
                pending_raw = await service.session_manager.redis.get(f"pending_rematch:{game_id}")
                if not pending_raw:
                    await sio.emit('error', {'message': 'No active rematch offer found or offer expired.'}, room=sid)
                    return
                
                pending = json.loads(pending_raw)
                # Ensure the one accepting is the opponent, not the challenger themselves
                if pending['challenger_id'] == user_id:
                    await sio.emit('error', {'message': 'You cannot accept your own rematch offer.'}, room=sid)
                    return
                
                wager = int(pending.get('wager', 0))
                
                from app.core.database import AsyncSessionLocal
                from app.crud import user as user_crud
                from app.models.transaction import Transaction
                import uuid
                
                async with AsyncSessionLocal() as db:
                    player1 = await user_crud.get_user_by_telegram_id(db, user_id)
                    player2 = await user_crud.get_user_by_telegram_id(db, opponent_id)
                    
                    if not player1 or not player2:
                        await sio.emit('error', {'message': 'Rematch players profiles not found'}, room=sid)
                        return
                    
                    if wager > 0:
                        p1_debited = await user_crud.atomic_debit(db, user_id, wager, commit=False)
                        if not p1_debited:
                            await sio.emit('error', {'message': 'Insufficient funds to start rematch'}, room=sid)
                            return
                        p2_debited = await user_crud.atomic_debit(db, opponent_id, wager, commit=False)
                        if not p2_debited:
                            # Refund player1
                            await user_crud.atomic_credit(db, user_id, wager, commit=False)
                            await sio.emit('error', {'message': 'Opponent has insufficient funds for rematch'}, room=sid)
                            return
                        
                        tx1 = Transaction(
                            user_id=user_id,
                            type="game_wager",
                            amount=-wager,
                            fee=0,
                            status="completed",
                            reference_id=f"rematch_wager_{game_id}"
                        )
                        tx2 = Transaction(
                            user_id=opponent_id,
                            type="game_wager",
                            amount=-wager,
                            fee=0,
                            status="completed",
                            reference_id=f"rematch_wager_{game_id}"
                        )
                        db.add(tx1)
                        db.add(tx2)
                        await db.commit()
                        logger.info(f"[TRANSACTION] user_id={user_id} | type=game_wager | amount=-{wager} cents (-${wager/100:.2f}) | fee=0 cents ($0.00) | reference_id=rematch_wager_{game_id} | status=completed")
                        logger.info(f"[TRANSACTION] user_id={opponent_id} | type=game_wager | amount=-{wager} cents (-${wager/100:.2f}) | fee=0 cents ($0.00) | reference_id=rematch_wager_{game_id} | status=completed")
                    else:
                        await db.commit()
                            
                    # Delete the pending rematch key to prevent replay attacks
                    await service.session_manager.redis.delete(f"pending_rematch:{game_id}")
                    
                    new_game_id = str(uuid.uuid4())[:8]
                    # Randomly assign colors and preserve original time control
                    time_control = getattr(state, "time_control_seconds", 600)
                    new_state = await service.create_game(new_game_id, is_bot_game=False, time_control_seconds=time_control, bid_amount=wager)
                    
                    if random.random() < 0.5:
                        new_state.white_player_id = opponent_id
                        new_state.black_player_id = user_id
                    else:
                        new_state.white_player_id = user_id
                        new_state.black_player_id = opponent_id
                    
                    await service.session_manager.redis.set(f"game:{new_game_id}", new_state.model_dump_json())
                    await sio.emit('match_found', {'game_id': new_game_id}, room=game_id)



# Wire the arena pairing loop to the socket layer's game-creation helper.
# Done at import time so ArenaService (a plain service module) never has to
# import socket.io itself.
from app.services.arena_service import ArenaService as _ArenaService  # noqa: E402
_ArenaService().create_game_callback = establish_arena_game
