'use client';

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { telegramHaptic, telegramAlert } from "@/lib/telegram";
import Confetti from "react-confetti";
import { FaCheckCircle, FaLock, FaGift } from "react-icons/fa";
import { useTranslations } from 'next-intl';
import { useUser } from '@/context/UserContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAnimationsEnabled } from '@/hooks/useAnimationsEnabled';
import { useAudio } from '@/hooks/useAudio';

interface DailyStatus {
  can_claim_today: boolean;
  current_streak: number;
  last_checkin_date: string | null;
  rewards: number[];
}

interface DailyCheckinModalProps {
  onClose?: () => void;
}

export default function DailyCheckinModal({ onClose }: DailyCheckinModalProps = {}) {
  const t = useTranslations('Gamification');
  const tc = useTranslations('Common');
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const animations = useAnimationsEnabled();
  const { play } = useAudio();
  const { syncStats } = useUser();
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeModal = () => {
    if (!claiming) {
      setIsOpen(false);
      onClose?.();
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await apiFetch("/api/v1/gamification/daily-checkin/status");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
          if (data.can_claim_today) {
            setIsOpen(true);
            telegramHaptic('medium');
          }
        }
      } catch (e) {
        console.error("Failed to fetch daily checkin status:", e);
      }
    };
    fetchStatus();
  }, []);

  useEffect(() => () => {
    if (confettiTimer.current) clearTimeout(confettiTimer.current);
  }, []);

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    telegramHaptic('light');

    try {
      const res = await apiFetch('/api/v1/gamification/daily-checkin/claim', {
        method: 'POST'
      });

      if (res.ok) {
        const data = await res.json();
        // Sync stats so XP score & progress bar update immediately
        syncStats();
        telegramHaptic('success');
        setShowConfetti(true);
        play('win');
        if (confettiTimer.current) clearTimeout(confettiTimer.current);
        confettiTimer.current = setTimeout(() => setShowConfetti(false), 1800);

        // Update local state to reflect claim
        setStatus(prev => prev ? {
          ...prev,
          can_claim_today: false,
          current_streak: data.new_streak
        } : null);

      } else {
        const _err = await res.json().catch(() => ({}));
        telegramAlert(tc('error_description'));
        telegramHaptic('error');
      }
    } catch (e) {
      console.error(e);
      telegramHaptic('error');
    } finally {
      setClaiming(false);
    }
  };

  const currentDayIndex = status ? status.current_streak % 7 : 0;

  if (!status) return null;
  return <Modal isOpen={isOpen} onClose={closeModal} title={t('daily_reward')} description={t('daily_reward_description')} maxWidth="sm" layer={120}
    footer={<div className="space-y-2"><Button variant="primary" className="w-full" onClick={status.can_claim_today ? handleClaim : closeModal} disabled={claiming} isLoading={claiming}>
      {claiming ? tc('claiming') : status.can_claim_today ? t('claim_reward') : t('return_tomorrow')}
    </Button>{status.can_claim_today && <Button className="w-full" variant="ghost" onClick={closeModal} disabled={claiming}>{t('skip_now')}</Button>}</div>}>
    {showConfetti && animations && <div className="fixed inset-0 pointer-events-none"><Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={windowSize.width < 768 ? 56 : 100} /></div>}
    <div className="grid grid-cols-4 gap-2 mb-2">{status.rewards.slice(0, 4).map((reward, idx) => <RewardDay key={idx} day={idx + 1} reward={reward} status={idx < currentDayIndex ? 'past' : idx === currentDayIndex ? 'current' : 'future'} />)}</div>
    <div className="grid grid-cols-3 gap-2">{status.rewards.slice(4, 7).map((reward, idx) => <RewardDay key={idx + 4} day={idx + 5} reward={reward} isBig={idx === 2} status={idx + 4 < currentDayIndex ? 'past' : idx + 4 === currentDayIndex ? 'current' : 'future'} />)}</div>
  </Modal>;
}

function RewardDay({ day, reward, status, isBig = false }: { day: number, reward: number, status: 'past' | 'current' | 'future', isBig?: boolean }) {
  const t = useTranslations('Gamification');
  const isPast = status === 'past';
  const isCurrent = status === 'current';
  const isFuture = status === 'future';

  return (
    <div className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-300 ${
      isCurrent
        ? 'border-emerald-500/70 bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.25)] scale-[1.03] z-10'
        : isPast
          ? 'border-brand-border/30 bg-brand-surface/40 opacity-70'
          : 'border-brand-border/40 bg-brand-surface/70'
    } ${isBig && !isCurrent ? 'border-purple-500/40 bg-purple-500/10' : ''}`}>

      {isCurrent && (
        <div className="absolute inset-0 bg-emerald-500/10 blur-md rounded-2xl z-0 pointer-events-none" />
      )}

      <span className={`relative z-10 text-caption font-semibold normal-case tracking-normal mb-1 ${
        isCurrent ? 'text-emerald-400' : isPast ? 'text-brand-muted' : 'text-brand-muted'
      }`}>
        {t('reward_day', { day })}
      </span>

      <div className="relative z-10 flex h-8 w-full flex-col items-center justify-center">
        {isPast ? (
          <FaCheckCircle className="text-emerald-500 text-lg drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
        ) : isFuture && !isBig ? (
          <div className="flex flex-col items-center gap-0.5">
            <FaLock className="text-brand-muted text-sm" />
            <span className="text-caption font-bold text-brand-muted">{reward} XP</span>
          </div>
        ) : isBig ? (
          <div className="flex flex-col items-center">
            <FaGift className={`text-2xl ${
              isCurrent
                ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]'
                : 'text-purple-400/80'
            }`} />
            {!isCurrent && (
              <span className="text-caption font-semibold text-purple-300/90">{reward} XP</span>
            )}
          </div>
        ) : (
          <div className={`flex flex-col items-center ${isCurrent ? 'text-emerald-400' : 'text-brand-primary'}`}>
            <span className={`font-semibold tracking-tight ${
              isCurrent ? 'text-lg text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'text-base opacity-90'
            }`}>
              {reward}
            </span>
            <span className={`text-caption font-bold ${isCurrent ? 'text-emerald-400/90' : 'text-brand-muted'}`}>
              XP
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
