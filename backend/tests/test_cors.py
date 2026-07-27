import logging

import pytest
from app.core.config import get_settings
from app.core import security
from app.core.security import is_allowed_cors_origin
from httpx import AsyncClient


def test_is_allowed_cors_origin_uses_exact_known_origins():
    assert is_allowed_cors_origin("https://web.telegram.org") is True
    assert is_allowed_cors_origin("https://telegram.org") is True
    assert is_allowed_cors_origin("https://chesstgbot-frontend-production.up.railway.app") is True
    assert is_allowed_cors_origin("https://chesstgbot-backend-production.up.railway.app") is True


@pytest.mark.parametrize("origin", [
    "https://evilchesstgbot.up.railway.app",
    "https://chesstgbot-pr-12.up.railway.app",
    "https://chesstgbot-frontend-production.up.railway.app.evil.example",
    "https://evil.example/?origin=chesstgbot",
    "https://chesstgbot.com",
])
def test_is_allowed_cors_origin_rejects_railway_lookalikes(origin):
    assert is_allowed_cors_origin(origin) is False


def test_is_allowed_cors_origin_allows_configured_custom_origin(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(
        settings,
        "CORS_ALLOWED_ORIGINS",
        "https://custom-webapp.example/, https://preview.example",
    )

    assert is_allowed_cors_origin("https://custom-webapp.example") is True
    assert is_allowed_cors_origin("https://preview.example") is True
    assert is_allowed_cors_origin("https://unrelated.example") is False


def test_rejected_first_party_origin_emits_rate_limited_security_alert(monkeypatch, caplog):
    settings = get_settings()
    security.clear_first_party_cors_rejection_alerts()
    monkeypatch.setattr(settings, "CORS_ALLOWED_ORIGINS", "https://allowed.example")
    monkeypatch.setattr(settings, "WEBAPP_URL", "https://allowed.example")
    monkeypatch.setattr(settings, "BACKEND_URL", "https://api.allowed.example")

    now = [100.0]
    monkeypatch.setattr(security.time, "monotonic", lambda: now[0])
    origin = "https://web3chess.online"

    with caplog.at_level(logging.ERROR, logger="app.core.security"):
        assert is_allowed_cors_origin(origin) is False
        assert is_allowed_cors_origin(origin) is False
        now[0] = 701.0
        assert is_allowed_cors_origin(origin) is False

    alerts = [
        record for record in caplog.records
        if "First-party CORS origin rejected" in record.getMessage()
    ]
    assert len(alerts) == 2
    assert all(origin in record.getMessage() for record in alerts)


def test_rejected_unknown_origin_never_pages(monkeypatch, caplog):
    security.clear_first_party_cors_rejection_alerts()
    with caplog.at_level(logging.ERROR, logger="app.core.security"):
        assert is_allowed_cors_origin("https://evil.example") is False

    assert not any(
        "First-party CORS origin rejected" in record.getMessage()
        for record in caplog.records
    )


def test_localhost_is_limited_to_development_and_testing(monkeypatch):
    settings = get_settings()
    assert is_allowed_cors_origin("http://localhost:3000") is True
    assert is_allowed_cors_origin("http://127.0.0.1:8000") is True
    assert is_allowed_cors_origin("http://localhost-malicious.example") is False

    monkeypatch.setattr(settings, "TESTING", False)
    monkeypatch.setattr(settings, "ENV", "production")
    assert is_allowed_cors_origin("http://localhost:3000") is False
    assert is_allowed_cors_origin("http://127.0.0.1:8000") is False


@pytest.mark.parametrize("origin", [None, "", "http://web.telegram.org", "https://web.telegram.org/path"])
def test_is_allowed_cors_origin_rejects_invalid_origins(origin):
    assert is_allowed_cors_origin(origin) is False


@pytest.mark.asyncio
async def test_http_cors_middleware_reflects_allowed_origin_and_varies(client: AsyncClient):
    origin = "https://web.telegram.org"
    response = await client.get("/api/v1/wallet/prices", headers={"Origin": origin})

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
    assert response.headers.get("access-control-allow-credentials") == "true"
    assert "origin" in response.headers.get("vary", "").lower()


@pytest.mark.asyncio
async def test_http_cors_middleware_allows_configured_custom_origin(client: AsyncClient, monkeypatch):
    settings = get_settings()
    origin = "https://custom-webapp.example"
    monkeypatch.setattr(settings, "CORS_ALLOWED_ORIGINS", origin)

    response = await client.get("/api/v1/wallet/prices", headers={"Origin": origin})

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin


@pytest.mark.asyncio
async def test_http_cors_middleware_rejects_disallowed_origin(client: AsyncClient):
    response = await client.get(
        "/api/v1/wallet/prices",
        headers={"Origin": "https://evilchesstgbot.up.railway.app"},
    )

    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers


@pytest.mark.asyncio
async def test_preflight_uses_explicit_headers_and_agrees_with_regular_request(client: AsyncClient):
    origin = "https://web.telegram.org"
    response = await client.options(
        "/api/v1/wallet/prices",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type, x-telegram-init-data, x-request-id",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
    assert response.headers.get("access-control-allow-credentials") == "true"
    assert response.headers.get("access-control-allow-headers") == (
        "authorization, content-type, x-telegram-init-data, x-request-id, bypass-tunnel-reminder"
    )
    assert response.headers.get("access-control-allow-headers") != "*"
    assert "origin" in response.headers.get("vary", "").lower()


@pytest.mark.asyncio
async def test_preflight_rejects_headers_outside_allowlist(client: AsyncClient):
    response = await client.options(
        "/api/v1/wallet/prices",
        headers={
            "Origin": "https://web.telegram.org",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "x-untrusted-header",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers
