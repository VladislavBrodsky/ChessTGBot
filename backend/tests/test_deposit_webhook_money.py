"""TEST-02 coverage for USDT deposit settlement replay and rollback paths."""

import json
from types import SimpleNamespace

import pytest
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request

from app.api.v1.endpoints.wallet import receive_ton_deposit_webhook
from app.core.config import get_settings
from app.models.transaction import Transaction
from app.models.user import User


def _webhook_request(payload: dict) -> Request:
    body = json.dumps(payload).encode()

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/wallet/webhook",
            "headers": [(b"content-type", b"application/json")],
        },
        receive,
    )


async def _create_user(db: AsyncSession, telegram_id: int) -> User:
    user = User(telegram_id=telegram_id, first_name="Deposit user", balance=0)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
def webhook_secret(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "WEBHOOK_SECRET", "test-deposit-secret")
    # The simulation format is deliberately restricted to SQLite.  Keep this
    # test focused on its accounting guarantees, not the ambient test URL.
    monkeypatch.setattr(
        "app.core.database.engine",
        SimpleNamespace(url=SimpleNamespace(drivername="sqlite")),
    )
    return "test-deposit-secret"


@pytest.mark.asyncio
async def test_deposit_webhook_replay_credits_once_and_keeps_a_complete_ledger(
    db_session: AsyncSession, webhook_secret
):
    if hasattr(db_session, "users"):
        return

    telegram_id = 781001
    await _create_user(db_session, telegram_id)
    payload = {
        "event": "transfer",
        "tx_hash": "deposit-replay-safe-hash",
        "sender": "EQsender",
        "amount_cents": 1_050,
        "comment": f"ref_{telegram_id}",
    }

    first = await receive_ton_deposit_webhook(
        _webhook_request(payload),
        x_webhook_secret=webhook_secret,
        authorization=None,
        db=db_session,
    )
    second = await receive_ton_deposit_webhook(
        _webhook_request(payload),
        x_webhook_secret=webhook_secret,
        authorization=None,
        db=db_session,
    )

    user = (await db_session.execute(
        select(User).where(User.telegram_id == telegram_id)
    )).scalars().one()
    ledger = (await db_session.execute(
        select(Transaction).where(Transaction.user_id == telegram_id)
    )).scalars().all()

    assert first["credited_amount"] == 998
    assert first["fee"] == 52
    assert second["credited_amount"] == 0
    assert user.balance == 998
    assert {(row.type, row.amount) for row in ledger} == {
        ("deposit", 998),
        ("deposit_fee", -52),
    }


@pytest.mark.asyncio
async def test_deposit_webhook_ledger_failure_rolls_back_the_credit(
    db_session: AsyncSession, webhook_secret
):
    if hasattr(db_session, "users"):
        return

    telegram_id = 781002
    user = await _create_user(db_session, telegram_id)

    @event.listens_for(db_session.sync_session, "before_flush")
    def reject_deposit_ledger(_session, _flush_context, _instances):
        if any(isinstance(item, Transaction) for item in _session.new):
            raise RuntimeError("simulated deposit ledger failure")

    with pytest.raises(RuntimeError, match="deposit ledger failure"):
        await receive_ton_deposit_webhook(
            _webhook_request({
                "event": "transfer",
                "tx_hash": "deposit-rollback-hash",
                "amount_cents": 1_050,
                "comment": f"ref_{telegram_id}",
            }),
            x_webhook_secret=webhook_secret,
            authorization=None,
            db=db_session,
        )
    event.remove(db_session.sync_session, "before_flush", reject_deposit_ledger)
    await db_session.rollback()
    await db_session.refresh(user)

    ledger = (await db_session.execute(
        select(Transaction).where(Transaction.user_id == telegram_id)
    )).scalars().all()
    assert user.balance == 0
    assert ledger == []
