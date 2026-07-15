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

const ORIGINS_LESSON_STEPS: LessonStep[] = [
  {
    id: '1',
    type: 'text',
    title: 'The Royal Game',
    content: '<div class="space-y-6"><p class="text-lg">Chess originated in India in the 6th century as <strong>Chaturanga</strong>. It evolved through Persia and Europe into the ultimate test of strategy.</p><div class="p-5 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 shadow-sm"><span class="block text-brand-primary font-black mb-2 uppercase tracking-widest text-[10px]">Fact</span><p class="text-sm opacity-80">For centuries, it has tested intellect and willpower of kings and commoners alike.</p></div></div>',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  },
  {
    id: '2',
    type: 'text',
    title: 'The Ultimate Workout',
    content: '<div class="space-y-6"><p class="text-lg">Playing chess is a full-brain workout. It activates both hemispheres, boosting memory and problem-solving.</p><div class="p-5 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-sm"><span class="block text-amber-500 font-black mb-2 uppercase tracking-widest text-[10px]">Did you know?</span><p class="text-sm opacity-80">Grandmasters can burn up to 6,000 calories a day during intense tournaments simply by thinking!</p></div></div>',
    fen: '1k1r3r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQ - 0 1'
  },
  {
    id: '3',
    type: 'text',
    title: 'Web3Chess',
    content: '<div class="space-y-6"><p class="text-lg">In Web3Chess, your intellectual superiority becomes digital assets. Outsmart opponents, solve puzzles, and earn XP and USDT.</p><div class="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.1)]"><p class="font-black text-emerald-400 text-2xl text-center uppercase tracking-[0.2em] animate-pulse">Play, Learn, Earn!</p></div></div>',
    fen: 'r1bq1rk1/ppp2ppp/2n5/3pP3/3Pn3/2b2N2/PP2BPPP/R1BQ1RK1 w - - 0 1'
  }
];

const OPENING_LESSON_STEPS: LessonStep[] = [
 {
 id: '1',
 type: 'text',
 title: 'The Opening Philosophy',
 content: '<div class="space-y-6"><p class="text-lg">Welcome to the Academy! The secret of the opening is: <strong class="text-brand-primary">Time, Space, and Harmony</strong>.</p><p class="text-lg text-brand-primary/70">The most critical principle is to <strong class="text-brand-primary">control the center</strong>. Whoever controls the center dictates the flow of the game.</p></div>',
 fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
 },
 {
 id: '2',
 type: 'interactive_board',
 title: 'Stake Your Claim',
 content: 'Play <strong>1. e4</strong> to stake a claim in the center and open lines for your Bishop and Queen.',
 fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
 solution: ['e2e4'],
 hintText: 'The center squares are highlighted in gold. Move your e-pawn two squares forward to e4.',
 successExplanation: 'Excellent! <strong>1. e4</strong> controls d5 and f5, freeing your light-squared bishop and queen for rapid development.',
 highlightSquares: ['d4', 'e4', 'd5', 'e5'],
 arrows: [['e2', 'e4']]
 },
 {
 id: '3',
 type: 'interactive_board',
 title: 'Develop with Purpose',
 content: 'Now that the center is claimed, bring out your minor pieces (Knights before Bishops). Develop your Kingside Knight.',
 fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
 solution: ['g1f3'],
 hintText: 'Develop the Knight on g1 to f3, attacking the black pawn on e5.',
 successExplanation: 'Perfect! <strong>2. Nf3</strong> develops a piece, controls the center, and attacks Black\'s pawn on e5 immediately.',
 highlightSquares: ['f3'],
 arrows: [['g1', 'f3']]
 },
 {
 id: '4',
 type: 'text',
 title: 'King Safety',
 content: '<div class="space-y-6"><p class="text-lg">Once your center is established and minor pieces are developed, your final opening task is <strong class="text-brand-primary">King Safety</strong>.</p><div class="p-5 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 shadow-sm"><span class="block text-brand-primary font-black mb-2 uppercase tracking-widest text-[10px]">Rule</span><p class="text-sm opacity-80">Always aim to <strong class="text-brand-primary">castle early</strong> (usually within the first 10 moves). A king stuck in the center is a primary target.</p></div></div>',
 fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 b kq - 5 5'
 }
];

