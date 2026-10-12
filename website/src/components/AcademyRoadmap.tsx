"use client";

import React, { useState } from "react";
import { Icon, type IconName } from "@/icons";
import { telegramLink } from "@/lib/config";
import { BorderBeam } from "@/components/magicui/border-beam";

export interface RoadmapTrack {
  id: string;
  step: string;
  stageName: string;
  levels: string;
  status: string;
  statusType: "start" | "active" | "advanced" | "mastery";
  title: string;
  description: string;
  icon: IconName;
  color: {
    primary: string;
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    glow: string;
    beamFrom: string;
    beamTo: string;
  };
  progressPercent: number;
  lessonsCount: number;
  drillsCount: number;
  concepts: string[];
}

const ROADMAP_TRACKS: RoadmapTrack[] = [
  {
    id: "foundations",
    step: "01",
    stageName: "Foundations",
    levels: "Levels 01–25",
    status: "Start Here",
    statusType: "start",
    title: "Origins & Board Geometry",
    description:
      "Master piece geometry, board vision, and the mathematical value of initiative. The bedrock every winning chess duel is built upon.",
    icon: "graduation-cap",
    color: {
      primary: "#3b82f6",
      bg: "bg-blue-500/10",
      border: "border-blue-500/25",
      text: "text-blue-600 dark:text-blue-400",
      badgeBg: "bg-blue-500/10",
      badgeBorder: "border-blue-500/25",
      badgeText: "text-blue-700 dark:text-blue-400",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.18)]",
      beamFrom: "#3b82f6",
      beamTo: "#06b6d4",
    },
    progressPercent: 25,
    lessonsCount: 25,
    drillsCount: 45,
    concepts: ["Board Geometry", "Piece Values", "Center Space", "King Safety"],
  },
  {
    id: "openings",
    step: "02",
    stageName: "Openings",
    levels: "Levels 26–50",
    status: "Speed Repertoire",
    statusType: "active",
    title: "Opening Principles & Traps",
    description:
      "Fast-strike repertoires for White and Black. Control the center, activate minor pieces, and punish passive opponents before move 10.",
    icon: "strategy",
    color: {
      primary: "#10b981",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
      text: "text-emerald-600 dark:text-emerald-400",
      badgeBg: "bg-emerald-500/10",
      badgeBorder: "border-emerald-500/25",
      badgeText: "text-emerald-700 dark:text-emerald-400",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.18)]",
      beamFrom: "#10b981",
      beamTo: "#3b82f6",
    },
    progressPercent: 50,
    lessonsCount: 25,
    drillsCount: 60,
    concepts: ["Center Control", "Development", "Italian Lines", "Dragon Setup"],
  },
  {
    id: "tactics",
    step: "03",
    stageName: "Tactics",
    levels: "Levels 51–75",
    status: "Calculation",
    statusType: "advanced",
    title: "Tactical Pattern Decapitation",
    description:
      "Calculate forcing lines with absolute clarity: checks, captures, and threats. Exploit uncoordinated pieces and loose kings with laser precision.",
    icon: "lightning",
    color: {
      primary: "#f59e0b",
      bg: "bg-amber-500/10",
      border: "border-amber-500/25",
      text: "text-amber-600 dark:text-amber-400",
      badgeBg: "bg-amber-500/10",
      badgeBorder: "border-amber-500/25",
      badgeText: "text-amber-700 dark:text-amber-400",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.18)]",
      beamFrom: "#f59e0b",
      beamTo: "#10b981",
    },
    progressPercent: 75,
    lessonsCount: 25,
    drillsCount: 120,
    concepts: ["Forks & Pins", "Skewers & Decoys", "Discovered Checks", "Mating Nets"],
  },
  {
    id: "endgames",
    step: "04",
    stageName: "Endgames",
    levels: "Levels 76–100",
    status: "Mastery",
    statusType: "mastery",
    title: "Endgame Conversion & Technique",
    description:
      "Turn a single passed pawn into guaranteed victory. Learn Lucena, Philidor, and king opposition mechanics so you never throw a winning position.",
    icon: "crown-simple",
    color: {
      primary: "#8b5cf6",
      bg: "bg-purple-500/10",
      border: "border-purple-500/25",
      text: "text-purple-600 dark:text-purple-400",
      badgeBg: "bg-purple-500/10",
      badgeBorder: "border-purple-500/25",
      badgeText: "text-purple-700 dark:text-purple-400",
      glow: "shadow-[0_0_15px_rgba(139,92,246,0.18)]",
      beamFrom: "#8b5cf6",
      beamTo: "#ec4899",
    },
    progressPercent: 100,
    lessonsCount: 25,
    drillsCount: 50,
    concepts: ["King Opposition", "Passed Pawns", "Lucena Bridge", "Philidor Draw"],
  },
];

