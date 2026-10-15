"""Fail-closed, renewable leases for authoritative shared-state mutations."""
import asyncio
import contextlib
import secrets
import time
from contextvars import ContextVar

from app.core.config import get_settings


class SharedStateUnavailable(RuntimeError):
    """A retryable outage or contention; never permission to mutate unlocked."""


class StateConflict(SharedStateUnavailable):
    """The caller read an older version of the game."""


current_lease: ContextVar[tuple[str, str] | None] = ContextVar("shared_lease", default=None)

_RENEW = """
if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('pexpire', KEYS[1], ARGV[2])
end
return 0
"""
_RELEASE = """
if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
end
return 0
"""


def require_shared_store(use_memory: bool, client) -> None:
    if (use_memory or client is None) and not get_settings().is_development_or_testing:
        raise SharedStateUnavailable("Shared game storage is unavailable")


class RedisLease:
    def __init__(self, client, key: str, *, ttl_ms: int = 15000, wait_seconds: float = 3):
        self.client = client
        self.key = key
        self.token = secrets.token_hex(16)
        self.ttl_ms = ttl_ms
        self.wait_seconds = wait_seconds
        self.lost = False
        self._renew_task = None

    async def acquire(self):
        deadline = time.monotonic() + self.wait_seconds
        while True:
            try:
                if await self.client.set(self.key, self.token, nx=True, px=self.ttl_ms):
                    self._renew_task = asyncio.create_task(self._renew())
                    return self
            except Exception as exc:
                raise SharedStateUnavailable("Shared lock storage is unavailable") from exc
            if time.monotonic() >= deadline:
                raise SharedStateUnavailable("Game is busy; retry shortly")
            await asyncio.sleep(0.05)

    async def _renew(self):
        try:
            while True:
                await asyncio.sleep(self.ttl_ms / 3000)
                if not await self.client.eval(_RENEW, 1, self.key, self.token, self.ttl_ms):
                    self.lost = True
                    return
        except asyncio.CancelledError:
            raise
        except Exception:
            self.lost = True

    async def check(self):
        try:
            owner = await self.client.get(self.key)
            if isinstance(owner, bytes):
                owner = owner.decode()
            if self.lost or owner != self.token:
                raise SharedStateUnavailable("Shared lock ownership was lost")
        except SharedStateUnavailable:
            raise
        except Exception as exc:
            raise SharedStateUnavailable("Shared lock storage is unavailable") from exc

    async def release(self):
        if self._renew_task:
            self._renew_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._renew_task
        with contextlib.suppress(Exception):
            await self.client.eval(_RELEASE, 1, self.key, self.token)

    async def __aenter__(self):
        await self.acquire()
        self._context_token = current_lease.set((self.key, self.token))
        return self

    async def __aexit__(self, exc_type, exc, tb):
        current_lease.reset(self._context_token)
        await self.release()


@contextlib.asynccontextmanager
async def shared_lock(client, key: str, *, use_memory: bool = False, local_lock=None):
    require_shared_store(use_memory, client)
    if use_memory or client is None:
        async with local_lock or asyncio.Lock():
            yield
    else:
        async with RedisLease(client, key) as lease:
            yield lease


class FencedRedis:
    """Fence small Redis mutations against the active renewable lease."""
    def __init__(self, client):
        self.client = client

    def __getattr__(self, name):
        if name not in {"set", "delete", "sadd", "srem", "hset", "hdel", "expire"}:
            return getattr(self.client, name)

        async def mutate(*args, **kwargs):
            lease = current_lease.get()
            if not lease:
                if get_settings().is_development_or_testing:
                    return await getattr(self.client, name)(*args, **kwargs)
                raise SharedStateUnavailable("A shared mutation requires lock ownership")
            command = {"delete": "del"}.get(name, name)
            argv = list(args)
            if name == "set":
                if kwargs.get("ex") is not None:
                    argv += ["EX", kwargs["ex"]]
                if kwargs.get("nx"):
                    argv += ["NX"]
            elif kwargs:
                raise ValueError("Unsupported fenced mutation arguments")
            result = await self.client.eval("""
                if redis.call('get', KEYS[1]) ~= ARGV[1] then return {0} end
                return {1, redis.call(ARGV[2], unpack(ARGV, 3))}
            """, 1, lease[0], lease[1], command, *argv)
            if not result or result[0] != 1:
                raise SharedStateUnavailable("Shared lock ownership was lost")
            return result[1]
        return mutate
