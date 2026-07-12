"""Daily Arena: a scheduled window where everyone plays everyone.

Rationale: at a small player count, around-the-clock matchmaking starves —
concentrating demand into one daily window is the classic liquidity fix.
Players join during the live window, get auto-paired into fast free games,
score W3/D1/L0, and the top finishers earn XP prizes when the window closes.

The scheduler loop (start_arena_loop) drives the whole lifecycle:
  scheduled --(T-15m broadcast)--> live --(window ends)--> settling
  --(grace for in-flight games)--> finished (prizes + notifications)

The waiting pool lives in process memory (single-instance deployment, same
assumption as the matchmaker's in-memory fallback). Pairing is invoked by the
loop every few seconds; games are created via a callback injected from
socket_events so this module stays importable without socket.io.
"""
import asyncio
import logging
import random
from datetime import datetime, timedelta, timezone
from typing import Callable, Optional

from sqlalchemy import select, and_

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Points per result
SCORE_WIN = 3
SCORE_DRAW = 1
SCORE_LOSS = 0

# XP prizes for final standings (rank 1..N), plus participation XP for anyone
# who finished at least one game.
PRIZE_XP = [200, 100, 50]
PARTICIPATION_XP = 10

NOTIFY_BEFORE_MINUTES = 15
SETTLE_GRACE_SECONDS = 240  # let in-flight games finish before prizes
LOOP_INTERVAL_SECONDS = 4


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ArenaService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ArenaService, cls).__new__(cls)
            inst = cls._instance
            # user_id -> {'sid': str, 'elo': int, 'in_game': bool, 'last_opponent': int|None}
            inst.pool = {}
            inst.current_arena_id = None
            # end_game can fire more than once per game (abort + settle paths);
            # score each arena game exactly once
            inst._scored_games = set()
            # Set by socket_events at import time: async (uid_a, sid_a, uid_b, sid_b, tc, arena_id) -> game_id|None
            inst.create_game_callback: Optional[Callable] = None
        return cls._instance

    # ── Schedule ─────────────────────────────────────────────────────────────

    @staticmethod
    def start_time_utc() -> tuple:
        """(hour, minute) of the first daily start configured in settings."""
        times = ArenaService.start_times_utc()
        return times[0]

    @staticmethod
    def start_times_utc() -> list:
        """List of (hour, minute) tuples of daily starts, from ARENA_START_UTC 'HH:MM, HH:MM'."""
        raw = getattr(settings, "ARENA_START_UTC", "19:00") or "19:00"
        times = []
        for part in raw.split(","):
            try:
                hh, mm = part.strip().split(":")
                times.append((max(0, min(23, int(hh))), max(0, min(59, int(mm)))))
            except Exception:
                pass
        if not times:
            times = [(19, 0)]
        return sorted(times)

    @staticmethod
    def duration_minutes() -> int:
        try:
            return max(5, int(getattr(settings, "ARENA_DURATION_MINUTES", 30)))
        except Exception:
            return 30

    @classmethod
    def window_for(cls, now: datetime) -> tuple:
        """(starts_at, ends_at) of the next (or current) scheduled arena window relative to naive-UTC `now`."""
        start_configs = cls.start_times_utc()
        duration = cls.duration_minutes()
        
        candidates = []
        # Today's windows
        for hh, mm in start_configs:
            starts = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
            ends = starts + timedelta(minutes=duration)
            candidates.append((starts, ends))
            
        # Tomorrow's windows
        for hh, mm in start_configs:
            starts = now.replace(hour=hh, minute=mm, second=0, microsecond=0) + timedelta(days=1)
            ends = starts + timedelta(minutes=duration)
            candidates.append((starts, ends))
            
        # Sort chronologically
        candidates.sort(key=lambda w: w[0])
        
        # Return first window that has not fully ended yet
        for starts, ends in candidates:
            if now < ends:
                return starts, ends
                
        return candidates[0]

    # ── DB helpers ───────────────────────────────────────────────────────────

    async def get_or_create_arena(self, db, starts_at: datetime, ends_at: datetime):
        from app.models.arena import Arena
        res = await db.execute(select(Arena).where(Arena.starts_at == starts_at))
        arena = res.scalars().first()
        if not arena:
            arena = Arena(starts_at=starts_at, ends_at=ends_at, status="scheduled",
                          time_control_seconds=300)
            db.add(arena)
            await db.commit()
            await db.refresh(arena)
        return arena

    async def join(self, db, arena_id: int, user_id: int, sid: str, elo: int = 1000) -> bool:
        """Register a player (idempotent) and put them in the waiting pool."""
        from app.models.arena import Arena, ArenaPlayer
        res = await db.execute(select(Arena).where(Arena.id == arena_id))
        arena = res.scalars().first()
        if not arena or arena.status != "live":
            return False
        existing = await db.execute(
            select(ArenaPlayer).where(
                and_(ArenaPlayer.arena_id == arena_id, ArenaPlayer.user_id == user_id)
            )
        )
        if not existing.scalars().first():
            db.add(ArenaPlayer(arena_id=arena_id, user_id=user_id))
            await db.commit()
        entry = self.pool.get(user_id) or {}
        self.pool[user_id] = {
            'sid': sid,
            'elo': elo,
            'in_game': entry.get('in_game', False),
            'last_opponent': entry.get('last_opponent'),
        }
        logger.info(f"Arena {arena_id}: user {user_id} joined (pool size {len(self.pool)})")
        return True

    def leave(self, user_id: int) -> None:
        """Remove from the waiting pool (an in-flight game still counts)."""
        self.pool.pop(user_id, None)

    def update_sid(self, user_id: int, sid: str) -> None:
        entry = self.pool.get(user_id)
        if entry:
            entry['sid'] = sid

    # ── Pairing ──────────────────────────────────────────────────────────────

    async def pair_waiting_players(self) -> int:
        """Pair every two waiting players; returns number of games created."""
        if not self.create_game_callback or self.current_arena_id is None:
            return 0
        waiting = [uid for uid, e in self.pool.items() if not e.get('in_game')]
        if len(waiting) < 2:
            return 0
        random.shuffle(waiting)

        created = 0
        used = set()
        for uid in waiting:
            if uid in used:
                continue
            entry = self.pool.get(uid)
            if entry is None:
                continue
            # Prefer an opponent we didn't just play
            candidates = [o for o in waiting if o != uid and o not in used]
            if not candidates:
                continue
            fresh = [o for o in candidates if o != entry.get('last_opponent')]
            opp = (fresh or candidates)[0]
            opp_entry = self.pool.get(opp)
            if opp_entry is None:
                continue

            entry['in_game'] = True
            opp_entry['in_game'] = True
            used.add(uid)
            used.add(opp)
            try:
                game_id = await self.create_game_callback(
                    uid, entry['sid'], opp, opp_entry['sid'],
                    300, self.current_arena_id
                )
                if game_id:
                    entry['last_opponent'] = opp
                    opp_entry['last_opponent'] = uid
                    created += 1
                    logger.info(f"Arena {self.current_arena_id}: paired {uid} vs {opp} in {game_id}")
                else:
                    entry['in_game'] = False
                    opp_entry['in_game'] = False
            except Exception as e:
                logger.error(f"Arena pairing failed for {uid} vs {opp}: {e}", exc_info=True)
                entry['in_game'] = False
                opp_entry['in_game'] = False
        return created

    # ── Scoring ──────────────────────────────────────────────────────────────

    @staticmethod
    def parse_arena_id(game_id: str) -> Optional[int]:
        """Arena game ids look like arena{arena_id}_{p1}_{p2}_{ts}."""
        if not game_id.startswith("arena"):
            return None
        try:
            return int(game_id.split("_", 1)[0][len("arena"):])
        except (ValueError, IndexError):
            return None

    async def record_result(self, game_id: str, state) -> None:
        """Score a settled arena game and put both players back in rotation.
        Called from GameService.end_game; must never raise."""
        arena_id = self.parse_arena_id(game_id)
        if arena_id is None:
            return
        from app.core.database import AsyncSessionLocal
        from app.models.arena import Arena, ArenaPlayer

        white_id, black_id = state.white_player_id, state.black_player_id
        aborted = (state.result_type == 'aborted')
        already_scored = game_id in self._scored_games
        self._scored_games.add(game_id)
        if len(self._scored_games) > 5000:
            self._scored_games.clear()

        async with AsyncSessionLocal() as db:
            res = await db.execute(select(Arena).where(Arena.id == arena_id))
            arena = res.scalars().first()
            if arena and not aborted and not already_scored:
                for uid in (white_id, black_id):
                    pres = await db.execute(
                        select(ArenaPlayer).where(
                            and_(ArenaPlayer.arena_id == arena_id, ArenaPlayer.user_id == uid)
                        ).with_for_update()
                    )
                    player = pres.scalars().first()
                    if not player:
                        continue
                    player.games_played += 1
                    if state.winner is None:
                        player.draws += 1
                        player.score += SCORE_DRAW
                    elif (state.winner == 'w') == (uid == white_id):
                        player.wins += 1
                        player.score += SCORE_WIN
                    else:
                        player.losses += 1
                        player.score += SCORE_LOSS
                await db.commit()

            arena_live = arena is not None and arena.status == "live"

        # Back into the waiting pool (unless they left or the window closed)
        for uid in (white_id, black_id):
            entry = self.pool.get(uid)
            if entry:
                entry['in_game'] = False
                if not arena_live:
                    self.pool.pop(uid, None)

    # ── Standings & prizes ───────────────────────────────────────────────────

    @staticmethod
    def _rank_key(p):
        # score desc, wins desc, games asc (fewer games for same score = stronger), earliest join
        return (-p.score, -p.wins, p.games_played, p.joined_at)

    async def standings(self, db, arena_id: int, limit: int = 10):
        from app.models.arena import ArenaPlayer
        res = await db.execute(select(ArenaPlayer).where(ArenaPlayer.arena_id == arena_id))
        players = sorted(res.scalars().all(), key=self._rank_key)
        return players[:limit] if limit else players

    async def award_prizes(self, db, arena_id: int) -> list:
        """Give XP prizes for the final standings. Returns [(user_tid, rank, xp)]."""
        from app.crud import user as user_crud
        from app.services.gamification_service import GamificationService

        players = await self.standings(db, arena_id, limit=0)
        awarded = []
        for rank, p in enumerate(players, start=1):
            if p.games_played == 0:
                continue
            # Podium XP requires actually scoring — otherwise a tiny arena
            # would pay 100+ XP for joining and losing a single game.
            if rank <= len(PRIZE_XP) and p.score > 0:
                xp = PRIZE_XP[rank - 1]
            else:
                xp = PARTICIPATION_XP
            user = await user_crud.get_user_by_telegram_id(db, p.user_id, for_update=True)
            if not user:
                continue
            await GamificationService.add_xp(
                db, user, xp, trigger_kickback=False, apply_booster=False,
                commit=False, reason="arena_prize", reference_id=str(arena_id)
            )
            awarded.append((p.user_id, rank, xp))
        await db.commit()
        return awarded


