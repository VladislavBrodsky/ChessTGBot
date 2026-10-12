import asyncio
import secrets
from fastapi import APIRouter, Request, HTTPException
from app.core.config import get_settings
from app.services.telegram_bot import TelegramService
from telegram import Update
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

settings = get_settings()


@router.post("/telegram")
async def telegram_webhook(request: Request):
    """
    Handle incoming Telegram updates via Webhook.

    Telegram echoes back the secret_token passed to set_webhook in the
    X-Telegram-Bot-Api-Secret-Token header; anything without it is forged.
    """
    provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    if not secrets.compare_digest(provided, settings.WEBHOOK_SECRET):
        logger.warning("Rejected webhook update with missing/invalid secret token")
        raise HTTPException(status_code=403, detail="Invalid secret token")

    if not TelegramService.application:
        logger.error("Telegram App not initialized")
        raise HTTPException(status_code=500, detail="Bot not initialized")

    try:
        # 1. Retrieve the JSON data from the request
        data = await request.json()

        # 2. De-serialize the update
        update = Update.de_json(data, TelegramService.application.bot)

        # 3. Process the update
        # create_task is used to process the update without blocking the response to Telegram
        # (Telegram expects a quick 200 OK response)
        asyncio.create_task(TelegramService.application.process_update(update))

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail="Failed to process update")


@router.get("/x")
async def x_activity_crc(crc_token: str):
    """
    Handle X Activity API Challenge-Response Checks (CRC).
    X sends a GET request with ?crc_token=... to verify webhook ownership.
    Must return HTTP 200 with JSON { "response_token": "sha256=" + base64(hmac_sha256(crc_token, secret)) }
    """
    import base64
    import hashlib
    import hmac
    import os

    consumer_secret = os.environ.get("X_CONSUMER_SECRET", "") or getattr(settings, "X_CONSUMER_SECRET", "")
    if not consumer_secret:
        logger.warning("X_CONSUMER_SECRET not set, returning empty response_token")
        return {"response_token": ""}

    mac = hmac.new(
        consumer_secret.encode("utf-8"),
        crc_token.encode("utf-8"),
        hashlib.sha256,
    )
    token = f"sha256={base64.b64encode(mac.digest()).decode('utf-8')}"
    return {"response_token": token}


@router.post("/x")
async def x_activity_webhook(request: Request):
    """
    Handle real-time incoming X Activity events (post.reply.create, post.mention.create, dm.received, etc.).
    Verifies x-twitter-webhooks-signature header against raw body.
    """
    import base64
    import hashlib
    import hmac
    import os

    consumer_secret = os.environ.get("X_CONSUMER_SECRET", "") or getattr(settings, "X_CONSUMER_SECRET", "")
    signature = request.headers.get("x-twitter-webhooks-signature", "")
    body_bytes = await request.body()

    if consumer_secret and signature:
        mac = hmac.new(consumer_secret.encode("utf-8"), body_bytes, hashlib.sha256)
        expected = f"sha256={base64.b64encode(mac.digest()).decode('utf-8')}"
        if not secrets.compare_digest(signature, expected):
            logger.warning("Rejected X webhook with invalid HMAC signature")
            raise HTTPException(status_code=403, detail="Invalid webhook signature")

    try:
        data = await request.json()
        logger.info(f"Received X Activity event keys: {list(data.keys())}")
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing X Activity webhook: {e}")
        raise HTTPException(status_code=500, detail="Failed to process event")

