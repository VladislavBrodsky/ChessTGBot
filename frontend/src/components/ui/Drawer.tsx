'use client';

import React, { useEffect, useState, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type PanInfo, useDragControls } from 'framer-motion';
import { useNavbar } from '@/context/NavbarContext';
import { telegramHaptic } from '@/lib/telegram';
import { useDialog } from '@/hooks/useDialog';
import { useAnimationsEnabled } from '@/hooks/useAnimationsEnabled';
import { DialogHeader } from './DialogHeader';

export interface DrawerProps {
  isOpen: boolean; onClose: () => void; title?: React.ReactNode; description?: React.ReactNode;
  children: React.ReactNode; className?: string;
  /** A CSS length. Always clamped to the Telegram safe viewport. */
  maxHeight?: string; showHandle?: boolean; footer?: React.ReactNode;
  layer?: 100 | 110 | 120;
}

export function Drawer({ isOpen, onClose, title, description, children, className = '', maxHeight = '85dvh', showHandle = true, footer, layer = 100 }: DrawerProps) {
  const controls = useDragControls();
  const [mounted, setMounted] = useState(false);
  const { pushHide, popHide } = useNavbar();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId(), descriptionId = useId();
  const animations = useAnimationsEnabled();
  useDialog(isOpen && mounted, ref, onClose);
  useEffect(() => setMounted(true), []);
  useEffect(() => { if (!isOpen) return; pushHide(); return () => popHide(); }, [isOpen, pushHide, popHide]);
  const closeFromDrag = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 400) { telegramHaptic('light'); onClose(); }
  };
  if (!mounted) return null;
  return createPortal(<AnimatePresence>{isOpen && <div className="ui-drawer-viewport fixed inset-0 flex items-end justify-center" style={{ zIndex: layer }} role="presentation">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: animations ? 0.2 : 0 }}
      onClick={() => { telegramHaptic('light'); onClose(); }} className="absolute inset-0 bg-brand-overlay" />
    <motion.div role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
      ref={ref} tabIndex={-1} drag="y" dragControls={controls} dragListener={false} dragConstraints={{ top: 0 }} dragElastic={0.2} onDragEnd={closeFromDrag}
      initial={{ y: animations ? '100%' : 0 }} animate={{ y: 0 }} exit={{ y: animations ? '100%' : 0 }}
      transition={animations ? { type: 'spring', damping: 28, stiffness: 300 } : { duration: 0 }}
      style={{ maxHeight: `min(${maxHeight}, calc(100dvh - var(--app-safe-top) - 32px))` }}
      className={`ui-drawer relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border-t border-brand-border bg-brand-surface shadow-2xl ${className}`}>
      <div className="shrink-0 px-5 pt-4 pb-4">
        {showHandle && <div onPointerDown={event => controls.start(event)} className="mx-auto -mt-2 mb-2 flex h-8 w-16 cursor-grab items-center justify-center touch-none" aria-hidden="true"><span className="h-1 w-10 rounded-full bg-brand-muted/40" /></div>}
        <DialogHeader title={title} description={description} titleId={titleId} descriptionId={descriptionId} onClose={onClose} />
      </div>
      <div className={`ui-dialog-body min-h-0 overflow-y-auto overscroll-contain px-5 space-y-4 ${footer ? 'pb-4' : 'pb-[calc(1.25rem+var(--app-safe-bottom))]'}`}>{children}</div>
      {footer && <div className="shrink-0 border-t border-brand-border bg-brand-surface px-5 pt-3 pb-[calc(1.25rem+var(--app-safe-bottom))]">{footer}</div>}
    </motion.div>
  </div>}</AnimatePresence>, document.body);
}
