"""Exact, once-per-source GRAM reward credits. USDT is never changed here."""
import asyncio
import html
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.models.gram_reward import GramReward
from app.models.user import User

logger = logging.getLogger(__name__)
NANO_GRAM = 1_000_000_000

TASK_REWARDS = {
    "daily_login": 100_000_000,
    "daily_win": 300_000_000,
    "daily_play": 300_000_000,
    "daily_play_human": 200_000_000,
    "ach_first_win": 300_000_000,
    "ach_win_10": 600_000_000,
    "ach_play_25": 800_000_000,
    "join_channel": 500_000_000,
    "join_chat": 200_000_000,
    "add_to_home_screen": 100_000_000,
}


def task_reward_nano(task):
    from app.models.gamification import TaskType
    # Every qualifying referred friend earns 1 GRAM automatically. Invite
    # achievements must not pay that same per-friend reward a second time.
    if task.task_type == TaskType.REFER:
        return 0
    if task.title_key in TASK_REWARDS:
        return TASK_REWARDS[task.title_key]
    xp = max(0, int(task.xp_reward or 0))
    return (100_000_000 if xp <= 50 else 200_000_000 if xp <= 100 else 300_000_000 if xp <= 200 else 500_000_000 if xp <= 500 else NANO_GRAM)


def format_gram(amount_nano):
    whole, fraction = divmod(amount_nano, NANO_GRAM)
    return str(whole) + ("." + f"{fraction:09d}".rstrip("0") if fraction else "")


async def earned_gram_nano(db, user_id):
    result = await db.execute(select(func.coalesce(func.sum(GramReward.amount_nano), 0)).where(GramReward.user_id == user_id))
    return int(result.scalar_one())


async def credit_reward(db, user, amount_nano, source_key, source_kind, text):
    """Caller owns its transaction and user lock. Unique keys also guard retries.

    The immutable ledger is the balance source, so stale ORM objects cannot
    overwrite another credit. Savepoint failure never partially credits money.
    """
    if not 100_000_000 <= amount_nano <= NANO_GRAM:
        raise ValueError("GRAM reward outside the configured 0.1–1 range")
    # SQLite legacy transaction mode does not BEGIN on SELECT. Start its
    # outer transaction explicitly so a released savepoint cannot mint a
    # credit that survives a later XP/game rollback. Postgres already does.
    if db.bind.dialect.name == "sqlite":
        connection = await db.connection()
        raw = await connection.get_raw_connection()
        if not raw.driver_connection.in_transaction:
            from sqlalchemy import text as sql_text
            await db.execute(sql_text("BEGIN"))
    try:
        async with db.begin_nested():
            db.add(GramReward(user_id=user.id, amount_nano=amount_nano, source_key=source_key,
                              source_kind=source_kind, notification_text=text))
            await db.flush()
        return True
    except IntegrityError:
        # Do not swallow unrelated foreign-key/check failures as duplicates.
        existing = (await db.execute(select(GramReward).where(GramReward.source_key == source_key))).scalar_one_or_none()
        if existing is None:
            raise
        if existing.user_id != user.id or existing.amount_nano != amount_nano or existing.source_kind != source_kind:
            raise ValueError("GRAM reward source collision")
        return False


def task_notification(amount):
    return f"♟️ <b>Task reward earned</b>\n\n<b>+{format_gram(amount)} GRAM</b> added to your GRAM rewards balance.\n\nOpen Task Center to see your next challenge."


def referral_notification(user):
    name = html.escape(f"{user.first_name or 'Your friend'} {user.last_name or ''}".strip()[:100])
    return f"♟️ <b>Referral reward earned</b>\n\n{name} deposited USDT and completed 3 qualifying wager matches.\n<b>+1 GRAM</b> added to your GRAM rewards balance.\n\nInvite another eligible friend to reach the next milestone."


