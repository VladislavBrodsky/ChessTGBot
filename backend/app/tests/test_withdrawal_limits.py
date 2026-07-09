"""Unit tests for withdrawal velocity-control policy (app/services/withdrawal_policy.py).

Pure decision logic, no DB/network. Guards the money-safety rules that bound how
much a stolen session can move and which withdrawals require manual review.
"""
from app.services.withdrawal_policy import (
    exceeds_daily_cap,
    remaining_daily_allowance_cents,
    needs_manual_review,
)

CAP = 100000        # $1,000
REVIEW = 50000      # $500


def test_within_cap_allowed():
    assert exceeds_daily_cap(0, 50000, CAP) is False
    assert exceeds_daily_cap(40000, 60000, CAP) is False   # exactly at cap is allowed


def test_over_cap_blocked():
    assert exceeds_daily_cap(40000, 60001, CAP) is True
    assert exceeds_daily_cap(100000, 1, CAP) is True        # already at cap


def test_many_small_withdrawals_cannot_exceed_cap():
    # Simulate draining via small withdrawals: once the running total hits the
    # cap, the next one (however small) is blocked.
    withdrawn = 0
    allowed = 0
    for _ in range(50):
        amt = 5000  # $50 each
        if exceeds_daily_cap(withdrawn, amt, CAP):
            break
        withdrawn += amt
        allowed += amt
    assert allowed == CAP            # never more than the cap gets through
    assert exceeds_daily_cap(withdrawn, 1, CAP) is True


def test_remaining_allowance():
    assert remaining_daily_allowance_cents(0, CAP) == CAP
    assert remaining_daily_allowance_cents(30000, CAP) == 70000
    assert remaining_daily_allowance_cents(CAP, CAP) == 0
    assert remaining_daily_allowance_cents(CAP + 5000, CAP) == 0   # never negative


def test_review_threshold():
    assert needs_manual_review(49999, REVIEW) is False
    assert needs_manual_review(50000, REVIEW) is True    # at threshold => review
    assert needs_manual_review(200000, REVIEW) is True
