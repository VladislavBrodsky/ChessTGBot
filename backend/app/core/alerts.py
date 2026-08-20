import logging
import asyncio
import time
import re
import datetime
from app.core.config import get_settings

settings = get_settings()

# Target admin accounts (loaded dynamically from config)
ADMIN_IDS = settings.admin_telegram_ids

# Global in-memory cache to rate limit identical admin alerts.
# key: fingerprint string -> value: timestamp float
_sent_alerts_cache = {}
RATE_LIMIT_SECONDS = 600  # 10 minutes

# ── Named alert systems ──────────────────────────────────────────────────────
# Every admin alert is attributed to exactly one of these subsystems so the
# recipient can tell at a glance WHERE the failure lives. Keys are stable
# identifiers used by callers; values are (emoji, display name, description).
ALERT_SYSTEMS = {
    "game_client": ("🎮", "GAME CLIENT", "Next.js Mini App running on the user's device (reported via backend relay)"),
    "core_api":    ("⚙️", "CORE API",    "FastAPI backend service"),
    "treasury":    ("💰", "TREASURY",    "Money flows: deposits, withdrawals, ledger, solvency, gas float"),
    "realtime":    ("🔌", "REALTIME",    "Socket.IO game/matchmaking transport"),
    "security":    ("🛡️", "SECURITY",   "Auth, rate limiting, anti-abuse"),
}
DEFAULT_SYSTEM = "core_api"

# Logger-name prefix → system key. First match wins; anything unmatched is
# attributed to the Core API. Extend this list when a new subsystem gets its
# own logger namespace.
_LOGGER_SYSTEM_PREFIXES = [
    ("app.client", "game_client"),
    ("app.services.deposit_crawler", "treasury"),
    ("app.services.withdrawal_crawler", "treasury"),
    ("app.services.withdrawal_reconciliation", "treasury"),
    ("app.services.stripe_reconciliation", "treasury"),
    ("app.services.solvency_service", "treasury"),
    ("app.services.ledger_audit", "treasury"),
    ("app.services.payout_service", "treasury"),
    ("app.services.gas_grant", "treasury"),
    ("app.services.settlement", "treasury"),
    ("app.services.withdrawal_policy", "treasury"),
    ("app.process_payouts_backlog", "treasury"),
    ("app.api.v1.endpoints.wallet", "treasury"),
    ("app.services.gamification_service", "treasury"),
    ("app.services.referral_commission_service", "treasury"),
    ("app.core.security", "security"),
    ("app.services.sybil_guard", "security"),
    ("app.api.v1.endpoints.game", "realtime"),
    ("app.services.game_service", "realtime"),
    ("app.services.matchmaker", "realtime"),
]

def system_for_logger(logger_name: str) -> str:
    """Maps a python logger name to the named alert system it belongs to."""
    for prefix, system in _LOGGER_SYSTEM_PREFIXES:
        if logger_name.startswith(prefix):
            return system
    return DEFAULT_SYSTEM

def is_transient_telegram_error(exc: BaseException) -> bool:
    """True for momentary Telegram Bot API / network failures (timeouts, 502
    Bad Gateway, flood limits, dropped connections) that resolve on retry.
    Callers should log these at WARNING so they don't page admins.

    BadRequest subclasses NetworkError in python-telegram-bot but signals a
    real problem with the request itself, so it is never transient.
    """
    from telegram import error as tg_error
    import httpx
    if isinstance(exc, tg_error.BadRequest):
        return False
    return isinstance(exc, (tg_error.NetworkError, tg_error.RetryAfter, httpx.TransportError))

def is_benign_telegram_file_error(exc: BaseException) -> bool:
    """True for Telegram file-fetch BadRequests that are transient/benign and
    must not page admins — notably "Wrong file_id or the file is temporarily
    unavailable", which Telegram returns when a just-obtained file_id (e.g. an
    avatar photo) briefly vanishes on its side. It is a BadRequest, so
    is_transient_telegram_error deliberately excludes it; callers that have a
    cache/None fallback should treat it as WARNING instead of ERROR.
    """
    msg = str(exc).lower()
    return "temporarily unavailable" in msg or "wrong file_id" in msg


