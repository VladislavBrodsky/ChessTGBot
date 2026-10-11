"use client";

import React, { useState } from "react";

interface RipplePoint {
  x: number;
  y: number;
  size: number;
  key: number;
}

interface RippleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rippleColor?: string;
  duration?: number;
}

export function RippleButton({
  children,
  className = "",
  rippleColor = "rgba(255, 255, 255, 0.35)",
  duration = 600,
  onClick,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<RipplePoint[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple: RipplePoint = { x, y, size, key: Date.now() };
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.key !== newRipple.key));
    }, duration);

    if (onClick) onClick(e);
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-control font-semibold transition-transform duration-100 active:scale-[0.98] ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        {ripples.map((ripple) => (
          <span
            key={ripple.key}
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: rippleColor,
              animationDuration: `${duration}ms`,
            }}
            className="absolute rounded-full animate-[ping_600ms_cubic-bezier(0,0,0.2,1)_forwards]"
          />
        ))}
      </span>
    </button>
  );
}
