import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaCopy, FaCheck, FaRobot, FaFlag, FaHandshake, FaShareAlt, FaChessKnight } from 'react-icons/fa';

import LayoutWrapper from '@/components/LayoutWrapper';
import { Card } from '@/components/ui/Card';
import ChessBoardComponent from '@/components/game/ChessBoard';
import MatchOverModal from '@/components/game/MatchOverModal';
import RematchChoiceDrawer from '@/components/game/RematchChoiceDrawer';
import IncomingRematchDrawer from '@/components/game/IncomingRematchDrawer';

import { useGameSocket } from '@/hooks/useGameSocket';
import { useAudioSynth } from '@/hooks/useAudioSynth';
import { useAudio } from '@/hooks/useAudio';
import { useChessClock } from '@/hooks/useChessClock';
import { useNavbarHide } from '@/context/NavbarContext';
import { apiFetch, getFullPhotoUrl } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { telegramHaptic } from '@/lib/telegram';
import { copyToClipboard } from '@/lib/clipboard';

import { Chess } from 'chess.js';

interface ActiveGameProps {
  gameId: string;
}

function getMovesSanList(moveHistory: string[]): { white: string; black?: string }[] {
  const tempChess = new Chess();
  const result: { white: string; black?: string }[] = [];
  
  for (let i = 0; i < moveHistory.length; i += 2) {
    const whiteUci = moveHistory[i];
    const blackUci = moveHistory[i+1];
    
    let whiteSan = "";
    if (whiteUci) {
      try {
        const from = whiteUci.substring(0, 2);
        const to = whiteUci.substring(2, 4);
        const promotion = whiteUci.substring(4, 5) || undefined;
        const move = tempChess.move({ from, to, promotion });
        whiteSan = move.san;
      } catch {
        whiteSan = whiteUci;
      }
    }
    
    let blackSan = "";
    if (blackUci) {
      try {
        const from = blackUci.substring(0, 2);
        const to = blackUci.substring(2, 4);
        const promotion = blackUci.substring(4, 5) || undefined;
        const move = tempChess.move({ from, to, promotion });
        blackSan = move.san;
      } catch {
        blackSan = blackUci;
      }
    }
    
    result.push({
      white: whiteSan,
      ...(blackSan ? { black: blackSan } : {})
    });
  }
  
  return result;
}

interface PlayerAvatarProps {
  userId?: number | null;
  fallbackText: string;
  isBot?: boolean;
  textClassName?: string;
}

function PlayerAvatar({ userId, fallbackText, isBot, textClassName }: PlayerAvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [userId]);

  if (isBot) {
    return <FaRobot className="text-xl text-brand-primary opacity-40" />;
  }

  if (!userId || hasError) {
    return <span className={textClassName || "text-xl font-bold text-brand-primary opacity-20"}>{fallbackText}</span>;
  }

  return (
    <img
      src={getFullPhotoUrl(`/api/v1/users/avatar/${userId}`)}
      alt=""
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  );
}

