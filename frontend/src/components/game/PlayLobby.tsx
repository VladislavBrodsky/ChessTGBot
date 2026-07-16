import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaChessKnight, FaWallet, FaRobot, FaShareAlt, FaFire, FaClock, FaChessPawn, FaTrophy, FaFlag, FaHandshake } from 'react-icons/fa';

import LayoutWrapper from '@/components/LayoutWrapper';
import WalletConnect from '@/components/WalletConnect';
import { apiFetch, getFullPhotoUrl } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { telegramHaptic, telegramAlert } from '@/lib/telegram';
import { copyToClipboard } from '@/lib/clipboard';
import { logTelemetryEvent } from '@/lib/telemetry';

import WagerSelector from './WagerSelector';
import TimeControlSelector from './TimeControlSelector';
import ArenaBanner from './ArenaBanner';

import DepositModal from '../Wallet/DepositModal';
import RakeInfoDrawer from './RakeInfoDrawer';
import AiDifficultyDrawer from './AiDifficultyDrawer';
import { useUser } from '@/context/UserContext';
import { useAudio } from '@/hooks/useAudio';

export default function PlayLobby() {
  const t = useTranslations('Index');
  const tg = useTranslations('Game');
  const tw = useTranslations('Wallet');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [tgUser, setTgUser] = useState<any>(null);
  const { stats, walletBalance, syncBalance, balanceError } = useUser();
  const { play: playAudio } = useAudio();

  // Matchmaking configs
  const [selectedWager, setSelectedWager] = useState<number>(500); // in cents (default $5)
  const [customWagerInput, setCustomWagerInput] = useState<string>("5.00");
  const [isCustomWager, setIsCustomWager] = useState<boolean>(false);
  const [matchmakingState, setMatchmakingState] = useState<'idle' | 'searching' | 'matched'>('idle');
  const [matchFoundData, setMatchFoundData] = useState<any>(null);
  const [searchTimer, setSearchTimer] = useState<number>(0);
  const [matchmakingError, setMatchmakingError] = useState<string>("");
  const [notifySearchEnabled, setNotifySearchEnabled] = useState(false);
  const [notifyRequestPending, setNotifyRequestPending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showRakeInfo, setShowRakeInfo] = useState<boolean>(false);

  // Time control
  const [timeControl, setTimeControl] = useState<number>(600); // 10 minutes default

  // Quick Top-up states
  const [showDepositDrawer, setShowDepositDrawer] = useState<boolean>(false);
  const [showAiDifficultyDrawer, setShowAiDifficultyDrawer] = useState<boolean>(false);

  // Refs for scroll container alignment
  const wagerScrollRef = useRef<HTMLDivElement>(null);
  const timeScrollRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef<boolean>(false);
  const aiFallbackOfferedRef = useRef<boolean>(false);
  const keepSearchingOnExitRef = useRef<boolean>(false);

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
    if (typeof window !== 'undefined') {
      if (window.Telegram?.WebApp) {
        const tgApp = window.Telegram.WebApp;
        if (tgApp.initDataUnsafe?.user) {
          setTgUser(tgApp.initDataUnsafe.user);
        }
      }
      
      const params = new URLSearchParams(window.location.search);
      if (params.get('status') === 'success' && params.get('session_id')) {
        setShowDepositDrawer(true);
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
  const [contendersCount, setContendersCount] = useState<number>(5);

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

  const getOpponentName = (name: string) => {
    if (name === "A.I. Coach") {
      return tg('ai_coach');
    }
    return name;
  };

  const handleShareResult = (game: any) => {
    const resultText = game.result === 'win' ? t('secured_victory') : game.result === 'loss' ? t('fought_battle') : t('reached_stalemate');
    const eloText = game.elo_change > 0 ? `+${game.elo_change}` : `${game.elo_change}`;
    const botUsername = stats?.bot_username || "FinChess_bot";
    const message = `${resultText} ${t('against')} ${getOpponentName(game.opponent.name)}! 📈 ${t('global_ranking')}: ${eloText} ELO. \n\n${t('join_matrix')}: https://t.me/${botUsername}?start=${stats?.referral_code || ''}`;

    let success = false;
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tgApp = (window as any).Telegram.WebApp;
      try {
        tgApp.switchInlineQuery(message, ["users", "groups", "channels"]);
        success = true;
        telegramHaptic('medium');
      } catch (err) {
        console.warn("Telegram switchInlineQuery failed", err);
      }
    }
    if (!success) {
      copyToClipboard(message).then((ok) => {
        if (ok) telegramAlert("Share link copied to clipboard!");
      });
    }
  };

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
      logTelemetryEvent('wager_insufficient_balance', {
        source: 'matchmaking_guard',
        selected_wager_cents: wagerInCents,
        wallet_balance_cents: walletBalance,
        shortfall_cents: wagerInCents - walletBalance,
        time_control: timeControl,
        custom_wager: isCustomWager,
      });
      setMatchmakingError("Insufficient balance in your Cyber-Wallet.");
      return;
    }

    submittingRef.current = true;
    keepSearchingOnExitRef.current = false;
    setNotifySearchEnabled(false);
    setNotifyRequestPending(false);
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
        setContendersCount(prev => {
          const delta = Math.random() > 0.5 ? 1 : -1;
          const next = prev + delta;
          return next >= 4 && next <= 9 ? next : (next < 4 ? 4 : 9);
        });
      }, 1000);
    } else {
      setSearchTimer(0);
      setContendersCount(5);
      aiFallbackOfferedRef.current = false;
    }
    return () => clearInterval(interval);
  }, [matchmakingState]);

  useEffect(() => {
    if (
      matchmakingState === 'searching' &&
      searchTimer >= 15 &&
      !aiFallbackOfferedRef.current
    ) {
      const wagerInCents = isCustomWager
        ? Math.round(parseFloat(customWagerInput) * 100)
        : selectedWager;
      aiFallbackOfferedRef.current = true;
      logTelemetryEvent('queue_ai_fallback_offered', {
        bid_amount: wagerInCents,
        time_control: timeControl,
        duration_waited: searchTimer,
      });
    }
  }, [matchmakingState, searchTimer, isCustomWager, customWagerInput, selectedWager, timeControl]);

  // Manage Telegram WebApp BackButton visibility during active search
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.BackButton) {
      const tg = window.Telegram.WebApp;
      if (matchmakingState === 'searching') {
        tg.BackButton.hide();
      } else {
        const isHomePage = pathname === '/' || pathname.endsWith('/home') || pathname === `/${locale}`;
        if (!isHomePage) {
          tg.BackButton.show();
        }
      }
    }
  }, [matchmakingState, pathname, locale]);

  // Auto-cleanup matchmaking queue if component unmounts while searching
  const matchmakingStateRef = useRef(matchmakingState);
  useEffect(() => {
    matchmakingStateRef.current = matchmakingState;
  }, [matchmakingState]);

  useEffect(() => {
    return () => {
      if (
        matchmakingStateRef.current === 'searching' &&
        !keepSearchingOnExitRef.current
      ) {
        const socket = getSocket();
        socket.emit('leave_matchmaking', {});
        console.log("Automatically left matchmaking queue on component unmount.");
      }
    };
  }, []);

  // Socket.IO Listeners for Matchmaking Online
  useEffect(() => {
    const socket = getSocket();

    const onMatchFound = (data: any) => {
      console.log("Match matched!", data);
      keepSearchingOnExitRef.current = false;
      setNotifySearchEnabled(false);
      setNotifyRequestPending(false);
      setMatchFoundData(data);
      setMatchmakingState('matched');
      playAudio('start');
      telegramHaptic('heavy');
      
      setTimeout(() => {
        setMatchmakingState('idle');
        router.push(`/${locale}/game?id=${data.game_id}`);
      }, 2500);
    };

    const onMatchmakingError = (data: any) => {
      console.error("Matchmaking error:", data.message);
      setMatchmakingError(data.message);
      keepSearchingOnExitRef.current = false;
      setNotifySearchEnabled(false);
      setNotifyRequestPending(false);
      setMatchmakingState('idle');
      submittingRef.current = false;
    };

    const onMatchmakingStatus = (data: any) => {
      console.log("Matchmaking status update:", data);
      if (data.status === 'searching') {
        const restoredWager = Number(data.bid_amount ?? 0);
        setSelectedWager(restoredWager);
        setIsCustomWager(false);
        if (data.time_control) {
          setTimeControl(Number(data.time_control));
        }
        setSearchTimer(Math.max(0, Math.floor(Number(data.duration_waited ?? 0))));
        const notificationsEnabled = Boolean(data.notify_when_matched);
        keepSearchingOnExitRef.current = notificationsEnabled;
        setNotifySearchEnabled(notificationsEnabled);
        setNotifyRequestPending(false);
        setMatchmakingState('searching');
        submittingRef.current = true;
      } else if (data.status === 'idle') {
        keepSearchingOnExitRef.current = false;
        setNotifySearchEnabled(false);
        setNotifyRequestPending(false);
        setMatchmakingState('idle');
        submittingRef.current = false;
        if (data.message) {
          setMatchmakingError(data.message);
        }
      }
    };

    const onNotificationStatus = (data: any) => {
      setNotifyRequestPending(false);
      if (data.enabled) {
        keepSearchingOnExitRef.current = true;
        setNotifySearchEnabled(true);
        telegramHaptic('success');
      } else {
        keepSearchingOnExitRef.current = false;
        setNotifySearchEnabled(false);
        if (data.error) {
          setMatchmakingError(data.error);
        }
      }
    };

    const restoreMatchmaking = () => {
      socket.emit('check_matchmaking', {});
    };

    socket.on('match_found', onMatchFound);
    socket.on('matchmaking_error', onMatchmakingError);
    socket.on('matchmaking_status', onMatchmakingStatus);
    socket.on('matchmaking_notifications_status', onNotificationStatus);
    socket.on('connect', restoreMatchmaking);
    if (socket.connected) {
      restoreMatchmaking();
    }

    return () => {
      socket.off('match_found', onMatchFound);
      socket.off('matchmaking_error', onMatchmakingError);
      socket.off('matchmaking_status', onMatchmakingStatus);
      socket.off('matchmaking_notifications_status', onNotificationStatus);
      socket.off('connect', restoreMatchmaking);
    };
  }, [locale, router, playAudio]);

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
      logTelemetryEvent('wager_insufficient_balance', {
        source: 'matchmaking_launcher',
        selected_wager_cents: wagerInCents,
        wallet_balance_cents: walletBalance,
        shortfall_cents: wagerInCents - walletBalance,
        time_control: timeControl,
        custom_wager: isCustomWager,
      });
      setShowDepositDrawer(true);
    }
  };

  const cancelMatchmaking = () => {
    keepSearchingOnExitRef.current = false;
    setNotifySearchEnabled(false);
    setNotifyRequestPending(false);
    const socket = getSocket();
    socket.emit('leave_matchmaking', {});
    setMatchmakingState('idle');
    submittingRef.current = false;
  };

  const switchSearchToAi = () => {
    const wagerInCents = isCustomWager
      ? Math.round(parseFloat(customWagerInput) * 100)
      : selectedWager;
    logTelemetryEvent('queue_ai_fallback_accepted', {
      bid_amount: wagerInCents,
      time_control: timeControl,
      duration_waited: searchTimer,
    });
    keepSearchingOnExitRef.current = false;
    setNotifySearchEnabled(false);
    setNotifyRequestPending(false);
    const socket = getSocket();
    socket.emit('leave_matchmaking', {});
    setMatchmakingState('idle');
    submittingRef.current = false;
    telegramHaptic('light');
    setShowAiDifficultyDrawer(true);
  };

  const enableMatchNotifications = () => {
    if (chosenWager !== 0 || notifySearchEnabled || notifyRequestPending) return;
    keepSearchingOnExitRef.current = true;
    setNotifyRequestPending(true);
    setMatchmakingError("");
    getSocket().emit('enable_matchmaking_notifications', {});
  };

  const triggerPlayVsComputer = () => {
    if (isCreating || matchmakingState === 'searching' || submittingRef.current) return;
    telegramHaptic('light');
    setShowAiDifficultyDrawer(true);
  };

  const executePlayVsComputer = async (difficulty: string) => {
    if (isCreating || submittingRef.current) return;
    submittingRef.current = true;
    setIsCreating(true);
    try {
      const res = await apiFetch(`/api/v1/game/create?type=computer&time_control=${timeControl}&difficulty=${difficulty}`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      setShowAiDifficultyDrawer(false);
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
    
    // Check if creator has sufficient balance for chosenWager
    if (walletBalance < chosenWager) {
      logTelemetryEvent('wager_insufficient_balance', {
        source: 'friend_invite',
        selected_wager_cents: chosenWager,
        wallet_balance_cents: walletBalance,
        shortfall_cents: chosenWager - walletBalance,
        time_control: timeControl,
        custom_wager: isCustomWager,
      });
      setShowDepositDrawer(true);
      return;
    }

    submittingRef.current = true;
    setIsCreating(true);
    setMatchmakingError("");
    try {
      const res = await apiFetch(`/api/v1/game/create?type=online&time_control=${timeControl}&wager=${chosenWager}`, {
        method: "POST"
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Backend error");
      }
      const data = await res.json();
      router.push(`/${locale}/game?id=${data.game_id}`);
    } catch (e: any) {
      console.error("Failed to create friend game", e);
      setMatchmakingError(e.message || "Failed to generate invite link.");
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
          <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.25em] text-brand-primary/40 uppercase select-none">
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
              <span className="text-emerald-400">{playersOnline} {tg('online')}</span>
            </div>
            <span className="opacity-30">|</span>
            <span>{activeUsers.toLocaleString()} {tg('active_users')}</span>
          </div>

        </div>

        {/* Daily Arena event banner — schedule, live join, standings */}
        <ArenaBanner />

        {/* Cyber Radar Search Interface */}
        <AnimatePresence mode="wait" initial={false}>
          {matchmakingState === 'matched' ? (
            <motion.div
              key="matched"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-brand-surface to-emerald-950/10 flex flex-col items-center justify-center space-y-6 text-center shadow-[0_8px_48px_rgba(16,185,129,0.25)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-conic-radar opacity-10 pointer-events-none" />
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em] animate-pulse">
                {tg('match_found')}
              </div>
              
              {/* VS Avatars container */}
              <div className="flex items-center justify-center gap-6 w-full py-4">
                {/* Player 1 (Us) */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-brand-primary p-0.5 shadow-premium bg-brand-void flex items-center justify-center">
                    <img
                      src={getFullPhotoUrl(`/api/v1/users/avatar/${tgUser?.id || 0}`)}
                      alt=""
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e: any) => { e.target.src = "/icon.png"; }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-brand-primary truncate max-w-[80px]">
                    {tgUser?.first_name || tg('you_label')}
                  </span>
                  <span className="text-[10px] font-bold text-brand-primary/50">
                    {stats?.elo || 1000} ELO
                  </span>
                </div>

                {/* VS Pulse */}
                <div className="relative flex items-center justify-center w-12 h-12">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="w-10 h-10 rounded-full bg-brand-void border border-emerald-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <span className="text-[11px] font-black text-emerald-400 tracking-tighter">{tg('vs')}</span>
                  </div>
                </div>

                {/* Player 2 (Opponent) */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500 p-0.5 shadow-premium bg-brand-void flex items-center justify-center">
                    <img
                      src={getFullPhotoUrl(`/api/v1/users/avatar/${matchFoundData?.opponent_id || 0}`)}
                      alt=""
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e: any) => { e.target.src = "/icon.png"; }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 truncate max-w-[80px]">
                    {tg('opponent')}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400/50">
                    {stats?.elo ? Math.min(Math.max(stats.elo + (Math.random() > 0.5 ? 20 : -20), 800), 2200) : 1000} ELO
                  </span>
                </div>
              </div>

              {/* Stake & loading */}
              <div className="w-full p-3 rounded-2xl bg-brand-void border border-brand-border-opacity-10 text-center">
                <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest block mb-0.5">{tg('stakes_locked')}</span>
                <span className="text-xs font-black text-emerald-400">
                  ${((matchFoundData?.bid_amount || 0) / 100).toFixed(2)} USDT
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{tg('entering_arena')}</span>
              </div>
            </motion.div>
          ) : matchmakingState === 'searching' ? (
            <motion.div
              key="searching"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full p-6 rounded-3xl border border-brand-primary/20 bg-gradient-to-br from-brand-surface to-brand-bg-opacity-5 flex flex-col items-center justify-center space-y-6 text-center shadow-[0_8px_32px_rgba(var(--brand-primary),0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_12px_rgba(var(--brand-primary),1)]" />
              
              {/* Active Contenders Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/25 bg-purple-500/10 text-purple-400 animate-pulse text-[10px] font-black uppercase tracking-widest relative z-10">
                <span className="w-1 h-1 rounded-full bg-purple-400 animate-ping" />
                <span>{tg('scanning_contenders', { count: contendersCount })}</span>
              </div>

              {/* Conic sonar radar widget */}
              <div className="relative w-40 h-40 flex items-center justify-center rounded-full border border-brand-primary/20 overflow-hidden bg-brand-void shadow-[inset_0_0_20px_rgba(var(--brand-primary),0.2)]">
                <div className="absolute inset-0 bg-conic-radar animate-radar-sweep pointer-events-none" />
                <div className="absolute w-32 h-32 rounded-full border border-brand-primary/30 shadow-[0_0_15px_rgba(var(--brand-primary),0.2)] animate-ping opacity-60" />
                <div className="absolute w-24 h-24 rounded-full border border-brand-primary/20 shadow-[0_0_10px_rgba(var(--brand-primary),0.1)]" />
                <div className="absolute w-12 h-12 rounded-full border border-brand-primary/40 animate-pulse bg-brand-primary/5 shadow-[0_0_8px_rgba(var(--brand-primary),0.3)]" />

                <div className="z-10 w-12 h-12 rounded-full bg-brand-surface border-2 border-brand-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--brand-primary),0.4)]">
                  <FaChessKnight className="text-lg text-brand-primary animate-bounce drop-shadow-[0_0_5px_rgba(var(--brand-primary),0.8)]" />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-black text-brand-primary opacity-40 uppercase tracking-widest">{tg('searching_matchmaker')}</span>
                <span className="text-xs font-black text-brand-primary tracking-wide uppercase">{tg('searching_opponent')}</span>
                <span className="text-2xl font-black text-brand-primary opacity-80 tracking-tighter">
                  {Math.floor(searchTimer / 60)}:{(searchTimer % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] font-extrabold text-brand-primary opacity-30 uppercase tracking-[0.2em] mt-1">
                  {tg('est_wait')}
                </span>
              </div>

              {/* Win Up To Pill (Viral/FOMO) */}
              {chosenWager > 0 && (
                <div className="px-6 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse shrink-0">
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.15em] mb-1 flex items-center gap-1">
                    <FaFire className="text-emerald-500 text-[10px]" /> {tg('win_up_to')}
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                    ${((chosenWager * 2 * 0.95) / 100).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="w-full p-3.5 rounded-xl border border-brand-border-opacity-15 bg-brand-void text-center shadow-sm">
                <span className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-widest block mb-0.5">{tg('wager_tier')}</span>
                <span className="text-sm font-black text-brand-primary">
                  ${(chosenWager / 100).toFixed(2)} USDT
                </span>
              </div>

              {searchTimer >= 15 && (
                <button
                  onClick={switchSearchToAi}
                  className="w-full py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  <span className="flex items-center justify-center gap-2">
                    <FaRobot />
                    {tg('train_ai')}
                  </span>
                </button>
              )}

              {searchTimer >= 15 && chosenWager === 0 && (
                notifySearchEnabled ? (
                  <div className="w-full p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-500">
                    <span className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest">
                      <FaBell />
                      Telegram alert enabled
                    </span>
                    <span className="block mt-1 text-[10px] font-bold opacity-70">
                      We will keep searching for up to 30 minutes. You can leave this screen.
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={enableMatchNotifications}
                    disabled={notifyRequestPending}
                    className="w-full py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-50 text-cyan-500 text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:cursor-wait"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <FaBell />
                      {notifyRequestPending ? 'Enabling Telegram alert...' : 'Notify me when matched'}
                    </span>
                  </button>
                )
              )}

              <button
                onClick={cancelMatchmaking}
                className="w-full py-3 rounded-xl border border-brand-rose-opacity-20 bg-brand-rose-opacity-10 hover:bg-brand-rose-opacity-20 text-rose-400 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                {tg('disconnect_search')}
              </button>
            </motion.div>
          ) : (
            /* Config / Lobby View */
            <motion.div
              key="config"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full space-y-3"
            >

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
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary opacity-45 leading-none mb-1">{tg('cyber_balance')}</span>
                      <span className={`text-[11px] font-black tracking-wide leading-none truncate ${balanceError ? 'text-amber-500' : hasSufficient && chosenWager > 0 ? 'text-emerald-400' : 'text-brand-primary'}`}>
                        {/* Never present a failed balance fetch as "$0.00" */}
                        {balanceError ? '$ —' : `$${(walletBalance / 100).toFixed(2)}`}
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
                    <div className="flex items-center justify-between px-2 py-2.5 bg-brand-void/60 border border-brand-border-opacity-10 rounded-2xl shadow-inner-glow">
                      <button
                        onClick={scrollToWager}
                        className="flex-1 flex flex-col items-center justify-center cursor-pointer bg-transparent border-0 p-0 text-center hover:opacity-80 active:scale-95 transition-all duration-150"
                      >
                        <span className="text-[10px] font-black text-brand-primary/40 uppercase tracking-widest mb-0.5 flex items-center gap-0.5">
                          <FaWallet className="text-brand-primary/45 text-[10px]" /> {tg('stake')}
                        </span>
                        <span className="text-[11px] font-black text-brand-primary">${(chosenWager / 100).toFixed(2)} USDT</span>
                      </button>
                      
                      <div className="w-px h-7 bg-brand-border-opacity-10 self-center" />
                      
                      <motion.button
                        onClick={() => {
                          telegramHaptic('light');
                          setShowRakeInfo(true);
                        }}
                        animate={!hasSufficient ? { 
                           boxShadow: ["0 0 15px rgba(16,185,129,0.15)", "0 0 30px rgba(16,185,129,0.3)", "0 0 15px rgba(16,185,129,0.15)"],
                           borderColor: ["rgba(16,185,129,0.2)", "rgba(16,185,129,0.5)", "rgba(16,185,129,0.2)"]
                        } : {}}
                        transition={!hasSufficient ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : {}}
                        className="relative overflow-hidden flex-1 flex flex-col items-center justify-center px-2 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer hover:bg-emerald-500/20 active:scale-95 transition-all duration-150"
                      >
                        {!hasSufficient && (
                          <motion.div
                            initial={{ x: '-150%' }}
                            animate={{ x: '150%' }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
                            className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent skew-x-12"
                          />
                        )}
                        <span className="relative z-10 text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                          <FaFire className="text-emerald-400 text-[10px] animate-pulse" /> {tg('win_up_to')}
                        </span>
                        <span className="relative z-10 text-[11px] font-black text-emerald-400 tracking-tight leading-none">
                          ${((chosenWager * 2 * 0.95) / 100).toFixed(2)}
                        </span>
                      </motion.button>
                      
                      <div className="w-px h-7 bg-brand-border-opacity-10 self-center" />
                      
                      <button
                        onClick={scrollToTimeControl}
                        className="flex-1 flex flex-col items-center justify-center cursor-pointer bg-transparent border-0 p-0 text-center hover:opacity-80 active:scale-95 transition-all duration-150"
                      >
                        <span className="text-[10px] font-black text-brand-primary/40 uppercase tracking-widest mb-0.5 flex items-center gap-0.5">
                          <FaClock className="text-brand-primary/45 text-[10px]" /> {tg('time')}
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
                    animate={!hasSufficient && !isCreating ? {
                      boxShadow: ["0 4px 15px rgba(16,185,129,0.05)", "0 4px 25px rgba(16,185,129,0.2)", "0 4px 15px rgba(16,185,129,0.05)"],
                      borderColor: ["rgba(255,255,255,0.05)", "rgba(16,185,129,0.3)", "rgba(255,255,255,0.05)"]
                    } : {}}
                    transition={!hasSufficient && !isCreating ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : {}}
                    className={`w-full p-3.5 flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer relative overflow-hidden transition-all duration-300 text-left ${
                      hasSufficient && !isCreating
                        ? 'play-chess-card-premium text-brand-primary'
                        : 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 text-brand-primary hover:border-emerald-500/40 rounded-2xl shadow-[0_4px_24px_rgba(16,185,129,0.15)] hover:shadow-[0_4px_32px_rgba(16,185,129,0.25)]'
                    } ${
                      chosenWager === 100000 && hasSufficient ? 'shadow-[0_0_25px_rgba(234,179,8,0.4)] ring-2 ring-yellow-400/30' : ''
                    }`}
                  >
                    <motion.div
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full ${
                        hasSufficient
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                          : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                      }`}
                    />
                    {!hasSufficient && !isCreating && (
                      <motion.div
                        initial={{ x: '-150%', opacity: 0 }}
                        animate={{ x: '150%', opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', repeatDelay: 1.5, delay: 0.3 }}
                        className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent skew-x-12"
                      />
                    )}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 z-10 ${
                        hasSufficient
                          ? 'bg-gradient-to-br from-amber-500/30 to-amber-500/10 border border-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.3)]'
                          : 'bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.3)]'
                      }`}
                    >
                      <FaChessKnight className={`text-[15px] drop-shadow-md ${hasSufficient ? 'text-amber-500' : 'text-emerald-500'}`} />
                    </div>
                    <div className="flex flex-col min-w-0 z-10">
                      <span className={`text-sm font-black leading-none tracking-wide uppercase ${
                        hasSufficient ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {hasSufficient ? t('execute_matchmaking') : tg('top_up_play')}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-50 text-brand-primary flex items-center gap-1">
                        {hasSufficient ? (
                          chosenWager > 0 ? (
                            <>
                              <FaFire className="text-amber-500 text-[10px] animate-pulse" /> {tg('win_up_to')} ${((chosenWager * 2 * 0.95) / 100).toFixed(2)}
                            </>
                          ) : (
                            "FREE PRACTICE MATCH"
                          )
                        ) : (
                          tg('amount_needed', { amount: `$${((chosenWager - walletBalance) / 100).toFixed(2)}` })
                        )}
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

              {/* Secondary Actions — Upgraded to match Command Center stats cards */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <motion.button
                  whileHover={!isCreating ? { scale: 1.03 } : {}}
                  whileTap={!isCreating ? { scale: 0.98 } : {}}
                  onClick={triggerPlayVsComputer}
                  disabled={isCreating}
                  className="relative overflow-hidden rounded-2xl p-3.5 flex items-center gap-3 w-full cursor-pointer text-left disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 shadow-[0_4px_24px_rgba(16,185,129,0.15)] hover:shadow-[0_4px_32px_rgba(16,185,129,0.25)] transition-all group"
                >
                  <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_24px_rgba(16,185,129,0.5)] transition-all"
                  >
                    <FaRobot className="text-emerald-500 text-[15px] drop-shadow-md group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-black leading-none text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
                      TRAIN
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-50 text-brand-primary">
                      AGAINST A.I.
                    </span>
                  </div>
                </motion.button>
 
                {/* Play with friend button */}
                <motion.button
                   whileHover={!isCreating ? { scale: 1.03 } : {}}
                   whileTap={!isCreating ? { scale: 0.98 } : {}}
                   onClick={playVsFriend}
                   disabled={isCreating}
                   className="relative overflow-hidden rounded-2xl p-3.5 flex items-center gap-3 w-full cursor-pointer text-left disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/30 shadow-[0_4px_24px_rgba(168,85,247,0.15)] hover:shadow-[0_4px_32px_rgba(168,85,247,0.25)] transition-all group"
                 >
                   <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                   <div
                     className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-purple-500/30 to-purple-500/10 border border-purple-500/40 shadow-[0_0_16px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_24px_rgba(168,85,247,0.5)] transition-all"
                   >
                     <FaShareAlt className="text-purple-500 text-[14px] drop-shadow-md group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-black leading-none text-purple-600 dark:text-purple-400 tracking-wide uppercase">
                      PLAY
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-50 text-brand-primary">
                      WITH FRIEND
                    </span>
                  </div>
                </motion.button>
              </div>

              {/* Recent Activity Log */}
              {stats?.recent_games && stats.recent_games.length > 0 && (
                <div className="w-full space-y-3 pt-2">
                  <div className="flex items-center justify-center gap-2 px-1 w-full text-center">
                    <FaChessPawn className="text-brand-primary opacity-40 text-[10px]" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary opacity-45">{t('recent_activity')}</h3>
                  </div>
                  <div className="space-y-2.5">
                    {stats.recent_games.slice(0, 3).map((game: any, idx: number) => {
                      const isAi = game.opponent.name === "A.I. Coach";
                      return (
                        <motion.div
                          key={game.game_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.06, type: "spring", stiffness: 200, damping: 20 }}
                          className="relative overflow-hidden p-3.5 flex items-center justify-between rounded-2xl border border-brand-border-opacity-10 bg-brand-surface/20 backdrop-blur-md hover:border-brand-border-opacity-25 hover:bg-brand-surface/30 transition-all duration-300 shadow-sm group cursor-pointer"
                        >
                          {/* Decorative subtle background gradient on card hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/[0.02] to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                          <div className="flex items-center gap-3.5 relative z-10">
                            {/* Outcome Icon Badge */}
                            {game.result === 'win' ? (
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] shrink-0 group-hover:scale-105 transition-transform duration-300">
                                <FaTrophy className="text-xs" />
                              </div>
                            ) : game.result === 'loss' ? (
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500/15 to-brand-void border border-red-500/20 text-red-400/80 shrink-0 group-hover:scale-105 transition-transform duration-300">
                                <FaFlag className="text-xs" />
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-surface to-brand-void border border-brand-border-opacity-15 text-brand-primary opacity-60 shrink-0 group-hover:scale-105 transition-transform duration-300">
                                <FaHandshake className="text-xs" />
                              </div>
                            )}

                            <div className="flex flex-col justify-center">
                              <div className="flex items-center gap-1.5 mb-1">
                                {isAi ? (
                                  <FaRobot className="text-[10px] text-brand-primary opacity-40 shrink-0" />
                                ) : (
                                  <FaChessKnight className="text-[10px] text-brand-primary opacity-40 shrink-0" />
                                )}
                                <span className="text-xs font-black text-brand-primary tracking-tight leading-none group-hover:text-white transition-colors duration-200">
                                  {t('vs')} {getOpponentName(game.opponent.name)}
                                </span>
                              </div>
                              <span className="text-[10px] font-black text-brand-primary opacity-30 uppercase tracking-widest leading-none">
                                {game.opponent.elo} {t('elo')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 relative z-10">
                            {/* ELO Change Pill */}
                            {game.elo_change > 0 ? (
                              <div className="px-3 py-1.5 rounded-full text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] uppercase tracking-wider">
                                + {game.elo_change} ELO
                              </div>
                            ) : game.elo_change < 0 ? (
                              <div className="px-3 py-1.5 rounded-full text-[10px] font-black bg-red-500/10 border border-red-500/20 text-red-400/90 uppercase tracking-wider">
                                - {Math.abs(game.elo_change)} ELO
                              </div>
                            ) : (
                              <div className="px-3 py-1.5 rounded-full text-[10px] font-black bg-brand-surface border border-brand-border-opacity-15 text-brand-primary opacity-40 uppercase tracking-wider">
                                0 ELO
                              </div>
                            )}

                            {/* Share Action */}
                            <motion.button
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareResult(game);
                              }}
                              className="w-8 h-8 rounded-full bg-brand-surface border border-brand-border-opacity-10 flex items-center justify-center hover:border-brand-primary/45 hover:bg-brand-primary/5 transition-all text-brand-primary opacity-50 hover:opacity-100 cursor-pointer shadow-sm shrink-0"
                            >
                              <FaShareAlt size={10} />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>



        {/* Lobby Quick Deposit Drawer */}
        <AnimatePresence>
          {showDepositDrawer && (
            <DepositModal
              chosenWager={chosenWager}
              walletBalance={walletBalance}
              tgUser={tgUser}
              onClose={() => setShowDepositDrawer(false)}
              onSuccess={async () => {
                await syncBalance();
              }}
              tw={tw}
            />
          )}
        </AnimatePresence>

        {/* Rake Info Bottom Drawer */}
        <AnimatePresence>
          {showRakeInfo && (
            <RakeInfoDrawer onClose={() => setShowRakeInfo(false)} />
          )}
        </AnimatePresence>

        {/* AI Difficulty Selector Drawer */}
        <AnimatePresence>
          {showAiDifficultyDrawer && (
            <AiDifficultyDrawer
              locale={locale}
              onClose={() => setShowAiDifficultyDrawer(false)}
              onSelect={executePlayVsComputer}
              isCreating={isCreating}
            />
          )}
        </AnimatePresence>

      </div>
    </LayoutWrapper>
  );
}
