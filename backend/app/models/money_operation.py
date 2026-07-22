"""Durable idempotency claims for balance-changing operations."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint

from app.core.database import Base


class MoneyOperationClaim(Base):
    """Records that a logical money operation has already been settled.

    Ledger rows describe the individual credits and debits.  This table records
    the operation as a whole, so a retry cannot repeat a multi-recipient
    settlement such as referral commissions.
    """

    __tablename__ = "money_operation_claims"

    id = Column(Integer, primary_key=True)
    operation_type = Column(String(100), nullable=False)
    reference_id = Column(String(255), nullable=False)
    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )

    __table_args__ = (
        UniqueConstraint(
            "operation_type",
            "reference_id",
            name="uq_money_operation_claim_type_reference",
        ),
    )
