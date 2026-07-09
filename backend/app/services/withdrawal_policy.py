"""
Pure withdrawal-policy decisions (velocity controls).

Kept pure (no I/O) so the money-safety rules can be unit-tested exhaustively.
The endpoint supplies the rolling-24h total and the request amount; these
functions decide whether it's allowed and whether it needs manual review.
"""


def exceeds_daily_cap(withdrawn_24h_cents: int, amount_cents: int, cap_cents: int) -> bool:
    """True if this withdrawal would push the rolling-24h total over the cap."""
    return withdrawn_24h_cents + amount_cents > cap_cents


def remaining_daily_allowance_cents(withdrawn_24h_cents: int, cap_cents: int) -> int:
    """How much more the user may withdraw in the current rolling-24h window."""
    return max(0, cap_cents - withdrawn_24h_cents)


def needs_manual_review(amount_cents: int, review_threshold_cents: int) -> bool:
    """True if a withdrawal is large enough to hold for manual admin approval."""
    return amount_cents >= review_threshold_cents
