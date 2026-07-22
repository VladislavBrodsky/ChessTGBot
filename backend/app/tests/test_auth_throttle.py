"""Tests for the IP-keyed failed-auth throttle and request IP extraction (2b).

These lock in the login/auth abuse protection:
 - client identity honours Railway's X-Real-IP only at a trusted edge
 - register_auth_failure / auth_ip_is_blocked block an IP only after enough
   FAILED attempts, never affect a different IP, and no-op on a null ip_hash
Pure unit tests: no DB, no network, no running server. Unique per-run ip_hashes
keep them deterministic whether the throttle store is Redis or in-memory.
"""
import time

import pytest

from app.core import security
from app.api.v1 import deps
from app.services.session_manager import SessionManager


@pytest.fixture(autouse=True)
def _force_in_memory_throttle():
    """Force the throttle's in-memory store for these unit tests.

    Without this the throttle attempts Redis; in a Redis-less CI/test env every
    op TIMES OUT (~seconds), so the 20 registers span longer than the 60s sliding
    window (AUTH_FAIL_WINDOW) and the count never reaches the limit — the tests
    flaked/failed for an environmental reason, not a logic one. Forcing memory
    mode makes them instant, deterministic, and network-free (as the module
    docstring intends). The production Redis path is exercised by the live stack.
    """
    prev_use_memory = SessionManager._use_memory
    SessionManager._use_memory = True
    deps._auth_fail_memory.clear()
    try:
        yield
    finally:
        SessionManager._use_memory = prev_use_memory
        deps._auth_fail_memory.clear()


class _FakeClient:
    def __init__(self, host):
        self.host = host


class _FakeRequest:
    def __init__(self, headers=None, client_host=None):
        self.headers = headers or {}
        self.client = _FakeClient(client_host) if client_host else None


def test_request_ip_ignores_spoofed_forwarded_headers_from_direct_peer():
    req = _FakeRequest(
        headers={"x-forwarded-for": "203.0.113.7, 10.0.0.1", "x-real-ip": "9.9.9.9"},
        client_host="198.51.100.10",
    )
    assert security.extract_client_ip_from_request(req) == "198.51.100.10"


def test_request_ip_uses_railway_real_ip_and_ignores_multiple_forwarded_hops():
    assert security.extract_client_ip_from_request(
        _FakeRequest(
            headers={
                "x-railway-edge": "edge",
                "x-real-ip": "2001:db8::7",
                "x-forwarded-for": "6.6.6.6, 100.1.2.3",
            },
            client_host="100.1.2.3",
        )
    ) == "2001:db8::7"


@pytest.mark.parametrize("real_ip", ["not-an-ip", "1.2.3.4, 5.6.7.8", "1" * 129])
def test_request_ip_rejects_invalid_railway_header(real_ip):
    assert security.extract_client_ip_from_request(
        _FakeRequest(
            headers={"x-railway-edge": "edge", "x-real-ip": real_ip},
            client_host="100.1.2.3",
        )
    ) is None


def test_request_ip_falls_back_to_direct_peer_and_handles_ipv6():
    assert security.extract_client_ip_from_request(
        _FakeRequest(headers={"x-real-ip": "198.51.100.9"}, client_host="::1")
    ) == "::1"
    assert security.extract_client_ip_from_request(_FakeRequest()) is None


def test_production_does_not_trust_a_local_client_claiming_to_be_railway(monkeypatch):
    monkeypatch.setattr(security.settings, "TESTING", False)
    monkeypatch.setattr(security.settings, "ENV", "production")
    request = _FakeRequest(
        headers={"x-railway-edge": "forged", "x-real-ip": "203.0.113.7"},
        client_host="127.0.0.1",
    )
    assert security.extract_client_ip_from_request(request) == "127.0.0.1"


def test_socket_and_http_use_the_same_trusted_identity():
    headers = {"x-railway-edge": "edge", "x-real-ip": "203.0.113.7"}
    request = _FakeRequest(headers=headers, client_host="100.2.3.4")
    environ = {
        "REMOTE_ADDR": "100.2.3.4",
        "HTTP_X_RAILWAY_EDGE": "edge",
        "HTTP_X_REAL_IP": "203.0.113.7",
        "HTTP_X_FORWARDED_FOR": "6.6.6.6, 100.2.3.4",
    }
    assert security.extract_client_ip(environ) == security.extract_client_ip_from_request(request)


@pytest.mark.asyncio
async def test_auth_throttle_blocks_only_after_limit():
    ip_hash = f"unit-{time.time()}-A"
    assert await deps.auth_ip_is_blocked(ip_hash) is False

    # One under the limit -> still allowed.
    for _ in range(deps.AUTH_FAIL_LIMIT - 1):
        await deps.register_auth_failure(ip_hash)
    assert await deps.auth_ip_is_blocked(ip_hash) is False

    # Crossing the limit -> blocked.
    await deps.register_auth_failure(ip_hash)
    assert await deps.auth_ip_is_blocked(ip_hash) is True


@pytest.mark.asyncio
async def test_auth_throttle_is_per_ip():
    victim = f"unit-{time.time()}-B"
    bystander = f"unit-{time.time()}-C"
    for _ in range(deps.AUTH_FAIL_LIMIT + 2):
        await deps.register_auth_failure(victim)
    assert await deps.auth_ip_is_blocked(victim) is True
    # A different IP sharing nothing must never be caught in the blast radius.
    assert await deps.auth_ip_is_blocked(bystander) is False


@pytest.mark.asyncio
async def test_auth_throttle_noop_on_null_iphash():
    # No IP resolvable -> never blocks and never raises.
    for _ in range(deps.AUTH_FAIL_LIMIT + 5):
        await deps.register_auth_failure(None)
    assert await deps.auth_ip_is_blocked(None) is False
