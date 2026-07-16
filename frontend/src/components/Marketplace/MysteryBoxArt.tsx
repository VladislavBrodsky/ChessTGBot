'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { BoxTier } from './boxConfig';

/* ─── Per-tier 3D SVG illustrations ──────────────────────────────────────── */

function BronzeCrate() {
    return (
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
            <defs>
                <radialGradient id="bc-glow" cx="50%" cy="85%" r="50%">
                    <stop offset="0%" stopColor="#CD7F32" stopOpacity="0.35"/>
                    <stop offset="100%" stopColor="#CD7F32" stopOpacity="0"/>
                </radialGradient>
                <linearGradient id="bc-front" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A0714A"/>
                    <stop offset="100%" stopColor="#5C3317"/>
                </linearGradient>
                <linearGradient id="bc-right" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4A2A10"/>
                    <stop offset="100%" stopColor="#3A1E0A"/>
                </linearGradient>
                <linearGradient id="bc-top" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C4956A"/>
                    <stop offset="100%" stopColor="#8B5E3C"/>
                </linearGradient>
                <linearGradient id="bc-lid-front" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B07A50"/>
                    <stop offset="100%" stopColor="#7A4E28"/>
                </linearGradient>
                <linearGradient id="bc-band" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8A84A"/>
                    <stop offset="50%" stopColor="#CD7F32"/>
                    <stop offset="100%" stopColor="#8B5E20"/>
                </linearGradient>
                <filter id="bc-shadow">
                    <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#2A1000" floodOpacity="0.6"/>
                </filter>
            </defs>

            {/* Ambient ground glow */}
            <ellipse cx="62" cy="107" rx="34" ry="7" fill="url(#bc-glow)"/>

            <g filter="url(#bc-shadow)">
                {/* ── BODY ── */}
                {/* Right face */}
                <polygon points="88,52 100,45 100,88 88,95" fill="url(#bc-right)"/>
                {/* Front face */}
                <rect x="30" y="52" width="58" height="43" fill="url(#bc-front)"/>
                {/* Wood plank lines (front) */}
                <line x1="30" y1="61" x2="88" y2="61" stroke="#6B4226" strokeWidth="0.7" strokeOpacity="0.5"/>
                <line x1="30" y1="70" x2="88" y2="70" stroke="#6B4226" strokeWidth="0.7" strokeOpacity="0.5"/>
                <line x1="30" y1="79" x2="88" y2="79" stroke="#6B4226" strokeWidth="0.7" strokeOpacity="0.5"/>
                <line x1="30" y1="88" x2="88" y2="88" stroke="#6B4226" strokeWidth="0.7" strokeOpacity="0.5"/>
                {/* Right face plank lines */}
                <line x1="88" y1="60" x2="100" y2="53" stroke="#2A1000" strokeWidth="0.6" strokeOpacity="0.6"/>
                <line x1="88" y1="69" x2="100" y2="62" stroke="#2A1000" strokeWidth="0.6" strokeOpacity="0.6"/>
                <line x1="88" y1="78" x2="100" y2="71" stroke="#2A1000" strokeWidth="0.6" strokeOpacity="0.6"/>

                {/* Bronze band across body */}
                <rect x="30" y="68" width="58" height="6" fill="url(#bc-band)"/>
                <polygon points="88,68 100,61 100,67 88,74" fill="#B07028"/>
                {/* Band rivets */}
                <circle cx="37" cy="71" r="1.8" fill="#E8A84A"/>
                <circle cx="50" cy="71" r="1.8" fill="#E8A84A"/>
                <circle cx="63" cy="71" r="1.8" fill="#E8A84A"/>
                <circle cx="76" cy="71" r="1.8" fill="#E8A84A"/>

                {/* Bronze corner brackets */}
                <rect x="30" y="52" width="5" height="43" fill="url(#bc-band)" rx="1"/>
                <rect x="83" y="52" width="5" height="43" fill="#B07028" rx="1"/>

                {/* Lock/clasp */}
                <rect x="53" y="76" width="10" height="8" rx="2" fill="#2A1000"/>
                <rect x="55" y="78" width="6" height="5" rx="1" fill="#CD7F32"/>
                <circle cx="58" cy="80.5" r="1.5" fill="#8B5E20"/>
                <line x1="58" y1="80.5" x2="58" y2="83" stroke="#8B5E20" strokeWidth="1.2"/>

                {/* ── LID ── */}
                {/* Lid top face */}
                <polygon points="30,52 88,52 100,45 42,45" fill="url(#bc-top)"/>
                {/* Lid front face */}
                <rect x="30" y="44" width="58" height="10" fill="url(#bc-lid-front)"/>
                {/* Lid right face */}
                <polygon points="88,44 100,37 100,45 88,52" fill="#3A1E0A"/>
                {/* Lid plank on top */}
                <line x1="30" y1="46.5" x2="88" y2="46.5" stroke="#7A4E28" strokeWidth="0.6" strokeOpacity="0.4"/>
                {/* Lid top bronze trim */}
                <line x1="30" y1="44" x2="88" y2="44" stroke="#E8A84A" strokeWidth="1.5"/>
                <line x1="88" y1="44" x2="100" y2="37" stroke="#B07028" strokeWidth="1.5"/>
                {/* Hinge detail */}
                <rect x="49" y="50" width="7" height="4" rx="1.5" fill="#CD7F32"/>
                <rect x="66" y="50" width="7" height="4" rx="1.5" fill="#CD7F32"/>
                {/* Lid edge shadow */}
                <rect x="30" y="52" width="58" height="2" fill="#2A1000" fillOpacity="0.3"/>
            </g>

            {/* Corner bracket caps */}
            <rect x="30" y="52" width="5" height="5" fill="#E8A84A" rx="1"/>
            <rect x="83" y="52" width="5" height="5" fill="#D4922A" rx="1"/>
            <rect x="30" y="90" width="5" height="5" fill="#CD7F32" rx="1"/>
            <rect x="83" y="90" width="5" height="5" fill="#B07028" rx="1"/>

            {/* Top-left rim light */}
            <line x1="30" y1="44" x2="30" y2="95" stroke="#E8C088" strokeWidth="0.8" strokeOpacity="0.6"/>
            <line x1="30" y1="44" x2="88" y2="44" stroke="#E8C088" strokeWidth="0.8" strokeOpacity="0.4"/>
        </svg>
    );
}

