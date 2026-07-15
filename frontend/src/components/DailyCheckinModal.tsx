'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { telegramHaptic, telegramAlert } from "@/lib/telegram";
import Confetti from "react-confetti";
import { FaCheckCircle, FaLock, FaGift } from "react-icons/fa";

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

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    // Check status on mount
    apiFetch('/api/v1/gamification/daily-checkin/status')
      .then(res => res.json())
      .then((data: DailyStatus) => {
        setStatus(data);
        if (data.can_claim_today) {
          setIsOpen(true);
          telegramHaptic('medium');
        }
      })
      .catch(err => console.error("Failed to fetch daily checkin status:", err));
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
        telegramHaptic('success');
        setShowConfetti(true);
        new Audio('/sounds/win.mp3').play().catch(e => console.log('Audio blocked', e));
        
        // Update local state to reflect claim
        setStatus(prev => prev ? {
          ...prev,
          can_claim_today: false,
          current_streak: data.new_streak
        } : null);

        setTimeout(() => {
          setIsOpen(false);
        }, 3000); // Close after 3 seconds of celebration
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

  if (!isOpen || !status) return null;

  const currentDayIndex = status.current_streak % 7;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-surface/90 backdrop-blur-xl">
        {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={300} />}
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-brand-border-opacity-20 relative overflow-hidden"
        >
          {/* Glowing background */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-purple-500/10 pointer-events-none" />
          
          <div className="relative z-10 text-center">
            <h2 className="text-3xl font-black text-brand-primary uppercase tracking-tight mb-2">Daily Reward</h2>
            <p className="text-xs font-bold text-brand-primary opacity-60 uppercase tracking-widest mb-6">Return every day to unlock massive rewards!</p>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {status.rewards.slice(0, 4).map((reward, idx) => (
                <RewardDay 
                  key={idx} 
                  day={idx + 1} 
                  reward={reward} 
                  status={idx < currentDayIndex ? 'past' : idx === currentDayIndex ? 'current' : 'future'} 
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-8">
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

            <button
              onClick={handleClaim}
              disabled={claiming || !status.can_claim_today}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]
                ${status.can_claim_today && !claiming
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-900 cursor-pointer"
                  : "bg-brand-surface border border-brand-border-opacity-20 text-brand-primary opacity-50 cursor-not-allowed"
                }`}
            >
              {claiming ? "Claiming..." : status.can_claim_today ? "Claim Reward" : "Come back tomorrow"}
            </button>
            
            {status.can_claim_today && (
              <button 
                onClick={() => setIsOpen(false)}
                className="mt-4 text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-widest hover:opacity-100 transition-opacity"
              >
                Skip for now
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function RewardDay({ day, reward, status, isBig = false }: { day: number, reward: number, status: 'past' | 'current' | 'future', isBig?: boolean }) {
  const isPast = status === 'past';
  const isCurrent = status === 'current';
  
  return (
    <div className={`relative flex flex-col items-center justify-center p-2 rounded-xl border ${isBig ? 'col-span-1 border-amber-500/50 bg-amber-500/10' : 'border-brand-border-opacity-20 bg-brand-surface'} ${isCurrent ? 'ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : ''} ${isPast ? 'opacity-50' : ''}`}>
      <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary opacity-60 mb-1">Day {day}</span>
      
      {isPast ? (
        <FaCheckCircle className="text-emerald-500 text-xl my-1" />
      ) : isBig ? (
        <FaGift className={`text-3xl my-1 ${isCurrent ? 'text-amber-400' : 'text-amber-500/40'}`} />
      ) : (
        <div className={`flex flex-col items-center my-1 ${isCurrent ? 'text-amber-400' : 'text-brand-primary opacity-40'}`}>
          <span className="font-black text-sm">{reward}</span>
          <span className="text-[8px] font-bold">XP</span>
        </div>
      )}
      
      {status === 'future' && !isBig && (
        <div className="absolute inset-0 bg-brand-surface/50 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
          <FaLock className="text-brand-primary opacity-30 text-xs" />
        </div>
      )}
    </div>
  );
}
