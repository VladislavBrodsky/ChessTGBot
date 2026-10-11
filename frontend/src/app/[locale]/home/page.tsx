'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiBell, FiSettings, FiShoppingBag, FiCreditCard } from 'react-icons/fi';
import { FaGraduationCap, FaChessKnight, FaTrophy } from 'react-icons/fa';
import { useTranslations, useLocale } from 'next-intl';
import LayoutWrapper from '@/components/LayoutWrapper';
import { getFullPhotoUrl } from '@/lib/api';
import Leaderboard from '@/components/Leaderboard';
import ArenaBanner from '@/components/game/ArenaBanner';
import { useClaimableTasks } from '@/hooks/useClaimableTasks';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader, SectionHeader, ActionLink } from '@/components/ui/PageHeader';
import { QuickTile } from '@/components/ui/QuickTile';
import { CountUp } from '@/components/ui/CountUp';
import { HeroCardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import XPProgressBar from '@/components/XPProgressBar';
import DailyCheckinModal from '@/components/DailyCheckinModal';
import NotificationModal from '@/components/NotificationModal';
import DailyGoalsBento from '@/components/DailyGoalsBento';
import EngagementQuest from '@/components/EngagementQuest';
import { telegramHaptic } from '@/lib/telegram';

// Telegram's `start_param` persists for the whole webview session, so the
// deep-link redirect below re-fired on EVERY Home mount — after finishing a
// deep-linked game, returning to Home yanked the user straight back into that
// (now finished) game's MatchOverModal, with no escape. Honor a deep link at
// most once per session; live-game resume is handled by LayoutWrapper's
// /game/active check (which correctly excludes finished games).
let deepLinkHandled = false;

export default function Home() {
 const t = useTranslations('Index');
 const locale = useLocale();
 const router = useRouter();
 const [tgUser, setTgUser] = useState<any>(null);
 const [showNotifications, setShowNotifications] = useState(false);
 const claimable = useClaimableTasks();
 const [mounted, setMounted] = useState(false);
 const { stats, walletBalance, loadingStats, loadingBalance, balanceError, statsError, syncStats } = useUser();
 const fallbackCombatant = t('combatant');
 const displayName = !mounted 
   ? fallbackCombatant
   : stats
     ? `${stats.first_name}${stats.last_name ? ` ${stats.last_name}` : ''}`
     : (tgUser ? `${tgUser.first_name}${tgUser.last_name ? ` ${tgUser.last_name}` : ''}` : fallbackCombatant);

 useEffect(() => {
   if (typeof window !== 'undefined') {
     let startParam = '';
     if (window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
       startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
     } else {
       const params = new URLSearchParams(window.location.search);
       startParam = params.get('startapp') || params.get('start') || '';
     }
     
     if (startParam && !startParam.startsWith('ref_') && !deepLinkHandled) {
       deepLinkHandled = true;
       if (startParam === 'arena') {
         router.push(`/${locale}/game`);
       } else {
         router.push(`/${locale}/game?id=${startParam}`);
       }
     }
   }
 }, [locale, router]);

 useEffect(() => {
   setMounted(true);
   // Init Telegram WebApp Data
   if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
     const tg = window.Telegram.WebApp;
     setTgUser(tg.initDataUnsafe?.user);
   }
 }, []);



 return (
  <LayoutWrapper hideHeaderControls>
    <DailyCheckinModal />
    <NotificationModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    <main className="app-page">
      <PageHeader eyebrow={t('welcome_greeting')} title={displayName} actions={<>
        <Button variant="secondary" className="h-11 w-11 p-0" aria-label="Notifications" onClick={() => setShowNotifications(true)}><FiBell size={20} /></Button>
        <Link href={`/${locale}/settings`} aria-label={t('nav_settings')} className="ui-icon-button" onClick={() => telegramHaptic('selection')}><FiSettings size={20} /></Link>
      </>} />
      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 space-y-5 lg:sticky lg:top-6">
          {!stats && !loadingStats && statsError ? (
            <ErrorState title={t('load_failed')} onRetry={() => syncStats()} retryLabel={t('retry')} />
          ) : !stats ? (
            <HeroCardSkeleton label={t('level')} />
          ) : (
            <div className="ui-hero-card reveal-in p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/${locale}/profile`} className="flex min-h-11 min-w-0 items-center gap-3.5 rounded-xl" onClick={() => telegramHaptic('selection')}>
                  <span className="relative inline-flex">
                    <span className="ui-avatar-ring"><Avatar src={stats.photo_url || tgUser?.photo_url ? getFullPhotoUrl(stats.photo_url || tgUser?.photo_url) : undefined} name={displayName} size="lg" /></span>
                    <span className="ui-level-chip absolute -bottom-1.5 -end-1.5" aria-label={`${t('level')} ${stats.level ?? 1}`}>{stats.level ?? 1}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[28px] font-bold leading-none tracking-tight text-brand-primary tabular-nums"><CountUp value={stats.elo ?? 0} /> <span className="text-sm font-semibold text-brand-muted">{t('elo')}</span></span>
                    <span className="mt-1.5 block text-caption font-medium text-brand-muted">{t('nav_profile')}</span>
                  </span>
                </Link>
                <Link href={`/${locale}/wallet`} className="flex min-h-11 items-center gap-2 rounded-xl border border-brand-border bg-brand-elevated px-3.5 transition-colors hover:border-brand-border-opacity-30" onClick={() => telegramHaptic('selection')}>
                  <FiCreditCard size={18} aria-hidden="true" className="text-brand-muted" />
                  <span className={`text-sm font-bold tabular-nums ${balanceError ? 'text-brand-danger' : 'text-brand-primary'}`}>{balanceError || loadingBalance ? '$ —' : `$${(walletBalance / 100).toFixed(2)}`}</span>
                  <span className="sr-only">{t('nav_wallet')}</span>
                </Link>
              </div>
              <XPProgressBar xp={stats.xp || 0} level={stats.level || 1} levelLabel={t('level')} />
              <dl className="grid grid-cols-3 gap-3 border-t border-brand-border pt-4">
                <div className="flex flex-col justify-between gap-1"><dt className="ui-stat__label">{t('win_rate')}</dt><dd className="mt-1 text-xl font-bold tabular-nums">{stats.win_rate == null ? '—' : `${stats.win_rate.toFixed(1)}%`}</dd></div>
                <div className="flex flex-col justify-between gap-1"><dt className="ui-stat__label">{t('current_streak')}</dt><dd className="mt-1 text-xl font-bold tabular-nums">{stats.current_streak?.count || 0}{(stats.current_streak?.count ?? 0) > 0 && stats.current_streak?.type !== 'none' && <span className="ms-1 text-caption font-semibold text-brand-muted">{stats.current_streak?.type === 'win' ? t('wins')[0] : stats.current_streak?.type === 'draw' ? t('draws')[0] : t('losses')[0]}</span>}</dd></div>
                <div className="flex flex-col justify-between gap-1"><dt className="ui-stat__label">{t('games_played')}</dt><dd className="mt-1 text-xl font-bold tabular-nums">{stats.games_played == null ? '—' : stats.games_played.toLocaleString(locale)}</dd></div>
              </dl>
            </div>
          )}
          <div className="reveal-in" style={{ '--reveal-i': 1 } as React.CSSProperties}>
            <ActionLink href={`/${locale}/game`} primary icon={<FaChessKnight />}>
              <span className="block text-2xl font-bold tracking-tight">{t('play')}</span>
              <span className="mt-1 block text-sm font-semibold">{t('execute_matchmaking')}</span>
            </ActionLink>
          </div>
          <div className="reveal-in" style={{ '--reveal-i': 2 } as React.CSSProperties}><ArenaBanner /></div>
          <div className="reveal-in grid grid-cols-3 gap-2.5" style={{ '--reveal-i': 3 } as React.CSSProperties}>
            <QuickTile href={`/${locale}/academy`} icon={<FaGraduationCap size={20} />} tone="info" label={t('academy')} />
            <QuickTile href={`/${locale}/marketplace`} icon={<FiShoppingBag size={20} />} tone="gold" label={t('nav_marketplace')} />
            <QuickTile href={`/${locale}/challenges`} icon={<FaTrophy size={19} />} tone="success" label={t('nav_quests')} badge={claimable} />
          </div>
        </div>
        <div className="min-w-0 space-y-6">
          <EngagementQuest />
          <div className="reveal-in" style={{ '--reveal-i': 4 } as React.CSSProperties}><DailyGoalsBento /></div>
          <section aria-labelledby="home-leaderboard" className="reveal-in w-full space-y-3" style={{ '--reveal-i': 5 } as React.CSSProperties}><SectionHeader id="home-leaderboard" title={t('leaderboard')} /><Leaderboard /></section>
        </div>
      </div>
    </main>
  </LayoutWrapper>
 );
}
