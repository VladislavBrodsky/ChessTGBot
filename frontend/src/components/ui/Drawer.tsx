'use client';

import React, { useEffect, useState, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'framer-motion';
import { useNavbar } from '@/context/NavbarContext';
import { telegramHaptic } from '@/lib/telegram';
import { useDialog } from '@/hooks/useDialog';
import { Button } from './Button';

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
  maxHeight = 'max-h-[85dvh]',
  showHandle = true,
}: DrawerProps) {
  const dragControls = useDragControls();
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
            className="fixed inset-0 bg-brand-overlay"
          />

          {/* Drawer Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            ref={dialogRef}
            tabIndex={-1}
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : "Dialog"}
            aria-describedby={description ? descriptionId : undefined}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`relative z-10 w-full max-w-lg ${maxHeight} ui-drawer overflow-y-auto rounded-t-3xl sm:rounded-3xl border-t border-brand-border bg-brand-surface p-5 pb-[calc(1.25rem+var(--app-safe-bottom))] shadow-2xl ${className}`}
          >
            {/* Grab Handle */}
            {showHandle && (
              <div onPointerDown={(event) => dragControls.start(event)}
                className="mx-auto -mt-2 mb-2 flex h-8 w-16 items-center justify-center cursor-grab touch-none" aria-hidden="true"><span className="h-1 w-10 rounded-full bg-brand-muted/40" /></div>
            )}

            {/* Header */}
            {(title || description) && (
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                {title && <h2 id={titleId} className="text-section-title font-semibold text-brand-primary">
                  {title}
                </h2>}
                {description && (
                  <p id={descriptionId} className="mt-1 text-sm text-brand-muted leading-relaxed">
                    {description}
                  </p>
                )}
                </div>
                <Button variant="ghost" className="h-11 w-11 shrink-0 p-0" aria-label="Close dialog" onClick={onClose}>
                  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m6 6 12 12M6 18 18 6" strokeWidth="2" strokeLinecap="round" /></svg>
                </Button>
              </div>
            )}

            {/* Content */}
            <div className="space-y-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
