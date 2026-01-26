from sqlalchemy import Column, Integer, String, BigInteger, Boolean, DateTime
from app.core.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String, nullable=True)
    username = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    elo = Column(Integer, default=1000)
    games_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    
    # Subscription & Payments
    is_premium = Column(Boolean, default=False)
    premium_tier = Column(String, nullable=True) # basic, premium, premium_plus
    premium_expires_at = Column(DateTime, nullable=True)
    balance = Column(Integer, default=0) # Stored in cents/smallest unit to avoid float issues
    wallet_address = Column(String, nullable=True) # TON Wallet Address

    # Gamification & i18n
    level = Column(Integer, default=1)
    xp = Column(BigInteger, default=0)
    referral_code = Column(String, unique=True, index=True, nullable=True)
    preferred_language = Column(String, default='en')
