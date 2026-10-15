'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { apiFetch } from '@/lib/api';
import { useInvitations } from '@/context/InvitationContext';

const Onboarding = dynamic(() => import('./Onboarding'), { ssr: false });
const RegionPrompt = dynamic(() => import('./RegionPrompt'), { ssr: false });
const DailyCheckinModal = dynamic(() => import('./DailyCheckinModal'), { ssr: false });

export type FirstRunStep = 'onboarding' | 'region' | 'daily_reward' | null;

interface FirstRunCoordinatorProps {
  onOnboardingChange?: (isActive: boolean) => void;
}

const REGION_SESSION_KEY = 'region_prompt_seen';
const DAILY_SESSION_KEY = 'daily_checkin_dismissed';

export default function FirstRunCoordinator({ onOnboardingChange }: FirstRunCoordinatorProps = {}) {
  const pathname = usePathname();
  const { busy: invitationBusy } = useInvitations();
  const { stats, loadingStats } = useUser();
  const [activeStep, setActiveStep] = useState<FirstRunStep>(() => {
    if (typeof window !== 'undefined') {
      const onboardingDone = localStorage.getItem('onboarding_completed') === 'true';
      if (!onboardingDone) return 'onboarding';
    }
    return null;
  });
  const [dailyStatusChecked, setDailyStatusChecked] = useState(false);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const isHomePage = Boolean(
    pathname && (pathname.endsWith('/home') || pathname.endsWith('/home/'))
  );

  // Capture initial focus for restoration when all dialogs conclude
  useEffect(() => {
    if (typeof document !== 'undefined' && !previousFocusRef.current) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
  }, []);

  // Pre-fetch daily check-in status if on home page
  useEffect(() => {
    if (!isHomePage || dailyStatusChecked) return;

    let mounted = true;
    const checkDaily = async () => {
      try {
        if (typeof window !== 'undefined' && sessionStorage.getItem(DAILY_SESSION_KEY)) {
          if (mounted) setDailyStatusChecked(true);
          return;
        }
        const res = await apiFetch('/api/v1/gamification/daily-checkin/status');
        if (res.ok && mounted) {
          const data = await res.json();
          setCanClaimDaily(Boolean(data?.can_claim_today));
        }
      } catch (err) {
        console.error('Failed to prefetch daily checkin status:', err);
      } finally {
        if (mounted) setDailyStatusChecked(true);
      }
    };

    checkDaily();
    return () => {
      mounted = false;
    };
  }, [isHomePage, dailyStatusChecked]);

  // Main coordinator engine: decides which dialog (if any) should be mounted
  useEffect(() => {
    if (typeof window === 'undefined' || invitationBusy) return;

    // 1. Step 1: Onboarding check
    const onboardingDone = localStorage.getItem('onboarding_completed') === 'true';
    if (!onboardingDone) {
      setActiveStep('onboarding');
      onOnboardingChange?.(true);
      return;
    }

    // 2. Step 2: Region Prompt check (only after onboarding is finished)
    // Wait for user stats to load first
    if (!loadingStats && stats) {
      const regionSeen = Boolean(sessionStorage.getItem(REGION_SESSION_KEY));
      if (!stats.region && !regionSeen && isHomePage) {
        setActiveStep('region');
        onOnboardingChange?.(false);
        return;
      }
    }

    // 3. Step 3: Daily Reward check (only on home page after onboarding & region)
    if (isHomePage && dailyStatusChecked && canClaimDaily) {
      const dismissed = Boolean(sessionStorage.getItem(DAILY_SESSION_KEY));
      if (!dismissed) {
        setActiveStep('daily_reward');
        onOnboardingChange?.(false);
        return;
      }
    }

    // 4. Queue is exhausted — all first-run steps completed
    setActiveStep(null);
    onOnboardingChange?.(false);
  }, [loadingStats, stats, isHomePage, dailyStatusChecked, canClaimDaily, onOnboardingChange, invitationBusy]);

  const handleOnboardingClose = useCallback(() => {
    try {
      localStorage.setItem('onboarding_completed', 'true');
    } catch {
      // storage blocked
    }
    onOnboardingChange?.(false);

    // Advance to next step immediately
    const regionSeen = typeof window !== 'undefined' && Boolean(sessionStorage.getItem(REGION_SESSION_KEY));
    if (isHomePage && stats && !stats.region && !regionSeen) {
      setActiveStep('region');
    } else if (isHomePage && canClaimDaily) {
      setActiveStep('daily_reward');
    } else {
      setActiveStep(null);
      restoreFocus();
    }
  }, [isHomePage, stats, canClaimDaily, onOnboardingChange]);

  const handleRegionClose = useCallback(() => {
    try {
      sessionStorage.setItem(REGION_SESSION_KEY, '1');
    } catch {
      // storage blocked
    }

    // Advance to daily reward if available on home page
    if (isHomePage && canClaimDaily) {
      setActiveStep('daily_reward');
    } else {
      setActiveStep(null);
      restoreFocus();
    }
  }, [isHomePage, canClaimDaily]);

  const handleDailyClose = useCallback(() => {
    try {
      sessionStorage.setItem(DAILY_SESSION_KEY, '1');
    } catch {
      // storage blocked
    }
    setCanClaimDaily(false);
    setActiveStep(null);
    restoreFocus();
  }, []);

  const restoreFocus = () => {
    if (typeof document !== 'undefined') {
      window.requestAnimationFrame(() => {
        if (previousFocusRef.current?.isConnected) {
          previousFocusRef.current.focus();
        } else {
          const mainContent = document.querySelector<HTMLElement>('main, [role="main"]');
          mainContent?.focus();
        }
      });
    }
  };

  if (invitationBusy) return null;

  // Mount strictly at most ONE modal at any given time
  return (
    <>
      {activeStep === 'onboarding' && (
        <Onboarding key="firstrun-onboarding" onClose={handleOnboardingClose} />
      )}
      {activeStep === 'region' && (
        <RegionPrompt key="firstrun-region" onClose={handleRegionClose} />
      )}
      {activeStep === 'daily_reward' && (
        <DailyCheckinModal key="firstrun-daily" onClose={handleDailyClose} />
      )}
    </>
  );
}
