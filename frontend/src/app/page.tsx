'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaChessPawn, FaGraduationCap, FaCog, FaRobot, FaTrophy, FaStar } from "react-icons/fa";

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
            <div className="flex flex-col items-center w-full max-w-md space-y-8 pt-4">
                {/* Status Bar / Quick Stats */}
                <div className="w-full flex justify-between gap-3 px-1">
                    <div className="flex-1 glass-panel py-3 px-4 rounded-3xl flex items-center justify-between border-white/5 bg-linear-to-br from-white/5 to-transparent">
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Streak</span>
                        <span className="text-lg font-black text-nebula-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">🔥 7</span>
                    </div>
                    <div className="flex-1 glass-panel py-3 px-4 rounded-3xl flex items-center justify-between border-white/5 bg-linear-to-br from-white/5 to-transparent">
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Rank</span>
                        <span className="text-lg font-black text-nebula-purple drop-shadow-[0_0_8px_rgba(123,44,191,0.4)]">#1.2k</span>
                    </div>
                </div>

                {/* Profile Section (Elevated) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full glass-panel p-6 rounded-4xl flex flex-col items-center relative overflow-hidden group border-white/10"
                >
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-linear-to-r from-transparent via-nebula-cyan/50 to-transparent" />

                    <div className="w-24 h-24 rounded-full bg-black/40 border-2 border-white/10 p-1 mb-4 relative z-10">
                        {tgUser?.photo_url ? (
                            <img src={tgUser.photo_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-linear-to-tr from-[#1a1a1a] to-[#333333] flex items-center justify-center text-4xl font-black text-white/20 select-none">
                                {tgUser?.first_name?.[0] || "P"}
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#000000] border-2 border-white/10 rounded-full flex items-center justify-center shadow-xl">
                            <span className="text-xs">⭐</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center relative z-10">
                        <h2 className="text-2xl font-black tracking-tight text-white mb-1">
                            {tgUser ? `${tgUser.first_name} ${tgUser.last_name || ''}` : "Grand Maestro"}
                        </h2>
                        <div className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-xl">
                            <div className="w-2 h-2 rounded-full bg-nebula-cyan animate-pulse shadow-[0_0_8px_rgba(0,240,255,1)]" />
                            <span className="font-mono text-xs font-black tracking-widest text-[#ffffff]/60 uppercase italic">Master League</span>
                        </div>
                    </div>
                </motion.div>

                {/* Performance Analytics */}
                <div className="w-full glass-panel p-6 rounded-4xl border-white/5 relative overflow-hidden">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] mb-1">Performance</h3>
                            <div className="text-3xl font-black text-white italic tracking-tighter">
                                {stats?.elo || 1240} <span className="text-sm font-bold text-nebula-cyan not-italic ml-1">ELO</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black uppercase text-green-500 tracking-widest">+42 pts</span>
                            <div className="text-[10px] font-medium text-white/20 uppercase">Last 7 Days</div>
                        </div>
                    </div>

                    <div className="h-20 w-full relative">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="glow-gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgba(0, 240, 255, 0.4)" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M0,80 Q50,40 100,60 T200,30 T300,50 T400,20 L400,80 L0,80"
                                fill="url(#glow-gradient)"
                                className="opacity-30"
                            />
                            <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                d="M0,80 Q50,40 100,60 T200,30 T300,50 T400,20"
                                fill="none"
                                stroke="rgba(0, 240, 255, 0.8)"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                </div>

                {/* Actions */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => createGame('online')}
                    className="w-full py-8 rounded-4xl relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-[#ffffff] transition-all group-hover:bg-[#f0f0f0]" />
                    <div className="relative z-10 flex items-center justify-center space-x-6 px-8">
                        <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 shadow-2xl">
                            <FaChessPawn className="text-white text-3xl" />
                        </div>
                        <div className="flex flex-col items-start pr-4">
                            <span className="text-2xl font-black text-black italic tracking-tighter uppercase leading-none">Find Match</span>
                            <span className="text-[10px] font-black text-black opacity-30 uppercase tracking-[0.2em] mt-1">Global Matchmaking</span>
                        </div>
                    </div>
                </motion.button>

                <div className="w-full grid grid-cols-2 gap-4">
                    <button
                        onClick={() => createGame('computer')}
                        className="glass-panel p-5 rounded-4xl border-white/5 flex flex-col items-start gap-4 group hover:bg-white/5 transition-all outline-none"
                    >
                        <div className="w-10 h-10 rounded-xl bg-nebula-purple/20 flex items-center justify-center">
                            <FaRobot className="text-nebula-purple" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-white/40">VS Stockfish</span>
                        </div>
                    </button>
                    <button className="glass-panel p-5 rounded-4xl border-white/5 flex flex-col items-start gap-4 group hover:bg-white/5 transition-all outline-none">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                            <FaGraduationCap className="text-pink-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-white/40">Academy</span>
                        </div>
                    </button>
                </div>

                <div className="flex flex-col items-center pt-8 opacity-20 scale-90 mb-12">
                    <span className="text-[9px] font-black tracking-[0.5em] uppercase mb-1">Neural Chess Matrix</span>
                    <span className="text-[8px] font-bold tracking-[0.2em]">Build 2501 ALPHA</span>
                </div>
            </div>
        </LayoutWrapper>
    );
}
