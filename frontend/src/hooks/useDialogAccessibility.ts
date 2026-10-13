'use client';

import { useRef } from 'react';
import { useDialog } from './useDialog';

/** Legacy feature dialogs share the same focus and scroll stack as Modal/Drawer. */
export function useDialogAccessibility(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useDialog(active, ref, onClose);
  return ref;
}
