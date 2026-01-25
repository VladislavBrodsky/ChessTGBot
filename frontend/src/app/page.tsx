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
        <LayoutWrapper>
            <div className="flex flex-col items-center w-full max-w-sm mx-auto space-y-6 px-4">
                {/* Minimalist Brand Section */}
                <div className="flex flex-col items-center w-full pt-6">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white text-3xl font-black italic tracking-tighter select-none mb-0.5"
                    >
                        CHESS APP
                    </motion.div>
                    <div className="h-px w-12 bg-white/20 mb-1" />
                    <span className="text-[8px] font-bold uppercase tracking-[0.5em] text-white/30">Neural Chess Matrix</span>
                </div>

                {/* Ultra-Compact Profile Widget */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full glass-panel p-4 flex items-center justify-between shadow-premium relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                        <FaChessPawn size={60} />
                    </div>

                    <div className="flex items-center space-x-3.5 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-brand-elevated border border-white/5 p-0.5 relative">
                            {tgUser?.photo_url ? (
                                <img src={tgUser.photo_url} alt="Profile" className="w-full h-full rounded-[10px] object-cover" />
                            ) : (
                                <div className="w-full h-full rounded-[10px] bg-linear-to-br from-white/5 to-transparent flex items-center justify-center text-lg font-black text-white/20">
                                    {tgUser?.first_name?.[0] || "?"}
                                </div>
                            )}
                            {stats?.is_premium && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] text-black border-2 border-black">
                                    <FaStar />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 leading-none mb-1">
                                {tgUser?.first_name || "Unknown"}
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{stats?.elo || 1000} ELO</span>
                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{stats?.wins || 0} Victories</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 relative z-10">
                        <div className="px-2 py-0.5 rounded-md border border-white/10 bg-white/5">
                            <span className="text-[9px] font-black text-white tracking-widest uppercase">RANK:001</span>
                        </div>
                    </div>
                </motion.div>

                {/* Main Control Interface */}
                <div className="w-full space-y-3">
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => createGame('online')}
                        className="w-full h-32 action-button relative overflow-hidden flex flex-col items-center justify-center group shadow-premium"
                        disabled={isCreating}
                    >
                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-50" />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-black/5 flex items-center justify-center border border-black/10 group-hover:scale-110 transition-transform">
                                <FaChessPawn size={20} className="text-black/80" />
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-base font-black tracking-[0.15em]">CORE MATCHMAKING</span>
                                <span className="text-[8px] font-bold opacity-40 -mt-1 tracking-[0.3em]">INITIATE PROTOCOL</span>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black/10" />
                    </motion.button>

                    <div className="grid grid-cols-2 gap-3">
                        <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => createGame('computer')}
                            className="glass-button w-full py-5 flex flex-col items-center justify-center gap-2.5 group"
                            disabled={isCreating}
                        >
                            <FaRobot className="text-lg text-white/30 group-hover:text-white transition-colors" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] leading-none">AI Training</span>
                        </motion.button>

                        <Link href="/academy" className="w-full">
                            <motion.div
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                className="glass-panel w-full py-5 flex flex-col items-center justify-center gap-2.5 group cursor-pointer"
                            >
                                <FaGraduationCap className="text-lg text-white/30 group-hover:text-white transition-colors" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] leading-none">Academy</span>
                            </motion.div>
                        </Link>
                    </div>
                </div>

                {/* System Controls */}
                <div className="w-full pt-2">
                    <Link href="/settings" className="flex items-center justify-between p-3.5 border border-white/5 rounded-xl bg-white/1 hover:bg-white/3 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                <FaCog className="text-white/30 group-hover:text-white/60 transition-colors text-xs" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors">Configuration</span>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-20 group-hover:opacity-40 transition-opacity">
                            <span className="text-[8px] font-black uppercase tracking-tighter">V.01.52</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        </div>
                    </Link>
                </div>

                {/* Footer Decor */}
                <div className="flex flex-col items-center py-4 select-none pointer-events-none opacity-5">
                    <div className="w-24 h-px bg-white mb-2" />
                    <span className="text-[7px] font-bold tracking-[1em] uppercase text-white">Neural Override Active</span>
                </div>
            </div>
        </LayoutWrapper>
    );
}
