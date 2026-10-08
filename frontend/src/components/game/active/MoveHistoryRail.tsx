'use client';

import React from 'react';

export interface MoveHistoryRailProps {
  sanMoveHistory: { white: string; black?: string }[];
  moveHistoryRef: React.RefObject<HTMLDivElement | null>;
  title: string;
}

export function MoveHistoryRail({
  sanMoveHistory,
  moveHistoryRef,
  title,
}: MoveHistoryRailProps) {
  if (!sanMoveHistory || sanMoveHistory.length === 0) return null;

  return (
    <div className="w-full overflow-hidden px-1">
      <div className="flex items-center space-x-2 text-caption font-semibold normal-case text-brand-muted tracking-normal mb-1.5 pl-1 w-full text-left">
        <span>{title}</span>
      </div>
      <div
        ref={moveHistoryRef}
        className="w-full overflow-x-auto flex items-center gap-1.5 pb-2 scrollbar-none scroll-smooth"
      >
        {sanMoveHistory.map((movePair, idx) => (
          <div
            key={idx}
            className="shrink-0 flex items-center gap-1 bg-brand-surface border border-brand-border-opacity-10 rounded-lg px-2.5 py-1.5 shadow-sm text-caption font-bold text-brand-primary"
          >
            <span className="opacity-45">{idx + 1}.</span>
            <span>{movePair.white}</span>
            {movePair.black && (
              <>
                <span className="opacity-25">•</span>
                <span>{movePair.black}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
