"""Single source of truth for whether a withdrawal may execute a payout."""
from dataclasses import dataclass

from app.core.config import get_settings


@dataclass(frozen=True)
class PayoutReadiness:
    ready: bool
    mode: str
    reason: str | None = None


def get_payout_readiness(settings=None) -> PayoutReadiness:
    """Resolve the payout mode without exposing credentials.

    Mock payouts are intentionally limited to tests and development. Production
    must opt in with PAYOUTS_ENABLED and pass full real-payout configuration.
    """
    settings = settings or get_settings()
    is_non_production = settings.TESTING or settings.ENV == "development"
    if is_non_production:
        # Tests that supply a mnemonic intentionally exercise the real-payout
        # adapter through mocks; otherwise preserve deterministic mock behavior.
        return PayoutReadiness(True, "real" if settings.PAYOUT_MNEMONIC else "mock")

    if not settings.PAYOUTS_ENABLED:
        return PayoutReadiness(False, "disabled", "payouts_disabled")
    if error := settings.payout_configuration_error:
        return PayoutReadiness(False, "disabled", error)
    return PayoutReadiness(True, "real")
