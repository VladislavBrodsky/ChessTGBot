"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Marketing Online Users Range [1374, 3278] ──────────────────────────────
const MIN_ONLINE = 1374;
const MAX_ONLINE = 3278;

function getInitialOnlineUsers(): number {
  const now = new Date();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  // Realistic diurnal wave (peaks around 18:00 UTC, trough around 05:00 UTC)
  const timeVal = (hour * 60 + minute) / (24 * 60);
  const wave = (Math.sin((timeVal - 0.28) * 2 * Math.PI) + 1) / 2; // 0 to 1
  const span = MAX_ONLINE - MIN_ONLINE; // 1904
  const base = MIN_ONLINE + Math.floor(wave * (span - 140));
  const jitter = ((now.getDate() * 19 + minute * 13) % 71) - 35;
  return Math.min(MAX_ONLINE, Math.max(MIN_ONLINE, base + jitter));
}

// ── 24 Real, Modern, Diverse Photography Avatars ────────────────────────────
// Rotates in 4-player cohorts every 60 minutes based on real-time clock.
const ALL_AVATARS = [
  { id: "1", src: "/avatars/avatar-01.jpg", name: "Anna S. · GM (2540)", flag: "🇳🇴" },
  { id: "2", src: "/avatars/avatar-02.jpg", name: "Vlad K. · IM (2410)", flag: "🇺🇿" },
  { id: "3", src: "/avatars/avatar-03.jpg", name: "Elena R. · WGM (2380)", flag: "🇷🇴" },
  { id: "4", src: "/avatars/avatar-04.jpg", name: "Marcus N. · IM (2420)", flag: "🇸🇪" },
  { id: "5", src: "/avatars/avatar-05.jpg", name: "David M. · FM (2380)", flag: "🇬🇧" },
  { id: "6", src: "/avatars/avatar-06.jpg", name: "Sofia T. · WIM (2290)", flag: "🇪🇸" },
  { id: "7", src: "/avatars/avatar-07.jpg", name: "Alex B. · IM (2450)", flag: "🇺🇸" },
  { id: "8", src: "/avatars/avatar-08.jpg", name: "Tariq A. · FM (2340)", flag: "🇦🇪" },
  { id: "9", src: "/avatars/avatar-09.jpg", name: "Yuki M. · WFM (2290)", flag: "🇯🇵" },
  { id: "10", src: "/avatars/avatar-10.jpg", name: "Lucas D. · FM (2310)", flag: "🇫🇷" },
  { id: "11", src: "/avatars/avatar-11.jpg", name: "Mateo R. · IM (2430)", flag: "🇦🇷" },
  { id: "12", src: "/avatars/avatar-12.jpg", name: "Clara H. · WIM (2240)", flag: "🇩🇪" },
  { id: "13", src: "/avatars/avatar-13.jpg", name: "Chloe V. · WGM (2370)", flag: "🇨🇦" },
  { id: "14", src: "/avatars/avatar-14.jpg", name: "Dmitry P. · GM (2580)", flag: "🇰🇿" },
  { id: "15", src: "/avatars/avatar-15.jpg", name: "Jan K. · FM (2370)", flag: "🇵🇱" },
  { id: "16", src: "/avatars/avatar-16.jpg", name: "Maya S. · WIM (2280)", flag: "🇮🇳" },
  { id: "17", src: "/avatars/avatar-17.jpg", name: "Liam O. · FM (2330)", flag: "🇮🇪" },
  { id: "18", src: "/avatars/avatar-18.jpg", name: "Lin Z. · WIM (2260)", flag: "🇸🇬" },
  { id: "19", src: "/avatars/avatar-19.jpg", name: "Greta N. · WFM (2210)", flag: "🇨🇭" },
  { id: "20", src: "/avatars/avatar-20.jpg", name: "Arman V. · IM (2400)", flag: "🇦🇲" },
  { id: "21", src: "/avatars/avatar-21.jpg", name: "Nadia F. · WFM (2260)", flag: "🇧🇷" },
  { id: "22", src: "/avatars/avatar-22.jpg", name: "Kenji T. · IM (2415)", flag: "🇯🇵" },
  { id: "23", src: "/avatars/avatar-23.jpg", name: "Sarah B. · FM (2320)", flag: "🇦🇺" },
  { id: "24", src: "/avatars/avatar-24.jpg", name: "Omar H. · GM (2560)", flag: "🇪🇬" },
];