function SilverVault() {
    return (
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
            <defs>
                <radialGradient id="sv-glow" cx="50%" cy="90%" r="50%">
                    <stop offset="0%" stopColor="#C0C0C0" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#C0C0C0" stopOpacity="0"/>
                </radialGradient>
                <linearGradient id="sv-body" x1="0" y1="0" x2="0.3" y2="1">
                    <stop offset="0%" stopColor="#D8D8D8"/>
                    <stop offset="40%" stopColor="#A8A8A8"/>
                    <stop offset="100%" stopColor="#6A6A6A"/>
                </linearGradient>
                <linearGradient id="sv-side" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#5A5A5A"/>
                    <stop offset="100%" stopColor="#3A3A3A"/>
                </linearGradient>
                <linearGradient id="sv-door" x1="0" y1="0" x2="0.2" y2="1">
                    <stop offset="0%" stopColor="#C8C8C8"/>
                    <stop offset="50%" stopColor="#989898"/>
                    <stop offset="100%" stopColor="#585858"/>
                </linearGradient>
                <radialGradient id="sv-dial-r" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#E8E8E8"/>
                    <stop offset="60%" stopColor="#A0A0A0"/>
                    <stop offset="100%" stopColor="#505050"/>
                </radialGradient>
                <linearGradient id="sv-shine" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5"/>
                    <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.1"/>
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
                </linearGradient>
                <filter id="sv-shadow">
                    <feDropShadow dx="2" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.7"/>
                </filter>
            </defs>

            {/* Ground glow */}
            <ellipse cx="60" cy="108" rx="32" ry="6" fill="url(#sv-glow)"/>

            <g filter="url(#sv-shadow)">
                {/* Side face (3D depth) */}
                <polygon points="88,36 100,30 100,90 88,96" fill="url(#sv-side)"/>
                {/* Main body */}
                <rect x="22" y="36" width="66" height="60" rx="4" fill="url(#sv-body)"/>
                {/* Brushed texture lines */}
                {[40,44,48,52,56,60,64,68,72,76,80,84,88].map((y) => (
                    <line key={y} x1="22" y1={y} x2="88" y2={y} stroke="#FFFFFF" strokeWidth="0.3" strokeOpacity="0.12"/>
                ))}
                {/* Door panel (inset) */}
                <rect x="28" y="41" width="54" height="50" rx="3" fill="url(#sv-door)"/>
                {/* Door seal line */}
                <rect x="28" y="41" width="54" height="50" rx="3" fill="none" stroke="#888" strokeWidth="1"/>
                {/* Rivets */}
                <circle cx="31" cy="44" r="2.5" fill="#A0A0A0"/><circle cx="31" cy="44" r="1" fill="#D8D8D8"/>
                <circle cx="79" cy="44" r="2.5" fill="#909090"/><circle cx="79" cy="44" r="1" fill="#C8C8C8"/>
                <circle cx="31" cy="88" r="2.5" fill="#A0A0A0"/><circle cx="31" cy="88" r="1" fill="#D8D8D8"/>
                <circle cx="79" cy="88" r="2.5" fill="#909090"/><circle cx="79" cy="88" r="1" fill="#C8C8C8"/>

                {/* Combination dial ring */}
                <circle cx="55" cy="65" r="17" fill="#3A3A3A"/>
                <circle cx="55" cy="65" r="15" fill="url(#sv-dial-r)"/>
                <circle cx="55" cy="65" r="15" fill="none" stroke="#D8D8D8" strokeWidth="1.5"/>
                {/* Tick marks */}
                {Array.from({length: 12}, (_, i) => {
                    const angle = (i * 30 - 90) * Math.PI / 180;
                    const r1 = 12.5, r2 = 14.5;
                    return <line key={i}
                        x1={55 + r1 * Math.cos(angle)} y1={65 + r1 * Math.sin(angle)}
                        x2={55 + r2 * Math.cos(angle)} y2={65 + r2 * Math.sin(angle)}
                        stroke="#888" strokeWidth="1"/>;
                })}
                {/* Inner dial */}
                <circle cx="55" cy="65" r="8" fill="#2A2A2A"/>
                <circle cx="55" cy="65" r="8" fill="none" stroke="#707070" strokeWidth="0.8"/>
                {/* Dial pointer */}
                <line x1="55" y1="65" x2="55" y2="57.5" stroke="#E8E8E8" strokeWidth="1.5" strokeLinecap="round"/>
                {/* Dial center knob */}
                <circle cx="55" cy="65" r="2.5" fill="#B0B0B0"/>
                <circle cx="54" cy="64" r="1" fill="#E8E8E8" fillOpacity="0.7"/>

                {/* Handle bar */}
                <rect x="70" y="60" width="7" height="10" rx="3.5" fill="#7A7A7A"/>
                <rect x="71" y="62" width="5" height="6" rx="2.5" fill="#5A5A5A"/>
                <rect x="70" y="59" width="7" height="2" rx="1" fill="#A0A0A0"/>
                <rect x="70" y="69" width="7" height="2" rx="1" fill="#A0A0A0"/>

                {/* Specular shine */}
                <rect x="22" y="36" width="66" height="60" rx="4" fill="url(#sv-shine)"/>
            </g>

            {/* Body top highlight */}
            <line x1="22" y1="36" x2="88" y2="36" stroke="#E8E8E8" strokeWidth="0.8" strokeOpacity="0.5"/>
            <line x1="22" y1="36" x2="22" y2="96" stroke="#E0E0E0" strokeWidth="0.8" strokeOpacity="0.4"/>
        </svg>
    );
}

