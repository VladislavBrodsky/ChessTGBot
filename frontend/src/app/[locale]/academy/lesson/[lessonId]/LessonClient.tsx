'use client';

import { useRouter } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import LessonViewer, { LessonStep } from "@/components/Academy/LessonViewer";
import { FaArrowLeft, FaTelegramPlane } from "react-icons/fa";
import { FaChessKnight } from "react-icons/fa6";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { apiFetch } from "@/lib/api";
import { useNavbarHide } from "@/context/NavbarContext";
import Confetti from "react-confetti";
import { mapBackendLessonStep } from "@/lib/lessonSteps";

interface LessonClientProps {
 lessonId: string;
}

export default function LessonClient({ lessonId }: LessonClientProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);
  const [earnedXP, setEarnedXP] = useState<number | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const locale = useLocale();

  const [lessonData, setLessonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { hideNavbar, showNavbar } = useNavbarHide();

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    hideNavbar();
    return () => {
      showNavbar();
    };
  }, [hideNavbar, showNavbar]);

  useEffect(() => {
    apiFetch(`/api/v1/content/lessons/${lessonId}?locale=${locale}`)
      .then(res => {
        if (!res.ok) throw new Error("Lesson not found");
        return res.json();
      })
      .then(data => {
        const steps = data.steps.map((step: any) => mapBackendLessonStep(step, data.title));
        setLessonData({ ...data, steps });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [lessonId, locale]);

  const handleComplete = async () => {
    try {
      const res = await apiFetch('/api/v1/gamification/academy/complete-task', {
        method: 'POST',
        body: JSON.stringify({
          task_type: 'lesson',
          item_id: lessonId
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setEarnedXP(lessonData?.xp_reward || 50);
        setCompleted(true);
      } else {
        console.error('Failed to complete lesson');
        alert("Failed to submit lesson progress to the server. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error: failed to submit lesson progress.");
    }
  };

  if (loading) {
    return (
      <LayoutWrapper className="w-full">
        <div className="flex h-[calc(100vh-var(--app-safe-top)-var(--app-safe-bottom))] items-center justify-center flex-col gap-4">
          <FaChessKnight className="text-brand-primary animate-pulse drop-shadow-lg" size={48} />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse text-brand-primary/60">
            INITIALIZING LESSON...
          </p>
        </div>
      </LayoutWrapper>
    );
  }

  if (!lessonData) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-bg flex-col gap-4 px-6 text-center">
        <h2 className="text-xl font-black text-brand-primary uppercase tracking-widest">Signal Lost</h2>
        <p className="text-xs font-bold text-brand-primary opacity-40 uppercase tracking-widest mb-4">Lesson coordinates not found.</p>
        <button 
          onClick={() => router.push(`/${locale}/academy`)} 
          className="px-6 py-3 border border-brand-primary/20 bg-brand-surface shadow-premium hover:bg-brand-primary/5 transition-colors rounded-2xl text-xs font-black uppercase tracking-widest text-brand-primary"
        >
          Return to Academy
        </button>
      </div>
    );
  }

  if (completed) {
   return (
   <LayoutWrapper className="pt-6 relative">
   <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center text-center px-4 max-w-sm md:max-w-xl lg:max-w-3xl mx-auto z-10">
  <motion.div
  initial={{ scale: 0.9, opacity: 0, y: 20 }}
  animate={{ scale: 1, opacity: 1, y: 0 }}
  className="glass-panel p-8 rounded-3xl border border-emerald-500/30 bg-brand-surface shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden"
  >
  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none" />
  
  <h1 className="text-3xl font-black text-emerald-400 mb-2 uppercase leading-none">LESSON COMPLETE!</h1>
  <p className="text-xs font-bold text-brand-primary opacity-60 mb-6 uppercase tracking-wide">You have mastered the basics of {lessonData.title}.</p>
 
  {earnedXP && (
    <div className="flex justify-center mb-8">
      <div className="flex flex-col items-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl min-w-[100px]">
        <span className="text-amber-400 font-black text-2xl">+{earnedXP}</span>
        <span className="text-[10px] text-amber-400/60 font-black uppercase tracking-widest mt-1">Chess XP</span>
      </div>
    </div>
  )}
 
  <div className="flex gap-4 justify-center w-full mt-2">
  <Link href={`/${locale}/academy`} className="flex-1">
  <button className="w-full px-4 py-4 bg-brand-surface border border-brand-border-opacity-20 hover:bg-brand-bg-opacity-10 text-brand-primary font-black uppercase tracking-widest rounded-xl cursor-pointer transition-all text-xs">
  Back
  </button>
  </Link>
  <a href={`https://t.me/share/url?url=https://t.me/Web3ChessBot/app&text=${encodeURIComponent(`I just mastered the "${lessonData.title}" lesson on Web3Chess Academy! ♟️🔥`)}`} target="_blank" rel="noopener noreferrer" className="flex-[2]">
  <button className="w-full px-4 py-4 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-black uppercase tracking-widest rounded-xl cursor-pointer shadow-[0_0_15px_rgba(42,171,238,0.4)] transition-all text-xs flex items-center justify-center gap-2">
  <FaTelegramPlane className="text-lg" /> Share
  </button>
  </a>
  </div>
  </motion.div>
  </div>
  <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={250} gravity={0.15} colors={['#10B981', '#F59E0B', '#3B82F6', '#FFFFFF']} style={{ zIndex: 0 }} />
  </LayoutWrapper>
  );
  }

  return (
  <LayoutWrapper className="pt-6">
  <div className="w-full max-w-sm md:max-w-xl lg:max-w-3xl mx-auto px-4 h-full flex flex-col">
 {/* Header */}
 <div className="flex items-center gap-4 mb-6">
 <Link href={`/${locale}/academy`} className="html-back-button p-3 glass-panel rounded-xl text-brand-primary opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
 <FaArrowLeft />
 </Link>
 <div>
 <h1 className="text-xl font-black tracking-tight text-brand-primary uppercase leading-none mb-1">{lessonData.title}</h1>
 <p className="text-[10px] text-brand-primary opacity-40 font-bold uppercase tracking-widest">{lessonData.track}</p>
 </div>
 </div>

      <LessonViewer
        steps={lessonData.steps}
        onComplete={handleComplete}
      />
 </div>
 </LayoutWrapper>
 );
}
