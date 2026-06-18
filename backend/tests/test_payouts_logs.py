import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta
import json
from urllib.parse import quote

from app.models.user import User
from app.models.transaction import Transaction
from app.models.xp_transaction import XpTransaction
from app.models.gamification import Task, UserTask, TaskType
from app.services.gamification_service import GamificationService

@pytest.mark.asyncio
async def test_withdrawal_queue_admin_approve_reject(client: AsyncClient, db_session: AsyncSession):
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

    # 2. Initiate withdrawal of $20.00 (2000 cents)
    dest_address = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
    res = await client.post(
        "/api/v1/wallet/withdraw",
        json={"amount": 2000, "address": dest_address},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "pending_review"
    assert data["new_balance"] == 3000

    # 3. Verify it is logged as pending_review in database
    result = await db_session.execute(
        select(Transaction).where(Transaction.user_id == telegram_id, Transaction.type == "withdrawal")
    )
    tx = result.scalars().first()
    assert tx is not None
    assert tx.status == "pending_review"
    assert tx.reference_id == f"addr_{dest_address}"

    # 4. Try to approve/reject without secret key -> 401
    res_approve_fail = await client.post(f"/api/v1/wallet/admin/withdrawals/{tx.id}/approve")
    assert res_approve_fail.status_code == 401

    # 5. Fetch pending withdrawals list as Admin
    admin_headers = {"X-Admin-Secret": "dev_webhook_secret"}
    res_list = await client.get("/api/v1/wallet/admin/withdrawals/pending", headers=admin_headers)
    assert res_list.status_code == 200
    pending_list = res_list.json()
    assert len(pending_list) == 1
    assert pending_list[0]["id"] == tx.id
    assert pending_list[0]["amount"] == 2000
    assert pending_list[0]["address"] == dest_address

    # 6. Approve the withdrawal
    res_approve = await client.post(f"/api/v1/wallet/admin/withdrawals/{tx.id}/approve", headers=admin_headers)
    assert res_approve.status_code == 200
    assert "completed successfully" in res_approve.json()["message"]

    # 7. Check database status is completed
    await db_session.refresh(tx)
    assert tx.status == "completed"

    # 8. Create another withdrawal of $10.00 (1000 cents)
    res_w2 = await client.post(
        "/api/v1/wallet/withdraw",
        json={"amount": 1000, "address": dest_address},
        headers=headers
    )
    assert res_w2.status_code == 200
    
    result2 = await db_session.execute(
        select(Transaction).where(Transaction.user_id == telegram_id, Transaction.status == "pending_review")
    )
    tx2 = result2.scalars().first()
    assert tx2 is not None

    # 9. Reject the withdrawal
    res_reject = await client.post(f"/api/v1/wallet/admin/withdrawals/{tx2.id}/reject", headers=admin_headers)
    assert res_reject.status_code == 200
    assert "rejected and refunded" in res_reject.json()["message"]

    # 10. Check transaction status is failed and user balance is refunded
    await db_session.refresh(tx2)
    assert tx2.status == "failed"
    await db_session.refresh(user)
    assert user.balance == 3000  # Refunded from 2000 back to 3000


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
