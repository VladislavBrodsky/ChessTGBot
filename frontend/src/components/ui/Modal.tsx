'use client';

import React, { useEffect, useState, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavbar } from '@/context/NavbarContext';
import { telegramHaptic } from '@/lib/telegram';
import { useDialog } from '@/hooks/useDialog';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = '',
  maxWidth = 'md',
  showCloseButton = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const { pushHide, popHide } = useNavbar();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useDialog(isOpen && mounted, dialogRef, onClose);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    pushHide();
    return () => popHide();
  }, [isOpen, pushHide, popHide]);



  if (!mounted) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="ui-modal-viewport fixed inset-0 z-[100] flex items-center justify-center px-4"
          role="presentation"
        >
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
            className="fixed inset-0 bg-brand-overlay"
          />

          {/* Modal Box */}
          <motion.div
            role="dialog"
            aria-modal="true"
            ref={dialogRef}
            tabIndex={-1}
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : "Dialog"}
            aria-describedby={description ? descriptionId : undefined}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`relative z-10 w-full ${maxWidthClasses[maxWidth]} ui-dialog rounded-3xl border border-brand-border bg-brand-surface p-5 sm:p-6 shadow-2xl ${className}`}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  {title && (
                    <h2 id={titleId} className="text-section-title font-semibold text-brand-primary">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-brand-muted">
                      {description}
                    </p>
                  )}
                </div>

                {showCloseButton && (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      telegramHaptic('light');
                      onClose();
                    }}
                    aria-label="Close modal"
                    className="h-11 w-11 shrink-0 p-0"
                    enableHaptic={false}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                )}
              </div>
            )}

            {/* Body */}
            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
