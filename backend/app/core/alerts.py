import logging
import asyncio
import time
import re
import datetime
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

def get_eastern_str(dt_utc: datetime.datetime) -> str:
    """Helper to convert UTC datetime to Eastern Time (EST/EDT) string taking DST into account."""
    year = dt_utc.year
    # March: 2nd Sunday
    march_1st = datetime.datetime(year, 3, 1, tzinfo=datetime.timezone.utc)
    march_1st_wday = march_1st.weekday()
    march_dst = march_1st + datetime.timedelta(days=7 + (6 - march_1st_wday) % 7, hours=2)
    
    # November: 1st Sunday
    nov_1st = datetime.datetime(year, 11, 1, tzinfo=datetime.timezone.utc)
    nov_1st_wday = nov_1st.weekday()
    nov_dst = nov_1st + datetime.timedelta(days=(6 - nov_1st_wday) % 7, hours=2)
    
    if march_dst <= dt_utc < nov_dst:
        tz = datetime.timezone(datetime.timedelta(hours=-4))
        name = "EDT"
    else:
        tz = datetime.timezone(datetime.timedelta(hours=-5))
        name = "EST"
    
    local_dt = dt_utc.astimezone(tz)
    return local_dt.strftime(f"%Y-%m-%d %I:%M:%S %p {name}")

def format_alert_time(timestamp: float = None) -> str:
    """Formats a timestamp (or current time) to both UTC and Eastern Time (EST/EDT) string."""
    if timestamp is None:
        timestamp = time.time()
    dt_utc = datetime.datetime.fromtimestamp(timestamp, datetime.timezone.utc)
    utc_str = dt_utc.strftime("%Y-%m-%d %H:%M:%S UTC")
    try:
        est_str = get_eastern_str(dt_utc)
        return f"{utc_str} / {est_str}"
    except Exception:
        return utc_str

def get_alert_metadata() -> str:
    """Collects system, database, and container env metadata to identify the host container."""
    import os
    import socket
    metadata_lines = []
    
    # 1. Host information
    try:
        hostname = socket.gethostname()
        metadata_lines.append(f"• <b>Host:</b> <code>{hostname}</code>")
    except Exception:
        pass
        
    # 2. Database connection details (derived from DB URL safely)
    try:
        from app.core.config import get_settings
        settings = get_settings()
        if settings.DATABASE_URL:
            from sqlalchemy.engine.url import make_url
            url = make_url(settings.DATABASE_URL)
            metadata_lines.append(f"• <b>DB Host:</b> <code>{url.host}</code>")
            metadata_lines.append(f"• <b>DB Name:</b> <code>{url.database}</code>")
            
            pw = url.password or ""
            pw_info = f"len={len(pw)}"
            if len(pw) >= 5:
                pw_info += f", start={pw[:5]}, end={pw[-3:] if len(pw) >= 3 else ''}"
            metadata_lines.append(f"• <b>DB PW Info:</b> <code>{pw_info}</code>")
    except Exception as e:
        metadata_lines.append(f"• <b>DB Config Parse Error:</b> <code>{e}</code>")

    # 3. Railway-specific metadata
    r_project = os.environ.get("RAILWAY_PROJECT_NAME")
    r_env = os.environ.get("RAILWAY_ENVIRONMENT_NAME")
    r_service = os.environ.get("RAILWAY_SERVICE_NAME")
    r_branch = os.environ.get("RAILWAY_GIT_BRANCH")
    
    if r_project:
        metadata_lines.append(f"• <b>Railway Project:</b> <code>{r_project}</code>")
    if r_env:
        metadata_lines.append(f"• <b>Railway Env:</b> <code>{r_env}</code>")
    if r_service:
        metadata_lines.append(f"• <b>Railway Service:</b> <code>{r_service}</code>")
    if r_branch:
        metadata_lines.append(f"• <b>Git Branch:</b> <code>{r_branch}</code>")
        
    # 4. Fallback system env keys (like username)
    user_keys = ["USER", "USERNAME", "COMPUTERNAME"]
    for key in user_keys:
        val = os.environ.get(key)
        if val:
            metadata_lines.append(f"• <b>System {key}:</b> <code>{val}</code>")
            
    if metadata_lines:
        return "\n<b>🔍 Debugging Metadata:</b>\n" + "\n".join(metadata_lines)
    return ""

async def send_admin_alert(text: str, timestamp: float = None):
    """Sends a system alert message to all configured administrators."""
    from app.services.telegram_bot import TelegramService
    time_display = format_alert_time(timestamp)
    for admin_id in ADMIN_IDS:
        if admin_id > 0:
            try:
                # Wrap text with header and append debugging metadata
                metadata = get_alert_metadata()
                alert_msg = f"🚨 <b>[SYSTEM ALERT]</b>\n<b>Time:</b> {time_display}\n\n{text}\n{metadata}"
                await TelegramService.send_notification(admin_id, alert_msg)
            except Exception as e:
                # Print directly to stdout/stderr to avoid circular logging loops
                print(f"[Alerts] Failed to send system alert to {admin_id}: {e}")

async def send_alert_with_redis_rate_limit(fingerprint: str, message: str, timestamp: float = None):
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
    await send_admin_alert(message, timestamp)

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
                    loop.create_task(send_alert_with_redis_rate_limit(fingerprint, message, record.created))
                else:
                    asyncio.run(send_alert_with_redis_rate_limit(fingerprint, message, record.created))
            except RuntimeError:
                # No running event loop
                asyncio.run(send_alert_with_redis_rate_limit(fingerprint, message, record.created))
        except Exception as e:
            # Fail silently to avoid breaking the application execution flow
            print(f"[Alerts] Exception in TelegramAlertHandler emit: {e}")
