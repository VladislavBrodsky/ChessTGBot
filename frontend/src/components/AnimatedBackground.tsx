import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-brand-primary/5">
      {/* Animated gradient orbs */}
      <div 
        className="absolute w-[150vw] h-[150vh] -top-[25vh] -left-[25vw] opacity-40 mix-blend-screen"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, var(--premium-orb-silver) 0%, transparent 40%),
            radial-gradient(circle at 20% 80%, var(--premium-orb-gold) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, var(--premium-orb-silver) 0%, transparent 40%)
          `,
          animation: 'slowSpin 60s linear infinite',
          transformOrigin: 'center center'
        }}
      />
      <div 
        className="absolute w-[150vw] h-[150vh] -top-[25vh] -left-[25vw] opacity-30 mix-blend-screen"
        style={{
          background: `
            radial-gradient(circle at 80% 80%, var(--premium-orb-gold) 0%, transparent 50%),
            radial-gradient(circle at 20% 20%, var(--premium-orb-silver) 0%, transparent 40%)
          `,
          animation: 'slowSpinReverse 90s linear infinite',
          transformOrigin: 'center center'
        }}
      />

      {/* SVG Noise Filter Overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.25] mix-blend-overlay pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <filter id="fractalNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.1 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#fractalNoise)" />
      </svg>
      
      {/* Base Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
        backgroundSize: '48px 48px'
      }} />

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slowSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes slowSpinReverse {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }
        `
      }} />
    </div>
  );
}
