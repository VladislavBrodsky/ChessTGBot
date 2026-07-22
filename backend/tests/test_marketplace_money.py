"""TEST-02 coverage for marketplace XR balance mutations."""
from datetime import datetime, timezone

import pytest
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.v1.endpoints.marketplace import PurchaseRequest, purchase_direct_item
from app.core.database import Base
from app.models.transaction import Transaction
from app.models.user import User
from app.models.xp_transaction import XpTransaction


async def _create_user(db: AsyncSession, telegram_id: int, balance: int, xp: int = 0) -> User:
    user = User(telegram_id=telegram_id, first_name="Marketplace user", balance=balance, xp=xp)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.mark.asyncio
async def test_xr_purchase_debits_once_and_writes_a_complete_audit_row(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'marketplace_audit.db'}")
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        async with sessions() as db:
            user = await _create_user(db, 771001, 120_000)
            result = await purchase_direct_item(
                PurchaseRequest(item_id="premium_1m", currency="xr"), user, db
            )
            assert result["success"] is True
            assert result["balance"] == 20_000

        async with sessions() as db:
            user = (await db.execute(select(User).where(User.telegram_id == 771001))).scalars().one()
            ledger = (await db.execute(
                select(Transaction).where(Transaction.user_id == 771001, Transaction.type == "marketplace_purchase")
            )).scalars().one()
            assert user.balance == 20_000
            assert user.is_premium is True
            assert user.premium_expires_at > datetime.now(timezone.utc).replace(tzinfo=None)
            assert ledger.amount == -100_000
            assert ledger.status == "completed"
            assert ledger.reference_id == "purchase_premium_1m"
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_xp_purchase_debits_once_and_records_the_xp_audit_row(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'marketplace_xp_audit.db'}")
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        async with sessions() as db:
            user = await _create_user(db, 771003, 0, xp=20_000)
            result = await purchase_direct_item(
                PurchaseRequest(item_id="premium_1m", currency="xp"), user, db
            )
            assert result["success"] is True
            assert result["xp"] == 5_000

        async with sessions() as db:
            user = (await db.execute(select(User).where(User.telegram_id == 771003))).scalars().one()
            ledger = (await db.execute(
                select(XpTransaction).where(XpTransaction.user_id == 771003)
            )).scalars().one()
            assert user.xp == 5_000
            assert user.is_premium is True
            assert ledger.amount == -15_000
            assert ledger.reason == "purchase_spend_premium_1m"
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_xp_purchase_commit_failure_rolls_back_the_debit_and_audit_row(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'marketplace_xp_rollback.db'}")
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        async with sessions() as db:
            user = await _create_user(db, 771004, 0, xp=20_000)

            @event.listens_for(db.sync_session, "before_flush")
            def reject_xp_ledger(_session, _flush_context, _instances):
                if any(isinstance(item, XpTransaction) for item in _session.new):
                    raise RuntimeError("simulated XP ledger failure")

            with pytest.raises(RuntimeError, match="XP ledger failure"):
                await purchase_direct_item(
                    PurchaseRequest(item_id="premium_1m", currency="xp"), user, db
                )
            event.remove(db.sync_session, "before_flush", reject_xp_ledger)
            await db.rollback()

        async with sessions() as db:
            user = (await db.execute(select(User).where(User.telegram_id == 771004))).scalars().one()
            ledger_rows = (await db.execute(
                select(XpTransaction).where(XpTransaction.user_id == 771004)
            )).scalars().all()
            assert user.xp == 20_000
            assert user.is_premium is False
            assert ledger_rows == []
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_xr_purchase_commit_failure_rolls_back_debit_and_audit_row(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'marketplace_rollback.db'}")
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        async with sessions() as db:
            user = await _create_user(db, 771002, 120_000)

            @event.listens_for(db.sync_session, "before_flush")
            def reject_marketplace_ledger(_session, _flush_context, _instances):
                if any(isinstance(item, Transaction) for item in _session.new):
                    raise RuntimeError("simulated marketplace ledger failure")

            with pytest.raises(RuntimeError, match="marketplace ledger failure"):
                await purchase_direct_item(
                    PurchaseRequest(item_id="premium_1m", currency="xr"), user, db
                )
            event.remove(db.sync_session, "before_flush", reject_marketplace_ledger)
            await db.rollback()

        async with sessions() as db:
            user = (await db.execute(select(User).where(User.telegram_id == 771002))).scalars().one()
            ledger_rows = (await db.execute(
                select(Transaction).where(Transaction.user_id == 771002, Transaction.type == "marketplace_purchase")
            )).scalars().all()
            assert user.balance == 120_000
            assert user.is_premium is False
            assert ledger_rows == []
    finally:
        await engine.dispose()
