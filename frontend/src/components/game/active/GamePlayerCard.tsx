'use client';

import React from 'react';
import ChessClockBadge from '@/components/game/ChessClockBadge';
import { PlayerAvatar } from './PlayerAvatar';

export interface GamePlayerCardProps {
  isMe?: boolean;
  userId?: number | null;
  username: string;
  eloText: string;
  isTurn: boolean;
  turnLabel: string;
  isWhite: boolean;
  isBot?: boolean;
  gameState: any;
  onClockWarning: (timeLeft: number) => void;
}

export function GamePlayerCard({
  isMe = false,
  userId,
  username,
  eloText,
  isTurn,
  turnLabel,
  isWhite,
  isBot = false,
  gameState,
  onClockWarning,
}: GamePlayerCardProps) {
  if (isMe) {
    return (
      <div className={`ui-list-row w-full min-h-[76px] ${isTurn ? 'ui-stat--accent' : ''}`} aria-current={isTurn ? 'true' : undefined}>
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="ui-avatar-ring shrink-0">
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden bg-brand-elevated">
              <PlayerAvatar
                userId={userId}
                fallbackText={username.slice(0, 2).toUpperCase()}
                textClassName="text-sm font-bold text-brand-primary"
              />
            </span>
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] font-bold text-brand-primary">
              {username}
            </span>
            {isTurn ? (
              <span className="flex items-center gap-1.5 text-caption font-semibold text-brand-success">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-action animate-pulse" aria-hidden="true" />
                {turnLabel}
              </span>
            ) : (
              <span className="text-caption font-medium text-brand-muted tabular-nums">
                {eloText}
              </span>
            )}
          </div>
        </div>
        <ChessClockBadge
          gameState={gameState}
          color={isWhite ? 'w' : 'b'}
          isWhite={isWhite}
          onClockWarning={onClockWarning}
          isMe
        />
      </div>
    );
  }

  // Opponent card
  return (
    <div className={`ui-list-row w-full min-h-[76px] ${isTurn ? 'ui-stat--premium' : ''}`} aria-current={isTurn ? 'true' : undefined}>
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="ui-icon-tile h-12 w-12 shrink-0 overflow-hidden rounded-2xl">
          <PlayerAvatar
            userId={userId}
            fallbackText={username ? username.slice(0, 2).toUpperCase() : 'GM'}
            isBot={isBot}
          />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-bold text-brand-primary">
            {username}
          </span>
          {isTurn ? (
            <span className="flex items-center gap-1.5 text-caption font-semibold" style={{ color: 'var(--badge-purple-ink)' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" aria-hidden="true" />
              {turnLabel}
            </span>
          ) : (
            <span className="text-caption font-medium text-brand-muted tabular-nums">
              {eloText}
            </span>
          )}
        </div>
      </div>
      <ChessClockBadge
        gameState={gameState}
        color={isWhite ? 'b' : 'w'}
        isWhite={isWhite}
        onClockWarning={onClockWarning}
      />
    </div>
  );
}
