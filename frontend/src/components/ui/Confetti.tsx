"use client";

import type { ReactNode } from "react";
import React, {
  createContext,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from "canvas-confetti";
import confetti from "canvas-confetti";

export type ConfettiRef = {
  fire: (options?: ConfettiOptions) => Promise<void> | void;
};

export interface ConfettiProps extends React.ComponentPropsWithRef<"canvas"> {
  options?: ConfettiOptions;
  globalOptions?: ConfettiGlobalOptions;
  manualstart?: boolean;
  children?: ReactNode;
}

const ConfettiContext = createContext<ConfettiRef | null>(null);

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>((props, ref) => {
  const {
    options,
    globalOptions = { resize: true, useWorker: true },
    manualstart = false,
    children,
    className,
    ...rest
  } = props;

  const canvasNodeRef = useRef<HTMLCanvasElement | null>(null);
  const instanceRef = useRef<ConfettiInstance | null>(null);
  const optionsRef = useRef(options);
  const globalOptionsRef = useRef(globalOptions);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    globalOptionsRef.current = globalOptions;
  }, [globalOptions]);

  useEffect(() => {
    if (canvasNodeRef.current && !instanceRef.current) {
      instanceRef.current = confetti.create(canvasNodeRef.current, {
        resize: true,
        useWorker: true,
        ...globalOptionsRef.current,
      });
    }

    return () => {
      instanceRef.current?.reset();
      instanceRef.current = null;
    };
  }, []);

  const fire = useCallback(async (opts: ConfettiOptions = {}) => {
    try {
      await instanceRef.current?.({
        ...optionsRef.current,
        ...opts,
      });
    } catch (error) {
      console.error("Confetti error:", error);
    }
  }, []);

  const api = useMemo<ConfettiRef>(() => ({ fire }), [fire]);

  useImperativeHandle(ref, () => api, [api]);

  useEffect(() => {
    if (!manualstart) {
      void fire();
    }
  }, [manualstart, fire]);

  return (
    <ConfettiContext.Provider value={api}>
      <canvas ref={canvasNodeRef} className={className} {...rest} />
      {children}
    </ConfettiContext.Provider>
  );
});

Confetti.displayName = "Confetti";

/**
 * Fires an imperative confetti burst from anywhere in the app without needing a custom canvas ref.
 * Uses high-contrast gold, emerald, cyan, and purple particles matching the Obsidian Design System.
 */
export async function triggerConfettiBurst(opts?: ConfettiOptions) {
  if (typeof window === "undefined" || process.env.NODE_ENV === "test") return;

  // Respect user preference for reduced motion
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (prefersReduced) return;

  const defaults: ConfettiOptions = {
    particleCount: 65,
    spread: 60,
    origin: { y: 0.65 },
    colors: ["#22c55e", "#3b82f6", "#eab308", "#a855f7", "#ec4899", "#ffffff"],
    disableForReducedMotion: true,
    zIndex: 9999,
  };

  try {
    await confetti({
      ...defaults,
      ...opts,
    });
  } catch (error) {
    console.error("Confetti burst error:", error);
  }
}

export const fireGlobalConfetti = triggerConfettiBurst;
