"use client";

import React from "react";

interface PulsatingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pulseColor?: string;
  duration?: string;
}

export function PulsatingButton({
  children,
  className = "",
  pulseColor = "rgba(16, 185, 129, 0.45)",
  duration = "2s",
  ...props
}: PulsatingButtonProps) {
  return (
    <button
      {...props}
      style={{ "--pulse-duration": duration } as React.CSSProperties}
      className={`relative inline-flex items-center justify-center rounded-control font-semibold transition-transform duration-100 active:scale-[0.98] ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      {/* Outer pulsating radiating aura */}
      <span
        style={{
          backgroundColor: pulseColor,
          animationDuration: "var(--pulse-duration)",
        }}
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] animate-[pulse-ring_var(--pulse-duration)_cubic-bezier(0.4,0,0.6,1)_infinite]"
        aria-hidden="true"
      />
    </button>
  );
}
