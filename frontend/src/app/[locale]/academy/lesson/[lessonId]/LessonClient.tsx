'use client';

import { useRouter } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import LessonViewer, { LessonStep } from "@/components/Academy/LessonViewer";
import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { apiFetch } from "@/lib/api";
import { useNavbarHide } from "@/context/NavbarContext";
import Confetti from "react-confetti";

const ORIGINS_LESSON_STEPS: LessonStep[] = [
  {
    id: '1',
    type: 'text',
    title: 'Origins of the Royal Game',
    content: '<p>Chess is believed to have originated in India in the 6th century under the name <strong>Chaturanga</strong>. From there, it spread to Persia, the Islamic world, and eventually Europe, evolving into the modern game we know today.</p><p class="mt-4">For centuries, it has been the ultimate test of strategy, intellect, and willpower between two minds.</p>'
  },
  {
    id: '2',
    type: 'text',
    title: 'The Ultimate Brain Workout',
    content: '<p>Playing chess is a full-brain workout. It activates both hemispheres of your brain, improving memory, cognitive function, and problem-solving skills.</p><p class="mt-4">Grandmasters have been known to burn up to 6,000 calories a day during intense tournaments simply by thinking hard. By training your mind here, you are sharpening your focus for real life.</p>'
  },
  {
    id: '3',
    type: 'text',
    title: 'Web3Chess: Massive Gains',
    content: '<p>Here in Web3Chess, your intellectual superiority translates directly into digital assets. Every time you outsmart an opponent, complete a puzzle, or invite a friend, you earn XP and USDT.</p><p class="mt-4">You are no longer just playing a game; you are participating in a decentralized intellectual economy. <strong>Play, learn, and earn massive gains!</strong></p>'
  }
];

const OPENING_LESSON_STEPS: LessonStep[] = [
 {
 id: '1',
 type: 'text',
 title: 'The Philosophy of the Opening',
 content: '<p>Welcome to the Academy! As a professional coach, I\'ll tell you the secret of the opening: <strong>Time, Space, and Harmony</strong>.</p><p class="mt-4">The most critical principle is to <strong>control the center</strong> (the squares d4, e4, d5, e5). Whoever controls the center dictates the flow of the game, just like claiming the high ground in a battle.</p>'
 },
 {
 id: '2',
 type: 'interactive_board',
 title: 'Stake Your Claim',
 content: 'Play <strong>1. e4</strong> to stake a claim in the center and open lines for your Bishop and Queen.',
 fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
 solution: ['e2e4'],
 hintText: 'The center squares are d4, e4, d5, e5. Move your e-pawn two squares forward to e4.',
 successExplanation: 'Excellent! 1. e4 controls d5 and f5, and frees your light-squared bishop and queen for rapid development.'
 },
 {
 id: '3',
 type: 'interactive_board',
 title: 'Develop with Purpose',
 content: 'Now that the center is claimed, bring out your minor pieces (Knights before Bishops). Develop your Kingside Knight to its most active square.',
 fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
 solution: ['g1f3'],
 hintText: 'Develop the Knight on g1 to f3, attacking the black pawn on e5.',
 successExplanation: 'Perfect! 2. Nf3 develops a piece, controls the center, and attacks Black\'s pawn on e5 immediately. Knights belong on c3 and f3.'
 },
 {
 id: '4',
 type: 'text',
 title: 'King Safety',
 content: '<p>Once your center is established and minor pieces are developed, your final opening task is <strong>King Safety</strong>.</p><p class="mt-4">Always aim to <strong>castle early</strong> (usually within the first 10 moves). A king stuck in the center is a primary target for tactical combinations.</p>'
 }
];

