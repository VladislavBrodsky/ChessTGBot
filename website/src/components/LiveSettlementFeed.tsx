"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShowcaseMotionControl } from "./ui/ShowcaseMotionControl";
import { Icon } from "@/icons";
import { useShowcaseActivity } from "./home/useShowcaseActivity";
import {
  SETTLEMENT_VERSIONS,
  type SettlementItem,
} from "@/content/settlements-data";

export function LiveSettlementFeed() {
  // We maintain a shuffled sequence of all 200 items: 0 repetition across all 200 items!
  const deckRef = useRef<number[]>([]);
  const deckIndexRef = useRef<number>(0);
  const firstDeckRef = useRef(true); // Initial SSR records already consumed 0, 1, 2

  const getNextItem = (): SettlementItem => {
    if (
      deckRef.current.length === 0 ||
      deckIndexRef.current >= deckRef.current.length
    ) {
      const indices = Array.from(
        { length: SETTLEMENT_VERSIONS.length },
        (_, i) => i
      );
      // Complete the initial 200-record cycle without repeating its three SSR rows.
      if (firstDeckRef.current) {
        indices.splice(0, 3);
        firstDeckRef.current = false;
      }
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

  const [paused, setPaused] = useState(false);
  const { ref: containerRef, active: isVisible, reduced } = useShowcaseActivity();
  // Continuous, reliable live ticker (every 2.4s) — pauses when offscreen
  useEffect(() => {
    if (!isVisible || paused) return;
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
  }, [isVisible, paused]);

  return (
    <div ref={containerRef} className="settlement-feed">
      <div className="settlement-status">
        <div className="settlement-status-heading"><span className="settlement-status-title"><i aria-hidden="true" />Live Arena Settlement Feed</span><ShowcaseMotionControl name="settlement feed" paused={paused} onToggle={() => setPaused((value) => !value)} /></div>
        <div className="settlement-status-details"><span>200+ Live Matches</span><span>95% Net Victor Share</span></div>
      </div>
      <div className="settlement-list">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item, idx) => (
            <motion.div key={item.id} layout={reduced ? false : "position"} initial={reduced ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2 }} className="settlement-row" data-latest={idx === 0 || undefined}>
              <span className="settlement-icon"><Icon name={item.icon} size={16} /></span>
              <div className="settlement-player"><span>{item.flag} {item.player}</span><span>{item.action}</span></div>
              <div className="settlement-amount"><strong>{item.payout}</strong><span>{item.time}</span></div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
