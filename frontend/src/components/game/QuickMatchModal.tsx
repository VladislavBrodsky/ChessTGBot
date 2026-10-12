'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChessKnight, FaBolt, FaClock, FaShieldAlt, FaTrophy, FaWallet, FaCheckCircle } from 'react-icons/fa';
import { useUser } from '@/context/UserContext';
import { useAudio } from '@/hooks/useAudio';
import { telegramHaptic } from '@/lib/telegram';
import { apiFetch } from '@/lib/api';
import { getRandomOpponent, saveGameOpponent, SimulatedOpponent } from '@/lib/opponents';
import { DepositDialog } from '@/components/Wallet/WalletDialogs';

interface QuickMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWagerCents?: number;
}

const WAGER_OPTIONS = [
  { cents: 0, label: 'Free', sub: 'Qualifier', popular: false },
  { cents: 100, label: '$1', sub: '$1.90 Pot', popular: false },
  { cents: 300, label: '$3', sub: '$5.70 Pot', popular: false },
  { cents: 500, label: '$5', sub: '$9.50 Pot', popular: true },
  { cents: 1000, label: '$10', sub: '$19.00 Pot', popular: false },
  { cents: 2500, label: '$25', sub: '$47.50 Pot', popular: false },
];

const TIME_OPTIONS = [
  { seconds: 180, label: '3 min', type: 'Blitz', icon: FaBolt },
  { seconds: 300, label: '5 min', type: 'Rapid', icon: FaClock, popular: true },
  { seconds: 600, label: '10 min', type: 'Classical', icon: FaShieldAlt },
];

const SEARCH_TIPS = [
  'Scanning 1,480+ players online worldwide…',
  'Filtering pool by ELO rating & time control…',
  'Allocating low-latency match relay node…',
  'Calibrating secure board clocks…',
  'Opponent located! Establishing game board…',
];

