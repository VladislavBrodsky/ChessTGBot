'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { BoxTier } from './boxConfig';

const FLOAT: Record<BoxTier, { y: number[]; dur: number }> = {
    common:   { y: [0, -5, 0],  dur: 4.8 },
    rare:     { y: [0, -4, 0],  dur: 4.4 },
    epic:     { y: [0, -6, 0],  dur: 4.2 },
    legendary:{ y: [0, -9, 0],  dur: 3.8 },
    seasonal: { y: [0, -7, 0],  dur: 3.6 },
};

/**
 * Per-tier chess chest artwork. Every tier keeps the same functional treasure
 * box silhouette while changing its piece language and material treatment.
 * Animates with a soft floating effect.
 */
export default function MysteryBoxArt({ tier, size = 116 }: { tier: BoxTier; size?: number }) {
    const { y, dur } = FLOAT[tier];

    return (
        <motion.div
            animate={{ y }}
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
