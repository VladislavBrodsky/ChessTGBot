from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.socket import sio_app
import app.socket_events # Register events

settings = get_settings()

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
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

    # Mount Socket.IO
    application.mount("/", sio_app)

    # API Routers
    from app.api.v1.endpoints import game
    application.include_router(game.router, prefix="/api/v1/game", tags=["game"])

    return application

app = create_application()

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.VERSION}
