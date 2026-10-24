import { Suspense } from 'react';
import PayReturnClient from './PayReturnClient';

export default function PayReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-void flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    }>
      <PayReturnClient />
    </Suspense>
  );
}
