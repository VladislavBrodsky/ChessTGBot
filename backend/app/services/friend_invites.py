"""Explicit free friend requests, durable inbox and lost-launch recovery."""
import asyncio
from contextvars import Context
from datetime import timedelta
import html
import logging
import secrets
import time
import uuid
from types import SimpleNamespace
from weakref import WeakValueDictionary

from fastapi import HTTPException
from sqlalchemy import or_, select, update
from app.core.coordination import shared_lock
from app.models.friend_invite import FriendInvite, PlayerLaunchIntent
from app.models.user import User
from app.services.mini_app_links import START_RE, app_link, web_app_link, is_invite_parameter
from app.services.player_tracking import utcnow, attribute_launch, reserve_delivery
from app.services.game_service import GameService

logger = logging.getLogger(__name__)
_local_locks = WeakValueDictionary()


def fail(code, status=409):
    raise HTTPException(status_code=status, detail={"code": code})


def identity(user):
    return {"name": " ".join(filter(None, [user.first_name, user.last_name])) or "Chess player", "elo": user.elo}


async def remember_launch(db, user, parameter, version=None):
    if not is_invite_parameter(parameter):
        return
    # A reusable referral link is an acquisition route, not a personal game
    # request. Attribute it without saving it in the invitation inbox; otherwise
    # every public visitor can create a request against the referral owner.
    if parameter.startswith('ref_'):
        host = (await db.execute(select(User).where(User.referral_code == parameter[4:]))).scalar_one_or_none()
        if host:
            import hashlib
            await attribute_launch(db, user, SimpleNamespace(inviter_id=host.telegram_id, campaign='friend_referral',
                token=hashlib.sha256(parameter.encode()).hexdigest()[:32]))
        return
    # A replayed signed session must not overwrite a newer bot/browser intent.
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert
    dialect = getattr(getattr(db, 'bind', None), 'dialect', None)
    is_pg = dialect and getattr(dialect, 'name', '') == 'postgresql'
    statement = (pg_insert if is_pg else sqlite_insert)(PlayerLaunchIntent).values(
        user_id=user.telegram_id, parameter=parameter, version=version if version is not None else time.time_ns() // 1000,
        dismissed='0', expires_at=utcnow() + timedelta(days=1))
    await db.execute(statement.on_conflict_do_update(index_elements=['user_id'], set_={
        'parameter': statement.excluded.parameter, 'version': statement.excluded.version,
        'dismissed': '0', 'expires_at': statement.excluded.expires_at,
    }, where=statement.excluded.version > PlayerLaunchIntent.version))


async def dismiss_launch(db, user_id, parameter):
    await db.execute(update(PlayerLaunchIntent).where(PlayerLaunchIntent.user_id == user_id,
        PlayerLaunchIntent.parameter == parameter).values(dismissed='1'))
    await db.commit()


async def host_for_code(db, code):
    if not code.startswith('ref_') or not START_RE.fullmatch(code):
        fail('invalid_invitation', 404)
    host = (await db.execute(select(User).where(User.referral_code == code[4:]))).scalar_one_or_none()
    if not host:
        fail('invalid_invitation', 404)
    return host


async def invitation_view(db, invitation, user, opponents=None):
    if user.telegram_id not in (invitation.host_id, invitation.guest_id):
        fail('invalid_invitation', 404)
    state = None
    if invitation.status in ('pending', 'ready'):
        state = await GameService().session_manager.get_game(invitation.game_id)
        if state and not state.is_game_over and {state.white_player_id, state.black_player_id} == {invitation.host_id, invitation.guest_id}:
            invitation.status, invitation.pending_pair = 'ready', None
        elif invitation.expires_at <= utcnow() or (invitation.status == 'ready' and (not state or state.is_game_over)):
            invitation.status, invitation.pending_pair = 'expired', None
    other_id = invitation.guest_id if user.telegram_id == invitation.host_id else invitation.host_id
    other = opponents.get(other_id) if opponents is not None else (await db.execute(select(User).where(User.telegram_id == other_id))).scalar_one_or_none()
    return {"kind": "request", "id": invitation.id, "status": invitation.status,
        "role": "host" if user.telegram_id == invitation.host_id else "guest", "opponent": identity(other) if other else {"name": "Chess player", "elo": None},
        "game_id": invitation.game_id if invitation.status == 'ready' else None,
        "expires_at": invitation.expires_at.isoformat() + 'Z', "free": True, "time_control": 600,
        "url": app_link('fi_' + invitation.id)}


