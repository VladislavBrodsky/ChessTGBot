"""Deprecated compatibility entry point for Stripe reconciliation.

Use ``python -m ops.reconcile_stripe`` for a deliberate dry-run/apply workflow.
The backend service schedules the same recovery operation automatically.
"""
import asyncio

from app.services.stripe_reconciliation import reconcile_pending_stripe_sessions


async def run_sweeper():
    return await reconcile_pending_stripe_sessions()


if __name__ == "__main__":
    asyncio.run(run_sweeper())
