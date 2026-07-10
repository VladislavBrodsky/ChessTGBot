import pytest
from app.core.security import is_allowed_cors_origin
from httpx import AsyncClient

def test_is_allowed_cors_origin_static():
    # Hardcoded allowed origins
    assert is_allowed_cors_origin("https://web.telegram.org") is True
    assert is_allowed_cors_origin("https://telegram.org") is True
    assert is_allowed_cors_origin("https://chesstgbot-frontend-production.up.railway.app") is True
    assert is_allowed_cors_origin("https://chesstgbot-backend-production.up.railway.app") is True

def test_is_allowed_cors_origin_localhost():
    # Localhost configurations
    assert is_allowed_cors_origin("http://localhost:3000") is True
    assert is_allowed_cors_origin("http://localhost:5173") is True
    assert is_allowed_cors_origin("http://127.0.0.1:8000") is True
    # Non-localhost matching starts
    assert is_allowed_cors_origin("http://localhost-malicious.com") is False

def test_is_allowed_cors_origin_railway_dynamic():
    # Dynamic Railway subdomains for chesstgbot
    assert is_allowed_cors_origin("https://chesstgbot-pr-12.up.railway.app") is True
    assert is_allowed_cors_origin("https://chesstgbot-staging.up.railway.app") is True
    # Different Railway app should be blocked
    assert is_allowed_cors_origin("https://otherapp.up.railway.app") is False
    # Non-Railway domain containing chesstgbot should be blocked
    assert is_allowed_cors_origin("https://chesstgbot.com") is False

def test_is_allowed_cors_origin_settings(monkeypatch):
    from app.core.config import get_settings
    settings = get_settings()
    
    # Save original settings
    orig_webapp = settings.WEBAPP_URL
    orig_backend = settings.BACKEND_URL
    
    try:
        # Mock settings values
        monkeypatch.setattr(settings, "WEBAPP_URL", "https://custom-webapp.com/")
        monkeypatch.setattr(settings, "BACKEND_URL", "https://custom-backend.com")
        
        # Test trailing slash normalization and matching
        assert is_allowed_cors_origin("https://custom-webapp.com") is True
        assert is_allowed_cors_origin("https://custom-backend.com") is True
        assert is_allowed_cors_origin("https://unrelated-domain.com") is False
    finally:
        settings.WEBAPP_URL = orig_webapp
        settings.BACKEND_URL = orig_backend

def test_is_allowed_cors_origin_disallowed_and_none():
    assert is_allowed_cors_origin(None) is False
    assert is_allowed_cors_origin("") is False
    assert is_allowed_cors_origin("https://malicious-site.com") is False
    assert is_allowed_cors_origin("http://web.telegram.org") is False # Protocol mismatch

@pytest.mark.asyncio
async def test_http_cors_middleware_allowed(client: AsyncClient):
    # Test that HTTP CORS middleware allows authorized origins
    headers = {"Origin": "https://web.telegram.org"}
    response = await client.get("/api/v1/wallet/prices", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://web.telegram.org"
    assert response.headers.get("access-control-allow-credentials") == "true"

@pytest.mark.asyncio
async def test_http_cors_middleware_disallowed(client: AsyncClient):
    # Test that HTTP CORS middleware does not inject headers for unauthorized origins
    headers = {"Origin": "https://malicious-site.com"}
    response = await client.get("/api/v1/wallet/prices", headers=headers)
    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers
