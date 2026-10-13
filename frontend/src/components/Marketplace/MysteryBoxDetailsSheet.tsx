'use client';

import React from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { FiLock } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import { DROP_KIND_COLOR, BOX_CONFIG, type BoxTier } from './boxConfig';

interface MysteryBoxDetailsSheetProps {
    tier: BoxTier;
    userXP: number;
    disabled?: boolean;
    onClose: () => void;
    onUnbox: () => void;
}

export default function MysteryBoxDetailsSheet({ tier, userXP, disabled, onClose, onUnbox }: MysteryBoxDetailsSheetProps) {
  const t = useTranslations('Marketplace');
  const cfg = BOX_CONFIG[tier], affordable = userXP >= cfg.costXP, locked = disabled || !affordable;
  return <Drawer isOpen onClose={onClose} title={cfg.name} description={cfg.tagline}
    footer={<Button variant="primary" className="w-full" disabled={locked} leftIcon={locked ? <FiLock /> : undefined} onClick={() => { onClose(); onUnbox(); }}>
      {disabled ? t('unavailable') : affordable ? `${t('unbox')} · ${cfg.costXP.toLocaleString()} XP` : t('need_more_xp', { amount: (cfg.costXP - userXP).toLocaleString() })}
    </Button>}>
    <h3 className="t-body font-semibold">{t('whats_inside')}</h3>
    <ul className="space-y-3">{cfg.drops.map(drop => <li key={drop.label} className="flex justify-between gap-3 t-body">
      <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: DROP_KIND_COLOR[drop.kind] }} aria-hidden="true" />{drop.label}</span><bdi className="tabular-nums">{drop.chance}%</bdi>
    </li>)}</ul>
  </Drawer>;
}
