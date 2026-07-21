from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey, Index, text
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
    # Manual withdrawal review decisions are financial audit events.  Keep the
    # reviewer and decision time in dedicated columns rather than overloading
    # reference_id, which is reserved for a destination or blockchain hash.
    approved_by_admin_id = Column(BigInteger, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejected_by_admin_id = Column(BigInteger, nullable=True)
    rejected_at = Column(DateTime, nullable=True)

    # Relationship to user
    user = relationship("User", back_populates="transactions")

    # A blockchain transfer may be observed by the immediate verifier, TonAPI
    # webhook and the recovery crawler.  The user lock prevents the common
    # race, while this partial index is the final database-level guard against
    # ever crediting the same on-chain deposit twice.  Other transaction types
    # legitimately share reference IDs (for example, both players in a game).
    __table_args__ = (
        Index(
            "uq_transactions_deposit_user_reference",
            "user_id",
            "reference_id",
            unique=True,
            postgresql_where=text("type = 'deposit' AND reference_id IS NOT NULL"),
            sqlite_where=text("type = 'deposit' AND reference_id IS NOT NULL"),
        ),
    )

# Update the User class to back-populate if needed, but let's register this relationship cleanly.
