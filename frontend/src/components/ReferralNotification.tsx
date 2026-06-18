'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FaCoins, FaCheck } from 'react-icons/fa';
import { telegramHaptic } from '@/lib/telegram';

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
  const [notification, setNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
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
  }, []);

  return (
    <div className="fixed bottom-[calc(100px+var(--tg-content-safe-area-inset-bottom,var(--tg-safe-area-inset-bottom,0px)))] left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4">
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-[325px] bg-[#FFFFFF]/90 dark:bg-[#0A0A0A]/80 border border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl py-2 px-3 flex items-center gap-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl pointer-events-auto transition-colors duration-300"
          >
            {/* Left Icon (Soft Glowing Coins Container) */}
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(245,158,11,0.08)]">
              <FaCoins className="text-amber-500 text-[11px]" />
            </div>

            {/* Notification content */}
            <div className="flex-1 min-w-0 flex items-center gap-2 text-[10.5px] font-medium text-zinc-700 dark:text-zinc-300 tracking-wide">
              {/* Viral Live Pulsing Dot */}
              <div className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="truncate">
                {t.rich('referral_toast_rich', {
                  username: notification.username,
                  amount: notification.amount,
                  gold: (chunks) => <span className="text-amber-500 dark:text-amber-400 font-semibold">{chunks}</span>,
                  green: (chunks) => <span className="text-emerald-500 dark:text-emerald-400 font-semibold">{chunks}</span>
                })}
              </span>
            </div>

            {/* Check badge */}
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(16,185,129,0.08)]">
              <FaCheck className="text-emerald-500 dark:text-emerald-400 text-[8px]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
