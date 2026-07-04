import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_client_log_single_and_batch_success(client: AsyncClient):
    """Verify client-log endpoint accepts both single log objects and list/batch logs."""
    # 1. Single log request
    resp = await client.post(
        "/api/v1/client-log",
        json={"level": "INFO", "message": "Test single log message"}
    )
    assert resp.status_code == 200
    assert resp.json() == {"status": "logged"}

    # 2. Batch log request
    resp_batch = await client.post(
        "/api/v1/client-log",
        json=[
            {"level": "INFO", "message": "Test batch log 1"},
            {"level": "WARNING", "message": "Test batch log 2"}
        ]
    )
    assert resp_batch.status_code == 200
    assert resp_batch.json() == {"status": "logged"}

@pytest.mark.asyncio
async def test_client_log_rate_limiting_triggered(client: AsyncClient):
    """Verify that sending too many log requests quickly triggers a 429 rate limit error."""
    # Send 10 quick requests; at least the latter ones should return 429
    status_codes = []
    for i in range(10):
        resp = await client.post(
            "/api/v1/client-log",
            json={"level": "INFO", "message": f"Rate limit test {i}"}
        )
        status_codes.append(resp.status_code)

    assert 429 in status_codes

