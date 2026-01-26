'use client';

import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaShieldAlt, FaGamepad, FaTrophy, FaPalette, FaDownload } from 'react-icons/fa';

const COMPARISON_DATA = [
    { feature: "Play to Earn Protocols", basic: false, premium: true, icon: <FaShieldAlt /> },
    { feature: "Global Neural Ranking", basic: true, premium: true, icon: <FaTrophy /> },
    { feature: "3D Custom Matrix Skins", basic: false, premium: true, icon: <FaPalette /> },
    { feature: "HD Simulation Downloads", basic: false, premium: true, icon: <FaDownload /> },
    { feature: "Priority Matchmaking", basic: false, premium: true, icon: <FaGamepad /> },
    { feature: "Zero Protocol Ad-Matrix", basic: false, premium: true, icon: <FaShieldAlt /> },
];

export default function TierComparison() {
    return (
        <div className="w-full space-y-6 mt-12 pb-12">
            <div className="flex flex-col items-center space-y-2 mb-8">
                <h3 className="text-sm font-black text-brand-primary italic tracking-tighter uppercase leading-none">Protocol Comparison</h3>
                <div className="h-px w-8 bg-brand-primary/20" />
                <span className="text-[8px] font-bold text-brand-primary/10 tracking-[0.4em] uppercase">Value Matrix Analysis</span>
            </div>

            <div className="w-full glass-panel rounded-3xl overflow-hidden border-brand-primary/5 bg-brand-primary/2">
                {/* Table Header */}
                <div className="grid grid-cols-6 p-4 border-b border-brand-primary/5 bg-brand-primary/5">
                    <div className="col-span-3 text-[9px] font-black uppercase text-brand-primary/30 tracking-widest">Capability</div>
                    <div className="col-span-1.5 text-center text-[9px] font-black uppercase text-brand-primary/30 tracking-widest">Base</div>
                    <div className="col-span-1.5 text-center text-[9px] font-black uppercase text-brand-primary tracking-widest italic">Elite</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-brand-primary/5">
                    {COMPARISON_DATA.map((row, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="grid grid-cols-6 p-4 items-center group hover:bg-brand-primary/2 transition-colors"
                        >
                            <div className="col-span-3 flex items-center gap-3">
                                <div className="text-brand-primary/20 group-hover:text-brand-primary/40 transition-colors">
                                    {row.icon}
                                </div>
                                <span className="text-[10px] font-bold text-brand-primary/60 uppercase tracking-tight">
                                    {row.feature}
                                </span>
                            </div>
                            <div className="col-span-1.5 flex justify-center">
                                {row.basic ? (
                                    <FaCheck className="text-emerald-500/40" fontSize={10} />
                                ) : (
                                    <FaTimes className="text-brand-primary/10" fontSize={10} />
                                )}
                            </div>
                            <div className="col-span-1.5 flex justify-center">
                                {row.premium ? (
                                    <div className="relative">
                                        <FaCheck className="text-brand-primary drop-shadow-glow" fontSize={10} />
                                        <div className="absolute inset-0 bg-brand-primary/20 blur-md rounded-full -z-10" />
                                    </div>
                                ) : (
                                    <FaTimes className="text-brand-primary/10" fontSize={10} />
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Bottom Insight */}
            <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 text-center">
                <p className="text-[9px] font-black text-brand-primary italic opacity-60 uppercase tracking-widest">
                    Unlock full earning potential with elite synchronization
                </p>
            </div>
        </div>
    );
}
