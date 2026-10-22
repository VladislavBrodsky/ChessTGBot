"""Opt-in real Redis + PostgreSQL checks; never target production services.

PILOT_DATABASE_URL and PILOT_REDIS_URL must identify loopback test services.
The normal suite skips these checks when those explicit variables are absent.
"""
import asyncio
import hashlib
import hmac
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from urllib.parse import urlencode, urlparse

import httpx
import pytest
import pytest_asyncio
import redis.asyncio as redis
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.core.config import get_settings
from app.core.coordination import RedisLease, SharedStateUnavailable, StateConflict
from app.core.database import Base, normalize_database_url
from app.services.game_service import GameService, game_lock
from app.services.session_manager import SessionManager
from app.services.matchmaker import MatchmakerService
from app.services import player_tracking
from app.models.player_tracking import PlayerActivity

DB_URL = os.getenv("PILOT_DATABASE_URL", "")
REDIS_URL = os.getenv("PILOT_REDIS_URL", "")
pytestmark = pytest.mark.skipif(not DB_URL or not REDIS_URL, reason="Explicit local pilot test services required")
BOT_TOKEN = "123456:pilot-test-token"


def signed_user(uid, start=None):
    values = {"auth_date": str(int(time.time())), "user": json.dumps({"id": uid, "first_name": f"Pilot {uid}"})}
    if start:
        values["start_param"] = start
    check = "\n".join(f"{key}={values[key]}" for key in sorted(values))
    secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    values["hash"] = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return urlencode(values)


@pytest_asyncio.fixture
async def real_services(monkeypatch):
    for url in (DB_URL, REDIS_URL):
        assert urlparse(url).hostname in {"127.0.0.1", "localhost", "::1"}, "Only isolated loopback services are supported"
    assert urlparse(DB_URL).path.endswith("_test")
    assert urlparse(REDIS_URL).path == "/15", "Reserve Redis DB 15 for this opt-in suite"
    engine = create_async_engine(normalize_database_url(DB_URL), pool_size=10, max_overflow=10)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        # This database belongs only to the opt-in test instance.
        for name in ("friend_invites", "player_launch_intents", "player_activity", "player_acquisition", "launch_tokens", "arena_game_results", "campaign_deliveries", "game_history", "transactions", "arena_players", "arenas", "xp_transactions", "users"):
            await connection.execute(text(f'TRUNCATE TABLE "{name}" CASCADE'))
    factory = async_sessionmaker(engine, expire_on_commit=False)
    client = redis.from_url(REDIS_URL, decode_responses=True)
    await client.flushdb()
    monkeypatch.setattr(SessionManager, "_use_memory", False)
    monkeypatch.setattr(SessionManager, "_redis_client", client)
    monkeypatch.setattr(MatchmakerService, "_use_memory", False)
    monkeypatch.setattr(MatchmakerService, "_redis_client", client)
    monkeypatch.setattr(player_tracking, "AsyncSessionLocal", factory)
    import app.core.database as core_db
    import app.services.game_service as game_module
    from app.services.telegram_bot import TelegramService
    from app.core import alerts
    from unittest.mock import AsyncMock
    monkeypatch.setattr(core_db, "AsyncSessionLocal", factory)
    monkeypatch.setattr(game_module, "AsyncSessionLocal", factory)
    monkeypatch.setattr(game_module.sio, "emit", AsyncMock())
    monkeypatch.setattr(TelegramService, "send_notification", AsyncMock())
    monkeypatch.setattr(alerts, "send_admin_alert", AsyncMock())
    monkeypatch.setattr(alerts, "send_alert_with_redis_rate_limit", AsyncMock())
    settings = get_settings()
    monkeypatch.setattr(settings, "TESTING", False)
    monkeypatch.setattr(settings, "ENV", "production")
    monkeypatch.setattr(settings, "TELEGRAM_BOT_TOKEN", BOT_TOKEN)
    yield client, factory
    await client.aclose()
    await engine.dispose()


