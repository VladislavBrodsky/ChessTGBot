'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { BoxTier } from './boxConfig';

/**
 * Per-tier chess chest artwork. Every tier keeps the same functional treasure
 * box silhouette while changing its piece language and material treatment.
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
            <Image
                src={`/boxes/${tier}-chess.jpg`}
                alt={`${tier} chess treasure box`}
                width={size}
                height={size}
                className="w-full h-full object-contain relative z-10 pointer-events-none select-none drop-shadow-2xl"
                style={{
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 78%)',
                    maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 78%)',
                    transform: 'scale(1.08)'
                }}
            />
        </motion.div>
    );
}
