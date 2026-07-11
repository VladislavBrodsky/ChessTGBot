'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChessKnight } from 'react-icons/fa';
import { telegramHaptic } from '@/lib/telegram';
import { useTranslations } from 'next-intl';

interface ModalState {
  type: 'alert' | 'confirm';
  message: string;
  callback?: (ok: boolean) => void;
}

export default function CustomAlertModal() {
  const t = useTranslations('AlertModal');
  const [modal, setModal] = useState<ModalState | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAlert = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; callback?: () => void }>;
      telegramHaptic('warning');
      setModal({
        type: 'alert',
        message: customEvent.detail.message,
        callback: (ok) => {
          if (customEvent.detail.callback) {
            customEvent.detail.callback();
          }
        }
      });
    };

    const handleConfirm = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; callback: (ok: boolean) => void }>;
      telegramHaptic('medium');
      setModal({
        type: 'confirm',
        message: customEvent.detail.message,
        callback: customEvent.detail.callback
      });
    };

    window.addEventListener('custom-alert', handleAlert);
    window.addEventListener('custom-confirm', handleConfirm);

    return () => {
      window.removeEventListener('custom-alert', handleAlert);
      window.removeEventListener('custom-confirm', handleConfirm);
    };
  }, []);

  const handleClose = (ok: boolean) => {
    telegramHaptic('light');
    if (modal?.callback) {
      modal.callback(ok);
    }
    setModal(null);
  };

  return (
    <AnimatePresence>
      {modal && (
        <motion.div 
          key="custom-alert-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center px-6 pointer-events-auto modal-backdrop"
        >
          {/* Backdrop layer with visual overlay & scroll-lock */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            style={{ touchAction: 'none' }} 
            onClick={() => modal.type === 'alert' && handleClose(true)} 
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-[290px] bg-[#FFFFFF]/95 dark:bg-[#0A0A0A]/90 border border-zinc-200/50 dark:border-zinc-800/40 rounded-[24px] p-5 shadow-[0_24px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_24px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col items-center text-center space-y-4"
          >
            {/* Top Brand Circle */}
            <div className="w-12 h-12 rounded-[16px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_2px_8px_rgba(245,158,11,0.08)]">
              <FaChessKnight className="text-amber-500 text-xl" />
            </div>

            <div className="space-y-1.5 w-full">
              <h3 className="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-[0.2em]">
                {modal.type === 'confirm' ? t('confirmation') : t('system_notice')}
              </h3>
              <p className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 leading-relaxed break-words px-1">
                {modal.message}
              </p>
            </div>

            <div className="w-full flex gap-2.5 pt-1">
              {modal.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => handleClose(false)}
                    className="flex-1 py-3 rounded-[12px] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400 text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={() => handleClose(true)}
                    className="flex-1 py-3 rounded-[12px] bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    {t('confirm')}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleClose(true)}
                  className="w-full py-3 rounded-[12px] bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  {t('close')}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
