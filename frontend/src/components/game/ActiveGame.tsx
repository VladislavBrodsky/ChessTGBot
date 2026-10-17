import { friendInvitationLink, mainMiniAppLink, shareInvitation } from '@/lib/invitations';
import { gameResultSummary } from '@/lib/gameResult';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaCopy, FaCheck, FaChessKnight } from 'react-icons/fa';

import LayoutWrapper from '@/components/LayoutWrapper';
import ChessBoardComponent from '@/components/game/ChessBoard';
import { opponentIdentity } from '@/lib/opponentIdentity';
import MatchOverModal from '@/components/game/MatchOverModal';
import RematchChoiceDrawer from '@/components/game/RematchChoiceDrawer';
import IncomingRematchDrawer from '@/components/game/IncomingRematchDrawer';

import { useGameSocket } from '@/hooks/useGameSocket';
import { useAudioSynth } from '@/hooks/useAudioSynth';
import { useAudio } from '@/hooks/useAudio';
import { useNavbarHide } from '@/context/NavbarContext';
import { apiFetch } from '@/lib/api';
import { requestBotRevengeGame } from '@/lib/botRevenge';
import { getSocket } from '@/lib/socket';
import { telegramHaptic } from '@/lib/telegram';
import { copyToClipboard } from '@/lib/clipboard';

import {
  GamePlayerCard,
  WaitingOpponentCard,
  MoveHistoryRail,
  GameActionBar,
  ConfirmActionDrawer,
  GameCrashOverlay,
  getMovesSanList,
} from './active';

interface ActiveGameProps {
  gameId: string;
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
  const [actionTrayFootprint, setActionTrayFootprint] = useState<number | null>(null);
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
  const [questClaimable, setQuestClaimable] = useState<boolean>(false);
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

