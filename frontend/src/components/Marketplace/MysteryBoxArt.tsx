'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { BoxTier } from './boxConfig';

/**
 * Per-tier Mystery Box artwork — rendered using ultra-premium 8k 3D renders.
 * Replaces the previous inline SVG approach.
 */
export default function MysteryBoxArt({ tier, size = 116 }: { tier: BoxTier; size?: number }) {
    const float = tier === 'legendary' ? [0, -9, 0] : [0, -6, 0];
    const dur = tier === 'common' ? 4.6 : tier === 'legendary' ? 3.8 : 4.1;

    return (
        <motion.div 
            animate={{ y: float }} 
            transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: size, height: size }}
            className="relative flex items-center justify-center"
        >
            <img 
                src={`/boxes/${tier}.jpg`}
                alt={`${tier} Mystery Box`}
                className="w-full h-full object-cover relative z-10 pointer-events-none drop-shadow-2xl"
                style={{
                    // Use a radial gradient mask to smoothly blend the square image into the dark background
                    WebkitMaskImage: 'radial-gradient(circle at center, black 45%, transparent 70%)',
                    maskImage: 'radial-gradient(circle at center, black 45%, transparent 70%)',
                    transform: 'scale(1.3)' // Scale up slightly to fill the mask well
                }}
            />
        </motion.div>
    );
}

