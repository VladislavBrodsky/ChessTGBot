'use client';


import React from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { FiCheck } from 'react-icons/fi';
import MysteryBoxArt from './MysteryBoxArt';
import { BOX_CONFIG, type BoxTier } from './boxConfig';

interface UnboxConfirmSheetProps {
    isOpen: boolean;
    tier: BoxTier | null;
    userXP: number;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function UnboxConfirmSheet({ isOpen, tier, userXP, loading = false, onConfirm, onCancel }: UnboxConfirmSheetProps) {
  const t = useTranslations('Marketplace');
  if (!tier) return null;
  const cfg = BOX_CONFIG[tier], affordable = userXP >= cfg.costXP;
  const cancel = () => { if (!loading) onCancel(); };
  return <Drawer isOpen={isOpen} onClose={cancel} title={cfg.name} description={cfg.tagline}
    footer={<div className="grid grid-cols-2 gap-3"><Button variant="secondary" onClick={cancel} disabled={loading}>{t('back')}</Button><Button variant="primary" onClick={onConfirm} disabled={!affordable || loading} isLoading={loading} leftIcon={<FiCheck />}>{t('confirm')}</Button></div>}>
    <div className="relative h-32 flex items-center justify-center"><MysteryBoxArt tier={tier} /></div>
    <dl className="result-metrics"><div><dt>{t('xp_balance')}</dt><dd><bdi>{userXP.toLocaleString()} XP</bdi></dd></div><div><dt>{t('cost')}</dt><dd><bdi>{cfg.costXP.toLocaleString()} XP</bdi></dd></div></dl>
  </Drawer>;
}