# ── Scheduler loop ───────────────────────────────────────────────────────────

async def _broadcast_arena_soon(db, arena) -> None:
    """T-15min heads-up, region-targeted to the users this slot best fits.

    Only users whose best-fit arena is THIS one are notified (see
    app.services.arena_targeting), so running several arenas a day still means
    ~1 heads-up per user. Skips silently on per-user failure.
    """
    from app.services.arena_targeting import targeted_telegram_ids
    from app.services.telegram_bot import TelegramService

    hh = arena.starts_at.hour
    mm = arena.starts_at.minute
    slots = ArenaService.start_times_utc()
    tids = await targeted_telegram_ids(db, hh, mm, slots)
    msg = (
        f"🏟️ <b>Daily Arena starts in {NOTIFY_BEFORE_MINUTES} minutes!</b>\n\n"
        f"⚡ {ArenaService.duration_minutes()} minutes of rapid-fire 5-minute chess — "
        f"play as many opponents as you can.\n"
        f"🏆 Scoring: win 3 · draw 1. Top finishers earn "
        f"{'/'.join(str(x) for x in PRIZE_XP)} XP, everyone who plays gets +{PARTICIPATION_XP} XP.\n\n"
        f"Open the app and hit <b>Join Arena</b> when the clock strikes {hh:02d}:{mm:02d} UTC! ♟️\n\n"
        f"<i>🔕 Mute these in Settings → Arena alerts.</i>"
    )
    sent = 0
    for tid in tids:
        try:
            await TelegramService.send_notification(tid, msg)
            sent += 1
            await asyncio.sleep(0.05)  # stay under Telegram broadcast rate limits
        except Exception:
            pass
    logger.info(
        f"Arena {arena.id} (slot {hh:02d}:{mm:02d}): heads-up dispatched to "
        f"{sent}/{len(tids)} targeted users"
    )


