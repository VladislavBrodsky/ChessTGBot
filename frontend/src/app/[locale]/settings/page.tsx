'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FiBell, FiChevronDown, FiChevronRight, FiCreditCard, FiHelpCircle, FiMoon, FiRefreshCw, FiSettings, FiShield, FiSliders, FiVolume2, FiZap } from 'react-icons/fi';
import { FaGem } from 'react-icons/fa';
import LayoutWrapper from '@/components/LayoutWrapper';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Drawer } from '@/components/ui/Drawer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { useTheme } from '@/context/ThemeContext';
import { useReducedMotionPreference } from '@/context/ReducedMotionContext';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { useSoundPreference } from '@/hooks/useSoundPreference';
import { apiFetch } from '@/lib/api';
import { telegramHaptic } from '@/lib/telegram';

function SettingToggle({ icon, label, description, checked, onChange, disabled = false, busy = false }: {
  icon: ReactNode; label: string; description: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; busy?: boolean;
}) {
  return <div className="settings-row" aria-busy={busy || undefined}>
    <span className="settings-row__icon" aria-hidden="true">{icon}</span>
    <Switch className="min-w-0 flex-1" label={label} description={description} checked={checked} onChange={onChange} disabled={disabled} />
  </div>;
}

function SettingLink({ href, icon, label, description, badge }: {
  href: string; icon: ReactNode; label: string; description: ReactNode; badge?: ReactNode;
}) {
  return <Link href={href} onClick={() => telegramHaptic('selection')} className="settings-row settings-row--interactive">
    <span className="settings-row__icon" aria-hidden="true">{icon}</span>
    <div className="settings-row__copy">
      <div className="flex flex-wrap items-center gap-2"><span className="t-label text-brand-primary">{label}</span>{badge}</div>
      <div className="t-caption text-brand-muted">{description}</div>
    </div>
    <FiChevronRight className="settings-row__chevron rtl:rotate-180" aria-hidden="true" />
  </Link>;
}

