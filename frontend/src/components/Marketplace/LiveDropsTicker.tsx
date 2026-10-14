'use client';

import React from 'react';
import { BOX_CONFIG, type BoxTier } from './boxConfig';

export interface DropEvent {
  id: string;
  user: string;
  prizeName: string;
  tier: BoxTier;
  timeAgo: string;
  isUser?: boolean;
}

const SEED_DROPS: DropEvent[] = [
  { id: 'd-1', user: 'Grandmaster_Alex', prizeName: '1-Year VIP Access', tier: 'legendary', timeAgo: '2m ago' },
  { id: 'd-2', user: 'Elena_Knight', prizeName: '1-Month VIP Access', tier: 'epic', timeAgo: '4m ago' },
  { id: 'd-3', user: 'TON_Strategist', prizeName: '5,000 XP Jackpot', tier: 'legendary', timeAgo: '7m ago' },
  { id: 'd-4', user: 'CheckmatePro', prizeName: 'Season Multiplier 2×', tier: 'seasonal', timeAgo: '11m ago' },
  { id: 'd-5', user: 'ChessWarrior', prizeName: 'Gold Profile Border', tier: 'epic', timeAgo: '15m ago' },
  { id: 'd-6', user: 'Tactician_Max', prizeName: '1-Week VIP Access', tier: 'rare', timeAgo: '18m ago' },
];

interface LiveDropsTickerProps {
  userDrops?: Array<{
    name: string;
    type: string;
    tier: BoxTier;
    at: number;
  }>;
}

export default function LiveDropsTicker({ userDrops = [] }: LiveDropsTickerProps) {
  // Combine real user drops with seed drops
  const formattedUserDrops: DropEvent[] = userDrops.map((d) => ({
    id: `user-${d.at}`,
    user: 'You',
    prizeName: d.name,
    tier: d.tier,
    timeAgo: 'Just now',
    isUser: true,
  }));

  const allDrops = [...formattedUserDrops, ...SEED_DROPS].slice(0, 8);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-caption font-bold tracking-normal uppercase text-brand-primary">Live Drops</span>
        </div>
        <span className="text-caption text-brand-muted font-medium">Realtime Unboxings</span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth items-center">
        {allDrops.map((drop) => {
          const cfg = BOX_CONFIG[drop.tier];
          const { accent, rgb } = cfg.theme;
          return (
            <div
              key={drop.id}
              className={`shrink-0 px-3 py-2 rounded-xl border flex items-center gap-2.5 transition-all ${
                drop.isUser
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                  : 'bg-brand-surface border-brand-border-opacity-10'
              }`}
            >
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center text-caption font-serif shrink-0 border"
                style={{
                  color: `color-mix(in srgb, ${accent} 40%, var(--text-primary))`,
                  background: `rgba(${rgb},0.12)`,
                  borderColor: `rgba(${rgb},0.3)`,
                }}
              >
                {cfg.glyph}
              </span>

              <div className="flex flex-col text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-caption font-bold truncate max-w-[110px] ${
                      drop.isUser ? 'text-amber-400' : 'text-brand-primary'
                    }`}
                  >
                    {drop.user}
                  </span>
                  <span className="text-caption text-brand-muted">{drop.timeAgo}</span>
                </div>
                <span className="text-caption font-medium text-brand-muted truncate max-w-[140px]">
                  {drop.prizeName}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
