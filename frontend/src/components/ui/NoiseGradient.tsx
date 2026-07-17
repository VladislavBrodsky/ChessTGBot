'use client';

import { motion } from 'framer-motion';

interface NoiseGradientProps {
  className?: string;
  opacity?: number;
}

export default function NoiseGradient({ className = '', opacity = 0.3 }: NoiseGradientProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit] z-0 ${className}`}>
      {/* Animated Gradient Background */}
      <motion.div
        className="absolute -inset-[50%] mix-blend-screen"
        style={{
          opacity,
          background: 'conic-gradient(from 0deg at 50% 50%, #10B981 0deg, #A855F7 120deg, #3B82F6 240deg, #10B981 360deg)',
          filter: 'blur(30px)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Static SVG Noise Layer */}
      <div 
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
