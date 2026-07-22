'use client';

import React, { useState, useEffect } from 'react';

export default function AnimatedBackground() {
  const [pointer, setPointer] = useState({ x: 50, y: 35 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let requestID: number;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? window.innerWidth / 2 : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY ?? window.innerHeight / 3 : e.clientY;

      requestID = requestAnimationFrame(() => {
        setPointer({
          x: Math.round((clientX / window.innerWidth) * 100),
          y: Math.round((clientY / window.innerHeight) * 100),
        });
      });
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      if (requestID) cancelAnimationFrame(requestID);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* Base theme background void */}
      <div className="absolute inset-0 bg-brand-void transition-colors duration-500" />

      {/* Layer 1: GPU-Accelerated Floating Fluid Orbs */}
      <div className="absolute inset-0 pointer-events-none opacity-80">
        {/* Orb 1: Primary Gold / Theme Accent */}
        <div
          className="absolute w-[120vw] h-[120vh] -top-[30vh] -left-[20vw] rounded-full blur-[120px] will-change-transform"
          style={{
            background: `radial-gradient(circle at 50% 50%, var(--bg-orb-1) 0%, transparent 60%)`,
            animation: 'fluidFloatSlow 48s ease-in-out infinite alternate',
          }}
        />
        {/* Orb 2: Emerald / Secondary Accent */}
        <div
          className="absolute w-[110vw] h-[110vh] top-[20vh] -right-[20vw] rounded-full blur-[140px] will-change-transform"
          style={{
            background: `radial-gradient(circle at 50% 50%, var(--bg-orb-2) 0%, transparent 65%)`,
            animation: 'fluidFloatReverse 56s ease-in-out infinite alternate',
          }}
        />
        {/* Orb 3: Deep Cyber / Violet Accent */}
        <div
          className="absolute w-[100vw] h-[100vh] -bottom-[20vh] left-[10vw] rounded-full blur-[130px] will-change-transform"
          style={{
            background: `radial-gradient(circle at 50% 50%, var(--bg-orb-3) 0%, transparent 60%)`,
            animation: 'fluidFloatSlow 64s ease-in-out infinite alternate-reverse',
          }}
        />
      </div>

      {/* Layer 2: 2026 Micro-Dot Grid & Radial Vignette Mask */}
      <div
        className="absolute inset-0 opacity-100 transition-all duration-500"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--bg-dot-color) 1.2px, transparent 0)`,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Center Radial Vignette (soft focus mask towards center) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 35%, transparent 15%, var(--color-brand-void) 90%)`,
        }}
      />

      {/* Layer 3: Tactile Surface Micro-Grain Noise */}
      <svg
        className="absolute inset-0 w-full h-full mix-blend-overlay pointer-events-none transition-opacity duration-500"
        style={{ opacity: 'var(--bg-noise-opacity, 0.035)' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="web3TactileNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.12 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#web3TactileNoise)" />
      </svg>

      {/* Layer 4: Interactive Pointer Spotlight */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700 opacity-60"
        style={{
          background: `radial-gradient(600px circle at ${pointer.x}% ${pointer.y}%, var(--bg-orb-1) 0%, transparent 80%)`,
        }}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fluidFloatSlow {
            0% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(6vw, 8vh, 0) scale(1.08); }
            100% { transform: translate3d(-4vw, -6vh, 0) scale(0.96); }
          }
          @keyframes fluidFloatReverse {
            0% { transform: translate3d(0, 0, 0) scale(1.05); }
            50% { transform: translate3d(-7vw, -6vh, 0) scale(0.95); }
            100% { transform: translate3d(5vw, 7vh, 0) scale(1.06); }
          }
          @media (prefers-reduced-motion: reduce) {
            .will-change-transform {
              animation: none !important;
            }
          }
        `
      }} />
    </div>
  );
}
