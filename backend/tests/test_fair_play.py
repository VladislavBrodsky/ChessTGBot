"""Post-hoc fair-play screening (app/services/fair_play.py): scoring, the engine pass,
the analysis queue, reviews, the withdrawal hold and the admin resolve endpoint."""
import json
import logging
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

import chess
import chess.engine
import pytest
from sqlalchemy import select

from app.core.config import get_settings
from app.models.fair_play import FairPlayAnalysis, FairPlayReview
from app.models.game_history import GameHistory
from app.models.transaction import Transaction
from app.models.user import User
from app.services import fair_play as fp

pytestmark = pytest.mark.asyncio
settings = get_settings()
ADMIN_ID = 1016749901
DEST_ADDRESS = "UQCDg8ub3MGCVJSaNo2q3QGTg0bX71RmwrvVOfbrqAzYNuCN"


def _fresh_moves(board):
    """Legal moves in UCI order, those that repeat an earlier position last (so scripted
    games run long instead of ending in fivefold repetition)."""
    fresh, repeats = [], []
    for uci in sorted(m.uci() for m in board.legal_moves):
        board.push_uci(uci)
        (repeats if board.is_repetition(2) else fresh).append(uci)
        board.pop()
    return fresh + repeats


class FakeEngine:
    """Deterministic stand-in for Stockfish: the 'best' move is the first fresh legal
    move and every position is level (0 cp)."""

    async def analyse(self, board, limit):
        best = _fresh_moves(board)[0]
        return {"score": chess.engine.PovScore(chess.engine.Cp(0), board.turn), "pv": [chess.Move.from_uci(best)]}


def _game(pick, plies=90):
    board, moves = chess.Board(), []
    while len(moves) < plies and not board.is_game_over():
        options = _fresh_moves(board)
        move = pick(options)
        moves.append(move)
        board.push_uci(move)
    return moves


ENGINE_GAME = _game(lambda options: options[0])                           # always the fake engine's choice
HUMAN_GAME = _game(lambda options: options[1] if len(options) > 1 else options[0])  # never, when there is a choice


def _ply(ply, mover="w", played="e2e4", best="e2e4", before=0, after=0, legal=20):
    return fp.PlyEval(ply, mover, played, best, before, after, legal)


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _headers(telegram_id, name="Player"):
    return {"X-Telegram-Init-Data": f"user={quote(json.dumps({'id': telegram_id, 'first_name': name}))}"}


# ── Pure scoring ──────────────────────────────────────────────────────────────

async def test_opening_forced_and_decided_moves_are_not_judged():
    plies = [_ply(3), _ply(20, legal=1), _ply(22, before=900, after=900), _ply(24)]
    score = fp.score_player(plies, "w")
    assert score.moves_analyzed == 1 and score.engine_matches == 1


async def test_twenty_perfect_moves_flag_and_fewer_or_weaker_do_not():
    perfect = [_ply(16 + 2 * i) for i in range(20)]
    assert fp.is_flagged(fp.score_player(perfect, "w"))
    assert not fp.is_flagged(fp.score_player(perfect[:19], "w"))  # too few to judge
    missed = [_ply(16 + 2 * i, best=("d2d4" if i < 3 else "e2e4")) for i in range(20)]
    assert fp.score_player(missed, "w").match_rate == 0.85
    assert not fp.is_flagged(fp.score_player(missed, "w"))         # 85% < 90%
    sloppy = [_ply(16 + 2 * i, after=-15) for i in range(20)]
    assert fp.score_player(sloppy, "w").avg_centipawn_loss == 15
    assert not fp.is_flagged(fp.score_player(sloppy, "w"))         # matches but loses 15 cp/move


async def test_only_the_scored_colour_counts():
    plies = [_ply(16 + 2 * i, mover="b") for i in range(25)]
    assert fp.score_player(plies, "w").moves_analyzed == 0
    assert fp.is_flagged(fp.score_player(plies, "b"))


# ── Engine pass ───────────────────────────────────────────────────────────────

async def test_engine_pass_matches_engine_play_and_not_human_play():
    engine_plies = await fp.evaluate_moves(ENGINE_GAME, FakeEngine())
    human_plies = await fp.evaluate_moves(HUMAN_GAME, FakeEngine())
    assert len(engine_plies) == len(ENGINE_GAME)
    for color in "wb":
        engine_score = fp.score_player(engine_plies, color)
        assert engine_score.moves_analyzed >= fp.MIN_MOVES_FOR_VERDICT and fp.is_flagged(engine_score)
        assert fp.score_player(human_plies, color).engine_matches == 0


async def test_corrupt_history_is_judged_only_up_to_the_first_illegal_move():
    plies = await fp.evaluate_moves(["e2e4", "e7e5", "e1e8", "g1f3"], FakeEngine())
    assert [p.played for p in plies] == ["e2e4", "e7e5"]


async def test_checkmate_final_position_is_scored_without_the_engine():
    plies = await fp.evaluate_moves(["f2f3", "e7e5", "g2g4", "d8h4"], FakeEngine())
    assert plies[-1].eval_after == fp.EVAL_CLAMP_CP  # the mating side gained a won position


# ── Queue, reviews and alerts ─────────────────────────────────────────────────

async def _history(db, game_id, moves, bid=500, white=920001, black=920002, game_type="online", ended_at=None):
    db.add(GameHistory(game_id=game_id, white_player_id=white, black_player_id=black, bid_amount=bid,
                       game_type=game_type, moves_json=json.dumps(moves), ended_at=ended_at or _now()))
    await db.commit()


