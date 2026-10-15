"""One renewable owner runs background services across API replicas."""
import asyncio
import logging

from app.core.coordination import RedisLease, SharedStateUnavailable
from app.services.session_manager import SessionManager

logger = logging.getLogger(__name__)


async def run_owned_services(factories):
    while True:
        tasks = []
        try:
            sm = SessionManager()
            # No production leadership without the shared coordination service.
            if sm._use_memory or sm.redis is None:
                raise SharedStateUnavailable("Background services require Redis")
            async with RedisLease(sm.redis, "owner:background-services", ttl_ms=20000, wait_seconds=0) as lease:
                tasks = [asyncio.create_task(factory()) for factory in factories]
                logger.info("Background service ownership acquired")
                try:
                    while True:
                        await asyncio.sleep(1)
                        await lease.check()
                        if any(task.done() for task in tasks):
                            # A silently dead service is a failed owner; restart the
                            # cohort after cancelling all its siblings.
                            for task in tasks:
                                if task.done() and not task.cancelled():
                                    task.result()
                            raise RuntimeError("A background service exited")
                finally:
                    for task in tasks:
                        task.cancel()
                    await asyncio.gather(*tasks, return_exceptions=True)
                    tasks = []
        except asyncio.CancelledError:
            raise
        except SharedStateUnavailable:
            pass  # Another healthy replica owns the work, or Redis is down.
        except Exception:
            logger.exception("Background services failed; relinquishing ownership")
        finally:
            for task in tasks:
                task.cancel()
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
        await asyncio.sleep(3)
