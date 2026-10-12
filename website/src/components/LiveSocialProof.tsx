"use client";

import React, { useState, useEffect } from "react";
import { AvatarCircles } from "@/components/magicui/avatar-circles";

const AVATARS = [
  { imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80", name: "Grandmaster Anna" },
  { imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80", name: "Blitz King Dave" },
  { imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80", name: "Tactics Pro Sarah" },
  { imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80", name: "Pawn Hunter Leo" },
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
      badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      dotColor: "bg-emerald-500",
      text: (
        <>
          <strong className="font-semibold text-fg-default">{liveCount.toLocaleString()}</strong> playing right now
        </>
      ),
    },
    {
      badge: "MYSTERY BOXES",
      badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      dotColor: "bg-amber-500",
      text: (
        <>
          <strong className="font-semibold text-fg-default">{boxesOpened}</strong> boxes unlocked today · <span className="text-amber-500 font-semibold">1,000 TON Drop</span>
        </>
      ),
    },
    {
      badge: "24H POTS",
      badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      dotColor: "bg-blue-500",
      text: (
        <>
          <strong className="font-semibold text-fg-default">${potSettled.toLocaleString()}</strong> won in last 24h
        </>
      ),
    },
    {
      badge: "RECENT MATCH",
      badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
      dotColor: "bg-purple-500",
      text: (
        <>
          <span className="font-semibold text-fg-default">@marcus_v</span> won <strong className="text-emerald-600 dark:text-emerald-400 font-bold">$19.00</strong> pot in 3m Blitz
        </>
      ),
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % signals.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [signals.length]);

  const active = signals[index];

  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      <AvatarCircles avatarUrls={AVATARS} numPeople={3840 + (liveCount % 120)} size="sm" />
      
      <div className="flex items-center gap-2 text-caption font-medium text-fg-muted min-h-[28px] transition-all duration-300">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${active.badgeColor}`}>
          <span className={`size-1.5 rounded-full ${active.dotColor} animate-ping`} />
          {active.badge}
        </span>
        <span className="truncate">{active.text}</span>
      </div>
    </div>
  );
}
