"""Run Stripe Checkout reconciliation deliberately from an operator shell."""
import argparse
import asyncio

from app.core.config import get_settings
from app.services.stripe_reconciliation import reconcile_pending_stripe_sessions


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Reconcile aged Stripe Checkout sessions.")
    parser.add_argument("--apply", action="store_true", help="Apply credits/status changes; default is dry-run.")
    parser.add_argument(
        "--confirm-production",
        action="store_true",
        help="Required with --apply when ENV=production.",
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    settings = get_settings()
    if args.apply and settings.ENV == "production" and not args.confirm_production:
        raise SystemExit("Refusing production mutation without --confirm-production.")
    summary = await reconcile_pending_stripe_sessions(dry_run=not args.apply)
    print(f"Stripe reconciliation ({'apply' if args.apply else 'dry-run'}): {summary}")


if __name__ == "__main__":
    asyncio.run(main())
