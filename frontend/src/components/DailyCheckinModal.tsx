'use client';

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { telegramHaptic, telegramAlert } from "@/lib/telegram";
import Confetti from "react-confetti";
import { FaCheckCircle, FaLock, FaLockOpen, FaGift } from "react-icons/fa";
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
          current_streak: typeof data.new_streak === 'number' ? data.new_streak : prev.current_streak + 1
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
    {/* One 4-column grid: days 1-4, then 5, 6 and a double-width day 7, so every column lines up. */}
    <ol className="reward-week" aria-label={t('daily_reward')}>
      {status.rewards.slice(0, 7).map((reward, idx) => <RewardDay key={idx} day={idx + 1} reward={reward} isBig={idx === 6}
        status={idx < currentDayIndex ? 'past' : idx === currentDayIndex && status.can_claim_today ? 'current' : 'future'} />)}
    </ol>
  </Modal>;
}

function RewardDay({ day, reward, status, isBig = false }: { day: number, reward: number, status: 'past' | 'current' | 'future', isBig?: boolean }) {
  const t = useTranslations('Gamification');
  const Icon = status === 'past' ? FaCheckCircle : isBig ? FaGift : status === 'current' ? FaLockOpen : FaLock;
  // Fixed rows (label / icon / amount) keep every tile the same height; the current day is marked
  // with colour and border only, never scale or an outer glow, which the scrolling dialog body clips.
  return (
    <li className={`reward-day reward-day--${status}${isBig ? ' reward-day--big' : ''}`} aria-current={status === 'current' ? 'date' : undefined}>
      <span className="reward-day__label">{t('reward_day', { day })}</span>
      <Icon className="reward-day__icon" aria-hidden="true" />
      <span className="reward-day__amount">{reward} XP</span>
    </li>
  );
}
