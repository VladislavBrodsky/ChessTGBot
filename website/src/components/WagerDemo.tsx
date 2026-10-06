"use client";

import { useState } from "react";
import { SETTLEMENT, WAGER_TIERS, winnerReceives } from "@/lib/config";

const fmt = (n: number) => `${n.toFixed(2)} USDT`;

/**
 * Settlement maths from lib/config (locked to backend/app/services/settlement.py).
 * The old "3-tier network calculator" projected monthly "passive" referral income
 * from invented multipliers; DESIGN.md §10.4 forbids income projections, so it is gone.
 */
export function WagerDemo() {
  const [stake, setStake] = useState<number>(5);
  const pot = stake * 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <span className="tag">Example</span>
        <span className="font-mono text-label text-fg-muted">Both players stake the same amount</span>
      </div>

      <div>
        <p className="font-mono text-overline uppercase text-fg-muted">Stake per player</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Stake amount">
          {WAGER_TIERS.map((tier) => {
            const active = tier === stake;
            return (
              <button
                key={tier}
                type="button"
                aria-pressed={active}
                onClick={() => setStake(tier)}
                className={`min-h-11 rounded-pill px-5 font-mono text-body-sm font-semibold transition-colors duration-150 ${
                  active ? "bg-inverse text-fg-inverse" : "bg-inset text-fg hover:bg-mint"
                }`}
              >
                {tier} USDT
              </button>
            );
          })}
        </div>
      </div>

      <dl className="grid gap-3 border-t border-line pt-5 font-mono text-body-sm tabular-nums">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">Pot (2 players)</dt>
          <dd className="font-semibold text-fg">{fmt(pot)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">Platform fee ({SETTLEMENT.platformFeePercent}%)</dt>
          <dd className="text-fg-muted">−{fmt((pot * SETTLEMENT.platformFeePercent) / 100)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">Referral payouts ({SETTLEMENT.referralFeePercent}%)</dt>
          <dd className="text-fg-muted">−{fmt((pot * SETTLEMENT.referralFeePercent) / 100)}</dd>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-4">
          <dt className="poster text-heading-sm">Winner receives ({SETTLEMENT.winnerPercent}%)</dt>
          <dd className="text-heading-sm font-bold text-fg-win">{fmt(winnerReceives(stake))}</dd>
        </div>
      </dl>
    </div>
  );
}
