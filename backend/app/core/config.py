from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Chess Mini App"
    VERSION: str = "1.0.1"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    # In production, this should be a list of specific origins like ["https://myapp.com"]
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Database
    # Default to localhost for dev, but in production (Railways) this MUST be set via env vars.
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost/chess_db"

    # Redis
    # Default to localhost for dev. In production, use REDIS_URL environment variable.
    REDIS_URL: str = "redis://localhost:6379/0"

    # Telegram
    TELEGRAM_BOT_TOKEN: str

    # Security
    # In production, this MUST be set as an environment variable.
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    # Deployment
    # This URL should be the production URL of your app
    WEBAPP_URL: str = "https://chesstgbot-production.up.railway.app"

    # Payments
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    TON_API_KEY: str | None = None # For TON Center or similar

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True
        extra = "allow"

@lru_cache
def get_settings():
    return Settings()
