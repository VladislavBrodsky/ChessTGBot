"""Pure unit tests for the Season reward maths (no database)."""
import random

import pytest

from app.services import season_math as sm


def _users(n):
    return list(range(1, n + 1))


@pytest.mark.parametrize("pool,n", [(10_000, 1), (10_000, 3), (123_457, 10), (999_999, 57), (1, 5), (7, 200), (50_000_000, 4_000)])
def test_payouts_plus_carry_equal_pool_exactly(pool, n):
    result = sm.allocate(pool, _users(n))
    assert sum(result.payouts.values()) + result.carry_cents == pool
    assert all(c > 0 for c in result.payouts.values())


def test_no_payout_exceeds_the_player_cap():
    pool = 1_000_000
    result = sm.allocate(pool, _users(40))
    cap = pool * 2_500 // 10_000
    assert max(result.payouts.values()) <= cap


def test_single_qualifier_is_capped_and_the_rest_carries_over():
    result = sm.allocate(100_000, [42])
    assert result.payouts == {42: 25_000}
    assert result.carry_cents == 75_000


def test_nobody_qualifies_means_the_whole_pool_carries():
    result = sm.allocate(88_800, [])
    assert result.payouts == {} and result.carry_cents == 88_800


def test_rank_order_is_respected_and_deterministic():
    pool = 500_000
    first = sm.allocate(pool, _users(80))
    again = sm.allocate(pool, _users(80))
    assert first == again
    amounts = [first.payouts.get(u, 0) for u in _users(80)]
    assert all(a >= b for a, b in zip(amounts, amounts[1:]))


def test_everyone_who_qualified_gets_something_when_the_pool_allows():
    result = sm.allocate(200_000, _users(100))
    assert len(result.payouts) == 100


def test_reserved_team_accounts_never_receive_prizes():
    result = sm.allocate(100_000, _users(30), reserved_ids=[1, 2, 3])
    assert not ({1, 2, 3} & set(result.payouts))
    assert sum(result.payouts.values()) + result.carry_cents == 100_000


def test_duplicate_ids_are_rejected():
    with pytest.raises(ValueError):
        sm.allocate(1_000, [1, 2, 2])


def test_invalid_arguments_are_rejected():
    with pytest.raises(ValueError):
        sm.allocate(-1, [1])
    with pytest.raises(ValueError):
        sm.season_pool_cents(100, 10_001)
    with pytest.raises(ValueError):
        sm.season_pool_cents(-1, 3_500)


def test_pool_is_alpha_of_fees_plus_marketing_in_whole_cents():
    assert sm.season_pool_cents(27_000, 3_500) == 9_450
    assert sm.season_pool_cents(27_000, 3_500, 10_000) == 19_450
    assert sm.season_pool_cents(0, 3_500, 500) == 500


def test_random_pools_never_create_or_lose_a_cent():
    rng = random.Random(1)
    for _ in range(300):
        pool = rng.randint(0, 5_000_000)
        n = rng.randint(0, 300)
        cap_bps = rng.choice([500, 2_500, 10_000])
        result = sm.allocate(pool, _users(n), rank_share_bps=rng.choice([0, 3_000, 7_000, 10_000]), player_cap_bps=cap_bps)
        assert sum(result.payouts.values()) + result.carry_cents == pool
        assert max(result.payouts.values(), default=0) <= pool * cap_bps // 10_000


def test_streak_multiplier_saturates_and_is_monotone():
    values = [sm.streak_multiplier(d) for d in range(0, 61)]
    assert values[0] == 1.0
    assert all(a <= b for a, b in zip(values, values[1:]))
    assert values[-1] < 1.5
    assert sm.streak_multiplier(7) == pytest.approx(1.316, abs=0.01)


def test_daily_score_has_diminishing_returns_and_a_hard_ceiling():
    assert sm.daily_score(0) == 0 and sm.daily_score(-5) == 0
    assert sm.daily_score(50) == pytest.approx(46.2, abs=0.2)
    assert sm.daily_score(10_000) <= 100
    gain_low = sm.daily_score(60) - sm.daily_score(40)
    gain_high = sm.daily_score(260) - sm.daily_score(240)
    assert gain_high < gain_low / 10


def test_dedup_keys_are_stable_and_validated():
    assert sm.payout_dedup_key(3, 99, "rank") == "season:3:user:99:rank"
    with pytest.raises(ValueError):
        sm.payout_dedup_key(3, 99, "bonus")
