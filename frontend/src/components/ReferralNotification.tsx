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
            className="w-full max-w-[290px] bg-brand-surface/90 border border-amber-500/35 rounded-xl py-1.5 px-3 flex items-center gap-2 shadow-[0_8px_20px_rgba(0,0,0,0.5),0_0_8px_rgba(245,158,11,0.1)] backdrop-blur-md pointer-events-auto"
          >
            {/* Left Icon with subtle spin/float */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-[0_0_6px_rgba(245,158,11,0.25)] shrink-0">
              <FaCoins className="text-amber-950 text-[11px]" />
            </div>

            {/* Notification content */}
            <div className="flex-1 min-w-0">
              <p className="text-[9.5px] font-black uppercase tracking-wider text-brand-gold flex items-center gap-1 leading-none mb-0.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                {t('referral_won', { username: notification.username })}
              </p>
              <p className="text-[8.5px] font-medium text-brand-primary/60 truncate leading-none">
                {t('commission_earned', { amount: notification.amount })}
              </p>
            </div>

            {/* Check badge */}
            <div className="w-4.5 h-4.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <FaCheck className="text-emerald-400 text-[7px]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
