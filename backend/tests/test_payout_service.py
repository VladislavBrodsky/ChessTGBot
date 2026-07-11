import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.transaction import Transaction
from app.core.config import get_settings
from urllib.parse import quote
import json

settings = get_settings()

@pytest.mark.asyncio
async def test_withdraw_simulated_fallback(client: AsyncClient, db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return

    # 1. Ensure PAYOUT_MNEMONIC is empty
    monkeypatch.setitem(settings.__dict__, "PAYOUT_MNEMONIC", "")
    monkeypatch.setitem(settings.__dict__, "WITHDRAWAL_CONFIRMATION_ENABLED", False)

    # 2. Create user
    telegram_id = 777001
    user = User(
        telegram_id=telegram_id,
        first_name="MockUser",
        balance=3000  # $30.00
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'MockUser'}))}"
    headers = {"X-Telegram-Init-Data": init_data}

    # 3. Request withdrawal (simulated fallback)
    dest_address = "UQCDg8ub3MGCVJSaNo2q3QGTg0bX71RmwrvVOfbrqAzYNuCN"
    res = await client.post(
        "/api/v1/wallet/withdraw",
        json={"amount": 1000, "address": dest_address},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "completed"
    assert data["new_balance"] == 2000

    # 4. Check database transaction
    from sqlalchemy import select
    result = await db_session.execute(
        select(Transaction).where(Transaction.user_id == telegram_id, Transaction.type == "withdrawal")
    )
    tx = result.scalars().first()
    assert tx is not None
    assert tx.status == "completed"
    assert tx.reference_id.startswith("mock_")

@pytest.mark.asyncio
@patch("app.services.payout_service.execute_usdt_payout", new_callable=AsyncMock)
async def test_withdraw_real_onchain_success(mock_execute, client: AsyncClient, db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return

    # 1. Enable PAYOUT_MNEMONIC
    monkeypatch.setitem(settings.__dict__, "WITHDRAWAL_CONFIRMATION_ENABLED", False)
    monkeypatch.setitem(settings.__dict__, "PAYOUT_MNEMONIC", "wood sphere valve heavy machine annual horn burden swift opinion mind motion wear layer reduce that arctic worth dry forward reward seek gather luxury")
    mock_execute.return_value = "c6becda5805dcee9e000a32be92d35af2c14b02d446ff8f5231e908261a78de3"
    
    # 2. Create user
    telegram_id = 777002
    user = User(
        telegram_id=telegram_id,
        first_name="RealUser",
        balance=3000
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'RealUser'}))}"
    headers = {"X-Telegram-Init-Data": init_data}

    # 3. Request withdrawal (real on-chain success)
    dest_address = "UQCDg8ub3MGCVJSaNo2q3QGTg0bX71RmwrvVOfbrqAzYNuCN"
    res = await client.post(
        "/api/v1/wallet/withdraw",
        json={"amount": 1000, "address": dest_address},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "pending"
    assert data["new_balance"] == 2000

    # Verify mock was called with net payout (amount - flat fee = 1000 - 20 = 980 cents)
    mock_execute.assert_called_once_with(dest_address, 980)

    # 4. Check database transaction reference_id is the transaction hash
    from sqlalchemy import select
    result = await db_session.execute(
        select(Transaction).where(Transaction.user_id == telegram_id, Transaction.type == "withdrawal")
    )
    tx = result.scalars().first()
    assert tx is not None
    assert tx.status == "pending"
    assert tx.reference_id == "c6becda5805dcee9e000a32be92d35af2c14b02d446ff8f5231e908261a78de3"

@pytest.mark.asyncio
async def test_withdraw_amount_below_minimum(client: AsyncClient, db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return

    telegram_id = 777003
    user = User(
        telegram_id=telegram_id,
        first_name="LimitUser",
        balance=3000
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'LimitUser'}))}"
    headers = {"X-Telegram-Init-Data": init_data}

    # Request withdrawal below $10.00 (e.g. 500 cents / $5.00)
    dest_address = "UQCDg8ub3MGCVJSaNo2q3QGTg0bX71RmwrvVOfbrqAzYNuCN"
    res = await client.post(
        "/api/v1/wallet/withdraw",
        json={"amount": 500, "address": dest_address},
        headers=headers
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "Minimum withdrawal amount is $10.00 USDT"


@pytest.mark.asyncio
@patch("app.services.payout_service.execute_usdt_payout", new_callable=AsyncMock)
async def test_withdraw_real_onchain_broadcast_timeout(mock_execute, client: AsyncClient, db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return

    from app.services.payout_service import BlockchainBroadcastError

    # 1. Enable PAYOUT_MNEMONIC and mock broadcast timeout exception
    monkeypatch.setitem(settings.__dict__, "WITHDRAWAL_CONFIRMATION_ENABLED", False)
    monkeypatch.setitem(settings.__dict__, "PAYOUT_MNEMONIC", "wood sphere valve heavy machine annual horn burden swift opinion mind motion wear layer reduce that arctic worth dry forward reward seek gather luxury")
    mock_execute.side_effect = BlockchainBroadcastError(
        "Blockchain broadcast failure: timeout", "mocked_broadcast_timeout_msg_hash"
    )
    
    # 2. Create user
    telegram_id = 777004
    user = User(
        telegram_id=telegram_id,
        first_name="TimeoutUser",
        balance=3000
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'TimeoutUser'}))}"
    headers = {"X-Telegram-Init-Data": init_data}

    # 3. Request withdrawal (should result in broadcast timeout error but NOT refund the balance)
    dest_address = "UQCDg8ub3MGCVJSaNo2q3QGTg0bX71RmwrvVOfbrqAzYNuCN"
    res = await client.post(
        "/api/v1/wallet/withdraw",
        json={"amount": 1000, "address": dest_address},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    # Payout is saved in "pending" status and hot wallet balance remains debited (new balance: 2000)
    assert data["status"] == "pending"
    assert data["new_balance"] == 2000

    # 4. Check database transaction references the locally generated msg_hash
    from sqlalchemy import select
    result = await db_session.execute(
        select(Transaction).where(Transaction.user_id == telegram_id, Transaction.type == "withdrawal")
    )
    tx = result.scalars().first()
    assert tx is not None
    assert tx.status == "pending"
    assert tx.reference_id == "mocked_broadcast_timeout_msg_hash"
