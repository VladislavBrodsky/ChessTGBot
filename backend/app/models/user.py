from sqlalchemy import Integer, String, BigInteger, Boolean, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.core.database import Base
from datetime import datetime, timezone
from typing import Optional

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String)
    last_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    username: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    elo: Mapped[int] = mapped_column(Integer, default=1000, index=True)
    games_played: Mapped[int] = mapped_column(Integer, default=0)
    wins: Mapped[int] = mapped_column(Integer, default=0)
    losses: Mapped[int] = mapped_column(Integer, default=0)
    draws: Mapped[int] = mapped_column(Integer, default=0)

    # Subscription & Payments
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    premium_tier: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # basic, premium, premium_plus
    premium_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    balance: Mapped[int] = mapped_column(Integer, default=0)  # Stored in cents/smallest unit to avoid float issues
    wallet_address: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)  # TON Wallet Address
    premium_warning_sent: Mapped[Optional[int]] = mapped_column(Integer, default=0, server_default="0", nullable=True)
    
    # Stripe billing identifiers
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)

    # Gamification & i18n
    level: Mapped[int] = mapped_column(Integer, default=1)
    xp: Mapped[int] = mapped_column(BigInteger, default=0)
    referral_code: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    preferred_language: Mapped[str] = mapped_column(String, default='en')

    # Sybil tracking: hashed IP the account was created from, and when. Used to
    # refuse same-device referral attribution and to alert on one IP minting
    # many accounts. Nullable — accounts predating this column have neither.
    signup_ip_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )

    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")

    @property
    def is_premium_active(self) -> bool:
        """Determines if the user's Premium subscription is currently active based on timestamp."""
        if not self.is_premium:
            return False
        if self.premium_expires_at:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            if self.premium_expires_at < now:
                return False
        return True