async def preview(db, user, parameter):
    if not START_RE.fullmatch(parameter):
        fail('invalid_invitation', 404)
    if parameter in {"arena", "academy", "practice", "marketplace", "box", "home"}:
        dest_map = {
            "arena": "arena",
            "academy": "academy",
            "practice": "practice",
            "marketplace": "marketplace",
            "box": "marketplace",
            "home": "home",
        }
        return {"kind": "route", "destination": dest_map[parameter]}
    if parameter.startswith('mk_'):
        # Content links label first-touch source; selected website links keep
        # their relevant destination without becoming an invitation or reward.
        from app.services.player_tracking import attribute_marketing, marketing_campaign
        if not marketing_campaign(parameter):
            fail('invalid_invitation', 404)
        await attribute_marketing(db, user, parameter)
        destination = {
            'mk_web_play_arena': 'arena',
            'mk_web_academy': 'academy',
        }.get(parameter.lower(), 'home')
        return {"kind": "route", "destination": destination}
    if parameter.startswith('ref_'):
        await host_for_code(db, parameter)
        return {"kind": "route", "destination": "practice"}
    if parameter.startswith('fi_'):
        row = await db.get(FriendInvite, parameter[3:])
        if not row:
            fail('invalid_invitation', 404)
        return await invitation_view(db, row, user)
    if parameter.startswith('go_'):
        from app.services.player_tracking import resolve_launch
        launch = await resolve_launch(db, parameter[3:])
        if not launch:
            fail('expired_invitation', 410)
        await attribute_launch(db, user, launch)
        if launch.destination != 'game':
            return {"kind": "route", "destination": launch.destination}
        game_id = launch.game_id
    else:
        import re
        if not re.fullmatch(r'(?:[a-f0-9]{8}|[a-f0-9]{32}|(?:match_|arena\d+_)[A-Za-z0-9_-]+)', parameter):
            fail('invalid_invitation', 404)
        game_id = parameter
    state = await GameService().session_manager.get_game(game_id)
    if not state or state.is_game_over:
        fail('expired_invitation', 410)
    member = user.telegram_id in (state.white_player_id, state.black_player_id)
    if not member and state.white_player_id and state.black_player_id:
        fail('invitation_full')
    host_id = state.white_player_id or state.black_player_id
    host = (await db.execute(select(User).where(User.telegram_id == host_id))).scalar_one_or_none()
    return {"kind": "game", "game_id": game_id, "opponent": identity(host) if host else {"name": "Chess player", "elo": None},
        "member": member, "free": state.bid_amount == 0, "wager": state.bid_amount,
        "time_control": state.time_control_seconds, "parameter": parameter}


async def inbox(db, user):
    intent = await db.get(PlayerLaunchIntent, user.telegram_id)
    rows = (await db.execute(select(FriendInvite).where(or_(FriendInvite.host_id == user.telegram_id,
        FriendInvite.guest_id == user.telegram_id), FriendInvite.created_at > utcnow() - timedelta(days=2))
        .order_by(FriendInvite.created_at.desc()).limit(20))).scalars().all()
    other_ids = {row.guest_id if row.host_id == user.telegram_id else row.host_id for row in rows}
    # One bounded profile query instead of one query per saved invitation.
    opponents = {other.telegram_id: other for other in (await db.execute(select(User).where(User.telegram_id.in_(other_ids)))).scalars().all()} if other_ids else {}
    items = [await invitation_view(db, row, user, opponents) for row in rows]
    await db.commit()
    return {"launch": intent.parameter if intent and intent.dismissed == '0' and intent.expires_at > utcnow() else None,
            "invitations": items}


def pair_lock(sm, a, b):
    key = f"lock:friend-pair:{min(a, b)}:{max(a, b)}"
    return shared_lock(sm.redis, key, use_memory=sm._use_memory,
        local_lock=_local_locks.setdefault(key, asyncio.Lock()))


async def request_game(db, user, code):
    host = await host_for_code(db, code)
    if host.telegram_id == user.telegram_id:
        fail('self_invitation')
    sm = GameService().session_manager
    async with pair_lock(sm, host.telegram_id, user.telegram_id):
        pair = f"{min(host.telegram_id, user.telegram_id)}:{max(host.telegram_id, user.telegram_id)}"
        row = (await db.execute(select(FriendInvite).where(FriendInvite.pending_pair == pair))).scalar_one_or_none()
        if row and row.expires_at > utcnow():
            return await invitation_view(db, row, user)
        if row:
            row.pending_pair, row.status = None, 'expired'
            await db.flush()
        # A pair can only have one live game. Reuse a confirmed existing invite.
        recent = (await db.execute(select(FriendInvite).where(or_(FriendInvite.host_id == user.telegram_id,
            FriendInvite.guest_id == user.telegram_id), or_(FriendInvite.host_id == host.telegram_id,
            FriendInvite.guest_id == host.telegram_id)).order_by(FriendInvite.created_at.desc()).limit(1))).scalar_one_or_none()
        if recent:
            view = await invitation_view(db, recent, user)
            if view['status'] == 'ready':
                return view
            if recent.created_at > utcnow() - timedelta(seconds=60):
                fail('invite_cooldown', 429)
        now = utcnow()
        row = FriendInvite(id=secrets.token_urlsafe(18), host_id=host.telegram_id, guest_id=user.telegram_id,
            pending_pair=pair, status='pending', game_id=uuid.uuid4().hex, created_at=now, expires_at=now + timedelta(days=1))
        db.add(row)
        await db.commit()
        await dismiss_launch(db, user.telegram_id, code)
        result = await invitation_view(db, row, user)
    queue_notice(row.id, host.telegram_id, user.telegram_id, 'request')
    return result


