"""Cached, informational native-GRAM/USDT conversion. Never settles money."""
import asyncio
import json
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)
CACHE_SECONDS = 300
MAX_STALE_SECONDS = 900
CACHE_KEY = "cache:gram-usdt-quote:v1"
_cached: "GramQuote | None" = None
_retry_after = 0.0
_refresh_lock: asyncio.Lock | None = None
_lock_loop = None


@dataclass(frozen=True)
class GramQuote:
    gram_per_usdt: Decimal
    fetched_at: datetime
    provider: str = "TonAPI"

    @property
    def age(self):
        return max(0, (datetime.now(timezone.utc) - self.fetched_at).total_seconds())

    def payload(self):
        return {
            "asset": "GRAM", "pair": "GRAM/USDT", "provider": self.provider,
            "gram_per_usdt": str(self.gram_per_usdt),
            "usdt_per_gram": str(Decimal(1) / self.gram_per_usdt),
            "fetched_at": self.fetched_at.isoformat(),
            "stale": self.age > CACHE_SECONDS,
            "display_only": True,
        }


def _positive_decimal(value):
    try:
        value = Decimal(str(value))
        return value if value.is_finite() and value > 0 else None
    except (InvalidOperation, ValueError, TypeError):
        return None


def _decode_cached(raw):
    data = json.loads(raw)
    rate = _positive_decimal(data.get("gram_per_usdt"))
    date = datetime.fromisoformat(data["fetched_at"])
    if rate is None or date.tzinfo is None or date > datetime.now(timezone.utc):
        return None
    quote = GramQuote(rate, date)
    return quote if quote.age <= MAX_STALE_SECONDS else None


async def _redis():
    from app.services.session_manager import SessionManager
    if SessionManager._use_memory:
        return None
    return SessionManager().redis


async def get_gram_quote() -> GramQuote | None:
    """One upstream refresh per cache window, with bounded failure backoff.

    Balance and reward APIs do not await this call. Rates have a separate
    endpoint so an unavailable provider never delays or changes real balances.
    """
    global _cached, _retry_after, _refresh_lock, _lock_loop
    if _cached and _cached.age <= CACHE_SECONDS:
        return _cached
    if time.monotonic() < _retry_after:
        return _cached if _cached and _cached.age <= MAX_STALE_SECONDS else None
    loop = asyncio.get_running_loop()
    if _lock_loop is not loop:
        _lock_loop, _refresh_lock = loop, asyncio.Lock()
    async with _refresh_lock:
        if _cached and _cached.age <= CACHE_SECONDS:
            return _cached
        if time.monotonic() < _retry_after:
            return _cached if _cached and _cached.age <= MAX_STALE_SECONDS else None
        redis = None
        try:
            redis = await _redis()
            if redis:
                raw = await asyncio.wait_for(redis.get(CACHE_KEY), timeout=0.25)
                if raw:
                    cached = _decode_cached(raw)
                    if cached:
                        _cached = cached
                        if cached.age <= CACHE_SECONDS:
                            return cached
                acquired = await asyncio.wait_for(redis.set(CACHE_KEY + ":refresh", "1", nx=True, ex=10), timeout=0.25)
                if not acquired:
                    _retry_after = time.monotonic() + 5
                    return _cached if _cached and _cached.age <= MAX_STALE_SECONDS else None
        except Exception:
            redis = None
        settings = get_settings()
        headers = {"Authorization": f"Bearer {settings.TON_API_KEY}"} if settings.TON_API_KEY else {}
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(3.0)) as client:
                response = await client.get("https://tonapi.io/v2/rates", params={"tokens": f"ton,{settings.USDT_MASTER}", "currencies": "usd"}, headers=headers)
                response.raise_for_status()
                rates = json.loads(response.text, parse_float=Decimal)["rates"]
            native = rates.get("GRAM") or rates.get("TON") or rates.get("ton") or rates.get("gram")
            usdt = rates.get(settings.USDT_MASTER) or rates.get("USDT") or rates.get("usdt")
            native_usd = _positive_decimal(native["prices"]["USD"])
            usdt_usd = _positive_decimal(usdt["prices"]["USD"])
            if native_usd is None or usdt_usd is None:
                raise ValueError("Invalid native GRAM or USDT price")
            _cached = GramQuote(usdt_usd / native_usd, datetime.now(timezone.utc))
            if redis:
                try:
                    await asyncio.wait_for(redis.set(CACHE_KEY, json.dumps(_cached.payload()), ex=MAX_STALE_SECONDS), timeout=0.25)
                except Exception:
                    pass
            return _cached
        except Exception as exc:
            _retry_after = time.monotonic() + 60
            logger.warning("GRAM quote refresh unavailable (%s)", type(exc).__name__)
            return _cached if _cached and _cached.age <= MAX_STALE_SECONDS else None
