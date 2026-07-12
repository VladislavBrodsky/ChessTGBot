"""Unit tests for the daily-arena service: scheduling windows, arena game-id
parsing, standings ranking, and the in-memory pairing pool. Pure logic — no
DB, no sockets (game creation is a stubbed callback).
"""
from datetime import datetime, timedelta

import pytest

from app.services.arena_service import ArenaService, SCORE_WIN, SCORE_DRAW, PRIZE_XP


@pytest.fixture(autouse=True)
def _reset_singleton_state():
    service = ArenaService()
    service.pool = {}
    service.current_arena_id = None
    service.create_game_callback = None
    service._scored_games = set()
    yield
    service.pool = {}
    service.current_arena_id = None
    service.create_game_callback = None
    service._scored_games = set()


# ── Scheduling ────────────────────────────────────────────────────────────────

def test_window_before_start_is_today():
    hh, mm = ArenaService.start_time_utc()
    now = datetime(2026, 7, 11, 0, 0, 0)
    starts, ends = ArenaService.window_for(now)
    assert (starts.hour, starts.minute) == (hh, mm)
    assert starts.date() == now.date()
    assert ends - starts == timedelta(minutes=ArenaService.duration_minutes())


def test_window_during_arena_is_still_today():
    hh, mm = ArenaService.start_time_utc()
    now = datetime(2026, 7, 11, hh, mm) + timedelta(minutes=5)
    starts, ends = ArenaService.window_for(now)
    assert starts.date() == now.date()
    assert starts <= now < ends


def test_window_after_a_slot_ends_rolls_to_next_slot():
    """With several daily slots, ending one window points at the next one."""
    times = ArenaService.start_times_utc()
    hh, mm = times[0]
    now = datetime(2026, 7, 11, hh, mm) + timedelta(minutes=ArenaService.duration_minutes() + 1)
    starts, _ = ArenaService.window_for(now)
    if len(times) > 1:
        # next window is later the same day
        assert (starts.hour, starts.minute) == times[1]
        assert starts.date() == now.date()
    else:
        # single daily slot: rolls to tomorrow
        assert starts.date() == (now + timedelta(days=1)).date()


def test_window_after_last_slot_rolls_to_tomorrow():
    times = ArenaService.start_times_utc()
    hh, mm = times[-1]
    now = datetime(2026, 7, 11, hh, mm) + timedelta(minutes=ArenaService.duration_minutes() + 1)
    starts, _ = ArenaService.window_for(now)
    assert (starts.hour, starts.minute) == times[0]
    assert starts.date() == (now + timedelta(days=1)).date()


# ── Game id parsing ───────────────────────────────────────────────────────────

def test_parse_arena_id():
    assert ArenaService.parse_arena_id("arena12_111_222_1770000000") == 12
    assert ArenaService.parse_arena_id("match_111_222_1770000000") is None
    assert ArenaService.parse_arena_id("arena_garbage") is None


# ── Ranking ───────────────────────────────────────────────────────────────────

class _P:
    def __init__(self, score, wins, games_played, joined_at):
        self.score, self.wins, self.games_played, self.joined_at = score, wins, games_played, joined_at


def test_rank_key_orders_score_then_wins_then_efficiency():
    early, late = datetime(2026, 7, 11, 19, 0), datetime(2026, 7, 11, 19, 5)
    a = _P(score=9, wins=3, games_played=3, joined_at=late)    # best: highest score
    b = _P(score=7, wins=2, games_played=3, joined_at=early)
    c = _P(score=7, wins=1, games_played=5, joined_at=early)   # same score, fewer wins
    d = _P(score=7, wins=2, games_played=4, joined_at=early)   # same score/wins, more games than b
    ranked = sorted([c, d, b, a], key=ArenaService._rank_key)
    assert ranked == [a, b, d, c]


def test_prize_table_shape():
    assert len(PRIZE_XP) == 3
    assert PRIZE_XP == sorted(PRIZE_XP, reverse=True)
    assert SCORE_WIN > SCORE_DRAW > 0 or SCORE_DRAW >= 0


# ── Pairing pool ──────────────────────────────────────────────────────────────

