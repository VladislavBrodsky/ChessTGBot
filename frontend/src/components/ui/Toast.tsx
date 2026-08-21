'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  const icon = isSuccess ? (
    <FiCheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
  ) : isError ? (
    <FiAlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
  ) : (
    <FiInfo className="h-4 w-4 text-sky-400 shrink-0" />
  );

  const borderClass = isSuccess
    ? 'border-emerald-500/30'
    : isError
      ? 'border-rose-500/30'
      : 'border-brand-border';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`
        pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl
        bg-brand-surface border ${borderClass} shadow-[0_8px_30px_rgba(0,0,0,0.8)]
        min-w-[260px] max-w-sm text-xs font-bold text-brand-primary
      `}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon}
        <span className="truncate leading-snug">{toast.message}</span>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss toast"
        className="p-1 rounded-lg text-brand-muted hover:text-brand-primary hover:bg-white/[0.06] transition-colors cursor-pointer"
      >
        <FiX className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
