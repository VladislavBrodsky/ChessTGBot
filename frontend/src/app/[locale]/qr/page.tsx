import { Suspense } from 'react';
import QrClient from './QrClient';

export default function QrPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-void flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
      </div>
    }>
      <QrClient />
    </Suspense>
  );
}
