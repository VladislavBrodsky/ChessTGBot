'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaChessPawn, FaGraduationCap, FaCog, FaRobot } from "react-icons/fa";

export default function Home() {
    const [tgUser, setTgUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);

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
            // Dev Mode Mock Fetch
            fetch(`/api/v1/users/12345`)
                .then(res => res.json())
                .then(data => {
                    setStats(data);
                    setTgUser({ first_name: data.first_name, photo_url: null });
                })
                .catch(err => console.error("Failed to fetch Stats (Dev)", err));
        }
    }, []);

    const createGame = async () => {
        try {
            const res = await fetch("/api/v1/game/create", { method: "POST" });
            const data = await res.json();

            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.switchInlineQuery(data.game_id, ["users", "groups", "channels"]);
            } else {
                window.location.href = `/game?id=${data.game_id}`;
            }
        } catch (e) {
            console.error("Failed to create game", e);
            alert("Error creating game. Is backend running?");
        }
    };

    return (
        <LayoutWrapper>
            <div className="flex flex-col items-center w-full max-w-md space-y-8">
                {/* Header / Profile Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full glass-panel p-6 rounded-[2.5rem] flex flex-col items-center relative overflow-hidden group"
                >
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-nebula-cyan to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

                    {/* Inner subtle glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-nebula-purple/5 to-transparent pointer-events-none" />

                    <div className="w-24 h-24 rounded-full bg-black/40 border-4 border-nebula-purple p-1 mb-4 shadow-neon relative group-hover:scale-105 transition-transform duration-500">
                        {/* Avatar Placeholder or TG Photo */}
                        {tgUser?.photo_url ? (
                            <img src={tgUser.photo_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-nebula-purple to-nebula-cyan flex items-center justify-center text-3xl font-bold text-white">
                                {tgUser?.first_name?.[0] || "P"}
                            </div>
                        )}
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-nebula-void rounded-full shadow-lg" />
                    </div>

                    <div className="flex items-center space-x-2 mb-2 relative">
                        <h2 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                            {tgUser ? `${tgUser.first_name} ${tgUser.last_name || ''}` : "Player"}
                        </h2>
                        {stats?.is_premium && (
                            <motion.span
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                className="text-nebula-cyan"
                            >
                                <svg className="w-6 h-6 inline drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M22.5 12.5L20.85 10.61L21.08 8.12L18.66 7.57L17.38 5.43L15 6.43L12.62 5.43L11.34 7.57L8.92 8.12L9.15 10.61L7.5 12.5L9.15 14.39L8.92 16.88L11.34 17.43L12.62 19.57L15 18.57L17.38 19.57L18.66 17.43L21.08 16.88L20.85 14.39L22.5 12.5ZM10.29 15.34L7.85 12.89L8.91 11.83L10.29 13.22L14.07 9.44L15.13 10.5L10.29 15.34Z" />
                                </svg>
                            </motion.span>
                        )}
                    </div>

                    <div className="flex items-center space-x-3 px-5 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
                        <span className="text-yellow-400 text-lg animate-pulse-slow">★</span>
                        <span className="font-mono font-bold text-nebula-cyan tracking-wider">{stats?.elo || 1000} ELO</span>
                    </div>
                </motion.div>

                {/* Main Actions */}
                <div className="w-full grid grid-cols-1 gap-5">
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={createGame}
                        className="glass-button w-full py-6 rounded-[2rem] flex items-center justify-center space-x-5 border-nebula-cyan/30 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-nebula-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-14 h-14 rounded-2xl bg-nebula-cyan/20 flex items-center justify-center group-hover:bg-nebula-cyan/30 transition-all duration-300 transform group-hover:rotate-12">
                            <FaChessPawn className="text-nebula-cyan text-2xl drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
                        </div>
                        <div className="flex flex-col items-start relative z-10">
                            <span className="text-xl font-black tracking-tight text-white uppercase">Play Online</span>
                            <span className="text-sm font-medium text-white/50">Challenge anyone globally</span>
                        </div>
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className="glass-button w-full py-6 rounded-[2rem] flex items-center justify-center space-x-5 border-white/5 group relative overflow-hidden grayscale hover:grayscale-0 opacity-80 hover:opacity-100 transition-all duration-500"
                        onClick={() => alert("AI Opponent coming soon!")}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-nebula-purple/20 flex items-center justify-center group-hover:bg-nebula-purple/30 transition-all duration-300 transform group-hover:scale-110">
                            <FaRobot className="text-nebula-purple text-2xl drop-shadow-[0_0_10px_rgba(123,44,191,0.5)]" />
                        </div>
                        <div className="flex flex-col items-start relative z-10">
                            <span className="text-xl font-black tracking-tight text-white uppercase opacity-70 group-hover:opacity-100">Play Computer</span>
                            <span className="text-sm font-medium text-white/40 group-hover:text-white/60">Stockfish 16 Engine</span>
                        </div>
                    </motion.button>
                </div>

                {/* Secondary Actions (Grid) */}
                <div className="w-full grid grid-cols-2 gap-5">
                    <Link href="/academy" className="w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            className="glass-panel w-full py-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 h-40 group cursor-pointer border-white/5 hover:border-pink-500/30 transition-colors"
                        >
                            <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 transition-all">
                                <FaGraduationCap className="text-4xl text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.4)]" />
                            </div>
                            <span className="font-bold tracking-tight uppercase text-white/80 group-hover:text-white">Academy</span>
                        </motion.div>
                    </Link>

                    <Link href="/settings" className="w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            className="glass-panel w-full py-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 h-40 group cursor-pointer border-white/5 hover:border-gray-400/30 transition-colors"
                        >
                            <div className="w-16 h-16 rounded-full bg-gray-500/10 flex items-center justify-center group-hover:bg-gray-500/20 transition-all">
                                <FaCog className="text-4xl text-gray-400 drop-shadow-[0_0_15px_rgba(156,163,175,0.4)]" />
                            </div>
                            <span className="font-bold tracking-tight uppercase text-white/80 group-hover:text-white">Settings</span>
                        </motion.div>
                    </Link>
                </div>

                <div className="text-[10px] font-black tracking-[0.2em] uppercase opacity-30 mt-12 py-2 px-4 rounded-full border border-white/10">
                    Engineered by Antigravity • v1.2.0-PREMIUM
                </div>
            </div>
        </LayoutWrapper>
    );
}
