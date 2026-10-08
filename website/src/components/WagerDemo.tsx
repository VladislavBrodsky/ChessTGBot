"use client";

import { Eyebrow } from "@/components/ui/Badge";

import { useState } from "react";
import { SETTLEMENT, WAGER_TIERS, winnerReceives } from "@/lib/config";
const fmt = (n: number) => `${n.toFixed(2)} USDT`;

export function WagerDemo() {
  const [stake, setStake] = useState<number>(5);
  const pot = stake * 2;
  const payout = winnerReceives(stake);
  const netGain = payout - stake;
  return (
    <div className="space-y-4" data-interactive-workspace>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>Match example</Eyebrow>
        <span className="text-caption text-fg-muted">
          No transaction
        </span>
      </div>
      <p className="text-body-sm text-fg-muted">
        Select an example stake for each player.
      </p>
      <div
        className="grid grid-cols-4 gap-2"
        role="group"
        aria-label="Example stake amount"
      >
        {WAGER_TIERS.map((tier) => (
          <button
            key={tier}
            type="button"
            aria-pressed={tier === stake}
            onClick={() => setStake(tier)}
            className={`min-h-12 rounded-control font-mono text-body font-semibold transition-colors ${tier === stake ? "bg-inverse text-fg-inverse" : "bg-inset hover:bg-chip"}`}
          >
            {tier}
            <span className="block text-overline font-normal">USDT</span>
          </button>
        ))}
      </div>
      <dl className="grid gap-3 border-t border-line pt-4 text-body-sm tabular-nums [&_dd]:shrink-0 [&_dd]:whitespace-nowrap">
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">Combined pot</dt>
          <dd className="font-mono font-semibold">{fmt(pot)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">
            Platform fee ({SETTLEMENT.platformFeePercent}%)
          </dt>
          <dd className="font-mono">
            {fmt((pot * SETTLEMENT.platformFeePercent) / 100)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">
            Referral allocation ({SETTLEMENT.referralFeePercent}%)
          </dt>
          <dd className="font-mono">
            {fmt((pot * SETTLEMENT.referralFeePercent) / 100)}
          </dd>
        </div>
        <div className="border-t border-line pt-4">
          <dt className="text-caption text-fg-muted">
            Winner receives, including original stake
          </dt>
          <dd
            className="wager-result poster mt-2 text-stat text-fg-win"
            aria-live="polite"
          >
            <span>{payout.toFixed(2)}</span>{" "}<span className="wager-result-unit">USDT</span>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">Net gain if you win</dt>
          <dd className="font-mono font-semibold text-fg-win">+{fmt(netGain)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">Stake lost if you lose</dt>
          <dd className="font-mono font-semibold text-fg-loss">−{fmt(stake)}</dd>
        </div>
      </dl>
      <p className="rounded-media bg-inset p-4 text-caption text-fg-muted">
        Credited to the winner’s platform balance. Wallet withdrawals are requested separately.
      </p>
      <p className="text-caption text-fg-muted">
        You can lose your stake. Wager matches are 18+. Check current fees and
        rules in the app.
      </p>
    </div>
  );
}
