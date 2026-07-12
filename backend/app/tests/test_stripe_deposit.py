import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.database import Base
from app.models.user import User
from app.models.transaction import Transaction
from app.core.config import get_settings
from app.api.v1.endpoints.wallet import (
    stripe_create_session,
    stripe_verify_session,
    stripe_webhook,
    StripeSessionRequest
)

@pytest_asyncio.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as session:
        yield session
    await engine.dispose()

def _user(tid: int, balance: int = 0) -> User:
    return User(telegram_id=tid, first_name=f"U{tid}", balance=balance, elo=1000)

@pytest.mark.asyncio
async def test_stripe_create_session_success(db, monkeypatch):
    user = _user(12345, 100)
    db.add(user)
    await db.commit()

    # Mock stripe.checkout.Session.create
    mock_session = MagicMock()
    mock_session.id = "cs_test_session123"
    mock_session.url = "https://checkout.stripe.com/pay/cs_test_session123"
    
    with patch("stripe.checkout.Session.create", return_value=mock_session) as mock_create:
        settings = get_settings()
        monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")
        monkeypatch.setattr(settings, "WEBAPP_URL", "https://chesstgbot-frontend.com")

        req = StripeSessionRequest(amount=10.00, redirect_path="/membership")
        res = await stripe_create_session(req, current_user=user, db=db)

        # Check Stripe Checkout was called with the custom success/cancel URLs containing redirect_path
        args, kwargs = mock_create.call_args
        assert kwargs["success_url"] == "https://chesstgbot-frontend.com/membership?status=success&session_id={CHECKOUT_SESSION_ID}"
        assert kwargs["cancel_url"] == "https://chesstgbot-frontend.com/membership?status=cancel"

        assert res.session_id == "cs_test_session123"
        assert res.checkout_url == "https://checkout.stripe.com/pay/cs_test_session123"

        # Verify transaction created in DB in pending state
        tx_result = await db.execute(
            select(Transaction).filter(Transaction.reference_id == "cs_test_session123")
        )
        tx = tx_result.scalars().first()
        assert tx is not None
        assert tx.user_id == 12345
        assert tx.amount == 1000  # $10.00 in cents
        assert tx.fee == 50       # 5% fee in cents
        assert tx.status == "pending"

@pytest.mark.asyncio
async def test_stripe_verify_session(db):
    user = _user(12345, 100)
    db.add(user)
    db.add(Transaction(
        user_id=12345,
        type="deposit",
        amount=1000,
        fee=50,
        status="completed",
        reference_id="cs_test_verify"
    ))
    await db.commit()

    res = await stripe_verify_session("cs_test_verify", current_user=user, db=db)
    assert res.status == "completed"
    assert res.credited_amount == 1000
    assert res.new_balance == 100

@pytest.mark.asyncio
async def test_stripe_webhook_success(db, monkeypatch):
    user = _user(12345, 0)
    db.add(user)
    
    pending_tx = Transaction(
        id=999,
        user_id=12345,
        type="deposit",
        amount=1000,
        fee=50,
        status="pending",
        reference_id="cs_test_webhook"
    )
    db.add(pending_tx)
    await db.commit()

    # Mock stripe event
    mock_event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_webhook",
                "metadata": {
                    "tx_id": "999",
                    "user_id": "12345"
                }
            }
        }
    }

    # Mock request and construct_event
    mock_request = MagicMock()
    mock_request.body = AsyncMock(return_value=b"mock_payload")

    with patch("stripe.Webhook.construct_event", return_value=mock_event), \
         patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock) as mock_tg:
        
        settings = get_settings()
        monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")
        monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_mock")

        # Call Webhook
        res = await stripe_webhook(request=mock_request, stripe_signature="sig", db=db)
        assert res["status"] == "success"

        # Verify DB Updates
        await db.refresh(user)
        assert user.balance == 1000 # Credited $10.00
        
        # Verify transaction completed
        await db.refresh(pending_tx)
        assert pending_tx.status == "completed"

        # Verify fee logged
        fee_result = await db.execute(
            select(Transaction).filter(Transaction.type == "deposit_fee")
        )
        fee_tx = fee_result.scalars().first()
        assert fee_tx is not None
        assert fee_tx.amount == -50

        # Verify telegram notified
        assert mock_tg.called