async def test_stale_writes_and_lost_lease_are_rejected(real_services):
    client, _ = real_services
    service = GameService()
    state = await service.create_game("pilot-cas")
    state.white_player_id, state.black_player_id = 101, 202
    await service.session_manager.save_game("pilot-cas", state)
    stale = await SessionManager().get_game("pilot-cas")
    state.white_username = "latest"
    await service.session_manager.save_game("pilot-cas", state)
    with pytest.raises(StateConflict):
        await SessionManager().save_game("pilot-cas", stale)
    async with game_lock(client, "pilot-cas"):
        state = await SessionManager().get_game("pilot-cas")
        await client.set("lock:game:pilot-cas", "replacement-owner", px=1000)
        with pytest.raises(StateConflict):
            await SessionManager().save_game("pilot-cas", state)
    assert (await SessionManager().get_game("pilot-cas")).white_username == "latest"


async def test_lock_renewal_contention_and_outage_do_not_fall_back(real_services):
    client, _ = real_services
    async with RedisLease(client, "pilot:renew", ttl_ms=1000):
        await asyncio.sleep(2.2)
        assert await client.pttl("pilot:renew") > 0
        with pytest.raises(SharedStateUnavailable):
            await RedisLease(client, "pilot:renew", wait_seconds=0).acquire()
    assert not await client.exists("pilot:renew")
    from unittest.mock import AsyncMock
    broken = AsyncMock()
    broken.get.side_effect = ConnectionError("outage")
    manager = SessionManager()
    manager.redis = broken
    with pytest.raises(SharedStateUnavailable):
        await manager.get_game("unavailable")
    assert SessionManager._use_memory is False


async def test_move_and_daily_activity_are_persisted_once(real_services):
    client, factory = real_services
    service = GameService()
    state = await service.create_game("pilot-play")
    state.white_player_id, state.black_player_id = 101, 202
    state.invite_token, state.first_move_grace_seconds = "original-invite", 180
    created_at = state.created_at
    await service.session_manager.save_game("pilot-play", state)
    results = await asyncio.gather(service.make_move("pilot-play", "e2e4", player_id=101), service.make_move("pilot-play", "d2d4", player_id=101))
    assert sum(result is not None for result in results) == 1
    # Even a legal black move cannot be supplied by White after the lock changed turn.
    assert await service.make_move("pilot-play", "e7e5", player_id=101) is None
    assert await service.make_move("pilot-play", "e7e5", player_id=202) is not None
    final = await SessionManager().get_game("pilot-play")
    assert final.created_at == created_at
    assert final.invite_token == "original-invite"
    assert final.first_move_grace_seconds == 180
    await asyncio.gather(player_tracking.flush_activity(client), player_tracking.flush_activity(client))
    async with factory() as db:
        assert (await db.execute(select(func.count()).select_from(PlayerActivity))).scalar_one() == 2
        assert (await player_tracking.gameplay_counts(db))["dau"] == 2
    assert await client.scard("gameplay:pending_days") == 0


async def test_attribution_is_immutable_and_retention_uses_mature_cohorts(real_services):
    from datetime import timedelta
    from app.models.user import User
    from app.models.player_tracking import PlayerAcquisition
    _, factory = real_services
    now = player_tracking.utcnow()
    async with factory() as db:
        new = User(telegram_id=301, first_name="New", created_at=now)
        old = User(telegram_id=302, first_name="Existing", created_at=now - timedelta(days=30))
        db.add_all([new, old])
        await db.commit()
        first = await player_tracking.create_launch(db, campaign="club_a", destination="practice", inviter_id=400)
        second = await player_tracking.create_launch(db, campaign="club_b")
        assert await player_tracking.attribute_launch(db, new, first)
        assert not await player_tracking.attribute_launch(db, new, second)
        assert not await player_tracking.attribute_launch(db, old, first)
        await db.commit()
        assert (await db.get(PlayerAcquisition, 301)).campaign == "club_a"
        for uid, offsets in ((301, (8, 7, 1)), (302, (8, 7)), (303, (1, 0))):
            for offset in offsets:
                db.add(PlayerActivity(day=now.date() - timedelta(days=offset), user_id=uid))
        await db.commit()
        metrics = await player_tracking.pilot_metrics(db)
        assert metrics['dau'] == 1 and metrics['mau'] == 3
        assert metrics['retention']['d1'] == {'eligible': 3, 'returned': 3, 'rate': 1.0}
        assert metrics['retention']['d7'] == {'eligible': 2, 'returned': 1, 'rate': .5}
        assert metrics['retention']['d30']['rate'] is None


