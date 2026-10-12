"use client";

import React, { useState } from "react";
import { OrbitingCircles } from "@/components/magicui/orbiting-circles";

// ── 2D Chess Figure Vector Paths (Staunton-inspired Modern Vector Style) ──
function KingIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v4M10 4h4" />
      <path d="M6.5 8.5C8 9.5 9 10 12 10s4-.5 5.5-1.5c.8 3.5-1 6.5-1.5 8.5h-8C7.5 15 5.7 12 6.5 8.5z" fill="currentColor" fillOpacity="0.12" />
      <path d="M6 17h12M5 20h14" />
    </svg>
  );
}

function QueenIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="5" cy="6" r="1.2" fill="currentColor" />
      <circle cx="8.5" cy="4.5" r="1.2" fill="currentColor" />
      <circle cx="12" cy="4" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="4.5" r="1.2" fill="currentColor" />
      <circle cx="19" cy="6" r="1.2" fill="currentColor" />
      <path d="M5 8l2 9h10l2-9-3.5 2.5L12 6l-3.5 4.5L5 8z" fill="currentColor" fillOpacity="0.12" />
      <path d="M6 17h12M5 20h14" />
    </svg>
  );
}

function KnightIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 19c-.8-4.2-2.8-6.2-3.8-7.2.2-2.5-1-4.8-2.2-5.8-.8-.6-1.5-.2-1.8.2L9 8C7.5 9 6.2 10.8 6 13c-.3 2.5 1 4.5 2 5" fill="currentColor" fillOpacity="0.12" />
      <path d="M10 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" />
      <path d="M6 19h13M5 21h14" />
    </svg>
  );
}

function RookIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 4v3h2.5V4h3v3h1V4h3v3H18V4" />
      <path d="M7 7l1 10h8l1-10H7z" fill="currentColor" fillOpacity="0.12" />
      <path d="M6 17h12M5 20h14" />
    </svg>
  );
}

function BishopIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="3.5" r="1.2" fill="currentColor" />
      <path d="M12 5c-3 0-5 3.2-5 7 0 2.5 1.5 4.5 2.5 5h5c1-.5 2.5-2.5 2.5-5 0-3.8-2-7-5-7z" fill="currentColor" fillOpacity="0.12" />
      <path d="M10.5 9.5l3 3" />
      <path d="M6.5 17h11M5.5 20h13" />
    </svg>
  );
}

function PawnIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="6.5" r="2.8" fill="currentColor" fillOpacity="0.12" />
      <path d="M9.5 10.5c0 3-1.8 5.5-2 6.5h9c-.2-1-2-3.5-2-6.5h-5z" fill="currentColor" fillOpacity="0.12" />
      <path d="M9 11h6M7 17h10M6 20h12" />
    </svg>
  );
}

// ── Official Crypto & Platform Vector Logos ──
function TetherUsdtBadge({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect width="32" height="32" rx="16" fill="#26A17B" />
      <path d="M17.9 12.3v-2h6.1V7H8v3.3h6.1v2C7.9 12.6 3 13.9 3 15.5c0 1.6 4.9 2.9 11.1 3.2v7.3h3.8v-7.3c6.2-.3 11.1-1.6 11.1-3.2 0-1.6-4.9-2.9-11.1-3.2zm-1.9 4.6c-5 0-9.2-.8-10-1.9.8-1.1 5-1.9 10-1.9s9.2.8 10 1.9c-.8 1.1-5 1.9-10 1.9z" fill="white" />
    </svg>
  );
}

function TonBadge({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect width="32" height="32" rx="16" fill="#0098EA" />
      <path d="M16 6.5L7.5 11.5L16 25.5L24.5 11.5L16 6.5ZM14.8 8.8L16 8.1L17.2 8.8L21.5 11.3L16 12.7L10.5 11.3L14.8 8.8ZM9.8 12.8L15.3 14.2V22.4L9.8 12.8ZM16.7 22.4V14.2L22.2 12.8L16.7 22.4Z" fill="white" />
    </svg>
  );
}

