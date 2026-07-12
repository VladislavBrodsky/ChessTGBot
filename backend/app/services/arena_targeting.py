"""Region-aware targeting for daily-arena heads-up notifications.

The platform runs several arenas a day (see ARENA_START_UTC), but blasting the
whole user base for every one is the fastest way to get the bot muted/blocked.
Instead each user is assigned to exactly ONE arena slot — the one landing in
their local prime hours — so a user gets ~1 heads-up per day no matter how many
arenas run.

Assignment signal, strongest first:
  1. Explicit `user.region` (self-declared bucket) — wins once set.
  2. Behaviour: the user's peak play-hour (UTC) mined from game_history.
  3. `user.preferred_language` → a representative UTC offset.

Eligibility on top of assignment:
  - never `is_blocked`, never `arena_notifications = False`;
  - dormant users (no game in 30d) are tapered to ~1 heads-up/week so people
    who've drifted away aren't pinged daily into blocking the bot.

Profiles are mined in one pass and cached for a few hours — game behaviour
barely shifts intra-day, and this runs in a single-instance deployment (same
assumption as the arena pool / matchmaker in-memory state).
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select, func, union_all

logger = logging.getLogger(__name__)

# Prime chess hour, local time, that we aim the heads-up to precede.
PRIME_LOCAL_HOUR = 19

# Coarse self-declared region -> representative UTC offset (hours).
REGION_OFFSETS = {
    "americas": -5,
    "europe_africa": 1,
    "mena_sasia": 5,
    "apac": 8,
}

# Language -> representative UTC offset, used only when we have neither an
# explicit region nor enough play history. Deliberately coarse; 'en' is global
# so it defaults to UTC (broadest EU-evening / Americas-afternoon overlap).
LANGUAGE_OFFSETS = {
    "en": 0,
    "es": -5,
    "pt": -3,
    "fr": 1,
    "de": 1,
    "ru": 3,
    "ar": 3,
    "hi": 6,
    "ja": 9,
    "zh": 8,
}

BEHAVIOUR_LOOKBACK_DAYS = 45
BEHAVIOUR_MIN_GAMES = 5
DORMANT_AFTER_DAYS = 30
PROFILE_TTL_SECONDS = 6 * 3600


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _circular_hour_distance(a: float, b: float) -> float:
    """Distance between two clock hours, wrapping at 24."""
    d = abs(a - b) % 24
    return min(d, 24 - d)


def nearest_slot(target_hour: float, slots: list) -> Optional[tuple]:
    """Pick the (hh, mm) slot whose start is circularly nearest target_hour.

    Ties break to the earlier slot for determinism.
    """
    if not slots:
        return None
    best = None
    best_dist = None
    for hh, mm in slots:
        dist = _circular_hour_distance(target_hour, hh + mm / 60.0)
        if best_dist is None or dist < best_dist:
            best_dist = dist
            best = (hh, mm)
    return best


class _ProfileCache:
    """Per-user (assigned_hour, last_active) mined from behaviour, cached."""

    def __init__(self):
        self.built_at: Optional[datetime] = None
        # telegram_id -> {"peak_hour": float|None, "last_active": datetime|None}
        self.profiles: dict = {}

    def is_fresh(self) -> bool:
        return (
            self.built_at is not None
            and (_utcnow() - self.built_at).total_seconds() < PROFILE_TTL_SECONDS
        )


_cache = _ProfileCache()


async def _rebuild_profiles(db) -> None:
    """Mine peak play-hour and last-active per player from game_history."""
    from app.models.game_history import GameHistory

    cutoff = _utcnow() - timedelta(days=BEHAVIOUR_LOOKBACK_DAYS)
    gh = GameHistory
    white = select(gh.white_player_id.label("pid"), gh.created_at.label("ts"))
    black = select(gh.black_player_id.label("pid"), gh.created_at.label("ts"))
    unified = union_all(white, black).subquery()

    # Hour histogram (within lookback) for peak-hour detection.
    hour_rows = await db.execute(
        select(
            unified.c.pid,
            func.extract("hour", unified.c.ts).label("hr"),
            func.count().label("n"),
        )
        .where(unified.c.ts >= cutoff)
        .group_by(unified.c.pid, func.extract("hour", unified.c.ts))
    )

    # peak hour = the hour with the most games; tie-break to the earlier hour.
    best: dict = {}  # pid -> (n, hour)
    for pid, hr, n in hour_rows.all():
        if pid is None:
            continue
        n = int(n)
        hr = int(hr)
        cur = best.get(pid)
        if cur is None or n > cur[0] or (n == cur[0] and hr < cur[1]):
            best[pid] = (n, hr)
    # Total games in the window, per player, for the min-games gate.
    total_rows = await db.execute(
        select(unified.c.pid, func.count().label("n"))
        .where(unified.c.ts >= cutoff)
        .group_by(unified.c.pid)
    )
    totals = {pid: int(n) for pid, n in total_rows.all() if pid is not None}

    # Last-active across all history (not just lookback) for dormancy.
    last_rows = await db.execute(
        select(unified.c.pid, func.max(unified.c.ts)).group_by(unified.c.pid)
    )
    last_active = {pid: ts for pid, ts in last_rows.all() if pid is not None}

    profiles: dict = {}
    pids = set(best) | set(last_active)
    for pid in pids:
        peak = None
        if totals.get(pid, 0) >= BEHAVIOUR_MIN_GAMES and pid in best:
            peak = float(best[pid][1])
        profiles[pid] = {"peak_hour": peak, "last_active": last_active.get(pid)}

    _cache.profiles = profiles
    _cache.built_at = _utcnow()
    logger.info(f"Arena targeting: rebuilt {len(profiles)} behaviour profiles")


def _target_hour_for(user_region, preferred_language, peak_hour) -> float:
    """Resolve a user's target UTC hour from the strongest available signal."""
    # 1. Explicit region wins.
    if user_region and user_region in REGION_OFFSETS:
        return (PRIME_LOCAL_HOUR - REGION_OFFSETS[user_region]) % 24
    # 2. Behaviour: peak play-hour is already in UTC — aim straight at it.
    if peak_hour is not None:
        return peak_hour
    # 3. Language fallback.
    offset = LANGUAGE_OFFSETS.get((preferred_language or "en"), 0)
    return (PRIME_LOCAL_HOUR - offset) % 24


