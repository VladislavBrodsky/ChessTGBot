import pytest
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.services.matchmaker import MatchmakerService
from app.core.config import get_settings

settings = get_settings()

@pytest.mark.asyncio
async def test_matchmaker_free_match(db_session: AsyncSession):
    if hasattr(db_session, "users"):
        return

    # Create two users
    user1 = User(
        telegram_id=500001,
        first_name="User1",
        elo=1000
    )
    user2 = User(
        telegram_id=500002,
        first_name="User2",
        elo=1000
    )
    db_session.add(user1)
    db_session.add(user2)
    await db_session.commit()
    await db_session.refresh(user1)
    await db_session.refresh(user2)

    matchmaker = MatchmakerService()

    # User 1 joins matchmaking for FREE (0 cents)
    await matchmaker.add_to_queue(user1.telegram_id, 0, "sid1", elo=1000, time_control=600)
    assert await matchmaker.is_in_queue(0, 600, user1.telegram_id) is True

    # User 2 joins matchmaking for FREE (0 cents)
    await matchmaker.add_to_queue(user2.telegram_id, 0, "sid2", elo=1000, time_control=600)
    assert await matchmaker.is_in_queue(0, 600, user2.telegram_id) is True

    # User 2 tries to match
    opponent = await matchmaker.try_match_and_pop(0, user2.telegram_id, user_elo=1000, time_control=600)
    assert opponent is not None
    assert opponent["user_id"] == user1.telegram_id

    # Verify both are popped
    assert await matchmaker.is_in_queue(0, 600, user1.telegram_id) is False
    assert await matchmaker.is_in_queue(0, 600, user2.telegram_id) is False


@pytest.mark.asyncio
async def test_matchmaker_purges_zombies(db_session: AsyncSession):
    if hasattr(db_session, "users"):
        return

    # Create users
    user_zombie = User(telegram_id=500003, first_name="Zombie", elo=1000)
    user_active = User(telegram_id=500004, first_name="Active", elo=1000)
    db_session.add(user_zombie)
    db_session.add(user_active)
    await db_session.commit()

    matchmaker = MatchmakerService()

    # Add zombie to queue
    await matchmaker.add_to_queue(user_zombie.telegram_id, 0, "sid_zombie", elo=1000, time_control=600)
    
    # Manually backdate the zombie's joined_at time to 150 seconds ago
    import time
    queue_key_mem = (0, 600)
    if MatchmakerService._use_memory or not matchmaker.redis:
        queue = MatchmakerService._memory_queues.get(queue_key_mem, [])
        for item in queue:
            if item["user_id"] == user_zombie.telegram_id:
                item["joined_at"] = time.time() - 150.0
    else:
        import json
        queue_key = "matchmaker:queue:0:600"
        data = await matchmaker.redis.get(queue_key)
        queue = json.loads(data) if data else []
        for item in queue:
            if item["user_id"] == user_zombie.telegram_id:
                item["joined_at"] = time.time() - 150.0
        await matchmaker.redis.set(queue_key, json.dumps(queue))

    # Active user tries to match
    opponent = await matchmaker.try_match_and_pop(0, user_active.telegram_id, user_elo=1000, time_control=600)
    
    # Should NOT match with zombie because it is expired/purged
    assert opponent is None
    
    # Verify zombie is no longer in queue
    assert await matchmaker.is_in_queue(0, 600, user_zombie.telegram_id) is False

