'use client';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { telegramHaptic, telegramAlert } from "@/lib/telegram";
import Confetti from "react-confetti";
import { FaCheckCircle, FaLock, FaGift, FaTimes } from "react-icons/fa";
import { useNavbar } from '@/context/NavbarContext';
import { useUser } from '@/context/UserContext';
import { useDialogAccessibility } from '@/hooks/useDialogAccessibility';

interface DailyStatus {
  can_claim_today: boolean;
  current_streak: number;
  last_checkin_date: string | null;
  rewards: number[];
}

export default function DailyCheckinModal() {
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const { pushHide, popHide } = useNavbar();
  const { syncStats } = useUser();
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeModal = () => {
    if (!claiming) setIsOpen(false);
  };
  const dialogRef = useDialogAccessibility(Boolean(isOpen && status), closeModal);

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

  useEffect(() => {
    if (isOpen) {
      pushHide();
    } else {
      popHide();
    }
  }, [isOpen, pushHide, popHide]);

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
        new Audio('/sounds/win.mp3').play().catch(e => console.log('Audio blocked', e));
        if (confettiTimer.current) clearTimeout(confettiTimer.current);
        confettiTimer.current = setTimeout(() => setShowConfetti(false), 1800);
        
        // Update local state to reflect claim
        setStatus(prev => prev ? {
          ...prev,
          can_claim_today: false,
          current_streak: data.new_streak
        } : null);

      } else {
        const err = await res.json();
        telegramAlert(err.detail || "Failed to claim reward");
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

  return (
    <AnimatePresence>
      {isOpen && status && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-brand-void/85 backdrop-blur-xl"
        >
          {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={windowSize.width < 768 ? 120 : 240} />}
          
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="daily-reward-title"
            aria-describedby="daily-reward-subtitle"
            tabIndex={-1}
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="app-premium-surface relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-brand-border p-6 pb-[calc(24px+var(--app-safe-bottom))] shadow-2xl"
          >
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
            
            {/* Top-right close button */}
            <button
              type="button"
              onClick={closeModal}
              disabled={claiming}
              aria-label="Close"
              className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-brand-surface/60 text-brand-muted hover:text-brand-primary hover:bg-brand-elevated border border-brand-border/40 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FaTimes className="text-sm" />
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Crown/Gift Icon Header with Obsidian Emerald identity */}
              <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-emerald-950 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                <FaGift className="text-2xl text-emerald-950" />
                <div className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-md pointer-events-none" />
              </div>

              <h2 id="daily-reward-title" className="mb-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-primary">
                Daily Reward
              </h2>
              <p id="daily-reward-subtitle" className="mb-6 max-w-[260px] text-xs font-bold uppercase tracking-[0.14em] text-brand-muted">
                Return every day to unlock massive rewards!
              </p>

              {/* Day Rewards Grids */}
              <div className="mb-3 grid w-full grid-cols-4 gap-2.5">
                {status.rewards.slice(0, 4).map((reward, idx) => (
                  <RewardDay 
                    key={idx} 
                    day={idx + 1} 
                    reward={reward} 
                    status={idx < currentDayIndex ? 'past' : idx === currentDayIndex ? 'current' : 'future'} 
                  />
                ))}
              </div>
              <div className="mb-6 grid w-full grid-cols-3 gap-2.5">
                {status.rewards.slice(4, 7).map((reward, idx) => (
                  <RewardDay 
                    key={idx + 4} 
                    day={idx + 5} 
                    reward={reward} 
                    isBig={idx === 2}
                    status={(idx + 4) < currentDayIndex ? 'past' : (idx + 4) === currentDayIndex ? 'current' : 'future'} 
                  />
                ))}
              </div>

              {/* Main Action Button */}
              <motion.button
                whileHover={{ scale: claiming ? 1 : 1.02 }}
                whileTap={{ scale: claiming ? 1 : 0.98 }}
                onClick={status.can_claim_today ? handleClaim : closeModal}
                disabled={claiming}
                className={`relative min-h-[48px] w-full overflow-hidden rounded-2xl py-3.5 text-sm font-black uppercase tracking-[0.15em] transition-all cursor-pointer ${
                  status.can_claim_today && !claiming
                    ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 text-emerald-950 shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]"
                    : "bg-brand-elevated border border-brand-border text-brand-primary hover:bg-brand-surface shadow-md"
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {claiming ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Claiming...</span>
                    </>
                  ) : status.can_claim_today ? (
                    "Claim Reward"
                  ) : (
                    "Come back tomorrow"
                  )}
                </span>
              </motion.button>
              
              {status.can_claim_today && (
                <button 
                  type="button"
                  onClick={closeModal}
                  className="mt-3 min-h-[44px] px-4 text-xs font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
                >
                  Skip for now
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RewardDay({ day, reward, status, isBig = false }: { day: number, reward: number, status: 'past' | 'current' | 'future', isBig?: boolean }) {
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
      
      <span className={`relative z-10 text-[9px] font-black uppercase tracking-widest mb-1 ${
        isCurrent ? 'text-emerald-400' : isPast ? 'text-brand-muted/70' : 'text-brand-muted'
      }`}>
        Day {day}
      </span>
      
      <div className="relative z-10 flex h-8 w-full flex-col items-center justify-center">
        {isPast ? (
          <FaCheckCircle className="text-emerald-500 text-lg drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
        ) : isFuture && !isBig ? (
          <div className="flex flex-col items-center gap-0.5">
            <FaLock className="text-brand-muted/40 text-xs" />
            <span className="text-[9px] font-bold text-brand-muted/60">{reward} XP</span>
          </div>
        ) : isBig ? (
          <div className="flex flex-col items-center">
            <FaGift className={`text-2xl ${
              isCurrent 
                ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-bounce' 
                : 'text-purple-400/80'
            }`} />
            {!isCurrent && (
              <span className="text-[9px] font-black text-purple-300/90">{reward} XP</span>
            )}
          </div>
        ) : (
          <div className={`flex flex-col items-center ${isCurrent ? 'text-emerald-400' : 'text-brand-primary'}`}>
            <span className={`font-black tracking-tight ${
              isCurrent ? 'text-lg text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'text-base opacity-90'
            }`}>
              {reward}
            </span>
            <span className={`text-[8px] font-bold ${isCurrent ? 'text-emerald-400/90' : 'text-brand-muted'}`}>
              XP
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
