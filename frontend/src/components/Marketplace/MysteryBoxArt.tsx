'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { BoxTier } from './boxConfig';

/**
 * Per-tier Mystery Box artwork — rendered as layered inline SVG to fake a
 * premium "3D icon" look (shaded faces, bevels, specular highlights, a soft
 * ground shadow and a floating idle animation). Each tier has its OWN
 * silhouette + material, not a recolour. `size` = square viewport in px.
 */
export default function MysteryBoxArt({ tier, size = 116 }: { tier: BoxTier; size?: number }) {
    const svg = { width: size, height: size, viewBox: '0 0 120 120', style: { overflow: 'visible' as const } };
    const float = tier === 'legendary' ? [0, -9, 0] : [0, -6, 0];
    const dur = tier === 'common' ? 4.6 : tier === 'legendary' ? 3.8 : 4.1;

    if (tier === 'common') {
        // Bronze — Novice Crate: front-facing 3D wooden chest with iron bands.
        return (
            <motion.svg {...svg} animate={{ y: float }} transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}>
                <defs>
                    <linearGradient id="nc-front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8a5a2b" /><stop offset="1" stopColor="#4a2c14" /></linearGradient>
                    <linearGradient id="nc-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c58a4a" /><stop offset="1" stopColor="#7a4a1e" /></linearGradient>
                    <linearGradient id="nc-band" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5c3317" /><stop offset=".5" stopColor="#e0a860" /><stop offset="1" stopColor="#5c3317" /></linearGradient>
                    <radialGradient id="nc-glow" cx=".5" cy=".5"><stop offset="0" stopColor="#CD7F32" stopOpacity=".55" /><stop offset="1" stopColor="#CD7F32" stopOpacity="0" /></radialGradient>
                </defs>
                <ellipse cx="60" cy="106" rx="34" ry="6" fill="#000" opacity=".45" />
                <ellipse cx="60" cy="60" rx="46" ry="46" fill="url(#nc-glow)" opacity=".35" />
                {/* right side face for depth */}
                <path d="M92 58 l6 5 v30 l-6 5 Z" fill="#3a2210" />
                {/* body */}
                <rect x="26" y="60" width="66" height="38" rx="4" fill="url(#nc-front)" />
                {/* lid */}
                <path d="M26 62 Q26 40 59 39 Q92 40 92 62 Z" fill="url(#nc-lid)" />
                <path d="M34 55 Q59 44 85 55" stroke="#fff" strokeOpacity=".3" strokeWidth="2" fill="none" strokeLinecap="round" />
                {/* iron bands */}
                <rect x="38" y="39" width="7" height="59" fill="url(#nc-band)" opacity=".9" />
                <rect x="73" y="39" width="7" height="59" fill="url(#nc-band)" opacity=".9" />
                {/* rivets */}
                {[[41.5, 46], [41.5, 92], [76.5, 46], [76.5, 92]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.8" fill="#f0c98a" />)}
                {/* lock plate */}
                <rect x="53" y="66" width="14" height="18" rx="3" fill="#2a1a0d" stroke="#e0a860" strokeWidth="1.2" />
                <motion.circle cx="60" cy="72" r="3" fill="#f0c98a" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.2, repeat: Infinity }} />
                <text x="60" y="82" fontSize="9" fill="#CD7F32" textAnchor="middle" fontWeight="900">?</text>
            </motion.svg>
        );
    }

    if (tier === 'rare') {
        // Silver — Steel Vault: 3D beveled safe with spinning combination dial.
        return (
            <motion.svg {...svg} animate={{ y: float }} transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}>
                <defs>
                    <linearGradient id="sv-face" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f2f2f4" /><stop offset=".5" stopColor="#b8b8bc" /><stop offset="1" stopColor="#7c7c80" /></linearGradient>
                    <linearGradient id="sv-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6a6a6e" /><stop offset="1" stopColor="#3c3c40" /></linearGradient>
                    <radialGradient id="sv-dial" cx=".4" cy=".35"><stop offset="0" stopColor="#4a4a4e" /><stop offset="1" stopColor="#1c1c1f" /></radialGradient>
                    <radialGradient id="sv-glow" cx=".5" cy=".5"><stop offset="0" stopColor="#C0C0C0" stopOpacity=".5" /><stop offset="1" stopColor="#C0C0C0" stopOpacity="0" /></radialGradient>
                </defs>
                <ellipse cx="60" cy="106" rx="32" ry="6" fill="#000" opacity=".45" />
                <ellipse cx="60" cy="60" rx="44" ry="44" fill="url(#sv-glow)" opacity=".35" />
                {/* depth side + top */}
                <path d="M86 26 l8 6 v52 l-8 6 Z" fill="url(#sv-side)" />
                <path d="M26 26 l8 -6 h52 l8 6 Z" fill="#d0d0d4" />
                {/* front face */}
                <rect x="26" y="26" width="60" height="60" rx="9" fill="url(#sv-face)" />
                <rect x="26" y="26" width="60" height="60" rx="9" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="1" />
                <rect x="31" y="31" width="50" height="50" rx="6" fill="none" stroke="#000" strokeOpacity=".12" strokeWidth="1.5" />
                {/* corner bolts */}
                {[[34, 34], [78, 34], [34, 78], [78, 78]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" fill="#5c5c60" />)}
                {/* dial */}
                <circle cx="56" cy="56" r="19" fill="url(#sv-dial)" />
                <circle cx="56" cy="56" r="19" fill="none" stroke="#e6e6ea" strokeWidth="2" />
                <motion.g style={{ transformOrigin: '56px 56px' }} animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
                    {[0, 45, 90, 135].map((a) => <rect key={a} x="55" y="39" width="2" height="6" rx="1" fill="#cfcfd3" transform={`rotate(${a} 56 56)`} />)}
                    <circle cx="56" cy="42" r="2" fill="#f2f2f4" />
                </motion.g>
                <circle cx="56" cy="56" r="8" fill="#3a3a3d" stroke="#cfcfd3" strokeWidth="1.5" />
                <text x="56" y="60" fontSize="10" fill="#E8E8E8" textAnchor="middle" fontWeight="900">?</text>
                {/* handle */}
                <rect x="80" y="50" width="4" height="14" rx="2" fill="#6a6a6e" />
            </motion.svg>
        );
    }

    if (tier === 'epic') {
        // Gold — Royal Coffer: 3D barrel-lid treasure chest with a jewel clasp.
        return (
            <motion.svg {...svg} animate={{ y: float }} transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}>
                <defs>
                    <linearGradient id="rc-front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE98a" /><stop offset="1" stopColor="#B8860B" /></linearGradient>
                    <linearGradient id="rc-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF6b0" /><stop offset="1" stopColor="#E0A800" /></linearGradient>
                    <linearGradient id="rc-trim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8a5a00" /><stop offset=".5" stopColor="#FFE98a" /><stop offset="1" stopColor="#8a5a00" /></linearGradient>
                    <radialGradient id="rc-glow" cx=".5" cy=".5"><stop offset="0" stopColor="#FFD700" stopOpacity=".6" /><stop offset="1" stopColor="#FFD700" stopOpacity="0" /></radialGradient>
                </defs>
                <ellipse cx="60" cy="106" rx="36" ry="7" fill="#000" opacity=".4" />
                <ellipse cx="60" cy="58" rx="48" ry="48" fill="url(#rc-glow)" opacity=".45" />
                {/* side depth */}
                <path d="M91 56 l6 4 v34 l-6 4 Z" fill="#7a5500" />
                {/* body */}
                <rect x="25" y="60" width="66" height="38" rx="4" fill="url(#rc-front)" />
                {/* barrel lid */}
                <path d="M25 62 Q25 34 58 33 Q91 34 91 62 Z" fill="url(#rc-lid)" />
                <path d="M32 52 Q58 40 84 52" stroke="#fff" strokeOpacity=".45" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* horizontal trims */}
                <rect x="23" y="59" width="70" height="5" rx="2.5" fill="url(#rc-trim)" />
                <rect x="23" y="86" width="70" height="4" rx="2" fill="url(#rc-trim)" opacity=".8" />
                {/* corner mounts */}
                {[[28, 63], [88, 63], [28, 92], [88, 92]].map(([x, y], i) => <rect key={i} x={x - 2.5} y={y - 2.5} width="5" height="5" rx="1" fill="#8a5a00" />)}
                {/* lock + jewel */}
                <rect x="52" y="64" width="16" height="20" rx="3" fill="#7a5500" />
                <motion.path d="M60 68 l5 5 -5 5 -5 -5 Z" fill="#7CF5FF" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.8, repeat: Infinity }} />
                {/* spilled coins */}
                <motion.g animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.4, repeat: Infinity }}>
                    <ellipse cx="30" cy="99" rx="4" ry="2.4" fill="#FFD700" /><ellipse cx="86" cy="100" rx="3.4" ry="2" fill="#FFE98a" /><ellipse cx="72" cy="101" rx="3" ry="1.8" fill="#FFD700" />
                </motion.g>
            </motion.svg>
        );
    }

    if (tier === 'legendary') {
        // Platinum — Prism Reliquary: faceted floating diamond + orbiting rings.
        return (
            <motion.svg {...svg} animate={{ y: float }} transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}>
                <defs>
                    <linearGradient id="pr-l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#8fd8ff" /></linearGradient>
                    <linearGradient id="pr-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#bfe9ff" /><stop offset="1" stopColor="#7a8fd8" /></linearGradient>
                    <linearGradient id="pr-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e8c9ff" /><stop offset="1" stopColor="#9a8fd0" /></linearGradient>
                    <linearGradient id="pr-t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#d8f0ff" /></linearGradient>
                    <radialGradient id="pr-glow" cx=".5" cy=".5"><stop offset="0" stopColor="#b9f2ff" stopOpacity=".7" /><stop offset="1" stopColor="#b9f2ff" stopOpacity="0" /></radialGradient>
                </defs>
                <ellipse cx="60" cy="104" rx="26" ry="5" fill="#7ad8ff" opacity=".3" />
                <ellipse cx="60" cy="56" rx="46" ry="46" fill="url(#pr-glow)" opacity=".5" />
                <motion.g style={{ transformOrigin: '60px 58px' }} animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}>
                    <ellipse cx="60" cy="58" rx="42" ry="15" fill="none" stroke="#b9f2ff" strokeWidth="1.2" opacity=".55" />
                    <ellipse cx="60" cy="58" rx="15" ry="42" fill="none" stroke="#e5b0ff" strokeWidth="1.2" opacity=".45" />
                    <circle cx="102" cy="58" r="2" fill="#fff" /><circle cx="18" cy="58" r="2" fill="#e5b0ff" />
                </motion.g>
                {/* crown facets (top) */}
                <path d="M60 20 L46 44 L74 44 Z" fill="url(#pr-t)" />
                <path d="M46 44 L60 20 L60 44 Z" fill="#ffffff" opacity=".85" />
                {/* pavilion (bottom) — multi facet for 3D */}
                <path d="M46 44 L74 44 L60 92 Z" fill="url(#pr-b)" />
                <path d="M46 44 L60 44 L60 92 Z" fill="url(#pr-l)" opacity=".9" />
                <path d="M60 44 L74 44 L60 92 Z" fill="url(#pr-r)" />
                <path d="M52 44 L60 62 L60 92 Z" fill="#ffffff" opacity=".2" />
                <text x="60" y="60" fontSize="12" fill="#3a5a7a" textAnchor="middle" fontWeight="900">?</text>
                {[[24, 30, 2], [96, 74, 2.6], [92, 28, 3], [28, 78, 2.3]].map(([cx, cy, d], i) => (
                    <motion.circle key={i} cx={cx} cy={cy} r="1.6" fill={i % 2 ? '#b9f2ff' : '#ffffff'} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: d as number, repeat: Infinity }} />
                ))}
            </motion.svg>
        );
    }

    // Seasonal — Ember Relic: faceted obsidian gem with molten glowing core.
    return (
        <motion.svg {...svg} animate={{ y: float }} transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}>
            <defs>
                <linearGradient id="er-l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3a2222" /><stop offset="1" stopColor="#120a0a" /></linearGradient>
                <linearGradient id="er-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#241416" /><stop offset="1" stopColor="#080505" /></linearGradient>
                <linearGradient id="er-t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#4a2c2c" /><stop offset="1" stopColor="#2a1616" /></linearGradient>
                <radialGradient id="er-core" cx=".5" cy=".5"><stop offset="0" stopColor="#FFE08a" /><stop offset=".5" stopColor="#FF6347" /><stop offset="1" stopColor="#8B0000" /></radialGradient>
                <radialGradient id="er-glow" cx=".5" cy=".5"><stop offset="0" stopColor="#FF4500" stopOpacity=".7" /><stop offset="1" stopColor="#FF4500" stopOpacity="0" /></radialGradient>
            </defs>
            <ellipse cx="60" cy="105" rx="28" ry="5" fill="#000" opacity=".5" />
            <motion.ellipse cx="60" cy="56" rx="48" ry="48" fill="url(#er-glow)" animate={{ opacity: [0.35, 0.6, 0.35] }} transition={{ duration: 2.4, repeat: Infinity }} />
            {/* faceted obsidian gem */}
            <path d="M60 22 L40 42 L60 50 Z" fill="url(#er-t)" />
            <path d="M40 42 L60 50 L52 94 Z" fill="url(#er-l)" />
            <path d="M60 22 L80 42 L60 50 Z" fill="#1c1010" />
            <path d="M80 42 L60 50 L68 94 Z" fill="url(#er-r)" />
            <path d="M40 42 L52 94 L68 94 L80 42 L60 50 Z" fill="#000" opacity=".15" />
            {/* molten cracks */}
            <motion.path d="M60 30 L58 50 L54 78" stroke="#FF6347" strokeWidth="2" fill="none" strokeLinecap="round" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }} />
            <motion.path d="M60 50 L64 74" stroke="#FF8C00" strokeWidth="1.5" fill="none" strokeLinecap="round" animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2.2, repeat: Infinity }} />
            {/* glowing core */}
            <motion.circle cx="60" cy="54" r="9" fill="url(#er-core)" animate={{ r: [8, 9.5, 8] }} transition={{ duration: 2, repeat: Infinity }} />
            <text x="60" y="58" fontSize="10" fill="#4a1500" textAnchor="middle" fontWeight="900">?</text>
            {[[34, 26, 1.5], [82, 34, 2], [84, 70, 1.7], [32, 72, 2.2]].map(([cx, cy, d], i) => (
                <motion.circle key={i} cx={cx} cy={cy} r="1.6" fill={['#FF8C00', '#FF4500', '#FF6347', '#FFB347'][i]} animate={{ opacity: [0.2, 1, 0.2], y: [0, -5, 0] }} transition={{ duration: d as number, repeat: Infinity }} />
            ))}
        </motion.svg>
    );
}
