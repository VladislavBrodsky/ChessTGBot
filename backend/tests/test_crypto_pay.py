import pytest
import hmac
import hashlib
import json
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.crypto_pay import CryptoPayService
from app.core.config import get_settings
from app.models.user import User
from app.models.transaction import Transaction
from sqlalchemy import select

# Test configuration values
TEST_TOKEN = "1234:AA-XX-ZZ"

@pytest.fixture(autouse=True)
def mock_settings_token():
    settings = get_settings()
    original_token = settings.CRYPTO_PAY_API_TOKEN
    original_env = settings.CRYPTO_PAY_ENVIRONMENT
    settings.CRYPTO_PAY_API_TOKEN = TEST_TOKEN
    settings.CRYPTO_PAY_ENVIRONMENT = "testnet"
    yield
    settings.CRYPTO_PAY_API_TOKEN = original_token
    settings.CRYPTO_PAY_ENVIRONMENT = original_env

def test_get_base_url():
    settings = get_settings()
    settings.CRYPTO_PAY_ENVIRONMENT = "testnet"
    assert CryptoPayService.get_base_url() == "https://testnet-pay.crypt.bot/api"
    
    settings.CRYPTO_PAY_ENVIRONMENT = "mainnet"
    assert CryptoPayService.get_base_url() == "https://pay.crypt.bot/api"

def test_verify_webhook_signature():
    raw_body = b'{"update_id":123,"update_type":"invoice_paid"}'
    
    # Secret is SHA256 of the token
    secret = hashlib.sha256(TEST_TOKEN.encode()).digest()
    correct_sig = hmac.new(secret, raw_body, hashlib.sha256).hexdigest()
    
    assert CryptoPayService.verify_webhook_signature(raw_body, correct_sig) is True
    assert CryptoPayService.verify_webhook_signature(raw_body, "wrong_sig") is False

@pytest.mark.asyncio
async def test_create_invoice_api_error():
    with patch("httpx.AsyncClient.post") as mock_post:
        # Simulate API returning non-200
        mock_response = AsyncMock()
        mock_response.status_code = 400
        mock_response.text = "Bad request"
        mock_post.return_value = mock_response

        with pytest.raises(ValueError, match="Crypto Pay invoice creation error"):
            await CryptoPayService.create_invoice(1000, 100000001)

@pytest.mark.asyncio
async def test_create_invoice_ok():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = MagicMock(return_value={
            "ok": True,
            "result": {
                "invoice_id": 999123,
                "pay_url": "https://t.me/CryptoTestnetBot?start=iv12345"
            }
        })
        mock_post.return_value = mock_response

        result = await CryptoPayService.create_invoice(1000, 100000002)
        assert result["invoice_id"] == 999123
        assert result["pay_url"] == "https://t.me/CryptoTestnetBot?start=iv12345"

@pytest.mark.asyncio
async def test_transfer_funds_ok():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = MagicMock(return_value={
            "ok": True,
            "result": {
                "transfer_id": 888123,
                "status": "completed"
            }
        })
        mock_post.return_value = mock_response

        result = await CryptoPayService.transfer_funds(100000003, 500, "spend_123")
        assert result["transfer_id"] == 888123

