"""Returning-player links, recovery, consent and free challenge invariants."""
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
import pytest
import pytest_asyncio
from fastapi import HTTPException
from sqlalchemy import select
from app.models.user import User
from app.models.friend_invite import FriendInvite, PlayerLaunchIntent
from app.services import friend_invites as invites
from app.services.game_service import GameService
from app.services.session_manager import SessionManager
from app.services.mini_app_links import app_link, web_app_link

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def people(db_session, monkeypatch):
    monkeypatch.setattr(invites, 'queue_notice', Mock())
    monkeypatch.setattr(GameService, 'start_abort_monitor', Mock())
    monkeypatch.setattr(SessionManager, '_use_memory', True)
    monkeypatch.setattr(SessionManager, '_memory_store', {})
    host = User(telegram_id=520001, first_name='Host <&>', referral_code='friendhost', elo=1400)
    guest = User(telegram_id=520002, first_name='Guest', referral_code='friendguest', elo=1100)
    other = User(telegram_id=520003, first_name='Other', referral_code='other', elo=1000)
    db_session.add_all([host, guest, other]); await db_session.commit()
    return host, guest, other


async def test_main_app_links_and_named_referral_for_existing_player(db_session, people):
    host, guest, _ = people
    view = await invites.preview(db_session, guest, 'ref_friendhost')
    assert view['opponent']['name'] == 'Host <&>' and view['free']
    assert (await invites.preview(db_session, host, 'ref_friendhost'))['self']
    assert '?startapp=ref_friendhost' in app_link('ref_friendhost')
    assert '/app?' not in app_link('ref_friendhost')
    assert '/ru/home?startapp=ref_friendhost' in web_app_link('ref_friendhost', 'ru')
    with pytest.raises(HTTPException) as error:
        await invites.preview(db_session, guest, 'ref_missing')
    assert error.value.status_code == 404


async def test_dismissed_intent_is_not_resurrected_by_signed_session_replay(db_session, people):
    _, guest, _ = people
    await invites.remember_launch(db_session, guest, 'ref_friendhost', version=200)
    await db_session.commit()
    assert (await invites.inbox(db_session, guest))['launch'] == 'ref_friendhost'
    await invites.dismiss_launch(db_session, guest.telegram_id, 'ref_friendhost')
    for version in (100, 200):
        await invites.remember_launch(db_session, guest, 'ref_friendhost', version=version)
        await db_session.commit()
        await db_session.refresh(await db_session.get(PlayerLaunchIntent, guest.telegram_id))
        assert (await invites.inbox(db_session, guest))['launch'] is None
    await invites.remember_launch(db_session, guest, 'ref_friendhost', version=300)
    await db_session.commit()
    await db_session.refresh(await db_session.get(PlayerLaunchIntent, guest.telegram_id))
    assert (await invites.inbox(db_session, guest))['launch'] == 'ref_friendhost'


async def test_request_consent_idempotent_free_game_and_no_money(db_session, people):
    host, guest, other = people
    first = await invites.request_game(db_session, guest, 'ref_friendhost')
    again = await invites.request_game(db_session, guest, 'ref_friendhost')
    assert first['id'] == again['id'] and first['game_id'] is None
    assert (await invites.inbox(db_session, host))['invitations'][0]['role'] == 'host'
    with pytest.raises(HTTPException) as error:
        await invites.respond(db_session, guest, first['id'], 'accept')
    assert error.value.status_code == 403
    with pytest.raises(HTTPException) as error:
        await invites.preview(db_session, other, 'fi_' + first['id'])
    assert error.value.status_code == 404
    accepted = await invites.respond(db_session, host, first['id'], 'accept')
    replay = await invites.respond(db_session, host, first['id'], 'accept')
    assert accepted['status'] == 'ready' and accepted['game_id'] == replay['game_id']
    state = await GameService().session_manager.get_game(accepted['game_id'])
    assert (state.white_player_id, state.black_player_id) == (host.telegram_id, guest.telegram_id)
    assert state.bid_amount == 0 and state.time_control_seconds == 600 and state.first_move_grace_seconds == 180
    assert (await invites.inbox(db_session, guest))['invitations'][0]['game_id'] == accepted['game_id']
    from app.models.transaction import Transaction
    assert (await db_session.execute(select(Transaction))).scalars().all() == []
    assert host.balance == guest.balance == 0


