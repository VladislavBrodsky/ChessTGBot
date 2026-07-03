'use client';

import { useState, useEffect, Suspense } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import { apiFetch } from "@/lib/api";
import { telegramAlert } from "@/lib/telegram";
import PuzzleBoard from "@/components/Academy/PuzzleBoard";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from "next/navigation";
import { useNavbarHide } from "@/context/NavbarContext";

function PuzzleContent() {
  const [solved, setSolved] = useState(false);
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

  const handleSolve = async () => {
    try {
      const res = await apiFetch(`/api/v1/gamification/academy/puzzles/${puzzleId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solution: puzzle.solution })
      });
      if (res.ok) {
        setSolved(true);
      } else {
        const data = await res.json();
        telegramAlert(data.detail || "Verification failed");
      }
    } catch (e) {
      console.error(e);
      telegramAlert("Error verifying puzzle");
    }
  };

  return (
    <LayoutWrapper className="pb-32 pt-6">
      <div className="w-full max-w-sm mx-auto px-4 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/academy`} className="html-back-button p-3 glass-panel rounded-xl text-brand-primary opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-brand-primary uppercase leading-none mb-1">
              {puzzle ? puzzle.title : "Tactical Level"}
            </h1>
            <p className="text-xs text-brand-primary opacity-40 font-bold uppercase tracking-widest">
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
              initialFen={puzzle.fen}
              solution={puzzle.solution}
              onSolve={handleSolve}
              onFail={() => console.log('Wrong move')}
            />
          ) : null}
        </div>

        {solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-brand-surface border border-brand-border-opacity-20 rounded-2xl text-center shadow-sm"
          >
            <h2 className="text-xl font-black text-brand-primary mb-1.5 uppercase">{t('excellent')}</h2>
            <p className="text-xs font-bold text-brand-primary opacity-60 uppercase tracking-wide mb-5">{t('spotted_pattern')}</p>
            <Link href={`/${locale}/academy`}>
              <button className="w-full py-3 bg-brand-primary text-brand-void font-black uppercase tracking-widest text-xs rounded-xl cursor-pointer shadow-sm">
                {t('continue')}
              </button>
            </Link>
          </motion.div>
        )}
      </div>
    </LayoutWrapper>
  );
}

export default function PuzzlePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-brand-primary opacity-20 font-black uppercase tracking-[0.5em] animate-pulse">Loading tactics level...</div>}>
      <PuzzleContent />
    </Suspense>
  );
}
