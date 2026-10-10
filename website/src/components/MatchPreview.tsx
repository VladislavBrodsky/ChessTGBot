"use client";

import { Eyebrow } from "@/components/ui/Badge";

import { useState } from "react";
import { TIME_CONTROLS } from "@/lib/config";
import { Card } from "./ui/Card";
import { Icon } from "@/icons";
import { SegmentedControl } from "./ui/SegmentedControl";

export function MatchPreview() {
  const [time, setTime] = useState<(typeof TIME_CONTROLS)[number]>("3+2");
  const names = {
    "1+0": "Bullet",
    "3+2": "Blitz",
    "5+0": "Blitz",
    "10+0": "Rapid",
  };
  const descriptions = {
    "1+0": "One minute. Every second counts.",
    "3+2": "Three minutes, plus two seconds per move.",
    "5+0": "Five minutes to find your rhythm.",
    "10+0": "Ten minutes. Room to think ahead.",
  };
  return (
    <Card className="match-preview" data-interactive-workspace>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>Choose your tempo</Eyebrow>
        <span className="text-caption text-fg-muted">
          Interactive preview
        </span>
      </div>
      <div className="my-5 flex items-center justify-between">
        <div>
          <p className="font-mono text-overline uppercase text-fg-muted">
            {names[time]}
          </p>
          <p
            className="poster mt-1 text-stat tabular-nums"
            aria-live="polite"
          >
            {time}
          </p>
        </div>
        <span className="grid size-16 place-items-center rounded-pill bg-inset">
          <Icon name="clock" size={32} />
        </span>
      </div>
      <SegmentedControl label="Preview a time control" options={TIME_CONTROLS} value={time} onChange={setTime} />
      <p
        className="my-4 min-h-12 text-body-sm text-fg-muted"
        aria-live="polite"
      >
        {descriptions[time]}
      </p>
      <div className="flex items-start gap-2 border-t border-line pt-4 text-caption text-fg-muted">
        <Icon name="paper-plane-tilt" size={16} className="mt-0.5 shrink-0" />
        <p>Choose your match in the app. Telegram notifies you when an opponent is found.</p>
      </div>
    </Card>
  );
}
