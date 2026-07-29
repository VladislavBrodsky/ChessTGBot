"""Matchmaker anti-collusion scoping tests.

The collusion guard (same IP / referral edge / recent opponents) applies to
WAGERED games only: with no money at stake there is no rake or commission to
farm, and friend-invite games bypass the guard entirely anyway.

Regression for: two legitimate players (a referrer and the friend they
invited, or two players on the same WiFi/CGNAT IP, or a recent-opponent pair)
picking a FREE game and silently never matching — both sat in the queue until
the 120s timeout refunded them. Self-match (the same account matching its own
other connection) stays blocked everywhere.
"""

import pytest

from app.services.matchmaker import MatchmakerService
from app.crud.game_history import create_game_history
from app.crud import user as user_crud
from sqlalchemy import delete
from app.models.game_history import GameHistory
from app.models.user import User


@pytest.fixture(autouse=True)
def _in_memory_matchmaker():
    """Force in-memory queues and reset singleton state around each test."""
    prev_use_memory = MatchmakerService._use_memory
    prev_queues = MatchmakerService._memory_queues
    MatchmakerService._use_memory = True
    MatchmakerService._memory_queues = {}
    yield
    MatchmakerService._use_memory = prev_use_memory
    MatchmakerService._memory_queues = prev_queues


async def _enqueue(mm: MatchmakerService, user_id: int, bid_amount: int, *, elo: int = 1000,
                   time_control: int = 300, ip_hash: str = None, referrer_id: int = None):
    await mm.add_to_queue(user_id, bid_amount, f"sid-{user_id}", elo=elo,
                          time_control=time_control, ip_hash=ip_hash, referrer_id=referrer_id)


# ── Pure in-memory unit tests (no DB) ────────────────────────────────────────

async def test_free_game_matches_referrer_with_referee():
    """The reported bug: user invites a friend, both queue 5-min free, no match."""
    mm = MatchmakerService()
    await _enqueue(mm, 222, 0, referrer_id=111)  # new player, invited by 111

    opponent = await mm.try_match_and_pop(0, 111, user_elo=1000, time_control=300, ip_hash="hash-a")
    assert opponent is not None and opponent['user_id'] == 222


async def test_free_game_matches_same_ip_pair():
    mm = MatchmakerService()
    await _enqueue(mm, 222, 0, ip_hash="same-wifi")

    opponent = await mm.try_match_and_pop(0, 111, user_elo=1000, time_control=300, ip_hash="same-wifi")
    assert opponent is not None and opponent['user_id'] == 222


async def test_free_game_never_matches_own_account():
    mm = MatchmakerService()
    await _enqueue(mm, 111, 0)

    opponent = await mm.try_match_and_pop(0, 111, user_elo=1000, time_control=300)
    assert opponent is None


async def test_wagered_game_still_blocks_referral_pair():
    mm = MatchmakerService()
    await _enqueue(mm, 222, 500, referrer_id=111)

    opponent = await mm.try_match_and_pop(500, 111, user_elo=1000, time_control=300, ip_hash="hash-a")
    assert opponent is None


async def test_wagered_game_still_blocks_same_ip_pair():
    mm = MatchmakerService()
    await _enqueue(mm, 222, 500, ip_hash="same-wifi")

    opponent = await mm.try_match_and_pop(500, 111, user_elo=1000, time_control=300, ip_hash="same-wifi")
    assert opponent is None


async def test_wagered_game_matches_unrelated_players():
    mm = MatchmakerService()
    await _enqueue(mm, 222, 500, ip_hash="hash-b")

    opponent = await mm.try_match_and_pop(500, 111, user_elo=1000, time_control=300, ip_hash="hash-a")
    assert opponent is not None and opponent['user_id'] == 222


def test_would_collude_rules_unchanged():
    """The guard itself keeps all four rules for the wagered path."""
    would = MatchmakerService._would_collude
    assert would(1, "ip-a", None, {'user_id': 1}) is True                                  # self
    assert would(1, "ip-a", None, {'user_id': 2, 'ip_hash': "ip-a"}) is True               # same IP
    assert would(1, None, 2, {'user_id': 2}) is True                                       # candidate is requester's referrer
    assert would(1, None, None, {'user_id': 2, 'referrer_id': 1}) is True                  # requester referred candidate
    assert would(1, None, None, {'user_id': 2}, recent_opponents={2}) is True              # recent opponent
    assert would(1, "ip-a", None, {'user_id': 2, 'ip_hash': "ip-b"}) is False              # unrelated


# ── DB-backed test: recent-opponent history guard (wagered only) ─────────────

