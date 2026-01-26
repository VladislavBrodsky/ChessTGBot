from fastapi import APIRouter, Request, HTTPException
from app.services.telegram_bot import TelegramService
from telegram import Update
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/telegram")
async def telegram_webhook(request: Request):
    """
    Handle incoming Telegram updates via Webhook.
    """
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
        await TelegramService.application.process_update(update)
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))
