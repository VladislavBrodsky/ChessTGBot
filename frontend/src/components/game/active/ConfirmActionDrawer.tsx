'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
}

export interface ConfirmActionDrawerProps {
  confirmConfig: ConfirmConfig | null;
  onClose: () => void;
}

export function ConfirmActionDrawer({
  confirmConfig,
  onClose,
}: ConfirmActionDrawerProps) {
  return (
    <AnimatePresence>
      {confirmConfig && (
        <div className="bottom-drawer-backdrop z-[110]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[rgba(0,0,0,0.5)]"
            style={{ touchAction: 'none' }}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="bottom-drawer-sheet relative z-20"
          >
            <div className="bottom-drawer-handle" />

            <div className="flex flex-col items-center text-center mt-2">
              <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-brand-primary">
                {confirmConfig.title}
              </h2>
              <p className="text-sm font-bold text-brand-primary opacity-65 uppercase tracking-wide mt-2 mb-6">
                {confirmConfig.message}
              </p>
            </div>

            <div className="w-full flex flex-col gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  confirmConfig.onConfirm();
                  onClose();
                }}
                className="w-full bg-brand-primary text-brand-void py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] cursor-pointer shadow-sm"
              >
                <span>{confirmConfig.confirmText}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full bg-brand-bg-opacity-10 border border-brand-border-text-brand-muted py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest cursor-pointer shadow-sm"
              >
                <span>{confirmConfig.cancelText}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