@pytest.mark.asyncio
async def test_matchmaker_history_collusion_guard(db_session):
    if hasattr(db_session, "users"):
        # Skip if using mock db session in unit tests
        return

    mm = MatchmakerService()

    # 1. Create three users in DB
    await user_crud.create_user(db_session, 999001, "User A")
    await user_crud.create_user(db_session, 999002, "User B")
    await user_crud.create_user(db_session, 999003, "User C")
    await db_session.commit()

    try:
        # 2. Seed a recent WAGERED game history between A and B
        await create_game_history(
            db=db_session,
            game_id="match_999001_999002_12345",
            white_player_id=999001,
            black_player_id=999002,
            winner="w",
            result_type="checkmate",
            white_elo_before=1000,
            white_elo_after=1005,
            black_elo_before=1000,
            black_elo_after=995,
            bid_amount=500,
            commit=True
        )

        # 3. WAGERED: A must NOT match B (recent game history)
        await _enqueue(mm, 999002, 500, time_control=600, ip_hash="ip_different_1")
        opponent = await mm.try_match_and_pop(
            bid_amount=500, user_id=999001, user_elo=1000,
            time_control=600, ip_hash="ip_different_2"
        )
        assert opponent is None, "User A should not wager-match User B due to recent game history"

        # 4. WAGERED: A matches C (no history)
        await _enqueue(mm, 999003, 500, time_control=600, ip_hash="ip_different_3")
        opponent_c = await mm.try_match_and_pop(
            bid_amount=500, user_id=999001, user_elo=1000,
            time_control=600, ip_hash="ip_different_2"
        )
        assert opponent_c is not None
        assert opponent_c["user_id"] == 999003, "User A should wager-match User C"

        # 5. FREE: A and B can rematch despite recent history (friends playing casually)
        MatchmakerService._memory_queues.clear()
        await _enqueue(mm, 999002, 0, time_control=600, ip_hash="ip_different_1")
        opponent_free = await mm.try_match_and_pop(
            bid_amount=0, user_id=999001, user_elo=1000,
            time_control=600, ip_hash="ip_different_2"
        )
        assert opponent_free is not None
        assert opponent_free["user_id"] == 999002, "Free games must not be blocked by recent history"

    finally:
        # Clean up database
        await db_session.execute(delete(GameHistory).where(GameHistory.game_id == "match_999001_999002_12345"))
        await db_session.execute(delete(User).where(User.telegram_id.in_([999001, 999002, 999003])))
        await db_session.commit()


@pytest.mark.asyncio
async def test_free_history_does_not_block_wagered_match(db_session):
    """Regression: two friends play a FREE game, then can never be matched for
    money again — the free game consumed a slot in the recent-opponent lookback,
    which the wagered guard treated as a collusion signal."""
    if hasattr(db_session, "users"):
        return

    mm = MatchmakerService()
    await user_crud.create_user(db_session, 999011, "User A")
    await user_crud.create_user(db_session, 999012, "User B")
    await db_session.commit()

    try:
        await create_game_history(
            db=db_session,
            game_id="match_999011_999012_free",
            white_player_id=999011,
            black_player_id=999012,
            winner="b",
            result_type="checkmate",
            white_elo_before=1000,
            white_elo_after=995,
            black_elo_before=1000,
            black_elo_after=1005,
            bid_amount=0,
            commit=True,
        )

        await _enqueue(mm, 999012, 100, time_control=600, ip_hash="ip_x")
        opponent = await mm.try_match_and_pop(
            bid_amount=100, user_id=999011, user_elo=1000,
            time_control=600, ip_hash="ip_y"
        )
        assert opponent is not None and opponent["user_id"] == 999012, (
            "A free game between two players must not block them from wagered matching"
        )
    finally:
        await db_session.execute(delete(GameHistory).where(GameHistory.game_id == "match_999011_999012_free"))
        await db_session.execute(delete(User).where(User.telegram_id.in_([999011, 999012])))
        await db_session.commit()


async def test_stats_reports_collusion_skips():
    """The guard's skip count is exported so the socket layer can tell the
    client 'blocked by fair play' instead of leaving it on an endless spinner."""
    mm = MatchmakerService()
    await _enqueue(mm, 222, 500, ip_hash="same-wifi")

    stats = {}
    opponent = await mm.try_match_and_pop(
        500, 111, user_elo=1000, time_control=300, ip_hash="same-wifi", stats=stats
    )
    assert opponent is None
    assert stats['collusion_skipped'] == 1


async def test_stats_zero_when_queue_empty():
    mm = MatchmakerService()
    stats = {}
    opponent = await mm.try_match_and_pop(
        500, 111, user_elo=1000, time_control=300, ip_hash="ip-a", stats=stats
    )
    assert opponent is None
    assert stats['collusion_skipped'] == 0
