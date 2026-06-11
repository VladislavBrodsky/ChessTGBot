import pytest
from app.crud import user as user_crud

@pytest.mark.asyncio
async def test_get_user_stats_creates_user(client, db_session):
    telegram_id = 123456789
    response = await client.get(f"/api/v1/users/{telegram_id}?first_name=TestUser")
    assert response.status_code == 200
    data = response.json()
    assert data["telegram_id"] == telegram_id
    assert data["first_name"] == "TestUser"
    assert data["elo"] == 1000

@pytest.mark.asyncio
async def test_get_user_stats_syncs_profile(client, db_session):
    telegram_id = 987654321
    # First create
    await user_crud.create_user(db_session, telegram_id, "OldName")
    
    # Then sync with new info
    response = await client.get(f"/api/v1/users/{telegram_id}?first_name=NewName&photo_url=new_url")
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "NewName"
    assert data["photo_url"] == "new_url"

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
    response = await client.get("/api/v1/users/104?first_name=User1200")
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





