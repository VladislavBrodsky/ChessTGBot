"""Regression coverage for the manual withdrawal review state machine."""
import asyncio
import json
from unittest.mock import AsyncMock, patch
from urllib.parse import quote

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.database import Base
from app.models.transaction import Transaction
from app.models.user import User
from app.services.payout_service import BlockchainBroadcastError
from app.services import withdrawal_confirmation as confirmation
from app.services.withdrawal_review import (
    PENDING_REVIEW_STATUS,
    PROCESSING_PAYOUT_STATUS,
    REVIEW_REFERENCE_PREFIX,
    claim_payout,
    reject_pending_review,
)

ADMIN_ID = 1016749901
DESTINATION = "UQCDg8ub3MGCVJSaNo2q3QGTg0bX71RmwrvVOfbrqAzYNuCN"
settings = get_settings()


def _admin_headers() -> dict:
    init_data = f"user={quote(json.dumps({'id': ADMIN_ID, 'first_name': 'Admin'}))}"
    return {"X-Telegram-Init-Data": init_data}


async def _create_review_tx(db: AsyncSession, user_id: int = 880001) -> Transaction:
    db.add(User(telegram_id=user_id, first_name="Withdrawal user", balance=2_000))
    tx = Transaction(
        user_id=user_id,
        type="withdrawal",
        amount=-1_000,
        fee=20,
        status=PENDING_REVIEW_STATUS,
        reference_id=f"{REVIEW_REFERENCE_PREFIX}{DESTINATION}",
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    return tx


@pytest.mark.asyncio
async def test_twenty_concurrent_approval_attempts_claim_and_pay_once(tmp_path):
    """The database claim is the only admission path to a payout side effect."""
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{tmp_path / 'withdrawal_review.db'}",
        connect_args={"timeout": 30},
    )
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with sessions() as db:
            tx = await _create_review_tx(db)
            tx_id = tx.id

        payout = AsyncMock()

        async def approve_attempt(index: int) -> bool:
            # All attempts are created at once. The small stagger keeps SQLite's
            # file-lock implementation deterministic while exercising the same
            # conditional UPDATE used by concurrent production requests.
            await asyncio.sleep(index / 10_000)
            async with sessions() as db:
                claimed, _ = await claim_payout(db, tx_id, ADMIN_ID)
                if claimed:
                    await payout(DESTINATION, 980)
                return claimed

        results = await asyncio.gather(*(approve_attempt(index) for index in range(20)))

        assert sum(results) == 1
        payout.assert_awaited_once_with(DESTINATION, 980)

        async with sessions() as db:
            tx = (await db.execute(select(Transaction).where(Transaction.id == tx_id))).scalars().one()
            assert tx.status == PROCESSING_PAYOUT_STATUS
            assert tx.approved_by_admin_id == ADMIN_ID
            assert tx.approved_at is not None
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_approve_and_reject_race_have_one_state_owner(tmp_path):
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{tmp_path / 'withdrawal_review_race.db'}",
        connect_args={"timeout": 30},
    )
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with sessions() as db:
            tx = await _create_review_tx(db, user_id=880002)
            tx_id = tx.id

        async def approve() -> bool:
            async with sessions() as db:
                claimed, _ = await claim_payout(db, tx_id, ADMIN_ID)
                return claimed

        async def reject() -> bool:
            async with sessions() as db:
                rejected, _ = await reject_pending_review(db, tx_id, ADMIN_ID + 1)
                if rejected:
                    from app.crud.user import atomic_credit
                    await atomic_credit(db, 880002, 1_000, commit=False)
                    await db.commit()
                else:
                    await db.rollback()
                return rejected

        approved, rejected = await asyncio.gather(approve(), reject())
        assert int(approved) + int(rejected) == 1

        async with sessions() as db:
            tx = (await db.execute(select(Transaction).where(Transaction.id == tx_id))).scalars().one()
            user = (await db.execute(select(User).where(User.telegram_id == 880002))).scalars().one()
            if approved:
                assert tx.status == PROCESSING_PAYOUT_STATUS
                assert user.balance == 2_000
            else:
                assert tx.status == "failed"
                assert tx.rejected_by_admin_id == ADMIN_ID + 1
                assert tx.rejected_at is not None
                assert user.balance == 3_000
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_manual_approval_persists_audit_and_rejects_a_second_attempt(
    client: AsyncClient, db_session: AsyncSession, monkeypatch, test_engine,
):
    if test_engine is None:
        return
    monkeypatch.setitem(settings.__dict__, "PAYOUT_MNEMONIC", "")
    await _create_review_tx(db_session, user_id=880003)
    tx = (await db_session.execute(select(Transaction).where(Transaction.user_id == 880003))).scalars().one()
    tx_id = tx.id

    with patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock):
        response = await client.post(f"/api/v1/admin/withdrawals/{tx_id}/approve", headers=_admin_headers())

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "approved"
    assert body["approved_by_admin_id"] == ADMIN_ID
    assert body["approved_at"]

    db_session.expire_all()
    tx = (await db_session.execute(select(Transaction).where(Transaction.id == tx_id))).scalars().one()
    assert tx.status == "completed"
    assert tx.approved_by_admin_id == ADMIN_ID
    assert tx.approved_at is not None

    second = await client.post(f"/api/v1/admin/withdrawals/{tx_id}/approve", headers=_admin_headers())
    assert second.status_code == 409
    assert second.json()["detail"] == "Withdrawal is already completed"


