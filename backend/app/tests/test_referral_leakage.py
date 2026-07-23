import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

from app.core.database import Base
from app.models.user import User
from app.models.transaction import Transaction
from app.services.referral_commission_service import ReferralCommissionService


@pytest_asyncio.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as session:
        yield session
    await engine.dispose()


@pytest.mark.asyncio
async def test_wager_commission_leakage_redirected_to_admin(db):
    admin = User(telegram_id=99999, username="uslincoln", first_name="Lincoln", balance=0, elo=1000)
    player = User(telegram_id=10001, username="player1", first_name="Player", balance=1000, elo=1000)
    db.add_all([admin, player])
    await db.commit()

    # Match bid = $10.00 (1000 cents), Pot = $20.00 (2000 cents). 2% pool = 40 cents.
    # Player has no referrer, so 100% of the 40 cents referral pool is leakage.
    distributed = await ReferralCommissionService.distribute_wager_commissions(
        db, game_id="game_leak_1", player_id=player.id, bid_amount=1000, is_winner=True
    )

    assert distributed == 0
    await db.refresh(admin)
    assert admin.balance == 40

    res = await db.execute(
        select(Transaction).filter(Transaction.reference_id == "leak_game_leak_1")
    )
    tx_leak = res.scalars().first()
    assert tx_leak is not None
    assert tx_leak.type == "referral_commission_leakage"
    assert tx_leak.amount == 40
    assert tx_leak.user_id == 99999


@pytest.mark.asyncio
async def test_subscription_commission_leakage_redirected_to_admin(db):
    admin = User(telegram_id=99999, username="uslincoln", first_name="Lincoln", balance=0, elo=1000)
    subscriber = User(telegram_id=20002, username="subscriber1", first_name="Sub", balance=0, elo=1000)
    db.add_all([admin, subscriber])
    await db.commit()

    # Subscription price = $9.99 (999 cents). 30% pool = 299 cents.
    # Subscriber has no referrer, so 100% of the 299 cents pool is leakage.
    distributed = await ReferralCommissionService.distribute_subscription_commissions(
        db, subscriber_id=subscriber.id, price=999
    )

    assert distributed == 0
    await db.refresh(admin)
    assert admin.balance == 299

    res = await db.execute(
        select(Transaction).filter(Transaction.type == "referral_commission_leakage")
    )
    tx_leak = res.scalars().first()
    assert tx_leak is not None
    assert tx_leak.amount == 299
    assert tx_leak.user_id == 99999
