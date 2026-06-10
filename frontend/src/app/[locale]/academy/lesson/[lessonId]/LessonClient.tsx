'use client';

import { useRouter } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import LessonViewer, { LessonStep } from "@/components/Academy/LessonViewer";
import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { apiFetch } from "@/lib/api";

const OPENING_LESSON_STEPS: LessonStep[] = [
 {
 id: '1',
 type: 'text',
 title: 'Control the Center',
 content: '<p>The most important principle in the opening is to <strong>control the center</strong> (squares d4, e4, d5, e5).</p><p class="mt-2">By controlling these squares, you give your pieces mobility and restrict your opponent.</p>'
 },
 {
 id: '2',
 type: 'interactive_board',
 title: 'Your Turn',
 content: 'Play 1. e4 to stake a claim in the center.',
 fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
 solution: ['e2e4']
 },
 {
 id: '3',
 type: 'text',
 title: 'Develop User Pieces',
 content: '<p>Don\'t move the same piece twice! Get your Knights and Bishops out specifically to influence the center.</p>'
 },
 {
 id: '4',
 type: 'interactive_board',
 title: 'Develop the Knight',
 content: 'Develop your Knight to f3 to support the center.',
 fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
 solution: ['g1f3']
 }
];

const TACTICS_LESSON_STEPS: LessonStep[] = [
 {
 id: '1',
 type: 'text',
 title: 'The Fork',
 content: '<p>A <strong>fork</strong> is a tactical weapon where a single piece attacks two or more opponent pieces simultaneously.</p><p class="mt-2">Knights are notorious for their tricky fork patterns, especially royal forks attacking both King and Queen.</p>'
 },
 {
 id: '2',
 type: 'interactive_board',
 title: 'Deliver a Knight Fork',
 content: 'Play Nc7+ to fork the King and Rook.',
 fen: 'r3k3/8/8/3N4/8/8/8/4K3 w q - 0 1',
 solution: ['d5c7']
 },
 {
 id: '3',
 type: 'text',
 title: 'The Pin',
 content: '<p>A <strong>pin</strong> occurs when an attacking piece threatens a valuable piece that cannot move without exposing an even more valuable piece behind it.</p>'
 },
 {
 id: '4',
 type: 'interactive_board',
 title: 'Pin the Queen',
 content: 'Play Re1 to pin the black Queen to the King.',
 fen: '4k3/8/8/4q3/8/8/8/R3K3 w - - 0 1',
 solution: ['a1e1']
 }
];

const ENDGAME_LESSON_STEPS: LessonStep[] = [
 {
 id: '1',
 type: 'text',
 title: 'Rook Roller / Ladder Checkmate',
 content: '<p>The <strong>ladder mate</strong> is the simplest way to checkmate a lone King using two Rooks or a Rook and Queen.</p><p class="mt-2">By controlling adjacent ranks or files, you push the enemy King to the edge of the board.</p>'
 },
 {
 id: '2',
 type: 'interactive_board',
 title: 'Deliver the Ladder Mate',
 content: 'Play Ra8# to finish the ladder checkmate.',
 fen: '4k3/6R1/8/8/8/8/8/R3K3 w - - 0 1',
 solution: ['a1a8']
 }
];

interface LessonClientProps {
 lessonId: string;
}

export default function LessonClient({ lessonId }: LessonClientProps) {
 const router = useRouter();
 const [completed, setCompleted] = useState(false);
 const locale = useLocale();

 const getLessonDetails = () => {
 switch (lessonId) {
 case 'tactics-101':
 case 'tactical-patterns':
 return {
 title: "Tactical Patterns",
 track: "Intermediate Track",
 steps: TACTICS_LESSON_STEPS
 };
 case 'endgame-basics':
 return {
 title: "Endgame Basics",
 track: "Beginner Track",
 steps: ENDGAME_LESSON_STEPS
 };
 case 'opening-principles':
 default:
 return {
 title: "Opening Principles",
 track: "Beginner Track",
 steps: OPENING_LESSON_STEPS
 };
 }
 };

 const details = getLessonDetails();

  const handleComplete = async () => {
    try {
      await apiFetch("/api/v1/gamification/academy/complete-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_type: "lesson", item_id: lessonId })
      });
    } catch (e) {
      console.error("Failed to submit lesson completion", e);
    }
    setCompleted(true);
  };

 if (completed) {
 return (
 <LayoutWrapper className="pb-32 pt-6">
 <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center text-center px-4 max-w-sm mx-auto">
 <motion.div
 initial={{ scale: 0.8, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 className="glass-panel p-8 rounded-3xl border border-brand-border-opacity-10 bg-brand-surface shadow-sm"
 >
 <h1 className="text-3xl font-black text-brand-primary mb-1.5 uppercase leading-none">LESSON COMPLETE!</h1>
 <p className="text-xs font-bold text-brand-primary opacity-60 mb-8 uppercase tracking-wide">You have mastered the basics of {details.title}.</p>

 <div className="flex gap-4 justify-center">
 <Link href={`/${locale}/academy`}>
 <button className="px-6 py-3 bg-brand-primary text-brand-void font-black uppercase tracking-widest rounded-xl cursor-pointer shadow-sm text-xs">
 Back to Academy
 </button>
 </Link>
 </div>
 </motion.div>
 </div>
 </LayoutWrapper>
 );
 }

 return (
 <LayoutWrapper className="pb-32 pt-6">
 <div className="w-full max-w-sm mx-auto px-4 h-full">
 {/* Header */}
 <div className="flex items-center gap-4 mb-6">
 <Link href={`/${locale}/academy`} className="p-3 glass-panel rounded-xl text-brand-primary opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
 <FaArrowLeft />
 </Link>
 <div>
 <h1 className="text-xl font-black tracking-tight text-brand-primary uppercase leading-none mb-1">{details.title}</h1>
 <p className="text-[10px] text-brand-primary opacity-40 font-bold uppercase tracking-widest">{details.track}</p>
 </div>
 </div>

 <LessonViewer
 steps={details.steps}
 onComplete={handleComplete}
 />
 </div>
 </LayoutWrapper>
 );
}
