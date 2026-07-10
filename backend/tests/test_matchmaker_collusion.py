import pytest
import time
from app.services.matchmaker import MatchmakerService
from app.crud.game_history import create_game_history
from app.crud import user as user_crud
from sqlalchemy import delete
from app.models.game_history import GameHistory
from app.models.user import User

@pytest.mark.asyncio
async def test_matchmaker_history_collusion_guard(db_session):
    if hasattr(db_session, "users"):
        # Skip if using mock db session in unit tests
        return

    # Clean up any existing queues
    MatchmakerService._memory_queues.clear()
    mm = MatchmakerService()
    
    # 1. Create three users in DB
    user_a = await user_crud.create_user(db_session, 999001, "User A")
    user_b = await user_crud.create_user(db_session, 999002, "User B")
    user_c = await user_crud.create_user(db_session, 999003, "User C")
    await db_session.commit()

    try:
        # 2. Seed a recent game history between A and B
        await create_game_history(
            db=db_session,
            game_id="match_999001_999002_12345",
            white_player_id=999001,
            black_player_id=999002,
            winner="w",
            result_type="checkmate",
            white_elo_before=1000,
            white_elo_after=1005,
            black_elo_before=1000,
            black_elo_after=995,
            commit=True
        )

        # 3. Add User B to the matchmaking queue
        # (forcing in-memory queue to be clean/isolated)
        MatchmakerService._use_memory = True
        await mm.add_to_queue(
            user_id=999002,
            bid_amount=0,
            sid="sid_b",
            elo=1000,
            time_control=600,
            ip_hash="ip_different_1"
        )

        # 4. Attempt to match User A (should be BLOCKED because of recent history with B)
        opponent = await mm.try_match_and_pop(
            bid_amount=0,
            user_id=999001,
            user_elo=1000,
            time_control=600,
            ip_hash="ip_different_2"
        )
        assert opponent is None, "User A should not match User B due to recent game history"

        # 5. Add User C (no history with A) to the queue
        await mm.add_to_queue(
            user_id=999003,
            bid_amount=0,
            sid="sid_c",
            elo=1000,
            time_control=600,
            ip_hash="ip_different_3"
        )

        # 6. Attempt to match User A again (should match C successfully)
        opponent_c = await mm.try_match_and_pop(
            bid_amount=0,
            user_id=999001,
            user_elo=1000,
            time_control=600,
            ip_hash="ip_different_2"
        )
        assert opponent_c is not None
        assert opponent_c["user_id"] == 999003, "User A should match User C"

    finally:
        # Clean up database
        await db_session.execute(delete(GameHistory).where(GameHistory.game_id == "match_999001_999002_12345"))
        await db_session.execute(delete(User).where(User.telegram_id.in_([999001, 999002, 999003])))
        await db_session.commit()
        MatchmakerService._memory_queues.clear()
