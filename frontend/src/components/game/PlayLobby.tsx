import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChessKnight, FaWallet, FaRobot, FaShareAlt, FaFire, FaClock } from 'react-icons/fa';

import LayoutWrapper from '@/components/LayoutWrapper';
import WalletConnect from '@/components/WalletConnect';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { telegramHaptic } from '@/lib/telegram';

import WagerSelector from './WagerSelector';
import TimeControlSelector from './TimeControlSelector';
import FriendInviteDrawer from './FriendInviteDrawer';
import LobbyDepositDrawer from './LobbyDepositDrawer';
import RakeInfoDrawer from './RakeInfoDrawer';
import { useUser } from '@/context/UserContext';

export default function PlayLobby() {
  const t = useTranslations('Index');
  const tg = useTranslations('Game');
  const locale = useLocale();
  const router = useRouter();

  const [tgUser, setTgUser] = useState<any>(null);
  const { walletBalance, syncBalance } = useUser();

  // Matchmaking configs
  const [selectedWager, setSelectedWager] = useState<number>(500); // in cents (default $5)
  const [customWagerInput, setCustomWagerInput] = useState<string>("5.00");
  const [isCustomWager, setIsCustomWager] = useState<boolean>(false);
  const [matchmakingState, setMatchmakingState] = useState<'idle' | 'searching'>('idle');
  const [searchTimer, setSearchTimer] = useState<number>(0);
  const [matchmakingError, setMatchmakingError] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [showRakeInfo, setShowRakeInfo] = useState<boolean>(false);

  // Time control and Friend invite configs
  const [timeControl, setTimeControl] = useState<number>(600); // 10 minutes default
  const [inviteLink, setInviteLink] = useState<string>("");
  const [showInviteDrawer, setShowInviteDrawer] = useState<boolean>(false);

  // Quick Top-up states
  const [showDepositDrawer, setShowDepositDrawer] = useState<boolean>(false);

  // Refs for scroll container alignment
  const wagerScrollRef = useRef<HTMLDivElement>(null);
  const timeScrollRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef<boolean>(false);

  const scrollToWager = () => {
    telegramHaptic('light');
    if (wagerScrollRef.current) {
      const activeEl = wagerScrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      } else {
        wagerScrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const scrollToTimeControl = () => {
    telegramHaptic('light');
    if (timeScrollRef.current) {
      const activeEl = timeScrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      } else {
        timeScrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Get Telegram WebApp user object on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tgApp = window.Telegram.WebApp;
      if (tgApp.initDataUnsafe?.user) {
        setTgUser(tgApp.initDataUnsafe.user);
      }
    }
  }, []);

  // Center default items instantly on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (wagerScrollRef.current) {
        const activeEl = wagerScrollRef.current.querySelector('[data-active="true"]');
        if (activeEl) {
          activeEl.scrollIntoView({
            block: 'nearest',
            inline: 'center'
          });
        }
      }
      if (timeScrollRef.current) {
        const activeEl = timeScrollRef.current.querySelector('[data-active="true"]');
        if (activeEl) {
          activeEl.scrollIntoView({
            block: 'nearest',
            inline: 'center'
          });
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Visual Header Stats states (Players Online & Active Users)
  const [playersOnline, setPlayersOnline] = useState<number>(782);
  const [activeUsers, setActiveUsers] = useState<number>(3768);

  useEffect(() => {
    const calcPlayersOnline = () => {
      const now = Date.now();
      const fiveMinutesMs = 5 * 60 * 1000;
      const intervalIndex = Math.floor(now / fiveMinutesMs);
      const seed = intervalIndex * 98765;
      const rand = (seed % 101) / 100;
      return Math.floor(rand * (845 - 761 + 1)) + 761;
    };

    const calcActiveUsers = () => {
      const startEpoch = new Date("2026-06-01T00:00:00Z").getTime();
      const now = Date.now();
      const elapsedMs = Math.max(0, now - startEpoch);
      const sixHoursMs = 6 * 60 * 60 * 1000;
      const intervals = Math.floor(elapsedMs / sixHoursMs);
      
      let totalIncrement = 0;
      for (let i = 0; i < intervals; i++) {
        const seed = (i + 7) * 12345;
        const rand = (seed % 103) / 102;
        const increment = Math.floor(rand * (315 - 213 + 1)) + 213;
        totalIncrement += increment;
      }
      return 3768 + totalIncrement;
    };

    setPlayersOnline(calcPlayersOnline());
    setActiveUsers(calcActiveUsers());

    const interval = setInterval(() => {
      setPlayersOnline(calcPlayersOnline());
      setActiveUsers(calcActiveUsers());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Refresh balance in background on mount
  useEffect(() => {
    syncBalance();
  }, [syncBalance]);

  const startMatchmaking = useCallback(() => {
    if (submittingRef.current) return;
    setMatchmakingError("");
    const socket = getSocket();
    const wagerInCents = isCustomWager
      ? Math.round(parseFloat(customWagerInput) * 100)
      : selectedWager;

    if (isNaN(wagerInCents) || wagerInCents < 0) {
      setMatchmakingError("Please specify a valid wager amount.");
      return;
    }

    if (wagerInCents > walletBalance) {
      setMatchmakingError("Insufficient balance in your Cyber-Wallet.");
      return;
    }

    submittingRef.current = true;
    setMatchmakingState('searching');
    socket.emit('join_matchmaking', { 
      bid_amount: wagerInCents,
      time_control: timeControl 
    });
  }, [isCustomWager, customWagerInput, selectedWager, walletBalance, timeControl]);

  // Active Webhook/Balance Polling to detect deposit and start matchmaking automatically
  useEffect(() => {
    if (!showDepositDrawer) return;

    const wagerInCents = isCustomWager
      ? Math.round(parseFloat(customWagerInput) * 100)
      : selectedWager;

    if (walletBalance >= wagerInCents) {
      setShowDepositDrawer(false);

      const timer = setTimeout(() => {
        startMatchmaking();
      }, 500);
      return () => clearTimeout(timer);
    }

    const pollInterval = setInterval(() => {
      syncBalance();
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [walletBalance, showDepositDrawer, selectedWager, isCustomWager, customWagerInput, startMatchmaking, syncBalance]);

  // Matchmaking Timer
  useEffect(() => {
    let interval: any;
    if (matchmakingState === 'searching') {
      interval = setInterval(() => {
        setSearchTimer(prev => prev + 1);
      }, 1000);
    } else {
      setSearchTimer(0);
    }
    return () => clearInterval(interval);
  }, [matchmakingState]);

  // Socket.IO Listeners for Matchmaking Online
  useEffect(() => {
    const socket = getSocket();

    const onMatchFound = (data: any) => {
      console.log("Match matched!", data);
      setMatchmakingState('idle');
      router.push(`/${locale}/game?id=${data.game_id}`);
    };

    const onMatchmakingError = (data: any) => {
      console.error("Matchmaking error:", data.message);
      setMatchmakingError(data.message);
      setMatchmakingState('idle');
      submittingRef.current = false;
    };

    socket.on('match_found', onMatchFound);
    socket.on('matchmaking_error', onMatchmakingError);

    return () => {
      socket.off('match_found', onMatchFound);
      socket.off('matchmaking_error', onMatchmakingError);
    };
  }, [locale, router]);

  const handleLauncherClick = () => {
    if (isCreating || matchmakingState === 'searching' || submittingRef.current) return;

    const wagerInCents = isCustomWager
      ? Math.round(parseFloat(customWagerInput) * 100)
      : selectedWager;

    if (isNaN(wagerInCents) || wagerInCents < 0) {
      setMatchmakingError("Please specify a valid wager amount.");
      return;
    }

    if (walletBalance >= wagerInCents) {
      startMatchmaking();
    } else {
      setShowDepositDrawer(true);
    }
  };

  const cancelMatchmaking = () => {
    const socket = getSocket();
    socket.emit('leave_matchmaking', {});
    setMatchmakingState('idle');
    submittingRef.current = false;
  };

  const playVsComputer = async () => {
    if (isCreating || submittingRef.current) return;
    submittingRef.current = true;
    setIsCreating(true);
    try {
      const res = await apiFetch(`/api/v1/game/create?type=computer&time_control=${timeControl}`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      router.push(`/${locale}/game?id=${data.game_id}`);
    } catch (e) {
      console.error("Failed to create computer game", e);
      setMatchmakingError("Failed to initiate training session.");
    } finally {
      setIsCreating(false);
      submittingRef.current = false;
    }
  };

  const playVsFriend = async () => {
    if (isCreating || submittingRef.current) return;
    submittingRef.current = true;
    setIsCreating(true);
    setMatchmakingError("");
    try {
      const res = await apiFetch(`/api/v1/game/create?type=online&time_control=${timeControl}`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      setInviteLink(data.invite_link);
      setShowInviteDrawer(true);
    } catch (e) {
      console.error("Failed to create friend game", e);
      setMatchmakingError("Failed to generate invite link.");
    } finally {
      setIsCreating(false);
      submittingRef.current = false;
    }
  };

  const chosenWager = isCustomWager 
    ? Math.round(parseFloat(customWagerInput) * 100) 
    : selectedWager;
  
  const hasSufficient = walletBalance >= chosenWager;

  return (
    <LayoutWrapper className="justify-start pt-4 pb-20">
      <div className="w-full max-w-sm flex flex-col items-center px-4 mx-auto space-y-4">
        
        {/* Visual Header */}
        <div className="flex flex-col items-center w-full mt-2 space-y-1">
          <div className="flex items-center gap-2 text-brand-primary text-2xl font-black tracking-tighter select-none">
            <FaChessKnight className="text-xl opacity-80" />
            <span>{tg('battle_arena')}</span>
          </div>
          
          {/* Sleek 2026-style Metadata Stats */}
          <div className="flex items-center gap-3 text-[8px] font-bold tracking-[0.25em] text-brand-primary/40 uppercase select-none">
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
              <span className="text-emerald-400">{playersOnline} {tg('online')}</span>
            </div>
            <span className="opacity-30">|</span>
            <span>{activeUsers.toLocaleString()} {tg('active_users')}</span>
          </div>
        </div>

        {/* Cyber Radar Search Interface */}
        {matchmakingState === 'searching' ? (
          <div className="w-full glass-panel p-6 rounded-3xl border border-brand-border-opacity-10 bg-brand-surface flex flex-col items-center justify-center space-y-6 text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-bg-opacity-5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
            
            {/* Conic sonar radar widget */}
            <div className="relative w-40 h-40 flex items-center justify-center rounded-full border border-brand-border-opacity-10 overflow-hidden bg-brand-void shadow-inner-glow">
              <div className="absolute inset-0 bg-conic-radar animate-spin pointer-events-none" />
              <div className="absolute w-32 h-32 rounded-full border border-brand-border-opacity-10 animate-ping opacity-60" />
              <div className="absolute w-24 h-24 rounded-full border border-brand-border-opacity-5" />
              <div className="absolute w-12 h-12 rounded-full border border-brand-border-opacity-20 animate-pulse bg-brand-bg-opacity-5" />

              <div className="z-10 w-12 h-12 rounded-full bg-brand-surface border-2 border-brand-primary flex items-center justify-center shadow-premium">
                <FaChessKnight className="text-lg text-brand-primary animate-bounce" />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">{tg('searching_matchmaker')}</span>
              <span className="text-xs font-black text-brand-primary tracking-wide uppercase">{tg('searching_opponent')}</span>
              <span className="text-2xl font-black text-brand-primary opacity-80 tracking-tighter">
                {Math.floor(searchTimer / 60)}:{(searchTimer % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="w-full p-3.5 rounded-xl border border-brand-border-opacity-15 bg-brand-void text-center shadow-sm">
              <span className="text-[8px] font-bold text-brand-primary opacity-40 uppercase tracking-widest block mb-0.5">{tg('wager_tier')}</span>
              <span className="text-sm font-black text-brand-primary">
                ${(chosenWager / 100).toFixed(2)} USDT
              </span>
            </div>

            <button
              onClick={cancelMatchmaking}
              className="w-full py-3 rounded-xl border border-brand-rose-opacity-20 bg-brand-rose-opacity-10 hover:bg-brand-rose-opacity-20 text-rose-400 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              {tg('disconnect_search')}
            </button>
          </div>
        ) : (
          /* Config / Lobby View */
          <div className="w-full space-y-3">

            {/* ─── UNIFIED STATUS BAR ─── */}
            <div className="w-full glass-panel rounded-2xl border border-brand-border-opacity-10 bg-brand-surface shadow-sm px-3 py-2.5 grid grid-cols-2 items-center divide-x divide-brand-border-opacity-10 gap-3">
              {/* Wallet side */}
              <div className="pr-3 flex items-center justify-between min-w-0">
                <WalletConnect minimal onTopUp={() => setShowDepositDrawer(true)} />
              </div>
              {/* Balance side */}
              <div className="pl-3 min-w-0">
                <Link href={`/${locale}/wallet`} className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-xl bg-brand-bg-opacity-5 border border-brand-border-opacity-10 flex items-center justify-center shrink-0 group-hover:border-brand-border-opacity-20 transition-all">
                    <FaWallet size={11} className="text-brand-primary opacity-50 group-hover:opacity-80 transition-all" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[7.5px] font-black uppercase tracking-widest text-brand-primary opacity-45 leading-none mb-1">{tg('cyber_balance')}</span>
                    <span className={`text-[11px] font-black tracking-wide leading-none truncate ${hasSufficient && chosenWager > 0 ? 'text-emerald-400' : 'text-brand-primary'}`}>
                      ${(walletBalance / 100).toFixed(2)}
                    </span>
                  </div>
                </Link>
              </div>
            </div>

            {/* ─── BATTLE ARENA CONFIG CARD ─── */}
            <div className="glass-panel rounded-3xl border border-brand-border-opacity-10 bg-brand-surface shadow-premium overflow-hidden">
              
              {/* Wager Selection Carousel */}
              <WagerSelector
                selectedWager={selectedWager}
                setSelectedWager={setSelectedWager}
                customWagerInput={customWagerInput}
                setCustomWagerInput={setCustomWagerInput}
                isCustomWager={isCustomWager}
                setIsCustomWager={setIsCustomWager}
                wagerScrollRef={wagerScrollRef}
                tg={tg}
              />

              {/* Time Control Selection Carousel */}
              <TimeControlSelector
                timeControl={timeControl}
                setTimeControl={setTimeControl}
                timeScrollRef={timeScrollRef}
                tg={tg}
              />

              {/* Summary Row */}
              {chosenWager > 0 && (
                <div
                  className="mx-3 mb-3 rounded-2xl overflow-hidden animate-fade-in"
                >
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-brand-void/60 border border-brand-border-opacity-10 rounded-2xl shadow-inner-glow">
                    <button
                      onClick={scrollToWager}
                      className="flex flex-col items-start cursor-pointer bg-transparent border-0 p-0 text-left hover:opacity-80 active:scale-95 transition-all duration-150"
                    >
                      <span className="text-[7.5px] font-black text-brand-primary/40 uppercase tracking-widest mb-0.5 flex items-center gap-0.5">
                        <FaWallet className="text-brand-primary/45 text-[7px]" /> {tg('stake')}
                      </span>
                      <span className="text-[11px] font-black text-brand-primary">${(chosenWager / 100).toFixed(2)} USDT</span>
                    </button>
                    
                    <div className="w-px h-7 bg-brand-border-opacity-10 self-center" />
                    
                    <button
                      onClick={() => {
                        telegramHaptic('light');
                        setShowRakeInfo(true);
                      }}
                      className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer hover:bg-emerald-500/20 active:scale-95 transition-all duration-150"
                    >
                      <span className="text-[7.5px] font-black text-emerald-400 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                        <FaFire className="text-emerald-400 text-[8px] animate-pulse" /> {tg('win_up_to')}
                      </span>
                      <span className="text-[12px] font-black text-emerald-400 tracking-tight leading-none">
                        ${((chosenWager * 2 * 0.97) / 100).toFixed(2)}
                      </span>
                    </button>
                    
                    <div className="w-px h-7 bg-brand-border-opacity-10 self-center" />
                    
                    <button
                      onClick={scrollToTimeControl}
                      className="flex flex-col items-end cursor-pointer bg-transparent border-0 p-0 text-right hover:opacity-80 active:scale-95 transition-all duration-150"
                    >
                      <span className="text-[7.5px] font-black text-brand-primary/40 uppercase tracking-widest mb-0.5 flex items-center gap-0.5">
                        <FaClock className="text-brand-primary/45 text-[7px]" /> {tg('time')}
                      </span>
                      <span className="text-[11px] font-black text-amber-400 uppercase">
                        {timeControl >= 60 ? `${timeControl / 60} MIN` : `${timeControl}s`}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Launcher Button */}
              <div className="px-3 pb-3">
                <motion.button
                  whileHover={!isCreating ? { scale: 1.015 } : {}}
                  whileTap={!isCreating ? { scale: 0.985 } : {}}
                  onClick={handleLauncherClick}
                  disabled={isCreating}
                  className={`w-full py-4 rounded-2xl flex flex-col items-center justify-center gap-0.5 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer relative overflow-hidden transition-all duration-200 ${
                    hasSufficient && !isCreating
                      ? 'bg-brand-primary text-brand-void shadow-neon'
                      : 'bg-brand-surface border border-brand-border-opacity-10 text-brand-primary/80 hover:border-brand-primary/30'
                  } ${
                    chosenWager === 100000 && hasSufficient ? 'shadow-[0_0_25px_rgba(234,179,8,0.4)] ring-2 ring-yellow-400/30' : ''
                  }`}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] -translate-x-full animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                  <div className="flex items-center gap-2">
                    <FaChessKnight size={13} className="text-current" />
                    <span className="text-[11px] font-black tracking-[0.2em] text-current uppercase">
                      {hasSufficient ? t('execute_matchmaking') : tg('top_up_play')}
                    </span>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Matchmaking Error */}
            {matchmakingError && (
              <div className="p-3 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-2xl text-rose-400 text-[10px] font-black uppercase tracking-wider text-center shadow-sm">
                {matchmakingError}
              </div>
            )}

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={playVsComputer}
                disabled={isCreating}
                className="w-full py-3 glass-panel rounded-2xl border border-brand-border-opacity-10 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:border-brand-border-opacity-20 transition-all"
              >
                <FaRobot className="text-brand-primary opacity-50" size={12} />
                <span>{tg('train_ai')}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={playVsFriend}
                disabled={isCreating}
                className="w-full py-3 glass-panel rounded-2xl border border-brand-border-opacity-10 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:border-brand-border-opacity-20 transition-all"
              >
                <FaShareAlt className="text-brand-primary opacity-50" size={12} />
                <span>{tg('play_friend')}</span>
              </motion.button>
            </div>

          </div>
        )}

        {/* Friend Duel Invite Bottom Drawer */}
        <AnimatePresence>
          {showInviteDrawer && (
            <FriendInviteDrawer
              inviteLink={inviteLink}
              timeControl={timeControl}
              onClose={() => setShowInviteDrawer(false)}
            />
          )}
        </AnimatePresence>

        {/* Lobby Quick Deposit Drawer */}
        <AnimatePresence>
          {showDepositDrawer && (
            <LobbyDepositDrawer
              chosenWager={chosenWager}
              walletBalance={walletBalance}
              tgUser={tgUser}
              onClose={() => setShowDepositDrawer(false)}
              syncBalance={async () => { await syncBalance(); }}
              onDepositSuccess={(newBalance) => { syncBalance(); }}
            />
          )}
        </AnimatePresence>

        {/* Rake Info Bottom Drawer */}
        <AnimatePresence>
          {showRakeInfo && (
            <RakeInfoDrawer onClose={() => setShowRakeInfo(false)} />
          )}
        </AnimatePresence>

      </div>
    </LayoutWrapper>
  );
}
