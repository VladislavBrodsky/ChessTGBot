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
from app.services.telegram_bot import TelegramService

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    from app.core.database import init_db
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
    from app.api.v1.endpoints import game, users
    application.include_router(game.router, prefix="/api/v1/game", tags=["game"])
    application.include_router(users.router, prefix="/api/v1/users", tags=["users"])

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
        async def serve_frontend(full_path: str):
            # Check if file exists (e.g. favicon.ico)
            potential_file = f"{static_dir}/{full_path}"
            if os.path.isfile(potential_file):
                return FileResponse(potential_file)
            return FileResponse(f"{static_dir}/index.html")

    return application

app = create_application()

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.VERSION}
