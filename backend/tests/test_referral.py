import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.gamification import Referral
from app.services.gamification_service import GamificationService
from app.core.config import get_settings

settings = get_settings()

@pytest.mark.asyncio
async def test_process_referral_success(db_session: AsyncSession):
    # Skip if using mock session to prevent table insert issues
    if hasattr(db_session, "users"):
        return

    # 1. Create a referrer user
    referrer = User(
        telegram_id=111111,
        first_name="Referrer",
        referral_code="REF12345",
        xp=100,
        level=1
    )
    db_session.add(referrer)
    
    # 2. Create a referred user
    referred = User(
        telegram_id=222222,
        first_name="Referred",
        referral_code="REF67890",
        xp=0,
        level=1
    )
    db_session.add(referred)
    await db_session.commit()
    await db_session.refresh(referrer)
    await db_session.refresh(referred)

    # 3. Process referral with raw code
    success = await GamificationService.process_referral(db_session, referred, "REF12345")
    assert success is True

    # 4. Verify referral record was created
    result = await db_session.execute(
        select(Referral).where(
            Referral.referrer_id == referrer.id,
            Referral.referred_user_id == referred.id
        )
    )
    ref_record = result.scalars().first()
    assert ref_record is not None

    # 5. Verify XP was awarded (referrer gets 50 XP, referred gets 20 XP)
    await db_session.refresh(referrer)
    await db_session.refresh(referred)
    assert referrer.xp == 150
    assert referred.xp == 20


@pytest.mark.asyncio
async def test_process_referral_with_prefix(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # Create referrer
    referrer = User(
        telegram_id=333333,
        first_name="Referrer2",
        referral_code="XYZ54321",
        xp=0,
        level=1
    )
    db_session.add(referrer)

    # Create referred
    referred = User(
        telegram_id=444444,
        first_name="Referred2",
        referral_code="ABC09876",
        xp=0,
        level=1
    )
    db_session.add(referred)
    await db_session.commit()
    await db_session.refresh(referrer)
    await db_session.refresh(referred)

    # Process referral with ref_ prefix
    success = await GamificationService.process_referral(db_session, referred, "ref_XYZ54321")
    assert success is True

    # Verify XP and linkage
    await db_session.refresh(referrer)
    await db_session.refresh(referred)
    assert referrer.xp == 50
    assert referred.xp == 20


@pytest.mark.asyncio
async def test_process_referral_duplicate_prevented(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # Create referrer and referred
    referrer = User(
        telegram_id=555555,
        first_name="Referrer3",
        referral_code="DUP11111",
        xp=0,
        level=1
    )
    db_session.add(referrer)

    referred = User(
        telegram_id=666666,
        first_name="Referred3",
        referral_code="DUP22222",
        xp=0,
        level=1
    )
    db_session.add(referred)
    await db_session.commit()
    await db_session.refresh(referrer)
    await db_session.refresh(referred)

    # First referral processing should succeed
    success1 = await GamificationService.process_referral(db_session, referred, "DUP11111")
    assert success1 is True

    # Second referral processing (duplicate) should fail
    success2 = await GamificationService.process_referral(db_session, referred, "DUP11111")
    assert success2 is False

    # XP should only be awarded once
    await db_session.refresh(referrer)
    await db_session.refresh(referred)
    assert referrer.xp == 50
    assert referred.xp == 20


@pytest.mark.asyncio
async def test_process_referral_self_referral_prevented(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # Create user
    user = User(
        telegram_id=777777,
        first_name="SelfReferrer",
        referral_code="SELF999",
        xp=0,
        level=1
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Try self referral
    success = await GamificationService.process_referral(db_session, user, "SELF999")
    assert success is False
    assert user.xp == 0


@pytest.mark.asyncio
async def test_sync_endpoint_returns_bot_username(client: AsyncClient, db_session: AsyncSession):
    # Fetch /sync endpoint
    # The client uses get_current_user dependency which auto-registers telegram_id 123456789 in SQLite
    response = await client.post("/api/v1/users/sync")
    assert response.status_code == 200
    data = response.json()
    
    # Assert bot_username is in response and matches config
    assert "bot_username" in data
    assert data["bot_username"] == settings.TELEGRAM_BOT_USERNAME


@pytest.mark.asyncio
async def test_get_user_stats_returns_bot_username(client: AsyncClient, db_session: AsyncSession):
    # Get stats for a user
    response = await client.get("/api/v1/users/123456789?first_name=TestUser")
    assert response.status_code == 200
    data = response.json()
    
    assert "bot_username" in data
    assert data["bot_username"] == settings.TELEGRAM_BOT_USERNAME