const TACTICS_LESSON_STEPS: LessonStep[] = [
 {
 id: '1',
 type: 'text',
 title: 'Forcing Moves',
 content: '<div class="space-y-6"><p class="text-lg">Tactics are short-term plans to win material or deliver checkmate.</p><div class="p-5 bg-rose-500/10 rounded-2xl border border-rose-500/20 shadow-sm"><span class="block text-rose-500 font-black mb-2 uppercase tracking-widest text-[10px]">The Golden Rule</span><p class="text-sm opacity-80">Look for <strong class="text-rose-400">Forcing Moves</strong>: Checks, Captures, and Threats.</p></div></div>',
 fen: 'r1bqk2r/pppp1ppp/2n5/2b1p3/2B1n3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 6'
 },
 {
 id: '2',
 type: 'interactive_board',
 title: 'The Royal Fork',
 content: 'A <strong>fork</strong> is when one piece attacks two pieces simultaneously. Find the Knight fork that attacks both the King and the Rook.',
 fen: 'r3k3/8/8/3N4/8/8/8/4K3 w q - 0 1',
 solution: ['d5c7'],
 hintText: 'Move the Knight to c7 to attack both the King on e8 and the Rook on a8.',
 successExplanation: 'Brilliant! <strong>Nc7+</strong> forces the King to move out of check, leaving the Rook defenseless. This is a classic Royal Fork.',
 highlightSquares: ['c7'],
 arrows: [['c7', 'e8'], ['c7', 'a8']]
 },
 {
 id: '3',
 type: 'interactive_board',
 title: 'The Absolute Pin',
 content: 'A <strong>pin</strong> paralyzes an enemy piece. Find a move that pins the Black Queen to the King.',
 fen: '4k3/8/8/4q3/8/8/8/R3K3 w - - 0 1',
 solution: ['a1e1'],
 hintText: 'Bring your Rook to e1 to attack the Queen. The Queen cannot move because the King is behind it.',
 successExplanation: 'Great job! <strong>Re1</strong> creates an Absolute Pin. The Black Queen cannot move because doing so would expose the King to check.',
 highlightSquares: ['e1'],
 arrows: [['a1', 'e1'], ['e1', 'e5'], ['e5', 'e8']]
 },
 {
 id: '4',
 type: 'interactive_board',
 title: 'The Skewer',
 content: 'A <strong>skewer</strong> is the opposite of a pin: you attack the more valuable piece first. Skewer the King to win the Queen.',
 fen: '8/4q3/8/8/4k3/8/8/R5K1 w - - 0 1',
 solution: ['a1e1'],
 hintText: 'Move your Rook to e1 to check the King. When he moves, the Queen falls.',
 successExplanation: 'Nailed it! <strong>Re1+</strong> forces the King to move. Once he escapes, the Queen behind him falls. A deadly skewer!',
 highlightSquares: ['e1'],
 arrows: [['a1', 'e1'], ['e1', 'e4'], ['e4', 'e7']]
 }
];

const ENDGAME_LESSON_STEPS: LessonStep[] = [
 {
 id: '1',
 type: 'text',
 title: 'The Endgame Mindset',
 content: '<div class="space-y-6"><p class="text-lg leading-relaxed">Welcome to the Endgame. The board is empty, pawns become future queens, and your King transforms into your most powerful attacking piece.</p><p class="text-brand-primary/70">Mastering the endgame is the most reliable way to increase your chess rating.</p></div>',
 fen: '8/p7/1p6/8/8/1P6/P7/8 w - - 0 1'
 },
 {
 id: '2',
 type: 'interactive_board',
 title: 'The Ladder Checkmate',
 content: 'Use your two Rooks to push the enemy King to the edge of the board. Deliver the final blow.',
 fen: '4k3/6R1/8/8/8/8/8/R3K3 w - - 0 1',
 solution: ['a1a8'],
 hintText: 'Move the a1 rook to the 8th rank to deliver checkmate.',
 successExplanation: 'Checkmate! By alternating ranks, the two rooks act like feet climbing a ladder, forcing the king to the edge.',
 highlightSquares: ['a8'],
 arrows: [['a1', 'a8'], ['a8', 'e8'], ['g7', 'e7']]
 },
 {
 id: '3',
 type: 'interactive_board',
 title: 'The Box Checkmate',
 content: 'When you have a Queen, you must trap the King in a "box". Move the Queen a Knight\'s distance away from the King to shrink the box.',
 fen: '8/8/8/4k3/8/8/8/1Q2K3 w - - 0 1',
 solution: ['b1b4', 'b1f5', 'b1g6', 'b1d3'],
 hintText: 'Move the Queen to b4, staying a Knight-jump away from the King.',
 successExplanation: 'Well done! By staying a Knight\'s move away, you systematically shrink the box the King can walk in until he is trapped.',
 highlightSquares: ['b4'],
 arrows: [['b1', 'b4']]
 }
];

