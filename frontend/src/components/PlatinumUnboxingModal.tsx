'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FiCheck, FiZap, FiAward, FiStar, FiBookOpen } from 'react-icons/fi';
import { FaTelegram } from 'react-icons/fa';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { telegramHaptic } from '@/lib/telegram';
import { fireGlobalConfetti } from '@/components/ui/Confetti';
import { useAnimationsEnabled } from '@/hooks/useAnimationsEnabled';
import { useAudio } from '@/hooks/useAudio';
import { sendTelemetryEvent } from '@/lib/api';
import { mainMiniAppLink } from '@/lib/invitations';

interface PlatinumUnboxingModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode?: string;
  botUsername?: string;
  rewardKey?: string | null;
}

export default function PlatinumUnboxingModal({
  isOpen,
  onClose,
  referralCode,
  botUsername,
  rewardKey = 'premium_1m',
}: PlatinumUnboxingModalProps) {
  const t = useTranslations('Engagement');
  const animations = useAnimationsEnabled();
  const { play: playAudio } = useAudio();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRevealed(false);
      return;
    }
    if (!animations || process.env.NODE_ENV === 'test') {
      setRevealed(true);
      return;
    }

    setRevealed(false);
    telegramHaptic('selection');

    // 0.45s suspense tick
    const midTimer = setTimeout(() => {
      telegramHaptic('medium');
    }, 450);

    // 1-second suspenseful unboxing build-up
    const timer = setTimeout(() => {
      setRevealed(true);
      telegramHaptic('success');
      playAudio('win');

      // Triple celebratory particle burst
      void fireGlobalConfetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
      });

      setTimeout(() => {
        void fireGlobalConfetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0.1, y: 0.65 },
        });
        void fireGlobalConfetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 0.9, y: 0.65 },
        });
      }, 260);
    }, 1000);

    return () => {
      clearTimeout(midTimer);
      clearTimeout(timer);
    };
  }, [isOpen, animations, playAudio]);

  const handleShareToTelegram = () => {
    telegramHaptic('selection');
    const bot = (botUsername || process.env.NEXT_PUBLIC_BOT_USERNAME || 'chess_matbot').replace(/^@+/, '');
    const inviteLink = referralCode ? mainMiniAppLink(bot, `ref_${referralCode}`) : `https://t.me/${bot}`;
    const shareText = `♟️ I just unlocked a FREE Platinum Mystery Box & 1 Month Premium on Web3Chess by playing 3 matches!\n\nOnly the first 100 players receive this — play 3 games and claim yours here:`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;

    void sendTelemetryEvent('engagement_platinum_share', { campaign_id: 'first-three-v1', reward: rewardKey || 'premium_1m' });

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const footer = revealed ? (
    <div className="flex flex-col gap-2.5 w-full">
      <button
        type="button"
        onClick={handleShareToTelegram}
        className="ui-tap-target w-full py-3.5 px-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white transition-all shadow-[0_4px_16px_rgba(36,161,222,0.35)] active:scale-98 cursor-pointer"
      >
        <FaTelegram size={17} />
        <span>{t('share_win')}</span>
      </button>
      <Button variant="primary" size="lg" className="w-full font-bold" onClick={onClose} leftIcon={<FiCheck />}>
        {t('awesome')}
      </Button>
    </div>
  ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={revealed ? t('unboxed_title') : t('unboxing_title')}
      footer={footer}
    >
      <div className="flex flex-col items-center justify-center text-center py-2 space-y-4">
        {/* Animated 3D Chest Container */}
        <div className="relative flex items-center justify-center w-40 h-40">
          {/* Ambient Glow */}
          <motion.div
            animate={
              revealed
                ? { scale: [1, 1.25, 1.15], opacity: [0.35, 0.65, 0.45] }
                : { scale: [0.9, 1.1, 0.9], opacity: [0.2, 0.4, 0.2] }
            }
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/30 via-cyan-200/25 to-blue-500/30 blur-2xl pointer-events-none"
          />

          {revealed && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: 0 }}
              animate={{ scale: [1.15, 1.35, 1.15], opacity: [0.35, 0.65, 0.35], rotate: 360 }}
              transition={{
                scale: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 16, repeat: Infinity, ease: 'linear' },
              }}
              className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.45)_0%,rgba(0,240,255,0)_70%)] blur-lg pointer-events-none"
            />
          )}

          <motion.div
            initial={false}
            animate={
              !revealed && animations
                ? {
                    rotate: [-4, 4, -4, 4, 0],
                    scale: [0.96, 1.04, 0.96, 1.04, 1],
                  }
                : { rotate: 0, scale: 1, y: [0, -6, 0] }
            }
            transition={
              !revealed
                ? { duration: 0.65, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
            }
            className="relative z-10 w-36 h-36 drop-shadow-[0_12px_24px_rgba(0,240,255,0.25)]"
          >
            <Image
              src="/boxes/legendary.webp"
              alt="Platinum Sovereign Mystery Box"
              width={144}
              height={144}
              priority
              className="object-contain w-full h-full"
            />
          </motion.div>
        </div>

        {revealed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-3.5 w-full"
          >
            {/* VIP Drop Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-amber-500/20 border border-cyan-400/40 shadow-xs">
              <FiStar className="text-amber-400" size={13} />
              <span className="ui-eyebrow font-bold text-cyan-200">
                {t('pioneer_badge')}
              </span>
            </div>

            {/* Prize Title & Free Value */}
            <div className="space-y-1">
              <h3 className="t-title-1 font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-200">
                {t('rewards.premium_1m')}
              </h3>
              <p className="ui-eyebrow font-semibold text-emerald-400">
                100% Free · $9.99 Value · 30 Days Full Access
              </p>
            </div>

            {/* Unlocked Perks List */}
            <div className="rounded-2xl border border-brand-border bg-brand-elevated/80 p-3 text-left space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-brand-primary">
                <span className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
                  <FiBookOpen size={13} />
                </span>
                <span className="font-medium">{t('perk_academy')}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-brand-primary">
                <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                  <FiZap size={13} />
                </span>
                <span className="font-medium">{t('perk_boost')}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-brand-primary">
                <span className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400">
                  <FiAward size={13} />
                </span>
                <span className="font-medium">{t('perk_border')}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-brand-primary">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                  <FiStar size={13} />
                </span>
                <span className="font-medium">{t('perk_vip')}</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <p className="t-body font-semibold text-brand-muted animate-pulse">
              {t('unboxing_title')}
            </p>
            <div className="flex justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
