"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Event-driven motion: no WebGL, idle loop, or React renders on pointer move. */
export function SculptureMotion({ children }: { children: ReactNode }) {
  const scene = useRef<HTMLDivElement>(null);
  const object = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const surface = scene.current;
    const sculpture = object.current;
    if (!surface || !sculpture) return;

    const preference = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    let visible = true;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      surface.dataset.tracking = "false";
      sculpture.style.removeProperty("transform");
    };
    const move = (event: PointerEvent) => {
      if (
        !preference.matches ||
        !visible ||
        document.hidden ||
        event.pointerType !== "mouse"
      )
        return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const bounds = surface.getBoundingClientRect();
        const x = Math.max(
          -1,
          Math.min(1, ((pointerX - bounds.left) / bounds.width) * 2 - 1),
        );
        const y = Math.max(
          -1,
          Math.min(1, ((pointerY - bounds.top) / bounds.height) * 2 - 1),
        );
        surface.dataset.tracking = "true";
        sculpture.style.transform = `translate3d(${x * 8}px, ${y * 6}px, 0) rotateX(${-y * 1.5}deg) rotateY(${x * 2}deg)`;
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) reset();
    });
    observer.observe(surface);
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerleave", reset);
    surface.addEventListener("pointercancel", reset);
    preference.addEventListener("change", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      reset();
      observer.disconnect();
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerleave", reset);
      surface.removeEventListener("pointercancel", reset);
      preference.removeEventListener("change", reset);
      document.removeEventListener("visibilitychange", reset);
    };
  }, []);

  return (
    <div ref={scene} className="sculpture-scene">
      <div className="sculpture-arrival">
        <div ref={object} className="sculpture-object">
          {children}
        </div>
      </div>
    </div>
  );
}