export default function SettingsPage() {
  const t = useTranslations('Settings');
  const tg = useTranslations('Gram');
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const { reducedMotion, setReducedMotion } = useReducedMotionPreference();
  const { soundEnabled, setSoundEnabled } = useSoundPreference();
  const toast = useToast();
  const { walletAddress, stats, syncStats, syncBalance, loadingStats, loadingBalance, gramLeaderboardVisible } = useUser();
  const [isSavingGram, setIsSavingGram] = useState(false);
  const [gramVisible, setGramVisible] = useState(false);
  useEffect(() => { if (typeof gramLeaderboardVisible === "boolean") setGramVisible(gramLeaderboardVisible); }, [gramLeaderboardVisible]);
  const saveGramVisibility = async (next: boolean) => {
    if (isSavingGram) return;
    const previous = gramVisible; setGramVisible(next); setIsSavingGram(true);
    try {
      const response = await apiFetch("/api/v1/wallet/gram-leaderboard-visibility", { method: "PUT", body: JSON.stringify({ visible: next }) });
      if (!response.ok) throw new Error("Preference unavailable");
      void syncBalance().catch(() => {});
    } catch { setGramVisible(previous); toast.error(tg("privacy_error")); }
    finally { setIsSavingGram(false); }
  };
  const [showHelp, setShowHelp] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [arenaAlerts, setArenaAlerts] = useState(true);
  const [isSavingAlerts, setIsSavingAlerts] = useState(false);

  useEffect(() => {
    if (typeof stats?.arena_notifications === 'boolean') setArenaAlerts(stats.arena_notifications);
  }, [stats?.arena_notifications]);

  const handleArenaAlertsToggle = async (next: boolean) => {
    if (isSavingAlerts) return;
    const previous = arenaAlerts;
    setArenaAlerts(next);
    setIsSavingAlerts(true);
    try {
      const response = await apiFetch('/api/v1/gamification/arena-notifications', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: next }),
      });
      if (!response.ok) throw new Error('Preference update failed');
      // Revalidate independently: a refresh failure must not undo a saved preference.
      void syncStats().catch(() => {});
    } catch {
      setArenaAlerts(previous);
      toast.error(t('alerts_error'));
    } finally { setIsSavingAlerts(false); }
  };

  const handleResync = async () => {
    if (isResyncing) return;
    setIsResyncing(true);
    try {
      const [account, balance] = await Promise.all([syncStats(), syncBalance()]);
      if (!account || !balance) throw new Error('Account refresh unavailable');
      telegramHaptic('success');
      toast.success(t('refresh_success'));
    } catch { toast.error(t('refresh_error')); }
    finally { setIsResyncing(false); }
  };

  const tgId = stats?.telegram_id || (typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id : null);
  const isAdmin = Boolean(stats?.is_admin || tgId === 1016749901 || tgId === 716720099);
  const faqItems = ['1', '2', '3', '4'] as const;

  return <LayoutWrapper>
    <main className="app-page settings-page">
      <PageHeader title={t('title')} description={t('subtitle')} icon={<FiSettings />} align="start" backHref={`/${locale}/home`} backLabel={t('return')} />
      <div className="settings-layout">
        <section aria-labelledby="settings-preferences-title">
          <Card variant="solid" className="settings-panel p-0">
            <h2 id="settings-preferences-title" className="settings-panel__heading t-title-3">{t('preferences')}</h2>
            <div className="settings-list">
              <LanguageSwitcher />
              <SettingToggle icon={<FiMoon />} label={t('luminance_mode')} description={t('appearance_description')}
                checked={theme === 'dark'} onChange={checked => setTheme(checked ? 'dark' : 'light')} />
              <SettingToggle icon={<FiZap />} label={t('reduce_motion')} description={t('motion_description')}
                checked={reducedMotion} onChange={setReducedMotion} />
              <SettingToggle icon={<FiVolume2 />} label={t('audio_protocol')} description={t('sound_description')}
                checked={soundEnabled} onChange={setSoundEnabled} />
              <SettingToggle icon={<FiBell />} label={t('arena_alerts')} description={isSavingAlerts ? t('saving') : t('arena_description')}
                checked={arenaAlerts} onChange={handleArenaAlertsToggle} busy={isSavingAlerts}
                disabled={isSavingAlerts || (!stats && loadingStats)} />
            </div>
          </Card>
        </section>
        <div className="settings-secondary">
          <section aria-labelledby="settings-account-title">
            <Card variant="solid" className="settings-panel p-0">
              <h2 id="settings-account-title" className="settings-panel__heading t-title-3">{t('account')}</h2>
              <div className="settings-list">
                <SettingLink href={`/${locale}/wallet`} icon={<FiCreditCard />} label={t('ton_wallet')}
                  description={loadingBalance && !walletAddress ? <Skeleton textRole="caption" width="var(--size-stat-min)" /> : walletAddress ? <bdi className="font-mono">{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</bdi> : t('ton_not_connected')} />
                <SettingToggle icon={<FiShield />} label={tg("privacy_title")} description={tg("privacy_description")} checked={gramVisible} onChange={saveGramVisibility} busy={isSavingGram} disabled={isSavingGram || gramLeaderboardVisible == null} />
                <SettingLink href={`/${locale}/membership`} icon={<FaGem />} label={t('premium_membership')}
                  description={t('membership_details')} badge={stats?.is_premium ? <Badge variant="purple" size="counter">{t('membership_active')}</Badge> : undefined} />
                <details className="settings-tools">
                  <summary className="settings-row settings-row--interactive">
                    <span className="settings-row__icon" aria-hidden="true"><FiSliders /></span>
                    <span className="settings-row__copy t-label text-brand-primary">{t('account_tools')}</span>
                    <FiChevronDown className="settings-row__chevron" aria-hidden="true" />
                  </summary>
                  <div className="settings-tools__body">
                    <p className="t-caption text-brand-muted">{t('data_sync_description')}</p>
                    <Button variant="secondary" size="sm" isLoading={isResyncing} onClick={handleResync} leftIcon={<FiRefreshCw />}>
                      {isResyncing ? t('refreshing') : t('refresh')}
                    </Button>
                    {isAdmin && <SettingLink href={`/${locale}/admin`} icon={<FiShield />} label={t('command_center')} description={t('manage_admin')} badge={<Badge size="counter">{t('admin')}</Badge>} />}
                  </div>
                </details>
              </div>
            </Card>
          </section>
          <section aria-labelledby="settings-help-title">
            <Card variant="solid" className="settings-panel p-0">
              <h2 id="settings-help-title" className="settings-panel__heading t-title-3">{t('help')}</h2>
              <Button variant="ghost" className="settings-row settings-row--interactive" aria-haspopup="dialog" aria-expanded={showHelp} onClick={() => setShowHelp(true)}>
                <span className="settings-row__icon" aria-hidden="true"><FiHelpCircle /></span>
                <span className="settings-row__copy"><span className="block t-label text-brand-primary">{t('faq_title')}</span><span className="block t-caption text-brand-muted">{t('help_description')}</span></span>
                <FiChevronRight className="settings-row__chevron rtl:rotate-180" aria-hidden="true" />
              </Button>
            </Card>
          </section>
        </div>
      </div>
      {showHelp && <Drawer isOpen onClose={() => setShowHelp(false)} title={t('faq_title')}>
        <Card variant="solid" className="settings-list p-0">
          {faqItems.map(item => <details key={item} className="settings-faq">
            <summary className="settings-row settings-row--interactive">
              <span className="settings-row__copy t-label text-brand-primary">{t(`faq_q${item}`)}</span>
              <FiChevronDown className="settings-row__chevron" aria-hidden="true" />
            </summary>
            <p className="settings-faq__answer t-body text-brand-muted">{t(`faq_a${item}`)}</p>
          </details>)}
        </Card>
      </Drawer>}
    </main>
  </LayoutWrapper>;
}
