'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
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
  botLabel?: string;
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
  botLabel,
  gameState,
  onClockWarning,
}: GamePlayerCardProps) {
  if (isMe) {
    return (
      <Card
        variant="glass"
        className={`w-full flex justify-between items-center px-4 py-4 transition-all duration-300 ${
          isTurn
            ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-gradient-to-r from-emerald-500/[0.02] to-transparent opacity-100'
            : 'border-brand-border-opacity-10'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-primary flex items-center justify-center shadow-sm overflow-hidden">
            <PlayerAvatar
              userId={userId}
              fallbackText="YOU"
              textClassName="text-xs font-black text-brand-void uppercase tracking-tighter"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-tight">
              {username}
            </span>
            {isTurn ? (
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                {turnLabel}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </span>
            ) : (
              <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">
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
      </Card>
    );
  }

  // Opponent card
  return (
    <Card
      variant="glass"
      className={`w-full flex justify-between items-center px-4 py-4 transition-all duration-300 ${
        isTurn
          ? 'border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-gradient-to-r from-purple-500/[0.02] to-transparent opacity-100'
          : 'border-brand-border-opacity-10 opacity-60'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-brand-void border border-brand-border-opacity-10 flex items-center justify-center overflow-hidden">
          <PlayerAvatar
            userId={userId}
            fallbackText="?"
            isBot={isBot}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-brand-primary uppercase tracking-tight">
            {username}
          </span>
          {isTurn ? (
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1 animate-pulse">
              {turnLabel}
              <span className="inline-flex gap-0.5 ml-0.5">
                <span className="w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </span>
          ) : (
            <span className="text-[10px] font-medium text-brand-muted uppercase tracking-[0.2em]">
              {isBot ? botLabel : eloText}
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
    </Card>
  );
}
