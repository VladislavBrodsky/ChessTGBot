import logging

import socketio
from app.core.config import get_settings
from app.core.logger import exception_summary

settings = get_settings()
logger = logging.getLogger(__name__)


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
        client_mgr = socketio.AsyncRedisManager(settings.REDIS_URL)
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
