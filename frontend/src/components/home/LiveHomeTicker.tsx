'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFire, FaGift, FaBolt, FaTrophy } from 'react-icons/fa';
import { telegramHaptic } from '@/lib/telegram';

interface ActivityEvent {
  id: string;
  type: 'box' | 'match' | 'streak' | 'jackpot';
  icon: React.ReactNode;
  text: string;
  badge?: string;
}

const EVENTS: ActivityEvent[] = [
  {
    id: '1',
    type: 'box',
    icon: <FaGift className="text-amber-400" size={13} />,
    text: 'Elena_R 🇩🇪 unlocked Mystery Box (50 TON drop!)',
    badge: 'Jackpot Drop',
  },
  {
    id: '2',
    type: 'match',
    icon: <FaBolt className="text-emerald-400" size={13} />,
    text: 'Alex_P 🇵🇱 won $19.00 in Blitz Arena',
    badge: '+18 ELO',
  },
  {
    id: '3',
    type: 'streak',
    icon: <FaFire className="text-rose-400" size={13} />,
    text: 'Marcus_GM 🇺🇸 reached a 7-match winning streak',
    badge: 'On Fire',
  },
  {
    id: '4',
    type: 'box',
    icon: <FaGift className="text-amber-400" size={13} />,
    text: 'Viktor_K 🇦🇲 claimed Mystery Box · Up to 1,000 TON',
    badge: '1,000 TON Max',
  },
  {
    id: '5',
    type: 'match',
    icon: <FaTrophy className="text-amber-300" size={13} />,
    text: 'Lucas_GM 🇧🇷 won $9.50 in Rapid Arena',
    badge: '+22 ELO',
  },
  {
    id: '6',
    type: 'jackpot',
    icon: <FaGift className="text-amber-400" size={13} />,
    text: 'DavidChess 🇬🇧 cracked Mystery Box (25 TON drop!)',
    badge: 'Mystery Drop',
  },
];

export function LiveHomeTicker({ onOpenQuickMatch }: { onOpenQuickMatch?: () => void }) {
  const [index, setIndex] = useState(0);

  // Deterministic 24-hour calculations based on current UTC day
  const stats24h = useMemo(() => {
    const now = new Date();
    const daySeed = now.getUTCFullYear() * 10000 + (now.getUTCMonth() + 1) * 100 + now.getUTCDate();
    const hour = now.getUTCHours();
    
    // Hash function
    let hash = daySeed;
    hash = ((hash >> 16) ^ hash) * 0x45d9f3b;
    hash = ((hash >> 16) ^ hash) * 0x45d9f3b;
    hash = (hash >> 16) ^ hash;
    const baseHash = Math.abs(hash);

    const boxesToday = 340 + (baseHash % 160) + Math.floor((hour * 7));
    const playersOnline = 1420 + (baseHash % 120) + Math.floor(Math.sin(hour / 3.8) * 110);
    const tonPaidToday = (1120 + (baseHash % 480) + hour * 18).toLocaleString();

    return { boxesToday, playersOnline, tonPaidToday };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % EVENTS.length);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  const current = EVENTS[index];

  const handleTap = () => {
    telegramHaptic('light');
    if (onOpenQuickMatch) {
      onOpenQuickMatch();
    } else {
      setIndex((prev) => (prev + 1) % EVENTS.length);
    }
  };

  return (
    <div
      onClick={handleTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleTap();
      }}
      className="group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-3 transition-colors hover:border-brand-border-opacity-30 active:scale-[0.99]"
      aria-label="Live platform activity"
    >
      {/* Top summary row: Live count + 24h boxes opened */}
      <div className="flex items-center justify-between pb-2 border-b border-brand-border/60 text-caption font-mono">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-semibold text-brand-primary">
            {stats24h.playersOnline.toLocaleString()} Grandmasters Online
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
          <FaGift size={11} className="text-amber-400" />
          <span>{stats24h.boxesToday} Boxes Today</span>
        </div>
      </div>

      {/* Rotating live activity item */}
      <div className="relative mt-2 min-h-[26px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0">{current.icon}</span>
              <span className="truncate text-caption font-medium text-brand-muted">
                {current.text}
              </span>
            </div>
            {current.badge && (
              <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-caption font-bold text-amber-300">
                {current.badge}
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
