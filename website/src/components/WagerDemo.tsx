"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useState } from "react";
import { SETTLEMENT, WAGER_TIERS, winnerReceives } from "@/lib/config";
import { SegmentedControl } from "./ui/SegmentedControl";
import { UsdtIcon } from "./UsdtIcon";
import { Icon } from "@/icons";

const fmt = (n: number) => `${n.toFixed(2)} USDT`;

export function WagerDemo() {
  const [stake, setStake] = useState<number>(5);
  const pot = stake * 2;
  const payout = winnerReceives(stake);
  const netGain = payout - stake;

  return (
    <Card
      className="flex flex-col justify-between p-6 sm:p-7 bg-surface border border-line rounded-2xl relative overflow-hidden h-full"
      data-interactive-workspace
    >
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3">
          <Badge tone="accent" icon="coins">
            Interactive Prize Calculator
          </Badge>
          <span className="font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            95% Winner Payout
          </span>
        </div>

        <div>
          <h3 className="text-heading-sm font-medium tracking-tight mb-1">
            Simulate match stakes &amp; returns
          </h3>
          <p className="text-body-sm text-fg-muted">
            Select an equal stake tier to model the combined pot, settlement split, and instant net gain
          </p>
        </div>

        {/* Stake Tier Selector */}
        <SegmentedControl
          label="Example stake amount"
          options={WAGER_TIERS}
          value={stake}
          onChange={setStake}
          renderLabel={(tier) => (
            <span className="flex items-center gap-1 font-mono">
              <UsdtIcon className="size-3.5 text-emerald-600 inline-block" />
              <span>{tier}</span>
            </span>
          )}
        />

        {/* Breakdown DL */}
        <dl className="grid gap-2.5 border-t border-line pt-4 text-body-sm tabular-nums [&_dd]:shrink-0 [&_dd]:whitespace-nowrap">
          <div className="flex justify-between items-center gap-4">
            <dt className="text-fg-muted">Combined pot (2 players)</dt>
            <dd className="font-mono font-semibold text-fg-default">{fmt(pot)}</dd>
          </div>
          <div className="flex justify-between items-center gap-4">
            <dt className="text-fg-muted">
              Platform infrastructure fee ({SETTLEMENT.platformFeePercent}%)
            </dt>
            <dd className="font-mono text-fg-muted">
              {fmt((pot * SETTLEMENT.platformFeePercent) / 100)}
            </dd>
          </div>
          <div className="flex justify-between items-center gap-4">
            <dt className="text-fg-muted">
              6-tier referral community pool ({SETTLEMENT.referralFeePercent}%)
            </dt>
            <dd className="font-mono text-emerald-600 font-semibold">
              {fmt((pot * SETTLEMENT.referralFeePercent) / 100)}
            </dd>
          </div>

          {/* Winner Take Callout Box */}
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 my-1">
            <div className="flex items-center justify-between">
              <dt className="text-caption text-fg-muted font-sans font-medium">
                Winner claims (95% of pot)
              </dt>
              <span className="font-mono text-[11px] font-bold text-emerald-600 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                +90% Net ROI
              </span>
            </div>
            <dd
              className="wager-result poster mt-1 text-stat text-emerald-600 font-bold flex items-baseline gap-2"
              aria-live="polite"
            >
              <span>{payout.toFixed(2)}</span>
              <span className="wager-result-unit text-label font-sans font-semibold">USDT</span>
            </dd>
          </div>

          <div className="flex justify-between items-center gap-4 pt-1">
            <dt className="text-fg-muted">Net profit on win</dt>
            <dd className="font-mono font-semibold text-emerald-600">+{fmt(netGain)}</dd>
          </div>
          <div className="flex justify-between items-center gap-4">
            <dt className="text-fg-muted">Max risk on defeat</dt>
            <dd className="font-mono font-semibold text-rose-500">−{fmt(stake)}</dd>
          </div>
        </dl>
      </div>

      {/* Footer Status Bar */}
      <div className="mt-5 pt-3.5 border-t border-line flex items-center justify-between text-caption font-mono text-fg-muted">
        <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
          <Icon name="shield-check" size={14} />
          Automated match escrow
        </span>
        <span className="text-fg-default font-semibold">Instant balance credit</span>
      </div>
    </Card>
  );
}

