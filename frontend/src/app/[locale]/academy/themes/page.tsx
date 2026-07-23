'use client';

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { FaPalette, FaCheck, FaLock } from "react-icons/fa";
import { telegramHaptic, telegramAlert } from "@/lib/telegram";
import LayoutWrapper from "@/components/LayoutWrapper";

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
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [userXp, setUserXp] = useState(0);
  const [activeThemeCode, setActiveThemeCode] = useState<string>('default');
  const [confirmingTheme, setConfirmingTheme] = useState<Theme | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveThemeCode(localStorage.getItem('board_theme') || 'default');
    }
    
    Promise.all([
      apiFetch('/api/v1/gamification/themes').then(res => res.json()),
      apiFetch('/api/v1/users/sync', { method: 'POST' }).then(res => res.json())
    ]).then(([themesData, userData]) => {
      setThemes(themesData);
      setUserXp(userData.xp);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleEquip = (themeCode: string) => {
    telegramHaptic('light');
    localStorage.setItem('board_theme', themeCode);
    setActiveThemeCode(themeCode);
  };

  const handleBuy = (theme: Theme) => {
    if (theme.owned) return;
    if (userXp < theme.price_xp) {
      telegramAlert(`You need ${theme.price_xp} XP to unlock this theme. Keep studying!`);
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
        const data = await res.json();
        telegramAlert(data.detail || "Failed to purchase theme");
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
      <LayoutWrapper className="pb-32 px-4 md:px-6 pt-[max(1rem,var(--app-safe-top))]">
        <div className="w-full max-w-sm md:max-w-xl lg:max-w-3xl mx-auto space-y-6 pt-2" role="status" aria-label="Loading board themes">
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
    <LayoutWrapper className="pb-32 px-4 md:px-6 pt-[max(1rem,var(--app-safe-top))]">
    <div className="pt-2 w-full max-w-sm md:max-w-xl lg:max-w-3xl mx-auto space-y-8 relative z-10 flex flex-col">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-brand-primary uppercase tracking-tight flex items-center justify-center gap-3">
          <FaPalette className="text-purple-500" /> Theme Shop
        </h1>
        <p className="text-sm font-bold text-brand-muted tracking-widest uppercase">
          Customize your board
        </p>
        <div className="inline-flex items-center gap-2 bg-brand-surface border border-brand-border-opacity-20 px-4 py-2 rounded-full mt-4">
          <span className="text-xs font-black uppercase text-brand-muted">Your Balance:</span>
          <span className="text-sm font-black text-amber-400">{userXp.toLocaleString()} XP</span>
        </div>
      </div>

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
              <h3 className="text-base font-black text-brand-primary uppercase mb-1">{theme.name}</h3>
              <p className="text-xs text-brand-muted font-medium leading-tight">{theme.description}</p>
            </div>
            
            <div className="ml-4 flex-shrink-0">
              {theme.owned ? (
                activeThemeCode === theme.code ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-black uppercase text-xs">
                    <FaCheck /> Active
                  </div>
                ) : (
                  <button
                    onClick={() => handleEquip(theme.code)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black uppercase text-xs transition-all cursor-pointer"
                  >
                    Equip
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleBuy(theme)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs transition-all ${
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
