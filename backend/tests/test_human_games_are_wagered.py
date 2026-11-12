"""Free play is the AI coach only: every path that could start a zero-stake game
between two people is refused (REST create is covered in app/tests/test_game_create_validation.py,
friend requests in test_friend_invitations.py)."""
from unittest.mock import AsyncMock, Mock

import pytest

from app import socket_events
from app.services import arena_service as arena_mod
from app.services.arena_service import ArenaService
from app.services.game_rules import is_valid_human_stake, MIN_HUMAN_STAKE_CENTS
from app.services.game_service import GameService
from app.services.session_manager import SessionManager

pytestmark = pytest.mark.asyncio


class FakeSio:
    def __init__(self, session):
        self.session = session
        self.emitted = []

    async def get_session(self, sid):
        return self.session

    async def save_session(self, sid, session):
        self.session = session

    async def emit(self, event, data=None, room=None):
        self.emitted.append((event, data, room))

    async def enter_room(self, sid, room):
        pass


class FakeRedis:
    def __init__(self):
        self.data = {}

    async def set(self, key, value, ex=None):
        self.data[key] = value

    async def get(self, key):
        return self.data.get(key)

    async def delete(self, key):
        self.data.pop(key, None)


@pytest.fixture
def memory_store(monkeypatch):
    monkeypatch.setattr(SessionManager, '_use_memory', True)
    monkeypatch.setattr(SessionManager, '_memory_store', {})
    monkeypatch.setattr(SessionManager, '_redis_client', FakeRedis())
    monkeypatch.setattr(GameService, 'start_abort_monitor', Mock())


async def _finished_human_game(game_id, bid_amount):
    service = GameService()
    state = await service.create_game(game_id, is_bot_game=False, bid_amount=bid_amount)
    state.white_player_id, state.black_player_id = 610001, 610002
    state.is_game_over = True
    await service.session_manager.save_game(game_id, state)
    return service


@pytest.mark.parametrize('stake,ok', [(None, False), (-100, False), (0, False), (99, False),
                                      (MIN_HUMAN_STAKE_CENTS, True), (2500, True), ('abc', False)])
async def test_stake_rule(stake, ok):
    assert is_valid_human_stake(stake) is ok


async def test_joining_an_open_zero_stake_human_game_is_refused(memory_store, db_session):
    service = GameService()
    state = await service.create_game('legacyfree', is_bot_game=False, bid_amount=0)
    state.white_player_id = 610001
    await service.session_manager.save_game('legacyfree', state)
    with pytest.raises(ValueError, match='Free Coach'):
        await service.join_game('legacyfree', 610002)
    assert (await service.session_manager.get_game('legacyfree')).black_player_id is None


async def test_a_free_rematch_cannot_be_offered(memory_store, monkeypatch):
    await _finished_human_game('freedone', 0)
    fake = FakeSio({'user_id': 610001, 'user_data': {}})
    monkeypatch.setattr(socket_events, 'sio', fake)
    await socket_events.offer_rematch('sid1', {'game_id': 'freedone', 'double_stakes': False})
    assert fake.emitted and fake.emitted[0][0] == 'error' and fake.emitted[0][1]['code'] == 'stake_required'
    assert await GameService().session_manager.redis.get('pending_rematch:freedone') is None


async def test_a_staked_rematch_can_still_be_offered(memory_store, monkeypatch):
    await _finished_human_game('paiddone', 500)
    fake = FakeSio({'user_id': 610001, 'user_data': {}})
    monkeypatch.setattr(socket_events, 'sio', fake)
    await socket_events.offer_rematch('sid1', {'game_id': 'paiddone', 'double_stakes': True})
    assert fake.emitted[0][0] == 'rematch_offered' and fake.emitted[0][1]['wager'] == 1000


async def test_a_pending_free_rematch_cannot_be_accepted(memory_store, monkeypatch):
    import json
    service = await _finished_human_game('freedone2', 0)
    await service.session_manager.redis.set('pending_rematch:freedone2', json.dumps(
        {'challenger_id': 610001, 'wager': 0, 'double_stakes': False}))
    fake = FakeSio({'user_id': 610002})
    monkeypatch.setattr(socket_events, 'sio', fake)
    create = AsyncMock()
    monkeypatch.setattr(GameService, 'create_game', create)
    await socket_events.accept_rematch('sid2', {'game_id': 'freedone2'})
    assert fake.emitted[0][1]['code'] == 'stake_required'
    create.assert_not_called()


async def test_arena_is_closed(monkeypatch):
    assert arena_mod.ARENA_ENABLED is False
    fake = FakeSio({'user_id': 610001})
    monkeypatch.setattr(socket_events, 'sio', fake)
    join = AsyncMock(return_value=True)
    monkeypatch.setattr(ArenaService, 'join', join)
    await socket_events.join_arena('sid1', {})
    assert fake.emitted[0][0] == 'arena_error'
    join.assert_not_called()


async def test_closed_arena_never_creates_a_free_game(memory_store, monkeypatch):
    create = AsyncMock()
    monkeypatch.setattr(GameService, 'create_game', create)
    assert await socket_events.establish_arena_game(610001, 's1', 610002, 's2', 300, 1) is None
    create.assert_not_called()
