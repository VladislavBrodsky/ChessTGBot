"""Cross-time-control matchmaking tests.

Per-time-control queues fragment a small player pool into buckets that rarely
overlap. try_match_and_pop therefore merges nearby pools once BOTH players
have waited CROSS_TC_WAIT_SECONDS: candidates whose time control is within
CROSS_TC_MAX_RATIO (3m<->5m, 5m<->10m — never 1m<->10m) become eligible, and
the matched game uses the longer-waiting player's time control. An exact
time-control match stays instant and is always preferred.

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


def _put(user_id: int, bid: int, tc: int, *, waited: float = 0.0, elo: int = 1000):
    """Insert a queue entry directly, optionally backdating joined_at."""
    entry = {
        'user_id': user_id,
        'sid': f"sid-{user_id}",
        'elo': elo,
        'joined_at': time.time() - waited,
        'time_control': tc,
        'ip_hash': f"ip-{user_id}",
        'referrer_id': None,
    }
    MatchmakerService._memory_queues.setdefault((bid, tc), []).append(entry)


async def test_fresh_players_never_cross_match():
    """A fresh joiner is not pulled into a time control they didn't pick."""
    mm = MatchmakerService()
    _put(222, 0, 600, waited=5)
    _put(111, 0, 300, waited=0)

    opponent = await mm.try_match_and_pop(0, 111, user_elo=1000, time_control=300)
    assert opponent is None


async def test_cross_match_after_both_waited():
    mm = MatchmakerService()
    _put(222, 0, 600, waited=40)
    _put(111, 0, 300, waited=25)

    opponent = await mm.try_match_and_pop(0, 111, user_elo=1000, time_control=300)
    assert opponent is not None and opponent['user_id'] == 222
    # Longer-waiting player's preference wins
    assert opponent['matched_time_control'] == 600
    # Both entries popped from their respective queues
    assert all(not q for q in MatchmakerService._memory_queues.values())


async def test_cross_match_uses_requester_tc_when_requester_waited_longer():
    mm = MatchmakerService()
    _put(222, 0, 600, waited=25)
    _put(111, 0, 300, waited=60)

    opponent = await mm.try_match_and_pop(0, 111, user_elo=1000, time_control=300)
    assert opponent is not None
    assert opponent['matched_time_control'] == 300


async def test_no_cross_match_when_only_one_side_waited():
    mm = MatchmakerService()
    _put(222, 0, 600, waited=60)
    _put(111, 0, 300, waited=5)  # requester nearly fresh

    opponent = await mm.try_match_and_pop(0, 111, user_elo=1000, time_control=300)
    assert opponent is None


async def test_far_apart_time_controls_never_merge():
    """Bullet vs rapid is a bad game for both — ratio cap keeps them apart."""
    mm = MatchmakerService()
    _put(222, 0, 600, waited=100)
    _put(111, 0, 60, waited=100)

    opponent = await mm.try_match_and_pop(0, 111, user_elo=1000, time_control=60)
    assert opponent is None


async def test_exact_tc_preferred_over_cross_tc():
    mm = MatchmakerService()
    _put(222, 0, 600, waited=60, elo=1000)   # cross-tc, perfect elo
    _put(333, 0, 300, waited=60, elo=1050)   # exact tc, slightly worse elo
    _put(111, 0, 300, waited=60)

    opponent = await mm.try_match_and_pop(0, 111, user_elo=1000, time_control=300)
    assert opponent is not None and opponent['user_id'] == 333
    assert opponent['matched_time_control'] == 300


async def test_exact_tc_still_matches_instantly():
    mm = MatchmakerService()
    _put(222, 0, 300, waited=0)
    _put(111, 0, 300, waited=0)

    opponent = await mm.try_match_and_pop(0, 111, user_elo=1000, time_control=300)
    assert opponent is not None and opponent['user_id'] == 222
    assert opponent['matched_time_control'] == 300


async def test_cross_match_respects_bid_tier():
    """Pools only merge across time controls, never across wager tiers."""
    mm = MatchmakerService()
    _put(222, 500, 300, waited=60)
    _put(111, 0, 300, waited=60)

    opponent = await mm.try_match_and_pop(0, 111, user_elo=1000, time_control=300)
    assert opponent is None


def test_tc_compatible_rules():
    compat = MatchmakerService._tc_compatible
    assert compat(300, 300, 0) is True          # exact: always
    assert compat(300, 600, 10) is False        # cross: not before threshold
    assert compat(300, 600, 25) is True         # 5m<->10m after wait
    assert compat(180, 300, 25) is True         # 3m<->5m after wait
    assert compat(60, 300, 999) is False        # bullet<->blitz: never (ratio 5)
    assert compat(600, 1800, 999) is False      # 10m<->30m: never (ratio 3)
    assert compat(1800, 3600, 25) is True       # 30m<->60m after wait
