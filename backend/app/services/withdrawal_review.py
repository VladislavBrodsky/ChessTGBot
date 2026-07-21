"""Atomic state transitions for manually reviewed withdrawals.

The conditional updates in this module are the durable ownership boundary for
an irreversible payout.  A caller must commit the approval claim before
talking to the blockchain, so any later request sees a non-reviewable status.
"""
from datetime import datetime, timezone

from sqlalchemy import update

from app.models.transaction import Transaction

PENDING_REVIEW_STATUS = "pending_review"
PROCESSING_PAYOUT_STATUS = "processing_payout"
REVIEW_REFERENCE_PREFIX = "pending_review:"


def now_naive_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def claim_payout(
    db,
    tx_id: int,
    admin_id: int,
) -> tuple[bool, datetime]:
    """Claim a pending-review withdrawal for one payout attempt.

    The commit is deliberate: payout callers must not start an external side
    effect until other sessions can observe the durable processing state.
    """
    approved_at = now_naive_utc()
    result = await db.execute(
        update(Transaction)
        .where(
            Transaction.id == tx_id,
            Transaction.type == "withdrawal",
            Transaction.status == PENDING_REVIEW_STATUS,
        )
        .values(
            status=PROCESSING_PAYOUT_STATUS,
            approved_by_admin_id=admin_id,
            approved_at=approved_at,
        )
    )
    await db.commit()
    return result.rowcount == 1, approved_at


async def release_payout_claim(db, tx_id: int) -> bool:
    """Reopen a claim only after a known pre-broadcast payout failure."""
    result = await db.execute(
        update(Transaction)
        .where(
            Transaction.id == tx_id,
            Transaction.type == "withdrawal",
            Transaction.status == PROCESSING_PAYOUT_STATUS,
        )
        .values(status=PENDING_REVIEW_STATUS)
    )
    await db.commit()
    return result.rowcount == 1


async def reject_pending_review(db, tx_id: int, admin_id: int) -> tuple[bool, datetime]:
    """Transition a reviewable withdrawal to failed without committing.

    The caller credits the held balance and commits both mutations together.
    """
    rejected_at = now_naive_utc()
    result = await db.execute(
        update(Transaction)
        .where(
            Transaction.id == tx_id,
            Transaction.type == "withdrawal",
            Transaction.status == PENDING_REVIEW_STATUS,
        )
        .values(
            status="failed",
            rejected_by_admin_id=admin_id,
            rejected_at=rejected_at,
            reference_id="rejected",
        )
    )
    return result.rowcount == 1, rejected_at
