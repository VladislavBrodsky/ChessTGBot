'use client';

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { FaCheck, FaLock } from "react-icons/fa";
import { telegramHaptic, telegramAlert } from "@/lib/telegram";
import { PageHeader } from '@/components/ui/PageHeader';
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

export default function ThemeShopPage() {
  const locale = useLocale();
  const t = useTranslations('Marketplace');
  const ti = useTranslations('Index');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [userXp, setUserXp] = useState(0);
  const [activeThemeCode, setActiveThemeCode] = useState<string>('default');
  const [confirmingTheme, setConfirmingTheme] = useState<Theme | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadThemes = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [themesRes, userRes] = await Promise.all([
        apiFetch('/api/v1/gamification/themes'),
        apiFetch('/api/v1/users/sync', { method: 'POST' }),
      ]);
      if (!themesRes.ok || !userRes.ok) throw new Error('Theme data unavailable');
      const [themesData, userData] = await Promise.all([themesRes.json(), userRes.json()]);
      if (!Array.isArray(themesData) || !Number.isFinite(userData?.xp)) throw new Error('Invalid theme data');
      setThemes(themesData);
      setUserXp(userData.xp);
    } catch (error) {
      console.error('Could not load themes', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveThemeCode(localStorage.getItem('board_theme') || 'default');
    }
    
    void loadThemes();
  }, [loadThemes]);

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
        setThemes(themes.map(t => t.code === theme.code ? { ...t, owned: true } : t));
        setUserXp(prev => prev - theme.price_xp);
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

  if (loading) {
    return (
      <LayoutWrapper className="">
        <div className="w-full app-page mx-auto " role="status" aria-label={t('section_themes')}>
          <div className="mx-auto h-9 w-44 rounded-xl bg-brand-bg-opacity-10" />
          <div className="mx-auto h-3 w-32 rounded-full bg-brand-bg-opacity-5" />
          <div className="mx-auto h-9 w-36 rounded-full bg-brand-bg-opacity-10" />
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-28 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface" />
            ))}
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper className="">
    <div className="w-full app-page mx-auto relative z-10 flex flex-col">
      <PageHeader title={t('section_themes')} description={t('theme_default_desc')} backHref={`/${locale}/academy`} />
      <div className="flex items-center gap-2 text-sm"><span className="text-brand-muted">{t('xp_balance')}</span><span className="font-semibold tabular-nums">{userXp.toLocaleString(locale)} XP</span></div>

      {loadError && <ErrorState title={ti('load_failed')} onRetry={loadThemes} retryLabel={ti('retry')} />}
      {!loadError && themes.length === 0 && <EmptyState title={t('section_themes')} description={t('theme_default_desc')} />}

      <div className="space-y-4">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`relative p-4 rounded-2xl border flex items-center justify-between transition-all ${
              theme.owned 
                ? 'glass-panel border-purple-500/30 bg-purple-500/5' 
                : 'glass-panel border-brand-border-opacity-10 bg-brand-surface'
            }`}
          >
            <div className="flex-1">
              <h3 className="text-base font-semibold text-brand-primary normal-case mb-1">{theme.name}</h3>
              <p className="text-sm text-brand-muted font-medium leading-tight">{theme.description}</p>
            </div>
            
            <div className="ml-4 flex-shrink-0">
              {theme.owned ? (
                activeThemeCode === theme.code ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold normal-case text-sm">
                    <FaCheck /> {t('active')}
                  </div>
                ) : (
                  <button type="button"
                    onClick={() => handleEquip(theme.code)}
                    className="ui-tap-target px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold normal-case text-sm transition-all cursor-pointer"
                  >
                    {t('equip')}
                  </button>
                )
              ) : (
                <button type="button"
                  onClick={() => handleBuy(theme)}
                  className={`ui-tap-target flex items-center gap-2 px-4 py-2 rounded-xl font-semibold normal-case text-sm transition-all ${
                    userXp >= theme.price_xp 
                      ? 'bg-purple-500 text-white hover:bg-purple-400' 
                      : 'bg-brand-surface border border-brand-border-opacity-20 text-brand-muted cursor-not-allowed'
                  }`}
                >
                  <FaLock /> {theme.price_xp} XP
                </button>
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
