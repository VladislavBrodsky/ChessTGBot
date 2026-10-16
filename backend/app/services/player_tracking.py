import asyncio
import logging
import re
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select, func
from app.core.database import AsyncSessionLocal
from app.models.player_tracking import LaunchToken, PlayerActivity, PlayerAcquisition, CampaignDelivery

logger = logging.getLogger(__name__)
PENDING_ACTIVITY = "gameplay:pending_days"
TOKEN_RE = re.compile(r"^[A-Za-z0-9_-]{16,48}$")
CAMPAIGN_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,63}$")
# Public content links (mk_<channel>_<post>) written by marketing/content-ops.
MARKETING_RE = re.compile(r"^mk_[A-Za-z0-9_-]{1,61}$")


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def insert_once(db, model, values, columns):
    if db.bind.dialect.name == "postgresql":
        from sqlalchemy.dialects.postgresql import insert
    else:
        from sqlalchemy.dialects.sqlite import insert
    statement = insert(model).values(**values).on_conflict_do_nothing(index_elements=columns)
    result = await db.execute(statement)
    return result.rowcount == 1


async def create_launch(db, *, destination="home", game_id=None, campaign="community", inviter_id=None):
    if destination not in {"home", "game", "practice", "academy", "arena"}:
        raise ValueError("Unknown launch destination")
    if destination == "game" and not game_id:
        raise ValueError("Game destination requires a game")
    if not CAMPAIGN_RE.fullmatch(campaign):
        raise ValueError("Invalid campaign")
    launch = LaunchToken(token=secrets.token_urlsafe(18), destination=destination,
                         game_id=game_id, campaign=campaign, inviter_id=inviter_id,
                         expires_at=utcnow() + timedelta(days=30))
    db.add(launch)
    await db.flush()
    return launch


async def resolve_launch(db, token):
    if not TOKEN_RE.fullmatch(token):
        return None
    return (await db.execute(select(LaunchToken).where(
        LaunchToken.token == token, LaunchToken.expires_at > utcnow()
    ))).scalar_one_or_none()


async def attribute_launch(db, user, launch):
    # Existing players may follow links, but never become new acquired players.
    # Signed start_param is handled during registration; browser fallback has a
    # short grace period after the authenticated account was created.
    created = user.created_at
    if created and created.tzinfo:
        created = created.astimezone(timezone.utc).replace(tzinfo=None)
    if not created or utcnow() - created > timedelta(minutes=10):
        return False
    if user.telegram_id == launch.inviter_id:
        return False
    return await insert_once(db, PlayerAcquisition, {
        "user_id": user.telegram_id, "campaign": launch.campaign,
        "inviter_id": launch.inviter_id, "token": launch.token, "created_at": utcnow(),
    }, ["user_id"])


def marketing_campaign(parameter):
    """Campaign name for an mk_ content link, or None when it is not one.

    mk_ codes are public and unregistered, so they only label first-touch
    source. They never carry an inviter, a reward or a game.
    """
    if not parameter or not MARKETING_RE.fullmatch(parameter):
        return None
    campaign = parameter.lower()
    return campaign if CAMPAIGN_RE.fullmatch(campaign) else None


async def attribute_marketing(db, user, parameter):
    campaign = marketing_campaign(parameter)
    if not campaign:
        return False
    import hashlib
    from types import SimpleNamespace
    return await attribute_launch(db, user, SimpleNamespace(campaign=campaign, inviter_id=None,
        token=hashlib.sha256(campaign.encode()).hexdigest()[:32]))


async def flush_activity(client, *, limit=1000):
    """Redis outbox is written atomically with an accepted move, then persisted.

    Do not remove entries until the SQL commit succeeds. Duplicate workers or
    a crash after commit are harmless under the unique player/day constraint.
    """
    pending = await client.srandmember(PENDING_ACTIVITY, limit)
    if not pending:
        return 0
    async with AsyncSessionLocal() as db:
        for raw in pending:
            value = raw.decode() if isinstance(raw, bytes) else raw
            day_text, uid_text = value.split(":", 1)
            from datetime import date
            await insert_once(db, PlayerActivity, {
                "day": date.fromisoformat(day_text), "user_id": int(uid_text),
                "recorded_at": utcnow(),
            }, ["day", "user_id"])
        await db.commit()
    await client.srem(PENDING_ACTIVITY, *pending)
    return len(pending)


