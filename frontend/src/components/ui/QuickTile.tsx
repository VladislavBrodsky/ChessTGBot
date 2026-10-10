'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { telegramHaptic } from '@/lib/telegram';

type Tone = 'success' | 'gold' | 'premium' | 'info' | 'neutral';

/** Navigation tile: icon, label, optional one-line caption. Always a link. */
export function QuickTile({ href, icon, label, caption, tone = 'neutral', badge = 0, className = '' }: {
  href: string; icon: ReactNode; label: ReactNode; caption?: ReactNode; tone?: Tone; badge?: number; className?: string;
}) {
  return (
    <Link href={href} onClick={() => telegramHaptic('selection')} className={`ui-quick-tile ${className}`}>
      <span className="relative">
        <span className={`ui-icon-tile ${tone === 'neutral' ? '' : `ui-icon-tile--${tone}`}`} aria-hidden="true">{icon}</span>
        {badge > 0 && <span className="ui-count-badge">{badge > 9 ? '9+' : badge}</span>}
      </span>
      <span className="min-w-0">
        <span className="ui-quick-tile__label block">{label}</span>
        {caption && <span className="ui-quick-tile__caption block">{caption}</span>}
      </span>
    </Link>
  );
}
