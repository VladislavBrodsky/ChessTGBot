import pytest
from app.services.game_service import GameService
from app.services.game_engine import GameEngine

def test_elo_calculation():
    service = GameService()
    # P1: 1000, P2: 1000, P1 wins -> P1 should gain ELO
    new_elo_win = service.calculate_new_elo(1000, 1000, 1.0, k=32)
    assert new_elo_win > 1000
    
    # P1: 1000, P2: 1000, P1 loses -> P1 should lose ELO
    new_elo_loss = service.calculate_new_elo(1000, 1000, 0.0, k=32)
    assert new_elo_loss < 1000
    
    # P1: 1000, P2: 1000, Draw -> Should be close to 1000 (standard K=32)
    new_elo_draw = service.calculate_new_elo(1000, 1000, 0.5, k=32)
    assert new_elo_draw == 1000

    # Test dynamic K-factors
    # New player (games < 30) -> K=40
    assert service.calculate_k_factor(1500, 10) == 40
    assert service.calculate_k_factor(2500, 10) == 40
    # Elite player (games >= 30, ELO >= 2400) -> K=10
    assert service.calculate_k_factor(2400, 30) == 10
    assert service.calculate_k_factor(2500, 50) == 10
    # Regular player (games >= 30, ELO < 2400) -> K=20
    assert service.calculate_k_factor(1500, 30) == 20
    assert service.calculate_k_factor(2399, 40) == 20

    # Test rating floor (minimum ELO 100)
    assert service.calculate_new_elo(100, 2000, 0.0, k=40) == 100
    assert service.calculate_new_elo(105, 100, 0.0, k=40) == 100

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

@pytest.mark.asyncio
async def test_game_service_clock():
    service = GameService()
    game_id = "test_clock_game"
    
    # Create game with 10s time control
    await service.create_game(game_id, is_bot_game=False, time_control_seconds=10)
    
    # Assign players
    await service.join_game(game_id, 1111) # White
    await service.join_game(game_id, 2222) # Black
    
    # Initial move (e2e4)
    state1 = await service.make_move(game_id, "e2e4")
    assert state1 is not None
    assert state1.white_time_left == 10.0
    assert state1.last_move_at is not None
    
    # Simulate black waiting 1.5 seconds
    import time
    state1.last_move_at = time.time() - 1.5
    await service.session_manager.save_game(game_id, state1)
    
    # Black moves (e7e5)
    state2 = await service.make_move(game_id, "e7e5")
    assert state2 is not None
    # Black time left should decrease by at least 1.4 seconds
    assert state2.black_time_left <= 8.6
    assert state2.white_time_left == 10.0

@pytest.mark.asyncio
async def test_game_service_timeout():
    service = GameService()
    game_id = "test_timeout_game"
    
    # Create game with 1s time control
    await service.create_game(game_id, is_bot_game=False, time_control_seconds=1)
    
    # Join players
    await service.join_game(game_id, 1111) # White
    await service.join_game(game_id, 2222) # Black
    
    # Make a move, white clock starts ticking for black's turn
    state1 = await service.make_move(game_id, "e2e4")
    assert state1 is not None
    
    # Simulate waiting 2 seconds (exceeding time control)
    import time
    state1.last_move_at = time.time() - 2.0
    await service.session_manager.save_game(game_id, state1)
    
    # Get game state (should trigger lazy timeout check)
    final_state = await service.get_game_state(game_id)
    assert final_state is not None
    assert final_state.is_game_over
    assert final_state.winner == 'w' # White wins because Black timed out
    assert final_state.result_type == 'timeout'

@pytest.mark.asyncio
async def test_game_service_resignation():
    service = GameService()
    game_id = "test_resign_game"
    
    await service.create_game(game_id, is_bot_game=False, time_control_seconds=600)
    await service.join_game(game_id, 1111) # White
    await service.join_game(game_id, 2222) # Black
    
    # White resigns
    state = await service.resign_game(game_id, 1111)
    assert state is not None
    assert state.is_game_over
    assert state.winner == 'b'
    assert state.result_type == 'resignation'

