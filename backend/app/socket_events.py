import asyncio
from app.core.socket import sio
from app.services.game_service import GameService
from app.schemas.game_state import GameState

from app.core.socket import sio
from app.services.game_service import GameService
from app.schemas.game_state import GameState
from app.core.security import validate_init_data
from fastapi import HTTPException

@sio.event
async def connect(sid, environ, auth):
    """
    Handle connection with auth handshake.
    """
    try:
        if not auth:
             # Allow unauthenticated (spectator?) or reject?
             # For now reject to enforce security Phase 1
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
async def make_move(sid, data):
    """
    Data expects: {'game_id': '...', 'uci': 'e2e4'}
    """
    game_id = data.get('game_id')
    uci = data.get('uci')
    
    session = await sio.get_session(sid)
    user_id = session.get('user_id') # Trusted User ID
    
    if game_id and uci:
        service = GameService()
        
        # 1. Fetch state FIRST to validate turn
        current_state = await service.get_game_state(game_id)
        if not current_state:
             await sio.emit('error', {'message': 'Game not found'}, room=sid)
             return

        # 2. Validate Turn Authorization
        is_white = (current_state.white_player_id == user_id)
        is_black = (current_state.black_player_id == user_id)
        
        if not (is_white or is_black):
             await sio.emit('error', {'message': 'You are not a player in this game'}, room=sid)
             return
             
        turn_color = current_state.turn # 'w' or 'b'
        if (turn_color == 'w' and not is_white) or (turn_color == 'b' and not is_black):
             await sio.emit('error', {'message': 'Not your turn'}, room=sid)
             return

        # 3. Apply move
        new_state = await service.make_move(game_id, uci)
        if new_state:
            # Broadcast to room
            await sio.emit('game_state', new_state.model_dump(), room=game_id)
            
            # Check if it's a bot's turn
            if not new_state.is_game_over and new_state.black_player_id == -1 and new_state.turn == 'b':
                # Move bot logic to a separate task to avoid blocking this event
                asyncio.create_task(handle_bot_turn(game_id))
        else:
            await sio.emit('error', {'message': 'Illegal move'}, room=sid)

async def handle_bot_turn(game_id: str):
    """Wait briefly, then make bot move and broadcast."""
    await asyncio.sleep(0.8) # Realism delay
    service = GameService()
    bot_state = await service.make_bot_move(game_id)
    if bot_state:
        await sio.emit('game_state', bot_state.model_dump(), room=game_id)