async def targeted_telegram_ids(db, slot_hh: int, slot_mm: int, slots: list) -> list:
    """telegram_ids to notify for the arena starting at (slot_hh, slot_mm).

    A user is included when their best-fit slot equals this one AND they pass
    the eligibility filters.
    """
    from app.models.user import User

    if not _cache.is_fresh():
        try:
            await _rebuild_profiles(db)
        except Exception as e:
            logger.error(f"Arena targeting profile rebuild failed: {e}", exc_info=True)
            # Fall back to empty profiles: assignment still works via region/lang.
            _cache.profiles = {}
            _cache.built_at = _utcnow()

    res = await db.execute(
        select(
            User.telegram_id, User.region, User.preferred_language
        ).where(
            User.telegram_id.isnot(None),
            User.telegram_id > 0,
            User.is_blocked.is_(False),
            User.arena_notifications.is_(True),
        )
    )

    now = _utcnow()
    this_slot = (slot_hh, slot_mm)
    weekday = now.weekday()
    out = []
    for tid, region, lang in res.all():
        prof = _cache.profiles.get(tid) or {}
        peak = prof.get("peak_hour")
        target = _target_hour_for(region, lang, peak)
        if nearest_slot(target, slots) != this_slot:
            continue

        # Dormancy taper: a LAPSED player (played, but not in 30d) is pinged at
        # most ~1x/week, on a stable per-user weekday, so someone who drifted
        # away isn't pinged daily into blocking. Never-played users (last_active
        # None — includes brand-new signups) are NOT tapered: they're the prime
        # activation target and should get their region-timed daily heads-up.
        last_active = prof.get("last_active")
        lapsed = last_active is not None and (now - last_active).days > DORMANT_AFTER_DAYS
        if lapsed and (tid % 7) != weekday:
            continue

        out.append(tid)
    return out
