'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiClock } from 'react-icons/fi';

/**
 * Countdown to the end of the current seasonal window (end of the calendar
 * month, UTC). Purely presentational urgency for the limited drop — the box
 * remains purchasable regardless; this is not a hard gate.
 */
export default function SeasonalCountdown({ accent, className = '' }: { accent: string; className?: string }) {
    const t = useTranslations('Marketplace');
    const [remaining, setRemaining] = useState<{ d: number; h: number; m: number } | null>(null);

    useEffect(() => {
        const compute = () => {
            const now = new Date();
            const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
            const diff = Math.max(0, end.getTime() - now.getTime());
            setRemaining({
                d: Math.floor(diff / 86400000),
                h: Math.floor((diff % 86400000) / 3600000),
                m: Math.floor((diff % 3600000) / 60000),
            });
        };
        compute();
        const id = setInterval(compute, 60000);
        return () => clearInterval(id);
    }, []);

    if (!remaining) return null;

    return (
        <div className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] ${className}`} style={{ color: accent }}>
            <FiClock size={10} />
            <span>{t('season_ends', { d: remaining.d, h: remaining.h, m: remaining.m })}</span>
        </div>
    );
}
