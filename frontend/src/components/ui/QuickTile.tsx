'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { telegramHaptic } from '@/lib/telegram';
import { Badge } from './Badge';

type Tone = 'success' | 'gold' | 'premium' | 'info' | 'neutral';

/** Navigation tile: centered icon, centered label, optional centered caption. Always a link. */
export function QuickTile({ href, icon, label, caption, tone = 'neutral', badge = 0, className = '' }: {
  href: string; icon: ReactNode; label: ReactNode; caption?: ReactNode; tone?: Tone; badge?: number; className?: string;
}) {
  return (
    <Link href={href} onClick={() => telegramHaptic('selection')} className={`ui-quick-tile ${className}`}>
      {badge > 0 && (
        <span className="absolute top-2 right-2 z-10 pointer-events-none">
          <Badge variant="emerald" size="counter">{badge > 9 ? '9+' : badge}</Badge>
        </span>
      )}
      <span className="flex w-full items-center justify-center">
        <span className={`ui-icon-tile ${tone === 'neutral' ? '' : `ui-icon-tile--${tone}`}`} aria-hidden="true">{icon}</span>
      </span>
      <span className="min-w-0 w-full flex flex-col items-center">
        <span className="ui-quick-tile__label block text-center truncate w-full">{label}</span>
        {caption && <span className="ui-quick-tile__caption block text-center w-full">{caption}</span>}
      </span>
    </Link>
  );
}