function GoldCoffer() {
    return (
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
            <defs>
                <radialGradient id="gc-glow" cx="50%" cy="80%" r="55%">
                    <stop offset="0%" stopColor="#FFD700" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#FFD700" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="gc-inner-glow" cx="50%" cy="100%" r="80%">
                    <stop offset="0%" stopColor="#FFF8C0" stopOpacity="0.9"/>
                    <stop offset="60%" stopColor="#FFD700" stopOpacity="0.6"/>
                    <stop offset="100%" stopColor="#FFD700" stopOpacity="0"/>
                </radialGradient>
                <linearGradient id="gc-front" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD700"/>
                    <stop offset="100%" stopColor="#8B6A00"/>
                </linearGradient>
                <linearGradient id="gc-right" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7A5A00"/>
                    <stop offset="100%" stopColor="#4A3800"/>
                </linearGradient>
                <linearGradient id="gc-top" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFE55C"/>
                    <stop offset="100%" stopColor="#DAA520"/>
                </linearGradient>
                <linearGradient id="gc-lid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFE55C"/>
                    <stop offset="100%" stopColor="#B8860B"/>
                </linearGradient>
                <radialGradient id="gc-gem" cx="40%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#00DFFF"/>
                    <stop offset="50%" stopColor="#0095CC"/>
                    <stop offset="100%" stopColor="#003A6B"/>
                </radialGradient>
                <filter id="gc-shadow">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#4A3000" floodOpacity="0.7"/>
                </filter>
                <filter id="gc-inner">
                    <feGaussianBlur stdDeviation="3"/>
                </filter>
            </defs>

            {/* Ground glow */}
            <ellipse cx="62" cy="108" rx="36" ry="8" fill="url(#gc-glow)"/>

            {/* Inner lid glow (behind chest) */}
            <ellipse cx="59" cy="50" rx="25" ry="15" fill="url(#gc-inner-glow)" opacity="0.7" filter="url(#gc-inner)"/>

            <g filter="url(#gc-shadow)">
                {/* ── BODY ── */}
                {/* Right side face */}
                <polygon points="86,55 98,48 98,90 86,97" fill="url(#gc-right)"/>
                {/* Front face */}
                <rect x="28" y="55" width="58" height="42" fill="url(#gc-front)"/>
                {/* Embossed panel lines */}
                <rect x="34" y="61" width="46" height="30" fill="none" stroke="#FFE55C" strokeWidth="0.8" strokeOpacity="0.5" rx="1"/>
                <line x1="57" y1="61" x2="57" y2="91" stroke="#FFE55C" strokeWidth="0.5" strokeOpacity="0.3"/>
                <line x1="34" y1="76" x2="80" y2="76" stroke="#FFE55C" strokeWidth="0.5" strokeOpacity="0.3"/>
                {/* Diamond pattern on front */}
                <path d="M57,65 L62,71 L57,77 L52,71 Z" fill="none" stroke="#FFE55C" strokeWidth="0.8" strokeOpacity="0.6"/>
                <path d="M57,65 L62,71 L57,77 L52,71 Z" fill="#FFD700" fillOpacity="0.15"/>
                {/* Gold right-side trim */}
                <rect x="83" y="55" width="3" height="42" fill="#B8860B"/>
                <rect x="28" y="55" width="3" height="42" fill="#E8C040"/>

                {/* ── LID (slightly open) ── */}
                {/* Lid right face */}
                <polygon points="86,38 98,31 98,48 86,55" fill="#4A3800"/>
                {/* Lid front face */}
                <rect x="28" y="40" width="58" height="16" fill="url(#gc-lid)"/>
                {/* Lid top face */}
                <polygon points="28,40 86,40 98,33 40,33" fill="url(#gc-top)"/>
                {/* Lid embossed panel */}
                <rect x="32" y="42" width="50" height="12" fill="none" stroke="#FFE55C" strokeWidth="0.7" strokeOpacity="0.5" rx="1"/>
                {/* Lid gold trim */}
                <line x1="28" y1="40" x2="86" y2="40" stroke="#FFE55C" strokeWidth="1.5"/>
                <line x1="28" y1="56" x2="86" y2="56" stroke="#DAA520" strokeWidth="1.5"/>

                {/* ── GEM CLASP ── */}
                <polygon points="57,47 61,51 57,55 53,51" fill="url(#gc-gem)"/>
                <polygon points="57,47 61,51 57,55 53,51" fill="none" stroke="#00DFFF" strokeWidth="0.8"/>
                <circle cx="57" cy="51" r="1.5" fill="#AAEEFF" fillOpacity="0.8"/>

                {/* Corner studs */}
                {[[28,55],[86,55],[28,97],[86,97]].map(([x,y], i) => (
                    <circle key={i} cx={x} cy={y} r="3" fill="#FFD700"/>
                ))}
                {[[28,55],[86,55],[28,97],[86,97]].map(([x,y], i) => (
                    <circle key={i+4} cx={x} cy={y} r="1.5" fill="#FFF8C0"/>
                ))}
            </g>

            {/* Coin pile at base */}
            <ellipse cx="38" cy="99" rx="8" ry="4" fill="#DAA520" fillOpacity="0.8"/>
            <ellipse cx="45" cy="101" rx="6" ry="3" fill="#FFD700" fillOpacity="0.9"/>
            <ellipse cx="36" cy="100" rx="5" ry="2.5" fill="#B8860B" fillOpacity="0.6"/>

            {/* Top-left rim light */}
            <line x1="28" y1="40" x2="28" y2="97" stroke="#FFE880" strokeWidth="0.7" strokeOpacity="0.5"/>
        </svg>
    );
}

