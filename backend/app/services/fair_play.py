"""Post-hoc fair-play screening of wagered games.

Real-money chess has one dominant threat: a player relaying moves from an engine.
After a wagered human game ends, a background worker replays it through Stockfish
and measures, for each player, how often they played the engine's top move and how
many centipawns they lost per move. A player whose game looks engine-assisted is
put under review: every withdrawal they request is held in the admin pending_review
queue (see wallet.py) and a SECURITY alert is raised. Nothing else changes — games,
results and balances are untouched — and the owner clears or upholds the review.

Thresholds are deliberately conservative: this screens for review, it does not
convict. Opening moves, forced moves (one legal reply) and positions that are
already decided are excluded, because strong humans match the engine there too.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import shutil
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional

import chess
import chess.engine
from sqlalchemy import and_, select
from sqlalchemy.exc import IntegrityError

from app.models.fair_play import FairPlayAnalysis, FairPlayReview
from app.models.game_history import GameHistory

logger = logging.getLogger(__name__)

ENGINE_DEPTH = int(os.getenv("FAIR_PLAY_ENGINE_DEPTH", "12"))
OPENING_PLIES = 16          # skip each side's first 8 moves (book territory)
DECIDED_CP = 600            # skip positions already won or lost by more than this
EVAL_CLAMP_CP = 1000        # mate scores and huge evals are clamped before diffing
MIN_MOVES_FOR_VERDICT = 20  # judged moves a player needs before a game can flag
FLAG_MATCH_RATE = 0.90      # share of judged moves equal to the engine's top move
FLAG_MAX_ACPL = 10.0        # average centipawn loss per judged move
LOOKBACK_DAYS = 14          # only wagered games that ended this recently are queued
LOOP_INTERVAL_SECONDS = 20
OPEN_STATUSES = ("open", "upheld")


@dataclass(frozen=True)
class PlyEval:
    """The engine's view of one played move, from the mover's point of view."""
    ply: int
    mover: str               # 'w' or 'b'
    played: str              # UCI
    best: Optional[str]      # engine top move in the position before the move
    eval_before: int         # centipawns, mover's POV, clamped
    eval_after: int          # centipawns, mover's POV, clamped
    legal_moves: int


@dataclass(frozen=True)
class PlayerScore:
    moves_analyzed: int
    engine_matches: int
    avg_centipawn_loss: Optional[float]

    @property
    def match_rate(self) -> Optional[float]:
        return self.engine_matches / self.moves_analyzed if self.moves_analyzed else None


def _clamp(cp: int) -> int:
    return max(-EVAL_CLAMP_CP, min(EVAL_CLAMP_CP, cp))


def is_judged(p: PlyEval) -> bool:
    """Only moves where a human has a real, open choice tell us anything."""
    return p.ply >= OPENING_PLIES and p.legal_moves > 1 and abs(p.eval_before) <= DECIDED_CP


def score_player(plies: Iterable[PlyEval], color: str) -> PlayerScore:
    judged = [p for p in plies if p.mover == color and is_judged(p)]
    if not judged:
        return PlayerScore(0, 0, None)
    matches = sum(1 for p in judged if p.best is not None and p.played == p.best)
    losses = [max(0, p.eval_before - p.eval_after) for p in judged]
    return PlayerScore(len(judged), matches, round(sum(losses) / len(losses), 2))


def is_flagged(score: PlayerScore) -> bool:
    return (score.moves_analyzed >= MIN_MOVES_FOR_VERDICT
            and score.match_rate is not None and score.match_rate >= FLAG_MATCH_RATE
            and score.avg_centipawn_loss is not None and score.avg_centipawn_loss <= FLAG_MAX_ACPL)


async def _position_eval(engine, board: chess.Board, depth: int) -> tuple[int, Optional[str]]:
    """Evaluation (side to move's POV) and the engine's best move for one position."""
    if board.is_game_over():
        if board.is_checkmate():
            return -EVAL_CLAMP_CP, None
        return 0, None
    info = await engine.analyse(board, chess.engine.Limit(depth=depth))
    score = info["score"].pov(board.turn).score(mate_score=10_000)
    pv = info.get("pv") or []
    return _clamp(score if score is not None else 0), (pv[0].uci() if pv else None)


async def evaluate_moves(moves: list[str], engine, depth: int = ENGINE_DEPTH) -> list[PlyEval]:
    """Analyse every position of a game once and turn it into per-move evaluations."""
    board = chess.Board()
    positions: list[tuple[int, Optional[str], int, str]] = []  # eval, best, legal count, mover
    played: list[str] = []
    for uci in moves:
        move = chess.Move.from_uci(uci)
        if move not in board.legal_moves:
            break  # corrupt history: judge only the legal prefix
        ev, best = await _position_eval(engine, board, depth)
        positions.append((ev, best, board.legal_moves.count(), 'w' if board.turn == chess.WHITE else 'b'))
        played.append(uci)
        board.push(move)
    final_eval, _ = await _position_eval(engine, board, depth)
    evals = [p[0] for p in positions] + [final_eval]
    return [PlyEval(ply=i, mover=mover, played=played[i], best=best, eval_before=ev,
                    eval_after=-evals[i + 1], legal_moves=legal)
            for i, (ev, best, legal, mover) in enumerate(positions)]


def stockfish_path() -> Optional[str]:
    path = os.getenv("STOCKFISH_PATH") or shutil.which("stockfish") or "/usr/games/stockfish"
    return path if path and os.path.isfile(path) and os.access(path, os.X_OK) else None


async def has_open_review(db, player_id: int) -> bool:
    row = await db.get(FairPlayReview, player_id)
    return bool(row and row.status in OPEN_STATUSES)


async def _open_review(db, player_id: int, game_id: str) -> bool:
    """Open (or extend) a review; returns True when a new review was opened."""
    row = await db.get(FairPlayReview, player_id, with_for_update=True)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if row is None:
        db.add(FairPlayReview(player_id=player_id, status="open", first_game_id=game_id,
                              flagged_games=1, opened_at=now))
        return True
    row.flagged_games += 1
    if row.status == "cleared":
        row.status, row.first_game_id, row.opened_at = "open", game_id, now
        row.resolved_at = row.resolved_by = None
        return True
    return False


async def next_unanalysed_game(db, now: Optional[datetime] = None) -> Optional[GameHistory]:
    now = now or datetime.now(timezone.utc).replace(tzinfo=None)
    analysed = select(FairPlayAnalysis.game_id).where(FairPlayAnalysis.game_id == GameHistory.game_id)
    result = await db.execute(
        select(GameHistory)
        .where(and_(GameHistory.bid_amount > 0, GameHistory.game_type == "online",
                    GameHistory.white_player_id > 0, GameHistory.black_player_id > 0,
                    GameHistory.game_id.is_not(None), GameHistory.moves_json.is_not(None),
                    GameHistory.ended_at >= now - timedelta(days=LOOKBACK_DAYS),
                    ~analysed.exists()))
        .order_by(GameHistory.ended_at)
        .limit(1))
    return result.scalars().first()


async def screen_game(db, history: GameHistory, engine, depth: int = ENGINE_DEPTH) -> list[int]:
    """Analyse one finished wagered game; returns the player ids newly put under review."""
    try:
        moves = json.loads(history.moves_json or "[]")
    except (TypeError, ValueError):
        moves = []
    try:
        plies = await evaluate_moves([m for m in moves if isinstance(m, str)], engine, depth) if moves else []
    except chess.engine.EngineTerminatedError:
        raise
    except (chess.engine.EngineError, ValueError) as exc:
        # Record it as unjudgeable instead of retrying the same game forever.
        logger.warning(f"Fair-play analysis skipped game {history.game_id}: {exc}")
        plies = []
    newly_reviewed: list[int] = []
    for color, player_id in (("w", history.white_player_id), ("b", history.black_player_id)):
        score = score_player(plies, color)
        flagged = is_flagged(score)
        db.add(FairPlayAnalysis(game_id=history.game_id, player_id=player_id, color=color,
                                moves_analyzed=score.moves_analyzed, engine_matches=score.engine_matches,
                                avg_centipawn_loss=score.avg_centipawn_loss, flagged=flagged,
                                engine_depth=depth))
        if flagged and await _open_review(db, player_id, history.game_id):
            newly_reviewed.append(player_id)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()  # another owner analysed it first
        return []
    for player_id in newly_reviewed:
        score = score_player(plies, "w" if player_id == history.white_player_id else "b")
        # First line is the dedupe fingerprint: keep the player id on it.
        logger.error(
            f"Fair-play review opened for player {player_id}\n"
            f"Game {history.game_id} (${(history.bid_amount or 0) / 100:.2f} stake): "
            f"{score.engine_matches}/{score.moves_analyzed} engine top moves, "
            f"average loss {score.avg_centipawn_loss} cp. Their withdrawals are held for admin review.")
    return newly_reviewed


async def start_fair_play_screening():
    """Background loop: analyse finished wagered games one at a time."""
    from app.core.database import AsyncSessionLocal
    await asyncio.sleep(30)
    path = stockfish_path()
    if not path:
        logger.warning("Fair-play screening disabled: Stockfish binary not found (set STOCKFISH_PATH)")
        while True:  # an owned service must not exit
            await asyncio.sleep(3600)
    logger.info(f"Fair-play screening started with {path} at depth {ENGINE_DEPTH}")
    transport, engine = await chess.engine.popen_uci(path)
    try:
        await engine.configure({"Threads": 1, "Hash": 16})
        while True:
            try:
                async with AsyncSessionLocal() as db:
                    game = await next_unanalysed_game(db)
                    if game is not None:
                        await screen_game(db, game, engine)
                        await asyncio.sleep(1)
                        continue
            except chess.engine.EngineTerminatedError:
                raise
            except Exception as exc:
                logger.warning(f"Fair-play screening pass failed: {exc}")
            await asyncio.sleep(LOOP_INTERVAL_SECONDS)
    finally:
        try:
            await engine.quit()
        except Exception:
            transport.close()
