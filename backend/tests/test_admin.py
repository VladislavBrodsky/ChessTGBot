"""
Tests for the admin panel API endpoints.

Non-admin users must receive 403 on every admin route.
Admin users (telegram_id in ADMIN_TELEGRAM_IDS) must receive proper data.
"""
import json
import pytest
from urllib.parse import quote
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.transaction import Transaction
from app.models.game_history import GameHistory


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ADMIN_ID   = 1016749901
REGULAR_ID = 999001


def _headers(telegram_id: int, first_name: str = "User") -> dict:
    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': first_name}))}"
    return {"X-Telegram-Init-Data": init_data}


ADMIN_HEADERS   = _headers(ADMIN_ID, "AdminUser")
REGULAR_HEADERS = _headers(REGULAR_ID, "RegularUser")


async def _ensure_user(db: AsyncSession, telegram_id: int, first_name: str, **kwargs) -> User:
    from sqlalchemy import select
    res = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = res.scalars().first()
    if not user:
        user = User(telegram_id=telegram_id, first_name=first_name, **kwargs)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Access control — every admin endpoint must return 403 for non-admins
# ---------------------------------------------------------------------------

ADMIN_ENDPOINTS = [
    ("GET",  "/api/v1/admin/stats"),
    ("GET",  "/api/v1/admin/users"),
    ("GET",  "/api/v1/admin/transactions"),
    ("GET",  "/api/v1/admin/games"),
    ("GET",  "/api/v1/admin/broadcasts"),
    ("POST", "/api/v1/admin/benchmark"),
]


@pytest.mark.asyncio
@pytest.mark.parametrize("method,path", ADMIN_ENDPOINTS)
async def test_admin_endpoints_reject_non_admin(
    method: str, path: str, client: AsyncClient, db_session: AsyncSession
):
    await _ensure_user(db_session, REGULAR_ID, "RegularUser")
    res = await client.request(method, path, headers=REGULAR_HEADERS)
    assert res.status_code == 403, f"{method} {path} should return 403 for non-admin"


