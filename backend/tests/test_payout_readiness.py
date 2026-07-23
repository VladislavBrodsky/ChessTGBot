"""Fail-closed payout readiness and held-withdrawal regression tests."""
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.v1.endpoints.wallet import WithdrawRequest, withdraw_funds
from app.core.config import get_settings
from app.core.database import Base
from app.models.transaction import Transaction
from app.models.user import User
from app.services import withdrawal_confirmation as confirmation
from app.services.payout_readiness import get_payout_readiness

DESTINATION = "UQCDg8ub3MGCVJSaNo2q3QGTg0bX71RmwrvVOfbrqAzYNuCN"


def _settings(**overrides):
    values = {
        "TESTING": False,
        "ENV": "production",
        "PAYOUTS_ENABLED": False,
        "PAYOUT_MNEMONIC": "",
        "payout_configuration_error": "invalid_payout_mnemonic",
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_production_payouts_default_to_disabled():
    readiness = get_payout_readiness(_settings())
    assert readiness.ready is False
    assert readiness.mode == "disabled"
    assert readiness.reason == "payouts_disabled"


def test_production_enabled_payouts_require_valid_configuration():
    readiness = get_payout_readiness(_settings(PAYOUTS_ENABLED=True))
    assert readiness.ready is False
    assert readiness.reason == "invalid_payout_mnemonic"


def test_only_development_and_tests_can_use_mock_payouts():
    development = get_payout_readiness(_settings(ENV="development"))
    testing = get_payout_readiness(_settings(TESTING=True))
    production = get_payout_readiness(
        _settings(PAYOUTS_ENABLED=True, payout_configuration_error=None, PAYOUT_MNEMONIC="word " * 12)
    )

    assert (development.ready, development.mode) == (True, "mock")
    assert (testing.ready, testing.mode) == (True, "mock")
    assert (production.ready, production.mode) == (True, "real")


@pytest.mark.asyncio
async def test_disabled_production_withdrawal_does_not_debit_or_create_ledger(tmp_path, monkeypatch):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'payout_readiness.db'}")
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = get_settings()
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with sessions() as db:
            user = User(telegram_id=882001, first_name="No payout", balance=2_000)
            db.add(user)
            await db.commit()

            monkeypatch.setitem(settings.__dict__, "TESTING", False)
            monkeypatch.setitem(settings.__dict__, "ENV", "production")
            monkeypatch.setitem(settings.__dict__, "PAYOUTS_ENABLED", False)

            with pytest.raises(HTTPException) as exc:
                await withdraw_funds(WithdrawRequest(amount=1_000, address=DESTINATION), db, user)
            assert exc.value.status_code == 503

            balance = await db.scalar(select(User.balance).where(User.telegram_id == user.telegram_id))
            transactions = (await db.execute(select(Transaction).where(Transaction.user_id == user.telegram_id))).scalars().all()
            assert balance == 2_000
            assert transactions == []
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_held_confirmation_stays_held_when_payouts_are_disabled(tmp_path, monkeypatch):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'held_payout_readiness.db'}")
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = get_settings()
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with sessions() as db:
            user = User(telegram_id=882002, first_name="Held payout", balance=1_000)
            db.add(user)
            tx = Transaction(
                user_id=user.telegram_id,
                type="withdrawal",
                amount=-1_000,
                fee=20,
                status=confirmation.PENDING_STATUS,
                reference_id=f"{confirmation.REF_PREFIX}{DESTINATION}",
            )
            db.add(tx)
            await db.commit()
            await db.refresh(tx)
            tx_id = tx.id

        import app.core.database as core_database
        monkeypatch.setattr(core_database, "AsyncSessionLocal", sessions)
        monkeypatch.setitem(settings.__dict__, "TESTING", False)
        monkeypatch.setitem(settings.__dict__, "ENV", "production")
        monkeypatch.setitem(settings.__dict__, "PAYOUTS_ENABLED", False)

        message, done = await confirmation.confirm_withdrawal(
            tx_id,
            882002,
            confirmation.confirmation_nonce(tx_id, 882002),
        )
        assert done is False
        assert "Temporarily Unavailable" in message

        async with sessions() as db:
            tx = (await db.execute(select(Transaction).where(Transaction.id == tx_id))).scalars().one()
            user = (await db.execute(select(User).where(User.telegram_id == 882002))).scalars().one()
            assert tx.status == confirmation.PENDING_STATUS
            assert user.balance == 1_000
    finally:
        await engine.dispose()
