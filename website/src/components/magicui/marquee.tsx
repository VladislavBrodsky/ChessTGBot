"use client";

import React from "react";
import { useShowcaseActivity } from "../home/useShowcaseActivity";

interface MarqueeProps {
  children: React.ReactNode;
  pauseOnHover?: boolean;
  reverse?: boolean;
  repeat?: number;
  duration?: number;
  className?: string;
}

export function Marquee({
  children,
  pauseOnHover = true,
  reverse = false,
  repeat = 2,
  duration = 35,
  className = "",
}: MarqueeProps) {
  const { ref, active } = useShowcaseActivity();
  return (
    <div ref={ref}
      className={`group flex overflow-hidden p-2 select-none [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] ${className}`}
      style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          aria-hidden={i > 0}
          style={{ animationPlayState: active ? undefined : "paused" }}
          className={`flex shrink-0 items-center justify-around gap-4 sm:gap-6 animate-[marquee_var(--marquee-duration)_linear_infinite] ${
            reverse ? "[animation-direction:reverse]" : ""
          } ${pauseOnHover ? "group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]" : ""}`}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
