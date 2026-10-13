'use client';

import React, { useEffect, useState, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavbar } from '@/context/NavbarContext';
import { telegramHaptic } from '@/lib/telegram';
import { useDialog } from '@/hooks/useDialog';
import { useAnimationsEnabled } from '@/hooks/useAnimationsEnabled';
import { DialogHeader } from './DialogHeader';

export interface ModalProps {
  isOpen: boolean; onClose: () => void; title?: React.ReactNode; description?: React.ReactNode;
  children: React.ReactNode; className?: string; maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  role?: 'dialog' | 'alertdialog'; showCloseButton?: boolean; footer?: React.ReactNode; layer?: 100 | 110 | 120;
}
export function Modal({ isOpen, onClose, title, description, children, className = '', maxWidth = 'md', showCloseButton = true, footer, layer = 100, role = 'dialog' }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const { pushHide, popHide } = useNavbar();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId(), descriptionId = useId();
  const animations = useAnimationsEnabled();
  useDialog(isOpen && mounted, ref, onClose);
  useEffect(() => setMounted(true), []);
  useEffect(() => { if (!isOpen) return; pushHide(); return () => popHide(); }, [isOpen, pushHide, popHide]);
  if (!mounted) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };
  return createPortal(<AnimatePresence>{isOpen && <div className="ui-modal-viewport fixed inset-0 flex items-center justify-center px-4" style={{ zIndex: layer }} role="presentation">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: animations ? 0.2 : 0 }}
      onClick={() => { telegramHaptic('light'); onClose(); }} className="absolute inset-0 bg-brand-overlay" />
    <motion.div role={role} aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} ref={ref} tabIndex={-1}
      initial={animations ? { opacity: 0, scale: 0.98, y: 8 } : false} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={animations ? { opacity: 0, scale: 0.98, y: 8 } : { opacity: 0 }} transition={{ duration: animations ? 0.24 : 0 }}
      className={`ui-dialog relative z-10 flex w-full ${widths[maxWidth]} flex-col overflow-hidden rounded-3xl border border-brand-border bg-brand-surface shadow-2xl ${className}`}>
      <div className="shrink-0 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
        <DialogHeader title={title} description={description} titleId={titleId} descriptionId={descriptionId} onClose={onClose} showClose={showCloseButton} />
      </div>
      <div className={`ui-dialog-body min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 ${footer ? 'pb-4' : 'pb-5 sm:pb-6'}`}>{children}</div>
      {footer && <div className="shrink-0 border-t border-brand-border px-5 py-4 sm:px-6">{footer}</div>}
    </motion.div>
  </div>}</AnimatePresence>, document.body);
}
