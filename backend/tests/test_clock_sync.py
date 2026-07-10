import pytest
import time
from app.services.game_service import GameService
from app.crud import user as user_crud
from sqlalchemy import delete
from app.models.user import User

@pytest.mark.asyncio
async def test_dynamic_clock_synchronization(db_session):
    if hasattr(db_session, "users"):
        return

    # 1. Create a user
    user = await user_crud.create_user(db_session, 999444001, "ClockSyncTester")
    await db_session.commit()
    user_id = user.id

    game_id = "test_sync_game_12345"
    service = GameService()

    try:
        # 2. Create game with 600s time control
        state = await service.create_game(game_id, is_bot_game=False, time_control_seconds=600, bid_amount=0)
        state.white_player_id = user_id
        state.black_player_id = 999444002 # Opponent ID
        
        # 3. Simulate White has been thinking for 10 seconds (last_move_at set to 10s ago)
        state.turn = 'w'
        state.last_move_at = time.time() - 10.0
        state.white_time_left = 600.0
        state.black_time_left = 600.0
        
        await service.session_manager.save_game(game_id, state)

        # 4. Fetch state via get_game_state and check white_time_left
        fetched_state = await service.get_game_state(game_id)
        assert fetched_state is not None
        assert fetched_state.white_time_left < 591.0
        assert fetched_state.white_time_left > 589.0
        assert fetched_state.black_time_left == 600.0

        # 5. Simulate turn switches to Black, and Black has been thinking for 25 seconds
        state.turn = 'b'
        state.last_move_at = time.time() - 25.0
        state.white_time_left = 590.0
        state.black_time_left = 600.0
        
        await service.session_manager.save_game(game_id, state)

        # 6. Fetch state via get_game_state and check black_time_left
        fetched_state2 = await service.get_game_state(game_id)
        assert fetched_state2 is not None
        assert fetched_state2.white_time_left == 590.0
        assert fetched_state2.black_time_left < 576.0
        assert fetched_state2.black_time_left > 574.0

    finally:
        # Clean up
        await service.session_manager.delete_game(game_id)
        await db_session.execute(delete(User).where(User.id == user_id))
        await db_session.commit()
