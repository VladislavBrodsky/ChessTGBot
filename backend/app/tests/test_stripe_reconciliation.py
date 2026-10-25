import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

from app.core.database import Base
from app.models.user import User
from app.models.transaction import Transaction
from app.core.config import get_settings
from app.services.stripe_reconciliation import reconcile_stripe_deposits, _extract_session_status


@pytest_asyncio.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as session:
        yield session
    await engine.dispose()


def test_extract_session_status_safe():
    # 1. Stripe Object
    mock_stripe_obj = MagicMock()
    mock_stripe_obj.status = "complete"
    mock_stripe_obj.payment_status = "paid"
    status, payment_status = _extract_session_status(mock_stripe_obj)
    assert status == "complete"
    assert payment_status == "paid"

    # 2. Dictionary
    dict_obj = {"status": "expired", "payment_status": "unpaid"}
    status, payment_status = _extract_session_status(dict_obj)
    assert status == "expired"
    assert payment_status == "unpaid"

    # Modern Stripe SDK objects can be mapping-like without implementing
    # ``dict.get``. The alert was caused by assuming otherwise.
    class ItemOnlyStripeObject:
        def __getitem__(self, key):
            return {"status": "open", "payment_status": "unpaid"}[key]

        def get(self, *_args, **_kwargs):
            raise AssertionError("Stripe SDK objects must not be accessed with .get()")

    status, payment_status = _extract_session_status(ItemOnlyStripeObject())
    assert status == "open"
    assert payment_status == "unpaid"


@pytest.mark.asyncio
async def test_reconcile_paid_stripe_deposit(db, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")

    user = User(telegram_id=1001, first_name="TestUser", balance=0, elo=1000)
    old_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=20)

    pending_tx = Transaction(
        id=501,
        user_id=1001,
        type="deposit",
        amount=950,
        fee=50,
        status="pending",
        reference_id="cs_test_paid",
        created_at=old_time
    )

    db.add(user)
    db.add(pending_tx)
    await db.commit()

    mock_session = {
        "id": "cs_test_paid", "status": "complete", "payment_status": "paid",
        "mode": "payment", "currency": "usd", "amount_total": 1000,
        "metadata": {"tx_id": "501", "user_id": "1001"},
    }

    with patch("stripe.checkout.Session.retrieve", return_value=mock_session), \
         patch("app.services.telegram_bot.TelegramService.send_notification") as mock_notify:

        stats = await reconcile_stripe_deposits(db)

    assert stats["paid"] == 1
    assert stats["errors"] == 0

    await db.refresh(pending_tx)
    await db.refresh(user)

    assert pending_tx.status == "completed"
    assert user.balance == 950


@pytest.mark.asyncio
async def test_reconcile_expired_stripe_deposit(db, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")

    user = User(telegram_id=1002, first_name="TestUser2", balance=0, elo=1000)
    old_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=20)

    pending_tx = Transaction(
        id=502,
        user_id=1002,
        type="deposit",
        amount=950,
        fee=50,
        status="pending",
        reference_id="cs_test_expired",
        created_at=old_time
    )

    db.add(user)
    db.add(pending_tx)
    await db.commit()

    mock_session = MagicMock()
    mock_session.status = "expired"
    mock_session.payment_status = "unpaid"

    with patch("stripe.checkout.Session.retrieve", return_value=mock_session):
        stats = await reconcile_stripe_deposits(db)

    assert stats["expired"] == 1
    assert stats["errors"] == 0

    await db.refresh(pending_tx)
    assert pending_tx.status == "failed"


@pytest.mark.asyncio
async def test_reconcile_aged_open_stripe_deposit(db, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")

    user = User(telegram_id=1003, first_name="TestUser3", balance=0, elo=1000)
    aged_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=2)

    pending_tx = Transaction(
        id=503,
        user_id=1003,
        type="deposit",
        amount=950,
        fee=50,
        status="pending",
        reference_id="cs_test_open_aged",
        created_at=aged_time
    )

    db.add(user)
    db.add(pending_tx)
    await db.commit()

    mock_session = MagicMock()
    mock_session.status = "open"
    mock_session.payment_status = "unpaid"

    with patch("stripe.checkout.Session.retrieve", return_value=mock_session), \
         patch("stripe.checkout.Session.expire", return_value={"status": "expired"}) as mock_expire:
        stats = await reconcile_stripe_deposits(db)

    assert stats["expired"] == 1
    assert stats["errors"] == 0
    mock_expire.assert_called_once_with("cs_test_open_aged")

    await db.refresh(pending_tx)
    assert pending_tx.status == "failed"


@pytest.mark.asyncio
async def test_failed_stripe_expiry_keeps_pending_deposit_recoverable(db, monkeypatch):
    monkeypatch.setattr(get_settings(), "STRIPE_SECRET_KEY", "sk_test_mock")
    user = User(telegram_id=1005, first_name="TestUser5", balance=0, elo=1000)
    pending_tx = Transaction(
        user_id=1005, type="deposit", amount=950, fee=50,
        status="pending", reference_id="cs_test_expire_failed",
        created_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=2),
    )
    db.add_all([user, pending_tx])
    await db.commit()

    with patch("stripe.checkout.Session.retrieve", return_value={"status": "open", "payment_status": "unpaid"}), \
         patch("stripe.checkout.Session.expire", side_effect=RuntimeError("temporary outage")):
        stats = await reconcile_stripe_deposits(db)

    await db.refresh(pending_tx)
    assert stats["errors"] == 1
    assert stats["expired"] == 0
    assert pending_tx.status == "pending"


@pytest.mark.asyncio
async def test_reconcile_recent_open_stripe_deposit_does_not_alert(db, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")

    user = User(telegram_id=1004, first_name="TestUser4", balance=0, elo=1000)
    # Open for 35 minutes (between 15 min eligible threshold and 1 hour expiry threshold)
    recent_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=35)

    pending_tx = Transaction(
        id=504,
        user_id=1004,
        type="deposit",
        amount=950,
        fee=50,
        status="pending",
        reference_id="cs_test_open_recent",
        created_at=recent_time
    )

    db.add(user)
    db.add(pending_tx)
    await db.commit()

    mock_session = MagicMock()
    mock_session.status = "open"
    mock_session.payment_status = "unpaid"

    with patch("stripe.checkout.Session.retrieve", return_value=mock_session), \
         patch("app.core.alerts.send_alert_with_redis_rate_limit") as mock_alert, \
         patch("stripe.checkout.Session.expire") as mock_expire:
        stats = await reconcile_stripe_deposits(db)

    assert stats["open"] == 1
    assert stats["expired"] == 0
    assert stats["errors"] == 0
    mock_alert.assert_not_called()
    mock_expire.assert_not_called()

    await db.refresh(pending_tx)
    assert pending_tx.status == "pending"


