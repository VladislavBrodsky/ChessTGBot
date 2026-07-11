"""
Sybil / account-farming resistance (audit item A1).

The farmable surface is the referral signup bonus: it mints real USDT
balance. Covers: same-IP referral attribution refusal, the real-games
requirement on the 3-game milestone, the per-referrer 24h bonus cap, and
the signup-cluster Security alert.
"""
import uuid
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.user import User
from app.models.gamification import Referral
from app.models.transaction import Transaction
from app.models.game_history import GameHistory
from app.services.gamification_service import GamificationService
from app.services import sybil_guard

settings = get_settings()


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def _make_user(db: AsyncSession, telegram_id: int, code: str = None, ip: str = None) -> User:
    user = User(
        telegram_id=telegram_id,
        first_name=f"U{telegram_id}",
        referral_code=code,
        xp=0,
        signup_ip_hash=ip,
        created_at=_now(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def _add_games(db: AsyncSession, telegram_id: int, n: int, moves: int):
    for _ in range(n):
        db.add(GameHistory(
            game_id=f"syb_{uuid.uuid4().hex[:12]}",
            white_player_id=telegram_id,
            black_player_id=-1,
            total_moves=moves,
        ))
    await db.commit()


async def _referral_exists(db: AsyncSession, referrer: User, referred: User) -> bool:
    res = await db.execute(
        select(Referral).where(
            Referral.referrer_id == referrer.id,
            Referral.referred_user_id == referred.id,
        )
    )
    return res.scalars().first() is not None


@pytest.mark.asyncio
async def test_same_ip_referral_attribution_refused(db_session: AsyncSession):
    if hasattr(db_session, "users"):
        return

    referrer = await _make_user(db_session, 881001, code="SYB001", ip="iphash_same_device")
    recruit = await _make_user(db_session, 881002, ip="iphash_same_device")

    success = await GamificationService.process_referral(db_session, recruit, "SYB001")
    assert success is False
    assert not await _referral_exists(db_session, referrer, recruit)


@pytest.mark.asyncio
async def test_different_ip_referral_allowed(db_session: AsyncSession):
    if hasattr(db_session, "users"):
        return

    referrer = await _make_user(db_session, 881003, code="SYB002", ip="iphash_device_a")
    recruit = await _make_user(db_session, 881004, ip="iphash_device_b")

    success = await GamificationService.process_referral(db_session, recruit, "SYB002")
    assert success is True
    assert await _referral_exists(db_session, referrer, recruit)


@pytest.mark.asyncio
async def test_milestone_requires_real_games(db_session: AsyncSession):
    if hasattr(db_session, "users"):
        return

    referrer = await _make_user(db_session, 881005, code="SYB003", ip="iphash_r1")
    recruit = await _make_user(db_session, 881006, ip="iphash_u1")
    assert await GamificationService.process_referral(db_session, recruit, "SYB003")

    # 3 instant resigns: games_played says 3, but none had real moves.
    recruit.games_played = 3
    db_session.add(recruit)
    await db_session.commit()
    await _add_games(db_session, recruit.telegram_id, 3, moves=2)

    assert await GamificationService.check_referral_game_milestone(db_session, recruit.id) is False
    await db_session.refresh(referrer)
    assert referrer.balance == 0            # no bonus minted

    # Real games qualify.
    await _add_games(db_session, recruit.telegram_id, 3, moves=settings.REFERRAL_MILESTONE_MIN_MOVES)
    assert await GamificationService.check_referral_game_milestone(db_session, recruit.id) is True
    await db_session.refresh(referrer)
    assert referrer.balance == 10           # non-premium referrer signup bonus


@pytest.mark.asyncio
async def test_signup_bonus_daily_cap_defers(db_session: AsyncSession):
    if hasattr(db_session, "users"):
        return

    referrer = await _make_user(db_session, 881007, code="SYB004", ip="iphash_r2")
    recruit = await _make_user(db_session, 881008, ip="iphash_u2")
    assert await GamificationService.process_referral(db_session, recruit, "SYB004")

    recruit.games_played = 3
    db_session.add(recruit)
    await db_session.commit()
    await _add_games(db_session, recruit.telegram_id, 3, moves=30)

    # Referrer already banked the daily cap within the last 24h.
    for i in range(settings.REFERRAL_SIGNUP_BONUS_DAILY_CAP):
        db_session.add(Transaction(
            user_id=referrer.telegram_id,
            type="referral_commission",
            amount=10,
            status="completed",
            reference_id=f"ref_signup_bonus_prior{i}",
        ))
    await db_session.commit()

    assert await GamificationService.check_referral_game_milestone(db_session, recruit.id) is False
    await db_session.refresh(referrer)
    assert referrer.balance == 0            # deferred, not paid

    # Age one prior bonus out of the rolling window -> the deferred bonus unlocks.
    res = await db_session.execute(
        select(Transaction).where(Transaction.reference_id == "ref_signup_bonus_prior0")
    )
    old_tx = res.scalars().first()
    old_tx.created_at = _now() - timedelta(hours=25)
    db_session.add(old_tx)
    await db_session.commit()

    assert await GamificationService.check_referral_game_milestone(db_session, recruit.id) is True
    await db_session.refresh(referrer)
    assert referrer.balance == 10


@pytest.mark.asyncio
async def test_signup_cluster_alert_fires_at_threshold(db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return

    ip = "iphash_cluster_farm"
    threshold = settings.SIGNUP_IP_CLUSTER_ALERT_THRESHOLD

    # One below threshold: no alert.
    for i in range(threshold - 1):
        await _make_user(db_session, 881100 + i, ip=ip)
    with patch("app.core.alerts.send_alert_with_redis_rate_limit", new_callable=AsyncMock) as mock_alert:
        await sybil_guard.note_signup(db_session, ip)
        mock_alert.assert_not_awaited()

    # At threshold: Security alert fires.
    await _make_user(db_session, 881100 + threshold, ip=ip)
    with patch("app.core.alerts.send_alert_with_redis_rate_limit", new_callable=AsyncMock) as mock_alert:
        await sybil_guard.note_signup(db_session, ip)
        mock_alert.assert_awaited_once()
        assert mock_alert.await_args.kwargs.get("system") == "security"
