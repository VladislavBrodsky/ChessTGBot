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
