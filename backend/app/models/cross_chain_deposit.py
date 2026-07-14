from datetime import datetime, timezone

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class CrossChainDeposit(Base):
    """A conversion order whose payout is verified by the normal TON deposit path."""

    __tablename__ = "cross_chain_deposits"
    __table_args__ = (
        UniqueConstraint("provider", "provider_order_id", name="uq_cross_chain_provider_order"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.telegram_id"), nullable=False, index=True
    )
    provider: Mapped[str] = mapped_column(String(32), nullable=False, default="changelly")
    provider_order_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    rate_id: Mapped[str] = mapped_column(String(256), nullable=False)
    source_currency: Mapped[str] = mapped_column(String(32), nullable=False)
    source_amount: Mapped[str] = mapped_column(String(80), nullable=False)
    expected_usdt: Mapped[str] = mapped_column(String(80), nullable=False)
    network_fee_usdt: Mapped[str] = mapped_column(String(80), nullable=False, default="0")
    payin_address: Mapped[str] = mapped_column(String(512), nullable=False)
    payin_extra_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    refund_address: Mapped[str] = mapped_column(String(512), nullable=False)
    status: Mapped[str] = mapped_column(String(64), nullable=False, default="waiting", index=True)
    payout_hash: Mapped[str | None] = mapped_column(String(256), nullable=True, index=True)
    pay_till: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow_naive)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=_utcnow_naive, onupdate=_utcnow_naive
    )