def is_benign_telegram_avatar_error(exc: BaseException) -> bool:
    """True when Telegram reports that an avatar owner is no longer accessible."""
    return "user not found" in str(exc).lower()

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
        
    # 2. Database connection details (host/name only — NEVER credentials.
    # A previous version leaked password length + prefix/suffix here, which
    # put 8 chars of the production DB password in every Telegram alert.)
    try:
        from app.core.config import get_settings
        settings = get_settings()
        if settings.DATABASE_URL:
            from sqlalchemy.engine.url import make_url
            url = make_url(settings.DATABASE_URL)
            metadata_lines.append(f"• <b>DB Host:</b> <code>{url.host}</code>")
            metadata_lines.append(f"• <b>DB Name:</b> <code>{url.database}</code>")
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
        # The metadata always describes the backend container that SENT the
        # alert. For Game Client errors the failure originated on a user's
        # device, so label this section accordingly to avoid the past
        # confusion of client crashes appearing to come from the backend.
        return "\n<b>🔍 Alert relay (backend service that sent this):</b>\n" + "\n".join(metadata_lines)
    return ""

async def send_admin_alert(text: str, timestamp: float = None, system: str = None):
    """Sends a system alert message to all configured administrators.

    `system` is a key of ALERT_SYSTEMS attributing the alert to a named
    subsystem; unattributed alerts default to the Core API.
    """
    from app.services.telegram_bot import TelegramService
    time_display = format_alert_time(timestamp)
    emoji, sys_name, sys_desc = ALERT_SYSTEMS.get(system or DEFAULT_SYSTEM, ALERT_SYSTEMS[DEFAULT_SYSTEM])
    for admin_id in ADMIN_IDS:
        if admin_id > 0:
            try:
                # Wrap text with header and append debugging metadata
                metadata = get_alert_metadata()
                alert_msg = (
                    f"🚨 <b>[SYSTEM ALERT]</b> — {emoji} <b>{sys_name}</b>\n"
                    f"<b>System:</b> {sys_desc}\n"
                    f"<b>Time:</b> {time_display}\n\n{text}\n{metadata}"
                )
                await TelegramService.send_notification(admin_id, alert_msg)
            except Exception as e:
                # Print directly to stdout/stderr to avoid circular logging loops
                print(f"[Alerts] Failed to send system alert to {admin_id}: {e}")

async def send_alert_with_redis_rate_limit(fingerprint: str, message: str, timestamp: float = None, system: str = None, ttl_seconds: int = None):
    """Checks the rate limit in Redis (or in-memory fallback) and sends alert if permitted."""
    from app.services.session_manager import SessionManager
    session_mgr = SessionManager()
    
    now = time.time()
    limit_seconds = ttl_seconds if ttl_seconds is not None else RATE_LIMIT_SECONDS
    
    # 1. Try to check rate limit in Redis first to survive container restarts
    use_redis = session_mgr.redis and not session_mgr._use_memory
    if use_redis:
        try:
            redis_key = f"alert_limit:{fingerprint}"
            last_sent_str = await session_mgr.redis.get(redis_key)
            if last_sent_str:
                try:
                    last_sent = float(last_sent_str)
                    if now - last_sent < limit_seconds:
                        return  # Throttled!
                except ValueError:
                    pass
            
            # Update Redis key with TTL
            await session_mgr.redis.set(redis_key, str(now), ex=limit_seconds)
        except Exception as redis_err:
            print(f"[Alerts] Redis rate limit check failed: {redis_err}")
            # Fallback to in-memory
            if fingerprint in _sent_alerts_cache:
                last_sent = _sent_alerts_cache[fingerprint]
                if now - last_sent < limit_seconds:
                    return
            _sent_alerts_cache[fingerprint] = now
    else:
        # Fallback to in-memory
        if fingerprint in _sent_alerts_cache:
            last_sent = _sent_alerts_cache[fingerprint]
            if now - last_sent < limit_seconds:
                return
        _sent_alerts_cache[fingerprint] = now

    # 2. Not throttled, proceed to send Telegram notification
    await send_admin_alert(message, timestamp, system=system)

