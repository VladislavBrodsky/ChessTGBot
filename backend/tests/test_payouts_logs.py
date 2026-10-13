import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
from urllib.parse import quote

from app.models.user import User
from app.models.transaction import Transaction
from app.models.xp_transaction import XpTransaction
from app.services.gamification_service import GamificationService

@pytest.mark.asyncio
async def test_withdrawal_waits_for_confirmation(client: AsyncClient, db_session: AsyncSession, monkeypatch):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # 1. Create a user with balance
    telegram_id = 888001
    user = User(
        telegram_id=telegram_id,
        first_name="WithdrawUser",
        username="withdraw_user",
        balance=5000,  # $50.00
        is_premium=False,
        xp=100,
        level=1
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'WithdrawUser'}))}"
    headers = {"X-Telegram-Init-Data": init_data}

    from unittest.mock import AsyncMock
    from app.services.telegram_bot import TelegramService
    from app.core.config import get_settings
    settings = get_settings()
    # CI has no bot secret. Select the confirmation path explicitly and mock
    # delivery so this test never relies on local credentials or Telegram.
    monkeypatch.setattr(settings, "TELEGRAM_BOT_TOKEN", "123456789:test_token")
    monkeypatch.setattr(settings, "WITHDRAWAL_CONFIRMATION_ENABLED", True)
    confirmation = AsyncMock(return_value=True)
    monkeypatch.setattr(TelegramService, "send_withdrawal_confirmation_request", confirmation)
    # 2. Initiate withdrawal of $20.00 (2000 cents)
    dest_address = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
    res = await client.post(
        "/api/v1/wallet/withdraw",
        json={"amount": 2000, "address": dest_address},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "pending_confirmation"
    assert data["new_balance"] == 3000

    # 3. Money is held pending second-factor confirmation; no payout is made.
    result = await db_session.execute(
        select(Transaction).where(Transaction.user_id == telegram_id, Transaction.type == "withdrawal")
    )
    tx_auto = result.scalars().first()
    assert tx_auto is not None
    assert tx_auto.status == "pending_confirmation"
    confirmation.assert_awaited_once()
    assert confirmation.call_args.kwargs["tx_id"] == tx_auto.id
    assert confirmation.call_args.kwargs["nonce"]




@pytest.mark.asyncio
async def test_xp_transaction_auditing_logs(client: AsyncClient, db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # 1. Create a user
    telegram_id = 888002
    user = User(
        telegram_id=telegram_id,
        first_name="AuditUser",
        username="audit_user",
        xp=0,
        level=1
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'AuditUser'}))}"
    headers = {"X-Telegram-Init-Data": init_data}

    # 2. Add XP for activity and check XpTransaction created
    await GamificationService.add_xp(db_session, user, 150, trigger_kickback=False, reason="game_win", reference_id="game_123")
    await db_session.commit()

    # Verify log entry in database
    result = await db_session.execute(
        select(XpTransaction).where(XpTransaction.user_id == telegram_id)
    )
    txs = result.scalars().all()
    assert len(txs) == 1
    assert txs[0].amount == 150
    assert txs[0].reason == "game_win"
    assert txs[0].reference_id == "game_123"

    # 3. Call get_xp_transactions endpoint
    response = await client.get("/api/v1/gamification/xp-transactions", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["amount"] == 150
    assert data[0]["reason"] == "game_win"
    assert data[0]["reference_id"] == "game_123"
