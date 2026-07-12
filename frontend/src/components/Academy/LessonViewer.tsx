'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronRight, FaChevronLeft, FaCheck } from "react-icons/fa";
import PuzzleBoard from "@/components/Academy/PuzzleBoard";

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
 className="w-full max-w-lg"
 >
 <h2 className="text-2xl font-black tracking-tight text-brand-primary mb-4 text-center">
 {currentStep.title}
 </h2>

 {currentStep.type === 'text' && (
 <div className="glass-panel p-6 rounded-3xl border border-brand-border-opacity-10 text-brand-primary opacity-80 leading-relaxed text-sm w-full max-w-full">
 <div dangerouslySetInnerHTML={{ __html: currentStep.content }} />
 {!stepComplete && (
 <button
 onClick={markComplete}
 className="mt-6 w-full py-3 bg-brand-bg-opacity-10 text-brand-primary font-bold uppercase tracking-widest rounded-xl hover:bg-brand-bg-opacity-20 transition-colors"
 >
 I Understand
 </button>
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

  {currentStep.type === 'interactive_board' && (
    <div className="glass-panel p-4 rounded-3xl border border-brand-border-opacity-10 w-full">
      <div className="text-sm font-medium text-brand-primary opacity-80 mb-4 text-center" dangerouslySetInnerHTML={{ __html: currentStep.content }} />
      <PuzzleBoard
        initialFen={currentStep.fen || "start"}
        solution={currentStep.solution || []}
        onSolve={markComplete}
        onFail={() => { }}
        orientation={currentStep.boardOrientation || 'white'}
        hintsEnabled={true}
        hintText={currentStep.hintText}
        successExplanation={currentStep.successExplanation}
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
