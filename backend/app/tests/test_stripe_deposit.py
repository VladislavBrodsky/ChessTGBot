import pytest
import pytest_asyncio
import stripe
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.database import Base
from app.models.user import User
from app.models.transaction import Transaction
from app.models.stripe_event import StripeWebhookEvent
from app.core.config import get_settings
from app.api.v1.endpoints.wallet import (
    stripe_create_session,
    stripe_verify_session,
    stripe_webhook,
    StripeSessionRequest,
    StripeSubscribeRequest,
    create_stripe_subscription,
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
        assert tx.amount == 950   # credited amount: $10.00 charged minus 5% fee
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
        "id": "evt_topup_999",
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
    mock_event = stripe.Event.construct_from(mock_event, "sk_test_mock")

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
        assert mock_tg.call_count == 3  # 1 for user, 2 for admins
        calls = mock_tg.call_args_list
        
        # User notification
        assert calls[0][0][0] == 12345
        assert "Card Top-Up Confirmed!" in calls[0][0][1]
        
        # Admin alerts (order-independent because admin_telegram_ids is a set)
        admin_calls = {call[0][0]: call[0][1] for call in calls[1:]}
        assert set(admin_calls.keys()) == {1016749901, 716720099}
        
        for admin_id, msg in admin_calls.items():
            assert "New Stripe deposit" in msg
            assert "User: ID 12345" in msg
            assert "Amount: $10.50" in msg
            assert "Transaction ID: cs_test_webhook" in msg


@pytest.mark.asyncio
async def test_stripe_webhook_event_replay_is_a_noop(db, monkeypatch):
    user = _user(445566, 0)
    pending_tx = Transaction(
        user_id=user.telegram_id,
        type="deposit",
        amount=1_000,
        fee=50,
        status="pending",
        reference_id="cs_event_replay",
    )
    db.add_all([user, pending_tx])
    await db.commit()

    event = {
        "id": "evt_replay_once",
        "type": "checkout.session.completed",
        "data": {"object": {"id": "cs_event_replay", "metadata": {
            "tx_id": str(pending_tx.id), "user_id": str(user.telegram_id),
        }}},
    }
    request = MagicMock()
    request.body = AsyncMock(return_value=b"payload")
    settings = get_settings()
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_mock")

    with patch("stripe.Webhook.construct_event", return_value=event), \
         patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock):
        first = await stripe_webhook(request=request, stripe_signature="sig", db=db)
        second = await stripe_webhook(request=request, stripe_signature="sig", db=db)

    await db.refresh(user)
    await db.refresh(pending_tx)
    receipts = (await db.execute(select(StripeWebhookEvent))).scalars().all()
    fees = (await db.execute(select(Transaction).where(Transaction.type == "deposit_fee"))).scalars().all()
    assert first["status"] == "success"
    assert second["status"] == "ignored"
    assert user.balance == 1_000
    assert pending_tx.status == "completed"
    assert len(receipts) == 1
    assert len(fees) == 1


@pytest.mark.asyncio
async def test_subscription_checkout_only_links_stripe_objects(db, monkeypatch):
    """Checkout completion is not proof of collection; the paid invoice grants access."""
    user = _user(45678, 0)
    db.add(user)
    await db.commit()

    event = {
        "type": "checkout.session.completed",
        "data": {"object": {
            "mode": "subscription", "client_reference_id": "45678",
            "customer": "cus_456", "subscription": "sub_456",
        }},
    }
    request = MagicMock()
    request.body = AsyncMock(return_value=b"payload")
    subscription = {"items": {"data": [{"price": {"id": "price_monthly"}}]}}

    settings = get_settings()
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_mock")
    monkeypatch.setattr(settings, "STRIPE_MONTHLY_PRICE_ID", "price_monthly")
    with patch("stripe.Webhook.construct_event", return_value=event), \
         patch("stripe.Subscription.retrieve", return_value=subscription):
        result = await stripe_webhook(request=request, stripe_signature="sig", db=db)

    await db.refresh(user)
    assert result["status"] == "success"
    assert user.stripe_customer_id == "cus_456"
    assert user.stripe_subscription_id == "sub_456"
    assert user.is_premium is False
    assert user.premium_expires_at is None


