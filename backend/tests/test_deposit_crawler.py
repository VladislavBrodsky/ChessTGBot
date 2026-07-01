import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.transaction import Transaction
from app.services.deposit_crawler import start_deposit_crawler
from app.core.config import get_settings
import asyncio

settings = get_settings()

@pytest.mark.asyncio
async def test_deposit_crawler_sync(db_session: AsyncSession, monkeypatch):
    if hasattr(db_session, "users"):
        return

    # 1. Create a user who made a deposit
    user = User(
        telegram_id=1016749901,
        first_name="Test User",
        balance=100  # starting balance: $1.00
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    # 2. Mock responses
    mock_events = {
        "events": [
            {
                "event_id": "3b9e9d5c3f2167e95a508da322f2c90f1260e6616066c7691a7dbbfd93f5c",
                "timestamp": 1782800000,
                "actions": [
                    {
                        "type": "JettonTransfer",
                        "status": "ok",
                        "JettonTransfer": {
                            "sender": {
                                "address": "UQCwh0uJfadY7I0"
                            },
                            "recipient": {
                                "address": settings.MASTER_WALLET_ADDRESS
                            },
                            "amount": "1050000",  # 1.05 USDT (6 decimals)
                            "comment": "ref_1016749901",
                            "jetton": {
                                "address": settings.USDT_MASTER,
                                "symbol": "USDT"
                            }
                        }
                    }
                ]
            }
        ]
    }
    
    mock_rates = {
        "rates": {
            "ton": {"prices": {"USD": 5.40}},
            settings.USDT_MASTER: {"prices": {"USD": 1.00}},
            settings.USDC_MASTER: {"prices": {"USD": 1.00}},
            settings.BTC_MASTER: {"prices": {"USD": 65000.00}},
            settings.ETH_MASTER: {"prices": {"USD": 3500.00}}
        }
    }
    
    # Mock httpx.AsyncClient response calls
    class MockResponse:
        def __init__(self, status_code, json_data):
            self.status_code = status_code
            self._json_data = json_data
        def json(self):
            return self._json_data

    async def mock_get(url, *args, **kwargs):
        if "events" in url:
            return MockResponse(200, mock_events)
        elif "rates" in url:
            return MockResponse(200, mock_rates)
        return MockResponse(404, {})

    # Mock httpx.AsyncClient instance
    mock_client = MagicMock()
    mock_client.get = AsyncMock(side_effect=mock_get)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    monkeypatch.setattr("httpx.AsyncClient", lambda *args, **kwargs: mock_client)
    
    # 3. Patch AsyncSessionLocal inside deposit_crawler to yield db_session
    from app.services import deposit_crawler
    
    class MockContextManager:
        def __init__(self, session):
            self.session = session
        async def __aenter__(self):
            return self.session
        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass
            
    monkeypatch.setattr(
        deposit_crawler,
        "AsyncSessionLocal",
        lambda: MockContextManager(db_session)
    )
    
    # Mock asyncio.sleep to run loop once and raise CancelledError
    sleep_count = 0
    async def mock_sleep(seconds):
        nonlocal sleep_count
        sleep_count += 1
        if sleep_count == 1:
            return
        raise asyncio.CancelledError()
        
    monkeypatch.setattr(asyncio, "sleep", mock_sleep)
    
    # 4. Run the crawler task
    try:
        await start_deposit_crawler()
    except asyncio.CancelledError:
        pass
        
    # 5. Check if User's balance was updated
    await db_session.refresh(user)
    # Starting balance was 100 ($1.00). Deposit was 105 cents.
    # Credited = 105 / 1.05 = 100 cents. Fee = 5 cents.
    # New balance should be 100 + 100 = 200 cents ($2.00)
    assert user.balance == 200
    
    # 6. Verify Transaction logs were written
    tx_deposit_res = await db_session.execute(
        select(Transaction).filter(
            Transaction.user_id == user.telegram_id,
            Transaction.type == "deposit"
        )
    )
    tx_deposit = tx_deposit_res.scalars().first()
    assert tx_deposit is not None
    assert tx_deposit.amount == 100
    assert tx_deposit.fee == 5
    assert tx_deposit.reference_id == "3b9e9d5c3f2167e95a508da322f2c90f1260e6616066c7691a7dbbfd93f5c"