async def _notify_results(db, arena, awarded) -> None:
    from app.services.telegram_bot import TelegramService
    medals = {1: "🥇", 2: "🥈", 3: "🥉"}
    for user_tid, rank, xp in awarded:
        try:
            place = medals.get(rank, f"#{rank}")
            await TelegramService.send_notification(
                user_tid,
                f"🏟️ <b>Daily Arena finished!</b>\n\n"
                f"{place} You finished <b>#{rank}</b> and earned <b>+{xp} XP</b>.\n\n"
                f"<i>Same time tomorrow — defend your spot! ♟️</i>"
            )
            await asyncio.sleep(0.05)
        except Exception:
            pass


async def _tick(service: ArenaService) -> None:
    from app.core.database import AsyncSessionLocal
    from app.models.arena import Arena

    now = _utcnow()

    async with AsyncSessionLocal() as db:
        # 1. An active (live/settling) arena is driven by its OWN clock — this
        #    also cleans up an arena left dangling by a mid-window restart.
        res = await db.execute(select(Arena).where(Arena.status.in_(["live", "settling"])))
        active = res.scalars().first()
        if active:
            service.current_arena_id = active.id
            if active.status == "live":
                if now >= active.ends_at:
                    active.status = "settling"
                    await db.commit()
                    logger.info(f"Arena {active.id} window closed; settling in-flight games")
                else:
                    await service.pair_waiting_players()
            elif now >= active.ends_at + timedelta(seconds=SETTLE_GRACE_SECONDS):
                awarded = await service.award_prizes(db, active.id)
                active.status = "finished"
                active.finished_at = now
                await db.commit()
                service.current_arena_id = None
                service.pool.clear()
                logger.info(f"Arena {active.id} finished; {len(awarded)} players awarded")
                asyncio.create_task(_notify_results_with_session(active.id, awarded))
            return

        # 2. No active arena: manage the next scheduled window
        starts_at, ends_at = ArenaService.window_for(now)
        arena = await service.get_or_create_arena(db, starts_at, ends_at)

        if arena.status == "scheduled":
            if now >= arena.starts_at:
                arena.status = "live"
                await db.commit()
                service.current_arena_id = arena.id
                service.pool.clear()
                logger.info(f"Arena {arena.id} is LIVE until {arena.ends_at} UTC")
            elif (arena.notified_at is None
                  and now >= arena.starts_at - timedelta(minutes=NOTIFY_BEFORE_MINUTES)):
                arena.notified_at = now
                await db.commit()
                asyncio.create_task(_broadcast_with_session(arena.id))


