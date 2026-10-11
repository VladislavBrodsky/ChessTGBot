'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { FaLightbulb } from 'react-icons/fa';
import { Card } from '@/components/ui/Card';
import { DAILY_HINT_KEYS } from '@/data/hints';

function localDayOfYear(now: Date): number {
  const day = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const start = Date.UTC(now.getFullYear(), 0, 0);
  return Math.floor((day - start) / 86_400_000);
}

/** A reusable chess cue. Reading it never claims or changes XP. */
export default function DailyHintCard() {
  const t = useTranslations('Academy');
  // Keep the same first render on the server and client, then select the player's local day.
  const [hint, setHint] = useState<(typeof DAILY_HINT_KEYS)[number]>(DAILY_HINT_KEYS[0]);

  useEffect(() => {
    setHint(DAILY_HINT_KEYS[localDayOfYear(new Date()) % DAILY_HINT_KEYS.length]);
  }, []);

  return (
    <Card variant="solid" className="w-full p-4">
      <div className="flex items-start gap-3">
        <span className="ui-icon-tile ui-icon-tile--gold size-[var(--size-tile-md)] shrink-0" aria-hidden="true">
          <FaLightbulb className="text-base" />
        </span>
        <div className="min-w-0">
          <h2 className="t-title-3 text-brand-primary">{t('daily_cue')}</h2>
          <p className="t-body mt-1 text-brand-muted">{t(hint)}</p>
        </div>
      </div>
    </Card>
  );
}