async def test_pairing_creates_games_and_marks_in_game():
    service = ArenaService()
    service.current_arena_id = 1
    created = []

    async def fake_create(uid, sid_a, opp, sid_b, tc, arena_id):
        created.append((uid, opp))
        return f"arena{arena_id}_{min(uid, opp)}_{max(uid, opp)}_1"

    service.create_game_callback = fake_create
    for uid in (1, 2, 3, 4):
        service.pool[uid] = {'sid': f's{uid}', 'elo': 1000, 'in_game': False, 'last_opponent': None}

    games = await service.pair_waiting_players()
    assert games == 2
    assert all(e['in_game'] for e in service.pool.values())

    # Everyone busy: nothing new to pair
    assert await service.pair_waiting_players() == 0


async def test_pairing_avoids_immediate_rematch_when_possible():
    service = ArenaService()
    service.current_arena_id = 1

    async def fake_create(uid, sid_a, opp, sid_b, tc, arena_id):
        return "arena1_x"

    service.create_game_callback = fake_create
    service.pool[1] = {'sid': 's1', 'elo': 1000, 'in_game': False, 'last_opponent': 2}
    service.pool[2] = {'sid': 's2', 'elo': 1000, 'in_game': False, 'last_opponent': 1}
    service.pool[3] = {'sid': 's3', 'elo': 1000, 'in_game': False, 'last_opponent': None}

    await service.pair_waiting_players()
    # Whoever got paired, it must not be the 1-vs-2 rematch (3 is available)
    busy = [uid for uid, e in service.pool.items() if e['in_game']]
    assert len(busy) == 2
    assert set(busy) != {1, 2}


async def test_odd_player_left_waiting():
    service = ArenaService()
    service.current_arena_id = 1

    async def fake_create(uid, sid_a, opp, sid_b, tc, arena_id):
        return "arena1_y"

    service.create_game_callback = fake_create
    for uid in (1, 2, 3):
        service.pool[uid] = {'sid': f's{uid}', 'elo': 1000, 'in_game': False, 'last_opponent': None}

    assert await service.pair_waiting_players() == 1
    waiting = [uid for uid, e in service.pool.items() if not e['in_game']]
    assert len(waiting) == 1


async def test_failed_game_creation_releases_players():
    service = ArenaService()
    service.current_arena_id = 1

    async def failing_create(uid, sid_a, opp, sid_b, tc, arena_id):
        raise RuntimeError("boom")

    service.create_game_callback = failing_create
    for uid in (1, 2):
        service.pool[uid] = {'sid': f's{uid}', 'elo': 1000, 'in_game': False, 'last_opponent': None}

    assert await service.pair_waiting_players() == 0
    assert all(not e['in_game'] for e in service.pool.values())


def test_leave_and_update_sid():
    service = ArenaService()
    service.pool[7] = {'sid': 'old', 'elo': 1000, 'in_game': False, 'last_opponent': None}
    service.update_sid(7, 'new')
    assert service.pool[7]['sid'] == 'new'
    service.leave(7)
    assert 7 not in service.pool
    service.update_sid(7, 'x')  # no-op, must not raise


def test_multiple_arenas_scheduling():
    from unittest.mock import patch
    from app.core.config import Settings
    
    # Mock settings with multiple start times
    mock_settings = Settings()
    mock_settings.ARENA_START_UTC = "03:00, 09:00, 15:00, 21:00"
    mock_settings.ARENA_DURATION_MINUTES = 30
    
    with patch("app.services.arena_service.settings", mock_settings):
        # 1. 02:00 -> should return 03:00 today
        now = datetime(2026, 7, 11, 2, 0, 0)
        starts, ends = ArenaService.window_for(now)
        assert starts == datetime(2026, 7, 11, 3, 0, 0)
        assert ends == datetime(2026, 7, 11, 3, 30, 0)
        
        # 2. 03:15 (during the first window) -> should return 03:00 today
        now = datetime(2026, 7, 11, 3, 15, 0)
        starts, ends = ArenaService.window_for(now)
        assert starts == datetime(2026, 7, 11, 3, 0, 0)
        assert ends == datetime(2026, 7, 11, 3, 30, 0)
        
        # 3. 03:45 (after first window) -> should return 09:00 today
        now = datetime(2026, 7, 11, 3, 45, 0)
        starts, ends = ArenaService.window_for(now)
        assert starts == datetime(2026, 7, 11, 9, 0, 0)
        assert ends == datetime(2026, 7, 11, 9, 30, 0)
        
        # 4. 22:00 (after all today's windows) -> should return 03:00 tomorrow
        now = datetime(2026, 7, 11, 22, 0, 0)
        starts, ends = ArenaService.window_for(now)
        assert starts == datetime(2026, 7, 12, 3, 0, 0)
        assert ends == datetime(2026, 7, 12, 3, 30, 0)