@pytest.mark.asyncio
async def test_game_service_draw():
    service = GameService()
    game_id = "test_draw_game"
    
    await service.create_game(game_id, is_bot_game=False, time_control_seconds=600)
    await service.join_game(game_id, 1111) # White
    await service.join_game(game_id, 2222) # Black
    
    # Mutual agreement draw
    state = await service.settle_draw(game_id)
    assert state is not None
    assert state.is_game_over
    assert state.winner is None
    assert state.result_type == 'draw'

@pytest.mark.asyncio
async def test_daily_task_reset(db_session):
    from app.services.gamification_service import GamificationService
    from app.models.gamification import Task, UserTask, TaskType
    from datetime import datetime, timedelta, timezone
    
    # Skip if using mock session to prevent table insert issues
    if hasattr(db_session, "users"):
        return

    # 1. Create a dummy daily task
    task = Task(
        id=99,
        title_key="test_daily",
        description_key="Test daily task",
        xp_reward=10,
        task_type=TaskType.PLAY,
        target_count=1,
        is_daily=True
    )
    db_session.add(task)
    await db_session.commit()
    
    # 2. Assign the task to user 123 (marked as completed and claimed yesterday)
    yesterday = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1, hours=2)
    user_task = UserTask(
        user_id=123,
        task_id=99,
        progress=1,
        completed=True,
        claimed=True,
        updated_at=yesterday
    )
    db_session.add(user_task)
    await db_session.commit()
    
    # 3. Call get_or_create_daily_tasks (should trigger reset since updated_at is yesterday)
    user_tasks = await GamificationService.get_or_create_daily_tasks(db_session, 123)
    
    # Verify it has been reset
    assert len(user_tasks) > 0
    test_task = next((ut for ut in user_tasks if ut.task_id == 99), None)
    assert test_task is not None
    assert test_task.progress == 0
    assert not test_task.completed
    assert not test_task.claimed
    assert test_task.updated_at.date() == datetime.now(timezone.utc).date()


@pytest.mark.asyncio
async def test_heal_zombie_wagers(db_session):
    from app.services.game_service import GameService
    from app.models.user import User
    from app.models.transaction import Transaction
    from app.crud import user as user_crud
    from sqlalchemy import select

    # Skip if using mock session to make sure we test database queries correctly
    if hasattr(db_session, "users"):
        return

    # 1. Setup a test user
    telegram_id = 99999123
    user = await user_crud.create_user(db_session, telegram_id, "ZombieTester")
    user.balance = 500  # 5.00 USDT
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # 2. Create a pending matchmaking wager transaction (zombie matchmaking wager)
    tx = Transaction(
        user_id=telegram_id,
        type="game_wager",
        amount=-100,  # 1.00 USDT wagered
        fee=0,
        status="pending",
        reference_id="matchmaking"
    )
    db_session.add(tx)
    await db_session.commit()

    # 3. Call heal_zombie_wagers
    service = GameService()
    await service.heal_zombie_wagers(db_session, telegram_id)

    # 4. Verify user was refunded and transaction marked failed
    await db_session.refresh(user)
    assert user.balance == 600  # 500 + 100 refund

    # Verify transaction status
    res = await db_session.execute(
        select(Transaction).where(
            Transaction.user_id == telegram_id,
            Transaction.reference_id == "matchmaking_refunded"
        )
    )
    db_tx = res.scalars().first()
    assert db_tx is not None
    assert db_tx.status == "failed"

    # 5. Create a completed PVP game wager transaction for a dangling game
    game_id = "test_dangling_game_999"
    tx2 = Transaction(
        user_id=telegram_id,
        type="game_wager",
        amount=-200,  # 2.00 USDT
        fee=0,
        status="completed",
        reference_id=game_id
    )
    db_session.add(tx2)
    await db_session.commit()

    # Since the Redis key does not exist for "test_dangling_game_999",
    # heal_zombie_wagers should refund it immediately in DB.
    await service.heal_zombie_wagers(db_session, telegram_id)

    await db_session.refresh(user)
    assert user.balance == 800  # 600 + 200 refund

    # Verify a refund transaction was logged
    res_refund = await db_session.execute(
        select(Transaction).where(
            Transaction.user_id == telegram_id,
            Transaction.type == "refund",
            Transaction.reference_id == game_id
        )
    )
    refund_tx = res_refund.scalars().first()
    assert refund_tx is not None
    assert refund_tx.amount == 200