async def verify_channel_membership(telegram_id, title_key):
    """Monetary rewards never use the previous no-token/SQLite bypass."""
    from app.services.telegram_bot import TelegramService
    from telegram import Bot
    chats = {"join_channel": "@chess_hub", "join_chat": "@chesshub_chat"}
    if title_key not in chats:
        return False
    settings = get_settings()
    if not settings.TELEGRAM_BOT_TOKEN or settings.TELEGRAM_BOT_TOKEN == "123456789:test_token":
        raise RuntimeError("Membership verification unavailable")
    if TelegramService.application:
        member = await TelegramService.application.bot.get_chat_member(chat_id=chats[title_key], user_id=telegram_id)
    else:
        async with Bot(settings.TELEGRAM_BOT_TOKEN) as bot:
            member = await bot.get_chat_member(chat_id=chats[title_key], user_id=telegram_id)
    return member.status in {"member", "administrator", "creator"} or (member.status == "restricted" and member.is_member is True)


async def dispatch_notifications(limit=10):
    """Deliver only committed credits, with a lease shared by every worker.

    An expired lease or ambiguous network timeout is marked delivery_unknown,
    never blindly resent. The credit itself is still exactly once.
    """
    from app.services.telegram_bot import TelegramService
    from telegram.error import Forbidden, NetworkError, RetryAfter
    settings = get_settings()
    if not settings.TELEGRAM_BOT_TOKEN or settings.TELEGRAM_BOT_TOKEN == "123456789:test_token":
        return 0
    if not TelegramService.application:
        return 0  # Wait for the shared bot lifecycle; do not leak fallback clients.
    bot = TelegramService.application.bot
    delivered = 0
    for _ in range(limit):
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        async with AsyncSessionLocal() as db:
            await db.execute(update(GramReward).where(GramReward.notification_status == "processing", GramReward.notification_lease_until < now).values(notification_status="delivery_unknown"))
            result = await db.execute(select(GramReward).where(
                GramReward.notification_status == "pending",
                (GramReward.notification_lease_until.is_(None) | (GramReward.notification_lease_until <= now)),
            ).order_by(GramReward.id).limit(1).with_for_update(skip_locked=True))
            entry = result.scalar_one_or_none()
            if entry is None:
                await db.commit()
                break
            user = await db.get(User, entry.user_id)
            if user is None or user.is_blocked:
                entry.notification_status = "blocked"
                await db.commit()
                continue
            entry.notification_status = "processing"
            entry.notification_attempts += 1
            entry.notification_lease_until = now + timedelta(seconds=90)
            entry_id, telegram_id, text = entry.id, user.telegram_id, entry.notification_text
            await db.commit()
        status, message_id, retry_at = "failed", None, None
        try:
            message = await bot.send_message(chat_id=telegram_id, text=text, parse_mode="HTML")
            status, message_id = "sent", message.message_id
            delivered += 1
        except RetryAfter as exc:
            delay = exc.retry_after.total_seconds() if isinstance(exc.retry_after, timedelta) else exc.retry_after
            status, retry_at = "pending", datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(seconds=max(1, delay))
        except Forbidden:
            status = "blocked"
        except NetworkError:
            status = "delivery_unknown"
            logger.warning("GRAM reward notification delivery unknown for credit %s", entry_id)
        except Exception as exc:
            logger.warning("GRAM reward notification failed for credit %s (%s)", entry_id, type(exc).__name__)
        async with AsyncSessionLocal() as db:
            await db.execute(update(GramReward).where(GramReward.id == entry_id, GramReward.notification_status == "processing").values(
                notification_status=status, notification_message_id=message_id, notification_lease_until=retry_at))
            await db.commit()
    return delivered


async def start_gram_reward_notifications():
    while True:
        try:
            await dispatch_notifications()
        except Exception:
            logger.exception("GRAM reward notification worker failed")
        await asyncio.sleep(5)



async def dispatch_referral_notifications(db):
    """Legacy USDT/XP notices run only after the game transaction commits."""
    from app.services.telegram_bot import TelegramService
    for telegram_id, text in db.info.pop("referral_notifications", []):
        try:
            await TelegramService.send_notification(telegram_id, text)
        except Exception:
            logger.warning("Legacy referral notification unavailable for user %s", telegram_id)


async def check_referral_after_deposit(db, user_id):
    """Run after the deposit commits; reward failure cannot undo a real top-up."""
    from app.services.gamification_service import GamificationService
    try:
        await GamificationService.check_referral_game_milestone(db, user_id)
        await db.commit()
        await dispatch_referral_notifications(db)
    except Exception:
        await db.rollback()
        logger.exception("GRAM referral qualification unavailable after deposit for user %s", user_id)
