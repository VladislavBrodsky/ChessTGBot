"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/icons";
import { useShowcaseActivity } from "./home/useShowcaseActivity";
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

  const { ref: containerRef, active: isVisible } = useShowcaseActivity();
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
    <div ref={containerRef} className="settlement-feed relative w-full">
      <div className="settlement-status font-mono text-caption border-b border-line pb-3">
        <span className="flex items-center gap-2 font-semibold">
          <span className="size-2 shrink-0 rounded-full bg-win-fill" aria-hidden="true" />
          Live Arena Settlement Feed
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-fg-muted">200+ Live Matches</span>
          <span className="rounded-full border border-line px-2 py-1 font-semibold">95% Net Victor Share</span>
        </div>
      </div>
      <div className="relative mt-3 space-y-2">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item, idx) => (
            <motion.div key={item.id} layout="position"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className={`settlement-row rounded-xl border bg-surface ${idx === 0 ? "border-fg" : "border-line"}`}>
              <div className="settlement-player flex items-start gap-2.5 min-w-0">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg border ${item.color}`}>
                  <Icon name={item.icon} size={16} />
                </span>
                <div className="min-w-0 text-caption">
                  <span className="block font-semibold">{item.flag} {item.player}</span>
                  <span className="block text-fg-muted">{item.action}</span>
                </div>
              </div>
              <div className="settlement-amount font-mono">
                <span className="text-caption text-fg-muted">{item.time}</span>
                <strong className="text-body tabular-nums whitespace-nowrap">{item.payout}</strong>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
