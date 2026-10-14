'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import {
  FaPuzzlePiece,
  FaTelegramPlane,
  FaGraduationCap,
  FaChevronDown,
  FaChevronUp,
  FaArrowRight,
  FaTrophy,
  FaStar,
  FaLightbulb,
} from 'react-icons/fa';
import LayoutWrapper from '@/components/LayoutWrapper';
import PuzzleBoard from '@/components/Academy/PuzzleBoard';
import { ActionLink, PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { triggerConfettiBurst } from '@/components/ui/Confetti';
import { useNavbarHide } from '@/context/NavbarContext';
import { useUser } from '@/context/UserContext';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { telegramHaptic } from '@/lib/telegram';

interface Puzzle {
  id: number;
  stage?: number;
  stage_name?: string;
  title: string;
  theme?: string;
  difficulty?: number;
  description?: string;
  coach_theory?: string;
  fen: string;
  xp_reward?: number;
}

interface VerifiedPuzzle {
  status?: string;
  solved?: boolean;
  new_xp?: number;
  new_elo?: number;
  explanation?: string;
}

function PuzzleSkeleton() {
  return (
    <Card variant="solid" className="p-4 space-y-6" aria-busy="true">
      <div className="flex items-center gap-2">
        <Skeleton width="90px" height="24px" className="rounded-full" />
        <Skeleton width="110px" height="24px" className="rounded-full" />
      </div>
      <Skeleton
        variant="rectangular"
        className="mx-auto aspect-square w-full max-w-[400px] rounded-2xl"
      />
      <div className="flex justify-center gap-4">
        <Skeleton width={44} height={44} />
        <Skeleton width={44} height={44} />
      </div>
    </Card>
  );
}

function PuzzleContent() {
  const locale = useLocale();
  const t = useTranslations('Academy');
  const ti = useTranslations('Index');
  const searchParams = useSearchParams();
  const puzzleId = Number(searchParams?.get('id') || '1');
  const validId = Number.isSafeInteger(puzzleId) && puzzleId > 0;

  const { data, error, isLoading, mutate } = useSWRFetch<Puzzle>(
    validId ? `/api/v1/gamification/academy/puzzles/${puzzleId}` : null,
    { revalidateOnFocus: false },
  );

  const { hideNavbar, showNavbar } = useNavbarHide();
  const { stats, syncStats } = useUser();
  const [completion, setCompletion] = useState<VerifiedPuzzle | null>(null);
  const [showTheory, setShowTheory] = useState<boolean>(true);

  useEffect(() => {
    hideNavbar();
    return showNavbar;
  }, [hideNavbar, showNavbar]);

  useEffect(() => {
    setCompletion(null);
    setShowTheory(true);
  }, [puzzleId]);

  const puzzle = useMemo(() => {
    if (
      !data ||
      data.id !== puzzleId ||
      typeof data.title !== 'string' ||
      typeof data.fen !== 'string'
    )
      return null;
    try {
      new Chess(data.fen);
      return data;
    } catch {
      return null;
    }
  }, [data, puzzleId]);

  const handleSolve = (result?: VerifiedPuzzle) => {
    if (result?.status !== 'success' || result.solved !== true) return;
    setCompletion(result);
    telegramHaptic('success');
    void triggerConfettiBurst();
    void syncStats();
  };

  const isHintsAllowed = puzzle ? puzzle.id <= 10 || Boolean(stats?.is_premium) : false;

  return (
    <LayoutWrapper>
      <main className="app-page app-page--focused space-y-5 pb-12">
        {/* Navigation & Header */}
        <PageHeader
          icon={<FaPuzzlePiece />}
          tone="info"
          title={puzzle?.title || t('puzzle_title')}
          description={puzzle?.description}
          backHref={`/${locale}/academy`}
        />

        {/* Tactical HUD Badges */}
        {puzzle && (
          <div className="flex flex-wrap items-center justify-between gap-2 -mt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-caption font-bold bg-brand-action/15 text-brand-action border border-brand-action/30">
                Stage {puzzle.stage || 1}: {puzzle.stage_name || t('beginner')}
              </span>
              {puzzle.theme && (
                <span className="px-2.5 py-0.5 rounded-full text-caption font-semibold bg-brand-elevated text-brand-primary border border-brand-border">
                  {puzzle.theme}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-caption font-semibold text-brand-muted">
              {puzzle.difficulty && (
                <div className="flex items-center text-amber-400 gap-0.5" aria-label={`Difficulty ${puzzle.difficulty} of 5`}>
                  {Array.from({ length: puzzle.difficulty }).map((_, i) => (
                    <FaStar key={i} className="text-xs" aria-hidden="true" />
                  ))}
                </div>
              )}
              <span className="text-brand-primary font-bold">+{puzzle.xp_reward || 50} XP</span>
            </div>
          </div>
        )}

        {/* Grandmaster Coach Briefing & Theory Card */}
        {puzzle?.coach_theory && !completion && (
          <Card variant="solid" className="p-4 space-y-3 border border-brand-border">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="ui-icon-tile ui-icon-tile--info shrink-0 text-brand-action" aria-hidden="true">
                  <FaGraduationCap />
                </span>
                <div className="min-w-0">
                  <h3 className="t-caption font-bold text-brand-primary tracking-normal truncate">
                    Coach Maestro • Grandmaster Briefing
                  </h3>
                  <p className="text-caption text-brand-muted truncate">Tactical Motif & Way of Thinking</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTheory((prev) => !prev)}
                className="p-2 text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
                aria-label={showTheory ? 'Collapse theory' : 'Expand theory'}
              >
                {showTheory ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
              </button>
            </div>

            {showTheory && (
              <div className="space-y-3 pt-1 border-t border-brand-border">
                <p className="text-caption text-brand-primary leading-relaxed">
                  {puzzle.coach_theory}
                </p>

                <div className="p-3 rounded-xl bg-brand-elevated border border-brand-border space-y-1.5">
                  <span className="text-caption font-bold text-brand-action flex items-center gap-1.5">
                    <FaLightbulb className="text-xs shrink-0" aria-hidden="true" />
                    Grandmaster Checklist (C-C-T)
                  </span>
                  <ul className="text-caption text-brand-muted space-y-1 pl-4 list-disc">
                    <li>Identify unprotected enemy pieces and King coordinates.</li>
                    <li>Calculate all forcing Checks, Captures, and Threats.</li>
                    <li>Execute the geometric tactical blow cleanly.</li>
                  </ul>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Main Chessboard Section */}
        {isLoading && !data ? (
          <PuzzleSkeleton />
        ) : error && !puzzle || !puzzle ? (
          <ErrorState
            title={ti('load_failed')}
            message={t('load_error_description')}
            onRetry={validId ? () => { void mutate(); } : undefined}
            retryLabel={ti('retry')}
          />
        ) : (
          <Card variant="solid" className="p-4">
            <PuzzleBoard
              key={puzzle.id}
              initialFen={puzzle.fen}
              puzzleId={puzzle.id}
              onSolve={handleSolve}
              onFail={() => {}}
              hintsEnabled={isHintsAllowed}
            />
          </Card>
        )}

        {/* Grandmaster Victory & Retention Card (Post-Solve) */}
        {completion && puzzle && (
          <Card variant="solid" className="p-5 space-y-5 text-center border border-brand-action/40 shadow-xl" role="status">
            <div className="flex flex-col items-center gap-2">
              <span className="ui-icon-tile ui-icon-tile--success shrink-0 text-emerald-400" aria-hidden="true">
                <FaTrophy />
              </span>
              <h2 className="t-title-2 text-brand-primary">{t('solved')}</h2>
              <p className="text-caption text-brand-muted">
                Class #{puzzle.id} conquered with Grandmaster precision.
              </p>
            </div>

            {/* Metrics Ticker */}
            <dl className="flex flex-wrap justify-center gap-x-8 gap-y-3 py-2 border-y border-brand-border">
              {Number.isFinite(completion.new_xp) && (
                <div>
                  <dt className="t-caption text-brand-muted">Total XP</dt>
                  <dd className="t-numeric text-brand-action font-bold">{completion.new_xp}</dd>
                </div>
              )}
              {Number.isFinite(completion.new_elo) && (
                <div>
                  <dt className="t-caption text-brand-muted">Player ELO</dt>
                  <dd className="t-numeric text-amber-400 font-bold">{completion.new_elo}</dd>
                </div>
              )}
            </dl>

            {/* Grandmaster Debriefing */}
            {completion.explanation && (
              <div className="p-4 rounded-xl bg-brand-elevated border border-brand-border text-left space-y-1.5">
                <span className="text-caption font-bold text-emerald-400 block">
                  {t('explanation')}
                </span>
                <p className="text-caption text-brand-primary leading-relaxed">
                  {completion.explanation}
                </p>
              </div>
            )}

            {/* Direct 1-Tap Next Level Retention Button */}
            <div className="space-y-3 pt-2">
              {puzzleId < 100 ? (
                <ActionLink primary href={`/${locale}/academy/puzzle?id=${puzzleId + 1}`}>
                  {t('next_level')} #{puzzleId + 1}
                </ActionLink>
              ) : (
                <ActionLink primary href={`/${locale}/academy`}>
                  {t('all_levels_solved')}
                </ActionLink>
              )}

              <ActionLink href={`/${locale}/academy`}>
                {ti('academy')}
              </ActionLink>
            </div>

            {/* Viral Telegram Share Brag */}
            <a
              className="ui-action-link w-full flex items-center justify-center gap-2 text-caption text-brand-muted hover:text-brand-primary"
              href={`https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${stats?.bot_username || 'chess_matbot'}?start=academy_${puzzle.id}`)}&text=${encodeURIComponent(`🏆 I just solved Class #${puzzle.id} (${puzzle.theme || 'Tactics'}) in Web3Chess Academy! Test your tactical vision:`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTelegramPlane aria-hidden="true" className="text-xs" />
              <span>{t('share_progress')}</span>
            </a>
          </Card>
        )}
      </main>
    </LayoutWrapper>
  );
}

export default function PuzzlePage() {
  return (
    <Suspense
      fallback={
        <LayoutWrapper>
          <main className="app-page app-page--focused">
            <PuzzleSkeleton />
          </main>
        </LayoutWrapper>
      }
    >
      <PuzzleContent />
    </Suspense>
  );
}
