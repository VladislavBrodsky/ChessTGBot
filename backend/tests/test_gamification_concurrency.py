import pytest
import asyncio
from app.crud import user as user_crud
from app.models.gamification import Task, UserTask
from app.services.gamification_service import GamificationService
from app.models.user import User
from app.main import app

@pytest.mark.asyncio
async def test_concurrency_task_claim(client, test_engine, db_session):
    if test_engine is None or hasattr(db_session, "users"):
        # Skip if using mock session or no database engine
        return

    is_sqlite = test_engine.url.drivername.startswith("sqlite")
    if is_sqlite:
        pytest.skip("SQLite does not support row-level write locks (with_for_update), skip concurrency verification")

    from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
    from app.core.database import get_db
    
    session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    
    # Override get_db to return a fresh session per concurrent request
    async def override_get_db():
        async with session_factory() as session:
            yield session
            
    app.dependency_overrides[get_db] = override_get_db

    # Seed the database using a fresh session to ensure it is committed before concurrent tests
    async with session_factory() as session:
        # Create user
        telegram_id = 999111333
        user = await user_crud.create_user(session, telegram_id, "ConcurrentUser")
        user.xp = 100
        session.add(user)
        
        # Seed task
        task = Task(id=999, title_key="dummy_task", description_key="dummy_desc", xp_reward=100, task_type="LOGIN", target_count=1, is_daily=False)
        session.add(task)
        
        # Seed completed but unclaimed user task
        user_task = UserTask(user_id=user.id, task_id=999, progress=1, completed=True, claimed=False)
        session.add(user_task)
        await session.commit()
    
    # Prepare mock auth
    import hmac, hashlib, json, time
    from urllib.parse import quote
    from app.core.config import get_settings
    settings = get_settings()
    original_token = settings.TELEGRAM_BOT_TOKEN
    settings.TELEGRAM_BOT_TOKEN = "123456789:test_token"
    
    try:
        user_str = json.dumps({"id": telegram_id, "first_name": "ConcurrentUser"})
        auth_date = str(int(time.time()))
        check_list = [f"auth_date={auth_date}", f"user={user_str}"]
        data_check_string = "\n".join(check_list)
        secret_key = hmac.new(b"WebAppData", settings.TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        init_data = f"auth_date={quote(auth_date)}&user={quote(user_str)}&hash={calculated_hash}"
        headers = {"X-Telegram-Init-Data": init_data}

        # Shoot concurrent claim requests
        async def call_claim():
            return await client.post("/api/v1/gamification/tasks/999/claim", headers=headers)

        responses = await asyncio.gather(
            call_claim(),
            call_claim(),
            call_claim()
        )

        # One should succeed (200), others should fail (400)
        success_count = sum(1 for r in responses if r.status_code == 200)
        fail_count = sum(1 for r in responses if r.status_code == 400)
        
        assert success_count == 1
        assert fail_count == 2
        
        # Verify user XP only increased by 100 once (from 100 to 200)
        async with session_factory() as session:
            from sqlalchemy import select
            user_res = await session.execute(select(User).where(User.telegram_id == telegram_id))
            db_user = user_res.scalars().first()
            assert db_user.xp == 200

    finally:
        settings.TELEGRAM_BOT_TOKEN = original_token
        app.dependency_overrides.clear()
        
        async with session_factory() as session:
            from sqlalchemy import delete
            await session.execute(delete(UserTask).where(UserTask.user_id == user.id))
            await session.execute(delete(Task).where(Task.id == 999))
            await session.execute(delete(User).where(User.telegram_id == telegram_id))
            await session.commit()


@pytest.mark.asyncio
async def test_concurrency_puzzle_solve(client, test_engine, db_session):
    if test_engine is None or hasattr(db_session, "users"):
        return

    is_sqlite = test_engine.url.drivername.startswith("sqlite")
    if is_sqlite:
        pytest.skip("SQLite does not support row-level write locks (with_for_update), skip concurrency verification")

    from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
    from app.core.database import get_db
    from app.models.gamification import SolvedPuzzle
    
    session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    
    # Override get_db to return a fresh session per concurrent request
    async def override_get_db():
        async with session_factory() as session:
            yield session
            
    app.dependency_overrides[get_db] = override_get_db

    # Seed the database
    async with session_factory() as session:
        # Create user
        telegram_id = 999111444
        user = await user_crud.create_user(session, telegram_id, "PuzzleConcurrentUser")
        user.xp = 0
        user.elo = 1000
        session.add(user)
        await session.commit()
    
    # Prepare mock auth
    import hmac, hashlib, json, time
    from urllib.parse import quote
    from app.core.config import get_settings
    settings = get_settings()
    original_token = settings.TELEGRAM_BOT_TOKEN
    settings.TELEGRAM_BOT_TOKEN = "123456789:test_token"
    
    try:
        user_str = json.dumps({"id": telegram_id, "first_name": "PuzzleConcurrentUser"})
        auth_date = str(int(time.time()))
        check_list = [f"auth_date={auth_date}", f"user={user_str}"]
        data_check_string = "\n".join(check_list)
        secret_key = hmac.new(b"WebAppData", settings.TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        init_data = f"auth_date={quote(auth_date)}&user={quote(user_str)}&hash={calculated_hash}"
        headers = {"X-Telegram-Init-Data": init_data}

        # Solve puzzle 1 concurrently
        async def call_verify():
            return await client.post("/api/v1/gamification/academy/puzzles/1/verify", json={"move": "g5f7"}, headers=headers)

        responses = await asyncio.gather(
            call_verify(),
            call_verify(),
            call_verify()
        )

        # All of them should succeed with 200 (since verify is designed to return status "success" 
        # but with "Already solved" message on duplicates)
        for r in responses:
            assert r.status_code == 200
            
        success_first = sum(1 for r in responses if "Already solved" not in r.json().get("message", ""))
        duplicate_responses = sum(1 for r in responses if "Already solved" in r.json().get("message", ""))

        assert success_first == 1
        assert duplicate_responses == 2

        # Verify user XP only rewarded once (50 XP for puzzle 1)
        async with session_factory() as session:
            from sqlalchemy import select
            user_res = await session.execute(select(User).where(User.telegram_id == telegram_id))
            db_user = user_res.scalars().first()
            assert db_user.xp == 50
            assert db_user.elo == 1005 # Gained 5 ELO once

    finally:
        settings.TELEGRAM_BOT_TOKEN = original_token
        app.dependency_overrides.clear()

        async with session_factory() as session:
            from sqlalchemy import delete
            await session.execute(delete(SolvedPuzzle).where(SolvedPuzzle.user_id == user.id))
            await session.execute(delete(User).where(User.telegram_id == telegram_id))
            await session.commit()
