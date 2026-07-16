'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { telegramHaptic, telegramAlert } from "@/lib/telegram";
import Confetti from "react-confetti";
import { FaCheckCircle, FaLock, FaGift } from "react-icons/fa";
import { useNavbar } from '@/context/NavbarContext';

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

  useEffect(() => {
    if (!isOpen) return;
    pushHide();
    return () => popHide();
  }, [isOpen, pushHide, popHide]);

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

  const currentDayIndex = status ? status.current_streak % 7 : 0;

  return (
    <AnimatePresence>
      {isOpen && status && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-surface/90 backdrop-blur-xl"
        >
          {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={windowSize.width < 768 ? 120 : 240} />}
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-sm p-7 rounded-[2rem] bg-gradient-to-br from-brand-surface via-[#13151A] to-[#0D0F12] border border-white/5 shadow-2xl relative overflow-hidden"
          >
            {/* Animated Glowing Orbs Background */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px] animate-pulse" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
            
            <div className="relative z-10 text-center flex flex-col items-center">
              {/* Crown/Icon at the top */}
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] mb-4">
                <FaGift className="text-white text-xl" />
              </div>

              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight mb-2">Daily Reward</h2>
              <p className="text-xs font-bold text-white/50 uppercase tracking-[0.15em] mb-8 max-w-[250px]">Return every day to unlock massive rewards!</p>

              <div className="grid grid-cols-4 gap-3 mb-3 w-full">
                {status.rewards.slice(0, 4).map((reward, idx) => (
                  <RewardDay 
                    key={idx} 
                    day={idx + 1} 
                    reward={reward} 
                    status={idx < currentDayIndex ? 'past' : idx === currentDayIndex ? 'current' : 'future'} 
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-8 w-full">
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

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClaim}
                disabled={claiming || !status.can_claim_today}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-sm transition-all relative overflow-hidden group
                  ${status.can_claim_today && !claiming
                    ? "bg-gradient-to-r from-amber-500 to-amber-400 text-amber-950 cursor-pointer shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                    : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                  }`}
              >
                {/* Button shine effect */}
                {status.can_claim_today && !claiming && (
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                )}
                <span className="relative z-10">{claiming ? "Claiming..." : status.can_claim_today ? "Claim Reward" : "Come back tomorrow"}</span>
              </motion.button>
              
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
    <div className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300
      ${isBig ? 'col-span-1' : ''} 
      ${isCurrent ? 'border-amber-400/50 bg-amber-400/10 shadow-[0_0_25px_rgba(245,158,11,0.2)] transform scale-105 z-10' : 'border-white/5 bg-white/5'} 
      ${isPast ? 'opacity-50 grayscale border-white/5 bg-transparent' : ''}
    `}>
      {isCurrent && (
        <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full z-0" />
      )}
      
      <span className={`relative z-10 text-[9px] font-black uppercase tracking-widest mb-1 ${isCurrent ? 'text-amber-300' : 'text-white/50'}`}>Day {day}</span>
      
      <div className="relative z-10 flex flex-col items-center my-1 h-8 justify-center">
        {isPast ? (
          <FaCheckCircle className="text-emerald-500 text-xl drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        ) : isFuture && !isBig ? (
          <FaLock className="text-white/20 text-lg" />
        ) : isBig ? (
          <FaGift className={`text-3xl ${isCurrent ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-bounce' : 'text-amber-500/40'}`} />
        ) : (
          <div className={`flex flex-col items-center ${isCurrent ? 'text-amber-400' : 'text-white'}`}>
            <span className={`font-black ${isCurrent ? 'text-xl drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'text-lg opacity-80'}`}>{reward}</span>
            <span className={`text-[8px] font-bold ${isCurrent ? 'text-amber-400/80' : 'text-white/40'}`}>XP</span>
          </div>
        )}
      </div>
    </div>
  );
}
