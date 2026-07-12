"""DB-backed integration test for arena heads-up targeting: exercises the real
peak-hour mining SQL and the eligibility query against Postgres (the pure-logic
assignment is covered in test_arena_targeting.py).
"""
from datetime import timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.game_history import GameHistory
from app.services import arena_targeting
from app.services.arena_targeting import targeted_telegram_ids, _utcnow

SLOTS = [(2, 0), (8, 0), (14, 0), (20, 0)]


def _reset_cache():
    arena_targeting._cache.built_at = None
    arena_targeting._cache.profiles = {}


async def _add_games(db, tid: int, hour: int, n: int, days_ago: int = 1):
    base = (_utcnow() - timedelta(days=days_ago)).replace(
        hour=hour, minute=0, second=0, microsecond=0
    )
    for i in range(n):
        db.add(GameHistory(
            game_id=f"t_{tid}_{i}_{hour}_{days_ago}",
            white_player_id=tid,
            black_player_id=-1,
            created_at=base,
        ))


@pytest.mark.asyncio
async def test_targeting_buckets_and_filters(db_session: AsyncSession):
    db = db_session
    now = _utcnow()
    weekday = now.weekday()

    # A lapsed user whose stable weekday is NOT today -> should be tapered out.
    lapsed_tid = next(t for t in range(9100010, 9100030) if t % 7 != weekday)

    users = [
        User(telegram_id=9100001, first_name="apac", region="apac"),
        User(telegram_id=9100002, first_name="ru", preferred_language="ru"),
        User(telegram_id=9100003, first_name="behaviour", preferred_language="ja"),
        User(telegram_id=9100004, first_name="blocked", region="europe_africa",
             is_blocked=True),
        User(telegram_id=9100005, first_name="optout", region="americas",
             arena_notifications=False),
        User(telegram_id=9100006, first_name="americas", region="americas"),
        User(telegram_id=lapsed_tid, first_name="lapsed", region="americas"),
    ]
    db.add_all(users)
    # Behaviour user: 6 recent games peaking at 20:00 UTC (overrides ja language).
    await _add_games(db, 9100003, hour=20, n=6, days_ago=1)
    # Lapsed user: last game 40 days ago -> dormant.
    await _add_games(db, lapsed_tid, hour=1, n=1, days_ago=40)
    await db.commit()

    _reset_cache()
    by_slot = {}
    for hh, mm in SLOTS:
        by_slot[(hh, mm)] = set(await targeted_telegram_ids(db, hh, mm, SLOTS))

    # Region assignment
    assert 9100001 in by_slot[(8, 0)]      # apac -> 08:00
    assert 9100006 in by_slot[(2, 0)]      # americas -> 02:00
    # Language fallback
    assert 9100002 in by_slot[(14, 0)]     # ru -> 14:00
    # Behaviour overrides language
    assert 9100003 in by_slot[(20, 0)]     # plays at 20:00 despite ja
    assert 9100003 not in by_slot[(8, 0)]  # not where ja would put it

    # Each targeted user lands in exactly ONE slot (the decoupling guarantee).
    for tid in (9100001, 9100002, 9100003, 9100006):
        hits = [s for s, ids in by_slot.items() if tid in ids]
        assert len(hits) == 1, f"user {tid} targeted in {hits}"

    # Filters: blocked and opted-out users are in NO slot.
    all_targeted = set().union(*by_slot.values())
    assert 9100004 not in all_targeted     # is_blocked
    assert 9100005 not in all_targeted     # arena_notifications = False

    # Dormancy taper: lapsed user (americas) is NOT pinged on an off weekday,
    # even though its region matches the 02:00 slot.
    assert lapsed_tid not in by_slot[(2, 0)]


@pytest.mark.asyncio
async def test_targeting_empty_db_is_safe(db_session: AsyncSession):
    _reset_cache()
    ids = await targeted_telegram_ids(db_session, 20, 0, SLOTS)
    assert ids == []