@pytest.mark.parametrize('action,actor,expected', [('decline',0,'declined'),('cancel',1,'cancelled')])
async def test_decline_and_cancel_are_terminal(db_session, people, action, actor, expected):
    host, guest, _ = people
    view = await invites.request_game(db_session, guest, 'ref_friendhost')
    assert (await invites.respond(db_session, people[actor], view['id'], action))['status'] == expected
    assert (await invites.respond(db_session, host, view['id'], 'accept'))['game_id'] is None


async def test_expired_self_and_busy_requests(db_session, people):
    host, guest, _ = people
    with pytest.raises(HTTPException):
        await invites.request_game(db_session, host, 'ref_friendhost')
    view = await invites.request_game(db_session, guest, 'ref_friendhost')
    busy = await GameService().create_game('busyhuman')
    busy.white_player_id = host.telegram_id; busy.black_player_id = 999999
    await GameService().session_manager.save_game('busyhuman', busy)
    with pytest.raises(HTTPException) as error:
        await invites.respond(db_session, host, view['id'], 'accept')
    assert error.value.detail['code'] == 'player_busy'
    row = await db_session.get(FriendInvite, view['id'])
    row.expires_at = invites.utcnow() - timedelta(seconds=1); await db_session.commit()
    assert (await invites.respond(db_session, host, view['id'], 'accept'))['status'] == 'expired'


async def test_bot_existing_player_gets_escaped_invitation_and_saved_intent(db_session, people, monkeypatch):
    from app.services.telegram_bot import TelegramService
    import app.core.database as database
    _, guest, _ = people
    class Borrowed:
        async def __aenter__(self): return db_session
        async def __aexit__(self, *args): pass
    monkeypatch.setattr(database, 'AsyncSessionLocal', Borrowed)
    context = SimpleNamespace(args=['ref_friendhost'], bot=SimpleNamespace(set_chat_menu_button=AsyncMock()))
    update = SimpleNamespace(effective_user=SimpleNamespace(id=guest.telegram_id, first_name='Guest', last_name=None, username=None, language_code='en'), message=SimpleNamespace(reply_text=AsyncMock()))
    await TelegramService.start_command(update, context)
    call = update.message.reply_text.call_args
    assert 'Host &lt;&amp;&gt;' in call.args[0]
    button = call.kwargs['reply_markup'].inline_keyboard[0][0]
    assert 'startapp=ref_friendhost' in button.web_app.url
    context.bot.set_chat_menu_button.assert_not_called()
    assert (await invites.inbox(db_session, guest))['launch'] == 'ref_friendhost'


async def test_exact_reported_legacy_game_parameter_and_lost_launch_recovery(db_session, people):
    host, guest, _ = people
    state = await GameService().create_game('4e044c66')
    state.white_player_id = host.telegram_id
    await GameService().session_manager.save_game('4e044c66', state)
    view = await invites.preview(db_session, guest, '4e044c66')
    assert view['kind'] == 'game' and view['opponent']['name'] == host.first_name
    await invites.remember_launch(db_session, guest, '4e044c66'); await db_session.commit()
    assert (await invites.inbox(db_session, guest))['launch'] == '4e044c66'
    state.is_game_over = True
    await GameService().session_manager.save_game('4e044c66', state)
    with pytest.raises(HTTPException) as error:
        await invites.preview(db_session, guest, '4e044c66')
    assert error.value.detail['code'] == 'expired_invitation'


async def test_sql_failure_after_game_creation_recovers_same_game(db_session, people):
    host, guest, _ = people
    view = await invites.request_game(db_session, guest, 'ref_friendhost')
    row = await db_session.get(FriendInvite, view['id'])
    state = await GameService().create_game(row.game_id)
    state.white_player_id, state.black_player_id = host.telegram_id, guest.telegram_id
    await GameService().session_manager.save_game(row.game_id, state)
    assert row.status == 'pending'  # SQL commit did not complete before a restart.
    recovered = await invites.respond(db_session, host, row.id, 'accept')
    assert recovered['status'] == 'ready' and recovered['game_id'] == row.game_id
    assert len([key for key in SessionManager._memory_store if key.startswith('game:')]) == 1
