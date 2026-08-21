'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaBolt, FaChessKnight } from 'react-icons/fa';
import { useLocale } from 'next-intl';
import { telegramHaptic } from '@/lib/telegram';

interface QuickPlayFABProps {
  className?: string;
}

export function QuickPlayFAB({ className = '' }: QuickPlayFABProps) {
  const locale = useLocale();

  return (
    <div
      className={`fixed right-4 z-40 ${className}`}
      style={{
        bottom: 'calc(76px + var(--app-safe-bottom))',
      }}
    >
      <Link
        href={`/${locale}/game`}
        onClick={() => telegramHaptic('selection')}
        aria-label="Quick Match"
      >
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.94 }}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-brand-void font-black text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-colors cursor-pointer border border-emerald-400/40"
        >
          <FaBolt className="text-sm animate-pulse" />
          <span>Quick Play</span>
        </motion.div>
      </Link>
    </div>
  );
}
