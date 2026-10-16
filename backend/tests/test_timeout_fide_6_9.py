"""FIDE 6.9 on the clock: running out of time loses only if the opponent could still checkmate.

When the opponent has no mating material (bare king, K+N, K+B) the flag is a draw, so a wager
refunds both stakes with no fee instead of paying the opponent. The public Rules page promises
this (copy-accuracy review row D8). Covers all three timeout paths: the lazy check in
get_game_state, the monitor_timeout task, and a late move in make_move.
"""
import time
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import select

from app.crud import user as user_crud
from app.models.game_history import GameHistory
from app.models.transaction import Transaction
from app.models.user import User
from app.services import game_service as game_module
from app.services.game_service import GameService, flag_fall_result
from app.services.settlement import compute_wager_settlement
from app.services.telegram_bot import TelegramService

# The flagged side always keeps king and queen, so only the opponent's material decides.
# opponent material -> (FEN with White to move and out of time, FEN with Black to move and out of time)
POSITIONS = {
    "K": ("4k3/8/8/8/8/8/8/3QK3 w - - 0 1", "3qk3/8/8/8/8/8/8/4K3 b - - 0 1"),
    "K+N": ("1n2k3/8/8/8/8/8/8/3QK3 w - - 0 1", "3qk3/8/8/8/8/8/8/1N2K3 b - - 0 1"),
    "K+B": ("2b1k3/8/8/8/8/8/8/3QK3 w - - 0 1", "3qk3/8/8/8/8/8/8/2B1K3 b - - 0 1"),
    "K+R": ("r3k3/8/8/8/8/8/8/3QK3 w - - 0 1", "3qk3/8/8/8/8/8/8/R3K3 b - - 0 1"),
    "K+P": ("4k3/p7/8/8/8/8/8/3QK3 w - - 0 1", "3qk3/8/8/8/8/8/P7/4K3 b - - 0 1"),
}
DRAWN = ["K", "K+N", "K+B"]
LOST = ["K+R", "K+P"]

START = 10_000  # cents each player held before the match
BID = 500       # cents each player staked


@pytest.fixture
def quiet(monkeypatch):
    monkeypatch.setattr(game_module.sio, "emit", AsyncMock())
    monkeypatch.setattr(TelegramService, "send_notification", AsyncMock())


def require_real_db(db_session):
    if hasattr(db_session, "users"):
        pytest.skip("settlement assertions need a real database engine")


async def flagged_game(service, game_id, fen, white_id, black_id, bid=0):
    """A started game whose side to move ran out of time a few seconds ago."""
    state = await service.create_game(game_id, is_bot_game=black_id == -1, time_control_seconds=60, bid_amount=bid)
    state.fen = fen
    state.turn = fen.split()[1]
    state.white_player_id, state.black_player_id = white_id, black_id
    state.white_time_left = state.black_time_left = 1.0
    state.last_move_at = time.time() - 5
    await service.session_manager.save_game(game_id, state)
    return state


async def make_player(db_session, telegram_id, balance):
    user = await user_crud.create_user(db_session, telegram_id, f"Player {telegram_id}")
    user.balance = balance
    db_session.add(user)
    await db_session.commit()
    return telegram_id


async def player(db_session, telegram_id) -> User:
    db_session.expire_all()
    return (await db_session.execute(select(User).where(User.telegram_id == telegram_id))).scalar_one()


async def history(db_session, game_id) -> GameHistory:
    return (await db_session.execute(select(GameHistory).where(GameHistory.game_id == game_id))).scalar_one()


async def ledger(db_session, game_id):
    rows = (await db_session.execute(select(Transaction).where(Transaction.reference_id == game_id))).scalars().all()
    return sorted((t.user_id, t.type, t.amount, t.fee) for t in rows)


# ── The rule itself ───────────────────────────────────────────────────────────

@pytest.mark.parametrize("flagged", ["w", "b"])
@pytest.mark.parametrize("material", DRAWN)
def test_flag_is_a_draw_when_the_opponent_cannot_mate(material, flagged):
    fen = POSITIONS[material][0 if flagged == "w" else 1]
    assert flag_fall_result(fen, flagged) == (None, "draw")


@pytest.mark.parametrize("flagged", ["w", "b"])
@pytest.mark.parametrize("material", LOST)
def test_flag_loses_when_the_opponent_can_still_mate(material, flagged):
    fen = POSITIONS[material][0 if flagged == "w" else 1]
    assert flag_fall_result(fen, flagged) == ("b" if flagged == "w" else "w", "timeout")


def test_lone_knight_still_wins_on_time_against_a_pawn():
    # K+N vs K+P: a helpmate exists (the pawn can wall in its own king), so the knight side wins.
    assert flag_fall_result("1n2k3/8/8/8/8/8/P7/4K3 w - - 0 1", "w") == ("b", "timeout")


# ── Wagered games: lazy clock check in get_game_state ────────────────────────

