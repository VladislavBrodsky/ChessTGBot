"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/icons";
import { telegramLink, WEBSITE_CAMPAIGNS } from "@/lib/config";
import { buttonClass } from "@/components/ui/button-styles";
import { MetaLine } from "@/components/ui/MetaLine";

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
    progressPercent: 100,
    lessonsCount: 25,
    drillsCount: 50,
    concepts: ["King Opposition", "Passed Pawns", "Lucena Bridge", "Philidor Draw"],
  },
];

export function AcademyRoadmap() {
  const [selectedTrack, setSelectedTrack] = useState<string>("foundations");

  return (
    <div className="roadmap">
      {/* ── 1. Milestone stepper: selects which track card is highlighted ── */}
      <div className="roadmap-stepper">
        <div className="roadmap-stepper-head">
          <strong>100-Level Tactical Academy Pipeline</strong>
          <MetaLine items="4 Sequential Mastery Milestones · Stockfish 17 Engine" />
        </div>
        <div className="roadmap-steps" role="group" aria-label="Academy milestones">
          {ROADMAP_TRACKS.map((track) => (
            <button
              key={track.id}
              type="button"
              className="roadmap-step"
              aria-pressed={selectedTrack === track.id}
              aria-controls={`roadmap-${track.id}`}
              onClick={() => setSelectedTrack(track.id)}
            >
              <span className="roadmap-step-top">
                <span className="roadmap-step-number">{track.step}</span>
                <span className="roadmap-step-percent">{track.progressPercent}%</span>
              </span>
              <strong>{track.stageName}</strong>
              <span>{track.levels}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Track cards ── */}
      <div className="roadmap-cards">
        {ROADMAP_TRACKS.map((track) => (
          <article
            key={track.id}
            id={`roadmap-${track.id}`}
            className="roadmap-card"
            data-selected={selectedTrack === track.id || undefined}
            aria-labelledby={`roadmap-${track.id}-title`}
          >
            <div className="roadmap-card-meta">
              <span className="roadmap-step-number">{track.step}</span>
              <span>{track.levels}</span>
              <span className="roadmap-card-status">{track.status}</span>
            </div>
            <div className="roadmap-card-title">
              <span className="roadmap-card-icon"><Icon name={track.icon} size={20} /></span>
              <h3 id={`roadmap-${track.id}-title`}>{track.title}</h3>
            </div>
            <p>{track.description}</p>
            <div>
              <span className="roadmap-label">Core Repertoire</span>
              <ul className="roadmap-concepts">
                {track.concepts.map((concept) => (
                  <li key={concept}><Icon name="check" size={12} />{concept}</li>
                ))}
              </ul>
            </div>
            <div className="roadmap-card-foot">
              <div className="roadmap-depth">
                <span>Milestone Depth</span>
                <strong>{track.lessonsCount} Lv · {track.drillsCount} Drills</strong>
              </div>
              <div className="roadmap-bar" role="presentation"><i style={{ width: `${track.progressPercent}%` }} /></div>
              <a href={telegramLink(WEBSITE_CAMPAIGNS.academy)} target="_blank" rel="noopener noreferrer" className="roadmap-link">
                <span>Practice Track {track.step}</span>
                <Icon name="arrow-right" size={16} />
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* ── 3. Curriculum summary ── */}
      <div className="roadmap-summary">
        <dl>
          <div><dt>Total Levels</dt><dd>100 Levels</dd></div>
          <div><dt>Puzzles &amp; Drills</dt><dd>275+ Tactical Drills</dd></div>
          <div><dt>Neural Engine</dt><dd>Stockfish 17 (800–2800)</dd></div>
          <div><dt>Entry Cost</dt><dd>100% Free Practice</dd></div>
        </dl>
        <a href={telegramLink(WEBSITE_CAMPAIGNS.academy)} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "", "md")}>
          <span>Open Academy in Telegram</span>
          <Icon name="arrow-right" size={16} />
        </a>
      </div>
    </div>
  );
}
