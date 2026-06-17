import hmac
import hashlib
import logging
import httpx
from typing import Optional
from app.core.config import get_settings

logger = logging.getLogger(__name__)

class CryptoPayService:
    @staticmethod
    def get_base_url() -> str:
        settings = get_settings()
        env = (settings.CRYPTO_PAY_ENVIRONMENT or "testnet").lower()
        if env == "mainnet":
            return "https://pay.crypt.bot/api"
        return "https://testnet-pay.crypt.bot/api"

    @classmethod
    async def create_invoice(cls, amount_cents: int, telegram_id: int) -> dict:
        """
        Creates an invoice for USDT using @CryptoBot Crypto Pay.
        Returns the API response dict with 'pay_url' and 'invoice_id'.
        """
        settings = get_settings()
        token = settings.CRYPTO_PAY_API_TOKEN
        if not token:
            logger.error("CRYPTO_PAY_API_TOKEN is not configured")
            raise ValueError("Crypto Pay token not configured")

        usd_amount = amount_cents / 100.0
        base_url = cls.get_base_url()

        headers = {
            "Crypto-Pay-API-Token": token,
            "Content-Type": "application/json"
        }
        payload = {
            "asset": "USDT",
            "amount": f"{usd_amount:.2f}",
            "description": f"Cyber Chess Wallet Deposit (ref_{telegram_id})",
            "payload": f"ref_{telegram_id}"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(f"{base_url}/createInvoice", headers=headers, json=payload)
            if res.status_code != 200:
                logger.error(f"Failed to create Crypto Pay invoice: {res.status_code} - {res.text}")
                raise ValueError(f"Crypto Pay invoice creation error: {res.text}")
            
            data = res.json()
            if not data.get("ok"):
                error_msg = data.get("error", {}).get("name", "Unknown error")
                logger.error(f"Crypto Pay API returned failure: {error_msg}")
                raise ValueError(f"Crypto Pay API error: {error_msg}")
            
            return data.get("result", {})

    @classmethod
    async def transfer_funds(cls, telegram_id: int, amount_cents: int, spend_id: str) -> dict:
        """
        Sends a transfer to a user's Telegram account using @CryptoBot Crypto Pay.
        Checks for spend_id for idempotency.
        """
        settings = get_settings()
        token = settings.CRYPTO_PAY_API_TOKEN
        if not token:
            logger.error("CRYPTO_PAY_API_TOKEN is not configured")
            raise ValueError("Crypto Pay token not configured")

        usd_amount = amount_cents / 100.0
        base_url = cls.get_base_url()

        headers = {
            "Crypto-Pay-API-Token": token,
            "Content-Type": "application/json"
        }
        payload = {
            "user_id": telegram_id,
            "asset": "USDT",
            "amount": f"{usd_amount:.2f}",
            "spend_id": spend_id,
            "comment": f"Cyber Chess Wallet Withdrawal (ref_{telegram_id})"
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(f"{base_url}/transfer", headers=headers, json=payload)
            if res.status_code != 200:
                logger.error(f"Failed to execute Crypto Pay transfer: {res.status_code} - {res.text}")
                raise ValueError(f"Crypto Pay transfer error: {res.text}")
            
            data = res.json()
            if not data.get("ok"):
                error_msg = data.get("error", {}).get("name", "Unknown error")
                logger.error(f"Crypto Pay API returned failure: {error_msg}")
                raise ValueError(f"Crypto Pay API error: {error_msg}")
            
            return data.get("result", {})

    @staticmethod
    def verify_webhook_signature(raw_body: bytes, signature: str) -> bool:
        """
        Verifies that the raw webhook request body matches the signature computed
        using the Crypto Pay API token as the secret.
        """
        settings = get_settings()
        token = settings.CRYPTO_PAY_API_TOKEN
        if not token:
            logger.error("CRYPTO_PAY_API_TOKEN not configured for webhook signature check")
            return False

        # Secret is SHA256 of the token
        secret = hashlib.sha256(token.encode()).digest()
        calculated = hmac.new(secret, raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(calculated, signature)
