import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta
import json
from urllib.parse import quote

from app.models.user import User
from app.services.gamification_service import GamificationService

@pytest.mark.asyncio
async def test_accumulative_subscription_renewal(client: AsyncClient, db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # 1. Create a user with balance
    telegram_id = 999001
    user = User(
        telegram_id=telegram_id,
        first_name="RenewUser",
        username="renew_user",
        balance=10000,  # $100.00 (enough for two monthly subscriptions)
        is_premium=False,
        xp=100,
        level=1
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'RenewUser'}))}"
    headers = {"X-Telegram-Init-Data": init_data}

    # 2. Purchase first subscription (monthly, $29.00)
    res1 = await client.post("/api/v1/users/subscribe", json={"tier": "premium", "billing_period": "monthly"}, headers=headers)
    assert res1.status_code == 200
    
    # Reload user to check expiry
    result = await db_session.execute(select(User).where(User.telegram_id == telegram_id))
    user_loaded = result.scalars().first()
    assert user_loaded.is_premium is True
    assert user_loaded.is_premium_active is True
    first_expiry = user_loaded.premium_expires_at
    
    # Verify first expiry is ~30 days from now
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    time_diff = first_expiry - now
    assert abs(time_diff.days - 30) <= 1

    # 3. Purchase second subscription (monthly, $29.00)
    res2 = await client.post("/api/v1/users/subscribe", json={"tier": "premium", "billing_period": "monthly"}, headers=headers)
    assert res2.status_code == 200

    # Reload user again
    result = await db_session.execute(select(User).where(User.telegram_id == telegram_id))
    user_loaded2 = result.scalars().first()
    second_expiry = user_loaded2.premium_expires_at

    # Verify second expiry is exactly 30 days after first expiry
    expected_expiry = first_expiry + timedelta(days=30)
    assert abs((second_expiry - expected_expiry).total_seconds()) < 5


@pytest.mark.asyncio
async def test_expired_premium_self_healing(client: AsyncClient, db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # 1. Create an already expired premium user in database
    telegram_id = 999002
    yesterday = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1)
    user = User(
        telegram_id=telegram_id,
        first_name="ExpiredUser",
        username="expired_user",
        is_premium=True,
        premium_tier="premium",
        premium_expires_at=yesterday,
        xp=100,
        level=1
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'ExpiredUser'}))}"
    headers = {"X-Telegram-Init-Data": init_data}

    # Verify that before request, is_premium is statically True but is_premium_active is False
    assert user.is_premium is True
    assert user.is_premium_active is False

    # 2. Trigger sync endpoint which relies on get_current_user dependency
    response = await client.post("/api/v1/users/sync", headers=headers)
    assert response.status_code == 200
    
    # 3. Check response fields
    data = response.json()
    assert data["is_premium"] is False
    assert data["premium_tier"] is None

    # 4. Verify database state was updated dynamically (self-healing committed)
    result = await db_session.execute(select(User).where(User.telegram_id == telegram_id))
    db_user = result.scalars().first()
    assert db_user.is_premium is False
    assert db_user.premium_tier is None


@pytest.mark.asyncio
async def test_puzzle_gates_with_expired_premium(client: AsyncClient, db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # 1. Create an expired premium user
    telegram_id = 999003
    yesterday = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1)
    user = User(
        telegram_id=telegram_id,
        first_name="GatedUser",
        username="gated_user",
        is_premium=True,
        premium_tier="premium",
        premium_expires_at=yesterday,
        xp=100,
        level=1
    )
    db_session.add(user)
    await db_session.commit()

    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'GatedUser'}))}"
    headers = {"X-Telegram-Init-Data": init_data}

    # 2. Try to get details of a premium puzzle (puzzle_id > 1) via the /gamification/academy/puzzles/{puzzle_id} path
    response = await client.get("/api/v1/gamification/academy/puzzles/2", headers=headers)
    assert response.status_code == 403
    assert "Premium subscription required" in response.json()["detail"]


@pytest.mark.asyncio
async def test_xp_upgrade_for_expired_premium(client: AsyncClient, db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # 1. Create an expired premium user with 6000 XP
    telegram_id = 999004
    yesterday = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1)
    user = User(
        telegram_id=telegram_id,
        first_name="XPUpgradeUser",
        username="xp_upgrade_user",
        is_premium=True,
        premium_tier="premium",
        premium_expires_at=yesterday,
        xp=6000,
        level=1
    )
    db_session.add(user)
    await db_session.commit()

    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'XPUpgradeUser'}))}"
    headers = {"X-Telegram-Init-Data": init_data}

    # 2. Upgrade with XP via /gamification/premium/upgrade-with-xp
    response = await client.post("/api/v1/gamification/premium/upgrade-with-xp", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["new_xp"] == 1000
    assert data["is_premium"] is True

    # 3. Verify database states
    result = await db_session.execute(select(User).where(User.telegram_id == telegram_id))
    db_user = result.scalars().first()
    assert db_user.is_premium is True
    assert db_user.is_premium_active is True
    assert db_user.xp == 1000
    
    # Expiry should now be ~365 days from now (since it was expired, it starts from now)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    time_diff = db_user.premium_expires_at - now
    assert abs(time_diff.days - 365) <= 1