async def test_arena_pool_survives_new_instance_and_scores_once(real_services):
    from datetime import timedelta
    from app.models.arena import Arena, ArenaPlayer
    from app.models.user import User
    from app.services.arena_service import ArenaService
    _, factory = real_services
    now = player_tracking.utcnow()

    def instance():
        service = object.__new__(ArenaService)
        service.pool, service.current_arena_id, service._scored_games = {}, None, set()
        service.create_game_callback = None
        return service

    a, b = instance(), instance()
    async with factory() as db:
        arena = Arena(starts_at=now, ends_at=now + timedelta(minutes=30), status='live')
        db.add(arena)
        db.add_all([User(telegram_id=501, first_name='A'), User(telegram_id=502, first_name='B')])
        await db.commit()
        assert await a.join(db, arena.id, 501, 'sid-a')
        assert await b.join(db, arena.id, 502, 'sid-b')
        arena_id = arena.id
    restarted = instance()
    assert await restarted.in_pool(501)
    assert await restarted.in_pool(502)
    await b.update_sid_shared(501, 'sid-new')
    async with restarted.shared_pool():
        assert restarted.pool[501]['sid'] == 'sid-new'
    state = await GameService().create_game(f'arena{arena_id}_501_502_test')
    state.white_player_id, state.black_player_id = 501, 502
    state.is_game_over, state.result_type, state.winner = True, 'checkmate', 'w'
    await asyncio.gather(a.record_result(f'arena{arena_id}_501_502_test', state), b.record_result(f'arena{arena_id}_501_502_test', state))
    async with factory() as db:
        rows = (await db.execute(select(ArenaPlayer).order_by(ArenaPlayer.user_id))).scalars().all()
        assert [(row.games_played, row.score) for row in rows] == [(1, 3), (1, 0)]
    async with factory() as db1, factory() as db2:
        await asyncio.gather(a.award_prizes(db1, arena_id), b.award_prizes(db2, arena_id))
    async with factory() as db:
        assert (await db.execute(select(func.sum(User.xp)))).scalar_one() == 210


async def test_unsettled_result_survives_failure_and_is_retried(real_services, monkeypatch):
    from unittest.mock import AsyncMock
    from app.models.user import User
    from app.models.game_history import GameHistory
    client, factory = real_services
    async with factory() as db:
        db.add_all([User(telegram_id=601, first_name='A'), User(telegram_id=602, first_name='B')])
        await db.commit()
    service = GameService()
    state = await service.create_game('pilot-settlement')
    state.white_player_id, state.black_player_id = 601, 602
    state.is_game_over, state.result_type = True, 'draw'
    await service.session_manager.save_game('pilot-settlement', state)
    original = service._end_game_once
    monkeypatch.setattr(service, '_end_game_once', AsyncMock(side_effect=RuntimeError('temporary database outage')))
    with pytest.raises(RuntimeError):
        await service.end_game('pilot-settlement', state)
    assert await client.sismember('games:unsettled', 'pilot-settlement')
    assert await client.ttl('game:pilot-settlement') == -1
    monkeypatch.setattr(service, '_end_game_once', original)
    await service.end_game('pilot-settlement', state)
    await service.end_game('pilot-settlement', state)
    assert not await client.sismember('games:unsettled', 'pilot-settlement')
    async with factory() as db:
        assert (await db.execute(select(func.count()).select_from(GameHistory))).scalar_one() == 1


def available_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