async def _broadcast_with_session(arena_id: int) -> None:
    from app.core.database import AsyncSessionLocal
    from app.models.arena import Arena
    try:
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(Arena).where(Arena.id == arena_id))
            arena = res.scalars().first()
            if arena:
                await _broadcast_arena_soon(db, arena)
    except Exception as e:
        logger.error(f"Arena announcement broadcast failed: {e}", exc_info=True)


async def _notify_results_with_session(arena_id: int, awarded) -> None:
    from app.core.database import AsyncSessionLocal
    from app.models.arena import Arena
    try:
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(Arena).where(Arena.id == arena_id))
            arena = res.scalars().first()
            if arena:
                await _notify_results(db, arena, awarded)
    except Exception as e:
        logger.error(f"Arena results notification failed: {e}", exc_info=True)


async def start_arena_loop():
    """Background loop driving the daily arena lifecycle."""
    await asyncio.sleep(20)  # let startup settle
    service = ArenaService()

    # Recover a live/settling arena after a container restart
    try:
        from app.core.database import AsyncSessionLocal
        from app.models.arena import Arena
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(Arena).where(Arena.status.in_(["live", "settling"])))
            arena = res.scalars().first()
            if arena:
                service.current_arena_id = arena.id
                logger.info(f"Arena loop recovered arena {arena.id} in status {arena.status}")
    except Exception as e:
        logger.warning(f"Arena recovery check failed: {e}")

    logger.info("Background daily-arena loop started.")
    while True:
        try:
            await _tick(service)
        except Exception as e:
            logger.error(f"Arena loop error: {e}", exc_info=True)
        await asyncio.sleep(LOOP_INTERVAL_SECONDS)
