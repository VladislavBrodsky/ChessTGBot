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


def is_sweepable(state, now: float, grace: float = STALE_GRACE_SECONDS) -> bool:
    """
    True only for a *matched wager* game that has NEVER started and is now stale:
      - not already over,
      - has a wager (bid_amount > 0),
      - both real human players joined (excludes AI = -1 and unfilled lobbies),
      - no move was ever made (last_move_at is None), and
      - it was created more than `grace` seconds ago.
    Started-but-abandoned games are intentionally left to the clock-timeout path
    (a real forfeit, not a refund); unfilled/no-opponent lobbies are handled by
    heal_zombie_wagers on reconnect.
    """
    if state is None or state.is_game_over:
        return False
    if getattr(state, "bid_amount", 0) <= 0:
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
    return (now - created) >= grace


async def _sweep_once(service: GameService) -> int:
    sm = service.session_manager
    now = time.time()

    game_ids = []
    if sm._use_memory or not sm.redis:
        active_games = sm._memory_store.get("games:active", set())
        game_ids = list(active_games)
    else:
        try:
            game_ids = [g.decode() if isinstance(g, bytes) else g for g in await sm.redis.smembers("games:active")]
        except Exception as e:
            logger.warning(f"[StaleSweeper] Failed to fetch active games set from Redis: {e}. Falling back to scan.")
            cursor = 0
            while True:
                cursor, keys = await sm.redis.scan(cursor, match="game:*", count=100)
                game_ids.extend(k.split(":", 1)[1] for k in keys)
                if cursor == 0:
                    break

    swept = 0
    for gid in game_ids:
        try:
            state = await sm.get_game(gid)
            if not is_sweepable(state, now):
                continue
            logger.info(
                f"[StaleSweeper] Aborting + refunding never-started wager game {gid} "
                f"(age {int(now - state.created_at)}s, bid {state.bid_amount})"
            )
            state.is_game_over = True
            state.winner = None
            state.result_type = "aborted"
            await sm.save_game(gid, state)
            await service.end_game(gid, state)  # idempotent: unique GameHistory per game_id
            swept += 1
        except Exception as e:
            logger.warning(f"[StaleSweeper] Failed to sweep game {gid}: {e}")
    return swept


async def start_stale_game_sweeper():
    """Background loop that aborts + refunds never-started wager games."""
    await asyncio.sleep(25)  # let startup settle
    logger.info("Background stale-game sweeper started.")
    service = GameService()
    while True:
        try:
            await _sweep_once(service)
        except Exception as e:
            logger.error(f"Stale-game sweeper loop error: {e}", exc_info=True)
        await asyncio.sleep(SWEEP_INTERVAL_SECONDS)