class TelegramAlertHandler(logging.Handler):
    """Logging handler that routes ERROR and CRITICAL logs to Telegram admins with rate-limiting."""
    def emit(self, record):
        try:
            # Prevent infinite logging loops and benign transport noise by
            # ignoring HTTP client, socket connection, or bot errors.
            # `engineio` is Socket.IO's transport layer: it logs benign
            # client-disconnect races ("Session is disconnected", "Invalid
            # session") once at ERROR via _log_error_once. Those are not
            # actionable backend faults, so filter them like `socketio`.
            if (record.name.startswith("app.services.telegram_bot") or
                record.name.startswith("urllib3") or
                record.name.startswith("httpx") or
                record.name.startswith("socketio") or
                record.name.startswith("engineio")):
                return
            
            
            import html as html_mod
            message = html_mod.escape(record.getMessage())
            
            # Generate a unique error fingerprint to identify duplicate alerts.
            normalized_message = normalize_message(record.getMessage())
            
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
                import html as html_mod
                exc_text = logging.Formatter().formatException(record.exc_info)
                # Keep the TAIL: the exception type and message sit at the
                # bottom of a traceback. Head-truncation used to produce
                # alerts that never said what actually failed. HTML-escape it,
                # or a traceback containing < > (e.g. "Can't parse entities"
                # errors quoting user input) breaks the alert's own HTML and
                # the alert silently fails to send.
                if len(exc_text) > 1000:
                    exc_text = "…" + exc_text[-1000:]
                message += f"\n\n<b>Traceback:</b>\n<pre>{html_mod.escape(exc_text)}</pre>"

            system = system_for_logger(record.name)
            try:
                loop = asyncio.get_running_loop()
                if loop.is_running():
                    loop.create_task(send_alert_with_redis_rate_limit(fingerprint, message, record.created, system=system))
                else:
                    asyncio.run(send_alert_with_redis_rate_limit(fingerprint, message, record.created, system=system))
            except RuntimeError:
                # No running event loop
                asyncio.run(send_alert_with_redis_rate_limit(fingerprint, message, record.created, system=system))
        except Exception as e:
            # Fail silently to avoid breaking the application execution flow
            print(f"[Alerts] Exception in TelegramAlertHandler emit: {e}")


async def send_deposit_alert(
    deposit_type: str,
    username: str | None,
    telegram_id: int,
    amount: float,
    tx_id: str
):
    """
    Sends a telegram alert to all admins for a new deposit.
    """
    from app.services.telegram_bot import TelegramService
    import html as html_mod
    
    safe_username = html_mod.escape(username) if username else None
    user_display = f"@{safe_username}" if safe_username else f"ID {telegram_id}"
    date_time_str = format_alert_time()
    
    alert_text = (
        f"New {deposit_type} deposit\n"
        f"User: {user_display}\n"
        f"Amount: ${amount:.2f}\n"
        f"Date and time: {date_time_str}\n"
        f"Transaction ID: {tx_id}"
    )
    
    for admin_id in settings.admin_telegram_ids:
        if admin_id > 0:
            try:
                await TelegramService.send_notification(admin_id, alert_text)
            except Exception as e:
                # Print directly to stdout/stderr to avoid circular logging loops
                print(f"[Alerts] Failed to send deposit alert to admin {admin_id}: {e}")


async def send_premium_subscription_alert(
    username: str | None,
    telegram_id: int,
    billing_period: str | None,
    amount: float,
    tx_id: str
):
    """
    Sends a telegram alert to all admins for a new Premium subscription.
    """
    from app.services.telegram_bot import TelegramService
    import html as html_mod
    
    duration = "1 year" if billing_period == "annual" else "1 month"
    safe_username = html_mod.escape(username) if username else None
    user_display = f"@{safe_username}" if safe_username else f"ID {telegram_id}"
    date_time_str = format_alert_time()
    
    alert_text = (
        f"New Premium subscription ({duration})\n"
        f"User: {user_display}\n"
        f"Amount: ${amount:.2f}\n"
        f"Date and time: {date_time_str}\n"
        f"Transaction ID: {tx_id}"
    )
    
    for admin_id in settings.admin_telegram_ids:
        if admin_id > 0:
            try:
                await TelegramService.send_notification(admin_id, alert_text)
            except Exception as e:
                # Print directly to stdout/stderr to avoid circular logging loops
                print(f"[Alerts] Failed to send subscription alert to admin {admin_id}: {e}")
