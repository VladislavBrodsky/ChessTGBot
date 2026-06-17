'use client';

import { useState, useEffect, Suspense } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import { apiFetch } from "@/lib/api";
import PuzzleBoard from "@/components/Academy/PuzzleBoard";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from "next/navigation";

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

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch(`/api/v1/gamification/academy/puzzles/${puzzleId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error("Premium locked or level not found.");
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
        // Save completed puzzle ID in local storage
        const solvedStr = localStorage.getItem("completed_puzzles");
        const solvedArray = solvedStr ? JSON.parse(solvedStr) : [];
        if (!solvedArray.includes(puzzleId)) {
          solvedArray.push(puzzleId);
          localStorage.setItem("completed_puzzles", JSON.stringify(solvedArray));
        }
      } else {
        const data = await res.json();
        alert(data.detail || "Verification failed");
      }
    } catch (e) {
      console.error(e);
      alert("Error verifying puzzle");
    }
  };

  return (
    <LayoutWrapper className="pb-32 pt-6">
      <div className="w-full max-w-sm mx-auto px-4 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/academy`} className="p-3 glass-panel rounded-xl text-brand-primary opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
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
            <div className="text-center py-12 text-xs font-bold text-brand-primary opacity-40 uppercase tracking-widest animate-pulse">
              Loading tactics board...
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
