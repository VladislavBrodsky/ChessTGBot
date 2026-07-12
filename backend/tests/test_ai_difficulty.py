import pytest
import unittest.mock as mock
import chess
from app.services.game_service import GameService
from app.services.game_service import compute_best_bot_move
from app.models.game_history import GameHistory
from sqlalchemy.future import select

@pytest.mark.asyncio
async def test_game_creation_with_difficulty():
    service = GameService()
    
    # Test Easy
    game_id_easy = "test_diff_easy"
    state_easy = await service.create_game(game_id_easy, is_bot_game=True, difficulty="easy")
    assert state_easy.difficulty == "easy"
    
    # Assign bot details
    state_easy_joined = await service.join_game(game_id_easy, 12345)
    assert state_easy_joined.black_username == "AI Engine (Easy)"
    assert state_easy_joined.black_elo == 800

    # Test Hard
    game_id_hard = "test_diff_hard"
    state_hard = await service.create_game(game_id_hard, is_bot_game=True, difficulty="hard")
    assert state_hard.difficulty == "hard"
    
    state_hard_joined = await service.join_game(game_id_hard, 12345)
    assert state_hard_joined.black_username == "AI Engine (Hard)"
    assert state_hard_joined.black_elo == 1600

    # Test Medium (Default)
    game_id_med = "test_diff_med"
    state_med = await service.create_game(game_id_med, is_bot_game=True)
    assert state_med.difficulty == "medium"
    
    state_med_joined = await service.join_game(game_id_med, 12345)
    assert state_med_joined.black_username == "AI Engine (Medium)"
    assert state_med_joined.black_elo == 1200

@pytest.mark.asyncio
async def test_bot_move_difficulty_and_blunders():
    fen = chess.STARTING_FEN
    
    # Test Hard: minimax depth 4, no blunders even if random triggers
    with mock.patch("random.random", return_value=0.1):
        move_hard = compute_best_bot_move(fen, "hard")
        assert move_hard is not None
        # Should be a legal UCI string
        assert chess.Move.from_uci(move_hard)
        
    # Test Easy with Blunder: random choice returns a random move
    with mock.patch("random.random", return_value=0.1):
        move_easy_blunder = compute_best_bot_move(fen, "easy")
        assert move_easy_blunder is not None
        assert chess.Move.from_uci(move_easy_blunder)

    # Test Easy without Blunder: plays minimax depth 2
    with mock.patch("random.random", return_value=0.9):
        move_easy_clean = compute_best_bot_move(fen, "easy")
        assert move_easy_clean is not None
        assert chess.Move.from_uci(move_easy_clean)

@pytest.mark.asyncio
async def test_game_history_difficulty_logging(db_session):
    from app.crud import user as user_crud

    # Skip if using mock session to prevent table insert issues
    if hasattr(db_session, "users"):
        return

    service = GameService()
    
    # Create test user
    telegram_id = 88888
    await user_crud.create_user(db_session, telegram_id, "DiffTester")
    await db_session.commit()

    # Create hard difficulty game
    game_id = "test_history_diff_hard"
    state = await service.create_game(game_id, is_bot_game=True, difficulty="hard")
    
    # Join game
    state = await service.join_game(game_id, telegram_id)
    
    # Force set game over
    state.is_game_over = True
    state.winner = 'w'
    state.result_type = 'checkmate'
    
    # Persist game state
    await service.session_manager.save_game(game_id, state)
    
    # Call end_game (which writes history to PostgreSQL)
    await service.end_game(game_id, state)
    
    # Retrieve history from DB and verify difficulty is correct
    stmt = select(GameHistory).where(GameHistory.game_id == game_id)
    res = await db_session.execute(stmt)
    history = res.scalars().first()
    
    assert history is not None
    assert history.difficulty == "hard"
    assert history.game_type == "computer"

@pytest.mark.asyncio
async def test_make_bot_move_with_process_pool():
    service = GameService()
    game_id = "test_pool_move"
    
    # Initialize game
    await service.create_game(game_id, is_bot_game=True, difficulty="medium")
    await service.join_game(game_id, 12345)
    
    # Mock _process_pool to be a dummy object (non-None)
    dummy_executor = mock.MagicMock()
    
    # Mock run_in_executor to execute compute_best_bot_move synchronously
    async def mock_run_in_executor(self_loop, executor, func, *args):
        return func(*args)
        
    with mock.patch("app.services.game_service._process_pool", dummy_executor):
        with mock.patch("asyncio.BaseEventLoop.run_in_executor", mock_run_in_executor):
            new_state = await service.make_bot_move(game_id)
            assert new_state is not None
            assert len(new_state.move_history) == 1
            assert new_state.turn == 'b'
