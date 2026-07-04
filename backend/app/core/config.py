import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Chess Mini App"
    VERSION: str = "1.6.1"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    # Includes localhost for dev and production Railway URL.
    # Telegram WebApp runs in an iframe with null or Telegram origin - use wildcard for compatibility.
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://chesstgbot-production.up.railway.app",
        "https://web.telegram.org",
        "https://telegram.org",
        "*"
    ]

    # Database
    # Default to localhost for dev, but in production (Railways) this MUST be set via env vars.
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost/chess_db"

    # Redis
    # Default to localhost for dev. In production, use REDIS_URL environment variable.
    REDIS_URL: str = "redis://localhost:6379/0"

    # Telegram
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN") or os.getenv("BOT_TOKEN") or ""
    TELEGRAM_BOT_USERNAME: str = os.getenv("TELEGRAM_BOT_USERNAME") or "FinChess_bot"
    ADMIN_TELEGRAM_ID: int = int(os.getenv("ADMIN_TELEGRAM_ID") or "0")
    PAYOUT_MNEMONIC: str = os.getenv("PAYOUT_MNEMONIC") or ""

    # Security
    # In production, this MUST be set as an environment variable.
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    # Deployment
    # This URL should be the production URL of your app
    WEBAPP_URL: str = "https://chesstgbot-production.up.railway.app"
    BACKEND_URL: str = ""

    # Payments
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    TON_API_KEY: str | None = os.getenv("TON_API_KEY")
    TON_CONSOLE_TOKEN: str | None = os.getenv("TON_CONSOLE_TOKEN")

    # Web3 Wallets Configuration
    MASTER_WALLET_ADDRESS: str = "UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN"  # Game deposits pool
    COMPANY_WALLET_ADDRESS: str = "EQCvC923gG38fH309hG-h3028u382g382-u382U389-9eD33"  # Rakes & commissions collection
    WEBHOOK_SECRET: str = os.getenv("WEBHOOK_SECRET") or "dev_webhook_secret"

    # Jetton Master Addresses
    USDT_MASTER: str = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
    USDC_MASTER: str = "EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728"
    BTC_MASTER: str = "EQDcBkGHmC4pTf34x3Gm05XvepO5w60DNxZ-XT4I6-UGG5L5"
    ETH_MASTER: str = "EQAvS52CoZckQWLNFa7_iZL3apL52yuTwa-hlgkdWkdYl7LA"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore"
    }

@lru_cache
def get_settings():
    settings = Settings()
    import sys
    # If not running in SQLite (development) and not in pytest (testing), enforce production checks
    is_testing = "pytest" in sys.modules
    is_sqlite = settings.DATABASE_URL.startswith("sqlite")
    if not is_testing and not is_sqlite:
        if not settings.SECRET_KEY or settings.SECRET_KEY == "":
            raise ValueError("SECRET_KEY environment variable must be set in production!")
        if not settings.WEBHOOK_SECRET or settings.WEBHOOK_SECRET == "dev_webhook_secret":
            raise ValueError("WEBHOOK_SECRET must be set to a secure custom value in production!")
    return settings
