'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FiGift, FiAward, FiZap, FiCheck, FiStar, FiRefreshCw, FiShare2 } from 'react-icons/fi';
import { FaTelegram } from 'react-icons/fa';
import { telegramHaptic } from '@/lib/telegram';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAnimationsEnabled } from '@/hooks/useAnimationsEnabled';
import { fireGlobalConfetti } from '@/components/ui/Confetti';
import { BOX_CONFIG, type BoxTier, type DropRarity } from './boxConfig';

interface UnboxingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: BoxTier | null;
  prizeName: string | null;
  prizeType: string | null;
}

const ICONS: Record<string, React.ReactNode> = {
  refund: <FiRefreshCw />,
  boost: <FiZap />,
  cosmetic: <FiAward />,
  premium: <FiStar />,
};

export default function UnboxingModal({ isOpen, onClose, tier, prizeName, prizeType }: UnboxingModalProps) {
  const t = useTranslations('Marketplace');
  const animations = useAnimationsEnabled();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!isOpen || !prizeName || !prizeType) return;
    setRevealed(!animations);
    if (!animations) return;
    const timer = setTimeout(() => {
      setRevealed(true);
      telegramHaptic('success');
      void fireGlobalConfetti();
    }, 980);
    return () => clearTimeout(timer);
  }, [isOpen, prizeName, prizeType, animations]);

  const cfg = tier ? BOX_CONFIG[tier] : null;
  if (!cfg || !prizeName || !prizeType) return null;

  const known: DropRarity[] = ['refund', 'boost', 'cosmetic', 'premium'];
  const kind = known.includes(prizeType as DropRarity)
    ? t(`prize_kind_${prizeType}` as 'prize_kind_refund')
    : t('reward');

  const handleShareToTelegram = () => {
    telegramHaptic('selection');
    const shareText = encodeURIComponent(
      `♟️ I just unboxed "${prizeName}" from the ${cfg.name} on Web3Chess!\n\nCan you beat my speed chess rating? Challenge me in Telegram: https://t.me/chess_hub_bot/app`
    );
    if (typeof window !== 'undefined') {
      window.open(`https://t.me/share/url?url=https://t.me/chess_hub_bot/app&text=${shareText}`, '_blank');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={revealed ? prizeName : t('unboxing')}
      description={revealed ? t('added_to_inventory') : undefined}
      footer={
        revealed && (
          <div className="flex flex-col gap-2 w-full">
            <button
              type="button"
              onClick={handleShareToTelegram}
              className="ui-tap-target w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-[#24A1DE] hover:bg-[#208fC6] text-white transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <FaTelegram size={16} />
              <span>Share Win to Telegram Chat</span>
            </button>
            <Button variant="primary" className="w-full" onClick={onClose} leftIcon={<FiCheck />}>
              {t('awesome')}
            </Button>
          </div>
        )
      }
    >
      <div className="min-h-48 flex flex-col items-center justify-center gap-4 text-center py-2">
        <motion.div
          initial={false}
          animate={!revealed && animations ? { rotate: [-4, 4, -4, 4, 0], scale: [0.95, 1.05, 0.95, 1.05, 1] } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.7, repeat: revealed ? 0 : Infinity }}
          className="w-28 h-28 rounded-3xl border border-brand-border bg-brand-elevated flex items-center justify-center text-4xl shadow-xl relative"
          style={{ color: cfg.theme.accent }}
        >
          {revealed ? (
            <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 350, damping: 20 }}>
              {ICONS[prizeType] ?? <FiGift />}
            </motion.div>
          ) : (
            <FiGift className="animate-pulse" />
          )}
        </motion.div>
        {revealed && (
          <div className="flex flex-col items-center gap-1.5">
            <Badge variant="purple">{kind}</Badge>
            <span className="text-caption text-brand-muted">Guaranteed drop from {cfg.name}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
