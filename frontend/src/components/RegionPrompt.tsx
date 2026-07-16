'use client';

/**
 * One-time-per-session prompt asking the user for their coarse region. The
 * answer times the Daily Arena heads-up for their local prime hours (see
 * backend app.services.arena_targeting). Shown when the synced profile has no
 * region yet; dismissible, and re-asked on the next app entry until answered
 * (a per-session sessionStorage guard keeps it from re-appearing on every
 * route change within one visit).
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FaGlobeAmericas, FaGlobeEurope, FaGlobeAfrica, FaGlobeAsia } from 'react-icons/fa';

import { useUser } from '@/context/UserContext';
import { apiFetch } from '@/lib/api';
import { telegramHaptic } from '@/lib/telegram';
import { useNavbar } from '@/context/NavbarContext';
import { useDialogAccessibility } from '@/hooks/useDialogAccessibility';

const SESSION_KEY = 'region_prompt_seen';

const REGIONS: { id: string; icon: React.ReactNode }[] = [
  { id: 'americas', icon: <FaGlobeAmericas /> },
  { id: 'europe_africa', icon: <FaGlobeEurope /> },
  { id: 'mena_sasia', icon: <FaGlobeAfrica /> },
  { id: 'apac', icon: <FaGlobeAsia /> },
];

export default function RegionPrompt() {
  const t = useTranslations('RegionPrompt');
  const { stats, syncStats } = useUser();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const { pushHide, popHide } = useNavbar();

  useEffect(() => {
    if (!stats) return; // wait for the synced profile
    if (stats.region) return; // already answered
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) return;
    setOpen(true);
  }, [stats?.region, stats]);

  const dismiss = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem(SESSION_KEY, '1');
    setOpen(false);
  };
  const dialogRef = useDialogAccessibility(open, dismiss);

  useEffect(() => {
    if (!open) return;
    pushHide();
    return () => popHide();
  }, [open, popHide, pushHide]);

  const choose = async (regionId: string) => {
    if (saving) return;
    setSaving(regionId);
    telegramHaptic('medium');
    try {
      const res = await apiFetch('/api/v1/gamification/region', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: regionId }),
      });
      if (!res.ok) throw new Error('failed');
      if (typeof window !== 'undefined') sessionStorage.setItem(SESSION_KEY, '1');
      syncStats();
      setOpen(false);
    } catch {
      setSaving(null); // let them retry
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={dismiss}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="region-prompt-title"
            tabIndex={-1}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-brand-primary/15 bg-brand-surface p-5 shadow-premium"
          >
            <div className="text-center mb-4">
              <span className="text-2xl">🏟️</span>
              <h2 id="region-prompt-title" className="text-base font-black uppercase tracking-wide text-brand-primary mt-2">
                {t('title')}
              </h2>
              <p className="text-[11px] font-bold text-brand-primary/50 mt-1.5 leading-relaxed">
                {t('subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => choose(r.id)}
                  disabled={!!saving}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
                    saving === r.id
                      ? 'border-amber-400/50 bg-amber-500/10'
                      : 'border-brand-primary/10 bg-brand-bg-opacity-5 hover:border-brand-primary/30'
                  } ${saving && saving !== r.id ? 'opacity-40' : ''}`}
                >
                  <span className="text-xl text-brand-primary/70">{r.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-wide text-brand-primary text-center leading-tight">
                    {t(`region_${r.id}`)}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={dismiss}
              className="w-full mt-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-brand-primary/40 hover:text-brand-primary/70 transition-colors"
            >
              {t('skip')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
