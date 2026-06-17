import pytest
from app.crud import user as user_crud

@pytest.mark.asyncio
async def test_get_user_stats_creates_user(client, db_session):
    import json
    from urllib.parse import quote
    telegram_id = 123456789
    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'TestUser'}))}"
    response = await client.post(
        "/api/v1/users/sync",
        headers={"X-Telegram-Init-Data": init_data}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["telegram_id"] == telegram_id
    assert data["first_name"] == "TestUser"
    assert data["elo"] == 1000

@pytest.mark.asyncio
async def test_get_user_stats_syncs_profile(client, db_session):
    import json
    from urllib.parse import quote
    telegram_id = 987654321
    # First create
    await user_crud.create_user(db_session, telegram_id, "OldName")
    
    # Then sync with new info
    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'NewName'}))}"
    response = await client.post(
        "/api/v1/users/sync",
        headers={"X-Telegram-Init-Data": init_data}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "NewName"


@pytest.mark.asyncio
async def test_create_game_computer(client):
    response = await client.post("/api/v1/game/create?type=computer")
    assert response.status_code == 200
    data = response.json()
    assert "game_id" in data

@pytest.mark.asyncio
async def test_nonexistent_api_returns_json_404(client):
    response = await client.get("/api/v1/nonexistent")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data

def test_validate_init_data_extracts_start_param():
    import hmac
    import hashlib
    import json
    from urllib.parse import quote
    from app.core.security import validate_init_data
    from app.core.config import get_settings

    settings = get_settings()
    original_token = settings.TELEGRAM_BOT_TOKEN
    settings.TELEGRAM_BOT_TOKEN = "123456789:test_token"
    
    try:
        user_data = {
            "id": 999999,
            "first_name": "John",
            "username": "john_doe"
        }
        user_str = json.dumps(user_data)
        
        auth_date = "1710000000"
        start_param = "ref_12345"
        
        check_list = [
            f"auth_date={auth_date}",
            f"start_param={start_param}",
            f"user={user_str}"
        ]
        data_check_string = "\n".join(check_list)
        
        secret_key = hmac.new(b"WebAppData", settings.TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        init_data = f"auth_date={quote(auth_date)}&start_param={quote(start_param)}&user={quote(user_str)}&hash={calculated_hash}"
        
        parsed_user = validate_init_data(init_data)
        assert parsed_user["id"] == 999999
        assert parsed_user["first_name"] == "John"
        assert parsed_user["start_param"] == "ref_12345"
    finally:
        settings.TELEGRAM_BOT_TOKEN = original_token

@pytest.mark.asyncio
async def test_subscribe_billing_periods(client, db_session):
    # Skip if using mock session to prevent database exceptions
    if hasattr(db_session, "users"):
        return

    from app.models.user import User
    from app.crud import user as user_crud
    
    # 1. Create a user with enough balance for annual premium ($12.00 / 1200 cents)
    telegram_id = 555559
    user = await user_crud.create_user(db_session, telegram_id, "Subscriber")
    user.balance = 2000 # 20.00 USD
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # 2. Mock authentication header
    import hmac, hashlib, json, time
    from urllib.parse import quote
    from app.core.config import get_settings
    settings = get_settings()
    original_token = settings.TELEGRAM_BOT_TOKEN
    settings.TELEGRAM_BOT_TOKEN = "123456789:test_token"
    
    try:
        user_str = json.dumps({"id": telegram_id, "first_name": "Subscriber"})
        auth_date = str(int(time.time()))
        check_list = [f"auth_date={auth_date}", f"user={user_str}"]
        data_check_string = "\n".join(check_list)
        secret_key = hmac.new(b"WebAppData", settings.TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        init_data = f"auth_date={quote(auth_date)}&user={quote(user_str)}&hash={calculated_hash}"
        
        headers = {"X-Telegram-Init-Data": init_data}

        # 3. Test Subscribe Monthly
        res = await client.post("/api/v1/users/subscribe", json={"tier": "basic", "billing_period": "monthly"}, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["tier"] == "basic"
        
        # Verify DB states
        await db_session.refresh(user)
        assert user.balance == 1950 # Deducted 50 cents
        assert user.premium_tier == "basic"
        assert user.is_premium is True
        
        # 4. Test Subscribe Annual
        res2 = await client.post("/api/v1/users/subscribe", json={"tier": "premium", "billing_period": "annual"}, headers=headers)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["tier"] == "premium"
        
        # Verify DB states
        await db_session.refresh(user)
        assert user.balance == 750 # Deducted 1200 cents
        assert user.premium_tier == "premium"
        
    finally:
        settings.TELEGRAM_BOT_TOKEN = original_token

@pytest.mark.asyncio
async def test_referral_parsing_strips_prefix(client, db_session):
    # Skip if using mock session to prevent database exceptions
    if hasattr(db_session, "users"):
        return

    from app.models.user import User
    from app.crud import user as user_crud
    from app.models.gamification import Referral
    from sqlalchemy.future import select
    
    # 1. Create a referrer user
    referrer = await user_crud.create_user(db_session, 88888, "Referrer")
    referrer.referral_code = "ABC12345"
    db_session.add(referrer)
    await db_session.commit()
    await db_session.refresh(referrer)

    # 2. Mock authentication header for new user with start_param="ref_ABC12345"
    import hmac, hashlib, json, time
    from urllib.parse import quote
    from app.core.config import get_settings
    settings = get_settings()
    original_token = settings.TELEGRAM_BOT_TOKEN
    settings.TELEGRAM_BOT_TOKEN = "123456789:test_token"
    
    try:
        new_telegram_id = 99999
        user_str = json.dumps({"id": new_telegram_id, "first_name": "NewUser"})
        auth_date = str(int(time.time()))
        check_list = [f"auth_date={auth_date}", "start_param=ref_ABC12345", f"user={user_str}"]
        data_check_string = "\n".join(check_list)
        secret_key = hmac.new(b"WebAppData", settings.TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        init_data = f"auth_date={quote(auth_date)}&start_param=ref_ABC12345&user={quote(user_str)}&hash={calculated_hash}"
        
        headers = {"X-Telegram-Init-Data": init_data}

        # Query the sync endpoint to trigger auto-registration with start_param
        res = await client.post("/api/v1/users/sync", headers=headers)
        assert res.status_code == 200
        
        # Verify referral created in database
        ref_query = await db_session.execute(select(Referral).filter(Referral.referrer_id == referrer.id))
        referral_record = ref_query.scalars().first()
        assert referral_record is not None
        
        # Verify XP rewards awarded
        await db_session.refresh(referrer)
        assert referrer.xp == 50
        
    finally:
        settings.TELEGRAM_BOT_TOKEN = original_token


def test_parse_init_data_unverified():
    from urllib.parse import quote
    from app.core.security import parse_init_data_unverified
    import json

    user_data = {
        "id": 888888,
        "first_name": "Alice",
        "username": "alice_wonder"
    }
    user_str = json.dumps(user_data)
    
    init_data = f"auth_date=1710000000&start_param=ref_54321&user={quote(user_str)}&hash=invalid_hash_value"
    
    # Even with an invalid hash, unverified parsing should successfully extract user details in dev fallback
    parsed_user = parse_init_data_unverified(init_data)
    assert parsed_user["id"] == 888888
    assert parsed_user["first_name"] == "Alice"
    assert parsed_user["start_param"] == "ref_54321"


@pytest.mark.asyncio
async def test_profile_metrics_calculations(client, db_session):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    from app.models.user import User as UserModel

    # Create multiple users with different ELOs
    # Total: 5 users
    # ELOs: 1500 (u1), 1400 (u2), 1300 (u3), 1200 (u4), 1100 (u5)
    u1 = UserModel(telegram_id=101, first_name="User1500", elo=1500, games_played=10, wins=8, losses=2, draws=0)
    u2 = UserModel(telegram_id=102, first_name="User1400", elo=1400, games_played=10, wins=6, losses=3, draws=1)
    u3 = UserModel(telegram_id=103, first_name="User1300", elo=1300, games_played=10, wins=5, losses=3, draws=2)
    u4 = UserModel(telegram_id=104, first_name="User1200", elo=1200, games_played=20, wins=10, losses=5, draws=5)
    u5 = UserModel(telegram_id=105, first_name="User1100", elo=1100, games_played=10, wins=2, losses=8, draws=0)

    db_session.add(u1)
    db_session.add(u2)
    db_session.add(u3)
    db_session.add(u4)
    db_session.add(u5)
    await db_session.commit()

    # Query u4 (User1200) stats
    import json
    from urllib.parse import quote
    init_data = f"user={quote(json.dumps({'id': 104}))}"
    response = await client.get("/api/v1/users/104", headers={"X-Telegram-Init-Data": init_data})
    assert response.status_code == 200
    data = response.json()

    # Total games: 20, wins: 10, losses: 5, draws: 5
    # win_rate: 10/20 = 50.0%
    # loss_rate: 5/20 = 25.0%
    # draw_rate: 5/20 = 25.0%
    # total_score (Chess.com points): 10 * 1.0 + 5 * 0.5 = 12.5
    assert data["win_rate"] == 50.0
    assert data["loss_rate"] == 25.0
    assert data["draw_rate"] == 25.0
    assert data["total_score"] == 12.5

    # global_rank: ELO > 1200 are: 1500, 1400, 1300 (3 users). So rank is 4.
    # percentile: (total_users - global_rank) / total_users * 100
    from sqlalchemy import select, func
    total_users_res = await db_session.execute(select(UserModel.id))
    total_users = len(total_users_res.scalars().all())
    expected_percentile = round(((total_users - 4) / total_users * 100), 1)

    assert data["global_rank"] == 4
    assert data["percentile"] == expected_percentile


@pytest.mark.asyncio
async def test_subscription_tasks_verification(client, db_session):
    if hasattr(db_session, "users"):
        return

    from app.models.user import User as UserModel
    from app.models.gamification import Task, UserTask
    from sqlalchemy.future import select
    from app.services.gamification_service import GamificationService

    # Seed Task definitions first
    for tid, tkey in [(201, "join_channel"), (202, "join_chat")]:
        res_t = await db_session.execute(select(Task).where(Task.id == tid))
        if not res_t.scalars().first():
            db_session.add(Task(id=tid, title_key=tkey, description_key=f"Sub to {tkey}", xp_reward=150, task_type="LOGIN", target_count=1, is_daily=False))
    await db_session.commit()

    # 1. Create a user with unique ID 777111222
    telegram_id = 777111222
    user = await user_crud.create_user(db_session, telegram_id, "Verifier")
    
    # Generate achievements/tasks for this user
    await GamificationService.get_or_create_achievements(db_session, user.id)

    # 2. Mock authentication header
    import hmac, hashlib, json, time
    from urllib.parse import quote
    from app.core.config import get_settings
    settings = get_settings()
    original_token = settings.TELEGRAM_BOT_TOKEN
    settings.TELEGRAM_BOT_TOKEN = "123456789:test_token"
    
    try:
        user_str = json.dumps({"id": telegram_id, "first_name": "Verifier"})
        auth_date = str(int(time.time()))
        check_list = [f"auth_date={auth_date}", f"user={user_str}"]
        data_check_string = "\n".join(check_list)
        secret_key = hmac.new(b"WebAppData", settings.TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        init_data = f"auth_date={quote(auth_date)}&user={quote(user_str)}&hash={calculated_hash}"
        headers = {"X-Telegram-Init-Data": init_data}

        # Verify task 201 (join channel)
        res = await client.post("/api/v1/gamification/tasks/201/verify", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["completed"] is True

        # Verify DB updates
        result = await db_session.execute(select(UserTask).where(UserTask.user_id == user.id, UserTask.task_id == 201))
        ut = result.scalars().first()
        assert ut.completed is True

    finally:
        settings.TELEGRAM_BOT_TOKEN = original_token
        from sqlalchemy import delete
        await db_session.execute(delete(UserTask).where(UserTask.user_id == user.id))
        await db_session.execute(delete(Task).where(Task.id.in_([201, 202])))
        await db_session.commit()


@pytest.mark.asyncio
async def test_chess_puzzles_endpoints(client, db_session):
    if hasattr(db_session, "users"):
        return

    from app.models.user import User as UserModel

    telegram_id = 666111222
    user = await user_crud.create_user(db_session, telegram_id, "Puzzler")
    
    # 2. Mock authentication header
    import hmac, hashlib, json, time
    from urllib.parse import quote
    from app.core.config import get_settings
    settings = get_settings()
    original_token = settings.TELEGRAM_BOT_TOKEN
    settings.TELEGRAM_BOT_TOKEN = "123456789:test_token"
    
    try:
        user_str = json.dumps({"id": telegram_id, "first_name": "Puzzler"})
        auth_date = str(int(time.time()))
        check_list = [f"auth_date={auth_date}", f"user={user_str}"]
        data_check_string = "\n".join(check_list)
        secret_key = hmac.new(b"WebAppData", settings.TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        init_data = f"auth_date={quote(auth_date)}&user={quote(user_str)}&hash={calculated_hash}"
        headers = {"X-Telegram-Init-Data": init_data}

        # 3. Test list puzzles
        res = await client.get("/api/v1/gamification/academy/puzzles", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 100
        # Puzzle 1 is unlocked for everyone, puzzle 2 is premium locked
        assert data[0]["is_premium_locked"] is False
        assert data[1]["is_premium_locked"] is True

        # 4. Test fetch puzzle 2 (premium locked)
        res_p2 = await client.get("/api/v1/gamification/academy/puzzles/2", headers=headers)
        assert res_p2.status_code == 403 # Locked!

        # 5. Make user Premium to test access
        user.is_premium = True
        db_session.add(user)
        await db_session.commit()

        # Retry fetching puzzle 2
        res_p2_premium = await client.get("/api/v1/gamification/academy/puzzles/2", headers=headers)
        assert res_p2_premium.status_code == 200
        p2_data = res_p2_premium.json()
        assert p2_data["id"] == 2
        assert "fen" in p2_data

        # 6. Verify solution for puzzle 1
        res_verify = await client.post("/api/v1/gamification/academy/puzzles/1/verify", json={"solution": ["g5f7"]}, headers=headers)
        assert res_verify.status_code == 200
        verify_data = res_verify.json()
        assert verify_data["solved"] is True
        
        await db_session.refresh(user)
        assert user.elo == 1005 # Gained 5 ELO

    finally:
        settings.TELEGRAM_BOT_TOKEN = original_token







