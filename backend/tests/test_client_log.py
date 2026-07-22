import logging

import pytest
from httpx import AsyncClient

import app.main as main_module


def _trusted_headers(ip: str) -> dict[str, str]:
    return {"X-Railway-Edge": "test-edge", "X-Real-IP": ip}


@pytest.mark.asyncio
async def test_client_log_single_and_batch_success(client: AsyncClient):
    single = await client.post(
        "/api/v1/client-log",
        headers=_trusted_headers("198.51.100.1"),
        json={"level": "INFO", "message": "Test single log message"},
    )
    batch = await client.post(
        "/api/v1/client-log",
        headers=_trusted_headers("198.51.100.2"),
        json=[
            {"level": "INFO", "message": "Test batch log 1"},
            {"level": "WARNING", "message": "Test batch log 2"},
        ],
    )

    assert single.status_code == 200
    assert batch.status_code == 200
    assert single.json() == batch.json() == {"status": "logged"}


@pytest.mark.asyncio
async def test_client_log_rate_limiting_uses_trusted_identity(client: AsyncClient):
    statuses = []
    for i in range(10):
        response = await client.post(
            "/api/v1/client-log",
            headers=_trusted_headers("198.51.100.3"),
            json={"level": "INFO", "message": f"Rate limit test {i}"},
        )
        statuses.append(response.status_code)

    assert 429 in statuses


@pytest.mark.asyncio
async def test_client_log_rejects_oversized_or_invalid_payloads(client: AsyncClient):
    headers = _trusted_headers("198.51.100.4")
    oversized = await client.post(
        "/api/v1/client-log",
        headers=headers,
        content=b"{" + b"x" * (16 * 1024) + b"}",
    )
    too_many_items = await client.post(
        "/api/v1/client-log",
        headers=headers,
        json=[{"level": "INFO", "message": "item"}] * 11,
    )
    invalid_level = await client.post(
        "/api/v1/client-log",
        headers=headers,
        json={"level": "CRITICAL", "message": "not accepted from public clients"},
    )
    oversized_message = await client.post(
        "/api/v1/client-log",
        headers=headers,
        json={"level": "ERROR", "message": "x" * 1801},
    )

    assert oversized.status_code == 413
    assert too_many_items.status_code == 422
    assert invalid_level.status_code == 422
    assert oversized_message.status_code == 422


@pytest.mark.asyncio
async def test_client_log_uses_central_trusted_ip_helper(client: AsyncClient, monkeypatch):
    calls = []

    def extract_ip(request):
        calls.append(request)
        return "203.0.113.99"

    monkeypatch.setattr(main_module, "extract_client_ip_from_request", extract_ip)
    response = await client.post(
        "/api/v1/client-log",
        json={"level": "INFO", "message": "trusted identity check"},
    )

    assert response.status_code == 200
    assert len(calls) == 1


@pytest.mark.asyncio
async def test_unauthenticated_client_errors_require_correlation_before_alerting(client: AsyncClient, caplog):
    caplog.set_level(logging.WARNING, logger="app.client")
    message = "[render] deterministic startup crash for correlation"

    for ip in ("198.51.100.10", "198.51.100.11"):
        response = await client.post(
            "/api/v1/client-log",
            headers=_trusted_headers(ip),
            json={"level": "ERROR", "message": message},
        )
        assert response.status_code == 200

    assert not [record for record in caplog.records if record.levelno >= logging.ERROR]
    assert any("UNSAMPLED" in record.message for record in caplog.records)

    response = await client.post(
        "/api/v1/client-log",
        headers=_trusted_headers("198.51.100.12"),
        json={"level": "ERROR", "message": message},
    )

    assert response.status_code == 200
    assert any(
        record.levelno == logging.ERROR and "Correlated unauthenticated crash" in record.message
        for record in caplog.records
    )


@pytest.mark.asyncio
async def test_authenticated_client_error_is_alert_eligible(client: AsyncClient, caplog, monkeypatch):
    caplog.set_level(logging.ERROR, logger="app.client")
    monkeypatch.setattr(main_module, "validate_init_data", lambda _: {"id": 6842281287})

    response = await client.post(
        "/api/v1/client-log",
        headers={
            **_trusted_headers("198.51.100.13"),
            "X-Telegram-Init-Data": "valid-for-test",
        },
        json={"level": "ERROR", "message": "[global] authenticated crash"},
    )

    assert response.status_code == 200
    assert any(record.levelno == logging.ERROR for record in caplog.records)
