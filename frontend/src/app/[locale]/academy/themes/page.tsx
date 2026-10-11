'use client';

import { useState, useEffect } from "react";
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { useUser } from '@/context/UserContext';
import { SkeletonList } from '@/components/ui/Skeleton';
import { apiFetch } from "@/lib/api";
import { FaCheck, FaLock } from "react-icons/fa";
import { telegramHaptic, telegramAlert } from "@/lib/telegram";
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useLocale, useTranslations } from 'next-intl';
import LayoutWrapper from "@/components/LayoutWrapper";
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

interface Theme {
  id: number;
  code: string;
  theme_type: string;
  name: string;
  description: string;
  price_xp: number;
  css_class: string;
  owned: boolean;
}

import ThemeConfirmSheet from "@/components/Academy/ThemeConfirmSheet";
import { FiLayers } from 'react-icons/fi';

export default function ThemeShopPage() {
  const locale = useLocale();
  const t = useTranslations('Marketplace');
  const ti = useTranslations('Index');
  const { data, error: loadError, isLoading: loading, mutate: refreshThemes } = useSWRFetch<Theme[]>('/api/v1/gamification/themes', { revalidateOnFocus: false });
  const themes = Array.isArray(data) ? data : [];
  const { stats, syncStats } = useUser();
  const userXp = stats?.xp ?? 0;
  const [activeThemeCode, setActiveThemeCode] = useState<string>('default');
  const [confirmingTheme, setConfirmingTheme] = useState<Theme | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  useEffect(() => {
    try { setActiveThemeCode(localStorage.getItem('board_theme') || 'default'); } catch { /* restricted storage */ }
  }, []);

  const handleEquip = (themeCode: string) => {
    telegramHaptic('light');
    localStorage.setItem('board_theme', themeCode);
    setActiveThemeCode(themeCode);
  };

  const handleBuy = (theme: Theme) => {
    if (theme.owned) return;
    if (userXp < theme.price_xp) {
      telegramAlert(t('need_more_xp', { amount: theme.price_xp - userXp }));
      telegramHaptic('error');
      return;
    }
    setConfirmingTheme(theme);
  };

  const handleConfirmBuy = async () => {
    if (!confirmingTheme) return;
    const theme = confirmingTheme;
    telegramHaptic('medium');
    setPurchasing(true);
    
    try {
      const res = await apiFetch('/api/v1/gamification/themes/buy', {
        method: 'POST',
        body: JSON.stringify({ theme_code: theme.code })
      });
      
      if (res.ok) {
        telegramHaptic('success');
        await Promise.allSettled([refreshThemes(), syncStats()]);
        setConfirmingTheme(null);
        if (typeof window !== 'undefined' && 'Audio' in window) {
          new Audio('/sounds/win.mp3').play().catch(e => console.log('Audio blocked', e));
        }
      } else {
        telegramHaptic('error');
        telegramAlert(t('theme_failed'));
        setConfirmingTheme(null);
      }
    } catch (e) {
      console.error(e);
      telegramHaptic('error');
      setConfirmingTheme(null);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <LayoutWrapper className="">
    <div className="w-full app-page mx-auto relative z-10 flex flex-col">
      <PageHeader icon={<FiLayers />} tone="premium" title={t('section_themes')} description={t('theme_default_desc')} backHref={`/${locale}/academy`} />
      <div className="flex items-center gap-2 text-sm"><span className="text-brand-muted">{t('xp_balance')}</span><span className="font-semibold tabular-nums">{stats ? userXp.toLocaleString(locale) : '—'} XP</span></div>

      {loading && <SkeletonList count={2} />}
      {loadError && !data && <ErrorState title={ti('load_failed')} onRetry={() => { void refreshThemes(); }} retryLabel={ti('retry')} />}
      {!loading && !loadError && themes.length === 0 && <EmptyState title={t('section_themes')} description={t('theme_default_desc')} />}

      <div className="space-y-4">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`relative p-4 rounded-2xl border flex items-center justify-between transition-all ${
              theme.owned 
                ? 'glass-panel ui-stat--premium' 
                : 'glass-panel'
            }`}
          >
            <div className="flex-1">
              <h2 className="text-base font-semibold text-brand-primary normal-case mb-1">{theme.name}</h2>
              <p className="text-sm text-brand-muted font-medium leading-tight">{theme.description}</p>
            </div>
            
            <div className="ms-3 shrink-0">
              {theme.owned ? (
                activeThemeCode === theme.code ? (
                  <Badge variant="emerald" icon={<FaCheck />}>{t('active')}</Badge>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => handleEquip(theme.code)}>
                    {t('equip')}
                  </Button>
                )
              ) : (
                <Button variant={userXp >= theme.price_xp ? 'premium' : 'secondary'} size="sm" leftIcon={<FaLock />}
                  disabled={userXp < theme.price_xp} onClick={() => handleBuy(theme)}>
                  {theme.price_xp.toLocaleString(locale)} XP
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>

    <ThemeConfirmSheet
      isOpen={Boolean(confirmingTheme)}
      themeName={confirmingTheme?.name || ''}
      themeDescription={confirmingTheme?.description}
      priceXP={confirmingTheme?.price_xp || 0}
      userXP={userXp}
      loading={purchasing}
      onConfirm={handleConfirmBuy}
      onCancel={() => setConfirmingTheme(null)}
    />
    </LayoutWrapper>
  );
}
