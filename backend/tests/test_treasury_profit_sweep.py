"""Profit position and the admin-triggered sweep to the company wallet."""
import json
from urllib.parse import quote

import pytest
from sqlalchemy import select

from app.core.config import get_settings
from app.models.transaction import Transaction
from app.models.user import User
from app.services import treasury_service

settings = get_settings()
COMPANY = "UQBLskkIFM4reaQOwCGpN6og_DPMSQzfzOT-phdzeXny5BUa"
ADMIN_ID = 1016749901


@pytest.fixture
def chain(monkeypatch):
    """On-chain USDT of the master, and a record of payouts sent."""
    state = {"usdt_cents": 0, "sent": []}

    async def onchain():
        return state["usdt_cents"], None

    async def payout(dest, cents):
        state["sent"].append((dest, cents))
        return "f" * 64

    from app.services.solvency_service import SolvencyService
    monkeypatch.setattr(SolvencyService, "get_onchain_usdt_cents", staticmethod(onchain))
    monkeypatch.setattr("app.services.payout_service.execute_usdt_payout", payout)
    monkeypatch.setattr(settings, "COMPANY_WALLET_ADDRESS", COMPANY)
    monkeypatch.setattr(settings, "PROFIT_SWEEP_RESERVE_CENTS", 1000)
    monkeypatch.setattr("app.core.alerts.send_alert_with_redis_rate_limit", _no_alert)
    return state


async def _no_alert(*a, **kw):
    return None


async def _seed(db):
    """Owes: 20.00 balances + 5.00 unsent withdrawal + 1.00 held stake + 4.00 open pot.
    A settled game's stakes (3.00) are not owed any more."""
    db.add_all([
        User(telegram_id=9401, first_name="A", balance=1500),
        User(telegram_id=9402, first_name="B", balance=500),
        Transaction(user_id=9401, type="withdrawal", amount=-500, fee=20, status="pending_confirmation", reference_id="addr:x"),
        Transaction(user_id=9402, type="withdrawal", amount=-900, fee=20, status="completed", reference_id="h1"),
        Transaction(user_id=9401, type="game_wager", amount=-100, fee=0, status="pending", reference_id="matchmaking"),
        Transaction(user_id=9401, type="game_wager", amount=-200, fee=0, status="completed", reference_id="open-game"),
        Transaction(user_id=9402, type="game_wager", amount=-200, fee=0, status="completed", reference_id="open-game"),
        Transaction(user_id=9401, type="game_wager", amount=-150, fee=0, status="completed", reference_id="done-game"),
        Transaction(user_id=9402, type="game_wager", amount=-150, fee=0, status="completed", reference_id="done-game"),
        Transaction(user_id=9401, type="game_win", amount=285, fee=15, status="completed", reference_id="done-game"),
    ])
    await db.commit()


def _real(db):
    if hasattr(db, "users"):
        pytest.skip("needs a real database")


@pytest.mark.asyncio
async def test_profit_position_subtracts_everything_still_owed(db_session, chain):
    _real(db_session)
    await _seed(db_session)
    chain["usdt_cents"] = 5000
    pos = await treasury_service.get_profit_position(db_session)
    assert (pos["player_balances_cents"], pos["unsent_withdrawals_cents"], pos["held_stakes_cents"], pos["open_pots_cents"]) == (2000, 500, 100, 400)
    assert pos["total_owed_cents"] == 3000
    assert pos["available_profit_cents"] == 5000 - 3000 - 1000
    assert pos["sweep_blocked_reason"] is None


@pytest.mark.asyncio
async def test_no_profit_when_custody_is_below_what_is_owed(db_session, chain):
    _real(db_session)
    await _seed(db_session)
    chain["usdt_cents"] = 500
    assert (await treasury_service.get_profit_position(db_session))["available_profit_cents"] == 0
    with pytest.raises(treasury_service.SweepRefused, match="Nothing to sweep"):
        await treasury_service.sweep_profit(db_session, admin_id=ADMIN_ID, amount_cents=None, confirm=True)
    assert chain["sent"] == []