function BitcoinBadge({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect width="32" height="32" rx="16" fill="#F7931A" />
      <path d="M22.5 13.6c.3-2.1-1.3-3.2-3.5-4l.7-2.9-1.8-.4-.7 2.8c-.5-.1-1-.2-1.5-.3l.7-2.9-1.8-.4-.7 2.9c-.4-.1-.8-.2-1.2-.3l-2.4-.6-.5 1.9s1.3.3 1.3.3c.7.2.8.7.8 1.1l-.8 3.2c.1 0 .1 0 .2.1l-.2-.1-1.1 4.5c-.1.2-.3.6-.8.4 0 0-1.3-.3-1.3-.3l-.9 2.1 2.3.6c.4.1.9.2 1.3.3l-.7 2.9 1.8.4.7-2.8c.5.1 1 .2 1.5.3l-.7 2.9 1.8.4.7-2.9c3.1.6 5.4.3 6.4-2.4.8-2.2 0-3.5-1.6-4.3 1.1-.3 2-1 2.2-2.4zm-4 5.3c-.6 2.3-4.4 1.1-5.6.8l1-4c1.2.3 5.2.9 4.6 3.2zm.5-5.4c-.5 2.1-3.7 1-4.7.8l.9-3.7c1 .2 4.3.7 3.8 2.9z" fill="white" />
    </svg>
  );
}

function EthereumBadge({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect width="32" height="32" rx="16" fill="#627EEA" />
      <path d="M16 6.5l-6.5 10.8L16 21.2l6.5-3.9L16 6.5zm0 15.8l-6.5-3.9L16 26.5l6.5-8.4-6.5 3.9z" fill="white" fillOpacity="0.95" />
      <path d="M16 6.5v10.3l6.5-3.9L16 6.5zm0 15.8v4.2l6.5-8.4-6.5 4.2z" fill="white" fillOpacity="0.65" />
    </svg>
  );
}

function TelegramBadge({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect width="32" height="32" rx="16" fill="#229ED9" />
      <path d="M22.8 10.2l-2.6 12.2c-.2.9-.7 1.1-1.5.7l-3.9-2.9-1.9 1.8c-.2.2-.4.4-.8.4l.3-4 7.2-6.5c.3-.3-.1-.5-.5-.2l-8.9 5.6-3.8-1.2c-.8-.3-.8-.8.2-1.2l14.9-5.7c.7-.3 1.3.2 1 1.2z" fill="white" />
    </svg>
  );
}

// ── Item Definitions ──
interface OrbitItem {
  id: string;
  name: string;
  tag: string;
  element: React.ReactNode;
}

const CHESS_PIECES: OrbitItem[] = [
  { id: "king", name: "King", tag: "Sovereign 95% Pot", element: <KingIcon className="size-5 text-amber-600" /> },
  { id: "queen", name: "Queen", tag: "Tactical Dominance", element: <QueenIcon className="size-5 text-purple-600" /> },
  { id: "knight", name: "Knight", tag: "Speed & Mobility", element: <KnightIcon className="size-5 text-blue-600" /> },
  { id: "rook", name: "Rook", tag: "Escrow Fortress", element: <RookIcon className="size-5 text-emerald-600" /> },
  { id: "bishop", name: "Bishop", tag: "Long-Range Vision", element: <BishopIcon className="size-5 text-rose-600" /> },
  { id: "pawn", name: "Pawn", tag: "Grandmaster Path", element: <PawnIcon className="size-5 text-slate-700" /> },
];

const CRYPTO_TOKENS: OrbitItem[] = [
  { id: "usdt", name: "USDT", tag: "Instant 1:1 Settlement", element: <TetherUsdtBadge className="size-7" /> },
  { id: "gram", name: "GRAM", tag: "Sub-Cent Gas Rails", element: <TonBadge className="size-7" /> },
  { id: "btc", name: "Bitcoin", tag: "Cross-Chain Liquidity", element: <BitcoinBadge className="size-7" /> },
  { id: "eth", name: "Ethereum", tag: "Multichain Bridge", element: <EthereumBadge className="size-7" /> },
  { id: "telegram", name: "Telegram", tag: "1-Tap Direct Launch", element: <TelegramBadge className="size-7" /> },
];

