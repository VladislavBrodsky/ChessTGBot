"""Single place where every application Redis client is constructed.

Railway's internal network silently drops idle connections, and bare
``redis.from_url(...)`` leaves a pooled connection to discover that only when
the next command hangs. The defaults here bound that failure:

  * ``socket_connect_timeout`` / ``socket_timeout`` cap how long a dead peer can
    stall a request instead of waiting on the OS TCP timeout. No caller uses
    blocking commands (BLPOP/XREAD), so a command-level timeout is safe.
  * ``socket_keepalive`` keeps idle pooled connections from being reaped.
  * ``health_check_interval`` makes redis-py PING a connection that has been
    idle that long before reusing it, so a stale connection is replaced rather
    than surfacing as a spurious error to the caller.

redis-py's own default retry (3 attempts with exponential backoff) still wraps
connection establishment on top of this.
"""
import redis.asyncio as redis

CONNECT_TIMEOUT_SECONDS = 5.0
COMMAND_TIMEOUT_SECONDS = 5.0
HEALTH_CHECK_INTERVAL_SECONDS = 30


def create_redis_client(url: str, **overrides) -> redis.Redis:
    """Build an async Redis client with this application's connection defaults.

    ``overrides`` are passed through to ``redis.asyncio.from_url`` and win over
    the defaults, so callers can still tighten timeouts (e.g. a fast liveness
    probe) or change encoding.
    """
    options = {
        "socket_connect_timeout": CONNECT_TIMEOUT_SECONDS,
        "socket_timeout": COMMAND_TIMEOUT_SECONDS,
        "socket_keepalive": True,
        "health_check_interval": HEALTH_CHECK_INTERVAL_SECONDS,
    }
    options.update(overrides)
    return redis.from_url(url, **options)