@pytest_asyncio.fixture
async def workers(real_services, tmp_path):
    ports = [available_port(), available_port()]
    env = {**os.environ, "DATABASE_URL": DB_URL, "DATABASE_READ_URL": DB_URL,
           "REDIS_URL": REDIS_URL, "ENV": "production", "TESTING": "false",
           "SECRET_KEY": "pilot-local-only", "WEBHOOK_SECRET": "pilot-local-only",
           "ADMIN_TELEGRAM_IDS": "999999", "TELEGRAM_BOT_TOKEN": BOT_TOKEN,
           "PAYOUTS_ENABLED": "false", "PILOT_LOCAL_SERVER": "1",
           "CORS_ALLOWED_ORIGINS": ",".join(f"http://127.0.0.1:{port}" for port in ports)}
    processes, logs = [], []
    try:
        for port in ports:
            log = (tmp_path / f"worker-{port}.log").open("w")
            logs.append(log)
            processes.append(subprocess.Popen([sys.executable, "tests/pilot_server.py", str(port)], cwd=Path(__file__).parents[1], env=env, stdout=log, stderr=subprocess.STDOUT))
        async with httpx.AsyncClient() as http:
            for port in ports:
                for _ in range(300):
                    try:
                        if (await http.get(f"http://127.0.0.1:{port}/health")).status_code == 200:
                            break
                    except httpx.TransportError:
                        pass
                    await asyncio.sleep(0.1)
                else:
                    pytest.fail(f"Pilot worker failed to start; inspect {tmp_path}")
        yield [f"http://127.0.0.1:{port}" for port in ports], real_services
    finally:
        for process in processes:
            process.terminate()
        for process in processes:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
        for log in logs:
            log.close()


async def test_two_workers_free_friend_moves_and_reconnect(workers):
    import socketio
    urls, (redis_client, factory) = workers
    sockets = [socketio.AsyncClient(reconnection=False), socketio.AsyncClient(reconnection=False)]
    queues = [asyncio.Queue(), asyncio.Queue()]
    uids = [90000001, 90000002]
    for index, client in enumerate(sockets):
        client.on("game_state", lambda state, q=queues[index]: q.put_nowait(state))

    async def state_where(q, predicate):
        async with asyncio.timeout(10):
            while True:
                state = await q.get()
                if predicate(state):
                    return state
    try:
        async with httpx.AsyncClient() as http:
            response = await http.post(urls[0] + "/api/v1/game/create?type=online&wager=0", headers={"X-Telegram-Init-Data": signed_user(uids[0])})
            assert response.status_code == 200, response.text
            game = response.json()
            token = game['invite_link'].split("go_", 1)[1]
            resolved = await http.get(urls[1] + f"/api/v1/game/launch/{token}", headers={"X-Telegram-Init-Data": signed_user(uids[1], "go_" + token)})
            assert resolved.status_code == 200, resolved.text
        for index, client in enumerate(sockets):
            await client.connect(urls[index], auth={"initData": signed_user(uids[index])}, transports=["websocket"])
            await client.emit("join_room", {"room": game['game_id']})
        state = await state_where(queues[0], lambda s: s.get('white_player_id') and s.get('black_player_id'))
        assert state['bid_amount'] == 0
        white = uids.index(state['white_player_id'])
        black = 1 - white
        await sockets[white].emit("make_move", {"game_id": game['game_id'], "uci": "e2e4"})
        state = await state_where(queues[black], lambda s: s['move_history'] == ['e2e4'])
        await sockets[black].disconnect()
        await sockets[black].connect(urls[white], auth={"initData": signed_user(uids[black])}, transports=["websocket"])
        await sockets[black].emit("join_room", {"room": game['game_id']})
        assert (await state_where(queues[black], lambda s: s['move_history'] == ['e2e4']))['fen'] == state['fen']
        await sockets[black].emit("make_move", {"game_id": game['game_id'], "uci": "e7e5"})
        await state_where(queues[white], lambda s: s['move_history'] == ['e2e4', 'e7e5'])
        await sockets[white].call("resign", {"game_id": game['game_id']}, timeout=15)
        rematches = [asyncio.Queue(), asyncio.Queue()]
        for index, client in enumerate(sockets):
            client.on("match_found", lambda payload, q=rematches[index]: q.put_nowait(payload))
        await sockets[white].call("offer_rematch", {"game_id": game['game_id'], "double_stakes": True}, timeout=15)
        # Duplicate acceptance must create only one free game, even with a
        # malicious doubled-stake flag on the original zero-stake offer.
        await asyncio.gather(*(sockets[black].call("accept_rematch", {"game_id": game['game_id']}, timeout=15) for _ in range(2)))
        async with asyncio.timeout(10):
            rematch_a, rematch_b = await rematches[0].get(), await rematches[1].get()
        assert rematch_a['game_id'] == rematch_b['game_id']
        assert rematches[0].empty() and rematches[1].empty()
        next_game = await SessionManager().get_game(rematch_a['game_id'])
        assert next_game.bid_amount == 0 and next_game.matched_at is not None
        await player_tracking.flush_activity(redis_client)
        async with factory() as db:
            assert (await player_tracking.gameplay_counts(db))["dau"] == 2
            from app.models.transaction import Transaction
            from app.models.player_tracking import PlayerAcquisition
            acquired = await db.get(PlayerAcquisition, uids[1])
            assert acquired.campaign == 'friend_challenge' and acquired.inviter_id == uids[0]
            rows = (await db.execute(select(Transaction))).scalars().all()
            assert len(rows) == 2 and all(row.type == 'game_free_pvp' and row.amount == 0 and row.fee == 0 for row in rows)
            from app.models.user import User
            balances = (await db.execute(select(User.balance).where(User.telegram_id.in_(uids)))).scalars().all()
            assert balances == [0, 0]
    finally:
        for client in sockets:
            if client.connected:
                await client.disconnect()


