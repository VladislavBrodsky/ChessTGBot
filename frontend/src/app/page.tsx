'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaChessPawn, FaGraduationCap, FaCog, FaRobot, FaStar } from "react-icons/fa";

export default function Home() {
    const [tgUser, setTgUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        // Init Telegram WebApp
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            setTgUser(tg.initDataUnsafe?.user);

            // Check for deep link (Auto-Join)
            const startParam = tg.initDataUnsafe?.start_param;
            if (startParam) {
                console.log("Auto-joining game:", startParam);
                window.location.href = `/game?id=${startParam}`;
            }

            // Fetch User Stats
            if (tg.initDataUnsafe?.user?.id) {
                fetch(`/api/v1/users/${tg.initDataUnsafe.user.id}`)
                    .then(res => res.json())
                    .then(data => {
                        setStats(data);
                    })
                    .catch(err => console.error("Failed to fetch Stats", err));
            }
        } else {
            // Dev Mode Mock
            setTgUser({ first_name: "Master", photo_url: null });
            setStats({ elo: 1250, wins: 15, losses: 5, draws: 2, is_premium: true });
        }
    }, []);

    const createGame = async (type: 'online' | 'computer' = 'online') => {
        if (isCreating) return;
        setIsCreating(true);
        try {
            const res = await fetch(`/api/v1/game/create?type=${type}`, { method: "POST" });
            if (!res.ok) throw new Error("Backend error");
            const data = await res.json();

            if (type === 'online' && window.Telegram?.WebApp) {
                window.Telegram.WebApp.switchInlineQuery(data.game_id, ["users", "groups", "channels"]);
            } else {
                window.location.href = `/game?id=${data.game_id}`;
            }
        } catch (e) {
            console.error("Failed to create game", e);
            alert("Error creating game. Is backend running?");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <LayoutWrapper className="pb-32 px-4 md:px-6">
            <div className="flex flex-col items-center w-full max-w-sm md:max-w-md mx-auto space-y-8 py-8">
                {/* Minimalist Brand Section */}
                <div className="flex flex-col items-center w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-white text-4xl md:text-5xl font-black italic tracking-tighter select-none mb-1 shadow-neon"
                    >
                        CHESS APP
                    </motion.div>
                    <div className="h-px w-16 bg-white/10 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/20">Neural Matrix Protocol</span>
                </div>

                {/* Profile Widget Container */}
                <div className="w-full space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full glass-panel p-5 flex items-center justify-between shadow-premium relative overflow-hidden group"
                    >
                        {/* Decorative background element */}
                        <div className="absolute -top-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none transform rotate-12">
                            <FaChessPawn size={120} />
                        </div>

                        <div className="flex items-center space-x-4 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-brand-elevated border border-white/5 p-1 relative shadow-inner-glow">
                                {tgUser?.photo_url ? (
                                    <img src={tgUser.photo_url} alt="Profile" className="w-full h-full rounded-xl object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-xl bg-linear-to-br from-white/10 to-transparent flex items-center justify-center text-xl font-black text-white/30">
                                        {tgUser?.first_name?.[0] || "?"}
                                    </div>
                                )}
                                {stats?.is_premium && (
                                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] text-black border-2 border-black">
                                        <FaStar />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col justify-center">
                                <h2 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2 leading-none mb-1.5">
                                    {tgUser?.first_name || "Unknown"}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none mb-0.5">Rating</span>
                                        <span className="text-xs font-black text-white/90">{stats?.elo || 1000} ELO</span>
                                    </div>
                                    <div className="w-px h-6 bg-white/5" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none mb-0.5">Victories</span>
                                        <span className="text-xs font-black text-white/90">{stats?.wins || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end justify-center relative z-10">
                            <div className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 shadow-inner-glow">
                                <span className="text-[10px] font-black text-white/60 tracking-tighter uppercase whitespace-nowrap">LVL 0{Math.floor((stats?.elo || 1000) / 200)}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Primary Action Button */}
                <div className="w-full grid grid-cols-1 gap-4">
                    <motion.button
                        whileHover={{ scale: 1.01, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => createGame('online')}
                        className="w-full h-36 action-button relative overflow-hidden flex flex-col items-center justify-center group shadow-premium"
                        disabled={isCreating}
                    >
                        <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-white/5 opacity-50" />
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center border border-black/10 group-hover:scale-110 group-hover:bg-black/10 transition-all duration-300">
                                <FaChessPawn size={24} className="text-black/70" />
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-xl font-black tracking-[0.2em]">EXECUTE MATCHMAKING</span>
                                <span className="text-[9px] font-bold opacity-30 tracking-[0.4em] mt-1 uppercase">Protocol Beta-7</span>
                            </div>
                        </div>
                    </motion.button>
                </div>

                {/* Secondary Tactical Actions */}
                <div className="w-full grid grid-cols-2 gap-4">
                    <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => createGame('computer')}
                        className="glass-button w-full py-6 flex flex-col items-center justify-center gap-3 group border-white/5 hover:border-white/20 transition-all"
                        disabled={isCreating}
                    >
                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                            <FaRobot className="text-xl text-white/40 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest">AI Training</span>
                    </motion.button>

                    <Link href="/academy" className="w-full">
                        <motion.div
                            whileHover={{ y: -2, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="glass-panel w-full py-6 flex flex-col items-center justify-center gap-3 cursor-pointer group border-white/5 hover:border-white/20 transition-all shadow-none"
                        >
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                <FaGraduationCap className="text-xl text-white/40 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest">Academy</span>
                        </motion.div>
                    </Link>
                </div>

                {/* System Control Panel */}
                <div className="w-full pt-4 border-t border-white/5">
                    <Link href="/settings" className="flex items-center justify-between p-4 rounded-2xl bg-brand-surface/50 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 group-hover:bg-white/10 group-hover:rotate-45 transition-all duration-500">
                                <FaCog className="text-white/40 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors">Configuration</span>
                                <span className="text-[8px] font-bold text-white/10 uppercase tracking-tighter">System Parameters v1.2</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                            <span className="text-[9px] font-black text-white/10 group-hover:text-white/30 transition-colors">ACTIVE</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 animate-pulse" />
                        </div>
                    </Link>
                </div>

                {/* Footer Decor */}
                <footer className="flex flex-col items-center py-6 select-none pointer-events-none opacity-10 w-full">
                    <div className="flex items-center gap-4 w-full px-8">
                        <div className="h-px flex-1 bg-linear-to-r from-transparent to-white/20" />
                        <span className="text-[8px] font-black tracking-[1.5em] uppercase text-white/40 shrink-0">ANTIGRAVITY</span>
                        <div className="h-px flex-1 bg-linear-to-l from-transparent to-white/20" />
                    </div>
                </footer>
            </div>
        </LayoutWrapper>
    );
}
