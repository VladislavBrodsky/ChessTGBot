from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi import FastAPI, Request
from app.core.config import get_settings
from app.core.socket import sio_app
import app.socket_events # Register events
import os
import logging
from app.services.telegram_bot import TelegramService
from app.core.logger import setup_logging, LoggingMiddleware
from app.middleware.head_middleware import HeadMiddleware

setup_logging()
logger = logging.getLogger(__name__)

settings = get_settings()


class RawCORSMiddleware:
    """Raw ASGI middleware that handles CORS at the protocol level.
    
    This bypasses all higher-level middleware abstractions and directly
    handles OPTIONS preflights and injects CORS headers into every HTTP
    response. This is necessary because Starlette's CORSMiddleware can
    fail to add headers when interacting with mounted sub-applications
    (like Socket.IO) or other middleware.
    """
    
    ALLOWED_ORIGINS = {
        "https://chesstgbot-frontend-production.up.railway.app",
        "https://chesstgbot-backend-production.up.railway.app",
        "https://web.telegram.org",
        "https://telegram.org",
    }
    
    def __init__(self, app):
        self.app = app

    def _get_origin(self, scope):
        """Extract the Origin header from ASGI scope headers."""
        for key, value in scope.get("headers", []):
            if key == b"origin":
                return value.decode("latin-1")
        return None

    def _is_allowed(self, origin):
        """Allow any origin (for Telegram WebApp / iOS WKWebView compatibility)."""
        return True  # Allow all origins; restrict if needed via ALLOWED_ORIGINS

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        origin = self._get_origin(scope)

        # No Origin header → not a CORS request, pass through
        if not origin:
            await self.app(scope, receive, send)
            return

        if not self._is_allowed(origin):
            await self.app(scope, receive, send)
            return

        # Handle OPTIONS preflight immediately
        if scope["method"] == "OPTIONS":
            await send({
                "type": "http.response.start",
                "status": 200,
                "headers": [
                    (b"access-control-allow-origin", origin.encode()),
                    (b"access-control-allow-credentials", b"true"),
                    (b"access-control-allow-methods", b"GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"),
                    (b"access-control-allow-headers", b"*"),
                    (b"access-control-max-age", b"86400"),
                    (b"content-length", b"0"),
                ],
            })
            await send({"type": "http.response.body", "body": b""})
            return

        # For all other requests, inject CORS headers into the response
        async def send_with_cors(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                # Remove any existing CORS headers to avoid duplicates
                headers = [
                    (k, v) for k, v in headers
                    if k.lower() not in (
                        b"access-control-allow-origin",
                        b"access-control-allow-credentials",
                    )
                ]
                headers.append((b"access-control-allow-origin", origin.encode()))
                headers.append((b"access-control-allow-credentials", b"true"))
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_with_cors)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"🚀 Starting App Version: {settings.VERSION}")
    
    # Verify Database Connection
    from app.core.database import init_db, engine
    from sqlalchemy import text
    try:
        is_sqlite = engine.url.drivername.startswith("sqlite")
        if is_sqlite:
            logger.info("✅ SQLite Database detected. Initializing schema...")
            await init_db()
            logger.info("✅ SQLite Schema Initialized successfully.")
        else:
            async with engine.connect() as conn:
                result = await conn.execute(text("SELECT inet_server_addr()"))
                db_host = result.scalar()
                logger.info(f"✅ Database Connected. Host: {db_host}")
                if str(db_host) in ["127.0.0.1", "::1"] and "railway" in settings.WEBAPP_URL:
                     logger.warning("⚠️  WARNING: Production App connected to Localhost DB! Ensure DATABASE_URL is set.")
    except Exception as e:
         logger.error(f"❌ Database Connection Failed: {e}")

    await TelegramService.start_bot()
    yield
    # Shutdown
    await TelegramService.stop_bot()

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan
    )

    application.add_middleware(LoggingMiddleware)
    application.add_middleware(HeadMiddleware)

    # Raw CORS middleware — added LAST so it wraps everything and executes FIRST.
    # This handles OPTIONS preflights at the ASGI protocol level and injects
    # CORS headers into every response, which cannot be bypassed by any inner
    # middleware, route handler, or mounted sub-application (like Socket.IO).
    application.add_middleware(RawCORSMiddleware)

    @application.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        print(f"Global Exception: {exc}")
        return JSONResponse(
            status_code=500,
            content={"message": "Internal Server Error"},
        )

    # API Routers
    from app.api.v1.endpoints import game, users, webhook, gamification, wallet
    application.include_router(game.router, prefix="/api/v1/game", tags=["game"])
    application.include_router(users.router, prefix="/api/v1/users", tags=["users"])
    application.include_router(webhook.router, prefix="/api/v1/webhook", tags=["webhook"])
    application.include_router(gamification.router, prefix="/api/v1/gamification", tags=["gamification"])
    application.include_router(wallet.router, prefix="/api/v1/wallet", tags=["wallet"])

    @application.post("/api/v1/client-log")
    async def client_log(request: Request):
        try:
            data = await request.json()
            message = data.get("message")
            level = data.get("level", "INFO")
            print(f"[CLIENT {level}] {message}")
            return {"status": "logged"}
        except Exception as e:
            return {"status": "error", "detail": str(e)}

    @application.get("/version")
    async def get_version():
        return {"version": settings.VERSION, "status": "deployed"}

    @application.get("/health")
    async def health_check():
        return {"status": "ok", "version": settings.VERSION}

    # API Fallback Route (To return JSON 404 instead of falling through to Socket.IO mount at '/')
    @application.api_route("/api/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
    async def api_catch_all(path_name: str):
        return JSONResponse(
            status_code=404,
            content={"detail": "Not Found"}
        )

    # Mount Socket.IO (Must be before static catch-all)
    application.mount("/", sio_app)

    # Static Frontend Serving (Unified Monolith)
    # We check if the 'static_frontend' directory exists (created by Docker)
    static_dir = "static_frontend"
    if os.path.isdir(static_dir):
        # Mount assets (Next.js config usually puts them in _next)
        application.mount("/_next", StaticFiles(directory=f"{static_dir}/_next"), name="next-assets")
        
        # SPA Catch-All
        # We need a custom route logic to fallback to index.html for unknown routes (like /game/123)
        @application.exception_handler(404)
        async def custom_404_handler(request: Request, exc: Exception):
            if request.url.path.startswith("/api/"):
                return JSONResponse(
                    status_code=404,
                    content={"detail": getattr(exc, "detail", "Not Found")}
                )
            return FileResponse(f"{static_dir}/index.html")

        @application.get("/{full_path:path}")
        async def serve_frontend(full_path: str):
            # Exclude api and socket paths from fallback serving
            if full_path.startswith("api/") or full_path == "api" or full_path.startswith("socket.io"):
                return JSONResponse(
                    status_code=404,
                    content={"detail": "Not Found"}
                )

            # 1. Exact file match
            potential_file = f"{static_dir}/{full_path}"
            if os.path.isfile(potential_file):
                return FileResponse(potential_file)
            
            # 2. HTML file match (clean URLs)
            # e.g. /en/home -> /en/home.html
            potential_html = f"{static_dir}/{full_path}.html"
            if os.path.isfile(potential_html):
                return FileResponse(potential_html)

            # 3. Directory index match
            # e.g. /en/home -> /en/home/index.html
            potential_index = f"{static_dir}/{full_path}/index.html"
            if os.path.isfile(potential_index):
                return FileResponse(potential_index)

            # 4. Fallback to SPA root (for client-side routing if static file not found)
            return FileResponse(f"{static_dir}/index.html")

    return application

app = create_application()