function PlatinumPrism() {
    return (
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
            <defs>
                <radialGradient id="pp-glow" cx="50%" cy="85%" r="50%">
                    <stop offset="0%" stopColor="#B9F2FF" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#B9F2FF" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="pp-core" cx="40%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#FFFFFF"/>
                    <stop offset="30%" stopColor="#D0F8FF"/>
                    <stop offset="100%" stopColor="#88CCFF" stopOpacity="0.3"/>
                </radialGradient>
                <filter id="pp-blur-sm">
                    <feGaussianBlur stdDeviation="1.5"/>
                </filter>
                <filter id="pp-blur-lg">
                    <feGaussianBlur stdDeviation="4"/>
                </filter>
            </defs>

            {/* Ground glow / reflection */}
            <ellipse cx="60" cy="108" rx="28" ry="7" fill="url(#pp-glow)"/>
            {/* Faint diamond reflection */}
            <polygon points="60,100 52,115 60,110 68,115" fill="#B9F2FF" fillOpacity="0.08"/>

            {/* Orbit ring */}
            <ellipse cx="60" cy="66" rx="38" ry="12" fill="none" stroke="#B9F2FF" strokeWidth="0.8" strokeOpacity="0.4"/>
            {/* Orbiting dots */}
            <circle cx="98" cy="66" r="2.5" fill="#B9F2FF" fillOpacity="0.8"/>
            <circle cx="22" cy="66" r="2" fill="#C8EEFF" fillOpacity="0.6"/>
            <circle cx="78" cy="57" r="1.5" fill="#E0B0FF" fillOpacity="0.7"/>
            <circle cx="42" cy="75" r="1.5" fill="#FFFFFF" fillOpacity="0.5"/>

            {/* Inner ambient glow (behind crystal) */}
            <ellipse cx="60" cy="55" rx="22" ry="28" fill="#FFFFFF" fillOpacity="0.08" filter="url(#pp-blur-lg)"/>

            {/* ── CRYSTAL DIAMOND ── */}
            {/* Left lower facet */}
            <polygon points="60,93 22,60 60,66" fill="#7090CC" fillOpacity="0.85"/>
            {/* Right lower facet */}
            <polygon points="60,93 98,60 60,66" fill="#5070AA" fillOpacity="0.75"/>
            {/* Left mid facet */}
            <polygon points="60,23 22,60 60,66" fill="#B0D8FF" fillOpacity="0.9"/>
            {/* Right mid facet */}
            <polygon points="60,23 98,60 60,66" fill="#80B8E8" fillOpacity="0.85"/>
            {/* Left upper facet */}
            <polygon points="60,23 40,46 22,60" fill="#D8F0FF" fillOpacity="0.95"/>
            {/* Right upper facet */}
            <polygon points="60,23 80,46 98,60" fill="#B0D8F0" fillOpacity="0.9"/>
            {/* Center ridge */}
            <polygon points="60,23 60,66 40,46" fill="#EEFAFF" fillOpacity="0.95"/>
            <polygon points="60,23 60,66 80,46" fill="#C8E8FF" fillOpacity="0.9"/>

            {/* Inner core glow */}
            <polygon points="60,23 98,60 60,93 22,60" fill="url(#pp-core)" fillOpacity="0.25"/>

            {/* Edge highlights (facet lines) */}
            <line x1="60" y1="23" x2="22" y2="60" stroke="#FFFFFF" strokeWidth="0.7" strokeOpacity="0.7"/>
            <line x1="60" y1="23" x2="98" y2="60" stroke="#D0F8FF" strokeWidth="0.7" strokeOpacity="0.6"/>
            <line x1="60" y1="23" x2="60" y2="93" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.3"/>
            <line x1="22" y1="60" x2="60" y2="93" stroke="#B9F2FF" strokeWidth="0.5" strokeOpacity="0.5"/>
            <line x1="98" y1="60" x2="60" y2="93" stroke="#A0D8FF" strokeWidth="0.5" strokeOpacity="0.4"/>
            <line x1="22" y1="60" x2="98" y2="60" stroke="#C0E8FF" strokeWidth="0.4" strokeOpacity="0.4"/>

            {/* Crown apex sparkle */}
            <circle cx="60" cy="23" r="3" fill="#FFFFFF" fillOpacity="0.9" filter="url(#pp-blur-sm)"/>
            <circle cx="60" cy="23" r="1.5" fill="#FFFFFF"/>

            {/* 4-point star sparkles */}
            {[[25,38],[95,40],[40,90],[82,88],[60,23]].map(([x,y,s=4],i) => (
                <g key={i} transform={`translate(${x},${y})`}>
                    <line x1="0" y1={-s} x2="0" y2={s} stroke="#FFFFFF" strokeWidth="0.7" strokeOpacity="0.6"/>
                    <line x1={-s} y1="0" x2={s} y2="0" stroke="#FFFFFF" strokeWidth="0.7" strokeOpacity="0.6"/>
                </g>
            ))}

            {/* Prismatic light beams */}
            <line x1="60" y1="23" x2="16" y2="10" stroke="#FF80FF" strokeWidth="0.5" strokeOpacity="0.3"/>
            <line x1="60" y1="23" x2="108" y2="14" stroke="#80FFFF" strokeWidth="0.5" strokeOpacity="0.3"/>
            <line x1="60" y1="23" x2="8" y2="50" stroke="#80FF80" strokeWidth="0.5" strokeOpacity="0.2"/>
        </svg>
    );
}

