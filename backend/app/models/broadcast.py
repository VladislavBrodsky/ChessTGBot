from sqlalchemy import Column, Integer, BigInteger, String, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Broadcast(Base):
    __tablename__ = "broadcasts"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(BigInteger, nullable=False, index=True)
    message = Column(Text, nullable=False)

    # Audience: 'all', 'premium', 'standard', 'joined_24h', 'joined_7d', 'joined_30d'
    audience = Column(String, nullable=False, default="all")

    total_count = Column(Integer, default=0)    # Size of target audience
    sent_count = Column(Integer, default=0)     # Successfully delivered
    failed_count = Column(Integer, default=0)   # Delivery failures

    # Status: 'pending', 'running', 'completed', 'cancelled'
    status = Column(String, default="pending", index=True)

    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