export default function ActiveGame({ gameId }: ActiveGameProps) {
  const router = useRouter();
  const locale = useLocale();
  const tg = useTranslations('Game');

  const { playTickSound } = useAudioSynth();
  const { play: playAudio } = useAudio();
  // @ts-ignore
  const { fen, makeMove, isConnected, error, gameState } = useGameSocket(gameId);

  const [copied, setCopied] = useState(false);
  const [showCrashOverlay, setShowCrashOverlay] = useState(false);
  const [autoPromote, setAutoPromote] = useState<boolean>(false);
  const [gameNotice, setGameNotice] = useState<{
    type: 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const lastCheckedFenRef = useRef<string | null>(null);
  const [isTelegramWeb, setIsTelegramWeb] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isIframe = window.self !== window.top;
      const isWebPlatform = window.Telegram?.WebApp && ['weba', 'webk', 'web', 'desktop', 'unknown'].includes(window.Telegram.WebApp.platform as string);
      if (isIframe || isWebPlatform) {
        setIsTelegramWeb(true);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("setting_auto_promote_queen");
      if (saved === "true") {
        setAutoPromote(true);
      }
    }
  }, []);

  const handleToggleAutoPromote = () => {
    const newVal = !autoPromote;
    setAutoPromote(newVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("setting_auto_promote_queen", String(newVal));
    }
    telegramHaptic('light');
  };

  useEffect(() => {
    let timer: any;
    if (gameState && !gameState.is_game_over && !isConnected) {
      timer = setTimeout(() => {
        setShowCrashOverlay(true);
      }, 3000);
    } else if (!gameState) {
      timer = setTimeout(() => {
        setShowCrashOverlay(true);
      }, 8000);
    } else {
      setShowCrashOverlay(false);
    }
    return () => clearTimeout(timer);
  }, [isConnected, gameState]);

  const [userId, setUserId] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [isTelegram, setIsTelegram] = useState<boolean>(false);

  const [showRematchChoice, setShowRematchChoice] = useState<boolean>(false);
  const [rematchStatus, setRematchStatus] = useState<'idle' | 'offered_by_me' | 'waiting'>('idle');
  const [incomingRematch, setIncomingRematch] = useState<any>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  } | null>(null);

  const isWhite = gameState ? gameState.white_player_id === userId : true;
  const opponentId = isWhite ? gameState?.black_player_id : gameState?.white_player_id;

  const gameStateRef = useRef(gameState);
  const userIdRef = useRef(userId);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Automatically abort and refund if the creator leaves/unmounts the lobby before opponent joins
  useEffect(() => {
    return () => {
      const latestState = gameStateRef.current;
      const latestUserId = userIdRef.current;
      if (
        latestState &&
        !latestState.is_game_over &&
        !latestState.black_player_id &&
        latestState.white_player_id === latestUserId
      ) {
        const socket = getSocket();
        socket.emit('abort_game', { game_id: gameId });
        console.log("Automatically aborted game on unmount because opponent had not joined.");
      }
    };
  }, [gameId]);

  // Initialize Telegram User ID and environment check on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        setUserId(window.Telegram.WebApp.initDataUnsafe.user.id);
      } else if (process.env.NODE_ENV === 'development') {
        setUserId(123456789);
      }
      setIsTelegram(typeof window !== 'undefined' && !!(window as any).Telegram?.WebApp?.initData);
    }
  }, []);

  // Fetch own user profile on load to get ELO and details
  useEffect(() => {
    if (userId) {
      apiFetch(`/api/v1/users/${userId}`)
        .then(res => {
          if (res.ok) return res.json();
          return null;
        })
        .then(data => {
          if (data) {
            setUserStats(data);
          }
        })
        .catch(() => {});
    }
  }, [userId]);

  const triggeredHapticsRef = useRef<{ [key: number]: boolean }>({ 10: false, 5: false, 3: false });
  const lastSoundRef = useRef<number>(0);
  const moveHistoryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (moveHistoryRef.current) {
      moveHistoryRef.current.scrollLeft = moveHistoryRef.current.scrollWidth;
    }
  }, [gameState?.move_history?.length]);

  useEffect(() => {
    if (gameState?.id) {
      triggeredHapticsRef.current = { 10: false, 5: false, 3: false };
    }
  }, [gameState?.id]);

  const triggerClocksWarnings = (timeLeft: number) => {
    const now = Date.now();
    
    // Play tick sound when time is below 10 seconds (every 1 second)
    if (timeLeft <= 10 && timeLeft > 0) {
      if (now - lastSoundRef.current >= 1000) {
        lastSoundRef.current = now;
        playTickSound('tick');
      }
    }
    
    // Trigger warning haptics at 10s, 5s, 3s
    if (timeLeft <= 10 && timeLeft > 9.0 && !triggeredHapticsRef.current[10]) {
      triggeredHapticsRef.current[10] = true;
      telegramHaptic('warning');
    } else if (timeLeft <= 5 && timeLeft > 4.0 && !triggeredHapticsRef.current[5]) {
      triggeredHapticsRef.current[5] = true;
      telegramHaptic('warning');
    } else if (timeLeft <= 3 && timeLeft > 2.0 && !triggeredHapticsRef.current[3]) {
      triggeredHapticsRef.current[3] = true;
      telegramHaptic('warning');
    }
  };

  // Dedicated chess clock hook
  const { whiteTime, blackTime } = useChessClock(
    gameState,
    isWhite,
    triggerClocksWarnings
  );

  const myTime = isWhite ? whiteTime : blackTime;
  const opponentTime = isWhite ? blackTime : whiteTime;
  const isMyTurn = gameState && !gameState.is_game_over && gameState.turn === (isWhite ? 'w' : 'b');
  const isOpponentTurn = gameState && !gameState.is_game_over && gameState.turn !== (isWhite ? 'w' : 'b');
  // Declared here (not just before its later usages) because the "check notification"
  // effect below references it in its dependency array; a `const` declared further
  // down in this same component scope would throw "Cannot access before
  // initialization" (TDZ) the moment that effect's deps are evaluated during render.
  const isGameOver = gameState?.is_game_over || gameState?.status === 'completed' || gameState?.status === 'aborted';

  // Sync wallet balance and user stats on game completion, play warning indicators
  useEffect(() => {
    if (gameState?.is_game_over) {
      apiFetch("/api/v1/wallet/balance")
        .then(res => {
          if (res.ok) {
            console.log("Platform balance synced after game completion.");
          }
        })
        .catch(() => {});

      if (userId) {
        apiFetch(`/api/v1/users/${userId}`)
          .then(res => {
            if (res.ok) return res.json();
            return null;
          })
          .then(data => {
            if (data) {
              setUserStats(data);
            }
          })
          .catch(() => {});
      }

      if (gameState.result_type === 'timeout') {
        playTickSound('timeout');
        telegramHaptic('error');
      } else if (gameState.result_type === 'aborted') {
        telegramHaptic('warning');
      } else if (gameState.winner_id === userId) {
        telegramHaptic('success');
      } else if (gameState.winner_id && gameState.winner_id !== userId) {
        telegramHaptic('error');
      } else {
        telegramHaptic('warning'); // Draw
      }
    }
  }, [gameState?.is_game_over, gameState?.result_type, gameState?.winner_id, userId, playTickSound]);

  // Redirect back if game is aborted and opponent never joined
  useEffect(() => {
    if (gameState?.is_game_over && gameState?.result_type === 'aborted' && !gameState?.black_player_id) {
      telegramHaptic('warning');
      router.push(`/${locale}/home`);
    }
  }, [gameState, locale, router]);

  // Socket draw / rematch event handlers
  useEffect(() => {
    if (!gameState) return;
    const socket = getSocket();
    
    const onDrawOffered = (data: { game_id: string; offered_by: number }) => {
      if (data.offered_by !== userId) {
        setConfirmConfig({
          title: tg('draw_offered_title'),
          message: tg('draw_offered_message'),
          confirmText: tg('accept_draw'),
          cancelText: tg('decline'),
          onConfirm: () => {
            socket.emit("accept_draw", { game_id: gameId });
          }
        });
      }
    };

    const onRematchOffered = (data: any) => {
      if (data.challenger_id !== userId) {
        setIncomingRematch(data);
      } else {
        setRematchStatus('waiting');
      }
    };

    const onMatchFound = (data: { game_id: string }) => {
      router.push(`/${locale}/game?id=${data.game_id}`);
    };

    socket.on("draw_offered", onDrawOffered);
    socket.on("rematch_offered", onRematchOffered);
    socket.on("match_found", onMatchFound);

    return () => {
      socket.off("draw_offered", onDrawOffered);
      socket.off("rematch_offered", onRematchOffered);
      socket.off("match_found", onMatchFound);
    };
  }, [gameId, userId, gameState, locale, router]);

  // Auto-dismiss game notices after 3.5 seconds
  useEffect(() => {
    if (gameNotice) {
      const timer = setTimeout(() => {
        setGameNotice(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [gameNotice]);

  const getNoticeMessage = useCallback((key: keyof typeof dictionary.en) => {
    const dictionary = {
      en: {
        check: '⚠️ You are in Check!',
        illegal: '❌ Illegal move!',
        illegal_check: '❌ Illegal move! You must escape check.'
      },
      ru: {
        check: '⚠️ Вам шах!',
        illegal: '❌ Недопустимый ход!',
        illegal_check: '❌ Недопустимый ход! Уйдите от шаха.'
      },
      es: {
        check: '⚠️ ¡Estás en Jaque!',
        illegal: '❌ ¡Movimiento ilegal!',
        illegal_check: '❌ ¡Movimiento ilegal! Debes escapar del jaque.'
      },
      fr: {
        check: '⚠️ Vous êtes en Échec !',
        illegal: '❌ Mouvement illégal !',
        illegal_check: "❌ Mouvement illégal ! Échappez à l'échec."
      },
      de: {
        check: '⚠️ SIE SIND IM SCHACH!',
        illegal: '❌ Ungültiger Zug!',
        illegal_check: '❌ Ungültiger Zug! Schützen Sie den König.'
      },
      zh: {
        check: '⚠️ 您处于被将军状态！',
        illegal: '❌ 违规移动！',
        illegal_check: '❌ 违规移动！请避开将军。'
      },
      ja: {
        check: '⚠️ 王手がかかっています！',
        illegal: '❌ 無効な手です！',
        illegal_check: '❌ 無効な手です！王手を防いでください。'
      },
      pt: {
        check: '⚠️ VOCÊ ESTÁ EM XEQUE!',
        illegal: '❌ Movimento ilegal!',
        illegal_check: '❌ Movimento ilegal! Fuja do xeque.'
      },
      ar: {
        check: '⚠️ أنت في وضع كش ملك!',
        illegal: '❌ نقلة غير قانونية!',
        illegal_check: '❌ نقلة غير قانونية! تخلص من الكش.'
      },
      hi: {
        check: '⚠️ आप शह में हैं!',
        illegal: '❌ अवैध चाल!',
        illegal_check: '❌ अवैध चाल! शह से बचें।'
      }
    };
    const lang = locale || 'en';
    const dict = dictionary[lang as keyof typeof dictionary] || dictionary.en;
    return dict[key];
  }, [locale]);

  // Trigger check notification on turn start
  useEffect(() => {
    if (!gameState || isGameOver) return;
    
    const currentFen = gameState.fen;
    if (isMyTurn && gameState.is_check && lastCheckedFenRef.current !== currentFen) {
      lastCheckedFenRef.current = currentFen;
      setGameNotice({
        type: 'warning',
        message: getNoticeMessage('check')
      });
      telegramHaptic('warning');
    } else if (!isMyTurn || !gameState.is_check) {
      lastCheckedFenRef.current = currentFen;
    }
  }, [gameState, isMyTurn, isGameOver, locale, getNoticeMessage]);

  const handleBoardMove = (move: { from: string; to: string; promotion?: string }): boolean => {
    const success = makeMove(move);
    if (!success) {
      telegramHaptic('error');
      const isInCheck = gameState?.is_check || false;
      setGameNotice({
        type: 'error',
        message: isInCheck ? getNoticeMessage('illegal_check') : getNoticeMessage('illegal')
      });
    } else {
      telegramHaptic('light');
    }
    return success;
  };

  const sendRematchOffer = (doubleStakes: boolean) => {
    const socket = getSocket();
    socket.emit("offer_rematch", { game_id: gameId, double_stakes: doubleStakes });
    setShowRematchChoice(false);
    setRematchStatus('waiting');
  };

  const startBotGameRevenge = async () => {
    setRematchStatus('waiting');
    try {
      const timeControl = gameState?.time_control_seconds || 600;
      const difficulty = gameState?.difficulty || "medium";
      const res = await apiFetch(`/api/v1/game/create?type=computer&time_control=${timeControl}&difficulty=${difficulty}`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      router.push(`/${locale}/game?id=${data.game_id}`);
    } catch {
      console.error("Failed to create computer game");
      setRematchStatus('idle');
    }
  };

  const acceptRematch = () => {
    if (!incomingRematch) return;
    const socket = getSocket();
    socket.emit("accept_rematch", { game_id: gameId, wager: incomingRematch.wager });
    setIncomingRematch(null);
  };

  const declineRematch = () => {
    setIncomingRematch(null);
  };

  const handleResign = () => {
    setConfirmConfig({
      title: tg('resign_title'),
      message: tg('resign_message'),
      confirmText: tg('resign_confirm'),
      cancelText: tg('cancel'),
      onConfirm: () => {
        const socket = getSocket();
        socket.emit("resign", { game_id: gameId });
      }
    });
  };

  const handleOfferDraw = () => {
    if (isBotGame) {
      setConfirmConfig({
        title: tg('draw_declined_title'),
        message: tg('draw_declined_message'),
        confirmText: tg('resign'),
        cancelText: tg('keep_playing'),
        onConfirm: () => {
          setTimeout(() => {
            handleResign();
          }, 100);
        }
      });
      return;
    }

    setConfirmConfig({
      title: tg('offer_draw_title'),
      message: tg('offer_draw_message'),
      confirmText: tg('offer_draw_confirm'),
      cancelText: tg('cancel'),
      onConfirm: () => {
        const socket = getSocket();
        socket.emit("offer_draw", { game_id: gameId });
      }
    });
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "0.0";
    if (seconds < 20) {
      return seconds.toFixed(1);
    }
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const prevFenRef = useRef<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  // Sound Engine
  useEffect(() => {
    if (!gameState) return;

    const playSound = (soundName: any) => {
      try {
        playAudio(soundName);
      } catch {}
    };

    const currentFen = gameState.fen;
    const currentStatus = gameState.status || 'active';
    const isCheck = gameState.is_check;
    const isGameOver = gameState.is_game_over || currentStatus === 'completed' || currentStatus === 'aborted';

    // Game Start Trigger
    if (prevStatusRef.current === null && currentStatus === 'active') {
      playSound('start');
    }
    // Game End Trigger
    else if (prevStatusRef.current === 'active' && isGameOver) {
      if (gameState.winner_id === userId) {
        playSound('win');
      } else if (gameState.winner_id && gameState.winner_id !== userId) {
        playSound('loss');
      } else {
        playSound('move');
      }
    }
    // Live Move/Capture/Check SFX
    else if (prevFenRef.current && prevFenRef.current !== currentFen && !isGameOver) {
      if (isCheck) {
        playSound('check');
        telegramHaptic('warning');
      } else {
        const getPieceCount = (f: string) => f.split(' ')[0].replace(/[^a-zA-Z]/g, '').length;
        if (getPieceCount(currentFen) < getPieceCount(prevFenRef.current)) {
          playSound('capture');
          telegramHaptic('medium');
        } else {
          playSound('move');
          telegramHaptic('light');
        }
      }
    }

    prevFenRef.current = currentFen;
    prevStatusRef.current = currentStatus;
  }, [gameState, userId, playAudio]);

  const botUsername = userStats?.bot_username || "FinChess_bot";
  const inviteLink = `https://t.me/${botUsername}/app?startapp=${gameId}`;

  const handleShareInvite = () => {
    const shareText = `Play a game of wager chess with me! ♟️ Stake: $${((gameState?.bid_amount || 0) / 100).toFixed(2)} USDT. Click to join:`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;

    if (window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.openTelegramLink(shareUrl);
      } catch {
        window.open(shareUrl, '_blank');
      }
    } else {
      window.open(shareUrl, '_blank');
    }
    handleCopyInvite();
  };

  const handleCopyInvite = () => {
    copyToClipboard(inviteLink).then((ok) => {
      if (!ok) return;
      setCopied(true);
      telegramHaptic('success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareGame = () => {
    const link = typeof window !== 'undefined' ? window.location.href : "";
    const shareText = `I played a chess match on FinChess! ♟️⚡️`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`;

    if (window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.openTelegramLink(shareUrl);
      } catch (err) {
        console.warn("Telegram openTelegramLink failed", err);
      }
    }
    
    // Copy to clipboard as backup / confirmation
    copyToClipboard(link).then((ok) => {
      if (!ok) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isBotGame = gameState?.black_player_id === -1;
  const isWaiting = gameState && !isBotGame && !gameState.black_player_id;

  // Toggle Navbar — hide completely for the entire active game match lifecycle
  const { hideNavbar, showNavbar } = useNavbarHide();
  useEffect(() => {
    hideNavbar();
    return () => { showNavbar(); };
  }, [hideNavbar, showNavbar]);

  // Match Over Logic Labels
  let matchResultLabel = tg('protocol_draw');
  let resultColor = "text-brand-primary opacity-60"; 
  let eloChange = "+0";
  let netPayout = gameState?.wager_amount || 0;
  
  if (isGameOver && gameState) {
    const isWinner = gameState.winner_id === userId;
    const isDraw = !gameState.winner_id;
    const isAborted = gameState.result_type === 'aborted';
    const isTimeout = gameState.result_type === 'timeout';
    
    if (isAborted) {
      matchResultLabel = tg('match_aborted');
      resultColor = "text-brand-primary opacity-50";
      eloChange = "+0";
      netPayout = gameState.wager_amount;
    } else if (isDraw) {
      matchResultLabel = tg('protocol_draw');
      resultColor = "text-brand-primary opacity-60";
      
      if (gameState.white_player_id === userId) {
        const diff = (gameState.white_elo_after ?? 1000) - (gameState.white_elo_before ?? 1000);
        eloChange = diff >= 0 ? `+${diff}` : `${diff}`;
      } else {
        const diff = (gameState.black_elo_after ?? 1000) - (gameState.black_elo_before ?? 1000);
        eloChange = diff >= 0 ? `+${diff}` : `${diff}`;
      }
      netPayout = gameState.wager_amount;
    } else if (isWinner) {
      if (isTimeout) {
        matchResultLabel = tg('won_on_time');
      } else {
        matchResultLabel = tg('victory_secured');
      }
      resultColor = "text-brand-primary font-black";
      
      if (gameState.white_player_id === userId) {
        const diff = (gameState.white_elo_after ?? 1000) - (gameState.white_elo_before ?? 1000);
        eloChange = diff >= 0 ? `+${diff}` : `${diff}`;
      } else {
        const diff = (gameState.black_elo_after ?? 1000) - (gameState.black_elo_before ?? 1000);
        eloChange = diff >= 0 ? `+${diff}` : `${diff}`;
      }
      netPayout = (gameState.payout_amount !== undefined && gameState.payout_amount !== null)
        ? gameState.payout_amount / 100
        : (gameState.wager_amount * 2) * 0.95;
    } else {
      if (isTimeout) {
        matchResultLabel = tg('lost_on_time');
      } else {
        matchResultLabel = tg('tactical_defeat');
      }
      resultColor = "text-brand-primary opacity-80";
      
      if (gameState.white_player_id === userId) {
        const diff = (gameState.white_elo_after ?? 1000) - (gameState.white_elo_before ?? 1000);
        eloChange = diff >= 0 ? `+${diff}` : `${diff}`;
      } else {
        const diff = (gameState.black_elo_after ?? 1000) - (gameState.black_elo_before ?? 1000);
        eloChange = diff >= 0 ? `+${diff}` : `${diff}`;
      }
      netPayout = 0;
    }
  }

  const myNewElo = gameState 
    ? (gameState.white_player_id === userId ? gameState.white_elo_after : gameState.black_elo_after)
    : (userStats?.elo || 1000);

  if (!gameState) {
    return (
      <LayoutWrapper className="justify-center items-center">
        <div className="flex flex-col items-center justify-center min-h-[50dvh]">
          <div className="relative w-20 h-20 flex items-center justify-center rounded-full border border-brand-border-opacity-10 bg-brand-surface mb-5 shadow-premium">
            <div className="absolute inset-0 rounded-full border border-brand-primary/20 animate-ping opacity-40" />
            <div className="absolute w-14 h-14 rounded-full bg-brand-void border border-brand-border-opacity-10 flex items-center justify-center shadow-inner-glow">
              <FaChessKnight className="text-xl text-brand-primary animate-bounce" />
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-primary opacity-40 animate-pulse">
            {tg('synchronizing_arena')}
          </span>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper className="pb-12">
      {/* Header / Nav */}
      <div className="w-full max-w-sm flex justify-between items-center mb-6 relative z-10 px-2 mt-2 mx-auto">
        <div className="flex items-center gap-3">
          {isGameOver && !isTelegram && (
            <Link href={`/${locale}/home`}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="text-brand-primary opacity-45 hover:opacity-100 transition-opacity flex items-center cursor-pointer p-2 -ml-2"
              >
                <FaArrowLeft size={16} />
              </motion.button>
            </Link>
          )}
          {!isGameOver && (
            <button
              onClick={handleToggleAutoPromote}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer ${
                autoPromote 
                  ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' 
                  : 'bg-brand-surface border-brand-border-opacity-10 text-brand-primary opacity-60'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider">
                {tg('auto_queen')}
              </span>
              <div className={`w-2 h-2 rounded-full ${autoPromote ? 'bg-brand-primary animate-pulse' : 'bg-brand-primary/30'}`} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 bg-brand-surface px-3 py-1 rounded-full border border-brand-border-opacity-10 shadow-sm">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-[10px] font-bold tracking-[0.2em] text-brand-primary opacity-60 uppercase">
            {isConnected ? tg('active_sync') : tg('isolated')}
          </span>
        </div>
      </div>

      {/* Game Notice Toast */}
      <AnimatePresence>
        {gameNotice && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-[90vw] max-w-[280px]"
          >
            <div className={`p-3.5 rounded-2xl border bg-brand-surface shadow-premium text-center pointer-events-auto transition-all transform-gpu will-change-transform ${
              gameNotice.type === 'error' 
                ? 'border-red-500/30 text-red-400' 
                : gameNotice.type === 'warning'
                ? 'border-amber-500/30 text-amber-400'
                : 'border-brand-primary/20 text-brand-primary'
            }`}>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] block mb-1 opacity-60">
                {gameNotice.type === 'error'
                  ? tg('notice_attention')
                  : gameNotice.type === 'warning'
                  ? tg('notice_warning')
                  : tg('notice_info')}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wide leading-tight block">
                {gameNotice.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[90vw] max-w-[280px]"
        >
          <div className="p-3 rounded-2xl border border-red-500/20 bg-brand-surface shadow-premium text-center pointer-events-auto transform-gpu will-change-transform">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-0.5">{tg('system_warning')}</span>
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wide leading-tight">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Main Game Area */}
      {isWaiting ? (
        <div className="w-full max-w-sm flex flex-col items-center gap-6 mx-auto px-1 animate-fade-in">
          <div className="w-full glass-panel p-6 rounded-3xl border border-brand-border-opacity-10 bg-brand-surface flex flex-col items-center text-center shadow-premium relative overflow-hidden">
            {/* Ambient corner backlights */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-bg-opacity-5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -ml-6 -mb-6 pointer-events-none animate-pulse" />

            {/* Radar / Sonar pulse loading widget */}
            <div className="relative w-28 h-28 flex items-center justify-center rounded-full border border-brand-border-opacity-10 bg-brand-void mb-5 shadow-inner-glow">
              <div className="absolute inset-0 rounded-full border border-brand-primary/20 animate-ping opacity-40" />
              <div className="absolute w-20 h-20 rounded-full border border-brand-primary/10 animate-pulse opacity-60" />
              <div className="absolute w-14 h-14 rounded-full bg-brand-surface border border-brand-border-opacity-10 flex items-center justify-center shadow-premium">
                <FaChessKnight className="text-xl text-brand-primary animate-bounce" />
              </div>
            </div>

            <div className="flex flex-col space-y-1.5 mb-6">
              <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest animate-pulse">
                {tg('waiting_opponent_title')}
              </span>
              <span className="text-sm font-bold text-brand-primary uppercase tracking-wide">
                {tg('share_invite_hint')}
              </span>
            </div>

            {/* Match details card */}
            <div className="w-full grid grid-cols-2 gap-3 mb-6 bg-brand-void/50 border border-brand-border-opacity-5 rounded-2xl p-4 shadow-sm">
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-widest mb-1">
                  {tg('wager_tier')}
                </span>
                <span className="text-xs font-black text-emerald-400">
                  {gameState.bid_amount > 0 
                    ? `$${(gameState.bid_amount / 100).toFixed(2)} USDT` 
                    : tg('free_match')}
                </span>
              </div>
              <div className="flex flex-col items-end text-right border-l border-brand-border-opacity-10 pl-3">
                <span className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-widest mb-1">
                  {tg('time_control')}
                </span>
                <span className="text-xs font-black text-amber-400 uppercase">
                  {gameState.time_control_seconds >= 60 
                    ? `${gameState.time_control_seconds / 60} MIN` 
                    : `${gameState.time_control_seconds}s`}
                </span>
              </div>
            </div>

            {/* Share link widget */}
            <div className="w-full space-y-3">
              <div className="relative w-full flex items-center bg-brand-void/80 border border-brand-border-opacity-10 rounded-xl px-3.5 py-3 shadow-inner-glow overflow-hidden">
                <span className="text-[10px] font-mono text-brand-primary opacity-50 truncate select-all pr-8 w-full text-left">
                  {inviteLink}
                </span>
                <button
                  onClick={handleCopyInvite}
                  className="absolute right-2 text-brand-primary opacity-50 hover:opacity-100 p-2 cursor-pointer transition-all duration-150 active:scale-90"
                >
                  {copied ? <FaCheck className="text-emerald-400 text-[11px]" /> : <FaCopy className="text-[11px]" />}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5 w-full">
                <motion.button
                  whileTap={{ scale: 0.985 }}
                  onClick={handleShareInvite}
                  className="w-full bg-brand-primary text-brand-void py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-black tracking-[0.2em] cursor-pointer shadow-neon"
                >
                  <FaShareAlt size={11} />
                  <span>{tg('invite_on_telegram')}</span>
                </motion.button>

                {gameState.white_player_id === userId && (
                  <motion.button
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      const socket = getSocket();
                      socket.emit('abort_game', { game_id: gameId });
                    }}
                    className="w-full bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 hover:bg-brand-rose-opacity-20 text-rose-400 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-black tracking-widest cursor-pointer transition-all shadow-sm"
                  >
                    <span>{tg('cancel_refund_match')}</span>
                  </motion.button>
                )}
              </div>
            </div>

          </div>
          
          <div className="w-full text-center px-4">
            <p className="text-[10px] font-semibold text-brand-primary opacity-30 uppercase tracking-wider leading-relaxed">
              {tg('waiting_keep_open')}
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm flex flex-col items-center gap-5 mx-auto">

        {/* Opponent Widget */}
        <Card variant="glass" className={`w-full flex justify-between items-center px-4 py-4 transition-all duration-300 ${
          isOpponentTurn 
            ? 'border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-gradient-to-r from-purple-500/[0.02] to-transparent opacity-100' 
            : 'border-brand-border-opacity-10 opacity-60'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand-void border border-brand-border-opacity-10 flex items-center justify-center overflow-hidden">
              <PlayerAvatar 
                userId={opponentId} 
                fallbackText="?" 
                isBot={isBotGame} 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-brand-primary uppercase tracking-tight">
                {isBotGame 
                  ? tg('ai_combatant') 
                  : (isWhite ? gameState?.black_username : gameState?.white_username) || tg('opponent')}
              </span>
              {isOpponentTurn ? (
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                  {tg('thinking')}
                  <span className="inline-flex gap-0.5 ml-0.5">
                    <span className="w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </span>
              ) : (
                <span className="text-[10px] font-medium text-brand-primary opacity-30 uppercase tracking-[0.2em]">
                  {isBotGame 
                    ? tg('ai_engine') 
                    : `ELO ${(isWhite ? gameState?.black_elo : gameState?.white_elo) || 1000}`}
                </span>
              )}
            </div>
          </div>
          <div className={`px-3.5 py-1.5 min-w-[75px] text-center rounded-xl border transition-all duration-300 ${
            opponentTime < 5 ? 'bg-red-500/20 border-red-500/40 text-red-500 animate-pulse' :
            opponentTime < 15 ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
            'bg-brand-void/40 border-brand-border-opacity-10 text-brand-primary opacity-85'
          }`}>
            <span className="text-sm font-black tracking-tighter font-mono">
              {formatTime(opponentTime)}
            </span>
          </div>
        </Card>
      
        {/* Board Container */}
        <div className="w-full relative z-20 flex justify-center px-1">
          <div className="w-full p-2 rounded-3xl bg-brand-surface border border-brand-border-opacity-10 shadow-sm overflow-hidden aspect-square">
            <ChessBoardComponent
              fen={fen}
              onMove={handleBoardMove}
              orientation={isWhite ? "white" : "black"}
              showConfetti={isGameOver && gameState?.winner_id === userId}
              autoPromoteToQueen={autoPromote}
            />
          </div>
        </div>

        {/* Move History log */}
        {gameState?.move_history && gameState.move_history.length > 0 && (
          <div className="w-full overflow-hidden px-1">
            <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.2em] mb-1.5 pl-1 w-full text-left">
              <span>{tg('move_history')}</span>
            </div>
            <div 
              ref={moveHistoryRef}
              className="w-full overflow-x-auto flex items-center gap-1.5 pb-2 scrollbar-none scroll-smooth"
            >
              {getMovesSanList(gameState.move_history).map((movePair, idx) => (
                <div 
                  key={idx} 
                  className="shrink-0 flex items-center gap-1 bg-brand-surface border border-brand-border-opacity-10 rounded-lg px-2.5 py-1.5 shadow-sm text-[10px] font-bold text-brand-primary"
                >
                  <span className="opacity-45">{idx + 1}.</span>
                  <span>{movePair.white}</span>
                  {movePair.black && (
                    <>
                      <span className="opacity-25">•</span>
                      <span>{movePair.black}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      
        {/* Player Widget */}
        <Card variant="glass" className={`w-full flex justify-between items-center px-4 py-4 transition-all duration-300 ${
          isMyTurn 
            ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-gradient-to-r from-emerald-500/[0.02] to-transparent opacity-100' 
            : 'border-brand-border-opacity-10'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand-primary flex items-center justify-center shadow-sm overflow-hidden">
              <PlayerAvatar 
                userId={userId} 
                fallbackText={tg('you')} 
                textClassName="text-xs font-black text-brand-void uppercase tracking-tighter" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-brand-primary uppercase tracking-tight">
                {(isWhite ? gameState?.white_username : gameState?.black_username) || userStats?.first_name || "You"}
              </span>
              {isMyTurn ? (
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                  {tg('your_turn')}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </span>
              ) : (
                <span className="text-[10px] font-black text-brand-primary opacity-40 uppercase tracking-[0.2em]">
                  MASTER • ELO {(isWhite ? gameState?.white_elo : gameState?.black_elo) || userStats?.elo || 1200}
                </span>
              )}
            </div>
          </div>
          <div className={`px-3.5 py-1.5 min-w-[75px] text-center rounded-xl border transition-all duration-300 ${
            myTime < 5 ? 'bg-red-500/20 border-red-500/40 text-red-500 animate-pulse' :
            myTime < 15 ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
            'bg-brand-void/40 border-brand-border-opacity-10 text-brand-primary'
          }`}>
            <span className="text-sm font-black tracking-tighter font-mono">
              {formatTime(myTime)}
            </span>
          </div>
        </Card>

        {/* Action Bar */}
        {!isBotGame && !isGameOver && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={shareGame}
            className="w-full action-button py-[18px] rounded-2xl uppercase flex items-center justify-center gap-3 cursor-pointer shadow-sm"
          >
            {copied ? <FaCheck /> : <FaCopy />}
            <span>{copied ? "Sync Success" : "Establish Link"}</span>
          </motion.button>
        )}
      </div>
      )}

      {/* Premium Match Over Overlay Modal */}
      <AnimatePresence>
        {isGameOver && (
          <MatchOverModal
            matchResultLabel={matchResultLabel}
            resultColor={resultColor}
            eloChange={eloChange}
            netPayout={netPayout}
            wagerAmount={gameState?.wager_amount || 0}
            rematchStatus={rematchStatus}
            onShowRematchChoice={isBotGame ? startBotGameRevenge : () => setShowRematchChoice(true)}
            onShareGame={shareGame}
            newElo={myNewElo}
            copied={copied}
            xpGained={gameState ? (isWhite ? gameState.white_xp_gained : gameState.black_xp_gained) : undefined}
            isBotGame={isBotGame}
          />
        )}
      </AnimatePresence>

      {/* Rematch Choice Drawer */}
      <AnimatePresence>
        {showRematchChoice && (
          <RematchChoiceDrawer
            wagerAmount={gameState?.wager_amount || 0}
            onClose={() => setShowRematchChoice(false)}
            onSendRematchOffer={sendRematchOffer}
          />
        )}
      </AnimatePresence>

      {/* Incoming Rematch Challenge Drawer */}
      <AnimatePresence>
        {incomingRematch && (
          <IncomingRematchDrawer
            incomingRematch={incomingRematch}
            timeControl={gameState?.time_control_seconds || 600}
            onAccept={acceptRematch}
            onDecline={declineRematch}
          />
        )}
      </AnimatePresence>

      {/* Custom Confirmation Drawer */}
      <AnimatePresence>
        {confirmConfig && (
          <div className="bottom-drawer-backdrop z-[110]">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setConfirmConfig(null)}
              className="absolute inset-0 bg-[rgba(0,0,0,0.5)]" 
              style={{ touchAction: 'none' }}
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="bottom-drawer-sheet relative z-20"
            >
              <div className="bottom-drawer-handle" />
              
              <div className="flex flex-col items-center text-center mt-2">
                <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-brand-primary">
                  {confirmConfig.title}
                </h2>
                <p className="text-sm font-bold text-brand-primary opacity-65 uppercase tracking-wide mt-2 mb-6">
                  {confirmConfig.message}
                </p>
              </div>
              
              <div className="w-full flex flex-col gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    confirmConfig.onConfirm();
                    setConfirmConfig(null);
                  }}
                  className="w-full bg-brand-primary text-brand-void py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] cursor-pointer shadow-sm"
                >
                  <span>{confirmConfig.confirmText}</span>
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setConfirmConfig(null)}
                  className="w-full bg-brand-bg-opacity-10 border border-brand-border-opacity-20 text-brand-primary py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest cursor-pointer shadow-sm"
                >
                  <span>{confirmConfig.cancelText}</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Action Bar — replacing Navbar during match */}
      {!isGameOver && !isWaiting && (
        <motion.div
          initial={{ x: "-50%", y: 80, opacity: 0 }}
          animate={{ x: "-50%", y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{
            bottom: `calc(${isTelegramWeb ? '66px' : '16px'} + var(--app-safe-bottom))`
          }}
          className="fixed left-1/2 w-[92%] max-w-md z-50 flex gap-3 bg-brand-void backdrop-blur-3xl border border-brand-border-opacity-10 p-3 rounded-2xl shadow-premium"
        >
          {/* Resign Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleResign}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all cursor-pointer text-xs font-black uppercase tracking-widest shadow-sm"
          >
            <FaFlag size={12} />
            <span>{tg('resign')}</span>
          </motion.button>

          {/* Offer Draw Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOfferDraw}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-brand-border-opacity-10 bg-brand-surface hover:bg-brand-bg-opacity-5 hover:border-brand-border-opacity-25 text-brand-primary transition-all cursor-pointer text-xs font-black uppercase tracking-widest shadow-sm"
          >
            <FaHandshake size={14} />
            <span>{tg('offer_draw')}</span>
          </motion.button>
        </motion.div>
      )}

      {showCrashOverlay && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-void/80 p-6 backdrop-blur-md" role="alertdialog" aria-modal="true" aria-labelledby="game-crashed-title">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-2xl border border-brand-border-opacity-10 bg-brand-surface p-6 shadow-2xl flex flex-col items-center text-center gap-4"
          >
            {/* Warning Icon with pulse */}
            <div className="relative w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 animate-pulse">
              <span className="text-3xl font-black">⚠️</span>
            </div>
            
            <h2 id="game-crashed-title" className="text-lg font-black uppercase tracking-wider text-brand-primary">
              {tg('game_crashed')}
            </h2>
            
            <p className="text-xs text-brand-primary opacity-60 leading-relaxed px-2">
              {tg('game_crashed_desc')}
            </p>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
              className="w-full mt-2 py-3.5 rounded-xl bg-brand-primary text-brand-void font-black text-xs uppercase tracking-widest hover:opacity-90 shadow-md cursor-pointer transition-all"
            >
              {tg('reload_game_btn')}
            </motion.button>
          </motion.div>
        </div>
      )}
    </LayoutWrapper>
  );
}
