"""Admin credit for USDT deposits that reached the master wallet without a memo."""
import json
from urllib.parse import quote

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.transaction import Transaction
from app.models.user import User
from app.services import manual_deposit_credit

ADMIN_ID = 1016749901
PLAYER_ID = 5138992367
REGULAR_ID = 999002
EVENT_ID = "f9fb33084be994382d58e2a186be9944024bf9396d2587b830a90a413eae2bb1"
SENDER = "0:34f9d98ed9270a6b12cf54bd39c0aed6d61e1f6873ca38e55c1433dc2a537c3e"
URL = "/api/v1/admin/deposits/credit-unmemoed"

settings = get_settings()


def _headers(telegram_id: int) -> dict:
    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'U'}))}"
    return {"X-Telegram-Init-Data": init_data}


def _event(comment=None, amount="5000000", jetton=None, recipient=None, in_progress=False, extra=0):
    transfer = {
        "sender": {"address": SENDER},
        "recipient": {"address": recipient or settings.MASTER_WALLET_ADDRESS},
        "amount": amount,
        "jetton": {"address": jetton or settings.USDT_MASTER, "symbol": "USD₮"},
    }
    if comment is not None:
        transfer["comment"] = comment
    actions = [{"type": "JettonTransfer", "status": "ok", "JettonTransfer": transfer}] * (1 + extra)
    return {"event_id": EVENT_ID, "timestamp": 1793374659, "in_progress": in_progress, "actions": actions}


@pytest.fixture
def chain(monkeypatch):
    state = {"event": _event()}

    async def fake_fetch(event_id):
        return state["event"]

    monkeypatch.setattr(manual_deposit_credit, "fetch_ton_event", fake_fetch)
    return state


async def _user(db: AsyncSession, telegram_id: int, balance: int = 0) -> User:
    res = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = res.scalars().first()
    if not user:
        user = User(telegram_id=telegram_id, first_name="U", balance=balance)
        db.add(user)
        await db.commit()
    return user


async def _balance(db: AsyncSession, telegram_id: int) -> int:
    db.expire_all()
    res = await db.execute(select(User.balance).where(User.telegram_id == telegram_id))
    return res.scalar_one()


@pytest.mark.asyncio
async def test_non_admin_is_rejected(client: AsyncClient, db_session: AsyncSession, chain):
    await _user(db_session, REGULAR_ID)
    res = await client.post(URL, json={"event_id": EVENT_ID, "telegram_id": PLAYER_ID}, headers=_headers(REGULAR_ID))
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_preview_then_credit_once(client: AsyncClient, db_session: AsyncSession, chain):
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    await _user(db_session, ADMIN_ID)
    await _user(db_session, PLAYER_ID, balance=100)
    body = {"event_id": EVENT_ID, "telegram_id": PLAYER_ID}

    preview = await client.post(URL, json=body, headers=_headers(ADMIN_ID))
    assert preview.status_code == 200, preview.text
    data = preview.json()
    assert (data["gross_cents"], data["credit_cents"], data["fee_cents"]) == (500, 475, 25)
    assert data["credited"] is False and data["sender"] == SENDER
    assert await _balance(db_session, PLAYER_ID) == 100

    done = await client.post(URL, json={**body, "confirm": True}, headers=_headers(ADMIN_ID))
    assert done.status_code == 200, done.text
    assert done.json()["credited"] is True
    assert await _balance(db_session, PLAYER_ID) == 575
    rows = (await db_session.execute(
        select(Transaction).where(Transaction.reference_id == EVENT_ID)
    )).scalars().all()
    assert [(r.type, r.amount, r.fee) for r in rows] == [("deposit", 475, 25)]

    again = await client.post(URL, json={**body, "confirm": True}, headers=_headers(ADMIN_ID))
    assert again.status_code == 409
    assert await _balance(db_session, PLAYER_ID) == 575


@pytest.mark.asyncio
async def test_event_already_credited_to_another_user_is_refused(
    client: AsyncClient, db_session: AsyncSession, chain
):
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    await _user(db_session, ADMIN_ID)
    await _user(db_session, PLAYER_ID)
    db_session.add(Transaction(user_id=ADMIN_ID, type="deposit", amount=475, fee=25,
                               status="completed", reference_id=EVENT_ID))
    await db_session.commit()
    res = await client.post(URL, json={"event_id": EVENT_ID, "telegram_id": PLAYER_ID, "confirm": True},
                            headers=_headers(ADMIN_ID))
    assert res.status_code == 409
    assert str(ADMIN_ID) in res.json()["detail"]


@pytest.mark.parametrize(
    "event, status",
    [
        (_event(comment="ref_5138992367"), 409),           # crawler's job
        (_event(in_progress=True), 409),                   # not settled
        (_event(jetton="EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT"), 400),  # not USDT
        (_event(recipient=SENDER), 400),                   # not into our wallet
        (_event(extra=1), 400),                            # ambiguous
        (_event(amount="0"), 400),
    ],
)
def test_parse_rejects_unsafe_events(event, status):
    with pytest.raises(manual_deposit_credit.UnmemoedDepositError) as err:
        manual_deposit_credit.parse_unmemoed_usdt_deposit(event, settings.MASTER_WALLET_ADDRESS)
    assert err.value.status_code == status


def test_parse_reads_amount_from_chain():
    parsed = manual_deposit_credit.parse_unmemoed_usdt_deposit(
        _event(amount="1001001", comment="  "), settings.MASTER_WALLET_ADDRESS
    )
    assert parsed["amount_cents"] == 100 and parsed["sender"] == SENDER


@pytest.mark.asyncio
async def test_malformed_event_id_is_rejected_before_any_lookup(
    client: AsyncClient, db_session: AsyncSession, monkeypatch
):
    async def boom(_):
        raise AssertionError("must not query TonAPI")

    monkeypatch.setattr(manual_deposit_credit, "fetch_ton_event", boom)
    await _user(db_session, ADMIN_ID)
    res = await client.post(URL, json={"event_id": "https://evil/x", "telegram_id": PLAYER_ID},
                            headers=_headers(ADMIN_ID))
    assert res.status_code == 400
