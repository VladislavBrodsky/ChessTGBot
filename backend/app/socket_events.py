import asyncio
from app.core.socket import sio
from app.services.game_service import GameService
from app.schemas.game_state import GameState

@sio.event
async def join_room(sid, data):
    """
    Data expects: {'room': 'game_id', 'user_id': 12345}
    """
    room = data.get('room')
    user_id = data.get('user_id')
    
    if room:
        await sio.enter_room(sid, room)
        print(f"Socket {sid} joined room {room} with user_id {user_id}")
        
        service = GameService()
        
        # Try to join/assign player if user_id provided
        if user_id:
            try:
                # user_id comes as int or string, ensure int
                uid = int(user_id)
                await service.join_game(room, uid)
            except ValueError:
                pass

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
    
    if game_id and uci:
        service = GameService()
        new_state = await service.make_move(game_id, uci)
        if new_state:
            # Broadcast to room
            await sio.emit('game_state', new_state.model_dump(), room=game_id)
            
            # Check if it's a bot's turn
            if not new_state.is_game_over and new_state.black_player_id == -1 and new_state.turn == 'b':
                # Move bot logic to a separate task to avoid blocking this event
                asyncio.create_task(handle_bot_turn(game_id))
        else:
            await sio.emit('error', {'message': 'Illegal move or game not found'}, room=sid)

async def handle_bot_turn(game_id: str):
    """Wait briefly, then make bot move and broadcast."""
    await asyncio.sleep(0.8) # Realism delay
    service = GameService()
    bot_state = await service.make_bot_move(game_id)
    if bot_state:
        await sio.emit('game_state', bot_state.model_dump(), room=game_id)
