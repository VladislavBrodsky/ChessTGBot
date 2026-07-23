"""Money-safety tests for atomic withdrawal creation."""
import asyncio

import pytest
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base
from app.models.transaction import Transaction
from app.models.user import User
from app.services.withdrawal_confirmation import PENDING_STATUS, REF_PREFIX
from app.services.withdrawal_creation import (
    DailyWithdrawalCapExceeded,
    create_withdrawal,
    fail_and_refund_withdrawal,
)

DESTINATION = "UQCDg8ub3MGCVJSaNo2q3QGTg0bX71RmwrvVOfbrqAzYNuCN"


async def _seed_user(db: AsyncSession, telegram_id: int, balance: int) -> None:
    db.add(User(telegram_id=telegram_id, first_name="Withdrawal user", balance=balance))
    await db.commit()


@pytest.mark.asyncio
async def test_creation_commits_debit_and_ledger_row_together(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'withdrawal_creation.db'}")
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with sessions() as db:
            await _seed_user(db, 881001, 2_000)
            created = await create_withdrawal(
                db,
                user_id=881001,
                amount_cents=1_000,
                fee_cents=20,
                status=PENDING_STATUS,
                reference_id=f"{REF_PREFIX}{DESTINATION}",
                daily_cap_cents=10_000,
            )
            assert created.new_balance == 1_000
            assert created.transaction.id is not None

        async with sessions() as db:
            user = (await db.execute(select(User).where(User.telegram_id == 881001))).scalars().one()
            tx = (await db.execute(select(Transaction).where(Transaction.user_id == 881001))).scalars().one()
            assert user.balance == 1_000
            assert tx.amount == -1_000
            assert tx.status == PENDING_STATUS
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_ledger_failure_rolls_back_the_debit(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'withdrawal_rollback.db'}")
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with sessions() as db:
            await _seed_user(db, 881002, 2_000)

            @event.listens_for(db.sync_session, "before_flush")
            def reject_withdrawal_ledger(_session, _flush_context, _instances):
                if any(isinstance(item, Transaction) for item in _session.new):
                    raise RuntimeError("simulated ledger write failure")

            with pytest.raises(RuntimeError, match="ledger write failure"):
                await create_withdrawal(
                    db,
                    user_id=881002,
                    amount_cents=1_000,
                    fee_cents=20,
                    status=PENDING_STATUS,
                    reference_id=f"{REF_PREFIX}{DESTINATION}",
                    daily_cap_cents=10_000,
                )
            event.remove(db.sync_session, "before_flush", reject_withdrawal_ledger)

            user = (await db.execute(select(User).where(User.telegram_id == 881002))).scalars().one()
            transactions = (await db.execute(select(Transaction).where(Transaction.user_id == 881002))).scalars().all()
            assert user.balance == 2_000
            assert transactions == []
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_confirmation_delivery_failure_refunds_with_failed_ledger_row(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'withdrawal_refund.db'}")
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with sessions() as db:
            await _seed_user(db, 881003, 2_000)
            created = await create_withdrawal(
                db,
                user_id=881003,
                amount_cents=1_000,
                fee_cents=20,
                status=PENDING_STATUS,
                reference_id=f"{REF_PREFIX}{DESTINATION}",
                daily_cap_cents=10_000,
            )
            refunded_balance = await fail_and_refund_withdrawal(
                db,
                created.transaction.id,
                expected_status=PENDING_STATUS,
                reference_id="confirmation_undeliverable",
            )
            assert refunded_balance == 2_000

        async with sessions() as db:
            user = (await db.execute(select(User).where(User.telegram_id == 881003))).scalars().one()
            tx = (await db.execute(
                select(Transaction).where(Transaction.user_id == 881003, Transaction.type == "withdrawal")
            )).scalars().one()
            refund_tx = (await db.execute(
                select(Transaction).where(Transaction.user_id == 881003, Transaction.type == "withdrawal_refund")
            )).scalars().one()
            assert user.balance == 2_000
            assert tx.status == "failed"
            assert tx.reference_id == "confirmation_undeliverable"
            assert refund_tx.amount == 1_000
            assert refund_tx.reference_id == f"withdrawal_refund:{tx.id}"
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_pre_broadcast_failure_refunds_with_failed_ledger_row(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'withdrawal_payout_failure.db'}")
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with sessions() as db:
            await _seed_user(db, 881004, 2_000)
            created = await create_withdrawal(
                db,
                user_id=881004,
                amount_cents=1_000,
                fee_cents=20,
                status="processing_payout",
                reference_id=f"processing_payout:{DESTINATION}",
                daily_cap_cents=10_000,
            )
            refunded_balance = await fail_and_refund_withdrawal(
                db,
                created.transaction.id,
                expected_status="processing_payout",
                reference_id="payout_failed_before_broadcast",
            )
            assert refunded_balance == 2_000

        async with sessions() as db:
            user = (await db.execute(select(User).where(User.telegram_id == 881004))).scalars().one()
            tx = (await db.execute(
                select(Transaction).where(Transaction.user_id == 881004, Transaction.type == "withdrawal")
            )).scalars().one()
            refund_tx = (await db.execute(
                select(Transaction).where(Transaction.user_id == 881004, Transaction.type == "withdrawal_refund")
            )).scalars().one()
            assert user.balance == 2_000
            assert tx.status == "failed"
            assert tx.reference_id == "payout_failed_before_broadcast"
            assert refund_tx.amount == 1_000
            assert refund_tx.reference_id == f"withdrawal_refund:{tx.id}"
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_concurrent_withdrawals_cannot_bypass_the_daily_cap(test_engine):
    if test_engine is None:
        return
    if test_engine.url.drivername.startswith("sqlite"):
        pytest.skip("SQLite does not support row-level write locks (with_for_update), skip concurrency verification")
    sessions = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    user_id = 881005
    async with sessions() as db:
        await _seed_user(db, user_id, 2_000)

    async def create_attempt():
        async with sessions() as db:
            try:
                return await create_withdrawal(
                    db,
                    user_id=user_id,
                    amount_cents=600,
                    fee_cents=20,
                    status=PENDING_STATUS,
                    reference_id=f"{REF_PREFIX}{DESTINATION}",
                    daily_cap_cents=1_000,
                )
            except DailyWithdrawalCapExceeded:
                return None

    first, second = await asyncio.gather(create_attempt(), create_attempt())
    assert sum(result is not None for result in (first, second)) == 1

    async with sessions() as db:
        user = (await db.execute(select(User).where(User.telegram_id == user_id))).scalars().one()
        transactions = (await db.execute(select(Transaction).where(Transaction.user_id == user_id))).scalars().all()
        assert user.balance == 1_400
        assert len(transactions) == 1
        assert transactions[0].amount == -600