@pytest.mark.asyncio
async def test_preview_moves_nothing_and_confirm_pays_only_the_company(db_session, chain):
    _real(db_session)
    await _seed(db_session)
    chain["usdt_cents"] = 6000  # 2000 available
    preview = await treasury_service.sweep_profit(db_session, admin_id=ADMIN_ID, amount_cents=None, confirm=False)
    assert (preview["sweep_amount_cents"], preview["sent"], chain["sent"]) == (2000, False, [])

    done = await treasury_service.sweep_profit(db_session, admin_id=ADMIN_ID, amount_cents=None, confirm=True)
    assert done["sent"] is True and chain["sent"] == [(COMPANY, 2000)]
    row = (await db_session.execute(select(Transaction).where(Transaction.type == "profit_sweep"))).scalar_one()
    assert (row.user_id, row.amount, row.status) == (None, -2000, "completed")

    # The chain still shows 60.00 for a few seconds: the sweep just sent must
    # not be swept again out of player funds.
    with pytest.raises(treasury_service.SweepRefused, match="Nothing to sweep"):
        await treasury_service.sweep_profit(db_session, admin_id=ADMIN_ID, amount_cents=None, confirm=True)
    assert chain["sent"] == [(COMPANY, 2000)]


@pytest.mark.asyncio
async def test_cannot_sweep_more_than_available(db_session, chain):
    _real(db_session)
    await _seed(db_session)
    chain["usdt_cents"] = 6000
    with pytest.raises(treasury_service.SweepRefused, match="exceeds available"):
        await treasury_service.sweep_profit(db_session, admin_id=ADMIN_ID, amount_cents=2001, confirm=True)
    assert chain["sent"] == []


@pytest.mark.asyncio
@pytest.mark.parametrize("company, reason", [
    ("", "not set"),
    ("not-an-address", "not a valid"),
    ("MASTER", "different wallet"),
])
async def test_sweep_needs_a_separate_company_wallet(db_session, chain, monkeypatch, company, reason):
    _real(db_session)
    monkeypatch.setattr(settings, "COMPANY_WALLET_ADDRESS", settings.MASTER_WALLET_ADDRESS if company == "MASTER" else company)
    chain["usdt_cents"] = 100_000
    with pytest.raises(treasury_service.SweepRefused, match=reason):
        await treasury_service.sweep_profit(db_session, admin_id=ADMIN_ID, amount_cents=None, confirm=True)
    assert chain["sent"] == []


def _headers(tid):
    return {"X-Telegram-Init-Data": f"user={quote(json.dumps({'id': tid, 'first_name': 'U'}))}"}


@pytest.mark.asyncio
async def test_treasury_endpoints_are_admin_only(client, db_session, chain):
    _real(db_session)
    db_session.add(User(telegram_id=999003, first_name="R"))
    await db_session.commit()
    assert (await client.get("/api/v1/admin/treasury", headers=_headers(999003))).status_code == 403
    assert (await client.post("/api/v1/admin/treasury/sweep", json={"confirm": True}, headers=_headers(999003))).status_code == 403
    assert chain["sent"] == []


@pytest.mark.asyncio
async def test_admin_sweep_refusal_is_a_409_with_reason(client, db_session, chain):
    _real(db_session)
    db_session.add(User(telegram_id=ADMIN_ID, first_name="Admin"))
    await db_session.commit()
    res = await client.post("/api/v1/admin/treasury/sweep", json={"confirm": True}, headers=_headers(ADMIN_ID))
    assert res.status_code == 409 and "Nothing to sweep" in res.json()["detail"]
    pos = await client.get("/api/v1/admin/treasury", headers=_headers(ADMIN_ID))
    assert pos.status_code == 200 and pos.json()["available_profit_usd"] == 0
