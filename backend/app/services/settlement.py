"""
Pure settlement math for decided wager games.

Extracted from GameService.end_game so the money split — the most financially
sensitive calculation in the app — can be unit-tested in isolation. Keep this a
pure function (no I/O, no state) so the tests fully characterize it.
"""


def compute_wager_settlement(bid_amount: int) -> tuple[int, int, int]:
    """
    Split a decided wager game's pot. Both players stake `bid_amount` (cents), so
    the pot is 2 * bid_amount.

    Returns (payout_amount, platform_rake, referral_fee), all in cents:
      • payout_amount — credited to the winner (net ~95% of the pot)
      • platform_rake — kept by the platform (3% of the pot)
      • referral_fee  — funds the referral pool     (2% of the pot)

    Invariant: payout_amount + platform_rake + referral_fee == pot for any
    bid_amount >= 0 — value is conserved, never created or destroyed.
    """
    if bid_amount <= 0:
        return 0, 0, 0
    pot = 2 * bid_amount
    referral_fee = int(pot * 0.02)
    platform_rake = int(pot * 0.03)
    payout_amount = max(0, pot - platform_rake - referral_fee)
    return payout_amount, platform_rake, referral_fee
