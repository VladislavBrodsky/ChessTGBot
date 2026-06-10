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



