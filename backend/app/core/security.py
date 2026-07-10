import hmac
import hashlib
import json
import time
from urllib.parse import unquote
from fastapi import HTTPException
from app.core.config import get_settings

settings = get_settings()

# Max age of a Telegram initData string before it is rejected as stale. Telegram
# signs an `auth_date` into every initData payload; without this check a captured
# initData string authenticates as its user forever (indefinite replay). 24h is a
# generous window that still bounds the value of a leaked string.
INIT_DATA_MAX_AGE_SECONDS = 24 * 60 * 60


def extract_client_ip(environ: dict) -> str | None:
    """
    Best-effort client IP from a Socket.IO ASGI `environ`. In production the app
    sits behind the Railway edge proxy, so the real client IP is the first hop of
    X-Forwarded-For; REMOTE_ADDR / the ASGI client tuple would just be the proxy.
    """
    if not environ:
        return None
    xff = environ.get("HTTP_X_FORWARDED_FOR")
    if xff:
        # "client, proxy1, proxy2" -> client
        first = xff.split(",")[0].strip()
        if first:
            return first
    real_ip = environ.get("HTTP_X_REAL_IP")
    if real_ip:
        return real_ip.strip()
    remote = environ.get("REMOTE_ADDR")
    if remote:
        return remote
    scope = environ.get("asgi.scope") or {}
    client = scope.get("client")
    if client and len(client) >= 1:
        return client[0]
    return None


def extract_client_ip_from_request(request) -> str | None:
    """
    Best-effort client IP from a Starlette/FastAPI Request. Same rationale as
    extract_client_ip(): behind the Railway edge proxy the real client is the
    first hop of X-Forwarded-For; request.client would just be the proxy.
    """
    if request is None:
        return None
    try:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            first = xff.split(",")[0].strip()
            if first:
                return first
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
        return request.client.host if request.client else None
    except Exception:
        return None


def hash_ip(ip: str | None) -> str | None:
    """
    Salted, one-way hash of a client IP for anti-collusion comparisons. We store
    only the hash (never the raw IP) in the transient matchmaking queue so two
    connections from the same network can be compared for equality without
    retaining PII. Salted with SECRET_KEY so hashes are not portable/enumerable.
    """
    if not ip:
        return None
    secret = getattr(settings, "SECRET_KEY", "") or ""
    return hashlib.sha256(f"{secret}:{ip}".encode("utf-8")).hexdigest()[:32]


