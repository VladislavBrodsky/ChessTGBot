import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.core.database import Base
from app.models.user import User
from app.models.transaction import Transaction
from app.services.withdrawal_crawler import process_withdrawal_success, process_withdrawal_failure

# Mock context manager to prevent pytest fixture session from being closed on __aexit__
class MockSessionContextManager:
    def __init__(self, session):
        self.session = session
    async def __aenter__(self):
        return self.session
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        # Prevent closing the session so we can inspect it in the test
        pass

@pytest_asyncio.fixture
async def db():
    # Use SQLite in-memory DB for unit testing
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as session:
        yield session
    await engine.dispose()

def _user(tid: int, balance: int) -> User:
    return User(
        telegram_id=tid,
        first_name=f"User{tid}",
        balance=balance,
        elo=1000,
        referral_code=f"REF{tid}"
    )

def _tx(user_id: int, type_: str, amount: int, status: str, reference_id: str) -> Transaction:
    return Transaction(
        user_id=user_id,
        type=type_,
        amount=amount,
        fee=20,
        status=status,
        reference_id=reference_id
    )

@pytest.mark.asyncio
async def test_process_withdrawal_success(db):
    user = _user(12345, 5000) # $50.00
    tx = _tx(12345, "withdrawal", -1000, "pending", "hash123") # -$10.00 withdrawal
    db.add_all([user, tx])
    await db.commit()

    # Mock TelegramService
    with patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock) as mock_send:
        # Patch AsyncSessionLocal directly in app.services.withdrawal_crawler module namespace
        with patch("app.services.withdrawal_crawler.AsyncSessionLocal", return_value=MockSessionContextManager(db)):
            await process_withdrawal_success(tx.id)
            
            # Re-fetch transaction and user
            tx_updated = (await db.execute(select(Transaction).where(Transaction.id == tx.id))).scalars().first()
            user_updated = (await db.execute(select(User).where(User.telegram_id == user.telegram_id))).scalars().first()
            
            assert tx_updated.status == "completed"
            assert user_updated.balance == 5000 # Balance shouldn't change on success since it was already debited
            mock_send.assert_called_once()

@pytest.mark.asyncio
async def test_process_withdrawal_failure(db):
    user = _user(12345, 5000) # $50.00
    tx = _tx(12345, "withdrawal", -1000, "pending", "hash123") # -$10.00 withdrawal
    db.add_all([user, tx])
    await db.commit()

    # Mock TelegramService
    with patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock) as mock_send:
        # Patch AsyncSessionLocal directly in app.services.withdrawal_crawler module namespace
        with patch("app.services.withdrawal_crawler.AsyncSessionLocal", return_value=MockSessionContextManager(db)):
            await process_withdrawal_failure(tx.id, "On-chain transaction execution failed")
            
            # Re-fetch transaction and user
            tx_updated = (await db.execute(select(Transaction).where(Transaction.id == tx.id))).scalars().first()
            user_updated = (await db.execute(select(User).where(User.telegram_id == user.telegram_id))).scalars().first()
            
            assert tx_updated.status == "failed"
            assert user_updated.balance == 6000 # Balance refunded! (5000 + 1000)
            mock_send.assert_called_once()
