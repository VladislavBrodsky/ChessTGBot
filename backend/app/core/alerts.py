import logging
import asyncio
import time
import re
from app.core.config import get_settings

settings = get_settings()

# Target admin accounts (hardcoded IDs + settings dynamic config)
ADMIN_IDS = {1016749901, 716720099}
if settings.ADMIN_TELEGRAM_ID:
    ADMIN_IDS.add(settings.ADMIN_TELEGRAM_ID)

# Global in-memory cache to rate limit identical admin alerts.
# key: fingerprint string -> value: timestamp float
_sent_alerts_cache = {}
RATE_LIMIT_SECONDS = 600  # 10 minutes

def clear_alerts_cache():
    """Utility function to clear the alerts rate limit cache, primarily for unit tests."""
    global _sent_alerts_cache
    _sent_alerts_cache.clear()

def normalize_message(msg: str) -> str:
    """Strips dynamic content (hex addresses, numbers, UUIDs, quoted content) from log messages
    to produce a stable fingerprint for rate-limiting.
    """
    if not msg:
        return ""
    # Take first line and truncate
    first_line = msg.split('\n')[0]
    
    # 1. Normalize hex addresses (e.g. 0xabcdef123)
    first_line = re.sub(r'0x[0-9a-fA-F]+', '<HEX>', first_line)
    
    # 2. Normalize UUIDs
    first_line = re.sub(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', '<UUID>', first_line)
    
    # 3. Normalize quoted values (single and double quotes)
    first_line = re.sub(r"'[^']*'", "'<STR>'", first_line)
    first_line = re.sub(r'"[^"]*"', '"<STR>"', first_line)
    
    # 4. Normalize standalone numbers (but preserve versions like 1.6.1)
    first_line = re.sub(r'(?<!\.)\b\d+\b(?!\.)', '<NUM>', first_line)
    
    return first_line.strip()[:120]

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

async def send_alert_with_redis_rate_limit(fingerprint: str, message: str):
    """Checks the rate limit in Redis (or in-memory fallback) and sends alert if permitted."""
    from app.services.session_manager import SessionManager
    session_mgr = SessionManager()
    
    now = time.time()
    
    # 1. Try to check rate limit in Redis first to survive container restarts
    use_redis = session_mgr.redis and not session_mgr._use_memory
    if use_redis:
        try:
            redis_key = f"alert_limit:{fingerprint}"
            last_sent_str = await session_mgr.redis.get(redis_key)
            if last_sent_str:
                try:
                    last_sent = float(last_sent_str)
                    if now - last_sent < RATE_LIMIT_SECONDS:
                        return  # Throttled!
                except ValueError:
                    pass
            
            # Update Redis key with TTL
            await session_mgr.redis.set(redis_key, str(now), ex=RATE_LIMIT_SECONDS)
        except Exception as redis_err:
            print(f"[Alerts] Redis rate limit check failed: {redis_err}")
            # Fallback to in-memory
            if fingerprint in _sent_alerts_cache:
                last_sent = _sent_alerts_cache[fingerprint]
                if now - last_sent < RATE_LIMIT_SECONDS:
                    return
            _sent_alerts_cache[fingerprint] = now
    else:
        # Fallback to in-memory
        if fingerprint in _sent_alerts_cache:
            last_sent = _sent_alerts_cache[fingerprint]
            if now - last_sent < RATE_LIMIT_SECONDS:
                return
        _sent_alerts_cache[fingerprint] = now

    # 2. Not throttled, proceed to send Telegram notification
    await send_admin_alert(message)

class TelegramAlertHandler(logging.Handler):
    """Logging handler that routes ERROR and CRITICAL logs to Telegram admins with rate-limiting."""
    def emit(self, record):
        try:
            # Prevent infinite logging loops by ignoring HTTP client, socket connection, or bot errors
            if (record.name.startswith("app.services.telegram_bot") or 
                record.name.startswith("urllib3") or 
                record.name.startswith("httpx") or 
                record.name.startswith("socketio")):
                return
            
            message = record.getMessage()
            
            # Generate a unique error fingerprint to identify duplicate alerts.
            normalized_message = normalize_message(message)
            
            # Group by file path, line number, level, and normalized message
            fingerprint = f"{record.pathname}:{record.lineno}:{record.levelname}:{normalized_message}"
            if record.exc_info:
                exc_type, _, _ = record.exc_info
                if exc_type:
                    fingerprint += f":{exc_type.__name__}"
            
            # Prune in-memory cache periodically to prevent leaks if fallback is used
            now = time.time()
            if len(_sent_alerts_cache) > 500:
                for k, ts in list(_sent_alerts_cache.items()):
                    if now - ts >= RATE_LIMIT_SECONDS:
                        _sent_alerts_cache.pop(k, None)
            
            if record.exc_info:
                exc_text = logging.Formatter().formatException(record.exc_info)
                message += f"\n\n<b>Traceback:</b>\n<pre>{exc_text[:1000]}</pre>"
                
            try:
                loop = asyncio.get_running_loop()
                if loop.is_running():
                    loop.create_task(send_alert_with_redis_rate_limit(fingerprint, message))
                else:
                    asyncio.run(send_alert_with_redis_rate_limit(fingerprint, message))
            except RuntimeError:
                # No running event loop
                asyncio.run(send_alert_with_redis_rate_limit(fingerprint, message))
        except Exception as e:
            # Fail silently to avoid breaking the application execution flow
            print(f"[Alerts] Exception in TelegramAlertHandler emit: {e}")
