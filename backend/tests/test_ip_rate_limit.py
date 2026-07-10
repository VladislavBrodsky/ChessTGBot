import pytest
import json
from urllib.parse import quote
from app.api.v1.deps import _rate_limits

@pytest.mark.asyncio
async def test_ip_rate_limit_on_sync(client, db_session):
    if hasattr(db_session, "users"):
        return

    # Clear memory rate limits
    _rate_limits.clear()

    # Create mock initData
    telegram_id = 999555111
    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'RateLimitTester'}))}"

    # 1. Send 10 successful requests under IP 1.2.3.4
    for i in range(10):
        response = await client.post(
            "/api/v1/users/sync",
            headers={
                "X-Telegram-Init-Data": init_data,
                "x-forwarded-for": "1.2.3.4"
            }
        )
        assert response.status_code == 200, f"Request {i+1} failed"

    # 2. The 11th request under IP 1.2.3.4 should fail with 429
    response_429 = await client.post(
        "/api/v1/users/sync",
        headers={
            "X-Telegram-Init-Data": init_data,
            "x-forwarded-for": "1.2.3.4"
        }
    )
    assert response_429.status_code == 429
    assert response_429.json()["detail"] == "Too many requests from this IP. Please try again later."

    # 3. A request from a different IP (e.g. 5.6.7.8) should still succeed
    response_diff_ip = await client.post(
        "/api/v1/users/sync",
        headers={
            "X-Telegram-Init-Data": init_data,
            "x-forwarded-for": "5.6.7.8"
        }
    )
    assert response_diff_ip.status_code == 200

    # Clean up rate limits
    _rate_limits.clear()
