'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FaCheck, FaTelegramPlane } from 'react-icons/fa';
import LayoutWrapper from '@/components/LayoutWrapper';
import LessonViewer from '@/components/Academy/LessonViewer';
import { ActionLink, PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { useNavbarHide } from '@/context/NavbarContext';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { useTelemetry } from '@/hooks/useTelemetry';
import { apiFetch } from '@/lib/api';
import { mapBackendLessonStep } from '@/lib/lessonSteps';
import { telegramHaptic } from '@/lib/telegram';

export default function LessonClient({ lessonId }: { lessonId: string }) {
  const locale = useLocale();
  const t = useTranslations('Academy');
  const ti = useTranslations('Index');
  const toast = useToast();
  const { stats, syncStats } = useUser();
  const { data, error, isLoading, mutate } = useSWRFetch(`/api/v1/content/lessons/${lessonId}?locale=${locale}`, { revalidateOnFocus: false });
  const steps = useMemo(() => Array.isArray(data?.steps) ? data.steps.map((step: Parameters<typeof mapBackendLessonStep>[0]) => mapBackendLessonStep(step, data.title)) : [], [data]);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const { hideNavbar, showNavbar } = useNavbarHide();
  const { trackEvent } = useTelemetry();

  useEffect(() => { hideNavbar(); return showNavbar; }, [hideNavbar, showNavbar]);
  useEffect(() => { setCompleted(false); }, [lessonId]);
  useEffect(() => {
    if (data) trackEvent('academy_lesson_started', { lesson_id: lessonId });
    // Telemetry identity updates must not restart this lesson.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, lessonId]);

  const handleComplete = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/v1/gamification/academy/complete-task', {
        method: 'POST', body: JSON.stringify({ task_type: 'lesson', item_id: lessonId }),
      });
      if (!res.ok) throw new Error('Lesson completion unavailable');
      await res.json();
      // The completion endpoint returns total XP, not the reward granted. A
      // repeated lesson can award zero XP; never display a guessed +50 reward.
      setCompleted(true);
      void syncStats();
      telegramHaptic('success');
      trackEvent('academy_lesson_completed', { lesson_id: lessonId });
    } catch {
      toast.error(ti('action_failed'));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const unavailable = !isLoading && (!data || steps.length === 0);
  return <LayoutWrapper>
    <main className="app-page app-page--focused space-y-6">
      <PageHeader title={completed ? t('lesson_complete') : data?.title || t('lesson')} description={!completed ? data?.track : data?.title} backHref={`/${locale}/academy`} />
      {isLoading && !data ? <div aria-busy="true" className="space-y-4">
        <Skeleton variant="rectangular" height={6} />
        <Card variant="solid" className="p-5 min-h-64"><SkeletonText lines={5} /></Card>
        <Skeleton variant="rectangular" height={48} />
      </div> : error && !data || unavailable ? <ErrorState title={ti('load_failed')} message={ti('retry')} onRetry={() => { void mutate(); }} retryLabel={ti('retry')} />
      : completed ? <Card variant="solid" className="flex flex-col items-center gap-5 p-6 text-center">
        <span className="ui-icon-tile ui-icon-tile--success" aria-hidden="true"><FaCheck /></span>
        <ActionLink primary href={`/${locale}/academy`}>{ti('academy')}</ActionLink>
        <a className="ui-action-link w-full" href={`https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${stats?.bot_username || 'chess_matbot'}`)}&text=${encodeURIComponent(`${t('lesson_complete')}: ${data.title}`)}`} target="_blank" rel="noopener noreferrer"><FaTelegramPlane aria-hidden="true" />{t('share_progress')}</a>
      </Card> : <LessonViewer key={`${locale}:${lessonId}`} steps={steps} onComplete={handleComplete} submitting={submitting} />}
    </main>
  </LayoutWrapper>;
}
