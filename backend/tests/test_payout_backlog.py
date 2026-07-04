import pytest
from unittest.mock import patch, AsyncMock
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.transaction import Transaction
from app.process_payouts_backlog import process_payouts_backlog

@pytest.mark.asyncio
async def test_process_payouts_backlog_executes_real_payout(db_session: AsyncSession):
    """Verify that process_payouts_backlog identifies simulated/mock withdrawals and executes on-chain transfers."""
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # 1. Create a user with a wallet address
    telegram_id = 777001
    wallet_address = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
    user = User(
        telegram_id=telegram_id,
        first_name="BacklogTestUser",
        username="backlog_test_user",
        wallet_address=wallet_address,
        balance=1000,
        xp=0,
        level=1
    )
    db_session.add(user)
    await db_session.commit()

    # 2. Create a mock withdrawal transaction in completed state (simulated)
    tx = Transaction(
        user_id=telegram_id,
        type="withdrawal",
        amount=-500,  # -$5.00
        fee=100,      # $1.00 fee
        status="completed",
        reference_id="mock_tx_12345"
    )
    db_session.add(tx)
    await db_session.commit()
    await db_session.refresh(tx)

    # 3. Patch execute_usdt_payout and TelegramService.send_notification
    with patch("app.process_payouts_backlog.execute_usdt_payout", new_callable=AsyncMock) as mock_payout, \
         patch("app.process_payouts_backlog.TelegramService.send_notification", new_callable=AsyncMock) as mock_notify, \
         patch("app.process_payouts_backlog.get_settings") as mock_settings:
         
         # Mock settings to return a payout mnemonic
         mock_settings.return_value.PAYOUT_MNEMONIC = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
         mock_payout.return_value = "ton_tx_hash_abc123"

         # Run backlog processor
         await process_payouts_backlog(db_session)

         # 4. Assert execute_usdt_payout was called with correct address and amount
         mock_payout.assert_called_once_with(wallet_address, 500)

         # 5. Assert the transaction record in DB was updated with the real hash
         result = await db_session.execute(
             select(Transaction).where(Transaction.id == tx.id)
         )
         updated_tx = result.scalars().first()
         assert updated_tx is not None
         assert updated_tx.reference_id == "ton_tx_hash_abc123"

         # 6. Assert user was notified
         mock_notify.assert_called_once()
         assert telegram_id in mock_notify.call_args[0]
         assert "Withdrawal Transferred On-Chain" in mock_notify.call_args[0][1]
