"""The shared Redis client factory must actually apply its connection defaults.

Every application Redis client was previously built with a bare
``redis.from_url(url, ...)``: no connect timeout, no keepalive, no health
check. On Railway's internal network that lets an idle pooled connection go
stale silently and a dead peer stall a request. These tests pin the defaults
and the ability to override them.
"""
from app.core.redis_client import (
    COMMAND_TIMEOUT_SECONDS,
    CONNECT_TIMEOUT_SECONDS,
    HEALTH_CHECK_INTERVAL_SECONDS,
    create_redis_client,
)

URL = "redis://localhost:6379/0"


def test_defaults_are_applied_to_the_connection_pool():
    kwargs = create_redis_client(URL).connection_pool.connection_kwargs
    assert kwargs["socket_connect_timeout"] == CONNECT_TIMEOUT_SECONDS
    assert kwargs["socket_timeout"] == COMMAND_TIMEOUT_SECONDS
    assert kwargs["socket_keepalive"] is True
    assert kwargs["health_check_interval"] == HEALTH_CHECK_INTERVAL_SECONDS


def test_caller_overrides_win():
    client = create_redis_client(URL, socket_connect_timeout=1.0, decode_responses=True)
    kwargs = client.connection_pool.connection_kwargs
    assert kwargs["socket_connect_timeout"] == 1.0
    assert kwargs["decode_responses"] is True
    # Unspecified defaults still apply.
    assert kwargs["socket_keepalive"] is True
