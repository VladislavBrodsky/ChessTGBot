from app.core.socket import sio
from app.services.game_service import GameService
from app.schemas.game_state import GameState

@sio.event
async def join_room(sid, data):
    """
    Data expects: {'room': 'game_id'}
    """
    room = data.get('room')
    if room:
        await sio.enter_room(sid, room)
        print(f"Socket {sid} joined room {room}")
        
        # Send current state
        service = GameService()
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
        else:
            await sio.emit('error', {'message': 'Illegal move or game not found'}, room=sid)