async def test_pilot_players_across_two_workers(workers, tmp_path):
    """A repeatable pilot workload, not a 10,000-DAU capacity certification."""
    import socketio
    import statistics
    from app.models.user import User
    urls, (redis_client, factory) = workers
    player_count = int(os.getenv("PILOT_PLAYER_COUNT", "100"))
    assert 2 <= player_count <= 2000 and player_count % 2 == 0
    uids = list(range(91000000, 91000000 + player_count))
    async with factory() as db:
        db.add_all([User(telegram_id=uid, first_name=f"Pilot {uid}", balance=0) for uid in uids])
        await db.commit()
    clients, queues, errors, latencies = {}, {}, [], []
    gate = asyncio.Semaphore(20)

    async def next_state(uid, predicate):
        async with asyncio.timeout(15):
            while True:
                state = await queues[uid].get()
                if predicate(state):
                    return state

    async def connect(uid):
        async with gate:
            client = socketio.AsyncClient(reconnection=False)
            queues[uid] = asyncio.Queue()
            async def on_state(state):
                await queues[uid].put(state)
            client.on('game_state', on_state)
            client.on('error', lambda error: errors.append(error))
            clients[uid] = client
            await client.connect(urls[uid % 2], auth={"initData": signed_user(uid)}, transports=['websocket'], wait_timeout=10)

    async def play_pair(index, http):
        a, b = uids[index * 2:index * 2 + 2]
        async with gate:
            response = await http.post(urls[0] + '/api/v1/game/create?type=online&wager=0', headers={'X-Telegram-Init-Data': signed_user(a)})
            assert response.status_code == 200, response.text
            game_id = response.json()['game_id']
            await clients[a].emit('join_room', {'room': game_id})
            await clients[b].emit('join_room', {'room': game_id})
            state = await next_state(a, lambda s: bool(s.get('black_player_id')))
        actors = [state['white_player_id'], state['black_player_id']]
        for number, move in enumerate(('e2e4', 'e7e5', 'g1f3', 'b8c6'), 1):
            started = time.perf_counter()
            await clients[actors[(number - 1) % 2]].emit('make_move', {'game_id': game_id, 'uci': move})
            await next_state(actors[number % 2], lambda s: len(s['move_history']) == number)
            latencies.append((time.perf_counter() - started) * 1000)

    try:
        await asyncio.gather(*(connect(uid) for uid in uids))
        async with httpx.AsyncClient(timeout=20) as http:
            await asyncio.gather(*(play_pair(index, http) for index in range(player_count // 2)))
        assert not errors
        await player_tracking.flush_activity(redis_client)
        async with factory() as db:
            assert (await player_tracking.gameplay_counts(db))['dau'] == player_count
        report = {'connected_players': player_count, 'api_workers': 2, 'human_games': player_count // 2,
                  'accepted_moves': len(latencies), 'unexpected_errors': len(errors),
                  'round_trip_p50_ms': round(statistics.median(latencies), 2),
                  'round_trip_p95_ms': round(sorted(latencies)[int(len(latencies) * .95) - 1], 2),
                  'scope': 'isolated local pilot workload; not production capacity'}
        Path(os.getenv('PILOT_REPORT_PATH', str(tmp_path / 'pilot-load.json'))).write_text(json.dumps(report, indent=2) + '\n')
    finally:
        await asyncio.gather(*(client.disconnect() for client in clients.values()), return_exceptions=True)


async def test_campaign_delivery_reservation_survives_competing_workers(real_services):
    _, factory = real_services

    async def reserve():
        async with factory() as db:
            return await player_tracking.reserve_delivery(db, "community:test", 90000001)

    assert sum(await asyncio.gather(reserve(), reserve())) == 1
    assert not await reserve()


async def test_free_game_claim_replaces_idle_ai_but_never_an_active_human_game(real_services):
    client, _ = real_services
    service = GameService()
    idle = await service.create_game("pilot-idle-ai", is_bot_game=True)
    idle.white_player_id = 701
    await service.session_manager.save_game("pilot-idle-ai", idle)
    paired = await service.create_game("pilot-claimed")
    paired.white_player_id, paired.black_player_id = 701, 702
    await service.session_manager.save_game("pilot-claimed", paired)
    assert await client.get("user:active_game:701") == "pilot-claimed"
    conflicting = await service.create_game("pilot-conflict")
    conflicting.white_player_id, conflicting.black_player_id = 701, 703
    with pytest.raises(StateConflict):
        await service.session_manager.save_game("pilot-conflict", conflicting)
    assert await client.get("user:active_game:701") == "pilot-claimed"


async def test_returning_public_referral_routes_to_practice_across_workers(workers):
    """A public referral attributes acquisition without becoming a game request."""
    from app.models.user import User
    from app.models.friend_invite import FriendInvite
    from datetime import timedelta
    urls, (redis_client, factory) = workers
    host, guest = 95000001, 95000002
    headers = lambda uid, param=None: {'X-Telegram-Init-Data': signed_user(uid, param)}
    async with factory() as db:
        db.add_all([User(telegram_id=uid, first_name=f'Friend {uid}', referral_code=f'friend{uid}', elo=1000, created_at=player_tracking.utcnow() - timedelta(days=1)) for uid in (host, guest)])
        await db.commit()
    parameter = f'ref_friend{host}'
    async with httpx.AsyncClient() as http:
        synced = await http.post(urls[0] + '/api/v1/users/sync', headers=headers(guest, parameter))
        assert synced.status_code == 200, synced.text
        recovered = await http.get(urls[1] + '/api/v1/game/friends/inbox', headers=headers(guest))
        assert recovered.json()['launch'] is None
        preview = await http.post(urls[1] + '/api/v1/game/friends/preview', headers=headers(guest), json={'parameter': parameter})
        assert preview.status_code == 200 and preview.json() == {'kind': 'route', 'destination': 'practice'}
        responses = await asyncio.gather(*(http.post(base + '/api/v1/game/friends/requests', headers=headers(guest), json={'parameter': parameter}) for base in urls))
        assert all(result.status_code == 410 for result in responses), [result.text for result in responses]
    async with factory() as db:
        from app.models.player_tracking import PlayerAcquisition
        assert (await db.get(PlayerAcquisition, guest)).inviter_id == host
        assert len((await db.execute(select(FriendInvite))).scalars().all()) == 0
        assert list((await db.execute(select(User.balance).where(User.telegram_id.in_((host, guest))))).scalars()) == [0, 0]


async def test_public_referral_request_does_not_emit_invitation_hint(workers):
    import socketio
    from app.models.user import User
    urls, (_, factory) = workers
    host, guest = 96000001, 96000002
    async with factory() as db:
        db.add_all([User(telegram_id=host, first_name='Host', referral_code='hint_host'), User(telegram_id=guest, first_name='Guest', referral_code='hint_guest')])
        await db.commit()
    socket = socketio.AsyncClient(reconnection=False)
    hints = asyncio.Queue()
    socket.on('friend_invites_updated', lambda event: hints.put_nowait(event))
    try:
        await socket.connect(urls[0], auth={'initData': signed_user(host)}, transports=['websocket'])
        async with httpx.AsyncClient() as http:
            response = await http.post(urls[1] + '/api/v1/game/friends/requests', headers={'X-Telegram-Init-Data': signed_user(guest)}, json={'parameter': 'ref_hint_host'})
            assert response.status_code == 410, response.text
        with pytest.raises(asyncio.TimeoutError):
            await asyncio.wait_for(hints.get(), timeout=0.25)
    finally:
        if socket.connected:
            await socket.disconnect()
