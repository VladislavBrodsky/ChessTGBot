"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AVATARS = [
  { imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80", name: "Anna S. · WGM" },
  { imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80", name: "Vlad K. · 2410" },
  { imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80", name: "Elena R. · 2180" },
  { imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&auto=format&fit=crop&q=80", name: "Marcus N. · 2340" },
];

export function LiveSocialProof() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [liveCount] = useState(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const hour = now.getUTCHours();
    return 3820 + ((dayOfYear * 7 + hour * 13) % 180);
  });

  const [potSettled] = useState(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const hour = now.getUTCHours();
    return 8900 + ((dayOfYear * 19 + hour * 37) % 2200);
  });

  const signals = [
    {
      badge: "BLITZ",
      badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
      content: (
        <>
          🇦🇪 <span className="font-semibold text-fg-default">@CryptoMorphy</span> won <strong className="text-emerald-600 font-bold font-mono">+$47.50</strong>
        </>
      ),
    },
    {
      badge: "MYSTERY",
      badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
      content: (
        <>
          🇯🇵 <span className="font-semibold text-fg-default">@kenji_chess</span> unboxed <strong className="text-amber-600 font-bold font-mono">50 TON</strong>
        </>
      ),
    },
    {
      badge: "RAPID",
      badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
      content: (
        <>
          🇳🇴 <span className="font-semibold text-fg-default">@magnus_ton</span> won <strong className="text-emerald-600 font-bold font-mono">+$190.00</strong>
        </>
      ),
    },
    {
      badge: "PAYOUT",
      badgeColor: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/25",
      content: (
        <>
          🇺🇿 <span className="font-semibold text-fg-default">@gm_vlad</span> cashed out <strong className="text-cyan-700 dark:text-cyan-400 font-bold font-mono">95 USDT</strong>
        </>
      ),
    },
    {
      badge: "TODAY",
      badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/25",
      content: (
        <>
          <strong className="text-fg-default font-bold font-mono">${potSettled.toLocaleString()}</strong> won by players
        </>
      ),
    },
  ];

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % signals.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [isPaused, signals.length]);

  const active = signals[index];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/90 py-1.5 px-2.5 sm:px-3 shadow-2xs backdrop-blur-md transition-all hover:border-fg-muted/40 max-w-full"
    >
      {/* 4 Clean Avatars */}
      <div className="flex items-center -space-x-2 shrink-0">
        {AVATARS.map((avatar, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={avatar.imageUrl}
            alt={avatar.name}
            width={26}
            height={26}
            className="size-6.5 rounded-full border-2 border-surface bg-surface object-cover shadow-2xs"
          />
        ))}
      </div>

      {/* Live Active Counter */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[12px] font-semibold text-fg-default tabular-nums">
          {liveCount.toLocaleString()}
        </span>
        <span className="text-[11px] text-fg-muted hidden xs:inline">online</span>
      </div>

      {/* Hairline Divider */}
      <div className="h-3.5 w-px bg-line/80 shrink-0" />

      {/* Animated Live Activity Ticker */}
      <div className="relative h-5 flex items-center overflow-hidden min-w-0 pr-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -7 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex items-center gap-1.5 text-[12px] whitespace-nowrap min-w-0"
          >
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-tight border shrink-0 ${active.badgeColor}`}
            >
              {active.badge}
            </span>
            <span className="text-body-xs text-fg-default font-medium truncate">
              {active.content}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
