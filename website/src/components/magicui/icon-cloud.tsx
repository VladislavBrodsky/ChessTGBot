"use client";

import React, { useEffect, useRef, useState, useId } from "react";

export interface IconCloudProps {
  images?: string[];
  slugs?: string[];
  size?: number;
  className?: string;
  showControl?: boolean;
}

interface SpherePoint {
  x: number;
  y: number;
  z: number;
  img: HTMLImageElement;
  loaded: boolean;
}

export function IconCloud({
  images = [],
  slugs = [],
  size = 320,
  className = "",
  showControl = true,
}: IconCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const containerId = useId();

  // Combine direct image URLs and slug URLs
  const resolvedUrls = React.useMemo(() => {
    const list = [...images];
    slugs.forEach((slug) => {
      list.push(`https://cdn.simpleicons.org/${slug}`);
    });
    return list;
  }, [images, slugs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || resolvedUrls.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle High-DPI screens
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let animationFrameId: number;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let rotX = 0.003;
    let rotY = 0.004;

    const radius = (size / 2) * 0.72;
    const count = resolvedUrls.length;
    const points: SpherePoint[] = [];

    // Distribute icons evenly on a sphere using Fibonacci spiral
    resolvedUrls.forEach((url, i) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const item: SpherePoint = {
        x: 0,
        y: 0,
        z: 0,
        img,
        loaded: false,
      };

      img.onload = () => {
        item.loaded = true;
      };
      img.src = url;

      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      item.x = radius * Math.sin(phi) * Math.cos(theta);
      item.y = radius * Math.sin(phi) * Math.sin(theta);
      item.z = radius * Math.cos(phi);

      points.push(item);
    });

    const rotatePoint = (x: number, y: number, z: number, angleX: number, angleY: number) => {
      // Rotate around Y
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      // Rotate around X
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      return { x: x1, y: y2, z: z2 };
    };

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      if (isPlaying) {
        points.forEach((point) => {
          const rotated = rotatePoint(point.x, point.y, point.z, rotX, rotY);
          point.x = rotated.x;
          point.y = rotated.y;
          point.z = rotated.z;
        });

        // Natural decay towards slow gentle drift
        if (!isDragging) {
          rotX = rotX * 0.98 + 0.002 * 0.02;
          rotY = rotY * 0.98 + 0.003 * 0.02;
        }
      }

      // Sort points back-to-front for proper depth perspective
      const sorted = [...points].sort((a, b) => a.z - b.z);
      const cx = size / 2;
      const cy = size / 2;
      const fov = 350;
      const baseIconSize = Math.max(26, size * 0.1);

      sorted.forEach((point) => {
        const scale = fov / (fov - point.z);
        const screenX = cx + point.x * scale;
        const screenY = cy + point.y * scale;
        const depthAlpha = Math.max(0.18, Math.min(1, (point.z + radius) / (2 * radius) + 0.15));
        const currentSize = baseIconSize * scale;

        ctx.save();
        ctx.globalAlpha = depthAlpha;

        if (point.loaded && point.img.naturalWidth > 0) {
          ctx.drawImage(
            point.img,
            screenX - currentSize / 2,
            screenY - currentSize / 2,
            currentSize,
            currentSize
          );
        } else {
          // Circular fallback token
          ctx.beginPath();
          ctx.arc(screenX, screenY, currentSize * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
          ctx.fill();
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Mouse & Touch Interaction
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      rotY = dx * 0.004;
      rotX = -dy * 0.004;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      rotY = dx * 0.004;
      rotX = -dy * 0.004;
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [resolvedUrls, size, isPlaying]);

  return (
    <div
      id={containerId}
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="cursor-grab active:cursor-grabbing max-w-full h-auto"
        aria-label="Interactive 3D tag cloud"
      />
      {showControl && (
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? "Pause rotation" : "Resume rotation"}
          className="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-lg border border-line bg-surface/80 backdrop-blur-xs text-caption text-fg-muted hover:text-fg-default hover:bg-surface transition-colors"
        >
          {isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
