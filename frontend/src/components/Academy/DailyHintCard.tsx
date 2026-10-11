'use client';

import { useEffect, useState } from 'react';
import { FaLightbulb } from 'react-icons/fa';
import { Card } from '@/components/ui/Card';
import { DAILY_HINTS } from '@/data/hints';

function localDayOfYear(now: Date): number {
  const day = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const start = Date.UTC(now.getFullYear(), 0, 0);
  return Math.floor((day - start) / 86_400_000);
}

/** A reusable chess cue. Reading it never claims or changes XP. */
export default function DailyHintCard() {
  // Keep the same first render on the server and client, then select the player's local day.
  const [hint, setHint] = useState<string>(DAILY_HINTS[0]);

  useEffect(() => {
    setHint(DAILY_HINTS[localDayOfYear(new Date()) % DAILY_HINTS.length]);
  }, []);

  return (
    <Card variant="solid" className="w-full p-4">
      <div className="flex items-start gap-3">
        <span className="ui-icon-tile ui-icon-tile--gold size-[var(--size-tile-md)] shrink-0" aria-hidden="true">
          <FaLightbulb className="text-base" />
        </span>
        <div className="min-w-0">
          <h2 className="t-title-3 text-brand-primary">Today&apos;s chess cue</h2>
          <p className="t-body mt-1 text-brand-muted">{hint}</p>
        </div>
      </div>
    </Card>
  );
}
