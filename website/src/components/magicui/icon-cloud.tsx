"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { useShowcaseActivity } from "../home/useShowcaseActivity";

/** A small, SVG-native 3D cloud with a clear central safe zone for the vault. */
export function IconCloud({ children, center }: { children: ReactNode; center: ReactNode }) {
  const icons = Children.toArray(children);
  const { ref, active } = useShowcaseActivity();
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const angle = useRef(-Math.PI / 4);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const running = active && !paused && !hovered;

  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    let frame = 0;
    let last = 0;
    let radius = Math.max(64, Math.min(94, stage.clientWidth / 2 - 30));
    const paint = () => {
      nodes.current.forEach((node, i) => {
        if (!node) return;
        const phase = angle.current + i * Math.PI * 2 / icons.length;
        const depth = Math.sin(phase);
        // The shallow tilt preserves a central exclusion zone at every angle.
        node.style.transform = `translate(${Math.cos(phase) * radius}px, ${depth * radius * 0.86}px) scale(${1 + depth * 0.07})`;
        node.style.zIndex = depth > 0 ? "3" : "1";
        node.style.opacity = String(0.85 + (depth + 1) * 0.075);
      });
    };
    const observer = new ResizeObserver(() => {
      radius = Math.max(64, Math.min(94, stage.clientWidth / 2 - 30));
      paint();
    });
    observer.observe(stage);
    paint();
    const tick = (time: number) => {
      if (time - last >= 40) {
        if (last) angle.current += Math.min(time - last, 80) * Math.PI * 2 / 36000;
        last = time;
        paint();
      }
      frame = requestAnimationFrame(tick);
    };
    if (running) frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [running, icons.length, ref]);

  return (
    <div className="vault-cloud-frame">
      <div ref={ref} className="vault-cloud" role="img" aria-label="GRAM, Bitcoin, USDT, and KING orbiting a chess vault"
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div className="vault-cloud-guide" aria-hidden="true" />
        <div className="vault-cloud-center" aria-hidden="true">{center}</div>
        {icons.map((icon, i) => (
          <div key={i} ref={(node) => { nodes.current[i] = node; }} className="vault-cloud-token" aria-hidden="true"
            style={{ transform: `translate(calc(var(--cloud-radius) * ${Math.cos(-Math.PI / 4 + i * Math.PI * 2 / icons.length)}), calc(var(--cloud-radius) * ${Math.sin(-Math.PI / 4 + i * Math.PI * 2 / icons.length) * 0.86}))` }}>
            {icon}
          </div>
        ))}
      </div>
      <button type="button" className="vault-motion-control" aria-label={paused ? "Resume vault animation" : "Pause vault animation"}
        aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          {paused ? <path d="m9 5 11 7-11 7z" /> : <path d="M7 5h3v14H7zm7 0h3v14h-3z" />}
        </svg>
      </button>
    </div>
  );
}
