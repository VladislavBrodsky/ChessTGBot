'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { FaPalette, FaCheck, FaLock, FaCoins } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { telegramHaptic, telegramAlert, telegramConfirm } from "@/lib/telegram";

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

export default function ThemeShopPage() {
  const t = useTranslations('Academy');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [userXp, setUserXp] = useState(0);
  const [activeThemeCode, setActiveThemeCode] = useState<string>('default');

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

    telegramConfirm(`Unlock ${theme.name} for ${theme.price_xp} XP?`, async (confirmed) => {
      if (!confirmed) return;
      telegramHaptic('medium');
      
      try {
        const res = await apiFetch('/api/v1/gamification/themes/buy', {
          method: 'POST',
          body: JSON.stringify({ theme_code: theme.code })
        });
        
        if (res.ok) {
          telegramHaptic('success');
          setThemes(themes.map(t => t.code === theme.code ? { ...t, owned: true } : t));
          setUserXp(prev => prev - theme.price_xp);
          new Audio('/sounds/win.mp3').play().catch(e => console.log('Audio blocked', e));
        } else {
          telegramHaptic('error');
          const data = await res.json();
          telegramAlert(data.detail || "Failed to purchase theme");
        }
      } catch (e) {
        console.error(e);
        telegramHaptic('error');
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4 md:px-6 w-full max-w-sm md:max-w-xl lg:max-w-3xl mx-auto space-y-8 relative z-10 flex flex-col h-full overflow-y-auto hide-scrollbar">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-brand-primary uppercase tracking-tight flex items-center justify-center gap-3">
          <FaPalette className="text-amber-500" /> Theme Shop
        </h1>
        <p className="text-sm font-bold text-brand-primary opacity-60 tracking-widest uppercase">
          Customize your board
        </p>
        <div className="inline-flex items-center gap-2 bg-brand-surface border border-brand-border-opacity-20 px-4 py-2 rounded-full mt-4">
          <span className="text-xs font-black uppercase text-brand-primary/60">Your Balance:</span>
          <span className="text-sm font-black text-amber-400">{userXp} XP</span>
        </div>
      </div>

      <div className="space-y-4">
        {themes.map((theme, idx) => (
          <motion.div
            key={theme.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative p-4 rounded-2xl border flex items-center justify-between transition-all ${
              theme.owned 
                ? 'glass-panel border-amber-500/30 bg-amber-500/5' 
                : 'glass-panel border-brand-border-opacity-10 bg-brand-surface'
            }`}
          >
            <div className="flex-1">
              <h3 className="text-base font-black text-brand-primary uppercase mb-1">{theme.name}</h3>
              <p className="text-xs text-brand-primary/60 font-medium leading-tight">{theme.description}</p>
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
                      ? 'bg-amber-500 text-slate-900 hover:bg-amber-400' 
                      : 'bg-brand-surface border border-brand-border-opacity-20 text-brand-primary/40 cursor-not-allowed'
                  }`}
                >
                  <FaLock /> {theme.price_xp} XP
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
