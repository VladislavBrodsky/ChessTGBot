'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiInfo, FiArrowRight, FiZap, FiCheckCircle, FiShield } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { telegramHaptic } from '@/lib/telegram';
import { useAnimationsEnabled } from '@/hooks/useAnimationsEnabled';

/**
 * Animated "Vibing" GRAM vector icon with ambient pulsing halo and floating motion.
 * Respects reduced-motion and in-app animation settings.
 */
export function VibingGramIcon({
  size = 36,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  const animationsEnabled = useAnimationsEnabled();

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient glowing radial halo */}
      <div
        className={`absolute inset-0 rounded-full bg-sky-400/25 blur-md pointer-events-none ${
          animationsEnabled ? 'animate-pulse' : ''
        }`}
        aria-hidden="true"
      />
      <motion.div
        animate={
          animationsEnabled
            ? {
                y: [-2.5, 2.5, -2.5],
                rotate: [-2, 2, -2],
                scale: [1, 1.05, 1],
              }
            : false
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative flex items-center justify-center"
      >
        <Image
          src="/images/leaderboard-preview/gram.svg"
          alt="GRAM Token"
          width={size}
          height={size}
          className="drop-shadow-[0_0_12px_rgba(48,161,245,0.85)] select-none pointer-events-none"
          priority
        />
      </motion.div>
    </div>
  );
}

const ELIGIBLE_TIERS = [
  {
    name: 'Silver',
    glyph: '♞',
    boxStyle:
      'border-brand-border bg-gradient-to-b from-brand-elevated to-brand-surface text-brand-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
    badgeStyle: 'text-brand-muted bg-brand-surface border-brand-border',
  },
  {
    name: 'Gold',
    glyph: '♛',
    boxStyle:
      'border-amber-400/40 bg-gradient-to-b from-amber-500/15 via-brand-surface to-brand-surface text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.12),inset_0_1px_0_rgba(245,158,11,0.25)]',
    badgeStyle: 'text-amber-300 bg-amber-500/20 border-amber-500/30',
  },
  {
    name: 'Platinum',
    glyph: '♚',
    boxStyle:
      'border-cyan-400/40 bg-gradient-to-b from-cyan-500/15 via-brand-surface to-brand-surface text-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.12),inset_0_1px_0_rgba(6,182,212,0.25)]',
    badgeStyle: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30',
  },
  {
    name: 'Ruby',
    glyph: '♜',
    boxStyle:
      'border-rose-500/40 bg-gradient-to-b from-rose-500/15 via-brand-surface to-brand-surface text-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.12),inset_0_1px_0_rgba(244,63,94,0.25)]',
    badgeStyle: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
  },
];

/**
 * 100 GRAM Grand Vault Modal & Trigger Card.
 * High-engagement Web3 iGaming jackpot mechanic:
 * - Cycle: Every 1,000 draws
 * - Eligible: Silver Tier and Above
 * - Phase 1 (1–800): Vault Charging
 * - Phase 2 (801–1,000): The Hot Zone (climbing odds from 1/200 until won)
 */
