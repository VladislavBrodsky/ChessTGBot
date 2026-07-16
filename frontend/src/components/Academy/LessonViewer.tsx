'use client';

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronRight, FaChevronLeft, FaCheck } from "react-icons/fa";
import PuzzleBoard from "@/components/Academy/PuzzleBoard";
import { Chessboard } from "react-chessboard";
import { sanitizeRichContent } from "@/lib/sanitizeRichContent";

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

 const handleNext = () => {
 if (currentStepIndex < steps.length - 1) {
 setCurrentStepIndex(currentStepIndex + 1);
 setStepComplete(false); // Reset for next step
 } else {
 onComplete();
 }
 };

 const handlePrev = () => {
 if (currentStepIndex > 0) {
 setCurrentStepIndex(currentStepIndex - 1);
 setStepComplete(true); // Assume previous steps appear complete
 }
 };

 const markComplete = () => {
 setStepComplete(true);
 };

  return (
    <div className="flex flex-col flex-1 h-full w-full justify-between pb-4">
 {/* Progress Bar */}
 <div className="w-full h-1 bg-brand-bg-opacity-10 rounded-full mb-6">
 <motion.div
 className="h-full bg-brand-primary"
 initial={{ width: 0 }}
 animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
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
 className="w-full max-w-4xl px-4"
 >
 <h2 className="text-2xl font-black tracking-tight text-brand-primary mb-4 text-center">
 {currentStep.title}
 </h2>

 {(currentStep.type === 'text' || (currentStep.type === 'interactive_board' && !hasInteractiveSolution)) && (
   <div className={`w-full mx-auto flex flex-col ${currentStep.fen ? 'md:flex-row items-center' : ''} gap-6 md:gap-8`}>
     <div className="flex-1 glass-panel p-8 md:p-10 rounded-3xl border border-brand-border-opacity-10 shadow-lg flex flex-col justify-center min-h-[300px] relative overflow-hidden">
       {/* Decorative subtle background glow */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
       
       <div className="relative z-10 prose prose-invert prose-brand max-w-none text-brand-primary/90 leading-relaxed text-[15px]">
         <div dangerouslySetInnerHTML={{ __html: safeStepContent }} />
       </div>
       
       {!stepComplete && (
         <button
           onClick={markComplete}
           className="mt-8 w-full py-4 bg-brand-primary text-brand-void font-black uppercase tracking-widest rounded-xl hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.1)] relative z-10"
         >
           I Understand
         </button>
       )}
     </div>
     
     {currentStep.fen && (
       <div className="flex-1 rounded-3xl overflow-hidden border border-brand-border-opacity-10 bg-black p-2 md:p-3 shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex items-center justify-center max-w-sm mx-auto md:max-w-md w-full relative">
         <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-inner">
           {/* Glass overlay for static feeling */}
           <div className="absolute inset-0 z-10 pointer-events-auto bg-transparent" />
           <Chessboard
             options={{
               id: `board-${currentStep.id}`,
               position: currentStep.fen,
               boardOrientation: currentStep.boardOrientation || 'white',
               allowDragging: false,
               darkSquareStyle: { backgroundColor: '#7b9fb6' },
               lightSquareStyle: { backgroundColor: '#ebecd0' },
             }}
           />
         </div>
       </div>
     )}
   </div>
 )}

 {currentStep.type === 'video' && (
 <div className="rounded-3xl overflow-hidden border border-brand-border-opacity-10 bg-black aspect-video relative">
 <iframe
 src={currentStep.content}
 className="w-full h-full"
 title={currentStep.title}
 allowFullScreen
 />
 {!stepComplete && (
 <button
 onClick={markComplete}
 className="absolute bottom-4 right-4 px-4 py-2 bg-brand-primary text-black font-bold uppercase tracking-widest rounded-lg text-xs hover:bg-white transition-colors"
 >
 Video Watched
 </button>
 )}
 </div>
 )}

  {hasInteractiveSolution && (
    <div className="glass-panel p-4 md:p-6 rounded-3xl border border-brand-border-opacity-10 w-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] bg-gradient-to-br from-brand-surface to-brand-bg-opacity-5">
      <div className="text-sm md:text-base font-medium text-brand-primary opacity-90 mb-6 text-center leading-relaxed" dangerouslySetInnerHTML={{ __html: safeStepContent }} />
      <PuzzleBoard
        initialFen={currentStep.fen || "start"}
        solution={currentStep.solution || []}
        onSolve={markComplete}
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
 className={`p-3 rounded-full border border-brand-border-opacity-20 text-brand-primary transition-colors ${currentStepIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-brand-bg-opacity-10'}`}
 >
 <FaChevronLeft />
 </button>

 <div className="text-xs font-bold uppercase tracking-widest text-brand-primary opacity-40">
 Step {currentStepIndex + 1} of {steps.length}
 </div>

 <button
 onClick={handleNext}
 disabled={!stepComplete}
 className={`
 flex items-center gap-2 px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs transition-all
 ${stepComplete
 ? "bg-brand-primary text-brand-void hover:bg-white cursor-pointer shadow-premium"
 : "bg-brand-bg-opacity-5 text-brand-primary opacity-20 cursor-not-allowed"
 }
 `}
 >
 {isLastStep ? 'Complete Lesson' : 'Next'}
 {isLastStep ? <FaCheck /> : <FaChevronRight />}
 </button>
 </div>
 </div>
 );
}
