'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { FaPuzzlePiece, FaTelegramPlane } from 'react-icons/fa';
import LayoutWrapper from '@/components/LayoutWrapper';
import PuzzleBoard from '@/components/Academy/PuzzleBoard';
import { ActionLink, PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNavbarHide } from '@/context/NavbarContext';
import { useUser } from '@/context/UserContext';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { telegramHaptic } from '@/lib/telegram';

interface Puzzle {
  id: number;
  title: string;
  description?: string;
  fen: string;
}
interface VerifiedPuzzle {
  status?: string;
  solved?: boolean;
  new_xp?: number;
  new_elo?: number;
}

function PuzzleSkeleton() {
  return <Card variant="solid" className="p-4 space-y-6" aria-busy="true">
    <Skeleton variant="rectangular" className="mx-auto aspect-square w-full max-w-[400px] rounded-2xl" />
    <div className="flex justify-center gap-4"><Skeleton width={44} height={44} /><Skeleton width={44} height={44} /></div>
  </Card>;
}

function PuzzleContent() {
  const locale = useLocale();
  const t = useTranslations('Academy');
  const ti = useTranslations('Index');
  const puzzleId = Number(useSearchParams()?.get('id') || '1');
  const validId = Number.isSafeInteger(puzzleId) && puzzleId > 0;
  const { data, error, isLoading, mutate } = useSWRFetch<Puzzle>(validId ? `/api/v1/gamification/academy/puzzles/${puzzleId}` : null, { revalidateOnFocus: false });
  const { hideNavbar, showNavbar } = useNavbarHide();
  const { stats, syncStats } = useUser();
  const [completion, setCompletion] = useState<VerifiedPuzzle | null>(null);
  useEffect(() => { hideNavbar(); return showNavbar; }, [hideNavbar, showNavbar]);
  useEffect(() => { setCompletion(null); }, [puzzleId]);

  const puzzle = useMemo(() => {
    if (!data || data.id !== puzzleId || typeof data.title !== 'string' || typeof data.fen !== 'string') return null;
    try { new Chess(data.fen); return data; } catch { return null; }
  }, [data, puzzleId]);

  const handleSolve = (result?: VerifiedPuzzle) => {
    // Server verification is the only completion source. Totals may include an
    // XP booster or a repeated solve; never invent a +50 XP / +5 ELO grant.
    if (result?.status !== 'success' || result.solved !== true) return;
    setCompletion(result);
    telegramHaptic('success');
    void syncStats();
  };

  return <LayoutWrapper>
    <main className="app-page app-page--focused space-y-6">
      <PageHeader icon={<FaPuzzlePiece />} tone="info" title={puzzle?.title || t('puzzle_title')} description={puzzle?.description} backHref={`/${locale}/academy`} />
      {isLoading && !data ? <PuzzleSkeleton /> : error && !puzzle || !puzzle ?
        <ErrorState title={ti('load_failed')} message={t('load_error_description')} onRetry={validId ? () => { void mutate(); } : undefined} retryLabel={ti('retry')} /> :
        <Card variant="solid" className="p-4">
          <PuzzleBoard key={puzzle.id} initialFen={puzzle.fen} puzzleId={puzzle.id} onSolve={handleSolve} onFail={() => {}} hintsEnabled={puzzle.id <= 10} />
        </Card>}
      {completion && <Card variant="solid" className="p-5 space-y-5 text-center" role="status">
        <h2 className="t-title-2">{t('solved')}</h2>
        <dl className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {Number.isFinite(completion.new_xp) && <div><dt className="t-caption text-brand-muted">XP</dt><dd className="t-numeric">{completion.new_xp}</dd></div>}
          {Number.isFinite(completion.new_elo) && <div><dt className="t-caption text-brand-muted">ELO</dt><dd className="t-numeric">{completion.new_elo}</dd></div>}
        </dl>
        <ActionLink primary href={`/${locale}/academy`}>{t('continue')}</ActionLink>
        <a className="ui-action-link w-full" href={`https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${stats?.bot_username || 'chess_matbot'}`)}&text=${encodeURIComponent(`${t('solved')}: ${puzzle?.title || t('puzzle_title')}`)}`} target="_blank" rel="noopener noreferrer"><FaTelegramPlane aria-hidden="true" />{t('share_progress')}</a>
      </Card>}
    </main>
  </LayoutWrapper>;
}

export default function PuzzlePage() {
  return <Suspense fallback={<LayoutWrapper><main className="app-page app-page--focused"><PuzzleSkeleton /></main></LayoutWrapper>}><PuzzleContent /></Suspense>;
}
