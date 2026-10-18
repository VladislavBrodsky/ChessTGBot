'use client';

import { useState, useEffect } from 'react';
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
import { MetaLine } from '@/components/ui/MetaLine';
import { PageHeader, SectionHeader, ActionLink } from '@/components/ui/PageHeader';
import { QuickTile } from '@/components/ui/QuickTile';
import { CountUp } from '@/components/ui/CountUp';
import { HeroCardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import XPProgressBar from '@/components/XPProgressBar';
import FirstRunCoordinator from '@/components/FirstRunCoordinator';
import { InvitationInboxCard } from '@/components/FriendInvitations';
import NotificationModal from '@/components/NotificationModal';
import DailyGoalsBento from '@/components/DailyGoalsBento';
import EngagementQuest from '@/components/EngagementQuest';
import { GramVaultPreview } from '@/components/GramVaultPreview';
import { telegramHaptic } from '@/lib/telegram';

export default function Home() {
 const t = useTranslations('Index');
  const tc = useTranslations('Common');
 const locale = useLocale();
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
   setMounted(true);
   // Init Telegram WebApp Data
   if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
     const tg = window.Telegram.WebApp;
     setTgUser(tg.initDataUnsafe?.user);
   }
 }, []);



 return (
  <LayoutWrapper hideHeaderControls>
    <FirstRunCoordinator />
    <NotificationModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    <main className="app-page">
      <PageHeader align="start" eyebrow={t('welcome_greeting')} title={displayName} actions={<>
        <Button variant="secondary" className="h-11 w-11 p-0" aria-label={tc('notifications')} onClick={() => setShowNotifications(true)}><FiBell size={20} /></Button>
        <Link href={`/${locale}/settings`} aria-label={t('nav_settings')} className="ui-icon-button" onClick={() => telegramHaptic('selection')}><FiSettings size={20} /></Link>
      </>} />
      <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 space-y-3 lg:sticky lg:top-6">
          {!stats && !loadingStats && statsError ? (
            <ErrorState title={t('load_failed')} onRetry={() => syncStats()} retryLabel={t('retry')} />
          ) : !stats ? (
            <HeroCardSkeleton label={t('level')} />
          ) : (
            <div className="ui-hero-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/${locale}/profile`} className="flex min-h-11 min-w-0 items-center gap-3 rounded-xl" onClick={() => telegramHaptic('selection')}>
                  <span className="inline-flex">
                    <span className="ui-avatar-ring"><Avatar src={stats.photo_url || tgUser?.photo_url ? getFullPhotoUrl(stats.photo_url || tgUser?.photo_url) : undefined} name={displayName} size="lg" /></span>
                  </span>
                  <span className="min-w-0">
                    <span className="t-numeric-lg block text-brand-primary"><CountUp value={stats.elo ?? 0} /></span>
                    <MetaLine className="mt-1 text-caption font-medium text-brand-muted"><span>{t('elo')}</span><span>{t('nav_profile')}</span></MetaLine>
                  </span>
                </Link>
                <Link href={`/${locale}/wallet`} className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-brand-border bg-brand-elevated px-3 transition-colors hover:border-brand-border-opacity-30" onClick={() => telegramHaptic('selection')}>
                  <FiCreditCard size={18} aria-hidden="true" className="text-brand-muted" />
                  <span className={`text-sm font-bold tabular-nums ${balanceError ? 'text-brand-danger' : 'text-brand-primary'}`}>{balanceError || loadingBalance ? '$ —' : `$${(walletBalance / 100).toFixed(2)}`}</span>
                  <span className="sr-only">{t('nav_wallet')}</span>
                </Link>
              </div>
              <XPProgressBar xp={stats.xp || 0} level={stats.level || 1} levelLabel={t('level')} />
              <dl className="grid grid-cols-3 gap-2 border-t border-brand-border pt-3">
                <div className="flex flex-col justify-between gap-1"><dt className="ui-stat__label">{t('win_rate')}</dt><dd className="t-numeric">{stats.win_rate == null ? '—' : `${stats.win_rate.toFixed(1)}%`}</dd></div>
                <div className="flex flex-col justify-between gap-1"><dt className="ui-stat__label">{t('current_streak')}</dt><dd className="t-numeric">{stats.current_streak?.count || 0}{(stats.current_streak?.count ?? 0) > 0 && stats.current_streak?.type !== 'none' && <span className="ms-1 text-caption font-semibold text-brand-muted">{stats.current_streak?.type === 'win' ? t('wins')[0] : stats.current_streak?.type === 'draw' ? t('draws')[0] : t('losses')[0]}</span>}</dd></div>
                <div className="flex flex-col justify-between gap-1"><dt className="ui-stat__label">{t('games_played')}</dt><dd className="t-numeric">{stats.games_played == null ? '—' : stats.games_played.toLocaleString(locale)}</dd></div>
              </dl>
            </div>
          )}
          <div className="w-full">
            <ActionLink
              href={`/${locale}/game`}
              primary
              icon={<FaChessKnight />}
            >
              <span className="t-title-2 block">{t('play')}</span>
              <span className="block text-sm font-semibold">{t('execute_matchmaking')}</span>
            </ActionLink>
          </div>
          <InvitationInboxCard />
          <EngagementQuest />
          <GramVaultPreview />
          <div className="w-full"><ArenaBanner /></div>
          <div className="ui-quick-grid">
            <QuickTile href={`/${locale}/academy`} icon={<FaGraduationCap size={20} />} tone="info" label={t('academy')} />
            <QuickTile href={`/${locale}/marketplace`} icon={<FiShoppingBag size={20} />} tone="gold" label={t('nav_marketplace')} />
            <QuickTile href={`/${locale}/challenges`} icon={<FaTrophy size={19} />} tone="success" label={t('nav_quests')} badge={claimable} />
          </div>
        </div>
        <div className="min-w-0 space-y-4">
          <div className="w-full"><DailyGoalsBento /></div>
          <section aria-labelledby="home-leaderboard" className="w-full space-y-2"><SectionHeader id="home-leaderboard" title={t('leaderboard')} align="center" /><Leaderboard /></section>
        </div>
      </div>
    </main>
  </LayoutWrapper>
 );
}
