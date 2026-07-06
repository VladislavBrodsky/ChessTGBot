"""Regression tests for Telegram initData validation (app/core/security.py).

These lock in the auth hardening from the security audit:
 - HMAC-SHA256 signature verification
 - auth_date freshness (replay protection)
They are pure unit tests: no DB, no network, no running server.
"""
import hashlib
import hmac
import json
import time
from urllib.parse import quote

import pytest
from fastapi import HTTPException

from app.core import security

TEST_TOKEN = "123456:TEST_BOT_TOKEN"


def _build_init_data(auth_date: int, user_id: int = 42, token: str = TEST_TOKEN) -> str:
    """Construct a correctly-signed initData string, exactly as Telegram would."""
    fields = {"auth_date": str(auth_date), "user": json.dumps({"id": user_id, "first_name": "Test"})}
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(fields.items()))
    secret_key = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    signature = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    parts = [f"{k}={quote(v, safe='')}" for k, v in fields.items()] + [f"hash={signature}"]
    return "&".join(parts)


@pytest.fixture(autouse=True)
def _set_token(monkeypatch):
    monkeypatch.setattr(security.settings, "TELEGRAM_BOT_TOKEN", TEST_TOKEN)


def test_fresh_valid_signature_accepted():
    data = security.validate_init_data(_build_init_data(int(time.time())))
    assert data["id"] == 42


def test_stale_auth_date_rejected():
    # 2 days old — beyond the 24h replay window.
    stale = _build_init_data(int(time.time()) - 2 * 24 * 3600)
    with pytest.raises(HTTPException) as exc:
        security.validate_init_data(stale)
    assert exc.value.status_code == 401


def test_missing_auth_date_rejected():
    # Forge a payload with a valid signature but no auth_date at all.
    user = json.dumps({"id": 42})
    data_check_string = f"user={user}"
    secret_key = hmac.new(b"WebAppData", TEST_TOKEN.encode(), hashlib.sha256).digest()
    signature = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    payload = f"user={quote(user, safe='')}&hash={signature}"
    with pytest.raises(HTTPException) as exc:
        security.validate_init_data(payload)
    assert exc.value.status_code == 401


def test_tampered_signature_rejected():
    good = _build_init_data(int(time.time()))
    tampered = good[:-1] + ("0" if good[-1] != "0" else "1")
    with pytest.raises(HTTPException) as exc:
        security.validate_init_data(tampered)
    assert exc.value.status_code == 403


def test_wrong_bot_token_rejected():
    # Signed with a different token than the server trusts.
    data = _build_init_data(int(time.time()), token="999:ATTACKER_TOKEN")
    with pytest.raises(HTTPException) as exc:
        security.validate_init_data(data)
    assert exc.value.status_code == 403
