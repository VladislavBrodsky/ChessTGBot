"use client";

import { Eyebrow } from "@/components/ui/Badge";
import { useState } from "react";
import { TIME_CONTROLS } from "@/lib/config";
import { Card } from "./ui/Card";
import { Icon } from "@/icons";
import { SegmentedControl } from "./ui/SegmentedControl";

export function MatchPreview() {
  const [time, setTime] = useState<(typeof TIME_CONTROLS)[number]>("3+2");

  const names: Record<string, string> = {
    "1+0": "Bullet",
    "3+2": "Blitz Standard",
    "5+0": "Blitz Classic",
    "10+0": "Rapid Master",
  };

  const badges: Record<string, { tag: string; color: string }> = {
    "1+0": { tag: "Ultra Fast", color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
    "3+2": { tag: "Most Popular", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
    "5+0": { tag: "Tactical Depth", color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
    "10+0": { tag: "Deep Calculation", color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
  };

  const descriptions: Record<string, string> = {
    "1+0": "60 seconds total. Instant adrenaline, fast instinct, and high tactical volatility.",
    "3+2": "3 minutes plus 2-second increment per move. The competitive FIDE standard for online blitz.",
    "5+0": "5 minutes flat per side. Clean calculation without increment pressure.",
    "10+0": "10 minutes per side. Room for opening theory, prophylactic planning, and deep endgame conversion.",
  };

  return (
    <Card className="match-preview p-6 bg-surface border border-line rounded-2xl relative overflow-hidden" data-interactive-workspace>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>Matchmaker tempo selector</Eyebrow>
        <span className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badges[time].color}`}>
          {badges[time].tag}
        </span>
      </div>

      <div className="my-5 flex items-center justify-between">
        <div>
          <p className="font-mono text-overline uppercase text-fg-muted">
            {names[time]}
          </p>
          <p
            className="poster mt-1 text-stat tabular-nums text-fg-default font-bold"
            aria-live="polite"
          >
            {time}
          </p>
        </div>
        <span className="grid size-14 place-items-center rounded-2xl border border-line bg-inset text-fg-default">
          <Icon name="clock" size={28} />
        </span>
      </div>

      <SegmentedControl
        label="Preview a time control"
        options={TIME_CONTROLS}
        value={time}
        onChange={setTime}
      />

      <p
        className="my-4 min-h-12 text-body-sm text-fg-muted"
        aria-live="polite"
      >
        {descriptions[time]}
      </p>

      {/* Safe Space Clock & Matchmaking Guarantees */}
      <div className="space-y-2 border-t border-line pt-4 text-caption font-mono text-fg-muted">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Lag compensation
          </span>
          <span className="text-fg-default font-semibold">FIDE-standard</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Icon name="shield-check" size={13} className="text-emerald-600" />
            Disconnect protection
          </span>
          <span className="text-fg-default font-semibold">60s forfeit timer</span>
        </div>
      </div>
    </Card>
  );
}
