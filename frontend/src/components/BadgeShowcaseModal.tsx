'use client';

import { Badge } from '@/components/ui/Badge';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { useTranslations } from 'next-intl';
import { FaShieldAlt, FaStar, FaLock, FaShareAlt, FaCheck } from 'react-icons/fa';
import { telegramHaptic } from '@/lib/telegram';
import { Button } from '@/components/ui/Button';

export interface BadgeTierData {
  tier: number;
  label: string;
  requirement: string;
  isUnlocked: boolean;
  xpReward: number;
}

export interface BadgeShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: {
    id: number;
    title: string;
    description: string;
    icon?: string;
    xp_reward?: number;
    unlocked?: boolean;
    unlocked_at?: string | null;
    currentTier?: number;
    tiers?: BadgeTierData[];
  } | null;
}

export default function BadgeShowcaseModal({
  isOpen,
  onClose,
  badge,
}: BadgeShowcaseModalProps) {
  const t = useTranslations('Academy'), tc = useTranslations('Common');
  if (!isOpen || !badge) return null;

  const isUnlocked = badge.unlocked ?? false;
  const xp = badge.xp_reward ?? 0;
  const currentTier = badge.currentTier;

  const tiers: BadgeTierData[] = badge.tiers ?? [];

  const handleShare = () => {
    telegramHaptic('heavy');
    const text = encodeURIComponent(`🛡️ I unlocked the "${badge.title}" achievement on Web3Chess! Can you beat my score? ♟️⚡`);
    window.open(`https://t.me/share/url?text=${text}`, '_blank');
  };

  const handleModalClose = () => {
    telegramHaptic('light');
    onClose();
  };

  return <Modal isOpen onClose={handleModalClose} title={badge.title} description={badge.description} maxWidth="sm">
    <div className="space-y-4 text-center">
          {/* 3D Shield & Icon Showcase */}
          <div className="relative mx-auto w-28 h-28 flex items-center justify-center mt-2">
            {/* Outer ring */}

            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-500/20 via-brand-surface to-brand-void border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.25)] flex items-center justify-center">
              <div className="text-4xl text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]">
                {isUnlocked ? <FaShieldAlt /> : <FaLock className="text-brand-muted text-3xl" />}
              </div>
            </div>

          </div>
          {currentTier !== undefined && <div className="flex justify-center"><Badge variant="secondary" icon={<FaStar />}>{t('tier_label', { tier: currentTier })}</Badge></div>}

          {tiers.length === 0 && xp > 0 && <p className="t-numeric-lg text-brand-gold">+{xp} XP</p>}
          {/* Tier Progress Steps */}
          {tiers.length > 0 && <>
          <div className="w-full rounded-2xl border border-brand-border-opacity-10 bg-brand-void/50 p-3 space-y-2.5 text-left">
            <div className="flex items-center justify-between text-caption font-semibold normal-case tracking-normal text-brand-muted">
              <span>{t('mastery_tiers')}</span>
              <span className="text-amber-400">+{xp} XP</span>
            </div>

            <div className="space-y-2">
              {tiers.map((t) => (
                <div
                  key={t.tier}
                  className={`flex items-center justify-between p-2 rounded-xl border text-sm transition-all ${
                    t.isUnlocked
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-brand-surface/40 border-brand-border-opacity-10 text-brand-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-caption font-semibold shrink-0 ${
                        t.isUnlocked
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-brand-elevated text-brand-muted'
                      }`}
                    >
                      {t.isUnlocked ? <FaCheck className="text-caption" /> : t.tier}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-caption normal-case text-brand-primary truncate">
                        {t.label}
                      </span>
                      <span className="text-caption text-brand-muted truncate">
                        {t.requirement}
                      </span>
                    </div>
                  </div>

                  <span className="text-caption font-semibold normal-case tracking-normal text-amber-400 shrink-0">
                    +{t.xpReward} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

          </>}
          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {isUnlocked && (
              <Button
                variant="primary"
                size="md"
                onClick={handleShare}
                className="flex-1 text-sm"
                leftIcon={<FaShareAlt size={12} />}
              >
                {t('share_trophy')}
              </Button>
            )}
            <Button
              variant={isUnlocked ? 'outline' : 'primary'}
              size="md"
              onClick={handleModalClose}
              className={isUnlocked ? 'flex-1 text-sm' : 'w-full text-sm'}
            >
              {isUnlocked ? tc('close') : t('keep_playing')}
            </Button>
          </div>
    </div>
  </Modal>;
}
