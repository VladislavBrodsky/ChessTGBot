"use client";

import React, { useState, useEffect } from "react";
import { telegramLink } from "@/lib/config";
import { trackPlayClick } from "@/lib/analytics";
import { TelegramIcon } from "./icons";
import { buttonClass } from "./ui/button-styles";

type Props = {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "onDark" | "ghost";
  startapp?: "arena";
  label?: string;
  className?: string;
  pulsating?: boolean;
  trackingLocation?: string;
};

interface Ripple {
  x: number;
  y: number;
  size: number;
  key: number;
}

export function PlayButton({
  size = "md",
  variant = "primary",
  startapp,
  label = "Play in Telegram",
  className = "",
  pulsating = false,
  trackingLocation = "play_button",
}: Props) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackPlayClick(trackingLocation, startapp);

    const rect = e.currentTarget.getBoundingClientRect();
    const rippleSize = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - rippleSize / 2;
    const y = e.clientY - rect.top - rippleSize / 2;

    const newRipple = { x, y, size: rippleSize, key: Date.now() };
    setRipples((prev) => [...prev, newRipple]);
  };

  useEffect(() => {
    if (ripples.length === 0) return;
    const lastRipple = ripples[ripples.length - 1];
    const timer = setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.key !== lastRipple.key));
    }, 600);
    return () => clearTimeout(timer);
  }, [ripples]);

  const rippleColor =
    variant === "ghost"
      ? "rgba(0, 0, 0, 0.12)"
      : "rgba(255, 255, 255, 0.4)";

  return (
    <a
      href={telegramLink(startapp)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      data-analytics-label={trackingLocation}
      data-track-cta="play_in_telegram"
      className={`relative overflow-hidden cursor-pointer ${buttonClass(variant === "ghost" ? "secondary" : "primary", className, size)}`}
    >
      <TelegramIcon className={size === "lg" ? "size-5" : "size-4"} />
      <span className="relative z-10 flex items-center gap-2">{label}</span>
      {pulsating && (
        <span
          className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] animate-[pulse-ring_2.4s_cubic-bezier(0.4,0,0.6,1)_infinite] bg-emerald-500/35"
          aria-hidden="true"
        />
      )}
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        {ripples.map((ripple) => (
          <span
            key={ripple.key}
            className="animate-rippling absolute rounded-full"
            style={
              {
                width: `${ripple.size}px`,
                height: `${ripple.size}px`,
                top: `${ripple.y}px`,
                left: `${ripple.x}px`,
                backgroundColor: rippleColor,
                transform: "scale(0)",
                "--duration": "600ms",
              } as React.CSSProperties
            }
          />
        ))}
      </span>
    </a>
  );
}
