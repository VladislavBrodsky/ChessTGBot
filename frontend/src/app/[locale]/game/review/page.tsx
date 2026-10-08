'use client';

import { Suspense } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { ErrorState } from '@/components/ui/ErrorState';
import { ActionLink } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import GameReviewClient from './[gameId]/GameReviewClient';

function ReviewFromQuery() {
  const params = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('Index');
  const gameId = params.get('gameId');

  if (!gameId || !/^[A-Za-z0-9_-]{1,128}$/.test(gameId)) {
    return (
      <LayoutWrapper>
        <ErrorState
          title={t('load_failed')}
          message={t('no_games_logged')}
          action={<ActionLink href={`/${locale}/profile`}>{t('nav_profile')}</ActionLink>}
        />
      </LayoutWrapper>
    );
  }

  return <GameReviewClient gameId={gameId} />;
}

/** A static route keeps individual reviews reachable after refresh in the monolith export. */
export default function GameReviewPage() {
  return (
    <Suspense fallback={<LayoutWrapper><Skeleton variant="rectangular" width="100%" height={320} /></LayoutWrapper>}>
      <ReviewFromQuery />
    </Suspense>
  );
}
