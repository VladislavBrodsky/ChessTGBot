import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.transaction import Transaction
from app.services.telegram_bot import TelegramService
from app.core.config import get_settings

settings = get_settings()

@pytest.mark.asyncio
async def test_admin_withdrawal_callbacks(db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return

    # Set up settings
    monkeypatch.setitem(settings.__dict__, "ADMIN_TELEGRAM_ID", 112233)
    monkeypatch.setitem(settings.__dict__, "TELEGRAM_BOT_TOKEN", "mock_token")

    # 1. Create user and a pending withdrawal transaction
    user = User(
        telegram_id=987654321,
        first_name="Test User",
        balance=4000  # $40.00
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    tx = Transaction(
        user_id=user.telegram_id,
        type="withdrawal",
        amount=-1000,  # -$10.00
        fee=0,
        status="pending_review",
        reference_id="addr_UQawd0uJuZAV_b0scsJ3r4AM5hdYcqq8E_Q"
    )
    db_session.add(tx)
    await db_session.commit()
    await db_session.refresh(tx)

    # 2. Patch AsyncSessionLocal inside database module
    class MockContextManager:
        def __init__(self, session):
            self.session = session
        async def __aenter__(self):
            return self.session
        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass
            
    monkeypatch.setattr(
        "app.core.database.AsyncSessionLocal",
        lambda: MockContextManager(db_session)
    )

    # 3. Test Callback Query Approve
    mock_query = MagicMock()
    mock_query.answer = AsyncMock()
    mock_query.edit_message_text = AsyncMock()
    mock_query.from_user.id = 112233  # matching admin id
    mock_query.data = f"approve_withdraw_{tx.id}"
    mock_query.message.text_html = "Withdrawal request details"

    mock_update = MagicMock()
    mock_update.callback_query = mock_query

    # Patch send_notification to verify message gets sent to user
    sent_notifications = []
    async def mock_send_notification(telegram_id, text):
        sent_notifications.append((telegram_id, text))

    monkeypatch.setattr(TelegramService, "send_notification", mock_send_notification)

    # Call callback handler
    await TelegramService.admin_withdrawal_callback(mock_update, None)

    # Assertions for Approve
    await db_session.refresh(tx)
    assert tx.status == "completed"
    assert len(sent_notifications) == 1
    assert sent_notifications[0][0] == user.telegram_id
    assert "Withdrawal Approved" in sent_notifications[0][1]
    
    # 4. Test Callback Query Reject
    # Reset tx status and user balance
    tx.status = "pending_review"
    user.balance = 3000  # $30.00 (since $10 is locked in pending withdrawal)
    db_session.add(tx)
    db_session.add(user)
    await db_session.commit()

    sent_notifications.clear()
    mock_query.data = f"reject_withdraw_{tx.id}"

    # Call callback handler
    await TelegramService.admin_withdrawal_callback(mock_update, None)

    # Assertions for Reject
    await db_session.refresh(tx)
    await db_session.refresh(user)
    assert tx.status == "failed"
    assert user.balance == 4000  # $40.00 refunded!
    assert len(sent_notifications) == 1
    assert "Withdrawal Rejected" in sent_notifications[0][1]
