#!/usr/bin/env python3
"""Season reward-pool model (planning tool, not production code; standard library only).

Answers: how much real money can a fee-funded reward pool afford to pay, how should it be split, and what does that
mean per player? Run:  python3 backend/scripts/rewards_model.py [--dau 1000] [--stake 5] [--matches 4] [--alpha 0.35] [--marketing 0]

Facts used (website/src/lib/config.ts SETTLEMENT): the winner receives 95% of the pot, the platform keeps 3%, the
referrer 2%. So every match of stake S produces a platform fee of 0.03 * 2S = 0.06 S, shared by both players.

Design under test ("Season Pool"):
  * pool = alpha * (fee revenue) + marketing budget, paid out weekly in a USD-denominated balance (withdrawable as TON)
  * 70% rank pool: Zipf payouts to the top K scorers;  30% participation pool: equal shares to everyone who qualified
  * qualifying = enough active days and enough REAL-STAKE matches against distinct opponents (so each qualifier has
    paid fees that fund the pool; see `sybil_margin`)
"""
from __future__ import annotations
import argparse, math, random

FEE_RATE = 0.03          # platform share of the pot
RANK_SHARE = 0.70        # of the weekly pool
ZIPF_S = 0.9             # rank payout exponent: weight_r ~ 1 / r**s
MIN_QUALIFY_MATCHES = 5  # real-stake matches / week vs >= 3 distinct opponents
WITHDRAW_MIN = 10.0      # USD, matches the app's minimum withdrawal

def gini(values: list[float]) -> float:
    xs = sorted(v for v in values if v >= 0)
    n, total = len(xs), sum(xs)
    if n == 0 or total == 0: return 0.0
    cum = sum((i + 1) * x for i, x in enumerate(xs))
    return (2 * cum) / (n * total) - (n + 1) / n

def streak_multiplier(day: int, cap: float = 1.5, tau: float = 7.0) -> float:
    """Score multiplier for a streak of `day` days: saturating, never above `cap` (so a long streak cannot dominate)."""
    return 1 + (cap - 1) * (1 - math.exp(-day / tau))

def daily_score(raw_points: float, day_cap: float = 100.0) -> float:
    """Diminishing returns: the first points of a day count fully, later ones barely (soft cap), hard limit 2*cap."""
    return day_cap * math.tanh(raw_points / day_cap)

def simulate(dau: int, stake: float, matches_per_day: float, alpha: float, marketing_per_day: float, seed: int = 7) -> dict:
    rng = random.Random(seed)
    weekly_active = int(dau * 2.2)                       # weekly uniques ~ 2.2x DAU (assumption: typical casual-game ratio)
    staking_share = 0.45                                 # share of active players who play real-stake matches (assumption)
    fee_per_day = FEE_RATE * dau * staking_share * matches_per_day * stake  # 0.03 * participations * S
    pool_week = 7 * (alpha * fee_per_day + marketing_per_day)

    # per-player weekly score: log-normal skill/activity heterogeneity
    scores = [rng.lognormvariate(0, 0.9) for _ in range(weekly_active)]
    qualifiers = [i for i in range(weekly_active) if rng.random() < staking_share * 0.62]  # played enough real-stake days
    q = len(qualifiers)
    ranked = sorted(qualifiers, key=lambda i: -scores[i])

    k = max(1, min(50, int(q * 0.10)))
    weights = [1 / (r ** ZIPF_S) for r in range(1, k + 1)]
    wsum = sum(weights)
    rank_pool, part_pool = pool_week * RANK_SHARE, pool_week * (1 - RANK_SHARE)
    payouts = {i: 0.0 for i in ranked}
    for r, i in enumerate(ranked[:k]):
        payouts[i] += rank_pool * weights[r] / wsum
    for i in ranked:
        payouts[i] += part_pool / q if q else 0.0
    vals = list(payouts.values())
    median = sorted(vals)[len(vals) // 2] if vals else 0.0
    fees_paid_per_qualifier = FEE_RATE * 2 * stake / 2 * MIN_QUALIFY_MATCHES   # each qualifier's own fee contribution, min
    return {
        "dau": dau, "weekly_active": weekly_active, "qualifiers": q,
        "fee_revenue_per_day": fee_per_day, "pool_week": pool_week,
        "top1": max(vals) if vals else 0.0, "rank_k": k, "median_qualifier": median,
        "avg_per_qualifier": (sum(vals) / q) if q else 0.0,
        "gini": gini(vals), "weeks_to_withdraw_median": (WITHDRAW_MIN / median) if median > 0 else float("inf"),
        "cost_per_dau_day": pool_week / 7 / dau if dau else 0.0,
        "sybil_margin": (alpha * fees_paid_per_qualifier) / max(1e-9, (sum(vals) / q) if q else 1),
        "alpha": alpha, "marketing_per_day": marketing_per_day,
    }

def fmt(r: dict) -> str:
    return (f"DAU {r['dau']:>6,} | fees/day ${r['fee_revenue_per_day']:>9,.2f} | pool/week ${r['pool_week']:>9,.2f} | "
            f"qualifiers {r['qualifiers']:>6,} | #1 ${r['top1']:>8,.2f} | median ${r['median_qualifier']:>6.2f} | "
            f"avg ${r['avg_per_qualifier']:>6.2f} | gini {r['gini']:.2f} | weeks to $10 (median) {r['weeks_to_withdraw_median']:.1f}")

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dau", type=int); ap.add_argument("--stake", type=float, default=5.0)
    ap.add_argument("--matches", type=float, default=4.0, help="matches per active player per day")
    ap.add_argument("--alpha", type=float, default=0.35, help="share of fee revenue routed to the pool (0-1)")
    ap.add_argument("--marketing", type=float, default=0.0, help="extra funded USD per day (acquisition budget)")
    a = ap.parse_args()
    print(f"stake ${a.stake:g}, {a.matches:g} matches/day, alpha {a.alpha:g}, marketing ${a.marketing:g}/day\n")
    for dau in ([a.dau] if a.dau else [100, 1_000, 10_000, 100_000]):
        print(fmt(simulate(dau, a.stake, a.matches, a.alpha, a.marketing)))
    print("\nStreak multiplier (cap 1.5):", ", ".join(f"d{d}={streak_multiplier(d):.2f}" for d in (1, 3, 7, 14, 30)))
    print("Daily score after soft cap (cap 100):", ", ".join(f"{p}->{daily_score(p):.0f}" for p in (20, 50, 100, 200, 500)))
    print("\nWhat an unfunded promise would cost: paying 20 TON/day to 20 people for a month at $5/TON =",
          f"${20 * 20 * 30 * 5:,.0f}/month")

if __name__ == "__main__":
    main()
