'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FiGift, FiAward, FiZap, FiCheck, FiStar, FiRefreshCw } from 'react-icons/fi';
import { telegramHaptic } from '@/lib/telegram';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAnimationsEnabled } from '@/hooks/useAnimationsEnabled';
import { BOX_CONFIG, type BoxTier, type DropRarity } from './boxConfig';
interface UnboxingModalProps { isOpen: boolean; onClose: () => void; tier: BoxTier | null; prizeName: string | null; prizeType: string | null }
const ICONS: Record<string, React.ReactNode> = { refund: <FiRefreshCw />, boost: <FiZap />, cosmetic: <FiAward />, premium: <FiStar /> };
export default function UnboxingModal({ isOpen, onClose, tier, prizeName, prizeType }: UnboxingModalProps) {
  const t = useTranslations('Marketplace');
  const animations = useAnimationsEnabled();
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!isOpen || !prizeName || !prizeType) return;
    setRevealed(!animations);
    if (!animations) return;
    const timer = setTimeout(() => { setRevealed(true); telegramHaptic('success'); }, 980);
    return () => clearTimeout(timer);
  }, [isOpen, prizeName, prizeType, animations]);
  const cfg = tier ? BOX_CONFIG[tier] : null;
  if (!cfg || !prizeName || !prizeType) return null;
  const known: DropRarity[] = ['refund', 'boost', 'cosmetic', 'premium'];
  const kind = known.includes(prizeType as DropRarity) ? t(`prize_kind_${prizeType}` as 'prize_kind_refund') : t('reward');
  return <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" title={revealed ? prizeName : t('unboxing')} description={revealed ? t('added_to_inventory') : undefined}
    footer={revealed && <Button variant="primary" className="w-full" onClick={onClose} leftIcon={<FiCheck />}>{t('awesome')}</Button>}>
    <div className="min-h-48 flex flex-col items-center justify-center gap-4 text-center">
      <motion.div initial={false} animate={!revealed && animations ? { rotate: [-3, 3, -3, 3, 0] } : { rotate: 0 }} transition={{ duration: 0.55, repeat: 1 }}
        className="w-28 h-28 rounded-3xl border border-brand-border bg-brand-elevated flex items-center justify-center text-4xl" style={{ color: cfg.theme.accent }}>
        {revealed ? ICONS[prizeType] ?? <FiGift /> : <FiGift />}
      </motion.div>
      {revealed && <Badge variant="purple">{kind}</Badge>}
    </div>
  </Modal>;
}
