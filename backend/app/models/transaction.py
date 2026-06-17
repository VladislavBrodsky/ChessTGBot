from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.telegram_id"), index=True)
    type = Column(String)  # 'deposit', 'withdrawal', 'game_wager', 'game_win', 'deposit_fee', 'game_rake', 'referral_commission'
    amount = Column(Integer)  # In cents (e.g., 100 = $1.00)
    fee = Column(Integer, default=0)  # Any fee charged for this transaction
    status = Column(String, default="completed")  # 'pending', 'completed', 'failed'
    reference_id = Column(String, nullable=True)  # Game ID or Web3 Transaction Hash
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationship to user
    user = relationship("User", back_populates="transactions")

# Update the User class to back-populate if needed, but let's register this relationship cleanly.
