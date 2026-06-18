import asyncio
import random
from app.core.socket import sio
from app.services.game_service import GameService
from app.schemas.game_state import GameState
from app.core.security import validate_init_data
from app.services.matchmaker import MatchmakerService
from app.core.database import AsyncSessionLocal
from app.crud import user as user_crud
from app.models.transaction import Transaction

from sqlalchemy import select, and_

async def refund_pending_matchmaking_wager(db, user_id: int):
    user = await user_crud.get_user_by_telegram_id(db, user_id, for_update=True)
    if user:
        result = await db.execute(
            select(Transaction).where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == "game_wager",
                    Transaction.status == "pending",
                    Transaction.reference_id == "matchmaking"
                )
            ).order_by(Transaction.created_at.desc()).limit(1)
        )
        tx = result.scalars().first()
        if tx:
            refund_amount = abs(tx.amount)
            user.balance += refund_amount
            tx.status = "failed"
            tx.reference_id = "matchmaking_refunded"
            db.add(user)
            db.add(tx)
            await db.commit()
            print(f"Refunded matchmaking wager of {refund_amount} to User {user_id}")
            return True
    return False

@sio.event
async def connect(sid, environ, auth):
    """
    Handle connection with auth handshake.
    """
    try:
        user_id = None
        user_data = None
        
        # Check if we have auth and initData
        if auth and auth.get('initData'):
            init_data = auth.get('initData')
            try:
                user_data = validate_init_data(init_data)
                user_id = user_data.get('id')
            except Exception as e:
                # If validation fails but we are on SQLite (dev), use fallback
                from app.core.database import engine
                if engine.url.drivername.startswith("sqlite"):
                    print(f"Dev fallback: InitData validation failed: {e}")
                    from app.core.security import parse_init_data_unverified
                    user_data = parse_init_data_unverified(init_data)
                    user_id = user_data.get('id')
                else:
                    raise e
        
        # If no user_id found (e.g. testing in desktop browser tab), check if we are in dev (SQLite)
        if not user_id:
            from app.core.database import engine
            if engine.url.drivername.startswith("sqlite"):
                user_id = 123456789
                user_data = {'id': user_id, 'first_name': 'Protagonist', 'username': 'Protagonist'}
                print(f"Dev fallback: Authorized socket {sid} as mock User {user_id}")
            else:
                raise Exception("Unauthorized: initData missing or invalid")
                
        # Save user_id to session
        await sio.save_session(sid, {'user_id': user_id, 'user_data': user_data})
        print(f"Socket {sid} connected as User {user_id}")
        
    except Exception as e:
        print(f"Socket connection rejected: {e}")
        return False # Reject connection

@sio.event
async def disconnect(sid):
    """
    Handle user disconnection: clean up matchmaking queues.
    """
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        if user_id:
            async with AsyncSessionLocal() as db:
                await refund_pending_matchmaking_wager(db, user_id)
            await MatchmakerService().remove_from_queue(user_id)
            print(f"Socket {sid} (User {user_id}) disconnected and removed from matchmaking queue.")
    except Exception as e:
        print(f"Error on socket disconnect: {e}")

@sio.event
async def join_room(sid, data):
    """
    Data expects: {'room': 'game_id'} (user_id inferred from auth)
    """
    room = data.get('room')
    
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    
    if room:
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
            
            state = await service.join_game(room, user_id)
            
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

@sio.event
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

        bid_amount = int(data.get('bid_amount', 0))
        time_control = int(data.get('time_control', 600))
        if bid_amount < 0:
            await sio.emit('matchmaking_error', {'message': 'Invalid bid amount'}, room=sid)
            return

        user_elo = 1000
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

            if user.balance < bid_amount:
                await sio.emit('matchmaking_error', {
                    'message': 'Insufficient funds. Please top up your Web3 Wallet.'
                }, room=sid)
                return

            user.balance -= bid_amount
            db.add(user)

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
            user_elo = getattr(user, 'elo', 1000)

        # 2. Add to matchmaking queue
        matchmaker = MatchmakerService()
        await matchmaker.add_to_queue(user_id, bid_amount, sid, elo=user_elo, time_control=time_control)
        await sio.emit('matchmaking_status', {
            'status': 'searching',
            'bid_amount': bid_amount
        }, room=sid)

        # 3. Find and pop matching opponent atomically
        opponent = await matchmaker.try_match_and_pop(bid_amount, user_id, user_elo=user_elo, time_control=time_control)
        if opponent:
            # Opponent matched!
            opponent_id = opponent['user_id']
            opponent_sid = opponent['sid']
            
            # Generate clean unique game_id
            game_id = f"match_{min(user_id, opponent_id)}_{max(user_id, opponent_id)}_{int(asyncio.get_event_loop().time())}"
            
            service = GameService()
            state = await service.create_game(game_id, is_bot_game=False, time_control_seconds=time_control)
            
            # Randomly assign white and black players
            if random.random() < 0.5:
                state.white_player_id = user_id
                state.black_player_id = opponent_id
            else:
                state.white_player_id = opponent_id
                state.black_player_id = user_id
            
            state.bid_amount = bid_amount
            
            # 4. Resolve pending wagers (update reference_id to game_id and status to completed)
            async with AsyncSessionLocal() as db:
                white = await user_crud.get_user_by_telegram_id(db, state.white_player_id, for_update=True)
                black = await user_crud.get_user_by_telegram_id(db, state.black_player_id, for_update=True)
                
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
                    await matchmaker.remove_match_pair(bid_amount, user_id, opponent_id, time_control=time_control)
                    await sio.emit('matchmaking_error', {'message': 'Matchmaking transaction reconciliation failed.'}, room=sid)
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
                
                await db.commit()
 
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
            except Exception as e:
                pass

            # Move both sockets into game room
            await sio.enter_room(sid, game_id)
            await sio.enter_room(opponent_sid, game_id)

            # Notify White player
            await sio.emit('match_found', {
                'game_id': game_id,
                'color': 'w' if state.white_player_id == user_id else 'b',
                'opponent_id': opponent_id,
                'bid_amount': bid_amount
            }, room=sid)

            # Notify Black player
            await sio.emit('match_found', {
                'game_id': game_id,
                'color': 'w' if state.white_player_id == opponent_id else 'b',
                'opponent_id': user_id,
                'bid_amount': bid_amount
            }, room=opponent_sid)

            # Broadcast initial state to the room
            await sio.emit('game_state', state.model_dump(), room=game_id)
            print(f"Matchmaker: Created wager game {game_id} for User {user_id} and {opponent_id} with bid {bid_amount}")

            # Start White's first-move abort timer
            service.start_abort_monitor(game_id, expected_move_count=0, time_limit=30.0, player_color='w')

    except Exception as e:
        print(f"Error joining matchmaking: {e}")
        await sio.emit('matchmaking_error', {'message': 'Server matchmaking error.'}, room=sid)

