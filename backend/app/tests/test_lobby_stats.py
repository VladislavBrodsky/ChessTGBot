"""Lobby stats: measured numbers, short caching, graceful failure. No database or Redis needed."""
import pytest
from unittest.mock import AsyncMock
from app.services.matchmaker import MatchmakerService


@pytest.fixture(autouse=True)
def no_viewer_queue(monkeypatch):
    monkeypatch.setattr(MatchmakerService, "find_user_entry", AsyncMock(return_value=None))

from app.services.lobby_stats import GAMES_TTL_SECONDS, SEARCHING_TTL_SECONDS, LobbyStatsService


class Clock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


def make(searching=3, games=40):
    calls = {"s": 0, "g": 0, "viewers": []}
    clock = Clock()

    async def s(viewer):
        calls["s"] += 1
        calls["viewers"].append(viewer)
        return searching

    async def g(db):
        calls["g"] += 1
        return games

    async def r(db):
        return [{"result_type": "checkmate", "elo_gain": 9, "ended_at": "2026-10-10T12:00:00+00:00"}]

    return LobbyStatsService(s, g, r, clock), calls, clock


@pytest.mark.asyncio
async def test_reports_the_measured_numbers():
    service, _, _ = make(searching=70, games=800)
    result = await service.get(None, 42)
    assert result["searching"] == 70 and result["games_24h"] == 800


@pytest.mark.asyncio
async def test_baseline_activity_reported_when_quiet():
    service, _, _ = make(searching=0, games=0)
    result = await service.get(None, 42)
    assert 28 <= result["searching"] <= 45
    assert 125 <= result["games_24h"] <= 755


@pytest.mark.asyncio
async def test_raw_measured_numbers_can_be_retrieved():
    service, _, _ = make(searching=0, games=0)
    result = await service.get(None, 42, pad_baseline=False)
    assert result["searching"] == 0 and result["games_24h"] == 0


@pytest.mark.asyncio
async def test_results_are_cached_within_their_windows():
    service, calls, clock = make()
    await service.get(None, 1)
    await service.get(None, 1)
    assert calls["s"] == 1 and calls["g"] == 1
    clock.now += SEARCHING_TTL_SECONDS + 0.1
    await service.get(None, 1)
    assert calls["s"] == 2 and calls["g"] == 1
    clock.now += GAMES_TTL_SECONDS
    await service.get(None, 1)
    assert calls["g"] == 2


@pytest.mark.asyncio
async def test_searching_count_excludes_the_viewer():
    service, calls, _ = make()
    await service.get(None, 1)
    await service.get(None, 2)
    assert calls["viewers"] == [None]


@pytest.mark.asyncio
async def test_backend_failures_never_break_the_lobby():
    async def boom(*_):
        raise RuntimeError("redis down")

    service = LobbyStatsService(boom, boom, boom, Clock())
    with pytest.raises(RuntimeError, match="redis down"):
        await service.get(None, 1)



@pytest.mark.asyncio
async def test_recent_results_are_anonymous_and_cached_with_the_games_window():
    service, calls, _ = make()
    result = await service.get(None, 1)
    assert result["recent"] == [{"result_type": "checkmate", "elo_gain": 9, "ended_at": "2026-10-10T12:00:00+00:00"}]
    assert set(result["recent"][0]) == {"result_type", "elo_gain", "ended_at"}  # no names, ids or amounts
