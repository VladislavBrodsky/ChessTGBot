'use client';

import { useSyncExternalStore } from 'react';
import { getSoundEnabled, setSoundEnabled, subscribeSoundPreference } from '@/lib/soundPreference';

export function useSoundPreference() {
  const soundEnabled = useSyncExternalStore(subscribeSoundPreference, getSoundEnabled, () => true);
  return { soundEnabled, setSoundEnabled };
}
