"use client";

import React, { createContext, useContext, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue, useReducedMotion } from "framer-motion";

interface DockContextValue {
  mouseX: MotionValue<number>;
  magnification: number;
  distance: number;
}

const DockContext = createContext<DockContextValue | null>(null);

export interface DockProps {
  className?: string;
  iconMagnification?: number;
  iconDistance?: number;
  children: React.ReactNode;
}

export function Dock({
  className = "",
  iconMagnification = 58,
  iconDistance = 120,
  children,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <DockContext.Provider
      value={{
        mouseX,
        magnification: iconMagnification,
        distance: iconDistance,
      }}
    >
      <motion.div
        ref={containerRef}
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={`site-dock max-w-full rounded-2xl border border-line bg-surface/85 shadow-sm backdrop-blur-md ${className}`}
        role="toolbar"
        aria-label="Application dock"
      >
        {children}
      </motion.div>
    </DockContext.Provider>
  );
}

export interface DockIconProps {
  className?: string;
  children: React.ReactNode;
  size?: number;
  onClick?: () => void;
  title?: string;
  "aria-label"?: string;
}

export function DockIcon({
  className = "",
  children,
  size = 44,
  onClick,
  title,
  "aria-label": ariaLabel,
}: DockIconProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const context = useContext(DockContext);

  const defaultMouseX = useMotionValue(Infinity);
  const mouseX = context?.mouseX ?? defaultMouseX;
  const magnification = context?.magnification ?? 58;
  const distance = context?.distance ?? 120;

  const distanceCalc = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [1, magnification / size, 1]
  );

  const scale = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size, scale: reduced ? 1 : scale }}
      onClick={onClick}
      onKeyDown={(event) => { if (onClick && ["Enter", " "].includes(event.key)) { event.preventDefault(); onClick(); } }}
      title={title}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel || title}
      className={`group relative flex items-center justify-center rounded-xl bg-inset border border-line transition-colors hover:border-fg-muted/50 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${className}`}
    >
      <div className="flex size-full items-center justify-center p-2">
        {children}
      </div>

      {title && (
        <span className="pointer-events-none absolute -top-8 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-caption font-semibold text-fg-default opacity-0 shadow-xs transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
          {title}
        </span>
      )}
    </motion.div>
  );
}
