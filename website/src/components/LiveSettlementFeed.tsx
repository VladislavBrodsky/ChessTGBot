"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/icons";
import { ProgressiveBlur } from "@/components/magicui/progressive-blur";
import {
  SETTLEMENT_VERSIONS,
  type SettlementItem,
} from "@/content/settlements-data";

export function LiveSettlementFeed() {
  // We cycle through all 200 items without repeating until all 200 have been shown.
  // Using a Fisher-Yates shuffled deck of indices ensures 0 repetition across all 200 items.
  const deckRef = useRef<number[]>([]);
  const deckIndexRef = useRef<number>(3); // Indices 0, 1, 2 are initially shown
  const [isPaused, setIsPaused] = useState(false);

  // Initialize and get the next item from the non-repeating deck
  const getNextItem = (): SettlementItem => {
    if (
      deckRef.current.length === 0 ||
      deckIndexRef.current >= deckRef.current.length
    ) {
      // Build array of 0..199
      const indices = Array.from(
        { length: SETTLEMENT_VERSIONS.length },
        (_, i) => i
      );
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      deckRef.current = indices;
      deckIndexRef.current = 0;
    }
    const nextIdx = deckRef.current[deckIndexRef.current];
    deckIndexRef.current += 1;
    return SETTLEMENT_VERSIONS[nextIdx];
  };

  // Start with first 3 items from SETTLEMENT_VERSIONS for deterministic SSR render
  const [items, setItems] = useState<SettlementItem[]>(() => [
    { ...SETTLEMENT_VERSIONS[0], time: "14s ago" },
    { ...SETTLEMENT_VERSIONS[1], time: "38s ago" },
    { ...SETTLEMENT_VERSIONS[2], time: "1m ago" },
  ]);

  const [latestId, setLatestId] = useState<string | null>(null);

  useEffect(() => {
    if (isPaused) return;

    // Organic timing between 2.4s and 3.4s to feel like a live busy global arena
    const randomDelay = Math.floor(Math.random() * 800) + 2600;

    const timeout = setTimeout(() => {
      const next = getNextItem();
      // Generate a unique instance ID so keys never collide even across multiple deck cycles
      const uniqueId = `${next.id}-${Date.now()}`;
      const newItem: SettlementItem = {
        ...next,
        id: uniqueId,
        time: "Just now",
      };

      setLatestId(uniqueId);
      setItems((prev) => {
        // Keep up to 3-4 items, updating relative timestamps smoothly
        const updated = prev.slice(0, 3).map((item, index) => {
          let updatedTime = item.time;
          if (index === 0) updatedTime = "12s ago";
          else if (index === 1) updatedTime = "35s ago";
          else updatedTime = "1m ago";
          return { ...item, time: updatedTime };
        });
        return [newItem, ...updated];
      });
    }, randomDelay);

    return () => clearTimeout(timeout);
  }, [items, isPaused]);

  return (
    <div
      className="relative h-full w-full flex flex-col justify-between"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Terminal status bar */}
      <div className="flex items-center justify-between pb-2 border-b border-line/60 font-mono text-[11px] shrink-0">
        <span className="flex items-center gap-1.5 text-fg-default font-semibold">
          <span className="relative flex size-2 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </span>
          Live Arena Settlement Feed
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-fg-muted font-normal hidden sm:inline">
            200+ Live Matches
          </span>
          <span className="text-emerald-700 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
            95% Net Victor Share
          </span>
        </div>
      </div>

      {/* Live Settlement Items Container with Progressive Blur */}
      <div className="relative flex-1 overflow-hidden my-auto pt-1.5 min-h-[140px]">
        <div className="space-y-1.5">
          <AnimatePresence initial={false} mode="popLayout">
            {items.slice(0, 3).map((item) => {
              const isNew = item.id === latestId;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -22, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 32,
                    mass: 0.8,
                  }}
                  className={`flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/90 px-3 py-2 shadow-2xs transition-all hover:border-fg-muted/40 ${
                    isNew
                      ? "ring-1 ring-emerald-500/40 bg-surface/95"
                      : "hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex size-6.5 shrink-0 items-center justify-center rounded-lg border ${item.color}`}
                    >
                      <Icon name={item.icon} size={13} />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-semibold text-fg-default text-[12px] truncate">
                        {item.flag} {item.player} ·{" "}
                        <span className="font-normal text-fg-muted">
                          {item.action}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2 font-mono">
                    <span className="text-[10px] text-fg-muted">{item.time}</span>
                    <span className="font-bold text-emerald-600 text-[13px]">
                      {item.payout}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Magic UI Progressive Blur UI Component */}
        <ProgressiveBlur
          position="bottom"
          height="35%"
          blurLevels={[0.5, 1, 2, 4, 8, 16]}
          className="pointer-events-none"
        />
      </div>
    </div>
  );
}
