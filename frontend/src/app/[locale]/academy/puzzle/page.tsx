'use client';

import { useState, useEffect, Suspense } from "react";
import { PageHeader } from '@/components/ui/PageHeader';
import LayoutWrapper from "@/components/LayoutWrapper";
import { apiFetch } from "@/lib/api";
import PuzzleBoard from "@/components/Academy/PuzzleBoard";
import { motion } from "framer-motion";
import { FaTelegramPlane } from "react-icons/fa";
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
    <LayoutWrapper className="">
      <div className="w-full app-page mx-auto ">

        <PageHeader title={puzzle ? puzzle.title : 'Tactical level'} description={puzzle ? puzzle.description : 'Solve the puzzle'} backHref={`/${locale}/academy`} />

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
            <div className="text-center py-12 text-sm font-bold text-rose-400 normal-case tracking-normal">
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
            
            <h2 className="text-2xl font-semibold text-emerald-400 mb-2 normal-case tracking-tight">{t('excellent')}</h2>
            <p className="text-sm font-bold text-brand-muted normal-case tracking-normal mb-4">Level Completed Successfully</p>
            
            {earnedXP && (
              <div className="flex justify-center gap-4 mb-6">
                <div className="flex flex-col items-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl min-w-[80px]">
                  <span className="text-emerald-400 font-semibold text-xl">+{earnedXP}</span>
                  <span className="text-caption text-emerald-400/60 font-semibold normal-case tracking-normal">XP</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl min-w-[80px]">
                  <span className="text-blue-400 font-semibold text-xl">+{earnedELO}</span>
                  <span className="text-caption text-blue-400/60 font-semibold normal-case tracking-normal">ELO</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 justify-center w-full mt-2">
              <Link href={`/${locale}/academy`} className="flex-1">
                <button type="button" className="ui-tap-target w-full px-4 py-3.5 bg-brand-elevated border border-brand-border hover:border-brand-border-opacity-30 text-brand-primary font-semibold normal-case tracking-normal rounded-xl cursor-pointer transition-all text-sm">
                  {t('continue')}
                </button>
              </Link>
              <a href={`https://t.me/share/url?url=https://t.me/chess_matbot/app&text=${encodeURIComponent(`I just cracked a tactical puzzle on Web3Chess Academy! ♟️🔥 Can you solve it?`)}`} target="_blank" rel="noopener noreferrer" className="flex-[2]">
                <button type="button" className="ui-tap-target w-full px-4 py-3.5 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-semibold normal-case tracking-normal rounded-xl cursor-pointer shadow-[0_0_15px_rgba(42,171,238,0.4)] transition-all text-sm flex items-center justify-center gap-2">
                  <FaTelegramPlane className="text-base" /> Share
                </button>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-brand-muted font-semibold normal-case tracking-normal animate-pulse">Initializing Tactics...</div>}>
      <PuzzleContent />
    </Suspense>
  );
}