// ── Real Live PvP Win & Payout Activities (Zero Game Type Badges) ───────────
const ACTIVITIES = [
  {
    flag: "🇳🇴",
    user: "magnus_gram",
    action: "won",
    amount: "+$190.00 USDT",
    tone: "emerald",
  },
  {
    flag: "🇦🇪",
    user: "CryptoMorphy",
    action: "won",
    amount: "+$47.50 USDT",
    tone: "emerald",
  },
  {
    flag: "🇯🇵",
    user: "kenji_chess",
    action: "unboxed",
    amount: "50 GRAM Vault",
    tone: "amber",
  },
  {
    flag: "🇺🇿",
    user: "gm_vlad",
    action: "cashed out",
    amount: "95.00 USDT",
    tone: "cyan",
  },
  {
    flag: "🇺🇸",
    user: "alex_chess",
    action: "won",
    amount: "+$380.00 USDT",
    tone: "emerald",
  },
  {
    flag: "🇩🇪",
    user: "anna_tactics",
    action: "won",
    amount: "+$95.00 USDT",
    tone: "emerald",
  },
  {
    flag: "🇬🇧",
    user: "david_gm",
    action: "won",
    amount: "+$190.00 USDT",
    tone: "emerald",
  },
  {
    flag: "🇸🇪",
    user: "marcus_v",
    action: "unlocked",
    amount: "100 GRAM Jackpot",
    tone: "amber",
  },
  {
    flag: "🇫🇷",
    user: "lucas_mate",
    action: "withdrew",
    amount: "250.00 USDT",
    tone: "cyan",
  },
  {
    flag: "🇪🇸",
    user: "sofia_chess",
    action: "won",
    amount: "+$47.50 USDT",
    tone: "emerald",
  },
];

export function LiveSocialProof() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Hourly slot determines the active 4-avatar cohort (changes every 60 minutes)
  const [hourSlot, setHourSlot] = useState(() => Math.floor(Date.now() / (1000 * 60 * 60)));

  // Online active players count strictly kept in range [1374, 3278]
  const [liveCount, setLiveCount] = useState<number>(getInitialOnlineUsers);

  // Check every 60 seconds if the hour slot changed to refresh avatars
  useEffect(() => {
    const checkHour = () => {
      const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
      setHourSlot((prev) => (prev !== currentHour ? currentHour : prev));
    };
    const timer = setInterval(checkHour, 60000);
    return () => clearInterval(timer);
  }, []);

  // Subtle organic fluctuation every 12 seconds, clamped strictly to [1374, 3278]
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveCount((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
        const next = prev + delta;
        return Math.min(MAX_ONLINE, Math.max(MIN_ONLINE, next));
      });
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  // Compute active 4-avatar cohort for the current 60-minute window
  const activeAvatars = useMemo(() => {
    const start = (hourSlot * 4) % ALL_AVATARS.length;
    return [0, 1, 2, 3].map(
      (offset) => ALL_AVATARS[(start + offset) % ALL_AVATARS.length]
    );
  }, [hourSlot]);

  // Rotate activity every 3.2 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ACTIVITIES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [isPaused]);

  const active = ACTIVITIES[index];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="group/proof relative inline-flex items-center gap-2 sm:gap-2.5 rounded-full bg-[#0C0D0F]/95 text-white border border-white/[0.12] py-1.5 px-2.5 sm:px-3.5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_12px_35px_-5px_rgba(16,185,129,0.2)] max-w-full overflow-hidden"
    >
      {/* 1. Eye-Catching Solid Crimson LIVE Badge (Placed BEFORE avatars) */}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-mono font-extrabold uppercase tracking-wider bg-[#E11D48] text-white shadow-[0_0_14px_rgba(225,29,72,0.6)] shrink-0 select-none">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-85" />
          <span className="relative inline-flex size-2 rounded-full bg-white" />
        </span>
        LIVE
      </span>

      {/* 2. 4 Real Photography Avatars (Changes every 60 minutes) */}
      <div className="flex items-center -space-x-2 shrink-0">
        {activeAvatars.map((avatar) => (
          <img
            key={avatar.id}
            src={avatar.src}
            alt={avatar.name}
            title={avatar.name}
            width={28}
            height={28}
            className="size-6 sm:size-7 rounded-full border-2 border-[#0C0D0F] bg-[#1A1B1E] object-cover shadow-sm transition-transform duration-200 hover:scale-125 hover:z-30 cursor-pointer"
          />
        ))}
      </div>

      {/* Acid Green Pulsing Dot + Online Counter (In range 1,374 to 3,278) */}
      <div
        className="flex items-center gap-1.5 shrink-0"
        title="Live active players (1,374 – 3,278 rivals)"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00FF66] opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-[#00FF66]" />
        </span>
        <span className="text-[12px] sm:text-[13px] font-semibold text-white tabular-nums">
          {liveCount.toLocaleString()}
        </span>
        <span className="text-[11px] text-white/50 hidden xs:inline">online</span>
      </div>

      {/* Hairline Glass Divider */}
      <div className="h-3.5 w-px bg-white/20 shrink-0" />

      {/* Animated Live Activity Ticker (Zero Blitz/Rapid game type badges) */}
      <div className="relative h-5 flex items-center overflow-hidden min-w-0 pr-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex items-center gap-1.5 text-[12px] sm:text-[13px] whitespace-nowrap min-w-0"
          >
            <span className="shrink-0">{active.flag}</span>
            <span className="font-semibold text-white truncate max-w-[110px] sm:max-w-none">
              @{active.user}
            </span>
            <span className="text-white/60 text-[11px] sm:text-[12px]">
              {active.action}
            </span>
            <strong
              className={`font-mono font-bold ${
                active.tone === "amber"
                  ? "text-amber-400"
                  : active.tone === "cyan"
                  ? "text-cyan-400"
                  : "text-emerald-400"
              }`}
            >
              {active.amount}
            </strong>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
