"""
Durable, worker-independent safety net for wager games that are matched but
never actually start.

A matched PVP wager game locks both players' stakes immediately, but the game
only ends via one of:
  * a move being made, then the clock running out (handled lazily in
    GameService.get_game_state), or
  * GameService.monitor_first_move_abort — an in-process asyncio timer started
    at match time that aborts + refunds if the first move never comes.

That abort timer is ephemeral: if the container that started it restarts,
redeploys (Railway auto-deploys on push), or the task is lost, a never-started
game sits with last_move_at=None forever. The lazy clock timeout never fires
for it (no last_move_at), so both players' wagers stay locked until the 24h
Redis TTL silently drops the game — with NO refund.

This sweeper is the backstop: an independent background loop (like the deposit /
withdrawal crawlers) that periodically finds such games and aborts + refunds
them via GameService.end_game. end_game writes a unique GameHistory row per
game_id, so it is idempotent across callers and across multiple containers —
whichever instance gets there first refunds, the rest are no-ops.
"""
import asyncio
import logging
import time

from app.services.game_service import GameService

logger = logging.getLogger(__name__)

# A matched wager game with no first move after this long is dead. Comfortably
# past the 30s in-process first-move abort so we never race a healthy game.
STALE_GRACE_SECONDS = 120
SWEEP_INTERVAL_SECONDS = 60

# A sweep that fails is retried on the next tick, so a momentary Redis/network
# blip is self-healing and must not page admins. Only a sustained inability to
# sweep is an incident: never-started wager games stay locked while it lasts.
SWEEP_FAILURES_BEFORE_ALERT = 5
# While an outage persists, re-alert only this often (in sweeps).
SWEEP_ALERT_REMINDER_SWEEPS = 10


def is_sweepable(state, now: float, grace: float = STALE_GRACE_SECONDS) -> bool:
    """
    True only for a *matched human* game that has NEVER started and is now stale:
      - not already over,
      - both real human players joined (excludes AI = -1 and unfilled lobbies),
      - no move was ever made (last_move_at is None), and
      - its first-move grace plus a safety margin has elapsed since matching.
    Started-but-abandoned games are intentionally left to the clock-timeout path
    (a real forfeit, not a refund); unfilled free invitations remain shareable until their normal TTL.
    """
    if state is None or state.is_game_over:
        return False
    white_id = state.white_player_id
    black_id = state.black_player_id
    if not white_id or white_id == -1:
        return False
    if not black_id or black_id == -1:
        return False
    if state.last_move_at is not None:
        return False
    created = getattr(state, "created_at", None)
    if not created:
        # Pre-existing games from before created_at was tracked: leave them to
        # the 24h TTL / reconnect self-heal rather than guess their age.
        return False
    matched = getattr(state, "matched_at", None)
    if getattr(state, "bid_amount", 0) <= 0 and not matched:
        return False  # legacy free games have no reliable match timestamp
    minimum_age = max(grace, (getattr(state, "first_move_grace_seconds", None) or 30) + 60)
    return (now - (matched or created)) >= minimum_age


def is_clock_expired(state, now: float) -> bool:
    """
    True if an ongoing game's active turn clock has run down to <= 0.
    In production, if both players abandon the game or lose connection,
    lazy evaluation would otherwise never run, leaving stakes in escrow.
    """
    if state is None or state.is_game_over:
        return False
    if state.last_move_at is None:
        return False
    elapsed = now - state.last_move_at
    if state.turn == 'w':
        return (state.white_time_left - elapsed) <= 0.0
    else:
        return (state.black_time_left - elapsed) <= 0.0


async def _sweep_once(service: GameService) -> int:
    sm = service.session_manager
    now = time.time()

    game_ids = []
    if sm._use_memory or not sm.redis:
        active_games = sm._memory_store.get("games:active", set()) | sm._memory_store.get("games:unsettled", set())
        game_ids = list(active_games)
    else:
        # No fallback path here: the former scan() fallback used the same Redis
        # connection, so whenever smembers failed for the reason that actually
        # occurs in production — Redis being unreachable — the fallback failed
        # identically and turned a blip into a loop-level error. Let the failure
        # propagate to the caller, which counts it toward a sustained outage.
        game_ids = [g.decode() if isinstance(g, bytes) else g for g in await sm.redis.sunion("games:active", "games:unsettled")]

    swept = 0
    for gid in game_ids:
        try:
            state = await sm.get_game(gid)
            if state is None:
                # Ghost key: game state deleted or expired from Redis; prune from active set
                if not sm._use_memory and sm.redis:
                    await sm.redis.srem("games:active", gid)
                    await sm.redis.srem("games:unsettled", gid)
                elif sm._use_memory and "games:active" in sm._memory_store:
                    sm._memory_store["games:active"].discard(gid)
                continue

            if state.is_game_over:
                await service.end_game(gid, state)
                swept += 1
            elif is_sweepable(state, now):
                logger.info(
                    f"[StaleSweeper] Aborting + refunding never-started human game {gid} "
                    f"(age {int(now - state.created_at)}s, bid {state.bid_amount})"
                )
                state.is_game_over = True
                state.winner = None
                state.result_type = "aborted"
                await sm.save_game(gid, state)
                await service.end_game(gid, state)  # idempotent: unique GameHistory per game_id
                swept += 1
            elif is_clock_expired(state, now):
                logger.info(
                    f"[StaleSweeper] Settling abandoned game {gid} with expired clock "
                    f"(turn: {state.turn})"
                )
                # get_game_state dynamically detects timeout, sets winner, saves state, and calls end_game
                await service.get_game_state(gid)
                swept += 1
        except Exception as e:
            logger.warning(f"[StaleSweeper] Failed to sweep game {gid}: {e}")
    return swept


async def start_stale_game_sweeper():
    """Background loop that aborts + refunds never-started wager games."""
    await asyncio.sleep(25)  # let startup settle
    logger.info("Background stale-game sweeper started.")
    service = GameService()
    consecutive_failures = 0
    while True:
        try:
            await _sweep_once(service)
            if consecutive_failures:
                logger.info(
                    f"Stale-game sweeper recovered after {consecutive_failures} consecutive failed sweeps."
                )
            consecutive_failures = 0
        except Exception as e:
            consecutive_failures += 1
            # Alert at the threshold, then only as a periodic reminder: the
            # count varies per sweep, and alert fingerprinting dedupes on the
            # message's first line, so alerting every tick would page each
            # minute for the whole outage.
            failures_past_threshold = consecutive_failures - SWEEP_FAILURES_BEFORE_ALERT
            if failures_past_threshold >= 0 and failures_past_threshold % SWEEP_ALERT_REMINDER_SWEEPS == 0:
                # Keep the first line stable and distinguishing — alert
                # fingerprinting dedupes on it.
                logger.error(
                    "Stale-game sweeper sustained outage: never-started wager games are not being refunded\n"
                    f"Failed sweeps: {consecutive_failures} consecutive "
                    f"(~{consecutive_failures * SWEEP_INTERVAL_SECONDS}s)\n"
                    f"Last error: {e}",
                    exc_info=True,
                )
            else:
                logger.warning(
                    f"Stale-game sweeper loop error ({consecutive_failures}/{SWEEP_FAILURES_BEFORE_ALERT} "
                    f"before alerting): {e}"
                )
        await asyncio.sleep(SWEEP_INTERVAL_SECONDS)