@pytest.mark.asyncio
async def test_paid_subscription_invoice_activates_once_and_stays_out_of_wallet_ledger(db, monkeypatch):
    user = _user(56789, 0)
    user.stripe_customer_id = "cus_567"
    user.stripe_subscription_id = "sub_567"
    db.add(user)
    await db.commit()

    event = {
        "type": "invoice.payment_succeeded",
        "data": {"object": {
            "id": "in_567", "subscription": "sub_567", "amount_paid": 999,
        }},
    }
    request = MagicMock()
    request.body = AsyncMock(return_value=b"payload")
    subscription = {
        "metadata": {"user_id": "56789", "tier": "premium"},
        "items": {"data": [{"price": {"id": "price_monthly"}}]},
    }
    settings = get_settings()
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_mock")
    monkeypatch.setattr(settings, "STRIPE_MONTHLY_PRICE_ID", "price_monthly")

    with patch("stripe.Webhook.construct_event", return_value=event), \
         patch("stripe.Subscription.retrieve", return_value=subscription), \
         patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock) as mock_tg:
        first = await stripe_webhook(request=request, stripe_signature="sig", db=db)
        await db.refresh(user)
        first_expiry = user.premium_expires_at
        second = await stripe_webhook(request=request, stripe_signature="sig", db=db)

    assert first["status"] == "success"
    assert second["status"] == "ignored"
    assert user.is_premium is True
    assert user.premium_expires_at == first_expiry
    rows = await db.execute(select(Transaction).filter(Transaction.reference_id == "sub_in_567"))
    entries = rows.scalars().all()
    assert len(entries) == 1
    assert entries[0].type == "stripe_subscription_payment"
    assert user.balance == 0

    # Verify admin subscription alerts were sent
    assert mock_tg.call_count == 3  # 1 user + 2 admins
    calls = mock_tg.call_args_list
    assert calls[0][0][0] == 56789
    assert "Premium Subscription Active!" in calls[0][0][1]

    admin_calls = {call[0][0]: call[0][1] for call in calls[1:]}
    assert set(admin_calls.keys()) == {1016749901, 716720099}
    for admin_id, msg in admin_calls.items():
        assert "New Premium subscription (1 month)" in msg
        assert "User: ID 56789" in msg
        assert "Amount: $9.99" in msg
        assert "Transaction ID: in_567" in msg


@pytest.mark.asyncio
async def test_distinct_stripe_events_cannot_settle_one_invoice_twice(db, monkeypatch):
    user = _user(56790, 0)
    user.stripe_customer_id = "cus_56790"
    db.add(user)
    await db.commit()

    event = {
        "id": "evt_invoice_first",
        "type": "invoice.payment_succeeded",
        "data": {"object": {"id": "in_same_invoice", "subscription": "sub_same", "amount_paid": 999}},
    }
    request = MagicMock()
    request.body = AsyncMock(return_value=b"payload")
    subscription = {
        "metadata": {"user_id": str(user.telegram_id), "tier": "premium"},
        "items": {"data": [{"price": {"id": "price_monthly"}}]},
    }
    settings = get_settings()
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_mock")
    monkeypatch.setattr(settings, "STRIPE_MONTHLY_PRICE_ID", "price_monthly")

    with patch("stripe.Webhook.construct_event", side_effect=[event, {**event, "id": "evt_invoice_second"}]), \
         patch("stripe.Subscription.retrieve", return_value=subscription), \
         patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock):
        first = await stripe_webhook(request=request, stripe_signature="sig", db=db)
        second = await stripe_webhook(request=request, stripe_signature="sig", db=db)

    await db.refresh(user)
    entries = (await db.execute(
        select(Transaction).where(Transaction.reference_id == "sub_in_same_invoice")
    )).scalars().all()
    receipts = (await db.execute(select(StripeWebhookEvent))).scalars().all()
    assert first["status"] == "success"
    assert second["status"] == "ignored"
    assert user.is_premium is True
    assert len(entries) == 1
    assert len(receipts) == 2