async def start_player_tracking_loop():
    from app.services.session_manager import SessionManager
    last_pruned = None
    while True:
        try:
            sm = SessionManager()
            if sm.redis and not sm._use_memory:
                await flush_activity(sm.redis)
                today = utcnow().date()
                if last_pruned != today:
                    async with AsyncSessionLocal() as db:
                        from app.models.friend_invite import FriendInvite, PlayerLaunchIntent
                        await db.execute(delete(LaunchToken).where(LaunchToken.expires_at < utcnow()))
                        await db.execute(delete(PlayerLaunchIntent).where(PlayerLaunchIntent.expires_at < utcnow()))
                        await db.execute(delete(FriendInvite).where(FriendInvite.created_at < utcnow() - timedelta(days=30)))
                        await db.commit()
                    last_pruned = today
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Gameplay activity persistence delayed; pending facts retained")
        await asyncio.sleep(5)


async def gameplay_counts(db, today=None):
    today = today or utcnow().date()
    from app.core.config import get_settings
    excluded = get_settings().admin_telegram_ids or {-1}
    counts = {}
    for label, days in (("dau", 1), ("wau", 7), ("mau", 30)):
        counts[label] = int((await db.execute(select(func.count(func.distinct(PlayerActivity.user_id))).where(
            PlayerActivity.day >= today - timedelta(days=days - 1), PlayerActivity.day <= today,
            PlayerActivity.user_id > 0, PlayerActivity.user_id.not_in(excluded),
        ))).scalar_one())
    counts["basis"] = "server_accepted_moves_utc_calendar_days"
    first = (await db.execute(select(func.min(PlayerActivity.day)).where(
        PlayerActivity.user_id > 0, PlayerActivity.user_id.not_in(excluded),
    ))).scalar_one()
    counts["coverage_start"] = first.isoformat() if first else None
    return counts


async def reserve_delivery(db, campaign, user_id):
    reserved = await insert_once(db, CampaignDelivery, {
        "campaign": campaign, "user_id": user_id, "created_at": utcnow(), "status": "reserved",
    }, ["campaign", "user_id"])
    await db.commit()
    return reserved


async def pilot_metrics(db):
    from sqlalchemy import case, exists
    today = utcnow().date()
    data = await gameplay_counts(db, today)
    from app.core.config import get_settings
    excluded = get_settings().admin_telegram_ids or {-1}
    first = select(PlayerActivity.user_id, func.min(PlayerActivity.day).label("first_day")).where(PlayerActivity.user_id > 0, PlayerActivity.user_id.not_in(excluded)).group_by(PlayerActivity.user_id).subquery()
    retention = {}
    for days in (1, 7, 30):
        target = first.c.first_day + days if db.bind.dialect.name == "postgresql" else func.date(first.c.first_day, f"+{days} days")
        returned = exists(select(PlayerActivity.id).where(PlayerActivity.user_id == first.c.user_id, PlayerActivity.day == target))
        statement = select(func.count(), func.sum(case((returned, 1), else_=0))).select_from(first).where(first.c.first_day <= today - timedelta(days=days))
        result = (await db.execute(statement)).one()
        eligible, count = int(result[0] or 0), int(result[1] or 0)
        retention[f"d{days}"] = {"eligible": eligible, "returned": count, "rate": round(count / eligible, 4) if eligible else None}
    sources = []
    source_rows = (await db.execute(select(PlayerAcquisition.campaign, func.count()).where(PlayerAcquisition.user_id > 0, PlayerAcquisition.user_id.not_in(excluded)).group_by(PlayerAcquisition.campaign))).all()
    for campaign, registrations in source_rows:
        activated = (await db.execute(select(func.count()).select_from(PlayerAcquisition).where(
            PlayerAcquisition.campaign == campaign, PlayerAcquisition.user_id > 0, PlayerAcquisition.user_id.not_in(excluded),
            exists(select(PlayerActivity.id).where(PlayerActivity.user_id == PlayerAcquisition.user_id)),
        ))).scalar_one()
        sources.append({"campaign": campaign, "registrations": registrations, "players": int(activated)})
    data.update({"retention": retention, "sources": sources, "generated_at": utcnow().isoformat() + "Z",
                 "activation_basis": "at_least_one_server_accepted_move",
                 "unattributed_players": int((await db.execute(select(func.count()).select_from(first).where(~exists(select(PlayerAcquisition.user_id).where(PlayerAcquisition.user_id == first.c.user_id))))).scalar_one())})
    return data
