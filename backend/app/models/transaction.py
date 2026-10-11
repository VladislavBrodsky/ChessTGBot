from sqlalchemy import Integer, String, BigInteger, DateTime, ForeignKey, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from datetime import datetime, timezone

class Transaction(Base):
    __tablename__ = "transactions"

    # Explicit nullability preserves the existing schema when adding Mapped types.
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.telegram_id"), index=True, nullable=True)
    type: Mapped[str] = mapped_column(String, nullable=True)  # 'deposit', 'withdrawal', 'game_wager', 'game_win', 'deposit_fee', 'game_rake', 'referral_commission'
    amount: Mapped[int] = mapped_column(Integer, nullable=True)  # In cents (e.g., 100 = $1.00)
    fee: Mapped[int] = mapped_column(Integer, default=0, nullable=True)  # Any fee charged for this transaction
    status: Mapped[str] = mapped_column(String, default="completed", nullable=True)  # 'pending', 'completed', 'failed'
    reference_id: Mapped[str | None] = mapped_column(String, nullable=True)  # Game ID or Web3 Transaction Hash
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=True)
    # Manual withdrawal review decisions are financial audit events.  Keep the
    # reviewer and decision time in dedicated columns rather than overloading
    # reference_id, which is reserved for a destination or blockchain hash.
    approved_by_admin_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    rejected_by_admin_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

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
        Index(
            "uq_transactions_stripe_subscription_invoice",
            "reference_id",
            unique=True,
            postgresql_where=text("type = 'stripe_subscription_payment' AND reference_id IS NOT NULL"),
            sqlite_where=text("type = 'stripe_subscription_payment' AND reference_id IS NOT NULL"),
        ),
    )

# Update the User class to back-populate if needed, but let's register this relationship cleanly.
