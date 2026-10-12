import { Badge } from '@/components/ui/Badge';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaChessKnight, FaWallet, FaRobot, FaShareAlt } from 'react-icons/fa';
import { GameHistoryList } from './GameHistoryList';
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import LayoutWrapper from '@/components/LayoutWrapper';
import { apiFetch, getFullPhotoUrl } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { telegramHaptic, telegramAlert } from '@/lib/telegram';
import { copyToClipboard } from '@/lib/clipboard';
import { logTelemetryEvent } from '@/lib/telemetry';

import { BetSlip } from './lobby/BetSlip';
import { LiveStrip } from './lobby/LiveStrip';
import { DailyGoal } from './lobby/DailyGoal';
import { RecentResults } from './lobby/RecentResults';
import { useLobbyStats } from '@/hooks/useLobbyStats';
import { formatUsd, winnerCents } from '@/lib/settlement';
import ArenaBanner from './ArenaBanner';
import RakeInfoDrawer from './RakeInfoDrawer';
import AiDifficultyDrawer from './AiDifficultyDrawer';
import { Button } from '@/components/ui/Button';

import { DepositDialog as DepositModal } from '@/components/Wallet/WalletDialogs';
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

  const submittingRef = useRef<boolean>(false);
  const keepSearchingOnExitRef = useRef<boolean>(false);

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
      if (params.get('practice') === '1') {
        setShowAiDifficulty(true);
      }
      if (params.get('status') === 'success' && params.get('session_id')) {
        setShowDepositDrawer(true);
      }
    }
  }, []);

  // The shared user cache owns the initial balance request.
  const refreshAfterDeposit = useCallback(async () => { await syncBalance(); }, [syncBalance]);

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

  // Deposit verification owns its polling. Returning to Play requires an
  // explicit match action; opening Top Up must never enter a paid queue.

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
  
  const lobby = useLobbyStats();
  const idle = matchmakingState === 'idle';
  const balanceLabel = balanceError || loadingBalance ? '$ —' : formatUsd(walletBalance);
  const slipValid = Number.isFinite(chosenWager) && chosenWager >= 100;

  return (
    <LayoutWrapper className="justify-start ">
      <div className="w-full app-page flex flex-col items-center mx-auto ">

        <PageHeader
          align="start"
          title={t('play')}
          icon={<FaChessKnight />}
          actions={
            <div className="lobby-balance">
              <Link
                href={`/${locale}/wallet`}
                className="lobby-balance__amount"
                aria-label={`${tg('cyber_balance')}: ${balanceLabel}`}
                onClick={() => telegramHaptic('selection')}
              >
                <FaWallet size={12} className={balanceError ? 'text-amber-500' : 'text-brand-success'} aria-hidden="true" />
                <span>{balanceLabel}</span>
              </Link>
              <div className="lobby-balance__add">
                <Button
                  variant="ghost"
                  size="sm"
                  className="arena-topup-button"
                  leftIcon={<FaWallet aria-hidden="true" />}
                  onClick={() => setShowDepositDrawer(true)}
                >
                  <span className="arena-topup-label">{tw('top_up')}</span>
                </Button>
              </div>
            </div>
          }
        />

        <div className="lobby-stack">
          {idle && <LiveStrip searching={lobby.searching} games24h={lobby.games24h} t={tg} />}

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
                <span className="text-caption font-semibold text-brand-muted normal-case tracking-normal block mb-0.5">{tg('stakes_locked')}</span>
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
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="app-premium-surface relative flex w-full flex-col items-center gap-4 overflow-hidden rounded-3xl border p-5 text-center"
            >
              <Badge variant="emerald" className="relative z-10">{tg('searching_matchmaker')}</Badge>

              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-emerald-500/20 bg-brand-void" aria-hidden="true">
                <div className="absolute inset-0 bg-conic-radar animate-radar-sweep pointer-events-none" />
                <div className="absolute h-20 w-20 rounded-full border border-emerald-500/30 animate-ping opacity-60" />
                <div className="absolute h-14 w-14 rounded-full border border-emerald-500/20" />
                <div className="z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 border-emerald-500 bg-brand-surface">
                  <FaChessKnight className="text-base text-emerald-500" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-brand-primary">{tg('searching_opponent')}</span>
                <span className="text-2xl font-semibold tabular-nums text-brand-muted" role="timer" aria-live="off">
                  {Math.floor(searchTimer / 60)}:{(searchTimer % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-caption text-brand-muted">{tg('lobby_search_hint')}</span>
                {lobby.searching > 0 && (
                  <span className="text-caption text-brand-muted"><strong className="font-bold text-brand-primary tabular-nums">{lobby.searching.toLocaleString(locale)}</strong> {tg('lobby_waiting')}</span>
                )}
              </div>

              {chosenWager > 0 && (
                <div className="lobby-payout w-full">
                  <div className="lobby-payout__col">
                    <span className="lobby-payout__label">{tg('stake')}</span>
                    <span className="lobby-payout__value">{formatUsd(chosenWager)}</span>
                  </div>
                  <div className="lobby-payout__col" style={{ alignItems: 'flex-end' }}>
                    <span className="lobby-payout__label">{tg('win_up_to')}</span>
                    <span className="lobby-payout__value lobby-payout__value--win">{formatUsd(winnerCents(chosenWager))}</span>
                    <span className="lobby-payout__note">{tg('includes_stake')}</span>
                  </div>
                </div>
              )}

              {searchTimer >= 15 && (
                <div className="flex w-full flex-col gap-2 rounded-2xl border border-brand-border bg-brand-void p-3">
                  <p className="text-caption text-brand-muted">{tg('lobby_no_opponent')}</p>
                  <Button variant="secondary" className="w-full" leftIcon={<FaRobot />} onClick={() => { cancelMatchmaking(); setShowAiDifficulty(true); }}>
                    {tg('lobby_switch_ai')}
                  </Button>
                </div>
              )}

              {searchTimer >= 15 && chosenWager === 0 && (
                notifySearchEnabled ? (
                  <div className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 text-cyan-500">
                    <span className="flex items-center justify-center gap-2 text-sm font-semibold normal-case tracking-normal"><FaBell />Telegram alert enabled</span>
                    <span className="mt-1 block text-caption font-bold">We will keep searching for up to 30 minutes. You can leave this screen.</span>
                  </div>
                ) : (
                  <Button variant="secondary" className="w-full" leftIcon={<FaBell />} onClick={enableMatchNotifications} isLoading={notifyRequestPending}>
                    {notifyRequestPending ? 'Enabling Telegram alert…' : 'Notify me when matched'}
                  </Button>
                )
              )}

              <Button variant="destructive" className="w-full" onClick={cancelMatchmaking}>
                {tg('disconnect_search')}
              </Button>
            </motion.div>
          ) : (
            /* Config / Lobby View */
            <motion.div
              key="config"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="lobby-stack"
            >
              <BetSlip
                selectedWager={selectedWager}
                isCustomWager={isCustomWager}
                customWagerInput={customWagerInput}
                timeControl={timeControl}
                chosenWager={chosenWager}
                walletBalance={walletBalance}
                loadingBalance={loadingBalance}
                balanceError={Boolean(balanceError)}
                isCreating={isCreating}
                onSelectWager={cents => { setSelectedWager(cents); setIsCustomWager(false); }}
                onSelectCustom={() => setIsCustomWager(true)}
                onCustomChange={setCustomWagerInput}
                onSelectTime={setTimeControl}
                onStart={handleLauncherClick}
                onShowRake={() => setShowRakeInfo(true)}
                t={t}
                tg={tg}
                tw={tw}
              />

              {/* Keep the wager action and its risk disclosure together before secondary events. */}
              <ArenaBanner />

              {matchmakingError && (
                <div role="alert" className="rounded-2xl border border-brand-rose-opacity-20 bg-brand-rose-opacity-10 p-3 text-center text-caption font-semibold normal-case tracking-normal text-rose-400">
                  {matchmakingError}
                </div>
              )}

              <DailyGoal t={tg} />

              <div className="lobby-tiles">
                <button type="button" className="lobby-tile" onClick={() => setShowAiDifficulty(true)} disabled={isCreating}>
                  <span className="ui-icon-tile ui-icon-tile--info"><FaRobot size={18} aria-hidden="true" /></span>
                  <span className="lobby-tile__text">
                    <span className="lobby-tile__title">{tg('train_ai')}</span>
                    <span className="lobby-tile__sub">{tg('lobby_no_stake')}</span>
                  </span>
                </button>
                <button type="button" className="lobby-tile" onClick={playVsFriend} disabled={isCreating || loadingBalance || !slipValid}>
                  <span className="ui-icon-tile ui-icon-tile--premium"><FaShareAlt size={16} aria-hidden="true" /></span>
                  <span className="lobby-tile__text">
                    <span className="lobby-tile__title">{tg('play_friend')}</span>
                    <span className="lobby-tile__sub">{slipValid ? formatUsd(chosenWager) : '—'}</span>
                  </span>
                </button>
              </div>

              <RecentResults recent={lobby.recent} t={tg} />

              {/* Recent Activity Log */}
              {stats?.recent_games && stats.recent_games.length > 0 && (
                <section className="w-full space-y-3" aria-labelledby="lobby-history-title">
                  <SectionHeader id="lobby-history-title" title={t('recent_activity')} />
                  <GameHistoryList games={stats.recent_games.slice(0, 3)} onShare={handleShareResult} />
                </section>
              )}

            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Lobby Quick Deposit Drawer */}
        {showAiDifficulty && <AiDifficultyDrawer onClose={() => setShowAiDifficulty(false)} onSelect={startAiGame} isCreating={isCreating} />}
        <AnimatePresence>
          {showDepositDrawer && (
            <DepositModal
              chosenWager={chosenWager}
              walletBalance={walletBalance}
              onClose={() => setShowDepositDrawer(false)}
              onSuccess={refreshAfterDeposit}
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
