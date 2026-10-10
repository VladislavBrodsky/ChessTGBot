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

  const serverTime = color === 'w' ? gameState?.white_time_left : gameState?.black_time_left;
  const isGameOver = Boolean(!gameState || gameState.is_game_over || gameState.status === 'completed' || gameState.status === 'aborted');
  const gameId = gameState?.id;

  // Resync when server updates clock
  useEffect(() => {
    if (typeof serverTime === 'number') {
      setTimeLeft(serverTime);
    }
  }, [serverTime]);

  const turnRef = useRef(gameState?.turn);
  const isGameOverRef = useRef(isGameOver);

  useEffect(() => {
    turnRef.current = gameState?.turn;
    isGameOverRef.current = isGameOver;
  }, [gameState?.turn, isGameOver]);

  useEffect(() => {
    if (isGameOver) {
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
  }, [gameId, isGameOver, color, isMe, onClockWarning]);

  const isLowTime = timeLeft < 5;
  const isWarningTime = timeLeft < 15;
  const running = !isGameOver && gameState?.turn === color;

  return (
    <div
      role="timer"
      aria-label={`${color === 'w' ? 'White' : 'Black'} clock`}
      className={`px-3.5 py-2 min-w-[84px] text-center rounded-2xl border transition-colors duration-300 ${
        isLowTime
          ? 'border-[color-mix(in_srgb,#ef4444_55%,transparent)] bg-brand-rose-opacity-10 text-brand-danger animate-pulse'
          : isWarningTime
          ? 'border-[color-mix(in_srgb,var(--text-gold)_45%,transparent)] bg-brand-amber-opacity-10 text-brand-gold'
          : running
          ? 'border-[color-mix(in_srgb,var(--action-bg)_50%,transparent)] bg-brand-emerald-opacity-10 text-brand-primary shadow-[0_0_18px_-4px_var(--action-bg)]'
          : 'border-brand-border bg-brand-elevated text-brand-muted'
      }`}
    >
      <span className="text-lg font-bold tracking-tight tabular-nums">
        {formatTime(timeLeft)}
      </span>
    </div>
  );
}

export default React.memo(ChessClockBadge);
