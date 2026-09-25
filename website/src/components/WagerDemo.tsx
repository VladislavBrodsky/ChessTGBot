"use client";

import { useState } from "react";
import { SETTLEMENT, WAGER_TIERS, winnerReceives } from "@/lib/config";
import { Users, Coins, TrendingUp } from "lucide-react";

const fmt = (n: number) => `${n.toFixed(2)} USDT`;

export function WagerDemo() {
  const [tab, setTab] = useState<"settlement" | "referral">("settlement");
  const [stake, setStake] = useState<number>(5);
  
  // Referral Simulator State
  const [tier1Invites, setTier1Invites] = useState<number>(10);
  const [gamesPerPlayer, setGamesPerPlayer] = useState<number>(5);
  const [avgStake, setAvgStake] = useState<number>(5);

  // 3-Tier Viral Math:
  // Level 1: 1% of pot (50% of 2% pool)
  // Level 2: 0.6% of pot (30% of 2% pool) - assuming each invite brings 3 players
  // Level 3: 0.4% of pot (20% of 2% pool) - assuming each level 2 brings 2 players
  const tier2Invites = tier1Invites * 3;
  const tier3Invites = tier2Invites * 2;
  
  const monthlyVolumeT1 = tier1Invites * gamesPerPlayer * (avgStake * 2) * 30;
  const monthlyVolumeT2 = tier2Invites * gamesPerPlayer * (avgStake * 2) * 30;
  const monthlyVolumeT3 = tier3Invites * gamesPerPlayer * (avgStake * 2) * 30;

  const earningsT1 = (monthlyVolumeT1 * 0.01);
  const earningsT2 = (monthlyVolumeT2 * 0.006);
  const earningsT3 = (monthlyVolumeT3 * 0.004);
  const totalMonthlyEarnings = earningsT1 + earningsT2 + earningsT3;

  return (
    <div className="space-y-6">
      {/* Mode Switcher Pills */}
      <div className="flex rounded-[12px] bg-[#f3f3f3] p-1.5 font-mono text-[12px] font-semibold">
        <button
          type="button"
          onClick={() => setTab("settlement")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-[8px] py-2.5 transition-all ${
            tab === "settlement"
              ? "bg-[#000000] text-white shadow-sm"
              : "text-[#444444] hover:text-[#000000]"
          }`}
        >
          <Coins className="size-3.5" />
          <span>Match Settlement</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("referral")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-[8px] py-2.5 transition-all ${
            tab === "referral"
              ? "bg-[#000000] text-white shadow-sm"
              : "text-[#444444] hover:text-[#000000]"
          }`}
        >
          <Users className="size-3.5" />
          <span>3-Tier Network Calc</span>
        </button>
      </div>

      {tab === "settlement" ? (
        <div className="space-y-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#979797]">Stake amount per player</p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Stake amount">
              {WAGER_TIERS.map((tier) => {
                const active = tier === stake;
                return (
                  <button
                    key={tier}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStake(tier)}
                    className={`min-h-11 rounded-[8px] px-5 font-mono text-[14px] font-semibold transition-all ${
                      active
                        ? "bg-[#000000] text-white"
                        : "bg-[#f3f3f3] text-[#444444] hover:bg-[#e5e5e5] hover:text-[#000000]"
                    }`}
                  >
                    {tier} USDT
                  </button>
                );
              })}
            </div>
          </div>

          <dl className="grid gap-3 border-t border-[#e5e5e5] pt-5 font-mono text-[14px] tabular-nums">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[#444444]">Total Match Pot (2 players)</dt>
              <dd className="font-bold text-[#000000] text-[16px]">{fmt(stake * 2)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[#444444]">Platform Protocol Fee ({SETTLEMENT.platformFeePercent}%)</dt>
              <dd className="text-[#979797]">−{fmt((stake * 2 * SETTLEMENT.platformFeePercent) / 100)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[#444444]">3-Tier Referral Pool ({SETTLEMENT.referralFeePercent}%)</dt>
              <dd className="text-[#979797]">−{fmt((stake * 2 * SETTLEMENT.referralFeePercent) / 100)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-[#000000] pt-4 mt-2">
              <dt className="font-condensed text-[20px] font-bold uppercase text-[#000000]">Winner Receives (95%)</dt>
              <dd className="font-condensed text-[24px] font-bold text-[#047857]">{fmt(winnerReceives(stake))}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[13px] font-mono text-[#000000] mb-1.5">
                <span>Direct Rivals Invited (Tier 1):</span>
                <span className="font-bold">{tier1Invites} players</span>
              </div>
              <input
                type="range"
                min="2"
                max="50"
                step="1"
                value={tier1Invites}
                onChange={(e) => setTier1Invites(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[13px] font-mono text-[#000000] mb-1.5">
                <span>Avg. Matches per Player / Day:</span>
                <span className="font-bold">{gamesPerPlayer} matches</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={gamesPerPlayer}
                onChange={(e) => setGamesPerPlayer(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[13px] font-mono text-[#000000] mb-1.5">
                <span>Avg. Stake per Match:</span>
                <span className="font-bold">{avgStake} USDT</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={avgStake}
                onChange={(e) => setAvgStake(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>
          </div>

          <div className="rounded-[20px] bg-[#000000] p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#2f2f2f] pb-3">
              <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#d1ffca]">
                <TrendingUp className="size-3.5" />
                Monthly Passive Rake
              </span>
              <span className="font-mono text-[11px] text-[#979797]">3-Tier Depth</span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <p className="font-condensed text-[36px] font-bold leading-none text-white">
                  +${totalMonthlyEarnings.toLocaleString("en-US", { maximumFractionDigits: 0 })} <span className="text-[18px] text-[#d1ffca]">USDT</span>
                </p>
                <p className="font-mono text-[11px] text-[#979797] mt-1">/ month estimated passive commission</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#2f2f2f] font-mono text-[11px] text-[#979797]">
              <div>
                <span className="block text-white font-semibold">T1 ({tier1Invites})</span>
                <span>+${earningsT1.toFixed(0)}</span>
              </div>
              <div>
                <span className="block text-white font-semibold">T2 ({tier2Invites})</span>
                <span>+${earningsT2.toFixed(0)}</span>
              </div>
              <div>
                <span className="block text-white font-semibold">T3 ({tier3Invites})</span>
                <span>+${earningsT3.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
