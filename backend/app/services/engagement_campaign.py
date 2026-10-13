"""One free, once-per-account box, earned from server-recorded online matches.

Enrollment and receipts use the existing XP ledger. The user row serializes all
mutations; the receipt and reward commit together. No wallet credits or wagers.
"""
import json
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.game_history import GameHistory
from app.models.user import User
from app.models.xp_transaction import XpTransaction
from app.services.gamification_service import GamificationService

CAMPAIGN_ID = "first-three-v1"
TARGET = 3
MIN_PLIES = 20
REWARDS = (
    {"key": "xp_250", "probability_percent": 60},
    {"key": "boost_24h", "probability_percent": 30},
    {"key": "border_gold", "probability_percent": 10},
)
RECEIPT_KEYS = ("xp_250", "boost_24h", "border_gold", "gold_duplicate")


class CampaignError(ValueError):
    pass


def catalog():
    return {
        "campaign_id": CAMPAIGN_ID,
        "enabled": get_settings().ENGAGEMENT_CAMPAIGN_ENABLED,
        "accepting_enrollments": get_settings().ENGAGEMENT_CAMPAIGN_ENABLED,
        "target": TARGET,
        "minimum_plies": MIN_PLIES,
        "game_type": "online",
        "once_per_account": True,
        "cash_value": False,
        "rewards": list(REWARDS),
        "duplicate_reward": "xp_250",
    }


async def _enrollment(db, user):
    return (await db.execute(select(XpTransaction).where(
        XpTransaction.user_id == user.telegram_id,
        XpTransaction.reason == "engagement_enrolled",
        XpTransaction.reference_id == CAMPAIGN_ID,
    ).order_by(XpTransaction.id).limit(1))).scalars().first()


async def _receipt(db, user):
    return (await db.execute(select(XpTransaction).where(
        XpTransaction.user_id == user.telegram_id,
        XpTransaction.reason == "engagement_box_claim",
        XpTransaction.reference_id.in_([f"{CAMPAIGN_ID}:{key}" for key in RECEIPT_KEYS]),
    ).order_by(XpTransaction.id).limit(1))).scalars().first()


async def status(db: AsyncSession, user: User):
    enrolled = await _enrollment(db, user)
    receipt = await _receipt(db, user)
    progress = 0
    if enrolled:
        progress = min(TARGET, (await db.execute(select(func.count(GameHistory.id)).where(
            or_(
                GameHistory.white_player_id == user.telegram_id,
                GameHistory.black_player_id == user.telegram_id,
            ),
            GameHistory.black_player_id != -1,
            GameHistory.white_player_id != -1,
            GameHistory.game_type == "online",
            GameHistory.total_moves >= MIN_PLIES,
            GameHistory.result_type.in_(["checkmate", "resignation", "timeout", "draw"]),
            GameHistory.created_at >= enrolled.created_at,
            GameHistory.ended_at >= enrolled.created_at,
        ))).scalar_one())
    return {
        **catalog(),
        "enabled": bool(enrolled) or get_settings().ENGAGEMENT_CAMPAIGN_ENABLED,
        "enrolled": bool(enrolled),
        "progress": progress,
        "state": "claimed" if receipt else "claimable" if progress == TARGET else "active" if enrolled else "available",
        "reward_key": receipt.reference_id.split(":", 1)[1] if receipt else None,
    }


async def _locked_user(db, user):
    locked = (await db.execute(select(User).where(User.id == user.id)
                              .with_for_update().execution_options(populate_existing=True))).scalars().first()
    if not locked:
        raise CampaignError("Account unavailable")
    return locked


async def enroll(db: AsyncSession, user: User):
    user = await _locked_user(db, user)
    if not await _enrollment(db, user):
        if not get_settings().ENGAGEMENT_CAMPAIGN_ENABLED:
            raise CampaignError("New entries are currently paused")
        db.add(XpTransaction(user_id=user.telegram_id, amount=0,
                             reason="engagement_enrolled", reference_id=CAMPAIGN_ID))
    await db.commit()
    return await status(db, user)


def draw_reward():
    roll = secrets.randbelow(100)
    cursor = 0
    for reward in REWARDS:
        cursor += reward["probability_percent"]
        if roll < cursor:
            return reward["key"]
    raise RuntimeError("Reward probabilities must sum to 100")


async def claim(db: AsyncSession, user: User):
    user = await _locked_user(db, user)
    previous = await _receipt(db, user)
    if previous:
        return await status(db, user)  # retries return the same outcome
    before = await status(db, user)
    if before["state"] != "claimable":
        raise CampaignError("Complete three qualifying matches after joining")
    key = draw_reward()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if key == "border_gold":
        items = json.loads(user.unlocked_items or "[]")
        if not isinstance(items, list):
            raise CampaignError("Inventory unavailable; please try again")
        if key in items:
            key = "gold_duplicate"
        else:
            user.unlocked_items = json.dumps([*items, key])
    if key in {"xp_250", "gold_duplicate"}:
        await GamificationService.add_xp(db, user, 250, trigger_kickback=False,
                                        apply_booster=False, commit=False,
                                        reason="engagement_reward", reference_id=CAMPAIGN_ID)
    elif key == "boost_24h":
        active = user.multiplier_expires_at and user.multiplier_expires_at > now
        user.xp_multiplier = max(user.xp_multiplier or 1.0, 1.5) if active else 1.5
        user.multiplier_expires_at = (user.multiplier_expires_at if active else now) + timedelta(hours=24)
    db.add(XpTransaction(user_id=user.telegram_id, amount=0, reason="engagement_box_claim",
                         reference_id=f"{CAMPAIGN_ID}:{key}"))
    await db.commit()
    return await status(db, user)
