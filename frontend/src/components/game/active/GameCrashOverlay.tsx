'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface GameCrashOverlayProps {
  show: boolean;
  tGameCrashed: string;
  tGameCrashedDesc: string;
  tReloadGameBtn: string;
}

export function GameCrashOverlay({
  show,
  tGameCrashed,
  tGameCrashedDesc,
  tReloadGameBtn,
}: GameCrashOverlayProps) {
  if (!show) return null;

  return <Modal isOpen onClose={() => {}} title={tGameCrashed} description={tGameCrashedDesc} maxWidth="sm" layer={120} role="alertdialog" showCloseButton={false}
    footer={<Button variant="primary" className="w-full" onClick={() => window.location.reload()}>{tReloadGameBtn}</Button>}>
    <div className="ui-icon-tile ui-icon-tile--danger mx-auto" aria-hidden="true">!</div>
  </Modal>;
}