const POSITIONAL_LESSON_STEPS: LessonStep[] = [
  {
    id: '1',
    type: 'text',
    title: 'The Invisible Board',
    content: '<div class="space-y-6"><p class="text-lg">Positional chess is the art of improving your pieces and creating weaknesses in your opponent\'s camp without relying on immediate tactics.</p><div class="p-5 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-sm"><span class="block text-blue-500 font-black mb-2 uppercase tracking-widest text-[10px]">Core Concept</span><p class="text-sm opacity-80">Look for <strong>Outposts</strong>, control <strong>Open Files</strong>, and maintain a healthy <strong>Pawn Structure</strong>.</p></div></div>',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1'
  },
  {
    id: '2',
    type: 'interactive_board',
    title: 'The Knight Outpost',
    content: 'An outpost is a square protected by a pawn that cannot be attacked by enemy pawns. Plant your Knight on the ultimate d5 outpost!',
    fen: 'r1bq1rk1/pp2bppp/2n2n2/3p4/8/2N2N2/PPP1BPPP/R1BQ1RK1 w - - 0 1',
    solution: ['c3d5', 'f3d4', 'c3a4'],
    hintText: 'Move your c3 Knight into the center of the board to a dominant square.',
    successExplanation: 'Great! Moving a Knight into the center, supported by your structure, creates immense pressure that is very difficult to dislodge.',
    highlightSquares: ['d5'],
    arrows: [['c3', 'd5']]
  },
  {
    id: '3',
    type: 'interactive_board',
    title: 'Controlling the Open File',
    content: 'Rooks belong on open files (files with no pawns). Seize the c-file with your Rook!',
    fen: '3r2k1/p4ppp/1p2pn2/8/8/1P2PN2/P4PPP/2R3K1 w - - 0 1',
    solution: ['c1c7'],
    hintText: 'Move your c1 Rook up the open c-file to invade the 7th rank.',
    successExplanation: 'Perfect! Placing a Rook on the 7th rank (the "pig on the 7th") paralyzes the opponent and attacks their pawns sideways.',
    highlightSquares: ['c7'],
    arrows: [['c1', 'c7']]
  }
];

const GM_LESSON_STEPS: LessonStep[] = [
  {
    id: '1',
    type: 'text',
    title: 'The Art of Sacrifice',
    content: '<div class="space-y-6"><p class="text-lg">At the Grandmaster level, material is less important than initiative and mating attacks. Sometimes you must give to receive.</p><div class="p-5 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-sm"><span class="block text-amber-500 font-black mb-2 uppercase tracking-widest text-[10px]">Calculated Risk</span><p class="text-sm opacity-80">A sacrifice is only sound if it forcibly leads to a decisive advantage, a mate, or a draw in a lost position.</p></div></div>',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1'
  },
  {
    id: '2',
    type: 'interactive_board',
    title: 'The Greek Gift Sacrifice',
    content: 'One of the most famous attacking motifs. Sacrifice your light-squared Bishop on h7 to rip open the Black King\'s defense!',
    fen: 'r1bq1rk1/ppp1nppp/2n1p3/3p4/1b1P4/2NBPN2/PPPB1PPP/R2Q1RK1 w - - 0 1',
    solution: ['d3h7'],
    hintText: 'Capture the pawn on h7 with your Bishop. It is a sacrifice!',
    successExplanation: 'Boom! Bxh7+ destroys the pawn shield. The King must take or run, leading to a devastating attack involving Ng5+ and Qh5.',
    highlightSquares: ['h7'],
    arrows: [['d3', 'h7']]
  },
  {
    id: '3',
    type: 'interactive_board',
    title: 'The Queen Sacrifice',
    content: 'The ultimate sacrifice. Give up your Queen to deliver a stunning smothered mate with your Knight!',
    fen: 'r1b2r1k/pp4pp/1q1b4/5p2/2Q1n3/1BP5/P4PPP/R1B2RK1 w - - 0 1',
    solution: ['c4g8'],
    hintText: 'Move your Queen to g8, right next to the Black King. It looks crazy, but it forces the Rook to take!',
    successExplanation: 'Incredible! Qg8+ forces Rxg8. Then your Knight jumps in with Nf7# (Smothered Mate). The Grandmaster finishing blow!',
    highlightSquares: ['g8'],
    arrows: [['c4', 'g8']]
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
      <div className="flex h-screen items-center justify-center bg-brand-bg flex-col gap-4">
        <FaChessKnight className="text-brand-primary animate-pulse drop-shadow-lg" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse text-brand-primary/60">
          INITIALIZING LESSON...
        </p>
      </div>
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
