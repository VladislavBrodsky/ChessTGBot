"""
End-to-end Socket.IO test: two real clients queue, match, play to checkmate,
and the wager settles.

This is the seam where most production incidents have actually occurred
(socket_events + matchmaker + game_service + settlement), and before this test
nothing exercised it end-to-end: unit tests call the services directly, so the
socket handlers, the engineio transport, and the wiring between them ran
untested.

Unlike the rest of the suite this test does NOT use the conftest db_session /
test_engine fixtures: it brings its own file-based SQLite database, forces the
matchmaker / session-manager / socket manager into their in-memory modes, and
serves the real production ASGI adapter (DisconnectSafeSocketIOASGIApp) via an
in-process uvicorn on a localhost port. Two python-socketio AsyncClients then
drive it over real websockets. That makes it deterministic everywhere: no
Postgres, no Redis, no reliance on the conftest mock-session fallback.

The two clients connect with distinct X-Forwarded-For headers — the ranked
anti-collusion guard refuses to match two sockets from the same IP, and both
clients would otherwise be 127.0.0.1.
"""
import asyncio
import json
import socket as socketlib
import urllib.parse

import pytest
import uvicorn
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

pytest.importorskip("aiohttp", reason="python-socketio AsyncClient needs aiohttp")
import socketio as socketio_lib  # noqa: E402

from app.core.database import Base  # noqa: E402
from app.models.game_history import GameHistory  # noqa: E402
from app.models.transaction import Transaction  # noqa: E402
from app.models.user import User  # noqa: E402

WHITE_TIMEOUT = 20  # generous: CI runners are slow
BID_CENTS = 500
START_BALANCE = 2000
# compute_wager_settlement(500): pot 1000 -> referral 20, rake 30, payout 950
EXPECTED_PAYOUT = 950

PLAYER_A = 881001
PLAYER_B = 881002


def _free_port() -> int:
    with socketlib.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _init_data(user_id: int, name: str) -> str:
    """Unsigned initData; accepted via the dev/TESTING fallback parser.

    Built with quote(), not urlencode(): urlencode encodes spaces as '+',
    which the parser's unquote() leaves literal, corrupting the JSON. Compact
    separators avoid spaces entirely, matching real Telegram payloads.
    """
    payload = json.dumps(
        {"id": user_id, "first_name": name, "username": name},
        separators=(",", ":"),
    )
    return f"user={urllib.parse.quote(payload)}"


class E2EClient:
    """AsyncClient wrapper that queues the events the test asserts on."""

    def __init__(self):
        self.sio = socketio_lib.AsyncClient()
        self.match_found: asyncio.Queue = asyncio.Queue()
        self.game_states: asyncio.Queue = asyncio.Queue()
        self.errors: asyncio.Queue = asyncio.Queue()
        self.sio.on("match_found", self._on(self.match_found))
        self.sio.on("game_state", self._on(self.game_states))
        self.sio.on("error", self._on(self.errors))
        self.sio.on("matchmaking_error", self._on(self.errors))

    @staticmethod
    def _on(queue: asyncio.Queue):
        async def handler(data):
            await queue.put(data)

        return handler

    async def connect(self, url: str, user_id: int, name: str, ip: str):
        for attempt in range(5):
            try:
                await self.sio.connect(
                    url,
                    auth={"initData": _init_data(user_id, name)},
                    headers={
                        "X-Forwarded-For": ip,
                        "Origin": "http://127.0.0.1:3000"
                    },
                    transports=["websocket", "polling"],
                    wait_timeout=WHITE_TIMEOUT,
                )
                return
            except Exception:
                if attempt == 4:
                    raise
                await asyncio.sleep(0.2)

    async def next_state(self) -> dict:
        return await asyncio.wait_for(self.game_states.get(), WHITE_TIMEOUT)

    async def state_after_move(self, n_moves: int) -> dict:
        """Drain game_state events until one reflects n_moves half-moves."""
        while True:
            state = await self.next_state()
            if len(state.get("move_history") or []) >= n_moves:
                return state


@pytest.fixture
async def socket_server(tmp_path, monkeypatch):
    import app.core.database as core_db
    import app.services.game_service as game_service_mod
    import app.socket_events as socket_events_mod
    from app.core.socket import DisconnectSafeSocketIOASGIApp, sio
    from app.services.matchmaker import MatchmakerService
    from app.services.session_manager import SessionManager

    # Private database for this test, owned by this test's event loop — the
    # conftest test_engine (session-scoped, other loop) is deliberately unused.
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path}/e2e.db")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Every module that opens its own sessions in the tested path.
    monkeypatch.setattr(core_db, "AsyncSessionLocal", factory)
    monkeypatch.setattr(core_db, "AsyncReadSessionLocal", factory)
    monkeypatch.setattr(game_service_mod, "AsyncSessionLocal", factory)
    monkeypatch.setattr(socket_events_mod, "AsyncSessionLocal", factory)

    # Force in-memory mode everywhere. REDIS_URL defaults to localhost even
    # where no Redis runs; without this the first op per service fails once
    # before falling back, and sio.emit (AsyncRedisManager) never falls back.
    monkeypatch.setattr(SessionManager, "_use_memory", True)
    monkeypatch.setattr(SessionManager, "_redis_client", None)
    monkeypatch.setattr(SessionManager, "_memory_store", {})
    monkeypatch.setattr(MatchmakerService, "_use_memory", True)
    monkeypatch.setattr(MatchmakerService, "_redis_client", None)
    monkeypatch.setattr(MatchmakerService, "_memory_queues", {})
    memory_manager = socketio_lib.AsyncManager()
    memory_manager.set_server(sio)
    memory_manager.initialize()
    monkeypatch.setattr(sio, "manager", memory_manager)

    port = _free_port()
    config = uvicorn.Config(
        DisconnectSafeSocketIOASGIApp(sio),
        host="127.0.0.1",
        port=port,
        log_level="warning",
        lifespan="off",
    )
    server = uvicorn.Server(config)
    serve_task = asyncio.create_task(server.serve())
    for _ in range(200):
        if server.started:
            break
        await asyncio.sleep(0.05)
    else:
        serve_task.cancel()
        raise RuntimeError("uvicorn test server failed to start")

    yield {"url": f"http://127.0.0.1:{port}", "factory": factory}

    server.should_exit = True
    await asyncio.wait_for(serve_task, timeout=10)
    await engine.dispose()