  // Bot-revenge guards. startBotGameRevenge is a fire-and-forget create+navigate;
  // without these a slow/failed create strands the modal in "creating match..."
  // and a late resolution can router.push() after the user already left (e.g.
  // tapped "To Lobby"), yanking them back into a game.
  const revengeInFlightRef = useRef(false);
  const revengeAbortRef = useRef<AbortController | null>(null);
  const isUnmountedRef = useRef(false);
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      // Cancel any in-flight revenge create so it can't navigate post-unmount.
      revengeAbortRef.current?.abort();
    };
  }, []);

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

  const triggerClocksWarnings = useCallback((timeLeft: number) => {
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
  }, [playTickSound]);

  const isMyTurn = gameState && !gameState.is_game_over && gameState.turn === (isWhite ? 'w' : 'b');
  const isOpponentTurn = gameState && !gameState.is_game_over && gameState.turn !== (isWhite ? 'w' : 'b');
  const sanMoveHistory = useMemo(() => getMovesSanList(gameState?.move_history || []), [gameState?.move_history]);
  // Declared here (not just before its later usages) because the "check notification"
  // effect below references it in its dependency array; a `const` declared further
  // down in this same component scope would throw "Cannot access before
  // initialization" (TDZ) the moment that effect's deps are evaluated during render.
  const isGameOver = gameState?.is_game_over || gameState?.status === 'completed' || gameState?.status === 'aborted';

  // Guard refs to strictly execute game-over side effects only ONCE per match ID
  const handledGameOverSoundRef = useRef<string | null>(null);
  const handledGameOverSyncRef = useRef<string | null>(null);
  const handledAbortedRedirectRef = useRef<string | null>(null);

  // Sync wallet balance and user stats on game completion exactly once
  useEffect(() => {
    if (gameState?.is_game_over && gameState.id && handledGameOverSyncRef.current !== gameState.id) {
      handledGameOverSyncRef.current = gameState.id;

      apiFetch("/api/v1/wallet/balance")
        .then(res => {
          if (res.ok) {
            console.log("Platform balance synced after game completion.");
          }
        })
        .catch(() => {});

      if (userId) {
        apiFetch(`/api/v1/users/${userId}`)
          .then(res => (res.ok ? res.json() : null))
          .then(data => {
            if (data) {
              setUserStats(data);
            }
          })
          .catch(() => {});

        apiFetch('/api/v1/gamification/engagement/status')
          .then(res => (res.ok ? res.json() : null))
          .then(data => {
            if (data && data.state === 'claimable') {
              setQuestClaimable(true);
            }
          })
          .catch(() => {});
      }
    }
  }, [gameState?.is_game_over, gameState?.id, userId]);

  // Trigger tactile haptics & audio cues on game over exactly once
  useEffect(() => {
    if (gameState?.is_game_over && gameState.id && handledGameOverSoundRef.current !== gameState.id) {
      handledGameOverSoundRef.current = gameState.id;

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
  }, [gameState?.is_game_over, gameState?.id, gameState?.result_type, gameState?.winner_id, userId, playTickSound]);

  // Redirect back if game is aborted and opponent never joined (exactly once)
  useEffect(() => {
    if (
      gameState?.is_game_over &&
      gameState.id &&
      gameState?.result_type === 'aborted' &&
      !gameState?.black_player_id &&
      handledAbortedRedirectRef.current !== gameState.id
    ) {
      handledAbortedRedirectRef.current = gameState.id;
      telegramHaptic('warning');
      router.push(`/${locale}/home`);
    }
  }, [gameState?.is_game_over, gameState?.id, gameState?.result_type, gameState?.black_player_id, locale, router]);

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
  }, [gameId, userId, gameState, locale, router, tg]);

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
    // Ignore repeat taps while a create is already in flight.
    if (revengeInFlightRef.current) return;
    revengeInFlightRef.current = true;
    setRematchStatus('waiting');

    // Bound the wait: on a slow mobile connection the raw fetch could hang for
    // ~20s. Abort sooner so the user gets a retryable error instead of a modal
    // stuck forever on "creating match...".
    const controller = new AbortController();
    revengeAbortRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      const result = await requestBotRevengeGame(
        {
          timeControl: gameState?.time_control_seconds || 600,
          difficulty: gameState?.difficulty || "medium",
        },
        { signal: controller.signal },
      );
      // The user may have left (To Lobby) while the create was in flight — the
      // component is unmounted and its AbortController fired. Do not navigate or
      // set state: that would yank them out of wherever they went.
      if (isUnmountedRef.current) return;
      if (result.ok) {
        // Leave rematchStatus='waiting'; this instance unmounts as the new game
        // mounts (the page keys ActiveGame by gameId).
        router.push(`/${locale}/game?id=${result.gameId}`);
      } else {
        console.error("Failed to create computer revenge game");
        revengeInFlightRef.current = false;
        setRematchStatus('idle');
        setGameNotice({ type: 'error', message: tg('revenge_failed') });
        telegramHaptic('error');
      }
    } finally {
      window.clearTimeout(timeoutId);
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

  const botUsername = userStats?.bot_username || "chess_matbot";
  const inviteStart = gameState?.invite_token ? `go_${gameState.invite_token}` : gameId;
  const inviteLink = mainMiniAppLink(botUsername, inviteStart);

  const handleShareInvite = () => {
    const shareText = (gameState?.bid_amount || 0) > 0
      ? tg('friend_share_staked', { amount: ((gameState.bid_amount || 0) / 100).toFixed(2) })
      : tg('friend_share_free');
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

  // Once both players are in, there is nothing left to join and no spectator view (the server
  // refuses non-players), and the page URL opens outside Telegram. The in-game and result
  // shares send the player's personal invitation instead, so a friend can ask for the next game.
  const friendInviteLink = friendInvitationLink(botUsername, userStats?.referral_code);
  const shareFriendInvite = (shareText: string) => {
    if (!friendInviteLink) return;
    telegramHaptic('selection');
    shareInvitation(friendInviteLink, shareText);

    // Copy to clipboard as backup / confirmation
    copyToClipboard(friendInviteLink).then((ok) => {
      if (!ok) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isBotGame = gameState?.black_player_id === -1;
  const isWaiting = gameState && !isBotGame && !gameState.black_player_id;

  // The opponent is shown as what it is: the real player, or the practice engine with its level. No generated persona.
  const opponent = opponentIdentity(gameState, isWhite, { aiCoach: tg('ai_coach'), opponent: tg('opponent'), level: { easy: tg('ai_easy'), medium: tg('ai_medium'), hard: tg('ai_hard') } });

  // Toggle Navbar — hide completely for the entire active game match lifecycle
  const { hideNavbar, showNavbar } = useNavbarHide();
  useEffect(() => {
    hideNavbar();
    return () => { showNavbar(); };
  }, [hideNavbar, showNavbar]);

  // Settlement values and styling use the structured server outcome in every locale.
  const summary = gameState && userId !== null ? gameResultSummary(gameState, userId) : null;
  const outcome = summary?.outcome ?? 'draw';
  const matchResultLabel = outcome === 'aborted' ? tg('match_aborted') : outcome === 'draw' ? tg('protocol_draw')
    : outcome === 'win' ? tg(gameState?.result_type === 'timeout' ? 'won_on_time' : 'victory_secured')
    : tg(gameState?.result_type === 'timeout' ? 'lost_on_time' : 'tactical_defeat');
  const resultColor = outcome === 'win' ? 'text-brand-success' : outcome === 'loss' ? 'text-brand-danger' : 'text-brand-muted';
  const change = summary?.eloChange;
  const eloChange = change === undefined ? undefined : `${change >= 0 ? '+' : ''}${change}`;
  const netPayout = summary?.payout ?? null;
  const myNewElo = summary?.newElo;

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
          <span className="text-caption font-semibold normal-case tracking-normal text-brand-muted animate-pulse">
            {tg('synchronizing_arena')}
          </span>
        </div>
      </LayoutWrapper>
    );
  }

  // The fixed Resign/Draw tray covers the bottom of the screen during play; the content pads by its measured footprint.
  const showActionTray = !isGameOver && !isWaiting;

  return (
    <LayoutWrapper
      className={showActionTray ? 'app-content--action-tray' : ''}
      contentStyle={showActionTray && actionTrayFootprint !== null
        ? { '--action-tray-space': `${actionTrayFootprint}px` } as React.CSSProperties
        : undefined}
    >
      {/* Header / Nav */}
      <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl flex justify-between items-center mb-4 relative z-10 px-2 mt-2 mx-auto">
        <div className="flex items-center gap-3">
          {isGameOver && !isTelegram && (
            <Link href={`/${locale}/home`}>
              <motion.button aria-label="Back" type="button"
                whileTap={{ scale: 0.95 }}
                className="ui-tap-target text-brand-muted hover:opacity-100 transition-opacity flex items-center cursor-pointer p-2 -ml-2"
              >
                <FaArrowLeft size={16} />
              </motion.button>
            </Link>
          )}
          {!isGameOver && (
            <button type="button"
              onClick={handleToggleAutoPromote}
              className={`ui-tap-target flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer ${
                autoPromote 
                  ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' 
                  : 'bg-brand-surface border-brand-border-opacity-10 text-brand-muted'
              }`}
            >
              <span className="text-caption font-semibold normal-case tracking-normal">
                {tg('auto_queen')}
              </span>
              <div className={`w-2 h-2 rounded-full ${autoPromote ? 'bg-brand-primary animate-pulse' : 'bg-brand-primary/30'}`} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 bg-brand-surface px-3 py-1 rounded-full border border-brand-border-opacity-10 shadow-sm">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-caption font-bold tracking-normal text-brand-muted normal-case">
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
              <span className="text-caption font-semibold normal-case tracking-normal block mb-1">
                {gameNotice.type === 'error'
                  ? tg('notice_attention')
                  : gameNotice.type === 'warning'
                  ? tg('notice_warning')
                  : tg('notice_info')}
              </span>
              <span className="text-caption font-semibold normal-case tracking-normal leading-tight block">
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
            <span className="text-caption font-semibold text-red-500 normal-case tracking-normal block mb-0.5">{tg('system_warning')}</span>
            <span className="text-caption font-bold text-brand-primary normal-case tracking-normal leading-tight">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Main Game Area */}
      {isWaiting ? (
        <WaitingOpponentCard
          gameState={gameState}
          userId={userId}
          gameId={gameId}
          inviteLink={inviteLink}
          copied={copied}
          onCopyInvite={handleCopyInvite}
          onShareInvite={handleShareInvite}
          onAbortGame={() => {
            const socket = getSocket();
            socket.emit('abort_game', { game_id: gameId });
          }}
          tWaitingOpponentTitle={tg('waiting_opponent_title')}
          tShareInviteHint={tg('share_invite_hint')}
          tWagerTier={tg('wager_tier')}
          tFreeMatch={tg('free_match')}
          tTimeControl={tg('time_control')}
          tInviteOnTelegram={tg('invite_on_telegram')}
          tCancelRefundMatch={tg('cancel_refund_match')}
          tWaitingKeepOpen={tg('waiting_keep_open')}
        />
      ) : (
        <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl flex flex-col items-center gap-4 mx-auto">
          {/* Opponent HUD Card */}
          <GamePlayerCard
            userId={opponentId}
            username={opponent.name}
            eloText={opponent.detail}
            isTurn={isOpponentTurn}
            turnLabel={tg('thinking')}
            isWhite={isWhite}
            isBot={opponent.isBot}
            gameState={gameState}
            onClockWarning={triggerClocksWarnings}
          />

          {/* Board Container */}
          <div className="w-full relative z-20 flex justify-center px-1">
            <div className={`board-frame w-full p-2 rounded-3xl overflow-hidden aspect-square ${isMyTurn ? 'board-frame--turn' : ''}`}>
              <ChessBoardComponent
                fen={fen}
                onMove={handleBoardMove}
                orientation={isWhite ? "white" : "black"}
                showConfetti={isGameOver && gameState?.winner_id === userId}
                autoPromoteToQueen={autoPromote}
              />
            </div>
          </div>

          {/* Move History Rail */}
          <MoveHistoryRail
            sanMoveHistory={sanMoveHistory}
            moveHistoryRef={moveHistoryRef}
            title={tg('move_history')}
          />

          {/* Current Player HUD Card */}
          <GamePlayerCard
            isMe
            userId={userId}
            username={(isWhite ? gameState?.white_username : gameState?.black_username) || userStats?.first_name || "You"}
            eloText={`ELO ${(isWhite ? gameState?.white_elo : gameState?.black_elo) || userStats?.elo || '—'}`}
            isTurn={isMyTurn}
            turnLabel={tg('your_turn')}
            isWhite={isWhite}
            gameState={gameState}
            onClockWarning={triggerClocksWarnings}
          />

          {/* Action Bar */}
          {!isBotGame && !isGameOver && friendInviteLink && (
            <motion.button type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => shareFriendInvite(tg('share_text_live'))}
              className="ui-tap-target w-full action-button py-[18px] rounded-2xl normal-case flex items-center justify-center gap-3 cursor-pointer shadow-sm"
            >
              {copied ? <FaCheck /> : <FaCopy />}
              <span>{copied ? tg('invite_link_copied') : tg('invite_friend_next')}</span>
            </motion.button>
          )}
        </div>
      )}

      {/* Premium Match Over Overlay Modal */}
      <AnimatePresence>
        {isGameOver && (
          <MatchOverModal
            outcome={outcome}
            matchResultLabel={matchResultLabel}
            resultColor={resultColor}
            eloChange={eloChange}
            netPayout={netPayout}
            wagerAmount={gameState?.wager_amount || 0}
            rematchStatus={rematchStatus}
            onShowRematchChoice={isBotGame ? startBotGameRevenge : () => setShowRematchChoice(true)}
            onShareGame={friendInviteLink
              ? () => shareFriendInvite(tg(outcome === 'win' && !isBotGame ? 'share_text_won' : 'share_text_played'))
              : undefined}
            newElo={myNewElo}
            copied={copied}
            xpGained={gameState ? (isWhite ? gameState.white_xp_gained : gameState.black_xp_gained) : undefined}
            isBotGame={isBotGame}
            questClaimable={questClaimable}
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
      <ConfirmActionDrawer
        confirmConfig={confirmConfig}
        onClose={() => setConfirmConfig(null)}
      />

      {/* Bottom Action Bar — replacing Navbar during match */}
      {showActionTray && (
        <GameActionBar
          isTelegramWeb={isTelegramWeb}
          onFootprintChange={setActionTrayFootprint}
          onResign={handleResign}
          onOfferDraw={handleOfferDraw}
          tResign={tg('resign')}
          tOfferDraw={tg('offer_draw')}
        />
      )}

      {/* Fatal Game Crash Overlay */}
      <GameCrashOverlay
        show={showCrashOverlay}
        tGameCrashed={tg('game_crashed')}
        tGameCrashedDesc={tg('game_crashed_desc')}
        tReloadGameBtn={tg('reload_game_btn')}
      />
    </LayoutWrapper>
  );
}
