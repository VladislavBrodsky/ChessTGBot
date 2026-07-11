"""Persistent-queue matchmaking tests.

Free-game queue entries survive socket disconnects and long waits (30 min TTL)
so a player can close the app and get a Telegram notification when an opponent
appears. Wagered entries keep the short 130s lifetime — the wager is locked
while queued and the money paths assume the entry dies with the socket.

Pure unit tests: forced in-memory queues, no DB, no Redis.
"""
import time

import pytest

from app.services.matchmaker import MatchmakerService


@pytest.fixture(autouse=True)
def _in_memory_matchmaker():
    prev_use_memory = MatchmakerService._use_memory
    prev_queues = MatchmakerService._memory_queues
    MatchmakerService._use_memory = True
    MatchmakerService._memory_queues = {}
    yield
    MatchmakerService._use_memory = prev_use_memory
    MatchmakerService._memory_queues = prev_queues


def _put(user_id: int, bid: int, tc: int, *, waited: float = 0.0, elo: int = 1000, sid: str = None):
    entry = {
        'user_id': user_id,
        'sid': sid or f"sid-{user_id}",
        'elo': elo,
        'joined_at': time.time() - waited,
        'time_control': tc,
        'ip_hash': f"ip-{user_id}",
        'referrer_id': None,
    }
    MatchmakerService._memory_queues.setdefault((bid, tc), []).append(entry)


def test_queue_ttl_split():
    assert MatchmakerService.queue_ttl(0) == MatchmakerService.FREE_QUEUE_TTL_SECONDS
    assert MatchmakerService.queue_ttl(500) == MatchmakerService.WAGERED_QUEUE_TTL_SECONDS
    assert MatchmakerService.FREE_QUEUE_TTL_SECONDS > 600
    assert MatchmakerService.WAGERED_QUEUE_TTL_SECONDS <= 180


async def test_free_entry_survives_long_wait():
    """A free entry older than the old 130s cutoff is still matchable."""
    mm = MatchmakerService()
    _put(222, 0, 300, waited=600)  # 10 minutes in queue (app closed)
    _put(111, 0, 300, waited=0)

    opponent = await mm.try_match_and_pop(0, 111, user_elo=1000, time_control=300)
    assert opponent is not None and opponent['user_id'] == 222


async def test_free_entry_expires_after_ttl():
    mm = MatchmakerService()
    _put(222, 0, 300, waited=MatchmakerService.FREE_QUEUE_TTL_SECONDS + 60)
    _put(111, 0, 300, waited=0)

    opponent = await mm.try_match_and_pop(0, 111, user_elo=1000, time_control=300)
    assert opponent is None
    assert MatchmakerService._memory_queues[(0, 300)] == [] or all(
        i['user_id'] != 222 for i in MatchmakerService._memory_queues[(0, 300)]
    )


async def test_wagered_entry_still_purged_at_130s():
    mm = MatchmakerService()
    _put(222, 500, 300, waited=200)
    _put(111, 500, 300, waited=0)

    opponent = await mm.try_match_and_pop(500, 111, user_elo=1000, time_control=300)
    assert opponent is None


async def test_remove_only_wagered_keeps_free_entry():
    mm = MatchmakerService()
    _put(111, 0, 300)
    _put(111, 500, 300)

    await mm.remove_from_queue(111, only_wagered=True)

    assert any(i['user_id'] == 111 for i in MatchmakerService._memory_queues[(0, 300)])
    assert all(i['user_id'] != 111 for i in MatchmakerService._memory_queues[(500, 300)])

    await mm.remove_from_queue(111)
    assert all(i['user_id'] != 111 for i in MatchmakerService._memory_queues[(0, 300)])


async def test_update_sid_refreshes_persisted_entry():
    mm = MatchmakerService()
    _put(111, 0, 300, sid="old-dead-sid")

    await mm.update_sid(111, "new-live-sid")

    found = await mm.find_user_entry(111)
    assert found is not None
    assert found['entry']['sid'] == "new-live-sid"
    assert found['bid_amount'] == 0 and found['time_control'] == 300


async def test_find_user_entry_absent():
    mm = MatchmakerService()
    assert await mm.find_user_entry(999) is None
