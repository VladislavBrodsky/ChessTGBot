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


@pytest.mark.asyncio
async def test_three_tier_referral_commission(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    from app.services.referral_commission_service import ReferralCommissionService
    from app.models.transaction import Transaction

    # 1. Create a 3-tier referrer structure
    # Tier 3 Referrer (Grandparent) - Premium
    r3 = User(telegram_id=300001, first_name="R3", referral_code="R3CODE", is_premium=True, balance=0)
    db_session.add(r3)
    
    # Tier 2 Referrer (Parent) - Premium
    r2 = User(telegram_id=200001, first_name="R2", referral_code="R2CODE", is_premium=True, balance=0)
    db_session.add(r2)

    # Tier 1 Referrer (Direct) - Premium
    r1 = User(telegram_id=100001, first_name="R1", referral_code="R1CODE", is_premium=True, balance=0)
    db_session.add(r1)

    # Player (Referred by R1)
    player = User(telegram_id=400001, first_name="Player", referral_code="PLAYCODE", is_premium=False, balance=0)
    db_session.add(player)
    
    await db_session.commit()
    await db_session.refresh(r3)
    await db_session.refresh(r2)
    await db_session.refresh(r1)
    await db_session.refresh(player)

    # Create Referral records to link them
    # R3 referred R2
    ref_3_2 = Referral(referrer_id=r3.id, referred_user_id=r2.id)
    db_session.add(ref_3_2)
    # R2 referred R1
    ref_2_1 = Referral(referrer_id=r2.id, referred_user_id=r1.id)
    db_session.add(ref_2_1)
    # R1 referred Player
    ref_1_p = Referral(referrer_id=r1.id, referred_user_id=player.id)
    db_session.add(ref_1_p)
    await db_session.commit()

    # Distribute wager commissions (Wager = 10000 cents / $100.00)
    # Individual rake = 10000 * 0.03 = 300 cents.
    # Tier 1 (R1) gets 10% of 300 = 30 cents.
    # Tier 2 (R2) gets 5% of 300 = 15 cents.
    # Tier 3 (R3) gets 2.5% of 300 = 7 cents.
    wager = 10000
    await ReferralCommissionService.distribute_wager_commissions(db_session, "test_game_comm", player.id, wager)
    await db_session.commit()

    await db_session.refresh(r1)
    await db_session.refresh(r2)
    await db_session.refresh(r3)

    assert r1.balance == 30
    assert r2.balance == 15
    assert r3.balance == 7

    # Verify transaction entries
    txs_result = await db_session.execute(
        select(Transaction).where(Transaction.reference_id == "test_game_comm")
    )
    txs = txs_result.scalars().all()
    assert len(txs) == 3
    
    # Check types and amounts
    r1_tx = next(t for t in txs if t.user_id == r1.telegram_id)
    assert r1_tx.type == "referral_commission"
    assert r1_tx.amount == 30

    r2_tx = next(t for t in txs if t.user_id == r2.telegram_id)
    assert r2_tx.type == "referral_commission"
    assert r2_tx.amount == 15

    r3_tx = next(t for t in txs if t.user_id == r3.telegram_id)
    assert r3_tx.type == "referral_commission"
    assert r3_tx.amount == 7


@pytest.mark.asyncio
async def test_three_tier_referral_commission_non_premium_skipped(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    from app.services.referral_commission_service import ReferralCommissionService
    from app.models.transaction import Transaction

    # 1. Create a 3-tier referrer structure where Tier 2 is NOT premium
    r3 = User(telegram_id=300002, first_name="R3_P", referral_code="R3P", is_premium=True, balance=0)
    db_session.add(r3)
    
    r2 = User(telegram_id=200002, first_name="R2_NP", referral_code="R2NP", is_premium=False, balance=0)
    db_session.add(r2)

    r1 = User(telegram_id=100002, first_name="R1_P", referral_code="R1P", is_premium=True, balance=0)
    db_session.add(r1)

    player = User(telegram_id=400002, first_name="Player2", referral_code="PLAY2", is_premium=False, balance=0)
    db_session.add(player)
    
    await db_session.commit()
    await db_session.refresh(r3)
    await db_session.refresh(r2)
    await db_session.refresh(r1)
    await db_session.refresh(player)

    # Link referrals
    db_session.add(Referral(referrer_id=r3.id, referred_user_id=r2.id))
    db_session.add(Referral(referrer_id=r2.id, referred_user_id=r1.id))
    db_session.add(Referral(referrer_id=r1.id, referred_user_id=player.id))
    await db_session.commit()

    # Distribute commissions
    wager = 10000
    await ReferralCommissionService.distribute_wager_commissions(db_session, "test_game_comm_np", player.id, wager)
    await db_session.commit()

    await db_session.refresh(r1)
    await db_session.refresh(r2)
    await db_session.refresh(r3)

    # R1 (Tier 1 - Premium) gets 30
    assert r1.balance == 30
    # R2 (Tier 2 - Non-Premium) gets 0
    assert r2.balance == 0
    # R3 (Tier 3 - Premium) gets 7
    assert r3.balance == 7

    # Verify transaction entries
    txs_result = await db_session.execute(
        select(Transaction).where(Transaction.reference_id == "test_game_comm_np")
    )
    txs = txs_result.scalars().all()
    # R2 is skipped, so only 2 transaction ledger records should exist
    assert len(txs) == 2

