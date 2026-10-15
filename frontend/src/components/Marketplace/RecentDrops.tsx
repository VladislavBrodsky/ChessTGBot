'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { BOX_CONFIG, type BoxTier } from './boxConfig';

export interface RecentDrop {
  name: string;
  type: string;
  tier: BoxTier;
  at: number;
}

/** "5 minutes ago" in the viewer's language; `numeric: auto` turns an instant into "now". */
export function relativeTime(at: number, now: number, rtf: Intl.RelativeTimeFormat): string {
  const seconds = Math.round((at - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return rtf.format(0, 'second');
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  return rtf.format(Math.round(seconds / 86400), 'day');
}

/**
 * The player's OWN recent unboxings, as stored on this device. It never shows other players: there is no feed of them
 * to show, and an invented one (names, prizes, "live" timestamps) would mislead people about how the vaults pay out.
 * Renders nothing until there is a real drop.
 */
export default function RecentDrops({ drops }: { drops: RecentDrop[] }) {
  const t = useTranslations('Marketplace');
  const locale = useLocale();
  if (drops.length === 0) return null;

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  const now = Date.now();

  return (
    <section aria-labelledby="marketplace-recent-drops" className="flex w-full flex-col gap-2">
      <h2 id="marketplace-recent-drops" className="t-caption font-semibold text-brand-muted">{t('recent_drops')}</h2>
      <ul className="m-0 flex list-none items-center gap-2 overflow-x-auto p-0 pb-1">
        {drops.slice(0, 8).map((drop) => {
          const cfg = BOX_CONFIG[drop.tier];
          const { accent, rgb } = cfg.theme;
          return (
            <li key={`${drop.at}-${drop.name}`} className="flex shrink-0 items-center gap-2.5 rounded-xl border border-brand-border bg-brand-surface px-3 py-2">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-lg border font-serif text-caption"
                style={{
                  color: `color-mix(in srgb, ${accent} 40%, var(--text-primary))`,
                  background: `rgba(${rgb},0.12)`,
                  borderColor: `rgba(${rgb},0.3)`,
                }}
              >
                {cfg.glyph}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="max-w-[160px] truncate t-caption font-semibold text-brand-primary">{drop.name}</span>
                <span className="t-caption text-brand-muted"><bdi>{relativeTime(drop.at, now, rtf)}</bdi></span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
