import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    ENV: str = "production"
    TESTING: bool = False
    
    PROJECT_NAME: str = "Chess Mini App"
    VERSION: str = "1.6.4"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    # NOTE: The effective CORS policy is enforced by RawCORSMiddleware in
    # app/main.py, which uses an explicit allowlist and never emits a "*" origin.
    # This list is retained for reference/tooling only. Do NOT add "*" here — if
    # this ever gets wired to a credentialed CORSMiddleware, a wildcard origin
    # with credentials would be a serious vulnerability.
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://chesstgbot-production.up.railway.app",
        "https://web.telegram.org",
        "https://telegram.org",
    ]

    # Daily Arena: start time (UTC "HH:MM") and window length in minutes
    ARENA_START_UTC: str = "19:00"
    ARENA_DURATION_MINUTES: int = 30

    # Database
    # Default to localhost for dev, but in production (Railways) this MUST be set via env vars.
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost/chess_db"
    DATABASE_READ_URL: str | None = None
    
    # DB Pooling
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE") or "20")
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW") or "50")

    # Redis
    # Default to localhost for dev. In production, use REDIS_URL environment variable.
    REDIS_URL: str = "redis://localhost:6379/0"

    # Telegram
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN") or os.getenv("BOT_TOKEN") or ""
    TELEGRAM_BOT_USERNAME: str = os.getenv("TELEGRAM_BOT_USERNAME") or "FinChess_bot"
    ADMIN_TELEGRAM_ID: int = int(os.getenv("ADMIN_TELEGRAM_ID") or "0")
    PAYOUT_MNEMONIC: str = os.getenv("PAYOUT_MNEMONIC") or ""

    @property
    def admin_telegram_ids(self) -> set[int]:
        raw = os.getenv("ADMIN_TELEGRAM_IDS")
        ids = set()
        if raw:
            for part in raw.split(","):
                part = part.strip()
                if part.isdigit():
                    ids.add(int(part))
        else:
            # Default fallback admins to prevent lockout
            ids = {1016749901, 716720099}
            
        legacy = os.getenv("ADMIN_TELEGRAM_ID")
        if legacy:
            try:
                val = int(legacy)
                if val > 0:
                    ids.add(val)
            except ValueError:
                pass
        return ids

    # Security
    # In production, this MUST be set as an environment variable.
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    # Deployment
    # This URL should be the production URL of your app
    WEBAPP_URL: str = "https://chesstgbot-production.up.railway.app"
    BACKEND_URL: str = ""

    # Payments
    STRIPE_SECRET_KEY: str | None = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET: str | None = os.getenv("STRIPE_WEBHOOK_SECRET")
    TON_API_KEY: str | None = os.getenv("TON_API_KEY")
    TON_CONSOLE_TOKEN: str | None = os.getenv("TON_CONSOLE_TOKEN")

    # Solvency alerting (see app/services/solvency_service.py).
    # OFF by default: the on-chain figure counts USDT only while the custody
    # wallet may hold other assets, so validate GET /admin/solvency against
    # reality before enabling autonomous alerts. When enabled, an alert fires
    # only after the USDT deficit exceeds the buffer for several consecutive
    # checks (sustained), so a transient dip or a TonAPI hiccup never triggers it.
    SOLVENCY_ALERTS_ENABLED: bool = True
    SOLVENCY_DEFICIT_BUFFER_CENTS: int = 5000          # $50 tolerance before a deficit counts
    SOLVENCY_CHECK_INTERVAL_SECONDS: int = 3600        # check hourly
    SOLVENCY_SUSTAINED_CHECKS: int = 3                 # consecutive deficits required to alert

    # Gas-float alerting. USDT payouts are jetton transfers that each burn ~0.05
    # TON of gas from the master wallet. If its native TON balance runs low,
    # withdrawals start failing (each failure already alerts + refunds the user).
    # This is a PROACTIVE early warning so the float can be topped up first.
    # Opt-in for consistency; strongly recommended once MASTER_WALLET is verified.
    GAS_FLOAT_ALERTS_ENABLED: bool = True
    GAS_FLOAT_MIN_TON: float = 2.0                     # warn when master TON balance drops below this
    GAS_FLOAT_CHECK_INTERVAL_SECONDS: int = 3600       # check hourly

    # Withdrawal velocity controls. Payouts are instant + irreversible from the
    # hot wallet, so a stolen session could otherwise drain a balance in one shot.
    # A rolling-24h per-user cap bounds the blast radius; withdrawals at/above the
    # review threshold are held for manual admin approval instead of auto-paid.
    WITHDRAWAL_DAILY_CAP_CENTS: int = 100000            # $1,000 per user per rolling 24h
    WITHDRAWAL_REVIEW_THRESHOLD_CENTS: int = 50000      # hold withdrawals >= $500 for admin review

    # Per-withdrawal owner confirmation (second factor). Below-review-threshold
    # withdrawals are debited and HELD until the owner taps Confirm on a bot DM
    # (a stolen initData session can call the API, but cannot press an inline
    # button in the victim's private bot chat). Unconfirmed requests refund
    # after the TTL. Requires TELEGRAM_BOT_TOKEN — without a bot configured
    # (dev/tests) the legacy auto-pay path is used.
    WITHDRAWAL_CONFIRMATION_ENABLED: bool = (os.getenv("WITHDRAWAL_CONFIRMATION_ENABLED", "true").lower() != "false")
    WITHDRAWAL_CONFIRMATION_TTL_SECONDS: int = int(os.getenv("WITHDRAWAL_CONFIRMATION_TTL_SECONDS", "1800"))

    # Sybil / account-farming resistance. Referral signup bonuses mint real
    # USDT balance, so they are the farmable surface:
    # - a referrer banks at most N signup bonuses per rolling 24h (excess
    #   unlocks later, it is deferred rather than forfeited);
    # - the recruit's 3 milestone games only count when they had enough moves
    #   to be real games (instant resigns don't qualify);
    # - accounts created from the same IP as their referrer get no referral
    #   attribution at all;
    # - N+ signups from one IP within 24h alert the Security system.
    REFERRAL_SIGNUP_BONUS_DAILY_CAP: int = int(os.getenv("REFERRAL_SIGNUP_BONUS_DAILY_CAP", "5"))
    REFERRAL_MILESTONE_MIN_MOVES: int = int(os.getenv("REFERRAL_MILESTONE_MIN_MOVES", "10"))
    SIGNUP_IP_CLUSTER_ALERT_THRESHOLD: int = int(os.getenv("SIGNUP_IP_CLUSTER_ALERT_THRESHOLD", "5"))

    # Gas grants (deposit "gas wall" fix): a user whose wallet holds USDT but
    # no native TON cannot pay jetton-transfer gas to deposit. On request the
    # platform sends a small TON splash from the master wallet, gated by
    # on-chain proof (wallet actually holds USDT and actually lacks TON),
    # a per-user/per-wallet cooldown, and a global daily cap on grants.
    GAS_GRANT_ENABLED: bool = (os.getenv("GAS_GRANT_ENABLED", "true").lower() != "false")
    GAS_GRANT_AMOUNT_NANOTON: int = int(os.getenv("GAS_GRANT_AMOUNT_NANOTON", "60000000"))        # 0.06 TON
    GAS_GRANT_MIN_USDT_UNITS: int = int(os.getenv("GAS_GRANT_MIN_USDT_UNITS", "5000000"))         # >= 5 USDT on-chain (6 decimals)
    GAS_GRANT_MAX_TON_BALANCE_NANO: int = int(os.getenv("GAS_GRANT_MAX_TON_BALANCE_NANO", "30000000"))  # < 0.03 TON = "no gas"
    GAS_GRANT_COOLDOWN_DAYS: int = int(os.getenv("GAS_GRANT_COOLDOWN_DAYS", "30"))
    GAS_GRANT_DAILY_GLOBAL_CAP: int = int(os.getenv("GAS_GRANT_DAILY_GLOBAL_CAP", "25"))

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
    # Automatically detect pytest execution and set TESTING flag
    if "pytest" in sys.modules:
        settings.TESTING = True
        
    # If not running in development or testing mode, enforce production security checks
    is_testing = settings.TESTING
    is_dev = settings.ENV == "development"
    is_sqlite = settings.DATABASE_URL.startswith("sqlite")
    
    if not is_testing and not is_dev and not is_sqlite:
        if not settings.SECRET_KEY or settings.SECRET_KEY == "":
            raise ValueError("SECRET_KEY environment variable must be set in production!")
        if not settings.WEBHOOK_SECRET or settings.WEBHOOK_SECRET == "dev_webhook_secret":
            raise ValueError("WEBHOOK_SECRET must be set to a secure custom value in production!")
    return settings
