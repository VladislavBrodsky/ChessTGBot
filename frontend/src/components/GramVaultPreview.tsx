'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiInfo, FiArrowRight, FiZap } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { telegramHaptic } from '@/lib/telegram';

/**
 * Animated "Vibing" GRAM vector icon with ambient pulsing halo and floating motion.
 */
export function VibingGramIcon({
  size = 36,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient glowing radial halo */}
      <div
        className="absolute inset-0 rounded-full bg-sky-400/25 blur-md pointer-events-none animate-pulse"
        aria-hidden="true"
      />
      <motion.div
        animate={{
          y: [-2.5, 2.5, -2.5],
          rotate: [-2, 2, -2],
          scale: [1, 1.05, 1],
        }}
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
          className="drop-shadow-[0_0_10px_rgba(48,161,245,0.75)] select-none pointer-events-none"
          priority
        />
      </motion.div>
    </div>
  );
}

const ELIGIBLE_TIERS = [
  { name: 'Silver', glyph: '♞', style: 'border-brand-border bg-brand-elevated text-brand-primary' },
  { name: 'Gold', glyph: '♛', style: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
  { name: 'Platinum', glyph: '♚', style: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' },
  { name: 'Ruby', glyph: '♜', style: 'border-rose-500/40 bg-rose-500/10 text-rose-400' },
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
        className="p-4 cursor-pointer hover:border-sky-500/40 transition-colors group select-none"
        onClick={handleOpenModal}
        aria-labelledby="gram-vault-preview-title"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <VibingGramIcon size={34} />
            <div className="min-w-0">
              <h2 id="gram-vault-preview-title" className="t-title-3 truncate">
                {t('title')}
              </h2>
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
            <span>{t('details')}</span>
          </Button>
        </div>
      </Card>

      {/* High Stakes Jackpot Rules Modal */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={
          <div className="flex items-center gap-2.5">
            <VibingGramIcon size={24} />
            <span>{t('title')}</span>
          </div>
        }
        description={t('status')}
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          {/* Hero Banner with Large Vibing GRAM */}
          <div className="relative overflow-hidden rounded-2xl border border-sky-500/25 bg-gradient-to-b from-sky-950/40 via-brand-surface to-brand-surface p-4 sm:p-5 text-center">
            {/* Concentric aura */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-sky-500/15 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <VibingGramIcon size={58} className="mb-2" />
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                <span>100 GRAM Jackpot Vault</span>
              </div>
              <p className="t-body text-brand-muted max-w-sm text-xs sm:text-sm">
                {t('summary')}
              </p>
            </div>
          </div>

          {/* Vault Mechanics */}
          <div className="space-y-2.5">
            {/* Feature 1: Community Vault Meter */}
            <div className="p-3.5 rounded-2xl bg-brand-surface border border-brand-border space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-sky-500/15 text-sky-400 shrink-0">
                    <FiZap size={13} aria-hidden="true" />
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-brand-primary">
                    {t('phase_one_title')}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  ⚡ Live Meter
                </span>
              </div>
              <p className="text-xs text-brand-muted leading-relaxed pl-8">
                {t('phase_one')}
              </p>
            </div>

            {/* Feature 2: Hot Zone Surge */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-brand-surface to-brand-surface border border-amber-500/40 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                    <FaFire size={13} aria-hidden="true" />
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-amber-300">
                    {t('phase_two_title')}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  🔥 Jackpot Surge
                </span>
              </div>
              <p className="text-xs text-brand-muted leading-relaxed pl-8">
                {t('phase_two')}
              </p>

              {/* Player Perk Highlight */}
              <div className="ml-8 mt-1 p-2.5 rounded-xl bg-brand-void/80 border border-amber-500/20 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-xs text-amber-400">
                  <span>Guaranteed Rewards & Direct Drop</span>
                  <span className="text-emerald-400">Instant Credit</span>
                </div>
                <p className="text-xs text-brand-muted leading-normal">
                  {t('chance')}
                </p>
              </div>
            </div>
          </div>

          {/* Qualifying Crates Grid */}
          <div className="p-3 rounded-2xl bg-brand-surface border border-brand-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-muted">
                {t('eligible_tiers')}
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                100% Verified RNG
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {ELIGIBLE_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border ${tier.style} text-center`}
                >
                  <span className="text-base sm:text-lg mb-0.5">
                    {tier.glyph}
                  </span>
                  <span className="text-xs font-bold truncate w-full">
                    {tier.name}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-brand-muted text-center pt-0.5">
              {t('current_box')}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-1">
            {isMarketplace ? (
              <Button
                variant="premium"
                className="w-full justify-center gap-2 font-bold py-3 text-sm shadow-[0_0_20px_rgba(255,215,0,0.25)]"
                onClick={handleGoToMarketplace}
              >
                <span>{t('cta')}</span>
                <FiArrowRight size={16} aria-hidden="true" />
              </Button>
            ) : (
              <Link
                href={`/${locale}/marketplace`}
                onClick={handleGoToMarketplace}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black font-bold py-3 text-sm shadow-[0_0_20px_rgba(255,215,0,0.25)] hover:brightness-110 active:scale-95 transition-all text-center"
              >
                <span>{t('cta')}</span>
                <FiArrowRight size={16} aria-hidden="true" />
              </Link>
            )}

            <Button
              variant="secondary"
              className="w-full text-xs font-semibold"
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
