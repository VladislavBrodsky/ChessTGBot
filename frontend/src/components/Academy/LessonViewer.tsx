'use client';

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronRight, FaChevronLeft, FaCheck } from "react-icons/fa";
import PuzzleBoard from "@/components/Academy/PuzzleBoard";
import dynamic from "next/dynamic";
import { sanitizeRichContent } from "@/lib/sanitizeRichContent";

const Chessboard = dynamic(() => import('react-chessboard').then(mod => mod.Chessboard), { ssr: false });

export type LessonStepType = 'text' | 'video' | 'interactive_board';

export interface LessonStep {
  id: string;
  type: LessonStepType;
  title: string;
  content: string; // HTML/Markdown text or Video URL or FEN
  // For interactive board
  fen?: string;
  solution?: string[];
  boardOrientation?: 'white' | 'black';
  hintText?: string;
  successExplanation?: string;
  arrows?: string[][];
  highlightSquares?: string[];
}

interface LessonViewerProps {
 steps: LessonStep[];
 onComplete: () => void;
}

export default function LessonViewer({ steps, onComplete }: LessonViewerProps) {
 const [currentStepIndex, setCurrentStepIndex] = useState(0);
 const [stepComplete, setStepComplete] = useState(false);

 const currentStep = steps[currentStepIndex];
 const isLastStep = currentStepIndex === steps.length - 1;
 const hasInteractiveSolution =
   currentStep.type === 'interactive_board' && (currentStep.solution?.length ?? 0) > 0;
 const safeStepContent = useMemo(() => sanitizeRichContent(currentStep.content), [currentStep.content]);

  const isTextOrStatic = currentStep.type === 'text' || (currentStep.type === 'interactive_board' && !hasInteractiveSolution);
  const isStepReady = isTextOrStatic || stepComplete;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setStepComplete(false);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setStepComplete(true);
    }
  };

  const markCompleteAndAdvance = () => {
    setStepComplete(true);
    handleNext();
  };

  // Build square styles for static explanatory boards (e.g. Queen movement vectors)
  const staticSquareStyles: { [square: string]: any } = {};
  if (currentStep.highlightSquares) {
    currentStep.highlightSquares.forEach(sq => {
      staticSquareStyles[sq] = { backgroundColor: 'rgba(245, 158, 11, 0.4)' }; // Gold highlight
    });
  }

  return (
    <div className="flex flex-col flex-1 h-full w-full justify-between pb-4">
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-brand-void/50 rounded-full mb-4 overflow-hidden border border-brand-border-opacity-10">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-4xl px-2"
          >
            {isTextOrStatic && (
              <div className={`w-full mx-auto flex flex-col ${currentStep.fen ? 'md:flex-row items-center' : ''} gap-6 md:gap-8`}>
                <div className="flex-1 p-5 md:p-8 rounded-[24px] border border-brand-border-opacity-10 bg-brand-surface shadow-premium flex flex-col justify-center min-h-[160px] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-brand-void/10 pointer-events-none" />
                  {/* Decorative subtle background glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-all group-hover:bg-emerald-500/20" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
                  
                  <div className="relative z-10 prose prose-brand max-w-none text-brand-primary leading-relaxed text-[14px]">
                    <div dangerouslySetInnerHTML={{ __html: safeStepContent }} />
                  </div>
                  
                  <button
                    onClick={markCompleteAndAdvance}
                    className="mt-6 w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.25)] relative z-10 flex items-center justify-center gap-2 overflow-hidden border border-emerald-300/30 text-xs cursor-pointer"
                  >
                    <FaCheck /> {isLastStep ? 'Complete Lesson' : 'Got it, Next Step'}
                  </button>
                </div>
               
                {currentStep.fen && (
                  <div className="flex-1 rounded-3xl overflow-hidden border border-brand-border-opacity-10 bg-brand-void p-2 md:p-3 shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex items-center justify-center max-w-sm mx-auto md:max-w-md w-full relative">
                    <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-inner">
                      {/* Glass overlay for static feeling */}
                      <div className="absolute inset-0 z-10 pointer-events-auto bg-transparent" />
                      <Chessboard
                        options={{
                          id: `board-${currentStep.id}`,
                          position: currentStep.fen,
                          boardOrientation: currentStep.boardOrientation || 'white',
                          allowDragging: false,
                          darkSquareStyle: { backgroundColor: '#18181b' },
                          lightSquareStyle: { backgroundColor: '#52525b' },
                          squareStyles: staticSquareStyles,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep.type === 'video' && (
              <div className="rounded-3xl overflow-hidden border border-brand-border-opacity-10 bg-brand-void aspect-video relative">
                <iframe
                  src={currentStep.content}
                  className="w-full h-full"
                  title={currentStep.title}
                  allowFullScreen
                />
                {!stepComplete && (
                  <button
                    onClick={markCompleteAndAdvance}
                    className="absolute bottom-4 right-4 px-4 py-2 bg-emerald-500 text-slate-950 font-bold uppercase tracking-widest rounded-lg text-xs hover:bg-emerald-400 transition-colors shadow-md"
                  >
                    Video Watched
                  </button>
                )}
              </div>
            )}

            {hasInteractiveSolution && (
              <div className="glass-panel p-4 md:p-6 rounded-3xl border border-brand-border-opacity-10 w-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] bg-gradient-to-br from-brand-surface to-brand-bg-opacity-5">
                <div className="text-sm md:text-base font-medium text-brand-muted mb-6 text-center leading-relaxed" dangerouslySetInnerHTML={{ __html: safeStepContent }} />
                <PuzzleBoard
                  initialFen={currentStep.fen || "start"}
                  solution={currentStep.solution || []}
                  onSolve={() => setStepComplete(true)}
                  onFail={() => { }}
                  orientation={currentStep.boardOrientation || 'white'}
                  hintsEnabled={true}
                  hintText={currentStep.hintText}
                  successExplanation={currentStep.successExplanation}
                  arrows={currentStep.arrows}
                  highlightSquares={currentStep.highlightSquares}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center mt-6 w-full gap-2">
        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          className={`p-3 rounded-full border border-brand-border-opacity-10 text-brand-muted transition-colors ${currentStepIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-brand-surface hover:text-brand-primary cursor-pointer'}`}
        >
          <FaChevronLeft size={12} />
        </button>

        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-muted">
          Step {currentStepIndex + 1} of {steps.length}
        </div>

        <button
          onClick={handleNext}
          disabled={!isStepReady}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs transition-all
            ${isStepReady
              ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] font-black"
              : "bg-brand-void/50 text-brand-muted border border-brand-border-opacity-10 cursor-not-allowed"
            }
          `}
        >
          {isLastStep ? 'Complete' : 'Next'}
          {isLastStep ? <FaCheck size={10} /> : <FaChevronRight size={10} />}
        </button>
      </div>
    </div>
  );
}
