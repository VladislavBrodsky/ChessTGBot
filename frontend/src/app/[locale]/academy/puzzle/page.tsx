'use client';

import { useState, useEffect, Suspense } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import { apiFetch } from "@/lib/api";
import PuzzleBoard from "@/components/Academy/PuzzleBoard";
import { motion } from "framer-motion";
import { FaArrowLeft, FaTelegramPlane } from "react-icons/fa";
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from "next/navigation";
import { useNavbarHide } from "@/context/NavbarContext";
import Confetti from "react-confetti";

function PuzzleContent() {
  const [solved, setSolved] = useState(false);
  const [earnedXP, setEarnedXP] = useState<number | null>(null);
  const [earnedELO, setEarnedELO] = useState<number | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const locale = useLocale();
  const t = useTranslations('Academy');
  const searchParams = useSearchParams();
  
  const puzzleIdStr = searchParams?.get("id") || "1";
  const puzzleId = parseInt(puzzleIdStr);

  const [puzzle, setPuzzle] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const { hideNavbar, showNavbar } = useNavbarHide();

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    hideNavbar();
    return () => {
      showNavbar();
    };
  }, [hideNavbar, showNavbar]);

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch(`/api/v1/gamification/academy/puzzles/${puzzleId}`)
      .then(async res => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to load puzzle.");
        }
        return res.json();
      })
      .then(data => {
        setPuzzle(data);
      })
      .catch(err => {
        setError(err.message || "Failed to load puzzle");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [puzzleId]);

  const handleSolve = async (data?: any) => {
    setSolved(true);
    if (data) {
      if (data.status === "success" && !data.message?.includes("Already solved")) {
        setEarnedXP(puzzle?.xp_reward || 50);
        setEarnedELO(5);
        new Audio('/sounds/win.mp3').play().catch(e => console.log('Audio play blocked:', e));
      }
      return;
    }

    if (!puzzle || !puzzle.solution) return;
    try {
      const res = await apiFetch(`/api/v1/gamification/academy/puzzles/${puzzle.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ move: puzzle.solution[0] })
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.status === "success" && !resData.message?.includes("Already solved")) {
          setEarnedXP(puzzle.xp_reward);
          setEarnedELO(5);
          new Audio('/sounds/win.mp3').play().catch(e => console.log('Audio play blocked:', e));
        }
      }
    } catch (e) {
      console.error("Failed to verify puzzle completion", e);
    }
  };

  return (
    <LayoutWrapper className="pb-32 pt-6">
      <div className="w-full max-w-sm md:max-w-xl lg:max-w-3xl mx-auto px-4 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/academy`} aria-label="Back to academy" className="html-back-button p-3 glass-panel rounded-xl text-brand-muted hover:opacity-100 transition-opacity cursor-pointer">
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-brand-primary uppercase leading-none mb-1">
              {puzzle ? puzzle.title : "Tactical Level"}
            </h1>
            <p className="text-xs text-brand-muted font-bold uppercase tracking-widest">
              {puzzle ? puzzle.description : "Solve the puzzle"}
            </p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-brand-border-opacity-10 bg-brand-surface shadow-sm">
          {loading ? (
            <div className="w-full flex flex-col items-center justify-center space-y-5 animate-pulse">
              <div className="w-full max-w-[280px] aspect-square rounded-xl border border-brand-border-opacity-10 p-1.5 bg-brand-void/40 flex flex-col gap-0.5 shadow-inner">
                {Array.from({ length: 8 }).map((_, row) => (
                  <div key={row} className="flex-1 flex gap-0.5">
                    {Array.from({ length: 8 }).map((_, col) => {
                      const isDark = (row + col) % 2 === 1;
                      return (
                        <div
                          key={col}
                          className={`flex-1 rounded-[2px] ${
                            isDark 
                              ? 'bg-brand-primary/10 border border-brand-border-opacity-5' 
                              : 'bg-brand-primary/5'
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="h-2 bg-brand-primary opacity-10 rounded w-1/2" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-xs font-bold text-rose-400 uppercase tracking-wider">
              {error}
            </div>
          ) : puzzle ? (
            <PuzzleBoard
              key={puzzle.id}
              initialFen={puzzle.fen}
              solution={puzzle.solution}
              puzzleId={puzzle.id}
              onSolve={handleSolve}
              onFail={() => console.log('Wrong move')}
              hintsEnabled={puzzle.id <= 10}
            />
          ) : null}
        </div>

        {solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="p-6 bg-brand-surface border border-emerald-500/30 rounded-2xl text-center shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden"
          >
            {/* Glowing background */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none" />
            
            <h2 className="text-2xl font-black text-emerald-400 mb-2 uppercase tracking-tight">{t('excellent')}</h2>
            <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-4">Level Completed Successfully</p>
            
            {earnedXP && (
              <div className="flex justify-center gap-4 mb-6">
                <div className="flex flex-col items-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl min-w-[80px]">
                  <span className="text-emerald-400 font-black text-xl">+{earnedXP}</span>
                  <span className="text-[9px] text-emerald-400/60 font-black uppercase tracking-widest">XP</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl min-w-[80px]">
                  <span className="text-blue-400 font-black text-xl">+{earnedELO}</span>
                  <span className="text-[9px] text-blue-400/60 font-black uppercase tracking-widest">ELO</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-4 justify-center w-full mt-2">
              <Link href={`/${locale}/academy`} className="flex-1 w-full px-4 py-4 bg-brand-surface border border-brand-border-opacity-20 hover:bg-brand-bg-text-brand-muted font-black uppercase tracking-widest rounded-xl cursor-pointer transition-all text-xs flex items-center justify-center active:scale-[0.98]">
                {t('continue')}
              </Link>
              <a href={`https://t.me/share/url?url=https://t.me/Web3ChessBot/app&text=${encodeURIComponent(`I just cracked a daily tactical puzzle on Web3Chess Academy! ♟️🔥 Can you solve it?`)}`} target="_blank" rel="noopener noreferrer" className="flex-[2] w-full px-4 py-4 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-black uppercase tracking-widest rounded-xl cursor-pointer shadow-[0_0_15px_rgba(42,171,238,0.4)] transition-all text-xs flex items-center justify-center gap-2 active:scale-[0.98]">
                <FaTelegramPlane className="text-lg" /> Share
              </a>
            </div>
          </motion.div>
        )}
      </div>
      {solved && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={200} gravity={0.15} colors={['#10B981', '#F59E0B', '#3B82F6', '#FFFFFF']} />}
    </LayoutWrapper>
  );
}

export default function PuzzlePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-brand-muted font-black uppercase tracking-[0.5em] animate-pulse">Initializing Tactics...</div>}>
      <PuzzleContent />
    </Suspense>
  );
}