@sio.event
async def leave_matchmaking(sid, data):
    """
    Cancel matchmaking and leave the queue.
    """
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        if user_id:
            async with AsyncSessionLocal() as db:
                await refund_pending_matchmaking_wager(db, user_id)
            await MatchmakerService().remove_from_queue(user_id)
            await sio.emit('matchmaking_status', {'status': 'idle'}, room=sid)
            print(f"Socket {sid} (User {user_id}) manually left matchmaking queue.")
    except Exception as e:
        print(f"Error leaving matchmaking: {e}")

@sio.event
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
        if (turn_color == 'w' and not is_white) or (turn_color == 'b' and not is_black):
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
                if len(new_state.move_history) == 1 and new_state.black_player_id != -1:
                    service.start_abort_monitor(game_id, expected_move_count=1, time_limit=30.0, player_color='b')
            
            # Check bot turn
            if not new_state.is_game_over and new_state.black_player_id == -1 and new_state.turn == 'b':
                asyncio.create_task(handle_bot_turn(game_id))
        else:
            await sio.emit('error', {'message': 'Illegal move'}, room=sid)

async def handle_bot_turn(game_id: str):
    await asyncio.sleep(0.8)
    service = GameService()
    bot_state = await service.make_bot_move(game_id)
    if bot_state:
        await sio.emit('game_state', bot_state.model_dump(), room=game_id)
        
        # Start timer monitoring for White (human) if game is not over
        if not bot_state.is_game_over:
            service.start_timeout_monitor(game_id, len(bot_state.move_history), bot_state.white_time_left, 'w')

@sio.event
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
async def offer_draw(sid, data):
    """
    Data expects: {'game_id': '...'}
    """
    game_id = data.get('game_id')
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    
    if game_id and user_id:
        state = await GameService().get_game_state(game_id)
        if state and not state.is_game_over:
            await sio.emit('draw_offered', {'game_id': game_id, 'offered_by': user_id}, room=game_id)

@sio.event
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
            draw_state = await service.settle_draw(game_id)
            if draw_state:
                await sio.emit('game_state', draw_state.model_dump(), room=game_id)

@sio.event
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
                await service.redis.set(f"pending_rematch:{game_id}", json.dumps({
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
                pending_raw = await service.redis.get(f"pending_rematch:{game_id}")
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
                    player1 = await user_crud.get_user_by_telegram_id(db, user_id, for_update=True)
                    player2 = await user_crud.get_user_by_telegram_id(db, opponent_id, for_update=True)
                    
                    if player1 and player2:
                        if player1.balance < wager or player2.balance < wager:
                            await sio.emit('error', {'message': 'Insufficient funds to start rematch'}, room=sid)
                            return
                            
                        if wager > 0:
                            player1.balance -= wager
                            player2.balance -= wager
                            db.add(player1)
                            db.add(player2)
                            
                            tx1 = Transaction(
                                user_id=player1.telegram_id,
                                type="game_wager",
                                amount=-wager,
                                fee=0,
                                status="completed",
                                reference_id=f"rematch_wager_{game_id}"
                            )
                            tx2 = Transaction(
                                user_id=player2.telegram_id,
                                type="game_wager",
                                amount=-wager,
                                fee=0,
                                status="completed",
                                reference_id=f"rematch_wager_{game_id}"
                            )
                            db.add(tx1)
                            db.add(tx2)
                            await db.commit()
                        else:
                            await db.commit()
                            
                        # Delete the pending rematch key to prevent replay attacks
                        await service.redis.delete(f"pending_rematch:{game_id}")
                        
                        new_game_id = str(uuid.uuid4())[:8]
                        # Alternate colors and preserve original time control
                        time_control = getattr(state, "time_control_seconds", 600)
                        new_state = await service.create_game(new_game_id, is_bot_game=False, time_control_seconds=time_control)
                        new_state.bid_amount = wager
                        
                        new_state.white_player_id = opponent_id
                        new_state.black_player_id = user_id
                        
                        await service.redis.set(f"game:{new_game_id}", new_state.model_dump_json())
                        await sio.emit('match_found', {'game_id': new_game_id}, room=game_id)

