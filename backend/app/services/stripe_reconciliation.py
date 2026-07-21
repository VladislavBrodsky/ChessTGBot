"""Recovery for Stripe Checkout sessions that did not reach the webhook."""
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

from sqlalchemy import select

from app.api.v1.endpoints.wallet import _credit_stripe_deposit
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.models.transaction import Transaction
from app.services.stripe_compat import stripe_get

logger = logging.getLogger(__name__)


def _now_naive_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _extract_session_status(session: Any) -> tuple[str | None, str | None]:
    """
    Safely extract (status, payment_status) from a Stripe Session object or dict.
    Avoids dict-indexing errors or missing attribute errors on custom or mock objects.
    """
    status = getattr(session, "status", None)
    payment_status = getattr(session, "payment_status", None)

    if status is None and isinstance(session, dict):
        status = session.get("status")
    if payment_status is None and isinstance(session, dict):
        payment_status = session.get("payment_status")

    if status is None and hasattr(session, "__getitem__"):
        try:
            status = session["status"]
        except (KeyError, TypeError, AttributeError):
            pass

    if payment_status is None and hasattr(session, "__getitem__"):
        try:
            payment_status = session["payment_status"]
        except (KeyError, TypeError, AttributeError):
            pass

    return status, payment_status


async def reconcile_pending_stripe_sessions(db=None, *, dry_run: bool = False) -> Dict[str, int]:
    """Reconcile aged Checkout sessions without trusting browser callbacks."""
    settings = get_settings()
    if not settings.STRIPE_SECRET_KEY:
        logger.info("Stripe reconciliation skipped because Stripe is not configured.")
        return {"paid": 0, "expired": 0, "open": 0, "errors": 0}

    import stripe

    stripe.api_key = settings.STRIPE_SECRET_KEY
    now = _now_naive_utc()
    eligible_before = now - timedelta(minutes=15)
    alert_before = now - timedelta(minutes=30)
    owns_session = db is None

    async def run(session):
        result = await session.execute(
            select(Transaction).where(
                Transaction.type == "deposit",
                Transaction.status == "pending",
                Transaction.created_at <= eligible_before,
                Transaction.reference_id.isnot(None),
                Transaction.reference_id.like("cs_%"),
            )
        )
        summary = {"paid": 0, "expired": 0, "open": 0, "errors": 0}
        for tx in result.scalars().all():
            session_id = tx.reference_id
            try:
                checkout = await asyncio.to_thread(stripe.checkout.Session.retrieve, session_id)
                status, payment_status = _extract_session_status(checkout)
                if status is None:
                    status = stripe_get(checkout, "status")
                if payment_status is None:
                    payment_status = stripe_get(checkout, "payment_status")

                if (status == "complete" or payment_status == "paid") and payment_status != "unpaid":
                    if dry_run:
                        logger.info("Dry-run: would credit Stripe transaction #%s.", tx.id)
                    elif await _credit_stripe_deposit(session, tx.id, tx.user_id, session_id):
                        summary["paid"] += 1
                    continue
                if status == "expired":
                    if dry_run:
                        logger.info("Dry-run: would fail expired Stripe transaction #%s.", tx.id)
                    else:
                        locked = await session.execute(
                            select(Transaction).where(Transaction.id == tx.id).with_for_update()
                        )
                        current = locked.scalars().first()
                        if current and current.status == "pending":
                            current.status = "failed"
                            await session.commit()
                            summary["expired"] += 1
                    continue
                if status == "open" and tx.created_at and tx.created_at <= alert_before:
                    summary["open"] += 1
                    from app.core.alerts import send_alert_with_redis_rate_limit
                    await send_alert_with_redis_rate_limit(
                        f"stripe_open_checkout:{tx.id}",
                        "<b>Stripe Checkout session remains open</b>\n\n"
                        f"• <b>Transaction:</b> #{tx.id}\n"
                        f"• <b>User:</b> <code>{tx.user_id}</code>\n"
                        f"• <b>Session:</b> <code>{session_id}</code>",
                        system="treasury",
                    )
            except Exception as exc:
                summary["errors"] += 1
                logger.error("Stripe reconciliation failed for transaction #%s: %s", tx.id, exc)
        return summary

    if owns_session:
        async with AsyncSessionLocal() as session:
            return await run(session)
    return await run(db)


async def reconcile_stripe_deposits(db) -> Dict[str, int]:
    """Alias / wrapper for reconcile_pending_stripe_sessions."""
    return await reconcile_pending_stripe_sessions(db=db)


async def start_stripe_reconciliation_loop() -> None:
    """Schedule Checkout recovery inside the backend service."""
    settings = get_settings()
    if settings.TESTING or not settings.STRIPE_SECRET_KEY:
        logger.info("Stripe reconciliation loop disabled. Skipping.")
        return

    await asyncio.sleep(60)
    while True:
        try:
            summary = await reconcile_pending_stripe_sessions()
            logger.info("Stripe reconciliation complete: %s", summary)
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error("Stripe reconciliation loop failed: %s", exc, exc_info=True)
        await asyncio.sleep(300)
