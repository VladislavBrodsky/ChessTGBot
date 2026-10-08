"use client";

import { Eyebrow } from "@/components/ui/Badge";

import { useState } from "react";
import { TIME_CONTROLS } from "@/lib/config";
import { Card } from "./ui/Card";
import { Icon } from "@/icons";

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
    <Card className="match-preview">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>Choose your tempo</Eyebrow>
        <span className="font-mono text-caption text-fg-muted">
          Interactive preview
        </span>
      </div>
      <div className="my-8 flex items-center justify-between">
        <div>
          <p className="font-mono text-overline uppercase text-fg-muted">
            {names[time]}
          </p>
          <p
            className="poster mt-1 text-display tabular-nums"
            aria-live="polite"
          >
            {time}
          </p>
        </div>
        <span className="grid size-20 place-items-center rounded-pill bg-inset">
          <Icon name="clock" size={40} />
        </span>
      </div>
      <div
        className="grid grid-cols-4 gap-2"
        role="group"
        aria-label="Preview a time control"
      >
        {TIME_CONTROLS.map((control) => (
          <button
            type="button"
            aria-pressed={time === control}
            key={control}
            onClick={() => setTime(control)}
            className={`min-h-12 rounded-control font-mono text-body font-semibold transition-colors ${time === control ? "bg-inverse text-fg-inverse" : "bg-inset hover:bg-chip"}`}
          >
            {control}
          </button>
        ))}
      </div>
      <p
        className="mt-5 min-h-12 text-body-sm text-fg-muted"
        aria-live="polite"
      >
        {descriptions[time]}
      </p>
      <div className="flex items-start gap-3 border-t border-line pt-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-chip">
          <Icon name="paper-plane-tilt" size={20} />
        </span>
        <div>
          <p className="text-body font-semibold">
            Keep the conversation going.
          </p>
          <p className="mt-1 text-body-sm text-fg-muted">
            Our bot notifies you in Telegram when an opponent is found. Select
            your stake and start matchmaking in the app.
          </p>
        </div>
      </div>
    </Card>
  );
}
