"use client";

import createGlobe, { type COBEOptions } from "cobe";
import { useEffect, useRef } from "react";

export interface GlobeProps {
  className?: string;
  config?: Partial<COBEOptions>;
}

export function Globe({ className = "", config }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);

  useEffect(() => {
    let phi = 0;
    let width = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onResize = () => {
      if (canvas) {
        width = canvas.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2;

    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(dpr, 2),
      width: (width || 500) * 2,
      height: (width || 500) * 2,
      phi: 0,
      theta: 0.25,
      dark: 0,
      diffuse: 1.4,
      mapSamples: 16000,
      mapBrightness: 3.5,
      baseColor: [0.88, 0.9, 0.94], // Crisp, modern Fog Board light gray/slate base
      markerColor: [16 / 255, 185 / 255, 129 / 255], // Tether Emerald Green #10b981
      glowColor: [0.94, 0.96, 0.98],
      offset: [0, 0],
      markers: [
        { location: [40.7128, -74.006], size: 0.08 }, // New York
        { location: [51.5074, -0.1278], size: 0.08 }, // London
        { location: [25.2048, 55.2708], size: 0.09 }, // Dubai
        { location: [35.6762, 139.6503], size: 0.08 }, // Tokyo
        { location: [1.3521, 103.8198], size: 0.08 }, // Singapore
        { location: [52.52, 13.405], size: 0.07 }, // Berlin
        { location: [55.7558, 37.6173], size: 0.08 }, // Moscow
        { location: [48.8566, 2.3522], size: 0.07 }, // Paris
        { location: [19.076, 72.8777], size: 0.07 }, // Mumbai
        { location: [-23.5505, -46.6333], size: 0.07 }, // São Paulo
        { location: [-33.8688, 151.2093], size: 0.07 }, // Sydney
      ],
      arcs: [
        { from: [40.7128, -74.006], to: [51.5074, -0.1278], color: [16 / 255, 185 / 255, 129 / 255] }, // NY -> London
        { from: [51.5074, -0.1278], to: [25.2048, 55.2708], color: [59 / 255, 130 / 255, 246 / 255] }, // London -> Dubai
        { from: [25.2048, 55.2708], to: [1.3521, 103.8198], color: [16 / 255, 185 / 255, 129 / 255] }, // Dubai -> Singapore
        { from: [1.3521, 103.8198], to: [35.6762, 139.6503], color: [245 / 255, 158 / 255, 11 / 255] }, // Singapore -> Tokyo
        { from: [52.52, 13.405], to: [55.7558, 37.6173], color: [16 / 255, 185 / 255, 129 / 255] }, // Berlin -> Moscow
      ],
      arcColor: [16 / 255, 185 / 255, 129 / 255],
      arcWidth: 0.45,
      arcHeight: 0.25,
      markerElevation: 0.03,
      ...config,
    });

    let animationId: number;
    const animate = () => {
      if (pointerInteracting.current === null) {
        phi += 0.004;
      }
      globe.update({
        phi: phi + pointerInteractionMovement.current,
        width: (width || 500) * 2,
        height: (width || 500) * 2,
      });
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);

    if (canvas) {
      canvas.style.opacity = "1";
    }

    return () => {
      cancelAnimationFrame(animationId);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [config]);

  return (
    <div className={`relative mx-auto aspect-square w-full max-w-[580px] flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="size-full opacity-0 transition-opacity duration-700 cursor-grab active:cursor-grabbing [contain:layout_paint_size]"
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta * 0.005;
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta * 0.005;
          }
        }}
      />
    </div>
  );
}
