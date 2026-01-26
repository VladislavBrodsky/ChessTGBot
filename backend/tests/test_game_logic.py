import pytest
from app.services.game_service import GameService
from app.services.game_engine import GameEngine

def test_elo_calculation():
    service = GameService()
    # P1: 1000, P2: 1000, P1 wins -> P1 should gain ELO
    new_elo_win = service.calculate_new_elo(1000, 1000, 1.0)
    assert new_elo_win > 1000
    
    # P1: 1000, P2: 1000, P1 loses -> P1 should lose ELO
    new_elo_loss = service.calculate_new_elo(1000, 1000, 0.0)
    assert new_elo_loss < 1000
    
    # P1: 1000, P2: 1000, Draw -> Should be close to 1000 (standard K=32)
    new_elo_draw = service.calculate_new_elo(1000, 1000, 0.5)
    assert new_elo_draw == 1000

@pytest.mark.asyncio
async def test_game_engine_init():
    engine = GameEngine()
    state = engine.get_state()
    assert state.fen.startswith("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
    assert state.turn == 'w'
    assert not state.is_game_over

@pytest.mark.asyncio
async def test_game_engine_moves():
    engine = GameEngine()
    # Valid move
    assert engine.make_move("e2e4")
    assert engine.board.fen().startswith("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR")
    
    # Invalid move
    assert not engine.make_move("e2e5") # e2e5 is not legal for white on first move
