"use client";

import { useState } from "react";
import { SETTLEMENT, WAGER_TIERS, winnerReceives } from "@/lib/config";

const fmt = (n: number) => `${n.toFixed(2)} USDT`;

export function WagerDemo() {
  const [stake, setStake] = useState<number>(5);

  return (
    <div className="rounded-card bg-surface p-card shadow-card">
      <p className="text-overline uppercase text-fg-muted">Example · stake per player</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Stake amount">
        {WAGER_TIERS.map((tier) => {
          const active = tier === stake;
          return (
            <button
              key={tier}
              type="button"
              aria-pressed={active}
              onClick={() => setStake(tier)}
              className={`min-h-11 rounded-pill px-5 text-chip transition-colors duration-150 ${
                active
                  ? "bg-inverse text-fg-inverse"
                  : "border border-line-ghost bg-chip text-fg-action hover:border-royal"
              }`}
            >
              {tier} USDT
            </button>
          );
        })}
      </div>

      <dl className="mt-6 grid gap-3 border-t border-line-soft pt-5 text-body tabular-nums">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">Pot (both players)</dt>
          <dd className="font-semibold">{fmt(stake * 2)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">Platform fee ({SETTLEMENT.platformFeePercent}%)</dt>
          <dd>−{fmt((stake * 2 * SETTLEMENT.platformFeePercent) / 100)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">Referral fee ({SETTLEMENT.referralFeePercent}%)</dt>
          <dd>−{fmt((stake * 2 * SETTLEMENT.referralFeePercent) / 100)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-line-soft pt-3">
          <dt className="font-semibold">Winner receives</dt>
          <dd className="text-fg-win font-semibold">{fmt(winnerReceives(stake))}</dd>
        </div>
      </dl>
    </div>
  );
}