async def respond(db, user, invite_id, action):
    row = await db.get(FriendInvite, invite_id)
    if not row or user.telegram_id not in (row.host_id, row.guest_id):
        fail('invalid_invitation', 404)
    service = GameService()
    async with pair_lock(service.session_manager, row.host_id, row.guest_id):
        await db.refresh(row, with_for_update=True)
        view = await invitation_view(db, row, user)
        if row.status != 'pending':
            await db.commit()
            return view
        if action == 'accept':
            if user.telegram_id != row.host_id:
                fail('invalid_action', 403)
            for uid in (row.host_id, row.guest_id):
                active = await service.get_active_game_for_user(uid)
                if active and active != row.game_id:
                    fail('player_busy')
            state = await service.session_manager.get_game(row.game_id)
            if not state:
                state = await service.create_game(row.game_id, time_control_seconds=600, bid_amount=0)
            if state.is_game_over:
                fail('expired_invitation', 410)
            host = (await db.execute(select(User).where(User.telegram_id == row.host_id))).scalar_one()
            guest = (await db.execute(select(User).where(User.telegram_id == row.guest_id))).scalar_one()
            state.white_player_id, state.black_player_id = row.host_id, row.guest_id
            state.white_username, state.black_username = host.first_name, guest.first_name
            state.white_elo, state.black_elo = host.elo, guest.elo
            state.matched_at, state.first_move_grace_seconds = time.time(), 180
            await service.session_manager.save_game(row.game_id, state)
            row.status = 'ready'
        elif action == 'decline' and user.telegram_id == row.host_id:
            row.status = 'declined'
        elif action == 'cancel' and user.telegram_id == row.guest_id:
            row.status = 'cancelled'
        else:
            fail('invalid_action', 403)
        row.pending_pair = None
        await db.commit()
        if action == 'accept':
            service.start_abort_monitor(row.game_id, 0, 180, 'w')
        result = await invitation_view(db, row, user)
    queue_notice(row.id, row.guest_id, row.host_id, 'ready' if action == 'accept' else 'updated')
    return result


_tasks = set()


def queue_notice(invite_id, recipient, actor, event):
    task = asyncio.create_task(send_notice(invite_id, recipient, actor, event), context=Context())
    _tasks.add(task)
    task.add_done_callback(_tasks.discard)


async def send_notice(invite_id, recipient, actor, event):
    from app.core.database import AsyncSessionLocal
    from app.core.socket import sio
    try:
        await sio.emit('friend_invites_updated', {}, room=f'user:{recipient}')
        await sio.emit('friend_invites_updated', {}, room=f'user:{actor}')
    except Exception:
        logger.warning('Friend invitation realtime hint delayed; persistent inbox remains available')
    if event == 'updated':
        return
    try:
        from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
        from app.services.telegram_bot import TelegramService
        async with AsyncSessionLocal() as db:
            who = (await db.execute(select(User).where(User.telegram_id == actor))).scalar_one_or_none()
            target = (await db.execute(select(User).where(User.telegram_id == recipient))).scalar_one_or_none()
            if not who or not target or not await reserve_delivery(db, f'friend-{event}:{invite_id}', recipient):
                return
            name = html.escape(identity(who)['name'])
            from app.services.invitation_copy import invitation_copy
            copy = invitation_copy(target.preferred_language)
            message = '♟ ' + copy[4 if event == 'request' else 5].format(name=f'<b>{name}</b>')
            message += '\n\n' + copy[6]
            keyboard = InlineKeyboardMarkup([[InlineKeyboardButton(copy[3],
                web_app=WebAppInfo(url=web_app_link('fi_' + invite_id, target.preferred_language or 'en')))]] )
        await TelegramService.send_notification(recipient, message, reply_markup=keyboard)
    except Exception:
        logger.warning('Friend invitation bot notice unavailable; persistent inbox remains available', exc_info=True)
