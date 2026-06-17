import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaCopy, FaCheck, FaRobot, FaFlag, FaHandshake } from 'react-icons/fa';

import LayoutWrapper from '@/components/LayoutWrapper';
import ChessBoardComponent from '@/components/game/ChessBoard';
import MatchOverModal from '@/components/game/MatchOverModal';
import RematchChoiceDrawer from '@/components/game/RematchChoiceDrawer';
import IncomingRematchDrawer from '@/components/game/IncomingRematchDrawer';

import { useGameSocket } from '@/hooks/useGameSocket';
import { useAudioSynth } from '@/hooks/useAudioSynth';
import { useChessClock } from '@/hooks/useChessClock';
import { useNavbarHide } from '@/context/NavbarContext';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { telegramConfirm, telegramHaptic } from '@/lib/telegram';

interface ActiveGameProps {
  gameId: string;
}

export default function ActiveGame({ gameId }: ActiveGameProps) {
  const router = useRouter();
  const locale = useLocale();
  const tg = useTranslations('Game');
  const tIndex = useTranslations('Index');

  const { playTickSound } = useAudioSynth();
  // @ts-ignore
  const { fen, makeMove, isConnected, error, gameState } = useGameSocket(gameId);

  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<any>(null);

  const [showRematchChoice, setShowRematchChoice] = useState<boolean>(false);
  const [rematchStatus, setRematchStatus] = useState<'idle' | 'offered_by_me' | 'waiting'>('idle');
  const [incomingRematch, setIncomingRematch] = useState<any>(null);

  const isWhite = gameState ? gameState.white_player_id === userId : true;

  // Initialize Telegram User ID on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        setUserId(window.Telegram.WebApp.initDataUnsafe.user.id);
      } else if (process.env.NODE_ENV === 'development') {
        setUserId(123456789);
      }
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

  // Sync wallet balance on game completion, play warning indicators
  useEffect(() => {
    if (gameState?.is_game_over) {
      apiFetch("/api/v1/wallet/balance")
        .then(res => {
          if (res.ok) {
            console.log("Platform balance synced after game completion.");
          }
        })
        .catch(() => {});

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

  // Socket draw / rematch event handlers
  useEffect(() => {
    if (!gameState) return;
    const socket = getSocket();
    
    const onDrawOffered = (data: { game_id: string; offered_by: number }) => {
      if (data.offered_by !== userId) {
        telegramConfirm("Your opponent has offered a draw. Do you accept?", (accepted) => {
          if (accepted) {
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

  const handleBoardMove = (move: { from: string; to: string; promotion?: string }): boolean => {
    const success = makeMove(move);
    telegramHaptic('light');
    return success;
  };

  const sendRematchOffer = (doubleStakes: boolean) => {
    const socket = getSocket();
    socket.emit("offer_rematch", { game_id: gameId, double_stakes: doubleStakes });
    setShowRematchChoice(false);
    setRematchStatus('waiting');
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
    telegramConfirm("Are you sure you want to resign this match?", (confirmed) => {
      if (confirmed) {
        const socket = getSocket();
        socket.emit("resign", { game_id: gameId });
      }
    });
  };

  const handleOfferDraw = () => {
    telegramConfirm("Offer a draw to your opponent?", (confirmed) => {
      if (confirmed) {
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

    const playSound = (soundName: string) => {
      try {
        const audio = new Audio(`/sounds/${soundName}.mp3`);
        audio.play().catch(() => {});
      } catch (e) {}
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
      } else {
        const getPieceCount = (f: string) => f.split(' ')[0].replace(/[^a-zA-Z]/g, '').length;
        if (getPieceCount(currentFen) < getPieceCount(prevFenRef.current)) {
          playSound('capture');
        } else {
          playSound('move');
        }
      }
    }

    prevFenRef.current = currentFen;
    prevStatusRef.current = currentStatus;
  }, [gameState, userId]);

  const shareGame = () => {
    let success = false;
    if (window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.switchInlineQuery(gameId, ["users", "groups", "channels"]);
        success = true;
      } catch (err) {
        console.warn("Telegram switchInlineQuery failed", err);
      }
    }
    if (!success) {
      const link = typeof window !== 'undefined' ? window.location.href : "";
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isBotGame = gameState?.black_player_id === -1;
  const isGameOver = gameState?.is_game_over || gameState?.status === 'completed' || gameState?.status === 'aborted';

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
        : (gameState.wager_amount * 2) * 0.97;
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

  return (
    <LayoutWrapper className="pb-12">
      {/* Header / Nav */}
      <div className="w-full max-w-sm flex justify-between items-center mb-6 relative z-10 px-2 mt-2 mx-auto">
        <div className="flex items-center gap-3">
          {!isGameOver ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleResign}
              className="text-brand-primary opacity-45 hover:opacity-100 transition-opacity flex items-center cursor-pointer bg-transparent border-0 p-2 -ml-2"
            >
              <FaArrowLeft size={16} />
            </motion.button>
          ) : (
            <Link href={`/${locale}/home`}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="text-brand-primary opacity-45 hover:opacity-100 transition-opacity flex items-center cursor-pointer p-2 -ml-2"
              >
                <FaArrowLeft size={16} />
              </motion.button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 bg-brand-surface px-3 py-1 rounded-full border border-brand-border-opacity-10 shadow-sm">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-[9px] font-bold tracking-[0.2em] text-brand-primary opacity-60 uppercase">
            {isConnected ? tg('active_sync') : tg('isolated')}
          </span>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[90vw] max-w-[280px]"
        >
          <div className="p-3 rounded-2xl border border-red-500/20 bg-brand-surface/95 backdrop-blur-xl shadow-premium text-center pointer-events-auto">
            <span className="text-[8px] font-black text-red-500 uppercase tracking-widest block mb-0.5">System Warning</span>
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wide leading-tight">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Main Game Area */}
      <div className="w-full max-w-sm flex flex-col items-center gap-5 mx-auto">

        {/* Opponent Widget */}
        <div className="w-full flex justify-between items-center px-4 py-4 glass-panel bg-brand-surface border border-brand-border-opacity-10 opacity-70">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand-void border border-brand-border-opacity-10 flex items-center justify-center overflow-hidden">
              {isBotGame ? (
                <FaRobot className="text-xl text-brand-primary opacity-40" />
              ) : (
                <span className="text-xl font-bold text-brand-primary opacity-20">?</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-brand-primary uppercase tracking-tight">
                {isBotGame 
                  ? tg('ai_combatant') 
                  : (isWhite ? gameState?.black_username : gameState?.white_username) || tg('opponent')}
              </span>
              <span className="text-[10px] font-medium text-brand-primary opacity-30 uppercase tracking-[0.2em]">
                {isBotGame 
                  ? tg('ai_engine') 
                  : `ELO ${(isWhite ? gameState?.black_elo : gameState?.white_elo) || 1000}`}
              </span>
            </div>
          </div>
          <div className={`text-xl font-black tracking-tighter ${opponentTime < 20 ? (opponentTime < 10 ? 'text-red-500 animate-pulse' : 'text-red-500') : 'text-brand-primary opacity-60'}`}>
            {formatTime(opponentTime)}
          </div>
        </div>
      
        {/* Board Container */}
        <div className="w-full relative z-20 flex justify-center px-1">
          <div className="w-full p-2 rounded-3xl bg-brand-surface border border-brand-border-opacity-10 shadow-sm overflow-hidden aspect-square">
            <ChessBoardComponent
              fen={fen}
              onMove={handleBoardMove}
              orientation={isWhite ? "white" : "black"}
              showConfetti={isGameOver && gameState?.winner_id === userId}
            />
          </div>
        </div>
      
        {/* Player Widget */}
        <div className="w-full flex justify-between items-center px-4 py-4 glass-panel border border-brand-border-opacity-10 bg-brand-surface">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand-primary flex items-center justify-center shadow-sm">
              <span className="text-xs font-black text-brand-void uppercase tracking-tighter">{tg('you')}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-brand-primary uppercase tracking-tight">
                {(isWhite ? gameState?.white_username : gameState?.black_username) || userStats?.first_name || "You"}
              </span>
              <span className="text-[10px] font-black text-brand-primary opacity-40 uppercase tracking-[0.2em]">
                MASTER • ELO {(isWhite ? gameState?.white_elo : gameState?.black_elo) || userStats?.elo || 1200}
              </span>
            </div>
          </div>
          <div className={`text-xl font-black tracking-tighter ${myTime < 20 ? (myTime < 10 ? 'text-red-500 animate-pulse' : 'text-red-500') : 'text-brand-primary'}`}>
            {formatTime(myTime)}
          </div>
        </div>

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
            onShowRematchChoice={() => setShowRematchChoice(true)}
            onShareGame={shareGame}
            newElo={myNewElo}
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
            onAccept={acceptRematch}
            onDecline={declineRematch}
          />
        )}
      </AnimatePresence>

      {/* Bottom Action Bar — replacing Navbar during match */}
      {!isGameOver && (
        <motion.div
          initial={{ x: "-50%", y: 80, opacity: 0 }}
          animate={{ x: "-50%", y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed bottom-[calc(16px+var(--tg-content-safe-area-inset-bottom,var(--tg-safe-area-inset-bottom,0px)))] left-1/2 w-[92%] max-w-md z-50 flex gap-3 bg-brand-void backdrop-blur-3xl border border-brand-border-opacity-10 p-3 rounded-2xl shadow-premium"
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

          {/* Offer Draw Button — hidden for bot games */}
          {!isBotGame && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOfferDraw}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-brand-border-opacity-10 bg-brand-surface hover:bg-brand-bg-opacity-5 hover:border-brand-border-opacity-25 text-brand-primary transition-all cursor-pointer text-xs font-black uppercase tracking-widest shadow-sm"
            >
              <FaHandshake size={14} />
              <span>{tg('offer_draw')}</span>
            </motion.button>
          )}
        </motion.div>
      )}
    </LayoutWrapper>
  );
}