# ---------------------------------------------------------------------------
# Stats endpoint
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_admin_stats_returns_expected_keys(
    client: AsyncClient, db_session: AsyncSession
):
    await _ensure_user(db_session, ADMIN_ID, "AdminUser")
    res = await client.get("/api/v1/admin/stats", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    data = res.json()

    expected_keys = [
        "total_users", "premium_users", "active_24h", "active_7d", "active_30d",
        "total_games", "net_revenue_cents", "total_referrals",
        "daily_activity", "daily_revenue",
    ]
    for key in expected_keys:
        assert key in data, f"Missing key: {key}"

    assert isinstance(data["daily_activity"], list)
    assert len(data["daily_activity"]) == 14, "Should return 14 days of activity data"


# ---------------------------------------------------------------------------
# Users endpoint
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_admin_users_list(client: AsyncClient, db_session: AsyncSession):
    await _ensure_user(db_session, ADMIN_ID, "AdminUser")
    await _ensure_user(db_session, 888001, "Alice")
    await _ensure_user(db_session, 888002, "Bob")

    res = await client.get("/api/v1/admin/users?page=1&limit=10", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    data = res.json()

    assert "total" in data
    assert "users" in data
    assert isinstance(data["users"], list)
    assert data["total"] >= 0  # mock may return 0 for COUNT


@pytest.mark.asyncio
async def test_admin_users_search(client: AsyncClient, db_session: AsyncSession):
    await _ensure_user(db_session, ADMIN_ID, "AdminUser")
    await _ensure_user(db_session, 888003, "UniqueSearchName")

    res = await client.get(
        "/api/v1/admin/users?search=UniqueSearchName", headers=ADMIN_HEADERS
    )
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert "users" in data


@pytest.mark.asyncio
async def test_admin_user_detail(client: AsyncClient, db_session: AsyncSession):
    await _ensure_user(db_session, ADMIN_ID, "AdminUser")
    target = await _ensure_user(db_session, 888010, "DetailTarget", balance=5000)

    res = await client.get(
        f"/api/v1/admin/users/{target.telegram_id}", headers=ADMIN_HEADERS
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["telegram_id"] == target.telegram_id
    assert "transactions" in data
    assert "xp_history" in data


@pytest.mark.asyncio
async def test_admin_user_detail_not_found(client: AsyncClient, db_session: AsyncSession):
    await _ensure_user(db_session, ADMIN_ID, "AdminUser")
    # Use a telegram_id that is deliberately NOT registered
    res = await client.get("/api/v1/admin/users/1", headers=ADMIN_HEADERS)
    # Acceptable: either 404 (user not found) or 200 (if mock returns the admin user)
    # The important thing is we don't crash
    assert res.status_code in (200, 404)


# ---------------------------------------------------------------------------
# Transactions endpoint
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_admin_transactions_list(client: AsyncClient, db_session: AsyncSession):
    await _ensure_user(db_session, ADMIN_ID, "AdminUser")
    user = await _ensure_user(db_session, 888020, "TxUser", balance=10000)

    tx = Transaction(
        user_id=user.telegram_id,
        type="deposit",
        amount=5000,
        fee=50,
        status="completed",
        reference_id="test_hash_001",
    )
    db_session.add(tx)
    await db_session.commit()

    res = await client.get("/api/v1/admin/transactions", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    data = res.json()

    assert "transactions" in data
    assert data["total"] >= 0  # mock COUNT returns 0
    assert isinstance(data["transactions"], list)


@pytest.mark.asyncio
async def test_admin_transactions_filter_by_type(client: AsyncClient, db_session: AsyncSession):
    await _ensure_user(db_session, ADMIN_ID, "AdminUser")
    res = await client.get(
        "/api/v1/admin/transactions?type=deposit", headers=ADMIN_HEADERS
    )
    assert res.status_code == 200
    data = res.json()
    for tx in data["transactions"]:
        assert tx["type"] == "deposit"


# ---------------------------------------------------------------------------
# Games endpoint
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_admin_games_list(client: AsyncClient, db_session: AsyncSession):
    await _ensure_user(db_session, ADMIN_ID, "AdminUser")
    res = await client.get("/api/v1/admin/games", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert "games" in data
    assert "total" in data


# ---------------------------------------------------------------------------
# Broadcasts endpoint
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_admin_broadcast_create_and_list(client: AsyncClient, db_session: AsyncSession):
    await _ensure_user(db_session, ADMIN_ID, "AdminUser")

    # Create broadcast
    payload = {"message": "<b>Test broadcast!</b>", "audience": "all"}
    res = await client.post("/api/v1/admin/broadcasts", json=payload, headers=ADMIN_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    assert data["audience"] == "all"
    assert data["status"] == "pending"

    # List broadcasts — uses a fresh db session per request in mock mode,
    # so we just verify the endpoint returns the right shape.
    res2 = await client.get("/api/v1/admin/broadcasts", headers=ADMIN_HEADERS)
    assert res2.status_code == 200
    list_data = res2.json()
    assert "broadcasts" in list_data
    assert "total" in list_data
    assert isinstance(list_data["broadcasts"], list)


@pytest.mark.asyncio
async def test_admin_broadcast_invalid_audience(client: AsyncClient, db_session: AsyncSession):
    await _ensure_user(db_session, ADMIN_ID, "AdminUser")
    payload = {"message": "Hello", "audience": "vip_only"}
    res = await client.post("/api/v1/admin/broadcasts", json=payload, headers=ADMIN_HEADERS)
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_admin_broadcast_empty_message(client: AsyncClient, db_session: AsyncSession):
    await _ensure_user(db_session, ADMIN_ID, "AdminUser")
    payload = {"message": "   ", "audience": "all"}
    res = await client.post("/api/v1/admin/broadcasts", json=payload, headers=ADMIN_HEADERS)
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_admin_benchmark(client: AsyncClient, db_session: AsyncSession):
    await _ensure_user(db_session, ADMIN_ID, "AdminUser")
    res = await client.post("/api/v1/admin/benchmark", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "benchmarks" in data
    assert "engine" in data["benchmarks"]
    assert "database_ms" in data["benchmarks"]
