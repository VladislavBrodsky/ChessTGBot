'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { FaTrophy, FaCoins } from 'react-icons/fa';
import { telegramHaptic } from '@/lib/telegram';
import { useNavbar } from '@/context/NavbarContext';
import { useDialogAccessibility } from '@/hooks/useDialogAccessibility';

interface SuccessState {
  title: string;
  xpReward: number;
}

export default function TaskSuccessModal() {
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { pushHide, popHide } = useNavbar();

  const handleClose = () => {
    telegramHaptic('light');
    setSuccess(null);
  };
  const dialogRef = useDialogAccessibility(Boolean(success), handleClose);

  useEffect(() => {
    if (success) {
      pushHide();
      return () => popHide();
    }
  }, [success, pushHide, popHide]);

  useEffect(() => {
    if (!success || typeof window === 'undefined') return;

    const updateDimensions = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    updateDimensions();
    const handleResize = () => {
      updateDimensions();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [success]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleTaskSuccess = (e: Event) => {
      const customEvent = e as CustomEvent<SuccessState>;
      telegramHaptic('success');
      setSuccess(customEvent.detail);
    };
    window.addEventListener('task-success', handleTaskSuccess);
    return () => window.removeEventListener('task-success', handleTaskSuccess);
  }, []);

  return (
    <>
      <AnimatePresence>
        {success && (
          <motion.div 
            key="task-success-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center px-6 pointer-events-auto modal-backdrop"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" style={{ touchAction: 'none' }} onClick={handleClose} />
            {typeof window !== 'undefined' && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <Confetti
                  width={dimensions.width}
                  height={dimensions.height}
                  recycle={false}
                  numberOfPieces={dimensions.width < 768 ? 56 : 100}
                  gravity={0.25}
                />
              </div>
            )}

            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="task-success-title"
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative z-10 w-full max-w-[300px] bg-gradient-to-b from-brand-surface to-brand-bg border border-amber-500/30 rounded-[24px] p-6 text-center space-y-6 shadow-premium flex flex-col items-center overflow-hidden transform-gpu will-change-transform"
            >
              {/* Gold Top Light Highlight */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

              <div className="w-16 h-16 rounded-[16px] bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shadow-[0_8px_24px_rgba(245,158,11,0.15)] mt-2">
                <FaTrophy className="text-amber-400 text-3xl filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]" />
              </div>

              {/* Title Header */}
              <div className="space-y-1">
                <h2 id="task-success-title" className="text-[10px] font-black uppercase tracking-[0.3em] bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                  Mission Completed
                </h2>
                <h3 className="text-sm font-black text-brand-primary uppercase tracking-wide px-2 mt-1 line-clamp-2">
                  {success.title}
                </h3>
              </div>

              {/* Big Reward Glow Box */}
              <div className="w-full py-4 px-3 rounded-2xl bg-amber-500/[0.04] border border-amber-500/10 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.1),transparent_70%)]" />
                <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest block mb-1 z-10">Reward Received</span>
                <div className="flex items-center gap-1.5 z-10">
                  <FaCoins className="text-amber-400 text-base" />
                  <span className="text-2xl font-black text-brand-primary tracking-tight leading-none">
                    +{success.xpReward} XP
                  </span>
                </div>
              </div>

              {/* Action Pulsing Button */}
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black text-[11px] font-black uppercase tracking-widest shadow-[0_4px_16px_rgba(245,158,11,0.3)] transition-all active:scale-95 hover:brightness-105 cursor-pointer relative overflow-hidden"
              >
                AWESOME!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
