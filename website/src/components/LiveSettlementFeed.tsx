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
  // We maintain a shuffled sequence of all 200 items: 0 repetition across all 200 items!
  const deckRef = useRef<number[]>([]);
  const deckIndexRef = useRef<number>(3); // Indices 0, 1, 2 are initially shown

  const getNextItem = (): SettlementItem => {
    if (
      deckRef.current.length === 0 ||
      deckIndexRef.current >= deckRef.current.length
    ) {
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

  // Exactly 3 initial items for deterministic SSR
  const [items, setItems] = useState<SettlementItem[]>(() => [
    { ...SETTLEMENT_VERSIONS[0], id: "init-1", time: "14s ago" },
    { ...SETTLEMENT_VERSIONS[1], id: "init-2", time: "38s ago" },
    { ...SETTLEMENT_VERSIONS[2], id: "init-3", time: "1m ago" },
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Pause background execution when scrolled out of view to save battery and memory
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "150px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Continuous, reliable live ticker (every 2.4s) — pauses when offscreen
  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => {
      const next = getNextItem();
      const uniqueId = `live-${next.id}-${Date.now()}`;
      const newItem: SettlementItem = {
        ...next,
        id: uniqueId,
        time: "Just now",
      };

      setItems((prev) => {
        const updatedFirst = { ...prev[0], time: "12s ago" };
        const updatedSecond = prev[1] ? { ...prev[1], time: "38s ago" } : null;
        return updatedSecond
          ? [newItem, updatedFirst, updatedSecond]
          : [newItem, updatedFirst];
      });
    }, 2400);

    return () => clearInterval(timer);
  }, [isVisible]);

  return (
    <div ref={containerRef} className="relative h-full w-full flex flex-col justify-between">
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

      {/* Live Settlement Items Container */}
      <div className="relative flex-1 overflow-hidden flex flex-col justify-start pt-2">
        <div className="space-y-1.5">
          <AnimatePresence initial={false}>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.96, y: -14, height: 0 }}
                animate={{ opacity: 1, scale: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, scale: 0.96, y: 10, height: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 360,
                  damping: 34,
                  mass: 0.8,
                }}
                className="overflow-hidden"
              >
                <div
                  className={`flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-2xs transition-colors hover:border-fg-muted/40 ${
                    idx === 0 ? "ring-1 ring-emerald-500/35 shadow-xs" : ""
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
                    <span className="text-[10px] text-fg-muted">
                      {item.time}
                    </span>
                    <span className="font-bold text-emerald-600 text-[13px]">
                      {item.payout}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Magic UI Progressive Blur UI Component at the bottom edge */}
        <ProgressiveBlur
          position="bottom"
          height="16px"
          blurLevels={[0.5, 1, 2, 4]}
          className="pointer-events-none"
        />
      </div>
    </div>
  );
}
