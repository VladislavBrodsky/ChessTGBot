"use client";

import React from "react";

interface OrbitingCirclesProps {
  className?: string;
  children?: React.ReactNode;
  reverse?: boolean;
  paused?: boolean;
  duration?: number;
  delay?: number;
  radius?: number | string;
  path?: boolean;
  iconSize?: number;
}

export function OrbitingCircles({
  className = "",
  children,
  reverse = false,
  paused = false,
  duration = 20,
  delay = 10,
  radius = 120,
  path = true,
  iconSize = 32,
}: OrbitingCirclesProps) {
  const items = React.Children.toArray(children);
  const count = items.length;

  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            className="stroke-line stroke-1"
            cx="50%"
            cy="50%"
            r={typeof radius === "number" ? radius : undefined}
            style={typeof radius === "string" ? { r: radius } : undefined}
            fill="none"
            strokeDasharray="4 4"
          />
        </svg>
      )}

      {items.map((item, index) => {
        const angle = count > 1 ? (360 / count) * index : 0;
        return (
          <div
            key={index}
            data-ring={typeof radius === "number" ? (radius >= 100 ? "outer" : "inner") : "responsive"}
            style={
              {
                "--radius": typeof radius === "number" ? radius : undefined,
                "--orbit-distance": typeof radius === "number" ? `${radius}px` : radius,
                "--duration": `${duration}s`,
                "--angle": angle,
                "--icon-size": `${iconSize}px`,
                // Inline state outranks the utility animation shorthand.
                animationPlayState: paused ? "paused" : "running",
                animationDelay: `-${(delay / Math.max(1, count)) * index}s`,
              } as React.CSSProperties
            }
            className={`orbit-item absolute flex size-[var(--icon-size)] items-center justify-center rounded-full animate-[orbit_var(--duration)_linear_infinite] ${
              reverse ? "[animation-direction:reverse]" : ""
            } ${className}`}
          >
            {item}
          </div>
        );
      })}
    </>
  );
}
