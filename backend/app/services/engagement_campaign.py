"""One free, once-per-account box, earned from server-recorded online matches.

Enrollment and receipts use the existing XP ledger. The user row serializes all
mutations; the receipt and reward commit together. No wallet credits or wagers.
"""
import json
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.game_history import GameHistory
from app.models.user import User
from app.models.xp_transaction import XpTransaction
from app.services.gamification_service import GamificationService

CAMPAIGN_ID = "first-three-v1"
TARGET = 3
MIN_PLIES = 20
PREMIUM_CAP = 100
REWARDS = (
    {"key": "xp_250", "probability_percent": 60},
    {"key": "boost_24h", "probability_percent": 30},
    {"key": "border_gold", "probability_percent": 10},
)
PLATINUM_REWARD = {"key": "premium_1m", "probability_percent": 100}
RECEIPT_KEYS = ("premium_1m", "xp_250", "boost_24h", "border_gold", "gold_duplicate")


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
        "free_ai_eligible": True,
        "free_human_eligible": True,
        "existing_human_eligibility_preserved": True,
        "once_per_account": True,
        "cash_value": False,
        "rewards": list(REWARDS),
        "duplicate_reward": "xp_250",
        "premium_slots_total": PREMIUM_CAP,
    }


async def _premium_claims_count(db: AsyncSession) -> int:
    return (await db.execute(select(func.count(XpTransaction.id)).where(
        XpTransaction.reason == "engagement_box_claim",
        XpTransaction.reference_id == f"{CAMPAIGN_ID}:premium_1m",
    ))).scalar_one()


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
            or_(
                # Honor the published free-practice promise as well as existing
                # enrolled players' human-match progress. No new money reward.
                and_(GameHistory.bid_amount == 0, GameHistory.game_type.in_(["online", "computer"])),
                and_(GameHistory.white_player_id > 0, GameHistory.black_player_id > 0,
                     GameHistory.game_type == "online"),
            ),
            GameHistory.total_moves >= MIN_PLIES,
            GameHistory.result_type.in_(["checkmate", "resignation", "timeout", "draw"]),
            GameHistory.created_at >= enrolled.created_at,
            GameHistory.ended_at >= enrolled.created_at,
        ))).scalar_one())
    premium_claimed = await _premium_claims_count(db)
    is_platinum = (premium_claimed < PREMIUM_CAP) or (receipt is not None and receipt.reference_id.endswith(":premium_1m"))
    return {
        **catalog(),
        "enabled": bool(enrolled) or get_settings().ENGAGEMENT_CAMPAIGN_ENABLED,
        "enrolled": bool(enrolled),
        "progress": progress,
        "state": "claimed" if receipt else "claimable" if progress == TARGET else "active" if enrolled else "available",
        "reward_key": receipt.reference_id.split(":", 1)[1] if receipt else None,
        "premium_slots_total": PREMIUM_CAP,
        "premium_slots_claimed": premium_claimed,
        "premium_slots_remaining": max(0, PREMIUM_CAP - premium_claimed),
        "is_platinum_tier": is_platinum,
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


def draw_reward(premium_claimed: int = PREMIUM_CAP):
    if premium_claimed < PREMIUM_CAP:
        return "premium_1m"
    roll = secrets.randbelow(100)
    cursor = 0
    for reward in REWARDS:
        cursor += reward["probability_percent"]
        if roll < cursor:
            return reward["key"]
    return "xp_250"


async def claim(db: AsyncSession, user: User):
    user = await _locked_user(db, user)
    previous = await _receipt(db, user)
    if previous:
        return await status(db, user)  # retries return the same outcome
    before = await status(db, user)
    if before["state"] != "claimable":
        raise CampaignError("Complete three qualifying matches after joining")
    
    premium_claimed = await _premium_claims_count(db)
    try:
        key = draw_reward(premium_claimed)
    except TypeError:
        key = draw_reward()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if key == "premium_1m":
        current_expiry = user.premium_expires_at
        active = user.is_premium_active and current_expiry and current_expiry > now
        user.is_premium = True
        user.premium_tier = "premium"
        user.premium_billing_period = "monthly"
        user.premium_expires_at = (current_expiry if active else now) + timedelta(days=30)

        # Unlock Platinum profile border
        items = json.loads(user.unlocked_items or "[]")
        if isinstance(items, list) and "border_platinum" not in items:
            user.unlocked_items = json.dumps([*items, "border_platinum"])

        await GamificationService.add_xp(db, user, 500, trigger_kickback=False,
                                        apply_booster=False, commit=False,
                                        reason="engagement_reward", reference_id=CAMPAIGN_ID)
    elif key == "border_gold":
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
