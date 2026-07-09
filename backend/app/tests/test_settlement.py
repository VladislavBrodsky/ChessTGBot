"""Unit tests for the wager settlement split (app/services/settlement.py).

This is the most financially sensitive calculation in the app — it decides how
much a winner is paid. Pure unit tests, no DB/network.
"""
import pytest

from app.services.settlement import compute_wager_settlement


def test_no_wager_is_all_zero():
    assert compute_wager_settlement(0) == (0, 0, 0)
    assert compute_wager_settlement(-100) == (0, 0, 0)


def test_five_dollar_stake_split():
    # $5 stake => pot $10 (1000c): referral 2% = 20, rake 3% = 30, payout = 950.
    payout, rake, referral = compute_wager_settlement(500)
    assert (payout, rake, referral) == (950, 30, 20)


@pytest.mark.parametrize("bid", [1, 100, 500, 1000, 2500, 5000, 100000, 999_999])
def test_value_is_conserved(bid):
    # The core money invariant: nothing is created or destroyed. Winner payout
    # plus platform rake plus referral fee must exactly equal the pot.
    payout, rake, referral = compute_wager_settlement(bid)
    pot = 2 * bid
    assert payout + rake + referral == pot
    assert payout >= 0 and rake >= 0 and referral >= 0


@pytest.mark.parametrize("bid", [100, 500, 1000, 5000, 100000])
def test_rake_and_referral_rates(bid):
    payout, rake, referral = compute_wager_settlement(bid)
    pot = 2 * bid
    assert rake == int(pot * 0.03)
    assert referral == int(pot * 0.02)
    # Winner nets roughly 95% of the pot.
    assert payout <= pot and payout >= int(pot * 0.94)
