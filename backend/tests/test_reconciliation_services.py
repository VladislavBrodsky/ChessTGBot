"""Regression coverage for safe Stripe and withdrawal reconciliation."""
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base
from app.models.transaction import Transaction
from app.models.user import User
from app.services.stripe_reconciliation import reconcile_pending_stripe_sessions
from app.services.withdrawal_reconciliation import reconcile_nonterminal_withdrawals


@pytest.mark.asyncio
async def test_stripe_reconciliation_dry_run_never_mutates_pending_deposit(monkeypatch, tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'stripe_reconcile.db'}")
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with sessions() as db:
            user = User(telegram_id=91001, first_name="Stripe", balance=0)
            tx = Transaction(
                user_id=user.telegram_id,
                type="deposit",
                amount=1_000,
                fee=50,
                status="pending",
                reference_id="cs_dry_run",
                created_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=1),
            )
            db.add_all([user, tx])
            await db.commit()
            from app.core.config import get_settings
            monkeypatch.setattr(get_settings(), "STRIPE_SECRET_KEY", "sk_test_mock")
            checkout = {"status": "complete", "payment_status": "paid"}
            with patch("stripe.checkout.Session.retrieve", return_value=checkout):
                await reconcile_pending_stripe_sessions(db, dry_run=True)
            await db.refresh(user)
            await db.refresh(tx)
            assert user.balance == 0
            assert tx.status == "pending"
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_nonterminal_withdrawal_reconciliation_counts_all_states(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'withdrawal_reconcile.db'}")
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with sessions() as db:
            user = User(telegram_id=91002, first_name="Withdrawal", balance=0)
            db.add(user)
            for status in ("pending", "pending_confirmation", "pending_review", "processing_payout"):
                db.add(Transaction(user_id=user.telegram_id, type="withdrawal", amount=-1_000, status=status))
            await db.commit()
            with patch("app.core.alerts.send_alert_with_redis_rate_limit", new_callable=AsyncMock) as alert:
                summary = await reconcile_nonterminal_withdrawals(db)
            assert summary == {
                "pending": 1,
                "pending_confirmation": 1,
                "pending_review": 1,
                "processing_payout": 1,
            }
            alert.assert_not_awaited()
    finally:
        await engine.dispose()
