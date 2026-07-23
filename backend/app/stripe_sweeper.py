"""Deprecated compatibility entry point for Stripe reconciliation.

Use ``python -m ops.reconcile_stripe`` for a deliberate dry-run/apply workflow.
The backend service schedules the same recovery operation automatically.
"""
import asyncio
import logging

from app.services.stripe_reconciliation import reconcile_pending_stripe_sessions

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def run_sweeper():
    return await reconcile_pending_stripe_sessions()


if __name__ == "__main__":
    asyncio.run(run_sweeper())
