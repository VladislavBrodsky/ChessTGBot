from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.core.config import get_settings
from app.core.socket import sio
import app.socket_events # Register events
import os
import asyncio
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
        """Allow designated origins, dynamic Railway subdomains, and localhost."""
        if origin in self.ALLOWED_ORIGINS:
            return True
        # Allow localhost origins for local development
        if origin.startswith("http://localhost:") or origin.startswith("http://127.0.0.1:"):
            return True
        # Dynamically allow any Railway chesstgbot subdomain (preview deploys etc.)
        if origin.endswith(".up.railway.app") and "chesstgbot" in origin:
            return True
        # Allow origins matching configured settings URLs
        if settings.WEBAPP_URL and origin == settings.WEBAPP_URL.rstrip("/"):
            return True
        if settings.BACKEND_URL and origin == settings.BACKEND_URL.rstrip("/"):
            return True
        return False

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
    from app.services.game_service import GameService
    GameService.initialize_process_pool()
    
    # Verify Database Connection & Seed Tasks
    from app.core.database import init_db, engine
    try:
        is_sqlite = engine.url.drivername.startswith("sqlite")
        if is_sqlite:
            logger.info("✅ SQLite Database detected. Initializing schema...")
            await init_db()
            logger.info("✅ SQLite Schema Initialized successfully.")
        else:
            # Check connection details from the engine URL, avoiding SQL queries that can fail on startup
            try:
                db_host = engine.url.host
                db_port = engine.url.port
                db_name = engine.url.database
                db_user = engine.url.username
                logger.info(f"✅ Database Connection details: host={db_host}, port={db_port}, database={db_name}, user={db_user}")
                if db_host in ["127.0.0.1", "localhost", "::1"] and "railway" in settings.WEBAPP_URL:
                     logger.warning("⚠️  WARNING: Production App config points to Localhost DB! Ensure DATABASE_URL is set.")
            except Exception as host_err:
                logger.warning(f"⚠️ Could not parse database host: {host_err}")

            logger.info("✅ Non-SQLite Database detected. Seeding tasks...")
            await init_db()
            logger.info("✅ Database tasks seeded successfully.")
    except Exception as e:
         logger.error(f"❌ Database Initialization Failed: {e}")

    await TelegramService.start_bot()

    # Start background subscription expiration checker
    from app.services.subscription_service import start_subscription_checker
    asyncio.create_task(start_subscription_checker())

    # Start background deposit crawler to auto-sync transactions
    from app.services.deposit_crawler import start_deposit_crawler
    asyncio.create_task(start_deposit_crawler())

    # Start background ledger audit reconciliation
    from app.services.ledger_audit import start_ledger_audit_loop
    asyncio.create_task(start_ledger_audit_loop())

    # Start background payout backlog processor
    from app.process_payouts_backlog import start_payout_backlog_loop
    asyncio.create_task(start_payout_backlog_loop())

    # ── Level Backfill (runs once on every deploy, idempotent) ──────────────
    # Fixes any users whose `level` column drifted from their actual XP due
    # to the bug where level was not recalculated after XP deductions.
    # Formula: level = max(1, floor(xp / 200) + 1)  (high-watermark: only up)
    try:
        from app.core.database import AsyncSessionLocal
        from app.models.user import User as UserModel
        from sqlalchemy import select as sa_select, update as sa_update

        if not engine.url.drivername.startswith("sqlite"):
            # Fetch and process users in batches of 100 to prevent loading everything into memory (OOM safety)
            chunk_size = 100
            offset = 0
            total_fixed = 0
            
            while True:
                async with AsyncSessionLocal() as session:
                    result = await session.execute(
                        sa_select(UserModel).order_by(UserModel.id).offset(offset).limit(chunk_size)
                    )
                    users = result.scalars().all()
                    if not users:
                        break
                    
                    fixed_in_batch = 0
                    for u in users:
                        correct_level = max(1, int(u.xp // 200) + 1)
                        if correct_level != u.level:
                            u.level = max(u.level, correct_level)
                            fixed_in_batch += 1
                            total_fixed += 1
                    
                    if fixed_in_batch:
                        await session.commit()
                
                offset += chunk_size
                if len(users) < chunk_size:
                    break

            if total_fixed > 0:
                logger.info(f"✅ Level backfill complete: corrected {total_fixed} user(s) in batches.")
            else:
                logger.info("✅ Level backfill: all users are already consistent.")
    except Exception as e:
        logger.error(f"⚠️  Level backfill failed (non-fatal): {e}")
    # ────────────────────────────────────────────────────────────────────────

    yield
    # Shutdown
    from app.services.game_service import GameService
    GameService.shutdown_process_pool()
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
    from app.api.v1.endpoints import game, users, webhook, gamification, wallet, admin
    application.include_router(game.router, prefix="/api/v1/game", tags=["game"])
    application.include_router(users.router, prefix="/api/v1/users", tags=["users"])
    application.include_router(webhook.router, prefix="/api/v1/webhook", tags=["webhook"])
    application.include_router(gamification.router, prefix="/api/v1/gamification", tags=["gamification"])
    application.include_router(wallet.router, prefix="/api/v1/wallet", tags=["wallet"])
    application.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

    # Sliding window rate limiter for client-side logs (max 5 requests per minute per IP)
    client_log_limits = {}

    async def check_client_log_rate_limit(ip: str) -> bool:
        import time
        from app.services.session_manager import SessionManager
        session_mgr = SessionManager()
        use_redis = session_mgr.redis and not session_mgr._use_memory
        
        now = time.time()
        
        if use_redis:
            try:
                redis_key = f"rate_limit:client_log:{ip}"
                current_count_str = await session_mgr.redis.get(redis_key)
                if current_count_str:
                    current_count = int(current_count_str)
                    if current_count >= 5:
                        return False
                    await session_mgr.redis.incr(redis_key)
                else:
                    await session_mgr.redis.set(redis_key, "1", ex=60)
                return True
            except Exception:
                pass
                
        # In-memory token bucket fallback
        if ip not in client_log_limits:
            client_log_limits[ip] = (5.0, now)
            return True
            
        tokens, last_refill = client_log_limits[ip]
        elapsed = now - last_refill
        new_tokens = min(5.0, tokens + elapsed * (1.0 / 12.0))
        
        if new_tokens >= 1.0:
            client_log_limits[ip] = (new_tokens - 1.0, now)
            return True
            
        client_log_limits[ip] = (new_tokens, now)
        return False

    @application.post("/api/v1/client-log")
    async def client_log(request: Request):
        from fastapi.responses import JSONResponse
        
        ip = request.client.host if request.client else "unknown"
        if not await check_client_log_rate_limit(ip):
            return JSONResponse(
                status_code=429,
                content={"status": "error", "detail": "Rate limit exceeded. Please slow down."}
            )
            
        try:
            data = await request.json()
            if isinstance(data, list):
                for item in data[:20]:  # Cap at 20 logs per batch
                    msg = item.get("message")
                    lvl = item.get("level", "INFO")
                    print(f"[CLIENT {lvl}] {msg}")
            else:
                msg = data.get("message")
                lvl = data.get("level", "INFO")
                print(f"[CLIENT {lvl}] {msg}")
            return {"status": "logged"}
        except Exception as e:
            return {"status": "error", "detail": str(e)}

    @application.get("/version")
    async def get_version():
        return {"version": settings.VERSION, "status": "deployed"}

    @application.get("/health")
    async def health_check():
        # 1. Check Database
        try:
            from app.core.database import AsyncSessionLocal
            from sqlalchemy import text
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
        except Exception as db_err:
            logger.error(f"Health Check Database Failure: {db_err}")
            return JSONResponse(
                status_code=500,
                content={"status": "unhealthy", "detail": f"Database connection error: {str(db_err)}"}
            )

        # 2. Check Redis
        try:
            from app.services.session_manager import SessionManager
            session_mgr = SessionManager()
            if session_mgr.redis and not session_mgr._use_memory:
                await session_mgr.redis.ping()
        except Exception as redis_err:
            logger.error(f"Health Check Redis Failure: {redis_err}")
            return JSONResponse(
                status_code=500,
                content={"status": "unhealthy", "detail": f"Redis connection error: {str(redis_err)}"}
            )

        return {"status": "ok", "version": settings.VERSION}

    # API Fallback Route (To return JSON 404 instead of falling through to Socket.IO mount at '/')
    @application.api_route("/api/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
    async def api_catch_all(path_name: str):
        return JSONResponse(
            status_code=404,
            content={"detail": "Not Found"}
        )

    # Note: Socket.IO is NOT mounted here as a sub-application.
    # Instead, the FastAPI app is wrapped with socketio.ASGIApp at the
    # module level below, so Socket.IO handles /socket.io/* paths and
    # FastAPI handles all other paths. This avoids 405 errors caused by
    # Socket.IO's ASGI app rejecting non-Socket.IO requests at "/".

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

_fastapi_app = create_application()

# Wrap FastAPI with Socket.IO ASGI app.
# socketio.ASGIApp routes /socket.io/* to the Socket.IO server and
# delegates all other requests to the FastAPI application.
import socketio as _socketio_module
app = _socketio_module.ASGIApp(socketio_server=sio, other_asgi_app=_fastapi_app)

# Expose dependency_overrides on the wrapper so that tests can override
# dependencies the same way they do on a plain FastAPI app.
app.dependency_overrides = _fastapi_app.dependency_overrides  # type: ignore[attr-defined]
