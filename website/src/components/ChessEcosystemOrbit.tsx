"use client";

import React, { useState } from "react";
import { Card } from "./ui/Card";
import { ShowcaseMotionControl } from "./ui/ShowcaseMotionControl";
import { useShowcaseActivity } from "./home/useShowcaseActivity";
import { OrbitingCircles } from "@/components/magicui/orbiting-circles";
import { BishopIcon, KingIcon, KnightIcon, PawnIcon, QueenIcon, RookIcon } from "./ChessPieceIcon";

// ── Official Crypto & Platform Vector Logos ──
function TetherUsdtBadge({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect width="32" height="32" rx="16" fill="#26A17B" />
      <path d="M17.9 12.3v-2h6.1V7H8v3.3h6.1v2C7.9 12.6 3 13.9 3 15.5c0 1.6 4.9 2.9 11.1 3.2v7.3h3.8v-7.3c6.2-.3 11.1-1.6 11.1-3.2 0-1.6-4.9-2.9-11.1-3.2zm-1.9 4.6c-5 0-9.2-.8-10-1.9.8-1.1 5-1.9 10-1.9s9.2.8 10 1.9c-.8 1.1-5 1.9-10 1.9z" fill="white" />
    </svg>
  );
}

function GramBadge({ className = "size-6" }: { className?: string }) {
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
  { id: "king", name: "King", tag: "Sovereign 95% Pot", element: <KingIcon className="size-6 text-fg" /> },
  { id: "queen", name: "Queen", tag: "Tactical Dominance", element: <QueenIcon className="size-6 text-fg" /> },
  { id: "knight", name: "Knight", tag: "Speed & Mobility", element: <KnightIcon className="size-6 text-fg" /> },
  { id: "rook", name: "Rook", tag: "Escrow Fortress", element: <RookIcon className="size-6 text-fg" /> },
  { id: "bishop", name: "Bishop", tag: "Long-Range Vision", element: <BishopIcon className="size-6 text-fg" /> },
  { id: "pawn", name: "Pawn", tag: "Grandmaster Path", element: <PawnIcon className="size-6 text-fg" /> },
];

const CRYPTO_TOKENS: OrbitItem[] = [
  { id: "usdt", name: "USDT", tag: "Instant 1:1 Settlement", element: <TetherUsdtBadge className="size-7" /> },
  { id: "gram", name: "GRAM", tag: "Sub-Cent Gas Rails", element: <GramBadge className="size-7" /> },
  { id: "btc", name: "Bitcoin", tag: "Cross-Chain Liquidity", element: <BitcoinBadge className="size-7" /> },
  { id: "eth", name: "Ethereum", tag: "Multichain Bridge", element: <EthereumBadge className="size-7" /> },
  { id: "telegram", name: "Telegram", tag: "1-Tap Direct Launch", element: <TelegramBadge className="size-7" /> },
];

export function ChessEcosystemOrbit() {
  const [selected, setSelected] = useState<OrbitItem | null>(null);
  const [hovered, setHovered] = useState<OrbitItem | null>(null);
  const [paused, setPaused] = useState(false);
  const { ref, active } = useShowcaseActivity();
  const outerRadius = "calc(50cqw - 28px)";
  const innerRadius = "calc((50cqw - 28px) * 0.60)";
  const activeItem = hovered ?? selected;
  const motionPaused = !active || paused || hovered !== null;
  const inspectButton = (item: OrbitItem, labelled = false) => (
    <button type="button" key={item.id} className={labelled ? "ecosystem-piece-button" : "ecosystem-node"}
      aria-label={item.name + " · " + item.tag} aria-pressed={selected?.id === item.id}
      onClick={() => setSelected((value) => value?.id === item.id ? null : item)}
      onFocus={() => setHovered(item)} onBlur={() => setHovered(null)}
      onMouseEnter={() => setHovered(item)} onMouseLeave={() => setHovered(null)}>
      {item.element}{labelled && <span>{item.name}</span>}
    </button>
  );
  return (
    <Card className="ecosystem-showcase showcase-panel" data-interactive-workspace>
      <div className="showcase-panel-heading"><span>Arena ecosystem</span><ShowcaseMotionControl name="ecosystem" paused={paused} onToggle={() => setPaused((value) => !value)} /></div>
      <div ref={ref} className="ecosystem-orbit" data-active={active && !paused && !hovered}>
        <div className="ecosystem-orbit-stage">
          <div className="ecosystem-core"><KingIcon className="size-7" /><span>ARENA</span></div>
          <div className="ecosystem-chess-ring"><OrbitingCircles paused={motionPaused} radius={innerRadius} duration={32} delay={0} iconSize={44}>{CHESS_PIECES.map((item) => inspectButton(item))}</OrbitingCircles></div>
          <OrbitingCircles paused={motionPaused} radius={outerRadius} duration={44} delay={0} reverse iconSize={44}>{CRYPTO_TOKENS.map((item) => inspectButton(item))}</OrbitingCircles>
        </div>
        <div className="ecosystem-piece-grid">{CHESS_PIECES.map((item) => inspectButton(item, true))}</div>
      </div>
      <div className="ecosystem-inspector" aria-live="polite" aria-atomic="true">{activeItem ? <><strong>{activeItem.name}</strong><span>{activeItem.tag}</span></> : <span>Hover or tap any piece or token to inspect live rails</span>}</div>
      <div className="showcase-panel-footer">USDT Settlement · GRAM Blockchain · BTC &amp; ETH Bridge</div>
    </Card>
  );
}
