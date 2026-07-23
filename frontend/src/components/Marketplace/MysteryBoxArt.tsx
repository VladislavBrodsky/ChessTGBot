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
 * Per-tier chess chest artwork. Each render is a dark studio shot on a near-black
 * backdrop, so it is presented edge-to-edge (object-cover) over the card's dark
 * plate — the image's own black background blends into the plate seamlessly.
 *
 * NOTE: use the original `.jpg` renders, NOT the `-chess.webp` variants. Those
 * webps were produced by luma-keyed "transparent" background removal that erased
 * the chests' own dark bodies (dark-on-dark can't be keyed), leaving broken,
 * washed-out cutouts. Fills its (relatively positioned) parent.
 */
export default function MysteryBoxArt({ 
    tier,
    className,
    style,
}: {
    tier: BoxTier; 
    className?: string; 
    style?: React.CSSProperties;
    variant?: string;
}) {
    const { y, dur } = FLOAT[tier];

    return (
        <motion.div
            animate={{ y }}
            transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute inset-0 z-10 ${className || ''}`}
            style={style}
        >
            <Image
                src={`/boxes/${tier}-chess.webp`}
                alt={`${tier} chess treasure box`}
                fill
                sizes="220px"
                className="object-contain p-3 pointer-events-none select-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]"
                priority
            />
        </motion.div>
    );
}
