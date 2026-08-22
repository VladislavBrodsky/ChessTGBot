'use client';

import React, { useEffect, useState, useRef } from 'react';

interface ChessClockBadgeProps {
  gameState: any;
  color: 'w' | 'b';
  isWhite?: boolean;
  onClockWarning?: (timeLeft: number) => void;
  isMe?: boolean;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function ChessClockBadge({
  gameState,
  color,
  isWhite: _isWhite,
  onClockWarning,
  isMe = false,
}: ChessClockBadgeProps) {
  const initialTime = color === 'w' ? (gameState?.white_time_left ?? 600) : (gameState?.black_time_left ?? 600);
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);

  // Resync when server updates clock
  useEffect(() => {
    if (gameState) {
      const serverTime = color === 'w' ? (gameState.white_time_left ?? 600) : (gameState.black_time_left ?? 600);
      setTimeLeft(serverTime);
    }
  }, [gameState?.white_time_left, gameState?.black_time_left, color]);

  const turnRef = useRef(gameState?.turn);
  const isGameOverRef = useRef(gameState?.is_game_over || gameState?.status === 'completed' || gameState?.status === 'aborted');

  useEffect(() => {
    turnRef.current = gameState?.turn;
    isGameOverRef.current = gameState?.is_game_over || gameState?.status === 'completed' || gameState?.status === 'aborted';
  }, [gameState?.turn, gameState?.is_game_over, gameState?.status]);

  useEffect(() => {
    if (!gameState || gameState.is_game_over || gameState.status === 'completed' || gameState.status === 'aborted') {
      return;
    }

    const interval = setInterval(() => {
      if (isGameOverRef.current) return;
      if (turnRef.current === color) {
        setTimeLeft((prev) => {
          const next = Math.max(0, prev - 0.25);
          if (isMe && onClockWarning) {
            onClockWarning(next);
          }
          return next;
        });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [gameState?.id, gameState?.status, gameState?.is_game_over, color, isMe, onClockWarning]);

  const isLowTime = timeLeft < 5;
  const isWarningTime = timeLeft < 15;

  return (
    <div
      className={`px-3.5 py-1.5 min-w-[75px] text-center rounded-xl border transition-all duration-300 ${
        isLowTime
          ? 'bg-rose-500/20 border-rose-500/40 text-rose-500 animate-pulse'
          : isWarningTime
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
          : isMe
          ? 'bg-brand-void/40 border-brand-border text-brand-primary'
          : 'bg-brand-void/40 border-brand-border text-brand-muted opacity-85'
      }`}
    >
      <span className="text-sm font-black tracking-tighter font-mono">
        {formatTime(timeLeft)}
      </span>
    </div>
  );
}

export default React.memo(ChessClockBadge);
