"use client";

import React from "react";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export function BorderBeam({
  className = "",
  size = 240,
  duration = 14,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "#10b981",
  colorTo = "#f59e0b",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": `${size}px`,
          "--duration": `${duration}s`,
          "--anchor": `${anchor}%`,
          "--border-width": `${borderWidth}px`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
      className={`pointer-events-none absolute inset-0 rounded-[inherit] [border:var(--border-width)_solid_transparent] ![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] ${className}`}
    >
      <div
        className="absolute aspect-square [offset-anchor:calc(var(--anchor))_50%] [offset-path:rect(0_auto_auto_0_round_calc(var(--radius,16px)))] animate-[border-beam_var(--duration)_linear_infinite] [animation-delay:var(--delay)]"
        style={{
          width: "var(--size)",
          background: `linear-gradient(to left, var(--color-from), var(--color-to), transparent)`,
        }}
      />
    </div>
  );
}