@pytest.mark.asyncio
async def test_failed_invoice_processing_does_not_consume_webhook_receipt(db, monkeypatch):
    user = _user(56791, 0)
    db.add(user)
    await db.commit()
    event = {
        "id": "evt_invoice_retryable",
        "type": "invoice.payment_succeeded",
        "data": {"object": {"id": "in_retryable", "subscription": "sub_retryable", "amount_paid": 999}},
    }
    request = MagicMock()
    request.body = AsyncMock(return_value=b"payload")
    settings = get_settings()
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_mock")

    with patch("stripe.Webhook.construct_event", return_value=event), \
         patch("stripe.Subscription.retrieve", side_effect=RuntimeError("Stripe unavailable")):
        with pytest.raises(HTTPException) as exc:
            await stripe_webhook(request=request, stripe_signature="sig", db=db)

    receipts = (await db.execute(select(StripeWebhookEvent))).scalars().all()
    assert exc.value.status_code == 500
    assert receipts == []


@pytest.mark.asyncio
async def test_subscription_checkout_rejects_invalid_period_before_stripe_call(db, monkeypatch):
    user = _user(67890, 0)
    db.add(user)
    await db.commit()
    settings = get_settings()
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")

    with patch("stripe.checkout.Session.create") as create:
        with pytest.raises(Exception) as excinfo:
            await create_stripe_subscription(
                StripeSubscribeRequest(billing_period="weekly"), current_user=user, db=db
            )
    assert getattr(excinfo.value, "status_code", None) == 400
    create.assert_not_called()


@pytest.mark.asyncio
async def test_deposit_reference_is_unique_per_user_at_database_level(db):
    """A second observer cannot turn one on-chain transfer into two credits."""
    user = _user(78901, 0)
    db.add(user)
    db.add(Transaction(
        user_id=78901, type="deposit", amount=1000, status="completed", reference_id="chain_tx_1"
    ))
    await db.commit()

    db.add(Transaction(
        user_id=78901, type="deposit", amount=1000, status="completed", reference_id="chain_tx_1"
    ))
    with pytest.raises(IntegrityError):
        await db.commit()
    await db.rollback()


@pytest.mark.asyncio
async def test_card_refund_reverses_only_the_net_wallet_credit_once(db, monkeypatch):
    user = _user(89012, 950)
    top_up = Transaction(
        id=701, user_id=89012, type="deposit", amount=950, fee=50,
        status="completed", reference_id="cs_refund",
    )
    db.add_all([user, top_up])
    await db.commit()

    event = {
        "type": "charge.refunded",
        "data": {"object": {
            "id": "ch_refund", "amount": 1000, "amount_refunded": 1000,
            "metadata": {"tx_id": "701", "user_id": "89012"},
        }},
    }
    request = MagicMock()
    request.body = AsyncMock(return_value=b"payload")
    settings = get_settings()
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_mock")

    with patch("stripe.Webhook.construct_event", return_value=event), \
         patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock):
        first = await stripe_webhook(request=request, stripe_signature="sig", db=db)
        second = await stripe_webhook(request=request, stripe_signature="sig", db=db)

    await db.refresh(user)
    assert first["status"] == "success"
    assert second["status"] == "ignored"
    assert user.balance == 0
    rows = await db.execute(select(Transaction).filter(Transaction.type == "refund"))
    refunds = rows.scalars().all()
    assert len(refunds) == 1
    assert refunds[0].amount == -950


@pytest.mark.asyncio
async def test_chargeback_records_only_the_wallet_value_actually_removed(db, monkeypatch):
    user = _user(90123, 300)
    db.add(user)
    await db.commit()

    event = {
        "type": "charge.dispute.created",
        "data": {"object": {"id": "dp_901", "charge": "ch_901", "amount": 1000}},
    }
    request = MagicMock()
    request.body = AsyncMock(return_value=b"payload")
    settings = get_settings()
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_mock")
    charge = {"metadata": {"user_id": "90123"}}

    with patch("stripe.Webhook.construct_event", return_value=event), \
         patch("stripe.Charge.retrieve", return_value=charge), \
         patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock):
        first = await stripe_webhook(request=request, stripe_signature="sig", db=db)
        second = await stripe_webhook(request=request, stripe_signature="sig", db=db)

    await db.refresh(user)
    assert first["status"] == "success"
    assert second["status"] == "ignored"
    assert user.balance == 0
    assert user.is_active is False
    rows = await db.execute(select(Transaction).filter(Transaction.reference_id == "dispute_dp_901"))
    assert rows.scalars().one().amount == -300
