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

@sio.event
async def connect(sid, environ, auth):
    """
    Handle connection with auth handshake.
    """
    try:
        if not auth:
             raise Exception("Auth missing")
             
        init_data = auth.get('initData')
        if not init_data:
             raise Exception("initData missing")
             
        user_data = validate_init_data(init_data)
        user_id = user_data.get('id')
        
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
        await sio.enter_room(sid, room)
        print(f"Socket {sid} (User {user_id}) joined room {room}")
        
        service = GameService()
        
        # Try to join/assign player if user_id present
        if user_id:
            await service.join_game(room, user_id)

        # Send current state
        state = await service.get_game_state(room)
        if state:
            await sio.emit('game_state', state.model_dump(), room=sid)

@sio.event
async def join_matchmaking(sid, data):
    """
    Join matchmaking queue for a specific bid tier.
    Data expects: {'bid_amount': int} (in cents)
    """
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        if not user_id:
            await sio.emit('matchmaking_error', {'message': 'Unauthorized connection'}, room=sid)
            return

        bid_amount = int(data.get('bid_amount', 0))
        if bid_amount < 0:
            await sio.emit('matchmaking_error', {'message': 'Invalid bid amount'}, room=sid)
            return

        # 1. Verify player balance
        async with AsyncSessionLocal() as db:
            user = await user_crud.get_user_by_telegram_id(db, user_id)
            if not user or user.balance < bid_amount:
                await sio.emit('matchmaking_error', {
                    'message': 'Insufficient funds. Please top up your Web3 Wallet.'
                }, room=sid)
                return

        # 2. Add to matchmaking queue
        matchmaker = MatchmakerService()
        await matchmaker.add_to_queue(user_id, bid_amount, sid)
        await sio.emit('matchmaking_status', {
            'status': 'searching',
            'bid_amount': bid_amount
        }, room=sid)

        # 3. Find matching opponent
        opponent = await matchmaker.find_opponent(bid_amount, exclude_user_id=user_id)
        if opponent:
            # Opponent matched!
            opponent_id = opponent['user_id']
            opponent_sid = opponent['sid']
            
            # Generate clean unique game_id
            game_id = f"match_{min(user_id, opponent_id)}_{max(user_id, opponent_id)}_{int(asyncio.get_event_loop().time())}"
            
            service = GameService()
            state = await service.create_game(game_id, is_bot_game=False)
            
            # Randomly assign white and black players
            if random.random() < 0.5:
                state.white_player_id = user_id
                state.black_player_id = opponent_id
            else:
                state.white_player_id = opponent_id
                state.black_player_id = user_id
            
            state.bid_amount = bid_amount
            await service.session_manager.save_game(game_id, state)
            
            # 4. Deduct wagers and log transactions in db
            async with AsyncSessionLocal() as db:
                # Deduct White Player
                white = await user_crud.get_user_by_telegram_id(db, state.white_player_id)
                white.balance -= bid_amount
                db.add(white)
                tx_w = Transaction(
                    user_id=state.white_player_id,
                    type="game_wager",
                    amount=-bid_amount,
                    reference_id=game_id
                )
                db.add(tx_w)
                
                # Deduct Black Player
                black = await user_crud.get_user_by_telegram_id(db, state.black_player_id)
                black.balance -= bid_amount
                db.add(black)
                tx_b = Transaction(
                    user_id=state.black_player_id,
                    type="game_wager",
                    amount=-bid_amount,
                    reference_id=game_id
                )
                db.add(tx_b)
                
                await db.commit()

            # Send automated matchmaking Telegram notifications
            try:
                from app.services.telegram_bot import TelegramService
                # White Player Notification
                msg_w = (
                    f"<b>🎮 Wager Chess Battle Connected! (White)</b>\n\n"
                    f"• <b>Opponent:</b> @{black.username or 'Opponent'} (ELO {black.elo})\n"
                    f"• <b>Match Wager Bid:</b> -${bid_amount / 100:.2f} USDT\n\n"
                    f"<i>Your wager has been locked. The board is ready in the Chess Mini App. Make your first move! ♟️⚡️</i>"
                )
                await TelegramService.send_notification(state.white_player_id, msg_w)
                
                # Black Player Notification
                msg_b = (
                    f"<b>🎮 Wager Chess Battle Connected! (Black)</b>\n\n"
                    f"• <b>Opponent:</b> @{white.username or 'Opponent'} (ELO {white.elo})\n"
                    f"• <b>Match Wager Bid:</b> -${bid_amount / 100:.2f} USDT\n\n"
                    f"<i>Your wager has been locked. White is setting up the first move. Keep your eyes on the board! ♟️🛡️</i>"
                )
                await TelegramService.send_notification(state.black_player_id, msg_b)
            except Exception as e:
                pass

            # Remove match pair from queues
            await matchmaker.remove_match_pair(bid_amount, user_id, opponent_id)

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

    except Exception as e:
        print(f"Error joining matchmaking: {e}")
        await sio.emit('matchmaking_error', {'message': f'Server matchmaking error: {str(e)}'}, room=sid)

@sio.event
async def leave_matchmaking(sid, data):
    """
    Cancel matchmaking and leave the queue.
    """
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        if user_id:
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

        new_state = await service.make_move(game_id, uci)
        if new_state:
            await sio.emit('game_state', new_state.model_dump(), room=game_id)
            
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
