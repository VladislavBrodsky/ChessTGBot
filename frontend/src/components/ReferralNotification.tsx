'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FaCoins, FaCheck } from 'react-icons/fa';
import { telegramHaptic } from '@/lib/telegram';

import { usePathname, useSearchParams } from 'next/navigation';

// Simulated referral usernames
const SIMULATED_USERNAMES = [
  'ton_wizard', 'crypto_knight', 'chess_master99', 'sol_rider', 'vlad_k',
  'queen_gambit', 'grandmaster_x', 'pawn_star', 'checkmate_pro', 'tactics_guru',
  'blitz_king', 'rook_roller', 'nft_whale', 'tg_gm', 'el_maestro'
];

// Simulated match wager levels and corresponding 15% commissions (based on 3% platform rake)
const COMMISSION_TIERS = [
  0.03, // $5 wager
  0.05, // $10 wager
  0.15, // $30 wager
  0.25, // $50 wager
  0.50, // $100 wager
  1.50  // $300 wager
];

interface NotificationData {
  id: number;
  username: string;
  amount: string;
}

export default function ReferralNotification() {
  const t = useTranslations('Referral');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gameId = searchParams?.get('id') || '';
  const isGameActive = pathname?.includes('/game') && gameId !== '';
  const isAcademyActive = pathname?.includes('/academy');
  const shouldSuppressNotification = isGameActive || isAcademyActive;

  const [notification, setNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    // If currently playing a game or in academy, clear any active notification and don't schedule new ones
    if (shouldSuppressNotification) {
      setNotification(null);
      return;
    }

    // Schedule a notification at random intervals between 45 and 90 seconds
    let timeoutId: NodeJS.Timeout;

    const triggerNotification = () => {
      // Pick a random simulated referral and commission tier
      const randomUser = SIMULATED_USERNAMES[Math.floor(Math.random() * SIMULATED_USERNAMES.length)];
      const randomComm = COMMISSION_TIERS[Math.floor(Math.random() * COMMISSION_TIERS.length)];
      
      // Play a soft haptic buzz on Telegram WebApp
      telegramHaptic('light');

      setNotification({
        id: Date.now(),
        username: `@${randomUser}`,
        amount: randomComm.toFixed(2)
      });

      // Automatically dismiss the toast after 5 seconds
      timeoutId = setTimeout(() => {
        setNotification(null);
        // Reschedule the next notification
        scheduleNext();
      }, 5000);
    };

    const scheduleNext = () => {
      const delay = Math.floor(Math.random() * (90000 - 45000)) + 45000; // 45 to 90 seconds
      timeoutId = setTimeout(triggerNotification, delay);
    };

    // First trigger after 30 seconds of app load
    timeoutId = setTimeout(triggerNotification, 30000);

    return () => clearTimeout(timeoutId);
  }, [shouldSuppressNotification]);

  return (
    <div className="fixed bottom-[calc(100px+var(--app-safe-bottom))] left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4">
      <AnimatePresence mode="wait">
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-[340px] bg-[var(--bg-elevated)] border border-[var(--border-muted)] rounded-2xl py-2.5 px-3.5 flex items-center gap-3 shadow-[var(--shadow-premium)] pointer-events-auto transition-all duration-300 relative overflow-hidden transform-gpu"
          >
            {/* Soft background glow for premium feel */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none opacity-50" />

            {/* Left Icon (Soft Glowing Coins Container) */}
            <div className="w-8 h-8 rounded-xl bg-[var(--color-amber-opacity-10)] border border-[var(--color-border-opacity-10)] flex items-center justify-center shrink-0 shadow-[var(--shadow-inner-glow)] relative z-10">
              <FaCoins className="text-[var(--text-gold)] text-[13px]" />
            </div>

            {/* Notification content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10">
              <div className="flex items-center gap-1.5 mb-[1px]">
                {/* Viral Live Pulsing Dot */}
                <div className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                  Live Payout
                </span>
              </div>
              <div className="text-[11.5px] leading-tight font-medium text-[var(--text-primary)] truncate">
                {t.rich('referral_toast_rich', {
                  username: notification.username,
                  amount: notification.amount,
                  gold: (chunks) => <span className="text-[var(--text-gold)] font-bold">{chunks}</span>,
                  green: (chunks) => <span className="text-emerald-500 font-bold">{chunks}</span>
                })}
              </div>
            </div>

            {/* Check badge */}
            <div className="w-6 h-6 rounded-full bg-[var(--color-emerald-opacity-10)] border border-[var(--color-border-opacity-10)] flex items-center justify-center shrink-0 shadow-[var(--shadow-inner-glow)] relative z-10">
              <FaCheck className="text-emerald-500 text-[10px]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
