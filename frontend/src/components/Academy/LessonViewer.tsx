'use client';

import BoardA11y from '@/components/game/BoardA11y';
import { useMemo, useState } from "react";
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
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
 submitting?: boolean;
}

export default function LessonViewer({ steps, onComplete, submitting = false }: LessonViewerProps) {
 const t = useTranslations('Academy');
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
      setStepComplete(false);
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
      <div role="progressbar" aria-label={t('step_count', { current: currentStepIndex + 1, total: steps.length })} aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={currentStepIndex + 1} className="w-full h-1.5 bg-brand-elevated rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-brand-action rounded-full" style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }} />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden my-auto py-2">
          <div
            key={currentStep.id}
            className="w-full max-w-4xl px-2"
          >
            {isTextOrStatic && (
              <div className={`w-full mx-auto flex flex-col ${currentStep.fen ? 'md:flex-row items-center' : ''} gap-5 md:gap-8`}>
                <div className="flex-1 p-5 md:p-8 rounded-[24px] border border-brand-border-opacity-10 bg-brand-surface shadow-premium flex flex-col justify-center min-h-64 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-brand-void/10 pointer-events-none" />
                  
                  <div className="relative z-10 prose prose-brand max-w-none text-brand-primary leading-relaxed t-body">
                    <div dangerouslySetInnerHTML={{ __html: safeStepContent }} />
                  </div>
                </div>
               
                {currentStep.fen && (
                  <div className="flex-1 rounded-3xl overflow-hidden border border-brand-border-opacity-10 bg-brand-void p-2 md:p-3 shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex items-center justify-center max-w-sm mx-auto md:max-w-md w-full relative">
                    <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-inner">
                      {/* Glass overlay for static feeling */}
                      <div className="absolute inset-0 z-10 pointer-events-auto bg-transparent" />
                      <BoardA11y><Chessboard
                        options={{
                          id: `board-${currentStep.id}`,
                          position: currentStep.fen,
                          boardOrientation: currentStep.boardOrientation || 'white',
                          allowDragging: false,
                          darkSquareStyle: { backgroundColor: '#2e3a4e' },
                          lightSquareStyle: { backgroundColor: '#cbd5e1' },
                          squareStyles: staticSquareStyles,
                        }}
                      /></BoardA11y>
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
                  <button type="button"
                    onClick={markCompleteAndAdvance}
                    className="ui-tap-target absolute bottom-4 right-4 px-4 py-2 bg-brand-action text-brand-action-ink font-bold normal-case tracking-normal rounded-lg text-sm hover:brightness-110 transition-colors shadow-md"
                  >
                    {t('video_watched')}
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
          </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center mt-4 w-full gap-2 pt-2 border-t border-brand-border-opacity-10">
        <Button variant="ghost" aria-label={t('previous_step')} type="button"
          onClick={handlePrev}
          disabled={currentStepIndex === 0 || submitting}
          className={`ui-tap-target p-3 rounded-full border border-brand-border-opacity-10 text-brand-muted transition-colors ${currentStepIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-brand-surface hover:text-brand-primary cursor-pointer'}`}
        >
          <FaChevronLeft size={12} className="rtl:rotate-180" />
        </Button>

        <div className="text-caption font-semibold normal-case tracking-normal text-brand-muted">
          {t('step_count', { current: currentStepIndex + 1, total: steps.length })}
        </div>

        <Button variant="action" type="button" isLoading={submitting}
          onClick={handleNext}
          disabled={!isStepReady || submitting}
          className={`ui-tap-target
            flex items-center gap-2 px-6 py-3 rounded-full font-semibold normal-case tracking-normal text-sm transition-all
            ${isStepReady
              ? "bg-brand-action text-brand-action-ink hover:brightness-110 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] font-semibold"
              : "bg-brand-void/50 text-brand-muted border border-brand-border-opacity-10 cursor-not-allowed"
            }
          `}
        >
          {isLastStep ? t('complete_lesson') : t('next_step')}
          {isLastStep ? <FaCheck size={10} /> : <FaChevronRight size={10} className="rtl:rotate-180" />}
        </Button>
      </div>
    </div>
  );
}