async def test_only_recent_wagered_human_games_are_queued_and_each_once(db_session, caplog):
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    await _history(db_session, "free1", ENGINE_GAME, bid=0)
    await _history(db_session, "bot1", ENGINE_GAME, black=-1, game_type="computer")
    await _history(db_session, "old1", ENGINE_GAME, ended_at=_now() - timedelta(days=30))
    await _history(db_session, "paid1", ENGINE_GAME)
    game = await fp.next_unanalysed_game(db_session)
    assert game.game_id == "paid1"
    with caplog.at_level(logging.ERROR, logger="app.services.fair_play"):
        assert sorted(await fp.screen_game(db_session, game, FakeEngine())) == [920001, 920002]
    assert "Fair-play review opened for player" in caplog.text
    assert await fp.next_unanalysed_game(db_session) is None
    rows = (await db_session.execute(select(FairPlayAnalysis).where(FairPlayAnalysis.game_id == "paid1"))).scalars().all()
    assert {r.player_id for r in rows} == {920001, 920002} and all(r.flagged for r in rows)
    assert await fp.has_open_review(db_session, 920001)


async def test_honest_game_records_analyses_without_a_review(db_session):
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    await _history(db_session, "honest1", HUMAN_GAME, white=921001, black=921002)
    game = await fp.next_unanalysed_game(db_session)
    assert game.game_id == "honest1"
    assert await fp.screen_game(db_session, game, FakeEngine()) == []
    rows = (await db_session.execute(select(FairPlayAnalysis).where(FairPlayAnalysis.game_id == "honest1"))).scalars().all()
    assert len(rows) == 2 and not any(r.flagged for r in rows) and all(r.moves_analyzed >= 20 for r in rows)
    assert not await fp.has_open_review(db_session, 921001)


async def test_a_cleared_player_is_reopened_by_a_new_flagged_game(db_session):
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    db_session.add(FairPlayReview(player_id=922001, status="cleared", first_game_id="x", flagged_games=1,
                                  opened_at=_now(), resolved_at=_now(), resolved_by=ADMIN_ID))
    await db_session.commit()
    await _history(db_session, "again1", ENGINE_GAME, white=922001, black=922002)
    game = await fp.next_unanalysed_game(db_session)
    assert game.game_id == "again1"
    assert 922001 in await fp.screen_game(db_session, game, FakeEngine())
    review = await db_session.get(FairPlayReview, 922001)
    await db_session.refresh(review)
    assert review.status == "open" and review.flagged_games == 2 and review.resolved_by is None


async def test_unreadable_moves_are_recorded_and_not_retried(db_session):
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    db_session.add(GameHistory(game_id="junk1", white_player_id=923001, black_player_id=923002, bid_amount=100,
                               game_type="online", moves_json="not json", ended_at=_now()))
    await db_session.commit()
    assert await fp.screen_game(db_session, await fp.next_unanalysed_game(db_session), FakeEngine()) == []
    assert await fp.next_unanalysed_game(db_session) is None


# ── Withdrawal hold and admin resolution ──────────────────────────────────────

async def test_a_player_under_review_has_a_small_withdrawal_held_for_admin(client, db_session, monkeypatch):
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    monkeypatch.setitem(settings.__dict__, "WITHDRAWAL_CONFIRMATION_ENABLED", False)
    db_session.add(User(telegram_id=930001, first_name="Flagged", balance=3000))
    db_session.add(FairPlayReview(player_id=930001, status="open", first_game_id="g", flagged_games=1, opened_at=_now()))
    await db_session.commit()
    res = await client.post("/api/v1/wallet/withdraw", json={"amount": 1000, "address": DEST_ADDRESS},
                            headers=_headers(930001, "Flagged"))
    assert res.status_code == 200, res.text
    db_session.expire_all()
    tx = (await db_session.execute(select(Transaction).where(
        Transaction.user_id == 930001, Transaction.type == "withdrawal"))).scalars().first()
    assert tx.status == "pending_review"  # $10 is far below the size-based review threshold


async def test_admin_lists_and_clears_a_review(client, db_session):
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    db_session.add(User(telegram_id=ADMIN_ID, first_name="Admin"))
    db_session.add(User(telegram_id=930002, first_name="Suspect", balance=500))
    db_session.add(FairPlayReview(player_id=930002, status="open", first_game_id="g9", flagged_games=1, opened_at=_now()))
    db_session.add(FairPlayAnalysis(game_id="g9", player_id=930002, color="w", moves_analyzed=24, engine_matches=23,
                                    avg_centipawn_loss=4.0, flagged=True, engine_depth=12, analyzed_at=_now()))
    await db_session.commit()
    listed = await client.get("/api/v1/admin/fair-play/reviews", headers=_headers(ADMIN_ID, "Admin"))
    assert listed.status_code == 200, listed.text
    review = listed.json()["reviews"][0]
    assert review["player_id"] == 930002 and review["games"][0]["match_rate"] == round(23 / 24, 3)
    bad = await client.post("/api/v1/admin/fair-play/reviews/930002/resolve", json={"action": "ban"},
                            headers=_headers(ADMIN_ID, "Admin"))
    assert bad.status_code == 400
    cleared = await client.post("/api/v1/admin/fair-play/reviews/930002/resolve", json={"action": "clear"},
                                headers=_headers(ADMIN_ID, "Admin"))
    assert cleared.json() == {"player_id": 930002, "status": "cleared"}
    db_session.expire_all()
    assert not await fp.has_open_review(db_session, 930002)
    forbidden = await client.get("/api/v1/admin/fair-play/reviews", headers=_headers(930002, "Suspect"))
    assert forbidden.status_code in (401, 403)
