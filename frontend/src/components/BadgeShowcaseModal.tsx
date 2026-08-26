'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  if (!isOpen || !badge) return null;

  const isUnlocked = badge.unlocked ?? true;
  const xp = badge.xp_reward ?? 100;
  const currentTier = badge.currentTier ?? (isUnlocked ? 2 : 1);

  const tiers: BadgeTierData[] = badge.tiers || [
    { tier: 1, label: 'Bronze', requirement: '10 Completed Games', isUnlocked: true, xpReward: 50 },
    { tier: 2, label: 'Silver', requirement: '50 Completed Games', isUnlocked: isUnlocked, xpReward: 150 },
    { tier: 3, label: 'Obsidian Gold', requirement: '200 Completed Games', isUnlocked: false, xpReward: 500 },
  ];

  const handleShare = () => {
    telegramHaptic('heavy');
    const text = encodeURIComponent(`🛡️ I unlocked the "${badge.title}" achievement on FinChess! Can you beat my score? ♟️⚡`);
    window.open(`https://t.me/share/url?text=${text}`, '_blank');
  };

  const handleModalClose = () => {
    telegramHaptic('light');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleModalClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-sm rounded-3xl border border-brand-border-opacity-10 bg-brand-surface p-6 shadow-2xl overflow-hidden text-center z-10 space-y-5"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-[radial-gradient(circle,rgba(245,158,11,0.25)_0%,transparent_70%)] rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,transparent_70%)] rounded-full pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleModalClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-void/50 border border-brand-border-opacity-10 text-brand-muted hover:text-brand-primary flex items-center justify-center transition-colors cursor-pointer text-xs"
          >
            ✕
          </button>

          {/* 3D Shield & Icon Showcase */}
          <div className="relative mx-auto w-28 h-28 flex items-center justify-center mt-2">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/40 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-500/20 via-brand-surface to-brand-void border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.25)] flex items-center justify-center">
              <div className="text-4xl text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]">
                {isUnlocked ? <FaShieldAlt /> : <FaLock className="text-brand-muted text-3xl" />}
              </div>
            </div>

            {/* Floating Level / Tier Pill */}
            <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-brand-surface border border-amber-400/50 text-amber-400 font-black text-[9px] uppercase tracking-wider shadow-sm flex items-center gap-1">
              <FaStar className="text-[8px]" />
              <span>TIER {currentTier}</span>
            </div>
          </div>

          {/* Badge Titles */}
          <div className="space-y-1 relative z-10">
            <h3 className="text-xl font-black uppercase text-brand-primary tracking-tight header-balanced">
              {badge.title}
            </h3>
            <p className="text-xs font-medium text-brand-muted leading-relaxed text-pretty max-w-[260px] mx-auto">
              {badge.description}
            </p>
          </div>

          {/* Tier Progress Steps */}
          <div className="w-full rounded-2xl border border-brand-border-opacity-10 bg-brand-void/50 p-3 space-y-2.5 text-left">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-brand-muted">
              <span>Mastery Tiers</span>
              <span className="text-amber-400">+{xp} Total XP</span>
            </div>

            <div className="space-y-2">
              {tiers.map((t) => (
                <div
                  key={t.tier}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                    t.isUnlocked
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-brand-surface/40 border-brand-border-opacity-10 text-brand-muted opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        t.isUnlocked
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-brand-elevated text-brand-muted'
                      }`}
                    >
                      {t.isUnlocked ? <FaCheck className="text-[8px]" /> : t.tier}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[10px] uppercase text-brand-primary truncate">
                        {t.label}
                      </span>
                      <span className="text-[8px] text-brand-muted truncate">
                        {t.requirement}
                      </span>
                    </div>
                  </div>

                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 shrink-0">
                    +{t.xpReward} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {isUnlocked && (
              <Button
                variant="primary"
                size="md"
                onClick={handleShare}
                className="flex-1 text-xs"
                leftIcon={<FaShareAlt size={12} />}
              >
                Share Trophy
              </Button>
            )}
            <Button
              variant={isUnlocked ? 'outline' : 'primary'}
              size="md"
              onClick={handleModalClose}
              className={isUnlocked ? 'flex-1 text-xs' : 'w-full text-xs'}
            >
              {isUnlocked ? 'Close' : 'Keep Playing'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