function EmberRelic() {
    return (
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
            <defs>
                <radialGradient id="er-glow" cx="50%" cy="80%" r="55%">
                    <stop offset="0%" stopColor="#FF4500" stopOpacity="0.6"/>
                    <stop offset="100%" stopColor="#FF4500" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="er-sphere" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="#3A1818"/>
                    <stop offset="50%" stopColor="#1A0808"/>
                    <stop offset="100%" stopColor="#080404"/>
                </radialGradient>
                <radialGradient id="er-crack-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFD700" stopOpacity="1"/>
                    <stop offset="40%" stopColor="#FF6347" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#FF4500" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="er-core" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFFC0"/>
                    <stop offset="30%" stopColor="#FFD700"/>
                    <stop offset="70%" stopColor="#FF4500"/>
                    <stop offset="100%" stopColor="#FF4500" stopOpacity="0"/>
                </radialGradient>
                <filter id="er-fire-blur">
                    <feGaussianBlur stdDeviation="2.5"/>
                </filter>
                <filter id="er-glow-filter">
                    <feGaussianBlur stdDeviation="4"/>
                </filter>
                <clipPath id="er-clip">
                    <circle cx="60" cy="60" r="35"/>
                </clipPath>
            </defs>

            {/* Outer atmospheric ember glow */}
            <circle cx="60" cy="60" r="42" fill="#FF2200" fillOpacity="0.08" filter="url(#er-glow-filter)"/>

            {/* Ground glow */}
            <ellipse cx="60" cy="107" rx="30" ry="7" fill="url(#er-glow)"/>

            {/* Glow aura behind sphere */}
            <circle cx="60" cy="60" r="37" fill="#FF4500" fillOpacity="0.2" filter="url(#er-fire-blur)"/>

            {/* ── SPHERE ── */}
            <circle cx="60" cy="60" r="35" fill="url(#er-sphere)"/>

            {/* Surface cracks with glow (underneath, blurred) */}
            <g clipPath="url(#er-clip)" filter="url(#er-fire-blur)" opacity="0.8">
                <line x1="60" y1="60" x2="60" y2="25" stroke="#FFD700" strokeWidth="4"/>
                <line x1="60" y1="60" x2="90" y2="35" stroke="#FF6347" strokeWidth="3"/>
                <line x1="60" y1="60" x2="92" y2="72" stroke="#FF4500" strokeWidth="3.5"/>
                <line x1="60" y1="60" x2="60" y2="95" stroke="#FF6347" strokeWidth="3"/>
                <line x1="60" y1="60" x2="28" y2="80" stroke="#FF4500" strokeWidth="2.5"/>
                <line x1="60" y1="60" x2="28" y2="42" stroke="#FFD700" strokeWidth="2"/>
            </g>

            {/* Surface cracks (sharp lines on top) */}
            <g clipPath="url(#er-clip)">
                <line x1="60" y1="60" x2="60" y2="25" stroke="#FFD700" strokeWidth="1.2" strokeOpacity="0.9"/>
                <line x1="60" y1="60" x2="90" y2="35" stroke="#FF8C00" strokeWidth="0.9" strokeOpacity="0.8"/>
                <line x1="60" y1="60" x2="92" y2="72" stroke="#FF6347" strokeWidth="1" strokeOpacity="0.8"/>
                <line x1="60" y1="60" x2="60" y2="95" stroke="#FF4500" strokeWidth="0.9" strokeOpacity="0.7"/>
                <line x1="60" y1="60" x2="28" y2="80" stroke="#FF4500" strokeWidth="0.8" strokeOpacity="0.7"/>
                <line x1="60" y1="60" x2="28" y2="42" stroke="#FFB800" strokeWidth="0.8" strokeOpacity="0.8"/>
                {/* Secondary micro-cracks */}
                <line x1="60" y1="44" x2="72" y2="33" stroke="#FF8C00" strokeWidth="0.6" strokeOpacity="0.5"/>
                <line x1="76" y1="64" x2="88" y2="58" stroke="#FF4500" strokeWidth="0.5" strokeOpacity="0.4"/>
            </g>

            {/* Center core glow */}
            <circle cx="60" cy="60" r="10" fill="url(#er-core)" filter="url(#er-fire-blur)"/>
            <circle cx="60" cy="60" r="5" fill="#FFFFC0" fillOpacity="0.9"/>
            <circle cx="60" cy="60" r="3" fill="#FFFFFF"/>

            {/* Sphere rim highlight (top-left) */}
            <path d="M 35,42 Q 38,30 52,28 Q 40,30 38,42 Z" fill="#5A2A2A" fillOpacity="0.6"/>
            <circle cx="44" cy="36" r="6" fill="#FFFFFF" fillOpacity="0.07"/>

            {/* Sphere edge */}
            <circle cx="60" cy="60" r="35" fill="none" stroke="#FF4500" strokeWidth="0.5" strokeOpacity="0.4"/>

            {/* Fire particles floating up */}
            <circle cx="52" cy="22" r="2" fill="#FF6347" fillOpacity="0.7"/>
            <circle cx="60" cy="16" r="1.5" fill="#FFD700" fillOpacity="0.8"/>
            <circle cx="68" cy="20" r="1" fill="#FF4500" fillOpacity="0.6"/>
            <circle cx="48" cy="14" r="1" fill="#FF6347" fillOpacity="0.5"/>
            <circle cx="72" cy="15" r="1.2" fill="#FFB800" fillOpacity="0.5"/>

            {/* Rook silhouette embossed on surface (dark, subtle) */}
            <g clipPath="url(#er-clip)" fillOpacity="0.12" fill="#2A0A0A">
                <rect x="53" y="68" width="14" height="2"/>
                <rect x="53" y="63" width="3" height="7"/>
                <rect x="64" y="63" width="3" height="7"/>
                <rect x="56" y="63" width="8" height="5"/>
                <rect x="51" y="62" width="18" height="2"/>
                <rect x="52" y="60" width="3" height="2"/>
                <rect x="57" y="60" width="3" height="2"/>
                <rect x="62" y="60" width="3" height="2"/>
                <rect x="67" y="60" width="3" height="2"/>
            </g>
        </svg>
    );
}

const ART_MAP: Record<BoxTier, React.FC> = {
    common: BronzeCrate,
    rare: SilverVault,
    epic: GoldCoffer,
    legendary: PlatinumPrism,
    seasonal: EmberRelic,
};

const FLOAT: Record<BoxTier, { y: number[]; dur: number }> = {
    common:   { y: [0, -5, 0],  dur: 4.8 },
    rare:     { y: [0, -4, 0],  dur: 4.4 },
    epic:     { y: [0, -6, 0],  dur: 4.2 },
    legendary:{ y: [0, -9, 0],  dur: 3.8 },
    seasonal: { y: [0, -7, 0],  dur: 3.6 },
};

export default function MysteryBoxArt({ tier, size = 116 }: { tier: BoxTier; size?: number }) {
    const Art = ART_MAP[tier];
    const { y, dur } = FLOAT[tier];

    return (
        <motion.div
            animate={{ y }}
            transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: size, height: size }}
            className="relative flex items-center justify-center"
        >
            <Art />
        </motion.div>
    );
}
