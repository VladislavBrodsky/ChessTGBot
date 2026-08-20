'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useNavbar } from '@/context/NavbarContext';
import { telegramHaptic } from '@/lib/telegram';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  showHandle?: boolean;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = '',
  maxHeight = 'max-h-[85vh]',
  showHandle = true,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const { pushHide, popHide } = useNavbar();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    pushHide();
    return () => popHide();
  }, [isOpen, pushHide, popHide]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 400) {
      telegramHaptic('light');
      onClose();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" role="presentation">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              telegramHaptic('light');
              onClose();
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Drawer Sheet */}
          <motion.section
            role="dialog"
            aria-modal="true"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`relative z-10 w-full max-w-lg ${maxHeight} overflow-y-auto rounded-t-3xl border-t border-brand-border bg-brand-surface p-5 pb-[calc(1.25rem+var(--app-safe-bottom))] shadow-2xl ${className}`}
          >
            {/* Grab Handle */}
            {showHandle && (
              <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-white/20 cursor-grab active:cursor-grabbing" />
            )}

            {/* Header */}
            {title && (
              <div className="mb-4">
                <h2 className="text-xl font-bold tracking-tight text-brand-primary">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-sm text-brand-muted leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Content */}
            <div className="space-y-4">{children}</div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