@pytest.mark.asyncio
async def test_manual_approval_reopens_after_known_pre_broadcast_failure(
    client: AsyncClient, db_session: AsyncSession, monkeypatch, test_engine,
):
    if test_engine is None:
        return
    monkeypatch.setitem(settings.__dict__, "PAYOUT_MNEMONIC", "wood sphere valve heavy machine annual horn")
    tx = await _create_review_tx(db_session, user_id=880004)
    tx_id = tx.id

    with patch(
        "app.services.payout_service.execute_usdt_payout",
        new_callable=AsyncMock,
        side_effect=RuntimeError("RPC unavailable before broadcast"),
    ), patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock):
        response = await client.post(f"/api/v1/admin/withdrawals/{tx_id}/approve", headers=_admin_headers())

    assert response.status_code == 502
    db_session.expire_all()
    tx = (await db_session.execute(select(Transaction).where(Transaction.id == tx_id))).scalars().one()
    assert tx.status == PENDING_REVIEW_STATUS
    assert tx.reference_id == f"{REVIEW_REFERENCE_PREFIX}{DESTINATION}"
    assert tx.approved_by_admin_id == ADMIN_ID
    assert tx.approved_at is not None


@pytest.mark.asyncio
@pytest.mark.parametrize("message_hash", ["message_hash_123", None])
async def test_manual_approval_keeps_uncertain_broadcast_out_of_retryable_review(
    client: AsyncClient, db_session: AsyncSession, monkeypatch, test_engine, message_hash,
):
    if test_engine is None:
        return
    monkeypatch.setitem(settings.__dict__, "PAYOUT_MNEMONIC", "wood sphere valve heavy machine annual horn")
    tx = await _create_review_tx(db_session, user_id=880005 if message_hash else 880006)
    tx_id = tx.id

    with patch(
        "app.services.payout_service.execute_usdt_payout",
        new_callable=AsyncMock,
        side_effect=BlockchainBroadcastError("timeout", message_hash),
    ), patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock):
        response = await client.post(f"/api/v1/admin/withdrawals/{tx_id}/approve", headers=_admin_headers())

    assert response.status_code == 200
    assert response.json()["status"] == "approved_pending_reconciliation"
    db_session.expire_all()
    tx = (await db_session.execute(select(Transaction).where(Transaction.id == tx_id))).scalars().one()
    assert tx.status == "pending"
    assert tx.reference_id == message_hash
    assert tx.approved_by_admin_id == ADMIN_ID


@pytest.mark.asyncio
async def test_manual_rejection_refunds_and_persists_reviewer(
    client: AsyncClient, db_session: AsyncSession, test_engine,
):
    if test_engine is None:
        return
    tx = await _create_review_tx(db_session, user_id=880007)
    tx_id = tx.id

    with patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock):
        response = await client.post(f"/api/v1/admin/withdrawals/{tx_id}/reject", headers=_admin_headers())

    assert response.status_code == 200
    assert response.json()["rejected_by_admin_id"] == ADMIN_ID
    db_session.expire_all()
    tx = (await db_session.execute(select(Transaction).where(Transaction.id == tx_id))).scalars().one()
    user = (await db_session.execute(select(User).where(User.telegram_id == 880007))).scalars().one()
    assert tx.status == "failed"
    assert tx.reference_id == "rejected"
    assert tx.rejected_by_admin_id == ADMIN_ID
    assert tx.rejected_at is not None
    assert user.balance == 3_000


@pytest.mark.asyncio
async def test_manual_review_payout_stuck_after_restart_uses_existing_alert_path(
    db_session: AsyncSession, test_engine,
):
    if test_engine is None:
        return
    confirmation._seen_processing = set()
    tx = await _create_review_tx(db_session, user_id=880008)
    claimed, _ = await claim_payout(db_session, tx.id, ADMIN_ID)
    assert claimed

    with patch("app.core.alerts.send_alert_with_redis_rate_limit", new_callable=AsyncMock) as alert:
        assert await confirmation.alert_stuck_payouts() == 0
        assert await confirmation.alert_stuck_payouts() == 1

    args, kwargs = alert.await_args
    assert args[0] == f"stuck_payout:{tx.id}"
    assert DESTINATION in args[1]
    assert kwargs["system"] == "treasury"
