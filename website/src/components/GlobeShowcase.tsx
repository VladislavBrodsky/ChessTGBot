"use client";

import { useEffect, useState } from "react";
import { Globe } from "./magicui/globe";
import { Icon } from "@/icons";

const LIVE_MATCHES = [
  { p1: "Dubai", p2: "London", stake: "50 USDT", format: "Blitz 3+2" },
  { p1: "Tokyo", p2: "New York", stake: "100 USDT", format: "Rapid 10+0" },
  { p1: "Tashkent", p2: "Zurich", stake: "25 USDT", format: "Bullet 1+1" },
  { p1: "Seoul", p2: "San Francisco", stake: "250 USDT", format: "Blitz 5+0" },
  { p1: "Paris", p2: "Buenos Aires", stake: "50 USDT", format: "Rapid 15+10" },
  { p1: "Mumbai", p2: "Singapore", stake: "75 USDT", format: "Blitz 3+0" },
];

const ACTIVE_CITIES = [
  "New York",
  "London",
  "Dubai",
  "Tokyo",
  "Tashkent",
  "Mumbai",
  "Berlin",
  "São Paulo",
  "Paris",
  "Seoul",
  "Singapore",
  "Sydney",
];

export function GlobeShowcase() {
  const [matchIndex, setMatchIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMatchIndex((prev) => (prev + 1) % LIVE_MATCHES.length);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  const currentMatch = LIVE_MATCHES[matchIndex];

  return (
    <div className="flex flex-col items-center justify-center relative select-none w-full group py-2">
      {/* ── Ethereal Breathing Ambient Glow Behind Globe ── */}
      <div
        className="pointer-events-none absolute -inset-6 sm:-inset-10 rounded-full bg-radial from-emerald-500/12 via-blue-500/6 to-transparent blur-3xl opacity-80"
        aria-hidden="true"
      />

      {/* ── 3D Globe Visualizer with Floating Contact Shadow & Radar Halos ── */}
      <div className="relative flex items-center justify-center w-full">
        {/* Concentric Atmospheric Radar Rings */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="size-[390px] rounded-full border border-line/40 opacity-45" />
          <div className="size-[290px] rounded-full border border-dashed border-line/30 opacity-35" />
          <div className="size-[190px] rounded-full border border-line/20 opacity-25" />
        </div>

        {/* Soft Elliptical Contact Shadow Beneath 3D Globe */}
        <div
          className="pointer-events-none absolute bottom-4 sm:bottom-6 w-[270px] sm:w-[320px] h-7 rounded-[100%] bg-black/15 blur-xl"
          aria-hidden="true"
        />

        <Globe className="max-w-[460px]" />

        {/* Dynamic Real-Time Duel Flipper Pill (Cycling live matches) */}
        <div className="pointer-events-none absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3.5 py-1.5 font-mono text-caption shadow-xs backdrop-blur-md transition-all duration-300">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-semibold text-fg-default">
            {currentMatch.p1} ⚔️ {currentMatch.p2}
          </span>
          <span className="text-fg-muted font-mono">·</span>
          <span className="font-bold text-emerald-600 font-sans">
            {currentMatch.stake}
          </span>
          <span className="text-fg-muted text-[11px] font-mono hidden sm:inline">
            ({currentMatch.format})
          </span>
        </div>
      </div>

      {/* ── Vibing Active Nodes Ticker Strip ── */}
      <div className="w-full max-w-[480px] mt-2 z-10 space-y-2">
        {/* Subtle Horizontal Active Nodes Ticker */}
        <div className="overflow-hidden whitespace-nowrap rounded-full border border-line/60 bg-surface/50 py-1.5 px-3 backdrop-blur-xs">
          <div className="inline-flex items-center gap-3 text-[11px] font-mono text-fg-muted">
            {ACTIVE_CITIES.map((city, idx) => (
              <span key={`${city}-${idx}`} className="inline-flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-emerald-500" />
                <span>{city}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Minimal Interaction Hint */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-fg-muted">
            <Icon name="arrow-counter-clockwise" size={12} className="text-fg-muted" />
            Drag to rotate globe
          </span>
        </div>
      </div>
    </div>
  );
}
