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


def validate_init_data(init_data: str, max_age_seconds: int = INIT_DATA_MAX_AGE_SECONDS) -> dict:
    """
    Validates the Telegram WebApp initData string using HMAC-SHA256 and rejects
    stale payloads based on their signed `auth_date`.
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

        # Prepare payload for HMAC
        # Keys must be sorted alphabetically
        data_check_string = '\n'.join(f'{k}={v}' for k, v in sorted(data_dict.items()))

        # Calculate HMAC-SHA256 signature
        secret_key = hmac.new(b"WebAppData", settings.TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
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

        # Extract user data
        user_data_str = data_dict.get('user')
        if not user_data_str:
             raise HTTPException(status_code=400, detail="Missing user data in initData")
        
        user_data = json.loads(user_data_str)
        if 'start_param' in data_dict:
            user_data['start_param'] = data_dict['start_param']
        return user_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")


def parse_init_data_unverified(init_data: str) -> dict:
    """
    Parses Telegram WebApp initData string without validating the signature.
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
        
        user_data_str = data_dict.get('user')
        if not user_data_str:
            return {}
        
        user_data = json.loads(user_data_str)
        if 'start_param' in data_dict:
            user_data['start_param'] = data_dict['start_param']
        return user_data
    except Exception:
        return {}

