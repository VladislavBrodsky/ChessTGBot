"""Immutable native-GRAM reward credits and their committed notification outbox."""
from datetime import datetime, timezone

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class GramReward(Base):
    __tablename__ = "gram_rewards"
    __table_args__ = (
        CheckConstraint("amount_nano >= 100000000 AND amount_nano <= 1000000000", name="ck_gram_reward_amount"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    source_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    source_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    amount_nano: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Delivery is separate from the credit transaction. A Telegram failure must
    # never undo a reward or announce one before its transaction commits.
    notification_text: Mapped[str] = mapped_column(Text, nullable=False)
    notification_status: Mapped[str] = mapped_column(String(24), nullable=False, default="pending", server_default="pending", index=True)
    notification_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    notification_lease_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notification_message_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