@pytest.mark.parametrize("material", DRAWN)
async def test_wagered_flag_against_no_mating_material_refunds_both_stakes(material, db_session, quiet):
    require_real_db(db_session)
    white = await make_player(db_session, 7101, START - BID)  # stakes were debited at match time
    black = await make_player(db_session, 7102, START - BID)
    service = GameService()
    game_id = f"fide69-wager-draw-{material}"
    await flagged_game(service, game_id, POSITIONS[material][0], white, black, bid=BID)

    state = await service.get_game_state(game_id)
    assert state.is_game_over and state.white_time_left == 0.0
    assert (state.winner, state.result_type) == (None, "draw")

    # A duplicate trigger (monitor task, reconnect, sweeper) must not refund twice.
    await service.end_game(game_id, state)

    assert (await player(db_session, white)).balance == START
    assert (await player(db_session, black)).balance == START
    assert await ledger(db_session, game_id) == sorted([
        (white, "game_refund", BID, 0),
        (black, "game_refund", BID, 0),
    ])
    record = await history(db_session, game_id)
    assert (record.winner, record.result_type, record.bid_amount) == (None, "draw", BID)
    assert ((await player(db_session, white)).draws, (await player(db_session, black)).draws) == (1, 1)


@pytest.mark.parametrize("material", LOST)
async def test_wagered_flag_against_mating_material_pays_the_opponent(material, db_session, quiet):
    require_real_db(db_session)
    white = await make_player(db_session, 7201, START - BID)
    black = await make_player(db_session, 7202, START - BID)
    service = GameService()
    game_id = f"fide69-wager-loss-{material}"
    await flagged_game(service, game_id, POSITIONS[material][0], white, black, bid=BID)

    state = await service.get_game_state(game_id)
    assert (state.winner, state.result_type) == ("b", "timeout")
    await service.end_game(game_id, state)

    payout, rake, referral_fee = compute_wager_settlement(BID)
    assert (await player(db_session, white)).balance == START - BID
    assert (await player(db_session, black)).balance == START - BID + payout
    entries = await ledger(db_session, game_id)
    assert (black, "game_win", payout, rake + referral_fee) in entries
    assert not [e for e in entries if e[1] == "game_refund"]
    record = await history(db_session, game_id)
    assert (record.winner, record.result_type) == ("b", "timeout")


# ── Bot games: the monitor_timeout task ──────────────────────────────────────

@pytest.mark.parametrize("material", DRAWN + LOST)
async def test_bot_game_flag_follows_fide_6_9(material, db_session, quiet):
    require_real_db(db_session)
    human = await make_player(db_session, 7301, START)
    service = GameService()
    game_id = f"fide69-bot-{material}"
    await flagged_game(service, game_id, POSITIONS[material][0], human, -1)

    await service.monitor_timeout(game_id, expected_move_count=0, time_left=0, turn="w")

    drawn = material in DRAWN
    state = await service.session_manager.get_game(game_id)
    assert state.is_game_over and state.white_time_left == 0.0
    assert (state.winner, state.result_type) == ((None, "draw") if drawn else ("b", "timeout"))
    user = await player(db_session, human)
    assert (user.draws, user.losses, user.balance) == ((1, 0) if drawn else (0, 1)) + (START,)
    record = await history(db_session, game_id)
    assert (record.game_type, record.bid_amount, record.winner) == ("computer", 0, None if drawn else "b")
    assert await ledger(db_session, game_id) == [(human, "game_against_ai", 0, 0)]


async def test_bot_flagging_against_a_bare_king_is_a_draw(db_session, quiet):
    require_real_db(db_session)
    human = await make_player(db_session, 7401, START)
    service = GameService()
    game_id = "fide69-bot-flags"
    await flagged_game(service, game_id, POSITIONS["K"][1], human, -1)

    await service.monitor_timeout(game_id, expected_move_count=0, time_left=0, turn="b")

    state = await service.session_manager.get_game(game_id)
    assert (state.winner, state.result_type, state.black_time_left) == (None, "draw", 0.0)
    assert (await player(db_session, human)).draws == 1


# ── A move sent after the clock ran out (_apply_clock_update) ────────────────

async def test_late_move_against_a_bare_king_is_a_draw(quiet, monkeypatch):
    service = GameService()
    monkeypatch.setattr(service, "end_game", AsyncMock())
    await flagged_game(service, "fide69-late-draw", POSITIONS["K"][0], 7501, 7502, bid=BID)

    state = await service.make_move("fide69-late-draw", "d1d2")

    assert state.is_game_over and state.white_time_left == 0.0
    assert (state.winner, state.result_type) == (None, "draw")


async def test_late_capture_cannot_turn_a_loss_on_time_into_a_draw(quiet, monkeypatch):
    # White is out of time and then takes Black's last rook. The flag fell while Black still
    # had K+R, so White loses on time even though the final board shows a bare black king.
    service = GameService()
    monkeypatch.setattr(service, "end_game", AsyncMock())
    await flagged_game(service, "fide69-late-capture", "3rk3/8/8/8/8/8/8/3QK3 w - - 0 1", 7601, 7602, bid=BID)

    state = await service.make_move("fide69-late-capture", "d1d8")

    assert state.is_game_over
    assert (state.winner, state.result_type) == ("b", "timeout")
