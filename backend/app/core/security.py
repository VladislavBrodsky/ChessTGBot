import hmac
import hashlib
import json
from urllib.parse import unquote
from fastapi import HTTPException
from app.core.config import get_settings

settings = get_settings()

def validate_init_data(init_data: str) -> dict:
    """
    Validates the Telegram WebApp initData string using HMAC-SHA256.
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

        if calculated_hash != received_hash:
            raise HTTPException(status_code=403, detail="Invalid initData signature")

        # Extract user data
        user_data_str = data_dict.get('user')
        if not user_data_str:
             raise HTTPException(status_code=400, detail="Missing user data in initData")
        
        return json.loads(user_data_str)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")
