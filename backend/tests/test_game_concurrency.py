import pytest
import asyncio
from app.services.game_service import GameService
from app.schemas.game_state import GameState

@pytest.mark.asyncio
async def test_make_move_concurrency_protection():
    service = GameService()
    game_id = "concurrency_test_game"
    
    # Initialize a game state
    state = await service.create_game(game_id, is_bot_game=False, time_control_seconds=600)
    state.white_player_id = 111
    state.black_player_id = 222
    await service.session_manager.save_game(game_id, state)
    
    # Send multiple moves for White concurrently
    # Both moves start from the initial FEN where White is to move.
    # If there is no locking, both could execute, leading to incorrect state transitions.
    # With locking:
    # - First move to be processed (e.g., e2e4) will acquire the lock, apply, change turn to Black, save state, release lock.
    # - Second move (e.g., d2d4) will wait for the lock, load the updated state (where turn is now Black),
    #   and attempt to apply d2d4. But since it's Black's turn, d2d4 (a White move) is illegal/invalid.
    # - Thus, only one move should return a valid GameState, and the other should return None.
    
    results = await asyncio.gather(
        service.make_move(game_id, "e2e4"),
        service.make_move(game_id, "d2d4"),
        return_exceptions=True
    )
    
    # Filter successful GameStates vs failed None values
    successful_moves = [res for res in results if isinstance(res, GameState)]
    failed_moves = [res for res in results if res is None]
    
    # Exactly one move must have succeeded
    assert len(successful_moves) == 1
    assert len(failed_moves) == 1
    
    # Check that the final state move history has exactly 1 move
    final_state = await service.session_manager.get_game(game_id)
    assert final_state is not None
    assert len(final_state.move_history) == 1
    assert final_state.turn == "b"  # Now Black's turn
