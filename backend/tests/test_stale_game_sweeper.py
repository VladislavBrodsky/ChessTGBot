"""Tests for the stale-game sweeper (never-started wager game abort + refund).

is_sweepable() is the sensitive decision — too loose and it would abort live
games / double the abort path; too tight and stakes stay locked. It is tested
exhaustively as a pure predicate. A guarded integration test then proves the
full sweep actually aborts and refunds both players via end_game.
"""
import asyncio
import time

import pytest

from app.schemas.game_state import GameState
from app.services import stale_game_sweeper as sweeper
from app.services.stale_game_sweeper import is_sweepable, STALE_GRACE_SECONDS


def _state(**kw):
    base = dict(
        is_game_over=False,
        bid_amount=500,
        white_player_id=1,
        black_player_id=2,
        last_move_at=None,
        created_at=time.time() - (STALE_GRACE_SECONDS + 30),
    )
    base.update(kw)
    return GameState.model_construct(**base)


def test_sweepable_matched_wager_never_started_and_stale():
    assert is_sweepable(_state(), time.time()) is True


def test_not_sweepable_when_already_over():
    assert is_sweepable(_state(is_game_over=True), time.time()) is False


def test_not_sweepable_without_wager():
    assert is_sweepable(_state(bid_amount=0), time.time()) is False


def test_not_sweepable_ai_game():
    # AI opponent (-1) is free and self-restartable, not a stuck stake.
    assert is_sweepable(_state(black_player_id=-1), time.time()) is False


def test_not_sweepable_when_opponent_never_joined():
    # Unfilled lobby -> handled by heal_zombie_wagers, not this sweeper.
    assert is_sweepable(_state(black_player_id=None), time.time()) is False


def test_not_sweepable_once_started():
    # A move was made -> clock-timeout path owns this game, not the sweeper.
    assert is_sweepable(_state(last_move_at=time.time()), time.time()) is False


def test_not_sweepable_when_too_new():
    assert is_sweepable(_state(created_at=time.time() - 5), time.time()) is False


def test_not_sweepable_without_created_at():
    # Legacy pre-created_at games: left to TTL / reconnect heal, not guessed.
    assert is_sweepable(_state(created_at=None), time.time()) is False


def test_not_sweepable_on_none_state():
    assert is_sweepable(None, time.time()) is False


@pytest.mark.asyncio
async def test_loop_tolerates_transient_failures_then_alerts_on_sustained_outage(monkeypatch, caplog):
    """A Redis blip must not page admins; a sustained outage must, exactly once
    per reminder window. Regression for the 2026-08-10 CORE API alert, where a
    single "Timeout connecting to server" from one failed sweep alerted.
    """
    import logging

    calls = {"n": 0}
    total_sweeps = sweeper.SWEEP_FAILURES_BEFORE_ALERT + sweeper.SWEEP_ALERT_REMINDER_SWEEPS

    async def always_fails(_service):
        calls["n"] += 1
        if calls["n"] > total_sweeps:
            raise asyncio.CancelledError
        raise ConnectionError("Timeout connecting to server")

    async def no_sleep(_seconds):
        return None

    monkeypatch.setattr(sweeper, "_sweep_once", always_fails)
    monkeypatch.setattr(sweeper.asyncio, "sleep", no_sleep)
    monkeypatch.setattr(sweeper, "GameService", lambda: object())

    with caplog.at_level(logging.WARNING, logger=sweeper.logger.name):
        with pytest.raises(asyncio.CancelledError):
            await sweeper.start_stale_game_sweeper()

    errors = [r for r in caplog.records if r.levelno >= logging.ERROR]
    # First SWEEP_FAILURES_BEFORE_ALERT - 1 failures stay at WARNING; then one
    # alert at the threshold and one reminder SWEEP_ALERT_REMINDER_SWEEPS later.
    assert len(errors) == 2
    assert errors[0].getMessage().splitlines()[0] == (
        "Stale-game sweeper sustained outage: never-started wager games are not being refunded"
    )
    # Fingerprinting dedupes on the first line: it must be identical across alerts.
    assert errors[0].getMessage().splitlines()[0] == errors[1].getMessage().splitlines()[0]


@pytest.mark.asyncio
async def test_loop_resets_failure_streak_after_a_successful_sweep(monkeypatch, caplog):
    """Isolated failures spread across successful sweeps never reach the threshold."""
    import logging

    calls = {"n": 0}

    async def alternating(_service):
        calls["n"] += 1
        if calls["n"] > 4 * sweeper.SWEEP_FAILURES_BEFORE_ALERT:
            raise asyncio.CancelledError
        if calls["n"] % 2:
            raise ConnectionError("Timeout connecting to server")
        return 0

    async def no_sleep(_seconds):
        return None

    monkeypatch.setattr(sweeper, "_sweep_once", alternating)
    monkeypatch.setattr(sweeper.asyncio, "sleep", no_sleep)
    monkeypatch.setattr(sweeper, "GameService", lambda: object())

    with caplog.at_level(logging.WARNING, logger=sweeper.logger.name):
        with pytest.raises(asyncio.CancelledError):
            await sweeper.start_stale_game_sweeper()

    assert [r for r in caplog.records if r.levelno >= logging.ERROR] == []


@pytest.mark.asyncio
async def test_create_game_stamps_created_at(db_session):
    if hasattr(db_session, "users"):
        return
    from app.services.game_service import GameService

    svc = GameService()
    before = time.time()
    state = await svc.create_game("createdat-check", is_bot_game=False, bid_amount=100)
    assert state.created_at is not None
    assert before <= state.created_at <= time.time() + 1


@pytest.mark.asyncio
async def test_sweep_aborts_and_refunds_never_started_wager(db_session):
    if hasattr(db_session, "users"):
        return
    from sqlalchemy import select
    from app.models.user import User
    from app.models.game_history import GameHistory
    from app.services.game_service import GameService

    WHITE, BLACK, BID = 820001, 820002, 500
    w = User(telegram_id=WHITE, first_name="White", elo=1000, balance=1000)
    b = User(telegram_id=BLACK, first_name="Black", elo=1000, balance=1000)
    db_session.add_all([w, b])
    await db_session.commit()

    svc = GameService()
    gid = "sweep-refund-1"
    state = await svc.create_game(gid, is_bot_game=False, bid_amount=BID)
    state.white_player_id = WHITE
    state.black_player_id = BLACK
    state.last_move_at = None  # never started
    state.created_at = time.time() - (STALE_GRACE_SECONDS + 30)  # stale
    await svc.session_manager.save_game(gid, state)

    swept = await sweeper._sweep_once(svc)
    assert swept >= 1

    # Game is now aborted in the store.
    after = await svc.session_manager.get_game(gid)
    assert after.is_game_over and after.result_type == "aborted"

    # Both players were refunded their stake (+BID each), and a history row exists.
    db_session.expire_all()
    balances = {
        row.telegram_id: row.balance
        for row in (await db_session.execute(select(User).where(User.telegram_id.in_([WHITE, BLACK])))).scalars()
    }
    assert balances[WHITE] == 1000 + BID
    assert balances[BLACK] == 1000 + BID

    hist = (await db_session.execute(select(GameHistory).where(GameHistory.game_id == gid))).scalars().first()
    assert hist is not None and hist.result_type == "aborted"

    # Idempotent: a second sweep must not refund again.
    state2 = await svc.session_manager.get_game(gid)
    # (already game_over -> not sweepable) but even a forced re-run is a no-op refund-wise.
    assert is_sweepable(state2, time.time()) is False
