"use client";

import { useState } from "react";
import { SETTLEMENT, winnerReceives } from "@/lib/config";

const PRESET_TIERS = [1, 5, 10, 25, 50, 100] as const;

const fmt = (n: number) => `${n.toFixed(2)} USDT`;

/**
 * Settlement maths strictly from lib/config (locked to backend/app/services/settlement.py).
 * Pot = 2 x stake. Winner takes 95% (3% platform maintenance + 2% referral pool).
 */
export function WagerDemo() {
  const [stake, setStake] = useState<number>(5);
  const pot = stake * 2;
  const winnerPayout = winnerReceives(stake);
  const netProfit = winnerPayout - stake;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <span className="tag">Live Simulation</span>
        <span className="font-mono text-label text-fg-muted">Both players commit equal stakes</span>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="font-mono text-overline uppercase text-fg-muted">Select Stake Per Player</p>
          <span className="font-mono text-caption font-semibold text-fg">{stake} USDT</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Stake amount">
          {PRESET_TIERS.map((tier) => {
            const active = tier === stake;
            return (
              <button
                key={tier}
                type="button"
                aria-pressed={active}
                onClick={() => setStake(tier)}
                className={`min-h-11 rounded-pill px-5 font-mono text-body-sm font-semibold transition-colors duration-150 ${
                  active ? "bg-inverse text-fg-inverse shadow-sm" : "bg-inset text-fg hover:bg-mint"
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
          <dt className="text-fg-muted">Total Pot (Both Players)</dt>
          <dd className="font-semibold text-fg">{fmt(pot)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">Platform Fee ({SETTLEMENT.platformFeePercent}%)</dt>
          <dd className="text-fg-muted">−{fmt((pot * SETTLEMENT.platformFeePercent) / 100)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">Referral Community Pool ({SETTLEMENT.referralFeePercent}%)</dt>
          <dd className="text-fg-muted">−{fmt((pot * SETTLEMENT.referralFeePercent) / 100)}</dd>
        </div>

        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-4">
          <div>
            <dt className="poster text-heading-sm">Winner Receives ({SETTLEMENT.winnerPercent}%)</dt>
            <p className="text-[12px] text-fg-muted">Credited immediately to in-app balance</p>
          </div>
          <dd className="text-heading-sm font-bold text-fg-win">{fmt(winnerPayout)}</dd>
        </div>

        <div className="flex items-baseline justify-between gap-4 rounded-card bg-inset px-4 py-2.5">
          <dt className="text-fg-muted font-semibold">Net Profit (Take-Home Edge)</dt>
          <dd className="font-bold text-fg-win">+{fmt(netProfit)}</dd>
        </div>
      </dl>
    </div>
  );
}
