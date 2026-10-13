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
import { useTranslations } from 'next-intl';
import { FaGlobeAmericas, FaGlobeEurope, FaGlobeAfrica, FaGlobeAsia } from 'react-icons/fa';

import { useUser } from '@/context/UserContext';
import { apiFetch } from '@/lib/api';
import { telegramHaptic } from '@/lib/telegram';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const SESSION_KEY = 'region_prompt_seen';

const REGIONS: { id: string; icon: React.ReactNode }[] = [
  { id: 'americas', icon: <FaGlobeAmericas /> },
  { id: 'europe_africa', icon: <FaGlobeEurope /> },
  { id: 'mena_sasia', icon: <FaGlobeAfrica /> },
  { id: 'apac', icon: <FaGlobeAsia /> },
];

interface RegionPromptProps {
  onClose?: () => void;
}

export default function RegionPrompt({ onClose }: RegionPromptProps = {}) {
  const t = useTranslations('RegionPrompt');
  const { stats, syncStats } = useUser();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!stats) return; // wait for the synced profile
    if (stats.region) return; // already answered
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) return;
    setOpen(true);
  }, [stats?.region, stats]);

  const dismiss = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem(SESSION_KEY, '1');
    setOpen(false);
    onClose?.();
  };
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
      onClose?.();
    } catch {
      setSaving(null); // let them retry
    }
  };

  return <Modal isOpen={open} onClose={dismiss} title={t('title')} description={t('subtitle')} maxWidth="sm" layer={120}
    footer={<Button variant="ghost" className="w-full" onClick={dismiss}>{t('skip')}</Button>}>
    <div className="grid grid-cols-2 gap-3">{REGIONS.map(r => <Button key={r.id} variant="secondary" className="flex-col min-h-24" disabled={Boolean(saving)} isLoading={saving === r.id} onClick={() => choose(r.id)}>
      <span className="text-xl text-brand-muted" aria-hidden="true">{r.icon}</span><span className="t-caption">{t(`region_${r.id}`)}</span>
    </Button>)}</div>
  </Modal>;
}