const TACTICS_LESSON_STEPS: LessonStep[] = [
 {
 id: '1',
 type: 'text',
 title: 'Forcing Moves',
 content: '<p>Tactics are the execution of short-term plans to win material or deliver checkmate. The golden rule of tactics is to look for <strong>Forcing Moves</strong>: Checks, Captures, and Threats.</p>'
 },
 {
 id: '2',
 type: 'interactive_board',
 title: 'The Royal Fork',
 content: 'A <strong>fork</strong> is when one piece attacks two pieces simultaneously. Find the Knight fork that attacks both the King and the Rook.',
 fen: 'r3k3/8/8/3N4/8/8/8/4K3 w q - 0 1',
 solution: ['d5c7'],
 hintText: 'Look for a square where the Knight can deliver a check to the King on e8 while simultaneously attacking the Rook on a8.',
 successExplanation: 'Brilliant! Nc7+ forces the King to move out of check, leaving the Rook defenseless on the next turn. This is a classic Royal Fork.'
 },
 {
 id: '3',
 type: 'interactive_board',
 title: 'The Absolute Pin',
 content: 'A <strong>pin</strong> paralyzes an enemy piece. Find a move that pins the Black Queen to the King.',
 fen: '4k3/8/8/4q3/8/8/8/R3K3 w - - 0 1',
 solution: ['a1e1'],
 hintText: 'Find a piece that can attack the Queen while lining up perfectly with the King behind it on the e-file.',
 successExplanation: 'Great job! Re1 creates an Absolute Pin. The Black Queen cannot move because doing so would expose the King to check, which is illegal. The Queen is lost.'
 },
 {
 id: '4',
 type: 'interactive_board',
 title: 'The Skewer',
 content: 'A <strong>skewer</strong> is the opposite of a pin: you attack the more valuable piece first, forcing it to move and exposing a lesser piece behind it. Skewer the King to win the Queen.',
 fen: '8/4k3/8/8/4q3/8/8/4R1K1 w - - 0 1',
 solution: ['e1e4', 'e1e7'],
 hintText: 'Bring your Rook to the same file as the King and Queen, attacking the King first.',
 successExplanation: 'Nailed it! Re7+ forces the King to move. Once the King escapes the check, the Queen behind him falls. A deadly skewer!'
 }
];

const ENDGAME_LESSON_STEPS: LessonStep[] = [
 {
 id: '1',
 type: 'text',
 title: 'The Endgame Mindset',
 content: '<p>Welcome to the Endgame. Here, the board is empty, pawns become future queens, and your King transforms from a VIP hiding in a bunker into your most powerful attacking piece.</p>'
 },
 {
 id: '2',
 type: 'interactive_board',
 title: 'The Ladder Checkmate',
 content: 'Use your two Rooks to push the enemy King to the edge of the board. Deliver the final blow.',
 fen: '4k3/6R1/8/8/8/8/8/R3K3 w - - 0 1',
 solution: ['a1a8'],
 hintText: 'The Rook on g7 prevents the King from stepping forward. Use your other Rook to attack the rank the King is on.',
 successExplanation: 'Checkmate! By alternating ranks, the two rooks act like feet climbing a ladder, forcing the king to the edge with nowhere left to run.'
 },
 {
 id: '3',
 type: 'interactive_board',
 title: 'The Box Checkmate (Q vs K)',
 content: 'When you have a Queen, you must trap the King in a "box". Move the Queen a Knight\'s distance away from the King to shrink the box.',
 fen: '8/8/8/4k3/8/8/8/1Q2K3 w - - 0 1',
 solution: ['b1b4', 'b1f5', 'b1g6', 'b1d3'],
 hintText: 'Move the Queen to a square where it forms an "L" shape (like a Knight\'s move) relative to the black King on e5.',
 successExplanation: 'Well done! By staying a Knight\'s move away, you systematically shrink the box the King can walk in until he is trapped in the corner.'
 }
];

interface LessonClientProps {
 lessonId: string;
}

 export default function LessonClient({ lessonId }: LessonClientProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);
  const [earnedXP, setEarnedXP] = useState<number | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const locale = useLocale();

 const { hideNavbar, showNavbar } = useNavbarHide();

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    hideNavbar();
    return () => {
     showNavbar();
   };
 }, [hideNavbar, showNavbar]);

 const getLessonDetails = () => {
 switch (lessonId) {
 case 'origins-of-chess':
 return {
 title: "Origins & Motivation",
 track: "Introductory Track",
 steps: ORIGINS_LESSON_STEPS
 };
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
       const res = await apiFetch("/api/v1/gamification/academy/complete-task", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ task_type: "lesson", item_id: lessonId })
       });
       if (res.ok) {
         setEarnedXP(50); // Lessons give 50 XP
       }
     } catch (e) {
       console.error("Failed to submit lesson completion", e);
     }
     setCompleted(true);
   };

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
  <p className="text-xs font-bold text-brand-primary opacity-60 mb-6 uppercase tracking-wide">You have mastered the basics of {details.title}.</p>
 
  {earnedXP && (
    <div className="flex justify-center mb-8">
      <div className="flex flex-col items-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl min-w-[100px]">
        <span className="text-amber-400 font-black text-2xl">+{earnedXP}</span>
        <span className="text-[10px] text-amber-400/60 font-black uppercase tracking-widest mt-1">Chess XP</span>
      </div>
    </div>
  )}
 
  <div className="flex gap-4 justify-center">
  <Link href={`/${locale}/academy`}>
  <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase tracking-widest rounded-xl cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all text-xs">
  Back to Academy
  </button>
  </Link>
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