export function ChessEcosystemOrbit() {
  const [activeItem, setActiveItem] = useState<OrbitItem | null>(null);

  return (
    <div className="relative flex flex-col items-center justify-center w-full select-none py-2 group/orbit">
      {/* ── Soft Ethereal Glow (No heavy white box, melts seamlessly into page) ── */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-full bg-radial from-emerald-500/12 via-blue-500/6 to-transparent blur-3xl"
        aria-hidden="true"
      />

      {/* ── Active Inspection HUD Header (Safe from Orbit Paths, Zero Collisions) ── */}
      <div className="flex items-center justify-center mb-3 z-20 min-h-[38px] w-full">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-4 py-1.5 shadow-xs backdrop-blur-md transition-all duration-200">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          {activeItem ? (
            <span className="font-mono text-caption text-fg-default font-semibold flex items-center gap-1.5">
              <span>{activeItem.name}</span>
              <span className="text-fg-muted font-normal">·</span>
              <span className="text-emerald-600 font-medium">{activeItem.tag}</span>
            </span>
          ) : (
            <span className="font-mono text-caption text-fg-muted">
              Hover any piece or token to inspect live rails
            </span>
          )}
        </div>
      </div>

      {/* ── Concentric Orbit Stage ── */}
      <div className="relative flex h-[380px] sm:h-[420px] w-full items-center justify-center overflow-hidden">
        {/* ── Center Stage Core Hub ── */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {/* Subtle breathing pulse ring */}
          <div className="absolute -inset-3 rounded-full bg-emerald-500/12 animate-pulse pointer-events-none" />

          <div className="flex size-20 flex-col items-center justify-center rounded-2xl bg-surface border border-line shadow-xs backdrop-blur-md transition-transform duration-300 hover:scale-105">
            <KingIcon className="size-7 text-fg-default" />
            <span className="mt-1 font-mono text-[10px] font-bold tracking-widest text-emerald-600">
              ARENA
            </span>
          </div>
        </div>

        {/* ── Inner Orbit: 6 Chess Figures (Radius: 105px) ── */}
        <OrbitingCircles
          radius={105}
          duration={24}
          delay={0}
          iconSize={42}
          path={true}
          className="group-hover/orbit:[animation-play-state:paused] hover:[animation-play-state:paused]"
        >
          {CHESS_PIECES.map((piece) => (
            <div
              key={piece.id}
              onMouseEnter={() => setActiveItem(piece)}
              onMouseLeave={() => setActiveItem(null)}
              className="group/item relative flex size-10 items-center justify-center rounded-2xl bg-surface border border-line shadow-xs backdrop-blur-md transition-all duration-200 hover:scale-125 hover:shadow-md hover:border-emerald-500/40 cursor-pointer"
            >
              {piece.element}
            </div>
          ))}
        </OrbitingCircles>

        {/* ── Outer Orbit: 5 Crypto Assets (Radius: 168px, Reverse Direction) ── */}
        <OrbitingCircles
          radius={168}
          duration={32}
          delay={0}
          reverse={true}
          iconSize={46}
          path={true}
          className="group-hover/orbit:[animation-play-state:paused] hover:[animation-play-state:paused]"
        >
          {CRYPTO_TOKENS.map((token) => (
            <div
              key={token.id}
              onMouseEnter={() => setActiveItem(token)}
              onMouseLeave={() => setActiveItem(null)}
              className="group/item relative flex size-11 items-center justify-center rounded-2xl bg-surface border border-line shadow-xs backdrop-blur-md transition-all duration-200 hover:scale-125 hover:shadow-md hover:border-emerald-500/40 cursor-pointer"
            >
              {token.element}
            </div>
          ))}
        </OrbitingCircles>
      </div>

      {/* ── High-Value Trust Anchors (High-Contrast, Crisp Typography) ── */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-caption font-mono text-fg-muted">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-line px-3 py-1 shadow-xs">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          USDT Settlement
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-line px-3 py-1 shadow-xs">
          <span className="size-1.5 rounded-full bg-blue-500" />
          GRAM Blockchain
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-line px-3 py-1 shadow-xs">
          <span className="size-1.5 rounded-full bg-amber-500" />
          BTC &amp; ETH Bridge
        </span>
      </div>
    </div>
  );
}
