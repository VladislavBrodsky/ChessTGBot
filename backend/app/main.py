from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.core.config import get_settings
import os
import asyncio
import logging
import re
import anyio
from app.services.telegram_bot import TelegramService
from app.core.logger import exception_summary, setup_logging, LoggingMiddleware
from app.middleware.head_middleware import HeadMiddleware
from fastapi.middleware.gzip import GZipMiddleware

setup_logging()
logger = logging.getLogger(__name__)

# Import Socket.IO only after logging is configured so its initialization is
# emitted as structured JSON rather than an unstructured print line.
from app.core.socket import DisconnectSafeSocketIOASGIApp, sio  # noqa: E402
import app.socket_events  # noqa: E402,F401 - register Socket.IO event handlers

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
        from app.core.security import is_allowed_cors_origin
        return is_allowed_cors_origin(origin)

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


async def start_redis_recovery_loop():
    """Periodically check if Redis is down and try to recover it."""
    from app.services.session_manager import SessionManager
    while True:
        try:
            await asyncio.sleep(30)
            await SessionManager.try_recover_redis()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.warning(f"Error in Redis recovery loop: {e}")


async def start_withdrawal_confirmation_sweeper():
    """Refunds withdrawals whose owner-confirmation TTL elapsed (held funds
    are never stranded when the user ignores the Confirm DM), and pages
    Treasury for payouts stuck mid-execution after a crash/redeploy."""
    from app.services.withdrawal_confirmation import expire_stale_confirmations, alert_stuck_payouts
    while True:
        try:
            await asyncio.sleep(300)
            refunded = await expire_stale_confirmations()
            if refunded:
                logger.info(f"Withdrawal-confirmation sweeper refunded {refunded} expired request(s).")
            stuck = await alert_stuck_payouts()
            if stuck:
                logger.warning(f"Withdrawal-confirmation sweeper flagged {stuck} stuck payout(s).")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.warning(f"Error in withdrawal-confirmation sweeper: {e}")


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
                db_pw = engine.url.password or ""
                credentials_state = "configured" if db_pw else "missing"
                logger.info(
                    "✅ Database connection: host=%s, port=%s, database=%s, "
                    "user=%s, credentials=%s",
                    db_host,
                    db_port,
                    db_name,
                    db_user,
                    credentials_state,
                )
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

    # Start background solvency alert loop (no-op unless SOLVENCY_ALERTS_ENABLED)
    from app.services.solvency_service import start_solvency_alert_loop, start_gas_float_alert_loop
    asyncio.create_task(start_solvency_alert_loop())

    # Start background gas-float alert loop (no-op unless GAS_FLOAT_ALERTS_ENABLED)
    asyncio.create_task(start_gas_float_alert_loop())

    # Start background payout backlog processor
    from app.process_payouts_backlog import start_payout_backlog_loop
    asyncio.create_task(start_payout_backlog_loop())

    # Start background withdrawal verification crawler
    from app.services.withdrawal_crawler import start_withdrawal_crawler
    asyncio.create_task(start_withdrawal_crawler())

    # Start background stale-game sweeper: aborts + refunds matched wager games
    # that never got a first move (backstop for the ephemeral in-process abort timer).
    from app.services.stale_game_sweeper import start_stale_game_sweeper
    asyncio.create_task(start_stale_game_sweeper())

    # Start the daily-arena scheduler (announce -> live pairing -> prizes)
    from app.services.arena_service import start_arena_loop
    asyncio.create_task(start_arena_loop())

    # Start the marketing scheduler
    from app.services.marketing_scheduler import start_marketing_loop
    asyncio.create_task(start_marketing_loop())

    # Start background Redis recovery loop
    asyncio.create_task(start_redis_recovery_loop())

    # Refund withdrawal-confirmation requests that expired unanswered
    asyncio.create_task(start_withdrawal_confirmation_sweeper())

    # Aggregate complete UTC telemetry days before pruning expired raw events.
    from app.services.telemetry_maintenance import start_telemetry_maintenance_loop
    asyncio.create_task(start_telemetry_maintenance_loop())

    # ── Level Backfill (runs once on every deploy, idempotent) ──────────────
    # Fixes any users whose `level` column drifted from their actual XP due
    # to the bug where level was not recalculated after XP deductions.
    # Formula: level = max(1, floor(xp / 200) + 1)  (high-watermark: only up)
    try:
        from app.core.database import AsyncSessionLocal
        from app.models.user import User as UserModel
        from sqlalchemy import select as sa_select

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
                
            # ── Release v1.7.0 Broadcast Hook (exactly once using Redis) ───────────
            async def run_release_broadcast():
                from app.services.session_manager import SessionManager
                from app.services.telegram_bot import TelegramService
                from telegram import Bot
                import os
                
                # Wait for database backfill to finish and Redis connection to settle
                await asyncio.sleep(5)
                
                session_mgr = SessionManager()
                redis_client = session_mgr.redis
                
                if not redis_client:
                    logger.warning("Redis client not available, skipping v1.7.0 broadcast")
                    return
                    
                try:
                    # Check if already processed
                    already_sent = await redis_client.get("broadcast_sent:v1.7.0")
                    if already_sent:
                        logger.info("v1.7.0 release broadcast already sent. Skipping.")
                        return
                        
                    # Set the key immediately to prevent race conditions during scaling
                    await redis_client.set("broadcast_sent:v1.7.0", "1", ex=3600)
                    
                    logger.info("Initializing v1.7.0 release broadcast...")
                    bot = TelegramService.application.bot if (TelegramService.application and TelegramService.application.bot) else None
                    if not bot and settings.TELEGRAM_BOT_TOKEN:
                        bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
                        
                    if not bot:
                        logger.error("Failed to fetch bot client for v1.7.0 broadcast")
                        return
                        
                    bot_user = await bot.get_me()
                    bot_username = bot_user.username
                    
                    # Fetch all users
                    async with AsyncSessionLocal() as session:
                        res = await session.execute(sa_select(UserModel.telegram_id))
                        user_ids = [row[0] for row in res.all() if row[0] is not None]
                        
                    logger.info(f"Broadcasting v1.7.0 update to {len(user_ids)} users...")
                    
                    message_text = (
                        f"👑 <b>FinChess v1.7.0 is Live!</b> 🚀\n\n"
                        f"Grandmasters, we've upgraded the arena for massive action:\n\n"
                        f"• ⚡ <b>Stable Matchmaking:</b> Fortified databases and sockets. Reconnect instantly without interrupting your match if you drop connection.\n"
                        f"• ❓ <b>Settings FAQ:</b> Questions about ELO, deposits, or Premium? We added an expandable FAQ directly in your Settings!\n"
                        f"• 🎯 <b>Clearer Quests:</b> Refined instructions on achievements and daily tasks (like inviting friends) so you know exactly how to claim XP.\n"
                        f"• 🛠️ <b>Performance Tuning:</b> Upgraded backend to handle over 100,000 concurrent players.\n\n"
                        f"Test your strategy and climb the leaderboard!\n\n"
                        f"🔗 <b><a href=\"https://t.me/{bot_username}/play\">Play Web3 Chess</a></b>"
                    )
                    
                    image_path = os.path.join(os.path.dirname(__file__), "release_1.7.0.jpg")
                    if not os.path.exists(image_path):
                        logger.error(f"Image not found at path: {image_path}")
                        return
                        
                    sent = 0
                    failed = 0
                    for telegram_id in user_ids:
                        try:
                            with open(image_path, "rb") as photo_file:
                                await bot.send_photo(
                                    chat_id=telegram_id,
                                    photo=photo_file,
                                    caption=message_text,
                                    parse_mode="HTML"
                                )
                            sent += 1
                        except Exception as exc:
                            logger.warning(f"Failed to send startup broadcast to {telegram_id}: {exc}")
                            failed += 1
                        await asyncio.sleep(0.04) # ~25 msgs/sec
                        
                    # Permanently set the sentinel key
                    await redis_client.set("broadcast_sent:v1.7.0", "1")
                    logger.info(f"v1.7.0 broadcast complete. Sent: {sent}, Failed: {failed}")
                    
                except Exception as e:
                    logger.error(f"Error running v1.7.0 broadcast startup task: {e}")
                    
            asyncio.create_task(run_release_broadcast())

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
    application.add_middleware(GZipMiddleware, minimum_size=1000)

    # Raw CORS middleware — added LAST so it wraps everything and executes FIRST.
    # This handles OPTIONS preflights at the ASGI protocol level and injects
    # CORS headers into every response, which cannot be bypassed by any inner
    # middleware, route handler, or mounted sub-application (like Socket.IO).
    application.add_middleware(RawCORSMiddleware)

    @application.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(
            "Unhandled request exception: %s",
            exception_summary(exc),
            exc_info=(type(exc), exc, exc.__traceback__),
        )
        return JSONResponse(
            status_code=500,
            content={"message": "Internal Server Error"},
        )

    # API Routers
    from app.api.v1.endpoints import game, users, webhook, gamification, wallet, admin, arena, telemetry, content, marketplace
    application.include_router(arena.router, prefix="/api/v1/arena", tags=["arena"])
    application.include_router(game.router, prefix="/api/v1/game", tags=["game"])
    application.include_router(users.router, prefix="/api/v1/users", tags=["users"])
    application.include_router(webhook.router, prefix="/api/v1/webhook", tags=["webhook"])
    application.include_router(gamification.router, prefix="/api/v1/gamification", tags=["gamification"])
    application.include_router(wallet.router, prefix="/api/v1/wallet", tags=["wallet"])
    application.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
    application.include_router(telemetry.router, prefix="/api/v1/telemetry", tags=["telemetry"])
    application.include_router(content.router, prefix="/api/v1/content", tags=["content"])
    application.include_router(marketplace.router, prefix="/api/v1/marketplace", tags=["marketplace"])

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
                SessionManager._use_memory = True
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

    # Dedicated logger for client-reported errors. It is NOT in the
    # TelegramAlertHandler ignore-list, so ERROR records here are fingerprinted,
    # rate-limited, and forwarded to admins on Telegram — the same path backend
    # errors already use. This is what turns a frontend crash from "printed to a
    # log nobody reads" into an actual notification.
    client_logger = logging.getLogger("app.client")

    # The frontend prefixes crash reports with their capture point (see
    # reportClientError callers in frontend/src). Translate those raw tags
    # into named failure categories so alerts say what actually broke.
    CLIENT_ERROR_SOURCES = {
        "render": "Render Crash (React page error boundary)",
        "global": "App-Shell Crash (global error boundary)",
        "window.onerror": "Uncaught Exception (event handler / timer)",
        "unhandledrejection": "Unhandled Promise Rejection (async)",
    }

    def _handle_client_log_item(item: dict):
        lvl = str(item.get("level", "INFO")).upper()
        msg = str(item.get("message", ""))[:2000]
        # Optional context the frontend may attach to crash reports.
        url = str(item.get("url", ""))[:500]
        context = f" | page={url}" if url else ""

        # Attribute the error to its capture point when the frontend tagged it.
        # NOTE: keep the label on the same line as the error message — alert
        # fingerprinting dedupes on the first line, so a label-only first line
        # would throttle DIFFERENT errors of the same category as duplicates.
        source_match = re.match(r"^\[([\w.]+)\]\s*(.*)", msg, re.DOTALL)
        if source_match and source_match.group(1) in CLIENT_ERROR_SOURCES:
            label = CLIENT_ERROR_SOURCES[source_match.group(1)]
            msg = f"{label} — {source_match.group(2)}"

        if lvl in ("ERROR", "CRITICAL"):
            # Routes to admins via TelegramAlertHandler (rate-limited + deduped);
            # the "app.client" logger name attributes it to the Game Client system.
            client_logger.error(f"[CLIENT ERROR] {msg}{context}")
        else:
            log_method = {
                "DEBUG": client_logger.debug,
                "WARNING": client_logger.warning,
                "WARN": client_logger.warning,
            }.get(lvl, client_logger.info)
            log_method("[CLIENT %s] %s%s", lvl, msg, context)

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
                    if isinstance(item, dict):
                        _handle_client_log_item(item)
            elif isinstance(data, dict):
                _handle_client_log_item(data)
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
        # Cache policy:
        #  - /_next/static assets are content-hashed -> safe to cache forever.
        #  - HTML documents must ALWAYS be revalidated. Telegram's in-app WebView
        #    (WKWebView on iOS in particular) heuristically caches responses that
        #    have no Cache-Control header, so without "no-cache" users keep getting
        #    a stale build (e.g. the missing-bottom-navbar bug) long after a deploy.
        HTML_NO_CACHE = {"Cache-Control": "no-cache, must-revalidate"}

        # Mount assets (Next.js config usually puts them in _next)
        application.mount("/_next", StaticFiles(directory=f"{static_dir}/_next"), name="next-assets")

        @application.middleware("http")
        async def static_cache_headers(request: Request, call_next):
            response = await call_next(request)
            if request.url.path.startswith("/_next/static/"):
                response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            return response

        # SPA Catch-All
        # We need a custom route logic to fallback to index.html for unknown routes (like /game/123)
        @application.exception_handler(404)
        async def custom_404_handler(request: Request, exc: Exception):
            if request.url.path.startswith("/api/"):
                return JSONResponse(
                    status_code=404,
                    content={"detail": getattr(exc, "detail", "Not Found")}
                )
            return FileResponse(f"{static_dir}/index.html", headers=HTML_NO_CACHE)

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
            if await anyio.Path(potential_file).is_file():
                headers = HTML_NO_CACHE if potential_file.endswith(".html") else None
                return FileResponse(potential_file, headers=headers)

            # 2. HTML file match (clean URLs)
            # e.g. /en/home -> /en/home.html
            potential_html = f"{static_dir}/{full_path}.html"
            if await anyio.Path(potential_html).is_file():
                return FileResponse(potential_html, headers=HTML_NO_CACHE)

            # 3. Directory index match
            # e.g. /en/home -> /en/home/index.html
            potential_index = f"{static_dir}/{full_path}/index.html"
            if await anyio.Path(potential_index).is_file():
                return FileResponse(potential_index, headers=HTML_NO_CACHE)

            # 4. Fallback to SPA root (for client-side routing if static file not found)
            return FileResponse(f"{static_dir}/index.html", headers=HTML_NO_CACHE)

    return application

_fastapi_app = create_application()

# Wrap FastAPI with Socket.IO ASGI app.
# socketio.ASGIApp routes /socket.io/* to the Socket.IO server and
# delegates all other requests to the FastAPI application.
app = DisconnectSafeSocketIOASGIApp(socketio_server=sio, other_asgi_app=_fastapi_app)

# Expose dependency_overrides on the wrapper so that tests can override
# dependencies the same way they do on a plain FastAPI app.
app.dependency_overrides = _fastapi_app.dependency_overrides  # type: ignore[attr-defined]
