'use client';

import { useRouter } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import LessonViewer, { LessonStep } from "@/components/Academy/LessonViewer";
import { FaArrowLeft, FaTelegramPlane, FaCheck } from "react-icons/fa";
import { FaChessKnight } from "react-icons/fa6";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { apiFetch } from "@/lib/api";
import { useNavbarHide } from "@/context/NavbarContext";
import Confetti from "react-confetti";
import { mapBackendLessonStep } from "@/lib/lessonSteps";
import { useTelemetry } from "@/hooks/useTelemetry";

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
  const { trackEvent } = useTelemetry();

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
        trackEvent('academy_lesson_started', { lesson_id: lessonId });
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
        trackEvent('academy_lesson_completed', { lesson_id: lessonId, xp_reward: lessonData?.xp_reward || 50 });
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
   <div className="w-full h-full min-h-[70vh] flex flex-col items-center justify-center text-center px-4 max-w-sm md:max-w-xl lg:max-w-3xl mx-auto z-10">
  <motion.div
  initial={{ scale: 0.9, opacity: 0, y: 20 }}
  animate={{ scale: 1, opacity: 1, y: 0 }}
  className="w-full relative overflow-hidden group"
  >
  <div className="glass-panel p-8 md:p-12 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#121814] to-[#0a0f0c] shadow-[0_0_50px_rgba(16,185,129,0.2)] relative z-10">
    <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-all group-hover:bg-emerald-500/30" />
    
    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] mb-6 rotate-12 group-hover:rotate-0 transition-all duration-500">
      <FaCheck className="text-4xl text-white drop-shadow-md" />
    </div>

    <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500 mb-2 uppercase tracking-tight">LESSON COMPLETE!</h1>
    <p className="text-[11px] font-black text-emerald-400/80 mb-8 uppercase tracking-[0.2em]">You have mastered {lessonData.title}</p>
  
    {earnedXP && (
      <div className="flex justify-center mb-10">
        <div className="flex flex-col items-center justify-center w-full max-w-[200px] p-6 bg-gradient-to-br from-emerald-950/40 to-emerald-950/20 border border-emerald-500/30 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.2)] relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
          <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[40px] -ml-16 -mt-16 pointer-events-none" />
          
          <span className="text-emerald-400 font-black text-4xl drop-shadow-[0_2px_10px_rgba(16,185,129,0.6)] relative z-10">+{earnedXP}</span>
          <span className="text-[10px] text-emerald-500/80 font-black uppercase tracking-[0.3em] mt-2 relative z-10">Chess XP</span>
        </div>
      </div>
    )}
  
    <div className="flex flex-col md:flex-row gap-4 justify-center w-full">
      <Link href={`/${locale}/academy`} className="flex-1 w-full">
        <button className="w-full px-4 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest rounded-2xl cursor-pointer transition-all text-xs">
          Back
        </button>
      </Link>
      <a href={`https://t.me/share/url?url=https://t.me/Web3ChessBot/app&text=${encodeURIComponent(`I just mastered the "${lessonData.title}" lesson on Web3Chess Academy! ♟️🔥`)}`} target="_blank" rel="noopener noreferrer" className="flex-[2] w-full">
        <button className="w-full px-4 py-4 bg-gradient-to-r from-[#2AABEE] to-[#229ED9] hover:from-[#35b5f8] hover:to-[#2AABEE] text-white font-black uppercase tracking-widest rounded-2xl cursor-pointer shadow-[0_0_20px_rgba(42,171,238,0.5)] transition-all text-xs flex items-center justify-center gap-3">
          <FaTelegramPlane className="text-lg drop-shadow-md" /> Share Progress
        </button>
      </a>
    </div>
  </div>
  </motion.div>
  </div>
  <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={300} gravity={0.2} colors={['#10B981', '#F59E0B', '#3B82F6', '#FFFFFF']} style={{ zIndex: 0 }} />
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
