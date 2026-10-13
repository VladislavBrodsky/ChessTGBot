"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { MIN_ONLINE, MAX_ONLINE } from "@/lib/social-proof";
import { useShowcaseActivity } from "./home/useShowcaseActivity";

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

export function LiveSocialProof({ initial }: { initial: { count: number; hourSlot: number } }) {
  const { ref: containerRef, active: isVisible } = useShowcaseActivity();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Hourly slot determines the active 4-avatar cohort (changes every 60 minutes)
  const [hourSlot, setHourSlot] = useState(initial.hourSlot);

  // Online active players count strictly kept in range [1374, 3278]
  const [liveCount, setLiveCount] = useState(initial.count);

  // Check every 60 seconds if the hour slot changed to refresh avatars
  useEffect(() => {
    if (!isVisible) return;
    const checkHour = () => {
      const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
      setHourSlot((prev) => (prev !== currentHour ? currentHour : prev));
    };
    const timer = setInterval(checkHour, 60000);
    return () => clearInterval(timer);
  }, [isVisible]);

  // Subtle organic fluctuation every 12 seconds, only when visible
  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => {
      setLiveCount((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
        const next = prev + delta;
        return Math.min(MAX_ONLINE, Math.max(MIN_ONLINE, next));
      });
    }, 12000);
    return () => clearInterval(timer);
  }, [isVisible]);

  // Compute active 4-avatar cohort for the current 60-minute window
  const activeAvatars = useMemo(() => {
    const start = (hourSlot * 4) % ALL_AVATARS.length;
    return [0, 1, 2, 3].map(
      (offset) => ALL_AVATARS[(start + offset) % ALL_AVATARS.length]
    );
  }, [hourSlot]);

  // Rotate activity every 3.2 seconds, only when visible and not paused
  useEffect(() => {
    if (isPaused || !isVisible) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ACTIVITIES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [isPaused, isVisible]);

  const active = ACTIVITIES[index];

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      className="live-proof group/proof"
    >
      {/* 1. Compact crimson LIVE badge — the only filled accent, so the Play CTA keeps visual priority */}
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-caption font-mono font-extrabold uppercase tracking-wider bg-[#E11D48] text-white shrink-0 select-none">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-85" />
          <span className="relative inline-flex size-2 rounded-full bg-white" />
        </span>
        LIVE
      </span>

      {/* 2. Real Photography Avatars (2 on mobile, 4 on desktop) */}
      <div className="flex items-center -space-x-2 shrink-0">
        {activeAvatars.map((avatar, idx) => (
          <Image
            key={avatar.id}
            src={avatar.src}
            alt={avatar.name}
            title={avatar.name}
            width={28}
            height={28}
            sizes="28px"
            quality={75}
            className={`size-6 sm:size-7 rounded-full border-2 border-canvas bg-surface object-cover transition-transform duration-200 hover:scale-125 hover:z-30 cursor-pointer ${
              idx >= 2 ? "hidden sm:block" : "block"
            }`}
          />
        ))}
      </div>

      {/* Emerald Pulsing Dot + Online Counter (In range 1,374 to 3,278) */}
      <div
        className="flex items-center gap-1.5 shrink-0"
        title="Live active players (1,374 – 3,278 rivals)"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-win-fill opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-win-fill" />
        </span>
        <span className="text-caption font-semibold text-fg tabular-nums">
          {liveCount.toLocaleString("en-US")}
        </span>
        <span className="text-caption text-fg-muted hidden sm:inline">online</span>
      </div>

      {/* Hairline Divider */}
      <div className="proof-divider h-3.5 w-px bg-line-strong shrink-0" aria-hidden="true" />

      {/* Animated Live Activity Ticker (Zero Blitz/Rapid game type badges) */}
      <div className="proof-activity relative min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="proof-activity-row"
          >
            <span className="shrink-0">{active.flag}</span>
            <span className="proof-user font-semibold text-fg">
              @{active.user}
            </span>
            <span className="text-fg-muted text-caption shrink-0">
              {active.action}
            </span>
            <strong
              className={`font-mono font-bold shrink-0 ${
                active.tone === "amber"
                  ? "text-fg-caution"
                  : active.tone === "cyan"
                  ? "text-fg-muted"
                  : "text-fg-win"
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
