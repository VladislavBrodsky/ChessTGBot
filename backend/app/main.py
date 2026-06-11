from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

    # Set all CORS enabled origins - use regex for Telegram WebApp compatibility
    # This dynamically echoes back any origin (including "null" or WebView schemes)
    # which is required by iOS Safari/WKWebView to complete CORS preflights.
    application.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.add_middleware(LoggingMiddleware)
    application.add_middleware(HeadMiddleware)

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
