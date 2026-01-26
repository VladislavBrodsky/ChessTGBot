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

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger = logging.getLogger("uvicorn")
    logger.info(f"🚀 Starting App Version: {settings.VERSION}")
    
    # Verify Database Connection
    from app.core.database import init_db, engine
    from sqlalchemy import text
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT inet_server_addr()"))
            db_host = result.scalar()
            logger.info(f"✅ Database Connected. Host: {db_host}")
            if str(db_host) in ["127.0.0.1", "::1"] and "railway" in settings.WEBAPP_URL:
                 logger.warning("⚠️  WARNING: Production App connected to Localhost DB! Ensure DATABASE_URL is set.")
    except Exception as e:
         logger.error(f"❌ Database Connection Failed: {e}")

    await init_db()
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

    # Set all CORS enabled origins
    if settings.BACKEND_CORS_ORIGINS:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=settings.BACKEND_CORS_ORIGINS,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @application.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        print(f"Global Exception: {exc}")
        return JSONResponse(
            status_code=500,
            content={"message": "Internal Server Error"},
        )

    # API Routers
    from app.api.v1.endpoints import game, users, webhook, gamification
    application.include_router(game.router, prefix="/api/v1/game", tags=["game"])
    application.include_router(users.router, prefix="/api/v1/users", tags=["users"])
    application.include_router(webhook.router, prefix="/api/v1/webhook", tags=["webhook"])
    application.include_router(gamification.router, prefix="/api/v1/gamification", tags=["gamification"])

    @application.get("/version")
    @application.head("/version")
    async def get_version():
        return {"version": settings.VERSION, "status": "deployed"}

    @application.get("/health")
    @application.head("/health")
    async def health_check():
        return {"status": "ok", "version": settings.VERSION}

    # Mount Socket.IO (Must be before static catch-all)
    application.mount("/socket.io", sio_app) # Explicitly mount at /socket.io for cleaner routing

    # Static Frontend Serving (Unified Monolith)
    # We check if the 'static_frontend' directory exists (created by Docker)
    static_dir = "static_frontend"
    if os.path.isdir(static_dir):
        # Mount assets (Next.js config usually puts them in _next)
        application.mount("/_next", StaticFiles(directory=f"{static_dir}/_next"), name="next-assets")
        
        # SPA Catch-All
        # We need a custom route logic to fallback to index.html for unknown routes (like /game/123)
        @application.exception_handler(404)
        async def custom_404_handler(_, __):
            return FileResponse(f"{static_dir}/index.html")

        @application.get("/{full_path:path}")
        @application.head("/{full_path:path}")
        async def serve_frontend(full_path: str):
            # Check if file exists (e.g. favicon.ico)
            potential_file = f"{static_dir}/{full_path}"
            if os.path.isfile(potential_file):
                return FileResponse(potential_file)
            return FileResponse(f"{static_dir}/index.html")

    return application

app = create_application()
