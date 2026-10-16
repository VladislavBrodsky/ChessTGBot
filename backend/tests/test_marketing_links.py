"""Content links (mk_<channel>_<post>) record first-touch source and land on Home."""
from datetime import timedelta
import hashlib
import hmac
import json
import time
from types import SimpleNamespace
from unittest.mock import AsyncMock
from urllib.parse import quote

import pytest
from fastapi import HTTPException
from sqlalchemy import func, select

from app.core.config import get_settings
from app.models.friend_invite import PlayerLaunchIntent
from app.models.gamification import Referral
from app.models.player_tracking import PlayerAcquisition
from app.models.user import User
from app.services import friend_invites as invites
from app.services import player_tracking

pytestmark = pytest.mark.asyncio
LINK = 'mk_tg_2026_10_14_tg_community'


def signed_init_data(uid, start_param):
    user = json.dumps({'id': uid, 'first_name': 'Reader'})
    auth_date = str(int(time.time()))
    check = '\n'.join([f'auth_date={auth_date}', f'start_param={start_param}', f'user={user}'])
    secret = hmac.new(b'WebAppData', get_settings().TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
    digest = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return f'auth_date={auth_date}&start_param={start_param}&user={quote(user)}&hash={digest}'


async def test_marketing_campaign_accepts_only_wellformed_content_codes():
    assert player_tracking.marketing_campaign(LINK) == LINK
    assert player_tracking.marketing_campaign('mk_TG_Post-1') == 'mk_tg_post-1'
    assert player_tracking.marketing_campaign('mk_' + 'a' * 61) == 'mk_' + 'a' * 61
    for parameter in ('', None, 'mk_', 'mk_a.b', 'mk_' + 'a' * 62, 'ref_friend', 'go_' + 'a' * 20):
        assert player_tracking.marketing_campaign(parameter) is None


async def test_signed_signup_records_content_source_and_not_a_referral(client, db_session):
    response = await client.post('/api/v1/users/sync', headers={'X-Telegram-Init-Data': signed_init_data(540001, LINK)})
    assert response.status_code == 200
    acquired = await db_session.get(PlayerAcquisition, 540001)
    assert acquired.campaign == LINK and acquired.inviter_id is None
    assert (await db_session.execute(select(func.count()).select_from(Referral))).scalar_one() == 0
    # Content links never become a recoverable invitation in the inbox.
    assert await db_session.get(PlayerLaunchIntent, 540001) is None


async def test_preview_routes_home_and_keeps_the_first_source(db_session):
    now = player_tracking.utcnow()
    new = User(telegram_id=540011, first_name='New', created_at=now)
    old = User(telegram_id=540012, first_name='Existing', created_at=now - timedelta(days=30))
    db_session.add_all([new, old]); await db_session.commit()

    assert await invites.preview(db_session, new, LINK) == {'kind': 'route', 'destination': 'home'}
    assert await invites.preview(db_session, new, 'mk_x_2026_10_15_x_1') == {'kind': 'route', 'destination': 'home'}
    assert await invites.preview(db_session, old, LINK) == {'kind': 'route', 'destination': 'home'}
    await db_session.commit()

    assert (await db_session.get(PlayerAcquisition, 540011)).campaign == LINK
    assert await db_session.get(PlayerAcquisition, 540012) is None
    with pytest.raises(HTTPException) as error:
        await invites.preview(db_session, new, 'mk_')
    assert error.value.status_code == 404


async def test_bot_start_records_new_player_from_content_link_only(db_session, monkeypatch):
    from app.services.telegram_bot import TelegramService
    import app.core.database as database

    class Borrowed:
        async def __aenter__(self): return db_session
        async def __aexit__(self, *args): pass
    monkeypatch.setattr(database, 'AsyncSessionLocal', Borrowed)
    old = User(telegram_id=540022, first_name='Existing', referral_code='existing22',
               created_at=player_tracking.utcnow() - timedelta(days=30))
    db_session.add(old); await db_session.commit()

    for uid in (540021, 540022):
        context = SimpleNamespace(args=[LINK], bot=SimpleNamespace(set_chat_menu_button=AsyncMock()))
        update = SimpleNamespace(effective_user=SimpleNamespace(id=uid, first_name='Reader', last_name=None, username=None, language_code='en'),
                                 message=SimpleNamespace(reply_text=AsyncMock()))
        await TelegramService.start_command(update, context)
        assert f'startapp={LINK}' in json.dumps(update.message.reply_text.call_args.kwargs['reply_markup'].to_dict())

    assert (await db_session.get(PlayerAcquisition, 540021)).campaign == LINK
    assert await db_session.get(PlayerAcquisition, 540022) is None
