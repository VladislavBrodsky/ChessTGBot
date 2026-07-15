/**
 * Single source of truth for Mystery Box presentation + odds.
 *
 * Odds MUST mirror the backend RNG in
 * `backend/app/api/v1/endpoints/marketplace.py::unbox_mystery_box`.
 * If you change drop rates there, update `drops` here so the
 * "What's inside" panel stays honest (loot-box transparency).
 */

export type BoxTier = 'common' | 'rare' | 'epic' | 'legendary' | 'seasonal';
export type DropRarity = 'refund' | 'boost' | 'cosmetic' | 'premium';

export interface DropOdds {
    /** Player-facing label of the possible reward. */
    label: string;
    /** Probability in percent (integer, sums to 100 per box). */
    chance: number;
    /** Category — drives the pill colour in the odds panel. */
    kind: DropRarity;
}

export interface BoxTheme {
    /** Primary accent (hex). */
    accent: string;
    /** Secondary accent for gradients (hex). */
    accent2: string;
    /** Soft glow colour behind the artwork. */
    glow: string;
    /** rgba tint string for translucent surfaces, e.g. "255,215,0". */
    rgb: string;
}

export interface BoxConfig {
    tier: BoxTier;
    /** Short brand name shown on the card, e.g. "Novice Crate". */
    name: string;
    /** Metal / rarity word, e.g. "Bronze". */
    metal: string;
    /** One-line tagline under the name. */
    tagline: string;
    /** XP price. Mirrors BOX_COSTS_XP in the backend. */
    costXP: number;
    theme: BoxTheme;
    /** Full odds table — sums to 100. */
    drops: DropOdds[];
    /** Seasonal / limited flag → drives the "LIMITED" ribbon + countdown. */
    limited?: boolean;
}

export const BOX_CONFIG: Record<BoxTier, BoxConfig> = {
    common: {
        tier: 'common',
        name: 'Novice Crate',
        metal: 'Bronze',
        tagline: 'Riveted wooden chest',
        costXP: 5000,
        theme: { accent: '#CD7F32', accent2: '#5C3317', glow: '#CD7F32', rgb: '205,127,50' },
        drops: [
            { label: '500 XP Refund', chance: 50, kind: 'refund' },
            { label: '1.2× XP Boost · 24h', chance: 40, kind: 'boost' },
            { label: 'Bronze Profile Border', chance: 10, kind: 'cosmetic' },
        ],
    },
    rare: {
        tier: 'rare',
        name: 'Steel Vault',
        metal: 'Silver',
        tagline: 'Brushed safe with combo dial',
        costXP: 8000,
        theme: { accent: '#C0C0C0', accent2: '#606063', glow: '#D8D8D8', rgb: '192,192,192' },
        drops: [
            { label: '1.5× XP Boost · 48h', chance: 40, kind: 'boost' },
            { label: 'Silver Profile Border', chance: 40, kind: 'cosmetic' },
            { label: '1-Week Premium', chance: 20, kind: 'premium' },
        ],
    },
    epic: {
        tier: 'epic',
        name: 'Royal Coffer',
        metal: 'Gold',
        tagline: 'Gem-clasp treasure chest',
        costXP: 10000,
        theme: { accent: '#FFD700', accent2: '#B8860B', glow: '#FFE55C', rgb: '255,215,0' },
        drops: [
            { label: '1-Month Premium', chance: 50, kind: 'premium' },
            { label: 'Gold Profile Border', chance: 30, kind: 'cosmetic' },
            { label: '2× XP Boost · 72h', chance: 20, kind: 'boost' },
        ],
    },
    legendary: {
        tier: 'legendary',
        name: 'Prism Reliquary',
        metal: 'Platinum',
        tagline: 'Levitating diamond monolith',
        costXP: 30000,
        theme: { accent: '#E5E4E2', accent2: '#A09F9C', glow: '#B9F2FF', rgb: '229,228,226' },
        drops: [
            { label: '5,000 XP Jackpot', chance: 50, kind: 'refund' },
            { label: 'Platinum Profile Border', chance: 30, kind: 'cosmetic' },
            { label: '1-Year Premium', chance: 20, kind: 'premium' },
        ],
    },
    seasonal: {
        tier: 'seasonal',
        name: 'Ember Relic',
        metal: 'Genesis',
        tagline: 'Molten limited-edition drop',
        costXP: 12000,
        theme: { accent: '#FF4500', accent2: '#8B0000', glow: '#FF6347', rgb: '255,69,0' },
        limited: true,
        drops: [
            { label: 'Limited Season Badge', chance: 50, kind: 'cosmetic' },
            { label: 'Season Multiplier · 2×', chance: 50, kind: 'boost' },
        ],
    },
};

export const BOX_ORDER: BoxTier[] = ['common', 'rare', 'epic', 'legendary', 'seasonal'];

/** Colour for an odds pill by reward category. */
export const DROP_KIND_COLOR: Record<DropRarity, string> = {
    refund: '#4ade80',   // green
    boost: '#38bdf8',    // sky
    cosmetic: '#c084fc', // violet
    premium: '#fbbf24',  // amber
};
