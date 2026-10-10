"""Season reward maths: pure functions, integer cents, no database and NO money movement.

This is the calculation layer for the planned Season Pool (see design-system/TON_REWARDS_PLAN.md). Nothing in the
app imports it yet; a later, separately reviewed change adds the ledger job that would call `allocate`. Keeping the
maths pure makes it exhaustively testable and lets the payout job stay a thin, auditable wrapper.

Money is always an `int` number of cents. Splits use largest-remainder rounding, so the payouts always sum to
exactly the pool (never a cent created or lost).
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from fractions import Fraction
from typing import Iterable, Mapping, Sequence

BPS = 10_000  # basis points: 10_000 = 100%


def streak_multiplier(day: int, cap: float = 1.5, tau: float = 7.0) -> float:
    """Saturating streak multiplier: 1.0 at day 0, approaches `cap`, never exceeds it."""
    if day <= 0:
        return 1.0
    return 1.0 + (cap - 1.0) * (1.0 - math.exp(-day / tau))


def daily_score(raw_points: float, day_cap: float = 100.0) -> float:
    """Soft-capped daily score: first points count fully, later ones barely; the limit is `day_cap`."""
    if raw_points <= 0:
        return 0.0
    return day_cap * math.tanh(raw_points / day_cap)


def season_pool_cents(fee_revenue_cents: int, alpha_bps: int, marketing_cents: int = 0) -> int:
    """pool = alpha x fee revenue + funded marketing budget (all integer cents, alpha in basis points)."""
    if fee_revenue_cents < 0 or marketing_cents < 0 or not 0 <= alpha_bps <= BPS:
        raise ValueError("fee revenue and marketing must be >= 0 and alpha within 0..10000 bps")
    return fee_revenue_cents * alpha_bps // BPS + marketing_cents


def _largest_remainder(total: int, weights: Sequence[Fraction]) -> list[int]:
    """Split `total` cents proportionally to `weights`; the result sums to exactly `total`."""
    weight_sum = sum(weights)
    if total <= 0 or not weights or weight_sum == 0:
        return [0] * len(weights)
    exact = [Fraction(total) * w / weight_sum for w in weights]
    floors = [int(x) for x in exact]
    leftover = total - sum(floors)
    order = sorted(range(len(weights)), key=lambda i: (-(exact[i] - floors[i]), i))
    for i in order[:leftover]:
        floors[i] += 1
    return floors


def zipf_weights(k: int, s: float = 0.9) -> list[Fraction]:
    """Rank weights 1/r^s for r = 1..k as exact fractions (rounded to 1e-9 so results are reproducible)."""
    return [Fraction(round(1_000_000_000 / (r ** s)), 1_000_000_000) for r in range(1, k + 1)]


@dataclass(frozen=True)
class Allocation:
    payouts: dict[int, int]   # user_id -> cents
    carry_cents: int          # undistributed (e.g. nobody qualified); rolls into the next season
    rank_pool_cents: int
    participation_pool_cents: int


def allocate(
    pool_cents: int,
    ranked_qualifiers: Sequence[int],
    *,
    rank_share_bps: int = 7_000,
    top_fraction_bps: int = 1_000,
    max_winners: int = 50,
    zipf_s: float = 0.9,
    player_cap_bps: int = 2_500,
    reserved_ids: Iterable[int] = (),
) -> Allocation:
    """Distribute a closed season's pool.

    `ranked_qualifiers` must already be ordered best-first and contain only players who met the qualification rules
    (the caller decides ranking and ties; this function never reorders). `reserved_ids` (team / staff accounts) are
    skipped for prizes and their share is redistributed.

    Guarantees (all covered by tests): payouts sum + carry == pool; no payout exceeds `player_cap_bps` of the pool;
    higher rank never earns less rank-prize than a lower one; the result is deterministic.
    """
    if pool_cents < 0 or not 0 <= rank_share_bps <= BPS or not 0 < player_cap_bps <= BPS:
        raise ValueError("invalid pool, rank share or cap")
    reserved = set(reserved_ids)
    eligible = [uid for uid in ranked_qualifiers if uid not in reserved]
    if len(set(eligible)) != len(eligible):
        raise ValueError("duplicate user ids in ranking")
    n = len(eligible)
    if pool_cents == 0 or n == 0:
        return Allocation({}, pool_cents, 0, 0)

    cap = pool_cents * player_cap_bps // BPS
    rank_pool = pool_cents * rank_share_bps // BPS
    participation_pool = pool_cents - rank_pool
    k = max(1, min(max_winners, n * top_fraction_bps // BPS or 1, n))

    rank_cents = _largest_remainder(rank_pool, zipf_weights(k, zipf_s))
    payouts = {uid: 0 for uid in eligible}
    for uid, cents in zip(eligible[:k], rank_cents):
        payouts[uid] += min(cents, cap)
    rank_overflow = sum(rank_cents) - sum(min(c, cap) for c in rank_cents)

    # Participation pool + any rank overflow is shared equally; iterate so the cap is honoured everywhere.
    remaining = participation_pool + rank_overflow
    open_ids = list(eligible)
    while remaining > 0 and open_ids:
        shares = _largest_remainder(remaining, [Fraction(1)] * len(open_ids))
        next_open, given = [], 0
        for uid, share in zip(open_ids, shares):
            room = cap - payouts[uid]
            take = min(share, room)
            payouts[uid] += take
            given += take
            if payouts[uid] < cap:
                next_open.append(uid)
        remaining -= given
        if given == 0 or len(next_open) == len(open_ids) and remaining < len(open_ids):
            break
        open_ids = next_open

    paid = sum(payouts.values())
    return Allocation({u: c for u, c in payouts.items() if c > 0}, pool_cents - paid, rank_pool, participation_pool)


def payout_dedup_key(season_id: int, user_id: int, kind: str) -> str:
    """Idempotency key for a season credit (CLAUDE.md: every credit path needs a dedup key)."""
    if kind not in {"rank", "participation"}:
        raise ValueError("kind must be 'rank' or 'participation'")
    return f"season:{season_id}:user:{user_id}:{kind}"