export function AcademyRoadmap() {
  const [selectedTrack, setSelectedTrack] = useState<string>("foundations");

  return (
    <div className="w-full space-y-6 sm:space-y-8 select-none">
      {/* ── 1. CONNECTED ROADMAP PROGRESS STEPPER HUD (Desktop & Tablet) ── */}
      <div className="relative rounded-2xl border border-line bg-surface/80 p-3.5 sm:p-5 shadow-xs backdrop-blur-md">
        {/* Progress Bar Header Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] sm:text-[12px] font-bold text-fg-default tracking-wide uppercase">
              100-Level Tactical Academy Pipeline
            </span>
          </div>
          <span className="font-mono text-[11px] text-fg-muted font-medium">
            4 Sequential Mastery Milestones · Stockfish 17 Engine
          </span>
        </div>

        {/* Interconnected Stepper Pipeline with Connecting Track Line */}
        <div className="relative">
          {/* Continuous Connector Line across nodes */}
          <div
            className="absolute top-5 left-6 right-6 h-0.5 bg-line/80 z-0 hidden md:block"
            aria-hidden="true"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 relative z-10">
            {ROADMAP_TRACKS.map((track) => {
              const isSelected = selectedTrack === track.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setSelectedTrack(track.id)}
                  className={`group relative flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-surface border-fg-muted/40 shadow-xs ring-1 ring-fg-muted/20"
                      : "bg-surface/50 border-line hover:border-fg-muted/30 hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    {/* Number Node with Pulsing Active Glow */}
                    <div
                      className={`flex size-7 sm:size-8 items-center justify-center rounded-full font-mono text-[11px] sm:text-[12px] font-bold border transition-all ${
                        isSelected
                          ? `${track.color.bg} ${track.color.border} ${track.color.text} shadow-sm`
                          : "bg-inset border-line text-fg-muted group-hover:text-fg-default"
                      }`}
                    >
                      {track.step}
                    </div>

                    {/* Progress percentage pill */}
                    <span className="font-mono text-[10px] font-semibold text-fg-muted">
                      {track.progressPercent}%
                    </span>
                  </div>

                  <span className="font-semibold text-fg-default text-[12px] sm:text-[13px] leading-tight">
                    {track.stageName}
                  </span>
                  <span className="font-mono text-[10px] sm:text-[11px] text-fg-muted mt-0.5">
                    {track.levels}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 2. THE 4 CONNECTED MASTERY ROADMAP CARDS (Balanced 4-Col Pipeline) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {ROADMAP_TRACKS.map((track) => {
          const isSelected = selectedTrack === track.id;
          return (
            <div
              key={track.id}
              onClick={() => setSelectedTrack(track.id)}
              className={`relative flex flex-col justify-between rounded-2xl border bg-surface p-5 sm:p-5.5 transition-all duration-300 cursor-pointer shadow-xs ${
                isSelected
                  ? "border-fg-muted/50 shadow-md ring-1 ring-fg-muted/25"
                  : "border-line hover:border-fg-muted/35 hover:shadow-sm"
              }`}
            >
              {/* BorderBeam subtle accent on selected or active card */}
              {isSelected && (
                <BorderBeam
                  size={240}
                  duration={12}
                  colorFrom={track.color.beamFrom}
                  colorTo={track.color.beamTo}
                />
              )}

              <div className="space-y-4 relative z-10">
                {/* ── CARD HEADER: Step Pill + Status Chip ── */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex size-6.5 items-center justify-center rounded-lg font-mono text-[11px] font-bold border ${track.color.bg} ${track.color.border} ${track.color.text}`}
                    >
                      {track.step}
                    </span>
                    <span className="font-mono text-[10.5px] font-bold text-fg-muted uppercase tracking-wider">
                      {track.levels}
                    </span>
                  </div>

                  {/* Eye-catching Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${track.color.badgeBg} ${track.color.badgeBorder} ${track.color.badgeText}`}
                  >
                    {track.statusType === "start" && (
                      <span className="size-1.5 rounded-full bg-blue-500 animate-ping" />
                    )}
                    {track.status}
                  </span>
                </div>

                {/* ── ICON + TITLE ON THE SAME LINE ── */}
                <div className="flex items-center gap-3 pt-1">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${track.color.bg} ${track.color.border} ${track.color.text} ${track.color.glow}`}
                  >
                    <Icon name={track.icon} size={20} />
                  </div>
                  <h3 className="text-[15px] sm:text-[16px] font-semibold text-fg-default leading-snug tracking-tight">
                    {track.title}
                  </h3>
                </div>

                {/* ── Authoritative Description ── */}
                <p className="text-[12.5px] sm:text-[13px] text-fg-muted leading-relaxed line-clamp-3">
                  {track.description}
                </p>

                {/* ── Key Concepts Checklist Chips ── */}
                <div className="pt-1">
                  <span className="block font-mono text-[10px] uppercase font-bold text-fg-muted/80 mb-2">
                    Core Repertoire:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {track.concepts.map((concept, cIdx) => (
                      <span
                        key={cIdx}
                        className="inline-flex items-center gap-1 rounded-md bg-inset/60 border border-line/60 px-2 py-0.5 font-mono text-[10px] text-fg-default"
                      >
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{concept}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── CARD FOOTER: Progress Metric & Action ── */}
              <div className="pt-4 mt-4 border-t border-line space-y-3 relative z-10">
                {/* Milestone Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-[10.5px] font-mono mb-1.5">
                    <span className="text-fg-muted">Milestone Depth</span>
                    <span className="font-semibold text-fg-default">
                      {track.lessonsCount} Lv · {track.drillsCount} Drills
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-inset overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${track.progressPercent}%`,
                        backgroundColor: track.color.primary,
                      }}
                    />
                  </div>
                </div>

                {/* Direct Action Link to Telegram Mini App */}
                <a
                  href={telegramLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full py-1.5 px-3 rounded-lg bg-inset hover:bg-line/40 transition-colors text-[11.5px] font-semibold text-fg-default group/link"
                >
                  <span>Practice Track {track.step}</span>
                  <span className="text-fg-muted group-hover/link:translate-x-0.5 transition-transform">
                    →
                  </span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. BOTTOM CURRICULUM SUMMARY HUD ── */}
      <div className="rounded-2xl border border-line bg-surface/60 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-line w-full md:w-auto">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] uppercase font-bold text-fg-muted">
              Total Levels
            </span>
            <div className="font-mono text-heading-xs font-bold text-fg-default">
              100 Levels
            </div>
          </div>
          <div className="space-y-0.5 sm:pl-6 pt-2 sm:pt-0">
            <span className="font-mono text-[10px] uppercase font-bold text-fg-muted">
              Puzzles & Drills
            </span>
            <div className="font-mono text-heading-xs font-bold text-emerald-600">
              275+ Tactical Drills
            </div>
          </div>
          <div className="space-y-0.5 sm:pl-6 pt-2 sm:pt-0">
            <span className="font-mono text-[10px] uppercase font-bold text-fg-muted">
              Neural Engine
            </span>
            <div className="font-mono text-heading-xs font-bold text-blue-600">
              Stockfish 17 (800–2800)
            </div>
          </div>
          <div className="space-y-0.5 sm:pl-6 pt-2 sm:pt-0">
            <span className="font-mono text-[10px] uppercase font-bold text-fg-muted">
              Entry Cost
            </span>
            <div className="font-mono text-heading-xs font-bold text-purple-600">
              100% Free Practice
            </div>
          </div>
        </div>

        {/* Telegram Direct Action CTA */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <a
            href={telegramLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-control bg-surface-inverse px-4 py-2.5 text-caption font-semibold text-fg-inverse shadow-xs transition-transform active:scale-[0.98] hover:opacity-90"
          >
            <span>Open Academy in Telegram</span>
            <Icon name="arrow-right" size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
