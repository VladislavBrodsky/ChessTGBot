"""
Per-withdrawal owner confirmation (second factor) — see
app/services/withdrawal_confirmation.py.

Covers: the hold-and-DM flow on /withdraw, refund when the confirmation DM is
undeliverable, nonce/identity checks, confirm/cancel outcomes, double-tap
idempotency, and TTL expiry refunds.
"""
import json
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch
from urllib.parse import quote

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.user import User
from app.models.transaction import Transaction
from app.services import withdrawal_confirmation as wc

settings = get_settings()

DEST_ADDRESS = "UQCDg8ub3MGCVJSaNo2q3QGTg0bX71RmwrvVOfbrqAzYNuCN"


def _headers(telegram_id: int, name: str) -> dict:
    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': name}))}"
    return {"X-Telegram-Init-Data": init_data}


def _enable_confirmation(monkeypatch):
    monkeypatch.setitem(settings.__dict__, "WITHDRAWAL_CONFIRMATION_ENABLED", True)
    monkeypatch.setitem(settings.__dict__, "TELEGRAM_BOT_TOKEN", "123456789:test_token")
    monkeypatch.setitem(settings.__dict__, "PAYOUT_MNEMONIC", "")


async def _make_user(db_session: AsyncSession, telegram_id: int, balance: int) -> User:
    user = User(telegram_id=telegram_id, first_name=f"U{telegram_id}", balance=balance)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


async def _make_held_tx(db_session: AsyncSession, telegram_id: int, amount: int, fee: int = 20,
                        created_at: datetime = None) -> Transaction:
    tx = Transaction(
        user_id=telegram_id,
        type="withdrawal",
        amount=-amount,
        fee=fee,
        status=wc.PENDING_STATUS,
        reference_id=f"{wc.REF_PREFIX}{DEST_ADDRESS}",
    )
    if created_at is not None:
        tx.created_at = created_at
    db_session.add(tx)
    await db_session.commit()
    await db_session.refresh(tx)
    return tx


async def _get_tx(db_session: AsyncSession, tx_id: int) -> Transaction:
    db_session.expire_all()
    res = await db_session.execute(select(Transaction).where(Transaction.id == tx_id))
    return res.scalars().first()


async def _get_balance(db_session: AsyncSession, telegram_id: int) -> int:
    db_session.expire_all()
    res = await db_session.execute(select(User).where(User.telegram_id == telegram_id))
    return res.scalars().first().balance


def test_nonce_roundtrip_and_rejection():
    nonce = wc.confirmation_nonce(42, 777)
    assert wc.verify_confirmation_nonce(42, 777, nonce)
    assert not wc.verify_confirmation_nonce(42, 778, nonce)   # other user
    assert not wc.verify_confirmation_nonce(43, 777, nonce)   # other tx
    assert not wc.verify_confirmation_nonce(42, 777, "forged")
    assert not wc.verify_confirmation_nonce(42, 777, None)


