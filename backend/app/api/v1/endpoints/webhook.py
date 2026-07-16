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
