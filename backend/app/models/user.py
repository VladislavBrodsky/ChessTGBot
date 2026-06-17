from sqlalchemy import Integer, String, BigInteger, Boolean, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.core.database import Base
from datetime import datetime
from typing import Optional

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String)
    last_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    username: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    elo: Mapped[int] = mapped_column(Integer, default=1000)
    games_played: Mapped[int] = mapped_column(Integer, default=0)
    wins: Mapped[int] = mapped_column(Integer, default=0)
    losses: Mapped[int] = mapped_column(Integer, default=0)
    draws: Mapped[int] = mapped_column(Integer, default=0)

    # Subscription & Payments
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    premium_tier: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # basic, premium, premium_plus
    premium_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    balance: Mapped[int] = mapped_column(Integer, default=0)  # Stored in cents/smallest unit to avoid float issues
    wallet_address: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # TON Wallet Address

    # Gamification & i18n
    level: Mapped[int] = mapped_column(Integer, default=1)
    xp: Mapped[int] = mapped_column(BigInteger, default=0)
    referral_code: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    preferred_language: Mapped[str] = mapped_column(String, default='en')

    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
