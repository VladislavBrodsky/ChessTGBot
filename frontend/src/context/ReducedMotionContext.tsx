'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { MotionConfig } from 'framer-motion';

export const REDUCED_MOTION_STORAGE_KEY = 'setting_reduce_motion';

interface ReducedMotionContextValue {
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
}

const ReducedMotionContext = createContext<ReducedMotionContextValue | undefined>(undefined);

function readStoredPreference(): boolean {
  try {
    return window.localStorage.getItem(REDUCED_MOTION_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function applyRootPreference(enabled: boolean): void {
  document.documentElement.dataset.reduceMotion = String(enabled);
}

export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  const [reducedMotion, setReducedMotionState] = useState(false);

  useEffect(() => {
    const storedPreference = readStoredPreference();
    setReducedMotionState(storedPreference);
    applyRootPreference(storedPreference);
  }, []);

  const setReducedMotion = useCallback((enabled: boolean) => {
    setReducedMotionState(enabled);
    applyRootPreference(enabled);

    try {
      window.localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, String(enabled));
    } catch {
      // Storage can be unavailable in privacy-restricted WebViews. The setting
      // still applies for the current session through state and the root flag.
    }
  }, []);

  return (
    <ReducedMotionContext.Provider value={{ reducedMotion, setReducedMotion }}>
      <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
        {children}
      </MotionConfig>
    </ReducedMotionContext.Provider>
  );
}

export function useReducedMotionPreference(): ReducedMotionContextValue {
  const context = useContext(ReducedMotionContext);
  if (!context) {
    throw new Error('useReducedMotionPreference must be used within ReducedMotionProvider');
  }
  return context;
}
