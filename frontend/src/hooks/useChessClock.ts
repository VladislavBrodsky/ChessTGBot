'use client';

import { useEffect, useState, useRef } from "react";

export function useChessClock(
  gameState: any,
  isWhite: boolean,
  onClockWarning: (timeLeft: number) => void
) {
  const [whiteTime, setWhiteTime] = useState<number>(() => gameState?.white_time_left ?? 600);
  const [blackTime, setBlackTime] = useState<number>(() => gameState?.black_time_left ?? 600);

  // Sync clocks when server updates state
  useEffect(() => {
    if (gameState) {
      setWhiteTime(gameState.white_time_left ?? 600);
      setBlackTime(gameState.black_time_left ?? 600);
    }
  }, [gameState]);

  const turnRef = useRef(gameState?.turn);
  const isGameOverRef = useRef(gameState?.is_game_over);

  useEffect(() => {
    turnRef.current = gameState?.turn;
    isGameOverRef.current = gameState?.is_game_over;
  }, [gameState]);

  useEffect(() => {
    if (!gameState || gameState.is_game_over) return;

    const interval = setInterval(() => {
      if (isGameOverRef.current) return;
      
      const activeColor = turnRef.current;
      if (activeColor === 'w') {
        setWhiteTime((prev) => {
          const next = Math.max(0, prev - 0.25);
          if (isWhite) {
            onClockWarning(next);
          }
          return next;
        });
      } else {
        setBlackTime((prev) => {
          const next = Math.max(0, prev - 0.25);
          if (!isWhite) {
            onClockWarning(next);
          }
          return next;
        });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [gameState, isWhite, onClockWarning]);

  return {
    whiteTime,
    blackTime,
    setWhiteTime,
    setBlackTime
  };
}