@pytest.mark.asyncio
async def test_deposit_endpoint_invoice(client, db_session):
    tg_id = 100000004
    # Setup test user
    user = User(telegram_id=tg_id, first_name="TestDeposit", balance=1000)
    db_session.add(user)
    await db_session.commit()

    with patch("app.services.crypto_pay.CryptoPayService.create_invoice") as mock_create:
        mock_create.return_value = {
            "invoice_id": 112233,
            "pay_url": "https://t.me/CryptoTestnetBot?start=iv999"
        }

        # Mock Auth headers
        headers = {
            "X-Telegram-Init-Data": f"user={json.dumps({'id': tg_id})}"
        }
        response = await client.post(
            "/api/v1/wallet/deposit",
            headers=headers,
            json={"amount": 1000} # $10.00
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "invoice"
        assert data["payment_link"] == "https://t.me/CryptoTestnetBot?start=iv999"
        assert data["invoice_id"] == "112233"
        
        # Check that a pending transaction was logged
        tx_result = await db_session.execute(
            select(Transaction).filter(Transaction.reference_id == "invoice_112233")
        )
        tx = tx_result.scalars().first()
        assert tx is not None
        assert tx.status == "pending"
        assert tx.amount == 950 # 1000 - 50 fee

@pytest.mark.asyncio
async def test_withdraw_endpoint_success(client, db_session):
    tg_id = 100000005
    # Setup test user with enough balance
    user = User(telegram_id=tg_id, first_name="TestWithdraw", balance=2000)
    db_session.add(user)
    await db_session.commit()

    with patch("app.services.crypto_pay.CryptoPayService.transfer_funds") as mock_transfer:
        mock_transfer.return_value = {
            "transfer_id": 556677,
            "status": "completed"
        }

        headers = {
            "X-Telegram-Init-Data": f"user={json.dumps({'id': tg_id})}"
        }
        response = await client.post(
            "/api/v1/wallet/withdraw",
            headers=headers,
            json={"amount": 1500, "address": "test_address"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        
        # Reload user and check balance
        await db_session.refresh(user)
        assert user.balance == 500 # 2000 - 1500

        # Check transaction log is completed
        tx_result = await db_session.execute(
            select(Transaction).filter(Transaction.reference_id == "cp_tx_556677")
        )
        tx = tx_result.scalars().first()
        assert tx is not None
        assert tx.status == "completed"
        assert tx.amount == -1500

@pytest.mark.asyncio
async def test_withdraw_endpoint_rollback_on_api_error(client, db_session):
    tg_id = 100000006
    # Setup test user
    user = User(telegram_id=tg_id, first_name="TestWithdrawFail", balance=2000)
    db_session.add(user)
    await db_session.commit()

    with patch("app.services.crypto_pay.CryptoPayService.transfer_funds") as mock_transfer:
        mock_transfer.side_effect = ValueError("Crypto Pay API error")

        headers = {
            "X-Telegram-Init-Data": f"user={json.dumps({'id': tg_id})}"
        }
        response = await client.post(
            "/api/v1/wallet/withdraw",
            headers=headers,
            json={"amount": 1500, "address": "test_address"}
        )
        assert response.status_code == 400
        assert "payout failed" in response.json()["detail"]

        # Verify that balance was rolled back (restored) to 2000
        await db_session.refresh(user)
        assert user.balance == 2000

        # Check transaction log is failed
        tx_result = await db_session.execute(
            select(Transaction).filter(Transaction.status == "failed")
        )
        tx = tx_result.scalars().first()
        assert tx is not None
        assert tx.amount == -1500

@pytest.mark.asyncio
async def test_webhook_deposit_confirmation(client, db_session):
    tg_id = 100000007
    # Setup test user
    user = User(telegram_id=tg_id, first_name="TestWebhookUser", balance=1000)
    db_session.add(user)
    await db_session.commit()

    webhook_payload = {
        "update_id": 99999,
        "update_type": "invoice_paid",
        "payload": {
            "invoice_id": 445566,
            "status": "paid",
            "amount": "10.00",
            "asset": "USDT",
            "payload": f"ref_{tg_id}"
        }
    }
    raw_body = json.dumps(webhook_payload).encode()
    
    # Calculate correct signature
    secret = hashlib.sha256(TEST_TOKEN.encode()).digest()
    correct_sig = hmac.new(secret, raw_body, hashlib.sha256).hexdigest()

    response = await client.post(
        "/api/v1/wallet/webhook",
        headers={"crypto-pay-api-signature": correct_sig},
        content=raw_body
    )
    assert response.status_code == 200
    
    # Verify user got credited $9.50 (1000 cents - 50 fee)
    await db_session.refresh(user)
    assert user.balance == 1950 # 1000 + 950

    # Verify transaction logs
    tx_result = await db_session.execute(
        select(Transaction).filter(Transaction.reference_id == "invoice_445566")
    )
    tx = tx_result.scalars().first()
    assert tx is not None
    assert tx.status == "completed"
    assert tx.amount == 950
