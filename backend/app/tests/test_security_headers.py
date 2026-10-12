import pytest
from starlette.testclient import TestClient
from app.main import _fastapi_app


def test_api_security_headers():
    client = TestClient(_fastapi_app, raise_server_exceptions=False)
    response = client.get("/api/v1/health")
    assert response.status_code in (200, 500)
    headers = response.headers
    assert "strict-transport-security" in headers
    assert "max-age=63072000" in headers["strict-transport-security"]
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("content-security-policy") == "default-src 'none'; frame-ancestors 'none'"
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "accelerometer=()" in headers.get("permissions-policy", "")
