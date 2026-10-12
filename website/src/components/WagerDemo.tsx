"use client";

import { Eyebrow } from "@/components/ui/Badge";
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
    <div className="space-y-4" data-interactive-workspace>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>Interactive prize calculator</Eyebrow>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          <Icon name="shield-check" size={12} />
          95% Winner Payout
        </span>
      </div>

      <p className="text-body-sm text-fg-muted">
        Select a stake tier to model the combined pot, settlement split, and instant net gain:
      </p>

      <SegmentedControl
        label="Example stake amount"
        options={WAGER_TIERS}
        value={stake}
        onChange={setStake}
        renderLabel={(tier) => (
          <span className="flex items-center gap-1">
            <UsdtIcon className="size-3.5 text-emerald-600 inline-block" />
            <span>{tier}</span>
          </span>
        )}
      />

      <dl className="grid gap-3 border-t border-line pt-4 text-body-sm tabular-nums [&_dd]:shrink-0 [&_dd]:whitespace-nowrap">
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">Combined pot (2 players)</dt>
          <dd className="font-mono font-semibold text-fg-default">{fmt(pot)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">
            Platform fee ({SETTLEMENT.platformFeePercent}%)
          </dt>
          <dd className="font-mono text-fg-muted">
            {fmt((pot * SETTLEMENT.platformFeePercent) / 100)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">
            6-tier referral pool ({SETTLEMENT.referralFeePercent}%)
          </dt>
          <dd className="font-mono text-emerald-600 font-semibold">
            {fmt((pot * SETTLEMENT.referralFeePercent) / 100)}
          </dd>
        </div>

        {/* Winner Take Callout Box */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 mt-1">
          <div className="flex items-center justify-between">
            <dt className="text-caption text-fg-muted font-sans font-medium">
              Winner receives (95% pot)
            </dt>
            <span className="font-mono text-[11px] font-bold text-emerald-600 bg-emerald-500/15 px-2 py-0.5 rounded-full">
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

        <div className="flex justify-between gap-4 pt-1">
          <dt className="text-fg-muted">Net profit on win</dt>
          <dd className="font-mono font-semibold text-emerald-600">+{fmt(netGain)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">Max loss on defeat</dt>
          <dd className="font-mono font-semibold text-rose-500">−{fmt(stake)}</dd>
        </div>
      </dl>

      <div className="rounded-xl bg-inset p-3 border border-line text-caption text-fg-muted font-mono flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Automated match escrow
        </span>
        <span className="text-fg-default font-semibold">Instant balance credit</span>
      </div>
    </div>
  );
}
