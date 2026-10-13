'use client';

import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { FaTrophy, FaCoins } from 'react-icons/fa';
import { telegramHaptic } from '@/lib/telegram';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAnimationsEnabled } from '@/hooks/useAnimationsEnabled';
interface SuccessState { title: string; xpReward: number }
export default function TaskSuccessModal() {
  const t = useTranslations('Gamification'), tc = useTranslations('Common');
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animations = useAnimationsEnabled();
  const handleClose = () => setSuccess(null);
  useEffect(() => {
    if (!success) return;
    const resize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    resize(); window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [success]);
  useEffect(() => {
    const completed = (e: Event) => { telegramHaptic('success'); setSuccess((e as CustomEvent<SuccessState>).detail); };
    window.addEventListener('task-success', completed);
    return () => window.removeEventListener('task-success', completed);
  }, []);
  return <Modal isOpen={Boolean(success)} onClose={handleClose} title={t('task_completed')} description={success?.title} maxWidth="sm" layer={120}
    footer={<Button variant="primary" className="w-full" onClick={handleClose}>{tc('continue')}</Button>}>
    {success && <div className="space-y-4 text-center">
      {animations && <div className="fixed inset-0 pointer-events-none overflow-hidden"><Confetti width={dimensions.width} height={dimensions.height} recycle={false} numberOfPieces={dimensions.width < 768 ? 56 : 100} gravity={0.25} /></div>}
      <span className="ui-icon-tile ui-icon-tile--success mx-auto"><FaTrophy aria-hidden="true" /></span>
      <div className="rounded-2xl border border-brand-border bg-brand-elevated p-4 space-y-2">
        <p className="t-caption text-brand-muted">{t('reward_received')}</p>
        <p className="t-numeric-lg flex justify-center items-center gap-2"><FaCoins className="text-brand-gold" aria-hidden="true" />+{success.xpReward} XP</p>
      </div>
    </div>}
  </Modal>;
}
