"""Real SQLite persistence tests; PostgreSQL locking is tested separately."""
import json
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.database import Base
from app.models.transaction import Transaction  # register User relationship
from app.models.user import User
from app.models.game_history import GameHistory
from app.models.xp_transaction import XpTransaction
from app.services import engagement_campaign as campaign


@pytest_asyncio.fixture
async def quest(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setattr(get_settings(), "ENGAGEMENT_CAMPAIGN_ENABLED", True)
    async with factory() as db:
        user = User(telegram_id=700701, first_name="<Player>", xp=0, level=1, balance=12500)
        db.add(user)
        await db.commit()
        yield db, user
    await engine.dispose()


async def games(db, user, count=3, **overrides):
    now = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(seconds=1)
    for i in range(count):
        values = dict(game_id=f"game-{now.isoformat()}-{i}", white_player_id=user.telegram_id,
                      black_player_id=-1, game_type="computer", bid_amount=0,
                      total_moves=20, result_type="draw", created_at=now, ended_at=now)
        values.update(overrides)
        db.add(GameHistory(**values))
    await db.commit()


@pytest.mark.asyncio
async def test_qualifying_games_and_claim_retry(quest, monkeypatch):
    db, user = quest
    earlier = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1)
    await games(db, user, created_at=earlier, ended_at=earlier)  # before enrollment
    enrolled = await campaign.enroll(db, user)
    assert enrolled["progress"] == 0
    await games(db, user, count=1, total_moves=19)
    await games(db, user, count=1, result_type="aborted")
    await games(db, user, count=1, bid_amount=100)
    await games(db, user, count=1, game_type="online")
    assert (await campaign.status(db, user))["progress"] == 0
    with pytest.raises(campaign.CampaignError):
        await campaign.claim(db, user)
    await games(db, user)
    monkeypatch.setattr(campaign, "draw_reward", lambda: "xp_250")
    first = await campaign.claim(db, user)
    second = await campaign.claim(db, user)
    assert first == second
    assert user.xp == 250 and user.balance == 12500
    assert first["state"] == "claimed"
    assert (await db.execute(select(func.count(XpTransaction.id)).where(
        XpTransaction.reason == "engagement_box_claim"))).scalar_one() == 1


@pytest.mark.asyncio
async def test_join_is_idempotent_and_pausing_preserves_promises(quest, monkeypatch):
    db, user = quest
    await campaign.enroll(db, user)
    await campaign.enroll(db, user)
    assert (await db.execute(select(func.count(XpTransaction.id)).where(
        XpTransaction.reason == "engagement_enrolled"))).scalar_one() == 1
    monkeypatch.setattr(get_settings(), "ENGAGEMENT_CAMPAIGN_ENABLED", False)
    await games(db, user)
    monkeypatch.setattr(campaign, "draw_reward", lambda: "xp_250")
    assert (await campaign.claim(db, user))["state"] == "claimed"
    other = User(telegram_id=700702, first_name="Other")
    db.add(other)
    await db.commit()
    with pytest.raises(campaign.CampaignError):
        await campaign.enroll(db, other)


@pytest.mark.asyncio
@pytest.mark.parametrize("owned,expected", [(False, "border_gold"), (True, "gold_duplicate")])
async def test_collectible_and_duplicate_compensation(quest, monkeypatch, owned, expected):
    db, user = quest
    user.unlocked_items = json.dumps(["border_gold"] if owned else [])
    await db.commit()
    await campaign.enroll(db, user)
    await games(db, user)
    monkeypatch.setattr(campaign, "draw_reward", lambda: "border_gold")
    assert (await campaign.claim(db, user))["reward_key"] == expected
    assert json.loads(user.unlocked_items) == ["border_gold"]
    assert user.xp == (250 if owned else 0)
    assert user.balance == 12500


@pytest.mark.asyncio
async def test_boost_preserves_stronger_active_boost(quest, monkeypatch):
    db, user = quest
    expiry = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=2)
    user.xp_multiplier = 2.0
    user.multiplier_expires_at = expiry
    await db.commit()
    await campaign.enroll(db, user)
    await games(db, user)
    monkeypatch.setattr(campaign, "draw_reward", lambda: "boost_24h")
    await campaign.claim(db, user)
    assert user.xp_multiplier == 2.0
    assert user.multiplier_expires_at == expiry + timedelta(hours=24)
    assert user.balance == 12500


@pytest.mark.parametrize("roll,expected", [(0, "xp_250"), (59, "xp_250"), (60, "boost_24h"), (89, "boost_24h"), (90, "border_gold"), (99, "border_gold")])
def test_published_probability_boundaries(monkeypatch, roll, expected):
    monkeypatch.setattr(campaign.secrets, "randbelow", lambda n: roll)
    assert campaign.draw_reward() == expected
    assert sum(r["probability_percent"] for r in campaign.REWARDS) == 100