async def _seed_players(factory):
    async with factory() as db:
        db.add(User(telegram_id=PLAYER_A, first_name="E2E-A", elo=1000,
                    balance=START_BALANCE))
        db.add(User(telegram_id=PLAYER_B, first_name="E2E-B", elo=1000,
                    balance=START_BALANCE))
        await db.commit()


async def _fetch_players(factory):
    async with factory() as db:
        res = await db.execute(
            select(User).where(User.telegram_id.in_([PLAYER_A, PLAYER_B]))
        )
        users = {u.telegram_id: u for u in res.scalars().all()}
    return users[PLAYER_A], users[PLAYER_B]


async def test_two_clients_match_play_checkmate_and_settle(socket_server):
    url, factory = socket_server["url"], socket_server["factory"]
    await _seed_players(factory)

    client_a, client_b = E2EClient(), E2EClient()
    await client_a.connect(url, PLAYER_A, "E2E-A", ip="203.0.113.10")
    await client_b.connect(url, PLAYER_B, "E2E-B", ip="203.0.113.20")
    try:
        # --- Matchmaking: A queues first, B joins the same pool. ---
        await client_a.sio.emit(
            "join_matchmaking", {"bid_amount": BID_CENTS, "time_control": 600}
        )
        # A must be in the queue before B joins, or both may just queue up.
        await asyncio.sleep(0.5)
        await client_b.sio.emit(
            "join_matchmaking", {"bid_amount": BID_CENTS, "time_control": 600}
        )

        match_a = await asyncio.wait_for(client_a.match_found.get(), WHITE_TIMEOUT)
        match_b = await asyncio.wait_for(client_b.match_found.get(), WHITE_TIMEOUT)

        assert match_a["game_id"] == match_b["game_id"]
        game_id = match_a["game_id"]
        assert match_a["bid_amount"] == match_b["bid_amount"] == BID_CENTS
        assert {match_a["color"], match_b["color"]} == {"w", "b"}
        assert match_a["opponent_id"] == PLAYER_B
        assert match_b["opponent_id"] == PLAYER_A

        # Both wagers debited and locked while the game runs.
        user_a, user_b = await _fetch_players(factory)
        assert user_a.balance == START_BALANCE - BID_CENTS
        assert user_b.balance == START_BALANCE - BID_CENTS

        # Colors are randomized; address the players by role from here on.
        if match_a["color"] == "w":
            white, black = client_a, client_b
            white_tid, black_tid = PLAYER_A, PLAYER_B
        else:
            white, black = client_b, client_a
            white_tid, black_tid = PLAYER_B, PLAYER_A

        # --- Server-side turn enforcement: black cannot move first. ---
        await black.sio.emit("make_move", {"game_id": game_id, "uci": "e7e5"})
        err = await asyncio.wait_for(black.errors.get(), WHITE_TIMEOUT)
        assert "turn" in err["message"].lower()

        # --- Fool's mate: f3 e5 g4 Qh4#. Each move round-trips the server. ---
        for mover, uci, half_moves in [
            (white, "f2f3", 1),
            (black, "e7e5", 2),
            (white, "g2g4", 3),
            (black, "d8h4", 4),
        ]:
            await mover.sio.emit("make_move", {"game_id": game_id, "uci": uci})
            state = await mover.state_after_move(half_moves)

        assert state["is_game_over"] is True
        assert state["winner"] == "b"
        assert state["result_type"] == "checkmate"

        # --- Settlement runs as a background task; poll the database. ---
        history = None
        for _ in range(int(WHITE_TIMEOUT / 0.25)):
            async with factory() as db:
                res = await db.execute(
                    select(GameHistory).where(GameHistory.game_id == game_id)
                )
                history = res.scalars().first()
            if history:
                break
            await asyncio.sleep(0.25)
        assert history is not None, "end_game never recorded the result"
        assert history.winner == "b"
        assert history.result_type == "checkmate"

        user_a, user_b = await _fetch_players(factory)
        winner = user_b if black_tid == PLAYER_B else user_a
        loser = user_a if winner is user_b else user_b
        assert winner.balance == START_BALANCE - BID_CENTS + EXPECTED_PAYOUT
        assert loser.balance == START_BALANCE - BID_CENTS
        assert winner.elo > 1000 > loser.elo

        async with factory() as db:
            res = await db.execute(
                select(Transaction).where(Transaction.reference_id == game_id)
            )
            txs = res.scalars().all()
        wagers = [t for t in txs if t.type == "game_wager"]
        wins = [t for t in txs if t.type == "game_win"]
        assert len(wagers) == 2
        assert all(t.status == "completed" and t.amount == -BID_CENTS for t in wagers)
        assert len(wins) == 1
        assert wins[0].user_id == winner.telegram_id
        assert wins[0].amount == EXPECTED_PAYOUT
    finally:
        await client_a.sio.disconnect()
        await client_b.sio.disconnect()