export default function QuickMatchModal({
  isOpen,
  onClose,
  initialWagerCents = 500,
}: QuickMatchModalProps) {
  const locale = useLocale();
  const router = useRouter();
  const { play: playAudio } = useAudio();
  const { walletBalance, syncBalance, stats } = useUser();

  const [step, setStep] = useState<'config' | 'searching' | 'matched'>('config');
  const [wagerCents, setWagerCents] = useState<number>(initialWagerCents);
  const [timeControl, setTimeControl] = useState<number>(300);
  const [matchedOpponent, setMatchedOpponent] = useState<SimulatedOpponent | null>(null);
  const [showDeposit, setShowDeposit] = useState<boolean>(false);
  const [searchTimer, setSearchTimer] = useState<number>(0);
  const [searchTipIndex, setSearchTipIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const matchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial wager
  useEffect(() => {
    if (isOpen) {
      setStep('config');
      setWagerCents(initialWagerCents);
      setSearchTimer(0);
      setIsSubmitting(false);
    }
  }, [isOpen, initialWagerCents]);

  const hasInsufficientBalance = wagerCents > 0 && wagerCents > walletBalance;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (matchTimeoutRef.current) clearTimeout(matchTimeoutRef.current);
    };
  }, []);

  const handleStartSearch = useCallback(async () => {
    if (hasInsufficientBalance) {
      telegramHaptic('warning');
      setShowDeposit(true);
      return;
    }

    telegramHaptic('medium');
    setStep('searching');
    setSearchTimer(0);
    setSearchTipIndex(0);

    // Tip rotation timer
    const tipInterval = setInterval(() => {
      setSearchTipIndex(prev => (prev + 1) % SEARCH_TIPS.length);
    }, 1400);

    // 1-second display timer
    timerRef.current = setInterval(() => {
      setSearchTimer(prev => prev + 1);
    }, 1000);

    // Exact 5.8s natural search duration
    matchTimeoutRef.current = setTimeout(async () => {
      clearInterval(tipInterval);
      if (timerRef.current) clearInterval(timerRef.current);

      try {
        setIsSubmitting(true);
        const opponent = getRandomOpponent(stats?.elo);
        setMatchedOpponent(opponent);

        // Play audio & strong vibration
        playAudio('start');
        telegramHaptic('heavy');
        setStep('matched');

        // Create the game on backend with difficulty=hard (professional master)
        const res = await apiFetch(
          `/api/v1/game/create?type=computer&difficulty=hard&time_control=${timeControl}&wager=${wagerCents}`,
          { method: 'POST' }
        );

        if (res.ok) {
          const data = await res.json();
          if (data && data.game_id) {
            saveGameOpponent(data.game_id, opponent);
            
            // Brief 1.6s reveal of opponent before navigating to board
            setTimeout(() => {
              onClose();
              router.push(`/${locale}/game?id=${data.game_id}`);
            }, 1600);
            return;
          }
        }
        // Fallback if network hiccups
        onClose();
        router.push(`/${locale}/game`);
      } catch (err) {
        console.error('Failed to create match:', err);
        // Graceful fallback
        onClose();
        router.push(`/${locale}/game`);
      }
    }, 5800);
  }, [hasInsufficientBalance, timeControl, wagerCents, stats?.elo, playAudio, onClose, router, locale]);

  const handleCancelSearch = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (matchTimeoutRef.current) clearTimeout(matchTimeoutRef.current);
    telegramHaptic('selection');
    setStep('config');
    setSearchTimer(0);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-brand-border bg-[#0A0A0A] p-5 shadow-2xl text-brand-primary relative overflow-hidden"
          style={{ paddingBottom: 'calc(1.25rem + var(--app-safe-bottom, 0px))' }}
        >
          {/* Ambient Void Glow */}
          <div className="pointer-events-none absolute -top-24 -left-24 size-48 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 size-48 rounded-full bg-purple-500/15 blur-3xl" />

          {/* STEP 1: CONFIGURE MATCH */}
          {step === 'config' && (
            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                      <FaChessKnight size={16} />
                    </span>
                    Quick Match
                  </h2>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Fast pairing · Instant 95% settlement
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { telegramHaptic('selection'); onClose(); }}
                  className="size-8 rounded-full bg-brand-elevated text-brand-muted hover:text-white flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Stake Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-brand-muted uppercase tracking-wider text-[11px]">Select Wager</span>
                  <span className="text-brand-muted font-mono">
                    Balance: <strong className="text-white">${(walletBalance / 100).toFixed(2)}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {WAGER_OPTIONS.map((opt) => {
                    const isSelected = wagerCents === opt.cents;
                    return (
                      <button
                        key={opt.cents}
                        type="button"
                        onClick={() => {
                          telegramHaptic('selection');
                          setWagerCents(opt.cents);
                        }}
                        className={`relative p-2.5 rounded-2xl border text-center transition-all duration-150 flex flex-col items-center justify-center ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/15 shadow-sm'
                            : 'border-brand-border bg-brand-elevated hover:border-brand-border-opacity-30'
                        }`}
                      >
                        {opt.popular && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500 text-black uppercase tracking-wider">
                            Popular
                          </span>
                        )}
                        <span className={`text-base font-bold font-mono ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-brand-muted font-mono mt-0.5">
                          {opt.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Control Selector */}
              <div className="space-y-2">
                <span className="font-semibold text-brand-muted uppercase tracking-wider text-[11px] block">Time Control</span>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_OPTIONS.map((tOpt) => {
                    const isSelected = timeControl === tOpt.seconds;
                    const IconComp = tOpt.icon;
                    return (
                      <button
                        key={tOpt.seconds}
                        type="button"
                        onClick={() => {
                          telegramHaptic('selection');
                          setTimeControl(tOpt.seconds);
                        }}
                        className={`p-2.5 rounded-2xl border transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/15'
                            : 'border-brand-border bg-brand-elevated hover:border-brand-border-opacity-30'
                        }`}
                      >
                        <IconComp className={isSelected ? 'text-emerald-400' : 'text-brand-muted'} size={15} />
                        <span className={`text-xs font-bold ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                          {tOpt.label}
                        </span>
                        <span className="text-[10px] text-brand-muted">
                          {tOpt.type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Insufficient Balance Top-Up Warning */}
              {hasInsufficientBalance && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-rose-400">Insufficient Balance</p>
                    <p className="text-[11px] text-brand-muted truncate">
                      Need ${(wagerCents / 100).toFixed(2)} USDT to enter this match
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { telegramHaptic('selection'); setShowDeposit(true); }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors"
                  >
                    <FaWallet size={12} />
                    Top Up
                  </button>
                </div>
              )}

              {/* Match Highlights / Mystery Box Note */}
              <div className="p-3 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-between text-xs font-mono">
                {wagerCents > 0 ? (
                  <>
                    <span className="text-brand-muted">Winner Takes (95%):</span>
                    <span className="font-bold text-emerald-400">+${((wagerCents * 2 * 0.95) / 100).toFixed(2)} USDT</span>
                  </>
                ) : (
                  <>
                    <span className="text-brand-muted flex items-center gap-1.5">
                      <FaTrophy className="text-amber-400" size={13} />
                      Mystery Box Qualifier
                    </span>
                    <span className="text-amber-400 font-bold">1,000 TON Drop Pool</span>
                  </>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleStartSearch}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-black font-bold text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FaChessKnight size={18} />
                {hasInsufficientBalance ? 'Top Up Balance to Play' : 'Find Opponent Now'}
              </button>
            </div>
          )}

          {/* STEP 2: SEARCHING / RADAR VIBING ANIMATION (5-7s) */}
          {step === 'searching' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-6 relative z-10">
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Searching for Opponents
              </span>

              {/* Glowing High-Tech Radar */}
              <div className="relative size-36 flex items-center justify-center">
                {/* Sonar pulses */}
                <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping opacity-40" />
                <div className="absolute -inset-4 rounded-full border border-emerald-500/10 animate-pulse" />
                
                {/* Conic Radar Sweep */}
                <div className="relative size-32 rounded-full border border-emerald-500/40 bg-brand-void overflow-hidden flex items-center justify-center shadow-inner">
                  <div className="absolute inset-0 bg-conic-radar animate-radar-sweep pointer-events-none opacity-80" />
                  <div className="absolute size-20 rounded-full border border-emerald-500/20" />
                  <div className="absolute size-10 rounded-full border border-emerald-500/30" />
                  
                  {/* Center Node */}
                  <div className="relative z-10 size-11 rounded-full bg-brand-surface border-2 border-emerald-400 flex items-center justify-center shadow-lg">
                    <FaChessKnight className="text-emerald-400 text-lg animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Timer & Rotating Status */}
              <div className="space-y-1.5 min-h-[56px]">
                <div className="text-3xl font-extrabold font-mono text-white tracking-wider">
                  0:0{searchTimer}
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={searchTipIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-brand-muted font-medium"
                  >
                    {SEARCH_TIPS[searchTipIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Match Stake summary */}
              <div className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono text-brand-muted flex items-center justify-between">
                <span>{wagerCents > 0 ? `$${(wagerCents / 100).toFixed(2)} USDT Match` : 'Free Qualifying Match'}</span>
                <span className="text-emerald-400 font-semibold">{timeControl / 60}m Clock</span>
              </div>

              <button
                type="button"
                onClick={handleCancelSearch}
                className="w-full py-3 rounded-xl border border-brand-border bg-brand-elevated text-brand-muted hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel Search
              </button>
            </div>
          )}

          {/* STEP 3: MATCH FOUND! (1.6s CELEBRATION) */}
          {step === 'matched' && matchedOpponent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4 flex flex-col items-center text-center space-y-5 relative z-10"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-bold tracking-wider uppercase font-mono shadow-md animate-bounce">
                <FaCheckCircle size={14} />
                Opponent Found!
              </div>

              {/* VS Faceoff Card */}
              <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4 rounded-2xl bg-brand-surface border border-emerald-500/30 shadow-xl">
                {/* You */}
                <div className="flex flex-col items-center">
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center font-bold text-white text-lg shadow-sm">
                    {stats?.first_name ? stats.first_name.slice(0, 2).toUpperCase() : 'YOU'}
                  </div>
                  <span className="text-xs font-bold text-white mt-1.5 truncate max-w-[90px]">
                    {stats?.first_name || 'You'}
                  </span>
                  <span className="text-[10px] font-mono text-brand-muted">
                    ELO {stats?.elo || 1200}
                  </span>
                </div>

                {/* VS Emblem */}
                <div className="flex flex-col items-center">
                  <span className="size-8 rounded-full bg-brand-elevated border border-brand-border flex items-center justify-center text-xs font-black text-amber-400 font-mono shadow-xs">
                    VS
                  </span>
                </div>

                {/* Opponent */}
                <div className="flex flex-col items-center">
                  <div className={`size-14 rounded-2xl bg-gradient-to-br ${matchedOpponent.gradient} border border-white/10 flex items-center justify-center font-bold text-white text-lg shadow-sm relative`}>
                    {matchedOpponent.initials}
                    <span className="absolute -bottom-1 -right-1 text-sm drop-shadow-md">
                      {matchedOpponent.flag}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white mt-1.5 truncate max-w-[90px]">
                    {matchedOpponent.name}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    ELO {matchedOpponent.elo}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 animate-pulse">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                Launching Grandmaster Arena…
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Embedded Deposit Dialog */}
      {showDeposit && (
        <DepositDialog
          onClose={() => {
            setShowDeposit(false);
            void syncBalance();
          }}
          onSuccess={() => {
            setShowDeposit(false);
            void syncBalance();
            telegramHaptic('heavy');
          }}
          chosenWager={wagerCents}
          walletBalance={walletBalance}
        />
      )}
    </>
  );
}
