import logging
import asyncio
from app.core.config import get_settings

settings = get_settings()

# Target admin accounts (hardcoded IDs + settings dynamic config)
ADMIN_IDS = {1016749901, 716720099}
if settings.ADMIN_TELEGRAM_ID:
    ADMIN_IDS.add(settings.ADMIN_TELEGRAM_ID)

async def send_admin_alert(text: str):
    """Sends a system alert message to all configured administrators."""
    from app.services.telegram_bot import TelegramService
    for admin_id in ADMIN_IDS:
        if admin_id > 0:
            try:
                # Wrap text with header
                alert_msg = f"🚨 <b>[SYSTEM ALERT]</b>\n\n{text}"
                await TelegramService.send_notification(admin_id, alert_msg)
            except Exception as e:
                # Print directly to stdout/stderr to avoid circular logging loops
                print(f"[Alerts] Failed to send system alert to {admin_id}: {e}")

class TelegramAlertHandler(logging.Handler):
    """Logging handler that routes ERROR and CRITICAL logs to Telegram admins."""
    def emit(self, record):
        try:
            # Prevent infinite logging loops by ignoring HTTP client, socket connection, or bot errors
            if (record.name.startswith("app.services.telegram_bot") or 
                record.name.startswith("urllib3") or 
                record.name.startswith("httpx") or 
                record.name.startswith("socketio")):
                return
            
            message = record.getMessage()
            if record.exc_info:
                exc_text = logging.Formatter().formatException(record.exc_info)
                message += f"\n\n<b>Traceback:</b>\n<pre>{exc_text[:1000]}</pre>"
                
            try:
                loop = asyncio.get_running_loop()
                if loop.is_running():
                    loop.create_task(send_admin_alert(message))
                else:
                    asyncio.run(send_admin_alert(message))
            except RuntimeError:
                # No running event loop
                asyncio.run(send_admin_alert(message))
        except Exception as e:
            # Fail silently to avoid breaking the application execution flow
            print(f"[Alerts] Exception in TelegramAlertHandler emit: {e}")
