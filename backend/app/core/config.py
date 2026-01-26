from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Chess Mini App"
    VERSION: str = "1.2.1"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    # Database
    # Default to localhost for dev, but in production (Railways) this MUST be set via env vars.
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost/chess_db"

    # Redis
    # Default to localhost for dev. In production, use REDIS_URL environment variable.
    REDIS_URL: str = "redis://localhost:6379/0"

    # Telegram
    TELEGRAM_BOT_TOKEN: str

    # Security
    SECRET_KEY: str = "development_secret_key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    # Deployment
    # This URL should be the production URL of your app
    WEBAPP_URL: str = "https://chesstgbot-production.up.railway.app"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

@lru_cache
def get_settings():
    return Settings()
