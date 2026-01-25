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
        <LayoutWrapper className="pb-24">
            <div className="flex flex-col items-center w-full max-w-md space-y-6">
                {/* Compact Brand Section */}
                <div className="flex flex-col items-center w-full mt-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-white text-4xl font-black italic tracking-tighter select-none mb-1"
                        style={{ fontFamily: 'system-ui' }}
                    >
                        X
                    </motion.div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">Antigravity AI</span>
                </div>

                {/* Profile Widget */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full glass-panel p-5 flex items-center justify-between group shadow-2xl relative"
                >
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 p-1 relative overflow-hidden">
                            {tgUser?.photo_url ? (
                                <img src={tgUser.photo_url} alt="Profile" className="w-full h-full rounded-xl object-cover" />
                            ) : (
                                <div className="w-full h-full rounded-xl bg-linear-to-br from-white/10 to-white/5 flex items-center justify-center text-2xl font-black text-white/40">
                                    {tgUser?.first_name?.[0] || "P"}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                {tgUser ? `${tgUser.first_name}` : "Player"}
                                {stats?.is_premium && (
                                    <span className="text-white text-sm"><FaStar /></span>
                                )}
                            </h2>
                            <div className="flex items-center gap-2 text-xs font-medium text-white/40">
                                <span className="flex items-center gap-1"> {stats?.wins || 0} Wins</span>
                                <span className="w-1 h-1 bg-white/10 rounded-full" />
                                <span>{stats?.elo || 1000} ELO</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                            <span className="text-[10px] font-bold text-white tracking-widest uppercase">Master</span>
                        </div>
                    </div>
                </motion.div>

                {/* Primary Action Button */}
                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => createGame('online')}
                    className="w-full h-40 action-button flex flex-col items-center justify-center gap-3 group relative"
                    disabled={isCreating}
                >
                    <div className="w-12 h-12 rounded-xl bg-black/10 flex items-center justify-center transition-all group-hover:scale-110">
                        <FaChessPawn className="text-black text-2xl" />
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-black tracking-widest uppercase">Execute Online</span>
                        <span className="text-[9px] font-bold text-black/40 tracking-[0.2em] uppercase">Matchmaking Logic</span>
                    </div>
                </motion.button>

                {/* Secondary Actions */}
                <div className="w-full grid grid-cols-2 gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => createGame('computer')}
                        className="glass-button w-full py-6 rounded-2xl flex flex-col items-center justify-center gap-3 group"
                        disabled={isCreating}
                    >
                        <FaRobot className="text-xl text-white/40 group-hover:text-white transition-colors" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">A.I. Combat</span>
                    </motion.button>

                    <Link href="/academy" className="w-full">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="glass-panel w-full py-6 flex flex-col items-center justify-center gap-3 cursor-pointer group"
                        >
                            <FaGraduationCap className="text-xl text-white/40 group-hover:text-white transition-colors" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Academy</span>
                        </motion.div>
                    </Link>
                </div>

                {/* Configuration item */}
                <Link href="/settings" className="w-full p-4 border border-white/10 rounded-2xl flex justify-between items-center bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-3">
                        <FaCog className="text-white/20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Configuration Control</span>
                    </div>
                    <span className="text-[9px] font-black text-white/20 uppercase">V1.5.0-ALPHA</span>
                </Link>

                <div className="flex flex-col items-center space-y-2 pt-4 opacity-10">
                    <span className="text-[9px] font-bold tracking-[0.5em] uppercase text-white">Antigravity Neural Matrix</span>
                </div>
            </div>
        </LayoutWrapper>
    );
}
