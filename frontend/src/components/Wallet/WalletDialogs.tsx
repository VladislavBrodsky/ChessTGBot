'use client';

import { lazy, Suspense } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import type { DepositModalProps } from './DepositModal';
import type { WalletSelectorModalProps } from './WalletSelectorModal';

const Deposit = lazy(() => import('./DepositModal'));
const WalletSelector = lazy(() => import('./WalletSelectorModal'));

function WalletDialogSkeleton({ title, onClose }: { title: string; onClose: () => void }) {
  return <Drawer isOpen onClose={onClose} title={title}>
    <div aria-busy="true" className="space-y-4 p-2">
      <SkeletonText lines={2} />
      <Skeleton variant="rectangular" height={112} className="rounded-card" />
      <Skeleton variant="rectangular" height={48} className="rounded-control" />
    </div>
  </Drawer>;
}

export function DepositDialog(props: DepositModalProps) {
  return <Suspense fallback={<WalletDialogSkeleton title={props.tw('deposit')} onClose={props.onClose} />}><Deposit {...props} /></Suspense>;
}

export function WalletSelectorDialog(props: WalletSelectorModalProps) {
  return <Suspense fallback={<WalletDialogSkeleton title={props.tw('link_ton')} onClose={props.onClose} />}><WalletSelector {...props} /></Suspense>;
}