@pytest.mark.asyncio
async def test_withdraw_holds_for_owner_confirmation(client: AsyncClient, db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return
    _enable_confirmation(monkeypatch)

    telegram_id = 778001
    await _make_user(db_session, telegram_id, 3000)

    with patch(
        "app.services.telegram_bot.TelegramService.send_withdrawal_confirmation_request",
        new_callable=AsyncMock, return_value=True,
    ) as mock_send:
        res = await client.post(
            "/api/v1/wallet/withdraw",
            json={"amount": 1000, "address": DEST_ADDRESS},
            headers=_headers(telegram_id, "HoldUser"),
        )

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == wc.PENDING_STATUS
    assert data["new_balance"] == 2000            # debited immediately (held)

    db_session.expire_all()
    res_tx = await db_session.execute(
        select(Transaction).where(Transaction.user_id == telegram_id, Transaction.type == "withdrawal")
    )
    tx = res_tx.scalars().first()
    assert tx.status == wc.PENDING_STATUS
    assert tx.reference_id == f"{wc.REF_PREFIX}{DEST_ADDRESS}"

    # The DM carried the tx id and a VALID nonce.
    mock_send.assert_awaited_once()
    kwargs = mock_send.await_args.kwargs
    assert kwargs["tx_id"] == tx.id
    assert wc.verify_confirmation_nonce(tx.id, telegram_id, kwargs["nonce"])


@pytest.mark.asyncio
async def test_withdraw_refunds_when_confirmation_undeliverable(client: AsyncClient, db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return
    _enable_confirmation(monkeypatch)

    telegram_id = 778002
    await _make_user(db_session, telegram_id, 3000)

    with patch(
        "app.services.telegram_bot.TelegramService.send_withdrawal_confirmation_request",
        new_callable=AsyncMock, return_value=False,
    ):
        res = await client.post(
            "/api/v1/wallet/withdraw",
            json={"amount": 1000, "address": DEST_ADDRESS},
            headers=_headers(telegram_id, "NoDmUser"),
        )

    assert res.status_code == 503
    assert await _get_balance(db_session, telegram_id) == 3000   # refunded

    res_tx = await db_session.execute(
        select(Transaction).where(Transaction.user_id == telegram_id, Transaction.type == "withdrawal")
    )
    tx = res_tx.scalars().first()
    assert tx.status == "failed"
    assert tx.reference_id == "confirmation_undeliverable"


@pytest.mark.asyncio
async def test_confirm_executes_payout(db_session: AsyncSession, monkeypatch, test_engine):
    if test_engine is None:
        return
    _enable_confirmation(monkeypatch)

    telegram_id = 778003
    await _make_user(db_session, telegram_id, 2000)   # balance AFTER the hold debit
    tx = await _make_held_tx(db_session, telegram_id, 1000)

    nonce = wc.confirmation_nonce(tx.id, telegram_id)
    message, done = await wc.confirm_withdrawal(tx.id, telegram_id, nonce)

    assert done is True
    assert "Withdrawal Confirmed" in message
    tx = await _get_tx(db_session, tx.id)
    assert tx.status == "completed"                    # mock payout (no mnemonic)
    assert tx.reference_id.startswith("mock_")
    assert await _get_balance(db_session, telegram_id) == 2000   # not refunded — paid out


@pytest.mark.asyncio
async def test_confirm_rejects_wrong_identity_and_bad_nonce(db_session: AsyncSession, monkeypatch, test_engine):
    if test_engine is None:
        return
    _enable_confirmation(monkeypatch)

    telegram_id = 778004
    attacker_id = 999999
    await _make_user(db_session, telegram_id, 2000)
    tx = await _make_held_tx(db_session, telegram_id, 1000)
    nonce = wc.confirmation_nonce(tx.id, telegram_id)

    # Wrong account tapping a (somehow obtained) valid nonce
    message, done = await wc.confirm_withdrawal(tx.id, attacker_id, nonce)
    assert "not valid" in message
    assert (await _get_tx(db_session, tx.id)).status == wc.PENDING_STATUS

    # Right account id (forged webhook update) but wrong nonce
    message, done = await wc.confirm_withdrawal(tx.id, telegram_id, "forged_nonce")
    assert "not valid" in message
    assert (await _get_tx(db_session, tx.id)).status == wc.PENDING_STATUS

    # Cancellation is protected the same way
    message = await wc.cancel_withdrawal(tx.id, attacker_id, nonce)
    assert "not valid" in message
    assert (await _get_tx(db_session, tx.id)).status == wc.PENDING_STATUS


@pytest.mark.asyncio
async def test_cancel_refunds_held_amount(db_session: AsyncSession, monkeypatch, test_engine):
    if test_engine is None:
        return
    _enable_confirmation(monkeypatch)

    telegram_id = 778005
    await _make_user(db_session, telegram_id, 2000)
    tx = await _make_held_tx(db_session, telegram_id, 1000)

    message = await wc.cancel_withdrawal(tx.id, telegram_id, wc.confirmation_nonce(tx.id, telegram_id))
    assert "Cancelled" in message

    tx = await _get_tx(db_session, tx.id)
    assert tx.status == "failed"
    assert tx.reference_id == "cancelled_by_user"
    assert await _get_balance(db_session, telegram_id) == 3000   # 2000 + 1000 refund


@pytest.mark.asyncio
async def test_double_confirm_pays_only_once(db_session: AsyncSession, monkeypatch, test_engine):
    if test_engine is None:
        return
    _enable_confirmation(monkeypatch)
    monkeypatch.setitem(settings.__dict__, "PAYOUT_MNEMONIC", "wood sphere valve heavy machine annual horn")

    telegram_id = 778006
    await _make_user(db_session, telegram_id, 2000)
    tx = await _make_held_tx(db_session, telegram_id, 1000)
    nonce = wc.confirmation_nonce(tx.id, telegram_id)

    with patch("app.services.payout_service.execute_usdt_payout", new_callable=AsyncMock) as mock_pay:
        mock_pay.return_value = "real_tx_hash_abc"
        message1, done1 = await wc.confirm_withdrawal(tx.id, telegram_id, nonce)
        message2, done2 = await wc.confirm_withdrawal(tx.id, telegram_id, nonce)

    assert done1 and done2
    assert "Withdrawal Confirmed" in message1
    assert "already" in message2
    mock_pay.assert_awaited_once_with(DEST_ADDRESS, 980)   # 1000 - 20 fee, exactly once

    tx = await _get_tx(db_session, tx.id)
    assert tx.status == "pending"                          # real payout → on-chain pending
    assert tx.reference_id == "real_tx_hash_abc"


@pytest.mark.asyncio
async def test_retryable_payout_failure_keeps_funds_held(db_session: AsyncSession, monkeypatch, test_engine):
    if test_engine is None:
        return
    _enable_confirmation(monkeypatch)
    monkeypatch.setitem(settings.__dict__, "PAYOUT_MNEMONIC", "wood sphere valve heavy machine annual horn")

    telegram_id = 778007
    await _make_user(db_session, telegram_id, 2000)
    tx = await _make_held_tx(db_session, telegram_id, 1000)
    nonce = wc.confirmation_nonce(tx.id, telegram_id)

    with patch("app.services.payout_service.execute_usdt_payout", new_callable=AsyncMock) as mock_pay:
        mock_pay.side_effect = RuntimeError("rpc unavailable")   # pre-broadcast failure
        message, done = await wc.confirm_withdrawal(tx.id, telegram_id, nonce)

    assert done is False                                   # keyboard stays; user can retry
    assert "Payout Failed" in message
    tx = await _get_tx(db_session, tx.id)
    assert tx.status == wc.PENDING_STATUS                  # claim released, still held
    assert await _get_balance(db_session, telegram_id) == 2000   # no refund, no payout


@pytest.mark.asyncio
async def test_expired_confirmations_are_refunded(db_session: AsyncSession, monkeypatch, test_engine):
    if test_engine is None:
        return
    _enable_confirmation(monkeypatch)

    telegram_id = 778008
    await _make_user(db_session, telegram_id, 2000)
    stale_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(
        seconds=settings.WITHDRAWAL_CONFIRMATION_TTL_SECONDS + 60
    )
    tx = await _make_held_tx(db_session, telegram_id, 1000, created_at=stale_time)
    tx_id = tx.id

    with patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock):
        refunded = await wc.expire_stale_confirmations()

    assert refunded == 1
    tx = await _get_tx(db_session, tx_id)
    assert tx.status == "failed"
    assert tx.reference_id == "confirmation_expired"
    assert await _get_balance(db_session, telegram_id) == 3000

    # A confirm tap arriving after expiry must not pay out.
    message, done = await wc.confirm_withdrawal(tx_id, telegram_id, wc.confirmation_nonce(tx_id, telegram_id))
    assert done is True
    assert "already" in message