def validate_init_data(init_data: str, max_age_seconds: int = INIT_DATA_MAX_AGE_SECONDS) -> dict:
    """
    Validates the Telegram WebApp initData string or Telegram Login Widget string using HMAC-SHA256
    and rejects stale payloads based on their signed `auth_date`.
    Returns the parsed user data dictionary if valid, raises HTTPException otherwise.
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=500, detail="Bot token not configured")

    if not init_data:
        raise HTTPException(status_code=401, detail="Missing initData")

    try:
        # Parse initData string into a dictionary
        data_dict = {}
        for part in init_data.split('&'):
            if '=' in part:
                key, value = part.split('=', 1)
                data_dict[key] = unquote(value)
        
        if 'hash' not in data_dict:
            raise HTTPException(status_code=401, detail="Missing hash in initData")

        received_hash = data_dict.pop('hash')

        # Determine payload type
        is_tma = 'query_id' in data_dict or 'user' in data_dict

        # Prepare payload for HMAC
        # Keys must be sorted alphabetically
        data_check_string = '\n'.join(f'{k}={v}' for k, v in sorted(data_dict.items()))

        if is_tma:
            # TMA Auth Signature
            secret_key = hmac.new(b"WebAppData", settings.TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
        else:
            # Web Widget Auth Signature
            secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()

        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if not hmac.compare_digest(calculated_hash, received_hash):
            raise HTTPException(status_code=403, detail="Invalid initData signature")

        # Reject stale payloads (replay protection). auth_date is a signed unix
        # timestamp; it is inside the HMAC so it cannot be forged, only replayed.
        if max_age_seconds is not None:
            auth_date_raw = data_dict.get('auth_date')
            if not auth_date_raw:
                raise HTTPException(status_code=401, detail="Missing auth_date in initData")
            try:
                auth_date = int(auth_date_raw)
            except (TypeError, ValueError):
                raise HTTPException(status_code=400, detail="Invalid auth_date in initData")
            age = time.time() - auth_date
            # Allow a small negative skew for clock differences between servers.
            if age > max_age_seconds or age < -300:
                raise HTTPException(status_code=401, detail="initData has expired, please reopen the app")

        if is_tma:
            # Extract user data from JSON 'user' string
            user_data_str = data_dict.get('user')
            if not user_data_str:
                 raise HTTPException(status_code=400, detail="Missing user data in initData")
            user_data = json.loads(user_data_str)
            if 'start_param' in data_dict:
                user_data['start_param'] = data_dict['start_param']
            return user_data
        else:
            # Web Widget data is flat, normalize it to match TMA format
            # Convert 'id' to int since it comes as string in query params
            user_id = data_dict.get('id')
            if not user_id:
                 raise HTTPException(status_code=400, detail="Missing id in widget data")
                 
            user_data = {
                'id': int(user_id),
                'first_name': data_dict.get('first_name', ''),
                'last_name': data_dict.get('last_name'),
                'username': data_dict.get('username'),
                'photo_url': data_dict.get('photo_url')
            }
            return user_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")


def parse_init_data_unverified(init_data: str) -> dict:
    """
    Parses Telegram WebApp initData string or Telegram Login Widget string without validating the signature.
    Useful for local dev testing with real Telegram accounts when bot token is not configured.
    """
    if not init_data:
        return {}
    try:
        data_dict = {}
        for part in init_data.split('&'):
            if '=' in part:
                key, value = part.split('=', 1)
                data_dict[key] = unquote(value)
        
        is_tma = 'query_id' in data_dict or 'user' in data_dict
        
        if is_tma:
            user_data_str = data_dict.get('user')
            if not user_data_str:
                return {}
            
            user_data = json.loads(user_data_str)
            if 'start_param' in data_dict:
                user_data['start_param'] = data_dict['start_param']
            return user_data
        else:
            user_id = data_dict.get('id')
            if not user_id:
                return {}
            return {
                'id': int(user_id),
                'first_name': data_dict.get('first_name', ''),
                'last_name': data_dict.get('last_name'),
                'username': data_dict.get('username'),
                'photo_url': data_dict.get('photo_url')
            }
    except Exception:
        return {}


def is_allowed_cors_origin(origin: str | None) -> bool:
    """
    Checks if a given origin is allowed under the application CORS policy.
    Matches allowed hardcoded origins, dynamic Railway preview/production subdomains,
    localhost for development, and the URLs specified in app configuration settings.
    """
    if not origin:
        return False
        
    allowed_origins = {
        "https://chesstgbot-frontend-production.up.railway.app",
        "https://chesstgbot-backend-production.up.railway.app",
        "https://web.telegram.org",
        "https://telegram.org",
    }
    
    if origin in allowed_origins:
        return True
        
    # Allow localhost origins for local development
    if origin.startswith("http://localhost:") or origin.startswith("http://127.0.0.1:"):
        return True
        
    # Dynamically allow any Railway chesstgbot subdomain (preview deploys etc.)
    if origin.endswith(".up.railway.app") and "chesstgbot" in origin:
        return True
        
    # Allow origins matching configured settings URLs
    if settings.WEBAPP_URL and origin == settings.WEBAPP_URL.rstrip("/"):
        return True
    if settings.BACKEND_URL and origin == settings.BACKEND_URL.rstrip("/"):
        return True
        
    return False


