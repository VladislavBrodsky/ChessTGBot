"use client";

import React, { useState, useEffect } from "react";
import { AvatarCircles } from "@/components/magicui/avatar-circles";

const AVATARS = [
  { imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80", name: "Anna S. (@anna_chess · WGM)" },
  { imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80", name: "Vlad K. (@gm_vlad · 2410)" },
  { imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80", name: "Elena R. (@elena_tactics · 2180)" },
  { imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80", name: "Marcus N. (@magnus_ton · 2340)" },
  { imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80", name: "Kenji S. (@kenji_chess · 2150)" },
  { imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80", name: "Sophie D. (@sophie_blitz · 2095)" },
];

export function LiveSocialProof() {
  const [index, setIndex] = useState(0);
  const [liveCount] = useState(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const hour = now.getUTCHours();
    return 1420 + ((dayOfYear * 7 + hour * 13) % 240);
  });
  const [boxesOpened] = useState(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const hour = now.getUTCHours();
    return 340 + ((dayOfYear * 11 + hour * 5) % 180);
  });
  const [potSettled] = useState(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const hour = now.getUTCHours();
    return 8600 + ((dayOfYear * 19 + hour * 37) % 2400);
  });

  const signals = [
    {
      badge: "LIVE NOW",
      badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      dotColor: "bg-emerald-500",
      text: (
        <>
          <strong className="font-semibold text-fg-default">{liveCount.toLocaleString()}</strong> in duels · <span className="font-mono text-emerald-700 font-semibold">&lt; 2.4s</span> queue
        </>
      ),
    },
    {
      badge: "RECENT POT",
      badgeColor: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
      dotColor: "bg-purple-500",
      text: (
        <>
          🇦🇪 <span className="font-semibold text-fg-default">@CryptoMorphy</span> won <strong className="text-emerald-700 dark:text-emerald-400 font-bold">+$47.50</strong> in 3+2 Blitz
        </>
      ),
    },
    {
      badge: "VAULT DROP",
      badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      dotColor: "bg-amber-500",
      text: (
        <>
          🇯🇵 <span className="font-semibold text-fg-default">@kenji_chess</span> unboxed <strong className="text-amber-600 font-bold">50 TON</strong> King’s Chest · <span className="font-mono text-fg-muted text-[11px]">{boxesOpened} opened</span>
        </>
      ),
    },
    {
      badge: "SETTLEMENT",
      badgeColor: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
      dotColor: "bg-blue-500",
      text: (
        <>
          🇳🇴 <span className="font-semibold text-fg-default">@magnus_ton</span> won <strong className="text-emerald-700 dark:text-emerald-400 font-bold">+$190.00</strong> Rapid on-chain
        </>
      ),
    },
    {
      badge: "24H POTS",
      badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      dotColor: "bg-emerald-500",
      text: (
        <>
          <strong className="font-semibold text-fg-default">${potSettled.toLocaleString()}</strong> won by players in last 24h
        </>
      ),
    },
    {
      badge: "CASHOUT",
      badgeColor: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30",
      dotColor: "bg-cyan-500",
      text: (
        <>
          🇺🇿 <span className="font-semibold text-fg-default">@gm_vlad</span> withdrew <strong className="text-emerald-700 dark:text-emerald-400 font-bold">95 USDT</strong> via TON (3.8s)
        </>
      ),
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % signals.length);
    }, 3600);
    return () => clearInterval(timer);
  }, [signals.length]);

  const active = signals[index];

  return (
    <div className="inline-flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 rounded-2xl border border-line bg-surface/85 p-2 sm:pr-4 shadow-2xs backdrop-blur-md transition-all hover:border-fg-muted/30">
      {/* Real Players Avatar Stack */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <AvatarCircles avatarUrls={AVATARS} numPeople={3840 + (liveCount % 120)} size="sm" />
          <span
            className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-surface animate-pulse"
            title="3,840+ rated players online"
          />
        </div>
        <div className="hidden lg:flex flex-col text-left pl-0.5">
          <span className="text-[11px] font-semibold text-fg-default leading-tight">3,840+ rated</span>
          <span className="text-[10px] text-fg-muted font-mono leading-tight">competing live</span>
        </div>
      </div>

      {/* Subtle separator */}
      <div className="hidden sm:block h-6 w-px bg-line/80 shrink-0" />

      {/* Real-time Live Signal Ticker */}
      <div className="flex items-center gap-2 text-caption font-medium text-fg-muted min-h-[28px] transition-all duration-300 min-w-0">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${active.badgeColor}`}>
          <span className={`size-1.5 rounded-full ${active.dotColor} animate-ping`} />
          {active.badge}
        </span>
        <span className="text-body-xs text-fg-default/90 truncate">{active.text}</span>
      </div>

      {/* Mini carousel indicators */}
      <div className="hidden md:flex items-center gap-1 pl-1 shrink-0 ml-auto opacity-50">
        {signals.map((_, i) => (
          <span
            key={i}
            className={`size-1 rounded-full transition-all duration-300 ${
              i === index ? "w-2.5 bg-emerald-600 opacity-100" : "bg-fg-muted/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

