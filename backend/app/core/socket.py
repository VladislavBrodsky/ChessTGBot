import socketio
from app.core.config import get_settings

settings = get_settings()

client_mgr = None
if settings.REDIS_URL:
    try:
        # Use Redis manager to coordinate messages/rooms across clustered instances (Gunicorn workers / Railway containers)
        client_mgr = socketio.AsyncRedisManager(settings.REDIS_URL)
        print(f"[Socket] Initialized AsyncRedisManager with Redis at: {settings.REDIS_URL}")
    except Exception as e:
        print(f"[Socket] WARNING: Failed to initialize AsyncRedisManager (falling back to in-memory): {e}")

from app.core.security import is_allowed_cors_origin

# Create a Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=is_allowed_cors_origin,
    client_manager=client_mgr
)


@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