export function GramVaultPreview() {
  const t = useTranslations('GramVaultPreview');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isMarketplace = pathname?.includes('/marketplace');

  const handleOpenModal = () => {
    telegramHaptic('selection');
    setOpen(true);
  };

  const handleGoToMarketplace = () => {
    telegramHaptic('medium');
    setOpen(false);
    if (isMarketplace) {
      document.getElementById('marketplace-vaults-title')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Home Dashboard Trigger Card */}
      <Card
        variant="solid"
        className="relative overflow-hidden p-4 cursor-pointer border-brand-border hover:border-sky-500/40 transition-all group select-none shadow-[0_0_15px_rgba(56,189,248,0.06)] hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]"
        onClick={handleOpenModal}
        aria-labelledby="gram-vault-preview-title"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-sky-500/10 blur-2xl pointer-events-none group-hover:bg-sky-500/20 transition-colors" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <VibingGramIcon size={36} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 id="gram-vault-preview-title" className="t-title-3 truncate">
                  {t('title')}
                </h2>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  100 GRAM
                </span>
              </div>
              <p className="t-caption text-brand-muted truncate">{t('status')}</p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal();
            }}
            className="shrink-0 flex items-center gap-1.5 px-3 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 group-hover:text-white group-hover:border-sky-400/50 transition-all text-xs font-semibold cursor-pointer active:scale-95 whitespace-nowrap"
            aria-label={t('details')}
          >
            <FiInfo size={13} className="text-sky-400" aria-hidden="true" />
            <span className="max-[380px]:sr-only">{t('details')}</span>
          </Button>
        </div>
      </Card>

      {/* High Stakes Jackpot Rules Modal */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={
          <div className="flex items-center gap-2.5">
            <VibingGramIcon size={26} />
            <span className="font-extrabold">{t('title')}</span>
          </div>
        }
        description={
          <div className="flex items-center gap-2 text-xs">
            <span className="text-brand-muted font-medium">{t('status')}</span>
            <span className="text-brand-muted select-none" aria-hidden="true">•</span>
            <span className="text-sky-400 font-semibold">1,000 Draw Cycle</span>
          </div>
        }
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          {/* Hero Banner with Celestial Glow & Floating Vibing GRAM */}
          <div className="relative overflow-hidden rounded-3xl border border-sky-500/30 bg-gradient-to-b from-sky-950/40 via-brand-surface to-brand-surface p-5 sm:p-6 text-center shadow-[0_0_30px_rgba(56,189,248,0.12)]">
            {/* Concentric ambient atmospheric glows */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-sky-500/20 blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-36 h-20 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              {/* Grand Jackpot Live Beacon */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.2)] mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
                </span>
                <span className="text-xs font-bold text-sky-300">
                  100 GRAM Jackpot Vault
                </span>
              </div>

              {/* Floating Vibing Icon */}
              <VibingGramIcon size={64} className="mb-2" />

              {/* Grand Prize Hero Figure */}
              <div className="flex items-center justify-center gap-2 mt-1 mb-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_0_16px_rgba(56,189,248,0.5)]">
                  100
                </span>
                <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-300 bg-clip-text text-transparent">
                  GRAM
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 self-center">
                  GRAND PRIZE
                </span>
              </div>

              <p className="t-caption text-brand-muted max-w-sm mx-auto leading-relaxed">
                {t('summary')}
              </p>
            </div>
          </div>

          {/* Vault Mechanics: 2-Phase Progression & Benefits */}
          <div className="rounded-2xl border border-brand-border bg-brand-surface/90 p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-muted">
                Vault Progression
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-elevated border border-brand-border text-brand-muted">
                Draws 1–1,000
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Phase 1: Community Vault Power */}
              <div className="rounded-xl border border-sky-500/25 bg-gradient-to-r from-sky-950/30 via-brand-elevated/40 to-brand-elevated/40 p-3 space-y-1.5 transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/35 text-sky-400 shrink-0 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                      <FiZap size={14} aria-hidden="true" />
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-brand-primary truncate">
                      {t('phase_one_title')}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 shrink-0">
                    ⚡ Live Meter
                  </span>
                </div>
                <p className="text-xs text-brand-muted leading-relaxed pl-9">
                  {t('phase_one')}
                </p>
              </div>

              {/* Connecting Step Indicator */}
              <div className="flex items-center justify-center -my-0.5">
                <span className="text-xs font-semibold text-brand-muted flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-elevated border border-brand-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  80% Charge Unlocks Hot Zone
                </span>
              </div>

              {/* Phase 2: The Hot Zone Surge */}
              <div className="relative rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-brand-surface to-brand-elevated/60 p-3 space-y-2 overflow-hidden shadow-[0_0_18px_rgba(245,158,11,0.12)]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/25 border border-amber-500/45 text-amber-400 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                      <FaFire size={14} aria-hidden="true" />
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-amber-300 truncate">
                      {t('phase_two_title')}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/25 text-amber-300 border border-amber-400/40 animate-pulse shrink-0">
                    🔥 Jackpot Surge
                  </span>
                </div>
                <p className="text-xs text-brand-muted leading-relaxed pl-9">
                  {t('phase_two')}
                </p>
              </div>

              {/* Guaranteed Perk Banner */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <FiCheckCircle size={15} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      Guaranteed Rewards & Direct Drop
                    </span>
                    <span className="text-xs font-bold text-emerald-400 shrink-0">
                      Instant Credit
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted leading-tight mt-0.5">
                    {t('chance')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Qualifying Crates Grid */}
          <div className="rounded-2xl border border-brand-border bg-brand-surface/90 p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-muted">
                {t('eligible_tiers')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <FiShield size={12} aria-hidden="true" />
                <span>100% Verified RNG</span>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {ELIGIBLE_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`group relative flex flex-col items-center justify-between p-2.5 rounded-xl border ${tier.boxStyle} text-center transition-all hover:scale-[1.03] select-none`}
                >
                  <span className="text-xl sm:text-2xl mb-1 filter drop-shadow select-none">
                    {tier.glyph}
                  </span>
                  <span className="text-xs font-bold text-white truncate w-full">
                    {tier.name}
                  </span>
                  <span
                    className={`mt-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-semibold border ${tier.badgeStyle}`}
                  >
                    Eligible
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-muted shrink-0" aria-hidden="true" />
              <p className="text-xs text-brand-muted text-center font-medium">
                {t('current_box')}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-1">
            {isMarketplace ? (
              <button
                type="button"
                onClick={handleGoToMarketplace}
                className="relative group overflow-hidden w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-extrabold text-sm py-3.5 shadow-[0_0_24px_rgba(245,158,11,0.35)] hover:shadow-[0_0_32px_rgba(245,158,11,0.55)] active:scale-[0.98] transition-all text-center cursor-pointer select-none"
              >
                <span className="relative z-10">{t('cta')}</span>
                <FiArrowRight
                  size={16}
                  className="relative z-10 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
              </button>
            ) : (
              <Link
                href={`/${locale}/marketplace`}
                onClick={handleGoToMarketplace}
                className="relative group overflow-hidden w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-extrabold text-sm py-3.5 shadow-[0_0_24px_rgba(245,158,11,0.35)] hover:shadow-[0_0_32px_rgba(245,158,11,0.55)] active:scale-[0.98] transition-all text-center cursor-pointer select-none"
              >
                <span className="relative z-10">{t('cta')}</span>
                <FiArrowRight
                  size={16}
                  className="relative z-10 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
              </Link>
            )}

            <Button
              variant="ghost"
              className="w-full text-xs font-semibold text-brand-muted hover:text-white"
              onClick={() => setOpen(false)}
            >
              {t('close')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
