"""
Gas grants (deposit gas-wall fix) — app/services/gas_grant.py.

A grant sends real TON from the master wallet, so every eligibility gate
matters: config gates, per-user/per-wallet cooldown, global daily cap, and
the on-chain proof (holds USDT, lacks TON).
"""
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.transaction import Transaction
from app.services.gas_grant import grant_gas, GasGrantDenied, GRANT_TX_TYPE

settings = get_settings()

WALLET = "UQCDg8ub3MGCVJSaNo2q3QGTg0bX71RmwrvVOfbrqAzYNuCN"
OTHER_WALLET = "UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN"


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _enable(monkeypatch):
    monkeypatch.setitem(settings.__dict__, "GAS_GRANT_ENABLED", True)
    monkeypatch.setitem(settings.__dict__, "PAYOUT_MNEMONIC", "wood sphere valve heavy machine annual horn")


def _eligible_balances():
    # (ton_nanoton, usdt_units): almost no TON, plenty of USDT
    return (1_000_000, 20_000_000)


@pytest.mark.asyncio
async def test_grant_denied_when_disabled(db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return
    monkeypatch.setitem(settings.__dict__, "GAS_GRANT_ENABLED", False)
    with pytest.raises(GasGrantDenied) as exc:
        await grant_gas(db_session, 661001, WALLET)
    assert exc.value.status_code == 503


@pytest.mark.asyncio
async def test_grant_denied_without_wallet(db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return
    _enable(monkeypatch)
    with pytest.raises(GasGrantDenied) as exc:
        await grant_gas(db_session, 661002, "")
    assert "Connect your wallet" in exc.value.detail


@pytest.mark.asyncio
async def test_grant_success_records_transaction(db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return
    _enable(monkeypatch)

    with patch("app.services.gas_grant.fetch_onchain_balances", new_callable=AsyncMock, return_value=_eligible_balances()), \
         patch("app.services.payout_service.execute_ton_transfer", new_callable=AsyncMock, return_value="grant_hash_1") as mock_send:
        result = await grant_gas(db_session, 661003, WALLET)

    assert result["status"] == "sent"
    assert result["message_hash"] == "grant_hash_1"
    mock_send.assert_awaited_once_with(WALLET, settings.GAS_GRANT_AMOUNT_NANOTON, comment="FinChess deposit gas grant")

    res = await db_session.execute(
        select(Transaction).where(Transaction.user_id == 661003, Transaction.type == GRANT_TX_TYPE)
    )
    tx = res.scalars().first()
    assert tx is not None
    assert tx.amount == 0                          # never touches platform balance
    assert tx.reference_id == f"gas_grant:{WALLET}:grant_hash_1"


@pytest.mark.asyncio
async def test_grant_cooldown_per_user_and_per_wallet(db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return
    _enable(monkeypatch)

    db_session.add(Transaction(
        user_id=661004, type=GRANT_TX_TYPE, amount=0, status="completed",
        reference_id=f"gas_grant:{WALLET}:old_hash",
    ))
    await db_session.commit()

    # Same user, different wallet -> denied
    with pytest.raises(GasGrantDenied) as exc:
        await grant_gas(db_session, 661004, OTHER_WALLET)
    assert "already received" in exc.value.detail

    # Different user, same wallet -> denied
    with pytest.raises(GasGrantDenied) as exc:
        await grant_gas(db_session, 661005, WALLET)
    assert "already received" in exc.value.detail


@pytest.mark.asyncio
async def test_grant_global_daily_cap(db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return
    _enable(monkeypatch)
    monkeypatch.setitem(settings.__dict__, "GAS_GRANT_DAILY_GLOBAL_CAP", 2)

    for i in range(2):
        db_session.add(Transaction(
            user_id=661100 + i, type=GRANT_TX_TYPE, amount=0, status="completed",
            reference_id=f"gas_grant:someone{i}:h{i}",
        ))
    await db_session.commit()

    with pytest.raises(GasGrantDenied) as exc:
        await grant_gas(db_session, 661006, WALLET)
    assert exc.value.status_code == 429


@pytest.mark.asyncio
async def test_grant_requires_onchain_usdt_and_no_ton(db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return
    _enable(monkeypatch)

    # Holds no USDT -> denied
    with patch("app.services.gas_grant.fetch_onchain_balances", new_callable=AsyncMock, return_value=(0, 0)):
        with pytest.raises(GasGrantDenied) as exc:
            await grant_gas(db_session, 661007, WALLET)
        assert "USDT" in exc.value.detail

    # Already has plenty of TON -> denied
    rich_ton = settings.GAS_GRANT_MAX_TON_BALANCE_NANO + 1
    with patch("app.services.gas_grant.fetch_onchain_balances", new_callable=AsyncMock, return_value=(rich_ton, 20_000_000)):
        with pytest.raises(GasGrantDenied) as exc:
            await grant_gas(db_session, 661007, WALLET)
        assert "already has enough TON" in exc.value.detail

    # No transaction was recorded by any denied attempt
    res = await db_session.execute(
        select(Transaction).where(Transaction.user_id == 661007, Transaction.type == GRANT_TX_TYPE)
    )
    assert res.scalars().first() is None
