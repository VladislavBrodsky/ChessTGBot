import asyncio
import logging
import time

import socketio
from app.core.config import get_settings
from app.core.logger import exception_summary

settings = get_settings()
logger = logging.getLogger(__name__)


class MonitoredAsyncRedisManager(socketio.AsyncRedisManager):
    """Redis Socket.IO manager with a sustained-outage alert.

    Socket.IO logs every pub/sub reconnect at ERROR. Individual reconnects are
    expected on deploys and are intentionally excluded from pager alerts, but
    an unavailable listener for a minute means cross-instance realtime events
    can no longer be delivered. Promote only that sustained condition through
    this application's ``app.core.socket`` logger.
    """

    REDIS_LISTENER_ALERT_AFTER_SECONDS = 60.0
    REDIS_LISTENER_ALERT_REMINDER_SECONDS = 600.0

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._listener_failure_started_at: float | None = None
        self._listener_failure_count = 0
        self._listener_last_alert_at: float | None = None

    def _record_listener_failure(self, exc: BaseException, *, now: float | None = None) -> None:
        """Record a failed pub/sub receive and alert only after a sustained outage."""
        current_time = time.monotonic() if now is None else now
        if self._listener_failure_started_at is None:
            self._listener_failure_started_at = current_time
            self._listener_failure_count = 0
        self._listener_failure_count += 1

        outage_seconds = current_time - self._listener_failure_started_at
        alert_due = (
            outage_seconds >= self.REDIS_LISTENER_ALERT_AFTER_SECONDS
            and (
                self._listener_last_alert_at is None
                or current_time - self._listener_last_alert_at >= self.REDIS_LISTENER_ALERT_REMINDER_SECONDS
            )
        )
        if alert_due:
            self._listener_last_alert_at = current_time
            logger.error(
                "Socket.IO Redis pub/sub unavailable for %.0fs after %d receive failures; "
                "cross-instance realtime delivery is degraded (%s)",
                outage_seconds,
                self._listener_failure_count,
                exception_summary(exc),
            )

    def _record_listener_recovery(self, *, now: float | None = None) -> None:
        """Log recovery after an outage and reset the next outage's alert state."""
        if self._listener_failure_started_at is None:
            return
        current_time = time.monotonic() if now is None else now
        outage_seconds = current_time - self._listener_failure_started_at
        logger.info(
            "Socket.IO Redis pub/sub listener recovered after %.0fs and %d receive failures",
            outage_seconds,
            self._listener_failure_count,
        )
        self._listener_failure_started_at = None
        self._listener_failure_count = 0
        self._listener_last_alert_at = None

    async def _redis_listen_with_retries(self):  # pragma: no cover - exercised by Socket.IO runtime
        """Mirror Socket.IO's retry loop while turning a prolonged outage into one alert."""
        _, redis_error = self._get_redis_module_and_error()
        retry_sleep = 1
        subscribed = False
        while True:
            try:
                if not subscribed:
                    self._redis_connect()
                    await self.pubsub.subscribe(self.channel)
                    self._record_listener_recovery()
                    retry_sleep = 1
                    subscribed = True
                async for message in self.pubsub.listen():
                    yield message
            except redis_error as exc:
                logger.warning(
                    "Socket.IO Redis pub/sub receive failed; retrying in %d seconds (%s)",
                    retry_sleep,
                    exception_summary(exc),
                )
                self._record_listener_failure(exc)
                subscribed = False
                await asyncio.sleep(retry_sleep)
                retry_sleep = min(retry_sleep * 2, 60)


class DisconnectSafeSocketIOASGIApp(socketio.ASGIApp):
    """Socket.IO ASGI adapter that tolerates a request disconnect race.

    During a polling-to-WebSocket upgrade, the superseded polling request can
    disconnect before python-engineio reads its first ASGI event.  Engine.IO's
    ASGI translator returns an empty environment for that event and its request
    handler then raises ``KeyError('REQUEST_METHOD')``.  A disconnected client
    needs no response, so consume and quietly stop that abandoned request while
    replaying valid first events unchanged to the upstream adapter.
    """

    async def __call__(self, scope, receive, send):
        scope_type = scope.get("type")
        path = scope.get("path", "")
        is_socket_request = (
            scope_type in {"http", "websocket"}
            and (
                self.engineio_path is None
                or self._ensure_trailing_slash(path).startswith(self.engineio_path)
            )
        )

        if not is_socket_request:
            await super().__call__(scope, receive, send)
            return

        first_event = await receive()
        expected_event = "http.request" if scope_type == "http" else "websocket.connect"
        if first_event.get("type") != expected_event:
            logger.debug(
                "Socket.IO request ended before its initial %s event (%s)",
                expected_event,
                first_event.get("type", "unknown"),
            )
            return

        first_event_pending = True

        async def receive_with_first_event():
            nonlocal first_event_pending
            if first_event_pending:
                first_event_pending = False
                return first_event
            return await receive()

        await super().__call__(scope, receive_with_first_event, send)


client_mgr = None
if settings.REDIS_URL:
    try:
        # Use Redis manager to coordinate messages/rooms across clustered instances (Gunicorn workers / Railway containers)
        client_mgr = MonitoredAsyncRedisManager(settings.REDIS_URL)
        logger.info("[Socket] Initialized AsyncRedisManager with configured Redis service")
    except Exception as e:
        logger.warning(
            "[Socket] Failed to initialize AsyncRedisManager; falling back to "
            "in-memory: %s",
            exception_summary(e),
        )

from app.core.security import is_allowed_cors_origin  # noqa: E402

# Create a Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=is_allowed_cors_origin,
    client_manager=client_mgr
)


@sio.event
async def connect(sid, environ):
    logger.info("Client connected: %s", sid)

@sio.event
async def disconnect(sid):
    logger.info("Client disconnected: %s", sid)
