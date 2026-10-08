import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaChessKnight, FaWallet, FaRobot, FaShareAlt, FaFire, FaClock, FaChessPawn, FaTrophy, FaFlag, FaHandshake } from 'react-icons/fa';
import { PageHeader } from '@/components/ui/PageHeader';
import LayoutWrapper from '@/components/LayoutWrapper';
import WalletConnect from '@/components/WalletConnect';
import { apiFetch, getFullPhotoUrl } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { telegramHaptic, telegramAlert } from '@/lib/telegram';
import { copyToClipboard } from '@/lib/clipboard';
import { logTelemetryEvent } from '@/lib/telemetry';

import dynamic from 'next/dynamic';
import WagerSelector from './WagerSelector';
import TimeControlSelector from './TimeControlSelector';
import ArenaBanner from './ArenaBanner';
import RakeInfoDrawer from './RakeInfoDrawer';
import AiDifficultyDrawer from './AiDifficultyDrawer';
import { Button } from '@/components/ui/Button';

const DepositModal = dynamic(() => import('../Wallet/DepositModal'), {
  ssr: false,
});
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
  const { stats, walletBalance, syncBalance, balanceError, loadingBalance } = useUser();
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
  const [showAiDifficulty, setShowAiDifficulty] = useState(false);

  // Time control
  const [timeControl, setTimeControl] = useState<number>(600); // 10 minutes default

  // Quick Top-up states
  const [showDepositDrawer, setShowDepositDrawer] = useState<boolean>(false);

  // Refs for scroll container alignment
  const wagerScrollRef = useRef<HTMLDivElement>(null);
  const timeScrollRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef<boolean>(false);
  const keepSearchingOnExitRef = useRef<boolean>(false);

  const scrollToWager = () => {
    telegramHaptic('light');
    if (wagerScrollRef.current) {
      const activeEl = wagerScrollRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
      if (activeEl && activeEl.parentElement) {
        activeEl.parentElement.scrollTo({
          left: activeEl.offsetLeft - activeEl.parentElement.offsetWidth / 2 + activeEl.offsetWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  };

  const scrollToTimeControl = () => {
    telegramHaptic('light');
    if (timeScrollRef.current) {
      const activeEl = timeScrollRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
      if (activeEl && activeEl.parentElement) {
        activeEl.parentElement.scrollTo({
          left: activeEl.offsetLeft - activeEl.parentElement.offsetWidth / 2 + activeEl.offsetWidth / 2,
          behavior: 'smooth'
        });
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
      const centerEl = (container: HTMLDivElement | null) => {
        if (!container) return;
        const activeEl = container.querySelector('[data-active="true"]') as HTMLElement | null;
        if (activeEl) {
          container.scrollTo({
            left: activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2,
            behavior: 'auto'
          });
        }
      };
      
      centerEl(wagerScrollRef.current);
      centerEl(timeScrollRef.current);
    }, 100);
    return () => clearTimeout(timer);
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
    const botUsername = stats?.bot_username || "chess_matbot";
    const message = `${resultText} ${t('against')} ${getOpponentName(game.opponent.name)}! 📈 ${t('global_ranking')}: ${eloText} ELO.\n\n${t('join_matrix')}: https://t.me/${botUsername}?start=${stats?.referral_code || ''}`;

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
    if (balanceError || loadingBalance) {
      setMatchmakingError(tw('balance_unavailable'));
      if (balanceError) void syncBalance();
      return;
    }
    const socket = getSocket();
    const wagerInCents = isCustomWager
      ? Math.round(parseFloat(customWagerInput) * 100)
      : selectedWager;

    if (isNaN(wagerInCents) || wagerInCents < 100) {
      setMatchmakingError("Minimum wager is $1.00.");
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
  }, [isCustomWager, customWagerInput, selectedWager, walletBalance, timeControl, balanceError, loadingBalance, syncBalance, tw]);

  // Active Webhook/Balance Polling to detect deposit and start matchmaking automatically
  useEffect(() => {
    if (!showDepositDrawer) return;

    const wagerInCents = isCustomWager
      ? Math.round(parseFloat(customWagerInput) * 100)
      : selectedWager;

    if (!balanceError && !loadingBalance && walletBalance >= wagerInCents) {
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
  }, [walletBalance, balanceError, loadingBalance, showDepositDrawer, selectedWager, isCustomWager, customWagerInput, startMatchmaking, syncBalance]);

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
    if (balanceError || loadingBalance) {
      setMatchmakingError(tw('balance_unavailable'));
      if (balanceError) void syncBalance();
      return;
    }

    const wagerInCents = isCustomWager
      ? Math.round(parseFloat(customWagerInput) * 100)
      : selectedWager;

    if (isNaN(wagerInCents) || wagerInCents < 100) {
      setMatchmakingError("Minimum wager is $1.00.");
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

  const enableMatchNotifications = () => {
    if (chosenWager !== 0 || notifySearchEnabled || notifyRequestPending) return;
    keepSearchingOnExitRef.current = true;
    setNotifyRequestPending(true);
    setMatchmakingError("");
    getSocket().emit('enable_matchmaking_notifications', {});
  };

  const playVsFriend = async () => {
    if (isCreating || submittingRef.current) return;
    if (balanceError || loadingBalance) {
      setMatchmakingError(tw('balance_unavailable'));
      if (balanceError) void syncBalance();
      return;
    }

    if (isNaN(chosenWager) || chosenWager < 100) {
      setMatchmakingError("Minimum wager is $1.00.");
      return;
    }
    
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

  const startAiGame = async (difficulty: string) => {
    if (isCreating) return;
    setIsCreating(true);
    setMatchmakingError('');
    try {
      const res = await apiFetch(`/api/v1/game/create?type=computer&difficulty=${encodeURIComponent(difficulty)}&time_control=${timeControl}&wager=0`, { method: 'POST' });
      if (!res.ok) throw new Error('AI game creation failed');
      const data = await res.json();
      if (!data?.game_id) throw new Error('Missing game ID');
      telegramHaptic('success');
      setShowAiDifficulty(false);
      router.push(`/${locale}/game?id=${data.game_id}`);
    } catch (error) {
      console.error('Failed to create AI game', error);
      setMatchmakingError(tg('ai_create_failed'));
      telegramHaptic('error');
    } finally {
      setIsCreating(false);
    }
  };
  
  const hasSufficient = !balanceError && !loadingBalance && walletBalance >= chosenWager;

  return (
    <LayoutWrapper className="justify-start ">
      <div className="w-full app-page flex flex-col items-center mx-auto ">
        
        <PageHeader title={t('play')} description={`${tg('select_wager')} · ${tg('time_control')}`} />

        <Button variant="secondary" size="lg" className="w-full justify-start" leftIcon={<FaRobot size={22} />}
          onClick={() => setShowAiDifficulty(true)} disabled={isCreating}>
          {tg('train_ai')}
        </Button>

        {/* Wallet actions come before the event: funding is the prerequisite to playing. */}
        <AnimatePresence mode="wait">
          {matchmakingState === 'idle' && (
            <motion.section
              key="wallet-rail"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
              aria-label={tg('cyber_balance')}
              className="arena-wallet-rail grid w-full grid-cols-[1.08fr_1fr] items-stretch rounded-2xl border p-1.5"
            >
              <div className="min-w-0 pe-1.5">
                <WalletConnect minimal onTopUp={() => setShowDepositDrawer(true)} />
              </div>

              <Link
                href={`/${locale}/wallet`}
                className="arena-wallet-balance group flex min-h-[44px] min-w-0 items-center gap-2 border-s ps-3 pe-2 transition-colors hover:bg-brand-elevated/60 focus-visible:rounded-xl"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-border-opacity-10 bg-brand-elevated text-emerald-500 transition-colors group-hover:border-emerald-500/30">
                  <FaWallet size={11} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-caption font-semibold normal-case leading-none tracking-normal text-brand-muted">
                    {tg('cyber_balance')}
                  </span>
                  <span className={`mt-1 truncate text-sm font-semibold leading-none tabular-nums ${balanceError ? 'text-amber-500' : hasSufficient && chosenWager > 0 ? 'text-emerald-400' : 'text-brand-primary'}`}>
                    {/* Never present a failed balance fetch as "$0.00" */}
                    {balanceError || loadingBalance ? '$ —' : `$${(walletBalance / 100).toFixed(2)}`}
                  </span>
                </span>
              </Link>
            </motion.section>
          )}
        </AnimatePresence>

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
              <div className="text-caption font-semibold text-emerald-400 normal-case tracking-normal animate-pulse">
                {tg('match_found')}
              </div>
              
              {/* VS Avatars container */}
              <div className="flex items-center justify-center gap-6 w-full py-4">
                {/* Player 1 (Us) */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-brand-primary p-0.5 shadow-premium bg-brand-void flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element -- backend avatar endpoint; static export runs with images.unoptimized so next/image adds no benefit */}
                    <img
                      src={getFullPhotoUrl(`/api/v1/users/avatar/${tgUser?.id || 0}`)}
                      alt=""
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e: any) => { e.target.src = "/icon.png"; }}
                    />
                  </div>
                  <span className="text-caption font-semibold text-brand-primary truncate max-w-[80px]">
                    {tgUser?.first_name || tg('you_label')}
                  </span>
                  <span className="text-caption font-bold text-brand-muted">
                    {stats?.elo || 1000} ELO
                  </span>
                </div>

                {/* VS Pulse */}
                <div className="relative flex items-center justify-center w-12 h-12">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="w-10 h-10 rounded-full bg-brand-void border border-emerald-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <span className="text-caption font-semibold text-emerald-400 tracking-tighter">{tg('vs')}</span>
                  </div>
                </div>

                {/* Player 2 (Opponent) */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500 p-0.5 shadow-premium bg-brand-void flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element -- backend avatar endpoint; static export runs with images.unoptimized so next/image adds no benefit */}
                    <img
                      src={getFullPhotoUrl(`/api/v1/users/avatar/${matchFoundData?.opponent_id || 0}`)}
                      alt=""
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e: any) => { e.target.src = "/icon.png"; }}
                    />
                  </div>
                  <span className="text-caption font-semibold text-emerald-400 truncate max-w-[80px]">
                    {tg('opponent')}
                  </span>
                </div>
              </div>

              {/* Stake & loading */}
              <div className="w-full p-3 rounded-2xl bg-brand-void border border-brand-border-opacity-10 text-center">
                <span className="text-caption font-semibold text-brand-primary opacity-45 normal-case tracking-normal block mb-0.5">{tg('stakes_locked')}</span>
                <span className="text-sm font-semibold text-emerald-400">
                  ${((matchFoundData?.bid_amount || 0) / 100).toFixed(2)} USDT
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 text-caption font-bold text-emerald-400/60 normal-case tracking-normal animate-pulse">
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
              className="app-premium-surface w-full p-6 rounded-3xl border flex flex-col items-center justify-center space-y-6 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,rgba(16,185,129,0.18)_0%,transparent_70%)] rounded-full -mr-8 -mt-8 pointer-events-none" />
              <motion.div animate={{ opacity: [0.55, 1, 0.55] }} transition={{ duration: 2, repeat: Infinity }} className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
              
              {/* Search status is real; participant counts are unavailable. */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-500 animate-pulse text-caption font-semibold normal-case tracking-normal relative z-10">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                <span>{tg('searching_matchmaker')}</span>
              </div>

              {/* Conic sonar radar widget */}
              <div className="relative w-40 h-40 flex items-center justify-center rounded-full border border-emerald-500/20 overflow-hidden bg-brand-void shadow-[inset_0_0_20px_rgba(16,185,129,0.16)]">
                <div className="absolute inset-0 bg-conic-radar animate-radar-sweep pointer-events-none" />
                <div className="absolute w-32 h-32 rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-ping opacity-60" />
                <div className="absolute w-24 h-24 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.12)]" />
                <div className="absolute w-12 h-12 rounded-full border border-emerald-500/40 animate-pulse bg-emerald-500/5 shadow-[0_0_8px_rgba(16,185,129,0.22)]" />

                <div className="z-10 w-12 h-12 rounded-full bg-brand-surface border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.32)]">
                  <FaChessKnight className="text-lg text-emerald-500 animate-bounce drop-shadow-[0_0_5px_rgba(16,185,129,0.55)]" />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <span className="text-caption font-semibold text-brand-muted normal-case tracking-normal">{tg('searching_matchmaker')}</span>
                <span className="text-sm font-semibold text-brand-primary tracking-normal normal-case">{tg('searching_opponent')}</span>
                <span className="text-2xl font-semibold text-brand-muted tracking-tighter">
                  {Math.floor(searchTimer / 60)}:{(searchTimer % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-caption font-extrabold text-brand-muted normal-case tracking-normal mt-1">
                  {tg('est_wait')}
                </span>
              </div>

              {/* Win Up To Pill (Viral/FOMO) */}
              {chosenWager > 0 && (
                <div className="px-6 py-2.5 rounded-full bg-[var(--color-emerald-opacity-10)] border border-emerald-500/35 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse shrink-0">
                  <span className="text-caption font-semibold text-emerald-500 normal-case tracking-normal mb-1 flex items-center gap-1">
                    <FaFire className="text-emerald-500 text-caption" /> {tg('win_up_to')}
                  </span>
                  <span className="text-lg font-semibold text-emerald-500 tracking-tight leading-none">
                    ${((chosenWager * 2 * 0.95) / 100).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="w-full p-3.5 rounded-xl border border-brand-border-opacity-15 bg-brand-void text-center shadow-sm">
                <span className="text-caption font-bold text-brand-muted normal-case tracking-normal block mb-0.5">{tg('wager_tier')}</span>
                <span className="text-sm font-semibold text-brand-primary">
                  ${(chosenWager / 100).toFixed(2)} USDT
                </span>
              </div>

              {searchTimer >= 15 && chosenWager === 0 && (
                notifySearchEnabled ? (
                  <div className="w-full p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-500">
                    <span className="flex items-center justify-center gap-2 text-sm font-semibold normal-case tracking-normal">
                      <FaBell />
                      Telegram alert enabled
                    </span>
                    <span className="block mt-1 text-caption font-bold opacity-70">
                      We will keep searching for up to 30 minutes. You can leave this screen.
                    </span>
                  </div>
                ) : (
                  <button type="button"
                    onClick={enableMatchNotifications}
                    disabled={notifyRequestPending}
                    className="ui-tap-target w-full py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-50 text-cyan-500 text-sm font-semibold normal-case tracking-normal transition-all cursor-pointer disabled:cursor-wait"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <FaBell />
                      {notifyRequestPending ? 'Enabling Telegram alert...' : 'Notify me when matched'}
                    </span>
                  </button>
                )
              )}

              <button type="button"
                onClick={cancelMatchmaking}
                className="ui-tap-target w-full py-3 rounded-xl border border-brand-rose-opacity-20 bg-brand-rose-opacity-10 hover:bg-brand-rose-opacity-20 text-rose-400 text-sm font-semibold normal-case tracking-normal transition-all cursor-pointer"
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

              {/* ─── BATTLE ARENA CONFIG CARD ─── */}
              <div className="arena-config-shell rounded-3xl border border-brand-border-opacity-10 shadow-premium overflow-hidden">
                
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
                  <div className="mx-3 mb-3 rounded-2xl overflow-hidden animate-fade-in">
                    <div className="flex items-center justify-between px-2 py-2.5 bg-brand-void/60 border border-brand-border-opacity-10 rounded-2xl">
                      <button type="button"
                        onClick={scrollToWager}
                        className="ui-tap-target flex-1 flex flex-col items-center justify-center cursor-pointer bg-transparent border-0 p-0 text-center hover:opacity-80 active:scale-95 transition-all duration-150"
                      >
                        <span className="text-caption font-semibold text-brand-muted normal-case tracking-normal mb-0.5 flex items-center gap-0.5">
                          <FaWallet className="text-brand-primary/45 text-caption" /> {tg('stake')}
                        </span>
                        <span className="text-caption font-semibold text-brand-primary">${(chosenWager / 100).toFixed(2)} USDT</span>
                      </button>
                      
                      <div className="w-px h-7 bg-brand-border-opacity-10 self-center" />
                      
                      <motion.button type="button"
                        onClick={() => {
                          telegramHaptic('light');
                          setShowRakeInfo(true);
                        }}
                        aria-label={tg('win_up_to')}
                        className="ui-tap-target relative overflow-hidden flex-1 flex flex-col items-center justify-center px-2 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 cursor-pointer hover:brightness-110 active:scale-95 transition-all duration-150 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      >
                        <span className="relative z-10 text-caption font-semibold text-emerald-500 normal-case tracking-normal mb-0.5 flex items-center gap-0.5 drop-shadow-md">
                          <FaFire className="text-emerald-500 text-caption" /> {tg('win_up_to')}
                        </span>
                        <span className="relative z-10 text-caption font-semibold text-emerald-400 tracking-tight leading-none drop-shadow-md">
                          ${((chosenWager * 2 * 0.95) / 100).toFixed(2)}
                        </span>
                      </motion.button>
                      
                      <div className="w-px h-7 bg-brand-border-opacity-10 self-center" />
                      
                      <button type="button"
                        onClick={scrollToTimeControl}
                        className="ui-tap-target flex-1 flex flex-col items-center justify-center cursor-pointer bg-transparent border-0 p-0 text-center hover:opacity-80 active:scale-95 transition-all duration-150"
                      >
                        <span className="text-caption font-semibold text-brand-muted normal-case tracking-normal mb-0.5 flex items-center gap-0.5">
                          <FaClock className="text-brand-primary/45 text-caption" /> {tg('time')}
                        </span>
                        <span className="text-caption font-semibold text-emerald-500 normal-case">
                          {timeControl >= 60 ? `${timeControl / 60} MIN` : `${timeControl}s`}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Launcher Button */}
                <div className="px-3 pb-3">
                  <motion.button type="button"
                    whileHover={!isCreating ? { scale: 1.015 } : {}}
                    whileTap={!isCreating ? { scale: 0.985 } : {}}
                    onClick={handleLauncherClick}
                    disabled={isCreating || loadingBalance}
                    className={`ui-tap-target w-full p-4 flex flex-col items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer relative overflow-hidden transition-all duration-300 text-center ${
                      hasSufficient && !isCreating
                        ? 'play-chess-card-premium text-brand-primary'
                        : 'arena-topup-launcher rounded-[20px] bg-gradient-to-br from-[#2a2a30] to-[#16161a] border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                    } ${
                      chosenWager === 100000 && hasSufficient ? 'shadow-[0_0_25px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/30' : ''
                    }`}
                  >
                    <span className={`absolute top-4 right-4 w-2 h-2 rounded-full z-10 ${hasSufficient ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]' : 'bg-brand-primary/30'}`} aria-hidden="true" />
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 z-10 ${
                        hasSufficient
                          ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : 'bg-white/10 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                      }`}
                    >
                      <FaChessKnight className={`text-[20px] drop-shadow-lg ${hasSufficient ? 'text-emerald-500' : 'text-brand-primary'}`} />
                    </div>
                    <div className="flex flex-col min-w-0 z-10 items-center justify-center">
                      <span className={`text-sm font-semibold leading-none tracking-normal normal-case ${
                        hasSufficient ? 'text-emerald-500' : 'text-brand-primary'
                      }`}>
                        {balanceError ? tw('balance_unavailable') : loadingBalance ? `${tw('usdt_balance')}…` : hasSufficient ? t('execute_matchmaking') : tg('top_up_play')}
                      </span>
                      <span className={`text-caption font-semibold normal-case tracking-normal mt-1 flex items-center gap-1 ${hasSufficient ? 'text-brand-muted' : 'text-brand-muted'}`}>
                        {balanceError ? t('retry') : loadingBalance ? null : hasSufficient ? (
                          <>
                            <FaFire className="text-emerald-500 text-caption" /> {tg('win_up_to')} ${((chosenWager * 2 * 0.95) / 100).toFixed(2)}
                          </>
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
                <div className="p-3 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-2xl text-rose-400 text-caption font-semibold normal-case tracking-normal text-center shadow-sm">
                  {matchmakingError}
                </div>
              )}

              {/* Secondary Actions — Play with Friend Wager Match */}
              <div className="w-full">
                <motion.button type="button"
                  whileHover={!isCreating ? { scale: 1.015 } : {}}
                  whileTap={!isCreating ? { scale: 0.985 } : {}}
                  onClick={playVsFriend}
                  disabled={isCreating || loadingBalance}
                  className="ui-tap-target relative overflow-hidden rounded-2xl p-4 flex items-center justify-between w-full cursor-pointer text-left disabled:opacity-40 disabled:cursor-not-allowed bg-purple-500/5 border border-purple-500/40 hover:border-purple-500/60 transition-all group shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                >
                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" aria-hidden="true" />
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-500/10 border border-purple-500/20 text-purple-500 group-hover:text-purple-400 transition-colors"
                    >
                      <FaShareAlt className="text-base group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold leading-none text-purple-500 tracking-normal normal-case drop-shadow-md">
                        PLAY WITH FRIEND
                      </span>
                      <span className="text-caption font-semibold normal-case tracking-normal mt-1 opacity-80 text-purple-400">
                        SHARE WAGER CHALLENGE LINK
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-purple-400/90 tracking-normal normal-case px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    ${(chosenWager / 100).toFixed(2)}
                  </span>
                </motion.button>
              </div>

              {/* Recent Activity Log */}
              {stats?.recent_games && stats.recent_games.length > 0 && (
                <div className="w-full space-y-3 pt-2">
                  <div className="flex items-center justify-center gap-2 px-1 w-full text-center">
                    <FaChessPawn className="text-brand-muted text-caption" />
                    <h3 className="text-caption font-semibold normal-case tracking-normal text-brand-primary opacity-45">{t('recent_activity')}</h3>
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
                          className="relative overflow-hidden p-3.5 flex items-center justify-between rounded-2xl border border-brand-border bg-brand-surface hover:border-brand-border-opacity-30 transition-all duration-200 shadow-sm group cursor-pointer"
                        >
                          {/* Decorative subtle background gradient on card hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/[0.02] to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                          <div className="flex items-center gap-3.5 relative z-10">
                            {/* Outcome Icon Badge */}
                            {game.result === 'win' ? (
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] shrink-0 group-hover:scale-105 transition-transform duration-300">
                                <FaTrophy className="text-sm" />
                              </div>
                            ) : game.result === 'loss' ? (
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500/15 to-brand-void border border-red-500/20 text-red-400/80 shrink-0 group-hover:scale-105 transition-transform duration-300">
                                <FaFlag className="text-sm" />
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-surface to-brand-void border border-brand-border-opacity-15 text-brand-muted shrink-0 group-hover:scale-105 transition-transform duration-300">
                                <FaHandshake className="text-sm" />
                              </div>
                            )}

                            <div className="flex flex-col justify-center">
                              <div className="flex items-center gap-1.5 mb-1">
                                {isAi ? (
                                  <FaRobot className="text-caption text-brand-muted shrink-0" />
                                ) : (
                                  <FaChessKnight className="text-caption text-brand-muted shrink-0" />
                                )}
                                <span className="text-sm font-semibold text-brand-primary tracking-tight leading-none group-hover:text-white transition-colors duration-200">
                                  {t('vs')} {getOpponentName(game.opponent.name)}
                                </span>
                              </div>
                              <span className="text-caption font-semibold text-brand-muted normal-case tracking-normal leading-none">
                                {game.opponent.elo} {t('elo')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 relative z-10">
                            {/* ELO Change Pill */}
                            {game.elo_change > 0 ? (
                              <div className="px-3 py-1.5 rounded-full text-caption font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] normal-case tracking-normal">
                                + {game.elo_change} ELO
                              </div>
                            ) : game.elo_change < 0 ? (
                              <div className="px-3 py-1.5 rounded-full text-caption font-semibold bg-red-500/10 border border-red-500/20 text-red-400/90 normal-case tracking-normal">
                                - {Math.abs(game.elo_change)} ELO
                              </div>
                            ) : (
                              <div className="px-3 py-1.5 rounded-full text-caption font-semibold bg-brand-surface border border-brand-border-opacity-15 text-brand-muted normal-case tracking-normal">
                                0 ELO
                              </div>
                            )}

                            {/* Share Action */}
                            <motion.button aria-label="Share" type="button"
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareResult(game);
                              }}
                              className="ui-tap-target w-8 h-8 rounded-full bg-brand-surface border border-brand-border-opacity-10 flex items-center justify-center hover:border-brand-primary/45 hover:bg-brand-primary/5 transition-all text-brand-muted hover:opacity-100 cursor-pointer shadow-sm shrink-0"
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
        {showAiDifficulty && <AiDifficultyDrawer onClose={() => setShowAiDifficulty(false)} onSelect={startAiGame} isCreating={isCreating} />}
        <AnimatePresence>
          {showDepositDrawer && (
            <DepositModal
              chosenWager={chosenWager}
              walletBalance={walletBalance}
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

      </div>
    </LayoutWrapper>
  );
}
