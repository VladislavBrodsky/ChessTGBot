'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import ChessBoardComponent from "@/components/game/ChessBoard";
import { useGameSocket } from "@/hooks/useGameSocket";
import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { 
 FaArrowLeft, FaCopy, FaCheck, FaRobot, FaShareAlt, 
 FaRedo, FaWallet, FaChessKnight, FaChessPawn, FaTimes, 
 FaTrophy, FaStar, FaCrown, FaCoins 
} from "react-icons/fa";
import { useLocale, useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import WalletConnect from "@/components/WalletConnect";
import { telegramConfirm, telegramHaptic } from "@/lib/telegram";
import { useNavbarHide } from "@/context/NavbarContext";

import MatchOverModal from "@/components/game/MatchOverModal";
import RematchChoiceDrawer from "@/components/game/RematchChoiceDrawer";
import IncomingRematchDrawer from "@/components/game/IncomingRematchDrawer";
import FriendInviteDrawer from "@/components/game/FriendInviteDrawer";
import LobbyDepositDrawer from "@/components/game/LobbyDepositDrawer";
import RakeInfoDrawer from "@/components/game/RakeInfoDrawer";

interface ActiveGameProps {
 gameId: string;
}

function ActiveGame({ gameId }: ActiveGameProps) {
 const router = useRouter();
 // @ts-ignore
 const { fen, makeMove, isConnected, error, gameState } = useGameSocket(gameId);
 const handleBoardMove = (move: { from: string; to: string; promotion?: string }): boolean => {
   const success = makeMove(move);
   telegramHaptic('light');
   return success;
 };
 const [copied, setCopied] = useState(false);
 const [userId, setUserId] = useState<number | null>(null);
  const locale = useLocale();
  const tg = useTranslations('Game');
  const tIndex = useTranslations('Index');

  const [showRematchChoice, setShowRematchChoice] = useState<boolean>(false);
  const [rematchStatus, setRematchStatus] = useState<'idle' | 'offered_by_me' | 'waiting'>('idle');
  const [incomingRematch, setIncomingRematch] = useState<any>(null);

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

  const [whiteTime, setWhiteTime] = useState<number>(600);
  const [blackTime, setBlackTime] = useState<number>(600);

  useEffect(() => {
    if (gameState) {
      setWhiteTime(Math.ceil(gameState.white_time_left ?? 600));
      setBlackTime(Math.ceil(gameState.black_time_left ?? 600));
    }
  }, [gameState]);

  const turnRef = useRef(gameState?.turn);
  const isGameOverRef = useRef(gameState?.is_game_over);

  useEffect(() => {
    turnRef.current = gameState?.turn;
    isGameOverRef.current = gameState?.is_game_over;
  }, [gameState]);

  useEffect(() => {
    if (!gameState || gameState.is_game_over) return;

    const interval = setInterval(() => {
      if (isGameOverRef.current) return;
      if (turnRef.current === 'w') {
        setWhiteTime((prev) => Math.max(0, prev - 1));
      } else {
        setBlackTime((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.is_game_over, !gameState]);

  useEffect(() => {
    if (gameState?.is_game_over) {
      apiFetch("/api/v1/wallet/balance")
        .then(res => {
          if (res.ok) {
            console.log("Platform balance synced after game completion.");
          }
        })
        .catch(() => {});
    }
  }, [gameState?.is_game_over]);

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
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWhite = gameState ? gameState.white_player_id === userId : true;
  const myTime = isWhite ? whiteTime : blackTime;
  const opponentTime = isWhite ? blackTime : whiteTime;

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        setUserId(window.Telegram.WebApp.initDataUnsafe.user.id);
      } else if (process.env.NODE_ENV === 'development') {
        setUserId(123456789);
      }
    }
  }, []);

  const prevFenRef = useRef<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);

 // Immersive Chess SFX Engine
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

  // Share / Copy Game Link
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

 // Hide the bottom navbar whenever the game-over modal is showing
 const { hideNavbar, showNavbar } = useNavbarHide();
 useEffect(() => {
   if (isGameOver) {
     hideNavbar();
   } else {
     showNavbar();
   }
   // Restore navbar when this component unmounts
   return () => { showNavbar(); };
 }, [isGameOver]); // eslint-disable-line react-hooks/exhaustive-deps
 
 // Match Over Logic
 let matchResultLabel = tg('protocol_draw');
 let resultColor = "text-brand-primary opacity-60"; 
 let eloChange = "+0";
 let netPayout = gameState?.wager_amount || 0;
 
 if (isGameOver && gameState) {
 if (gameState.winner_id === userId) {
 matchResultLabel = tg('victory_secured');
 resultColor = "text-brand-primary font-black"; 
 eloChange = "+15";
 netPayout = (gameState.wager_amount * 2) * 0.97; // 3% platform commission
 } else if (gameState.winner_id && gameState.winner_id !== userId) {
 matchResultLabel = tg('tactical_defeat');
 resultColor = "text-brand-primary opacity-80"; 
 eloChange = "-12";
 netPayout = 0;
 } else if (!gameState.winner_id) {
 matchResultLabel = tg('protocol_draw');
 resultColor = "text-brand-primary opacity-60";
 eloChange = "+0";
 netPayout = gameState.wager_amount; // Refund
 }
 }

 return (
 <LayoutWrapper className="pb-12">
  {/* Header / Nav */}
  <div className="w-full max-w-sm flex justify-between items-center mb-6 relative z-10 px-2 mt-2 mx-auto">
  <div className="flex items-center gap-3">
  {!isGameOver ? (
    <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={handleResign}
    className="text-brand-primary opacity-45 hover:opacity-100 transition-opacity flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer bg-transparent border-0"
    >
    <FaArrowLeft />
    <span>{tg('resign')}</span>
    </motion.button>
  ) : (
    <Link href={`/${locale}/home`}>
      <motion.button
      whileTap={{ scale: 0.95 }}
      className="text-brand-primary opacity-45 hover:opacity-100 transition-opacity flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer"
      >
      <FaArrowLeft />
      <span>{tIndex('back')}</span>
      </motion.button>
    </Link>
  )}
  
  {!isBotGame && !isGameOver && (
    <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={handleOfferDraw}
    className="text-brand-primary opacity-45 hover:opacity-100 transition-opacity text-[10px] font-bold uppercase tracking-widest cursor-pointer ml-4 bg-transparent border-0"
    >
    <span>Draw</span>
    </motion.button>
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
  {isBotGame ? tg('ai_combatant') : tg('opponent')}
  </span>
  <span className="text-[10px] font-medium text-brand-primary opacity-30 uppercase tracking-[0.2em]">
  {isBotGame ? tg('ai_engine') : tg('opponent_rank')}
  </span>
  </div>
  </div>
  <div className={`text-xl font-black tracking-tighter ${opponentTime < 30 ? 'text-red-500 animate-pulse' : 'text-brand-primary opacity-60'}`}>
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
  <span className="text-xs font-black text-brand-void uppercase tracking-tighter ">{tg('you')}</span>
  </div>
  <div className="flex flex-col">
  <span className="text-xs font-bold text-brand-primary uppercase tracking-tight">Protagonist</span>
  <span className="text-[10px] font-black text-brand-primary opacity-40 uppercase tracking-[0.2em]">MASTER • 1200</span>
  </div>
  </div>
  <div className={`text-xl font-black tracking-tighter ${myTime < 30 ? 'text-red-500 animate-pulse' : 'text-brand-primary'}`}>
    {formatTime(myTime)}
  </div>
  </div>

 {/* Action Bar */}
 {!isBotGame && !isGameOver && (
 <motion.button
 whileHover={{ scale: 1.01 }}
 whileTap={{ scale: 0.99 }}
 onClick={shareGame}
 className="w-full action-button py-4.5 rounded-2xl uppercase flex items-center justify-center gap-3 cursor-pointer shadow-sm"
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
  </LayoutWrapper>
 );
}

function PlayLobby() {
 const t = useTranslations('Index');
 const tg = useTranslations('Game');
 const tw = useTranslations('Wallet');
 const locale = useLocale();
 const router = useRouter();
 const [tgUser, setTgUser] = useState<any>(null);
 const [walletBalance, setWalletBalance] = useState<number>(0);

 // Matchmaking configs
 const [selectedWager, setSelectedWager] = useState<number>(100); // in cents
 const [customWagerInput, setCustomWagerInput] = useState<string>("1.00");
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
 const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Quick Top-up states
  const [showDepositDrawer, setShowDepositDrawer] = useState<boolean>(false);

 // Refs for scroll container alignment
 const wagerScrollRef = useRef<HTMLDivElement>(null);
 const timeScrollRef = useRef<HTMLDivElement>(null);
 const submittingRef = useRef<boolean>(false);

 // Smoothly center selected wager item in scroll view
 useEffect(() => {
   if (!wagerScrollRef.current) return;
   const activeEl = wagerScrollRef.current.querySelector('[data-active="true"]');
   if (activeEl) {
     activeEl.scrollIntoView({
       behavior: 'smooth',
       block: 'nearest',
       inline: 'center'
     });
   }
 }, [selectedWager, isCustomWager]);

 // Smoothly center selected time control item in scroll view
 useEffect(() => {
   if (!timeScrollRef.current) return;
   const activeEl = timeScrollRef.current.querySelector('[data-active="true"]');
   if (activeEl) {
     activeEl.scrollIntoView({
       behavior: 'smooth',
       block: 'nearest',
       inline: 'center'
     });
   }
 }, [timeControl]);

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

  const syncBalance = useCallback(async () => {
    try {
      const res = await apiFetch("/api/v1/wallet/balance");
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance);
      }
    } catch (err) {
      console.error("Failed to sync wallet balance", err);
    }
  }, []);

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
    socket.emit('join_matchmaking', { bid_amount: wagerInCents });
  }, [isCustomWager, customWagerInput, selectedWager, walletBalance]);

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
        <span className="text-emerald-400">{playersOnline} ONLINE</span>
      </div>
      <span className="opacity-30">|</span>
      <span>{activeUsers.toLocaleString()} ACTIVE USERS</span>
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
      <WalletConnect minimal />
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

    {/* ── WAGER SECTOR ── */}
    <div className="px-4 pt-4 pb-3 border-b border-brand-border-opacity-5">
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[9px] font-black uppercase text-brand-primary opacity-45 tracking-widest flex items-center gap-1.5">
          <FaCoins className="opacity-60" size={8} />
          {tg('select_wager')}
        </span>
        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wide bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded-full">{tg('commission')}</span>
      </div>

      <div className="relative fade-edges w-full">
        <div
          ref={wagerScrollRef}
          className="flex gap-2.5 overflow-x-auto scrollbar-none py-1.5 px-[calc(50%-42px)] snap-x snap-mandatory"
        >
          {[
            { label: "$1", val: 100 },
            { label: "$5", val: 500 },
            { label: "$10", val: 1000 },
            { label: "$25", val: 2500 },
            { label: "$50", val: 5000 },
            { label: "$100", val: 10000 },
            { label: "$250", val: 25000 },
            { label: "$500", val: 50000 },
            { label: "$1000", val: 100000 }
          ].map((opt) => {
            const isSelected = !isCustomWager && selectedWager === opt.val;
            return (
              <button
                key={opt.val}
                data-active={isSelected ? "true" : "false"}
                onClick={() => {
                  setSelectedWager(opt.val);
                  setIsCustomWager(false);
                  telegramHaptic('light');
                }}
                className={`w-[84px] py-3 rounded-xl shrink-0 flex items-center justify-center border text-[11px] font-black tracking-wide transition-all duration-200 cursor-pointer snap-center ${
                  isSelected
                    ? 'border-brand-primary bg-brand-primary text-brand-void shadow-neon scale-105 font-extrabold'
                    : 'bg-brand-void/50 border-brand-border-opacity-10 text-brand-primary/50 hover:text-brand-primary/80 hover:border-brand-border-opacity-20 hover:scale-105'
                }`}
              >
                {opt.val === 100000 && <FaCrown className="text-[9px] text-yellow-400 mr-0.5 animate-pulse" />}
                {opt.label}
              </button>
            );
          })}
          <button
            data-active={isCustomWager ? "true" : "false"}
            onClick={() => { setIsCustomWager(true); telegramHaptic('light'); }}
            className={`w-[84px] py-3 rounded-xl shrink-0 flex items-center justify-center border text-[11px] font-black tracking-wide transition-all duration-200 cursor-pointer snap-center ${
              isCustomWager
                ? 'border-brand-primary bg-brand-primary text-brand-void shadow-neon scale-105 font-extrabold'
                : 'bg-brand-void/50 border-brand-border-opacity-10 text-brand-primary/50 hover:text-brand-primary/80 hover:border-brand-border-opacity-20 hover:scale-105'
            }`}
          >
            ···
          </button>
        </div>
      </div>

      {isCustomWager && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
          <input
            type="number"
            value={customWagerInput}
            onChange={(e) => setCustomWagerInput(e.target.value)}
            className="w-full text-center px-3 py-2 rounded-xl border border-brand-border-opacity-20 bg-brand-void text-brand-primary text-xs font-black focus:outline-none shadow-inner tracking-wider"
            placeholder={tg('enter_amount')}
          />
        </motion.div>
      )}
    </div>

    {/* ── TIME CONTROL ── */}
    <div className="px-4 pt-3 pb-4">
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[9px] font-black uppercase text-brand-primary opacity-45 tracking-widest flex items-center gap-1.5">
          <FaChessPawn className="opacity-60" size={8} />
          {tg('time_control')}
        </span>
        <span className="text-[9px] font-black text-brand-primary opacity-60">
          {timeControl >= 60 ? `${timeControl / 60} MIN` : `${timeControl}s`}
        </span>
      </div>

      <div className="relative fade-edges w-full">
        <div
          ref={timeScrollRef}
          className="flex gap-2.5 overflow-x-auto scrollbar-none py-1.5 px-[calc(50%-42px)] snap-x snap-mandatory"
        >
          {[
            { label: "1m", val: 60 },
            { label: "3m", val: 180 },
            { label: "5m", val: 300 },
            { label: "10m", val: 600 },
            { label: "15m", val: 900 },
            { label: "30m", val: 1800 },
            { label: "60m", val: 3600 }
          ].map((opt) => {
            const isSelected = timeControl === opt.val;
            return (
              <button
                key={opt.val}
                data-active={isSelected ? "true" : "false"}
                onClick={() => { setTimeControl(opt.val); telegramHaptic('light'); }}
                className={`w-[84px] py-3 rounded-xl shrink-0 flex items-center justify-center border text-[11px] font-black tracking-wide transition-all duration-200 cursor-pointer snap-center ${
                  isSelected
                    ? 'border-brand-primary bg-brand-primary text-brand-void shadow-neon scale-105 font-extrabold'
                    : 'bg-brand-void/50 border-brand-border-opacity-10 text-brand-primary/50 hover:text-brand-primary/80 hover:border-brand-border-opacity-20 hover:scale-105'
                }`}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>

    {/* ── SUMMARY ROW ── */}
    <AnimatePresence>
    {chosenWager > 0 && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mx-3 mb-3 rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-brand-void/40 border border-brand-border-opacity-10 rounded-2xl">
          <div className="flex flex-col">
            <span className="text-[7.5px] font-black text-brand-primary/40 uppercase tracking-widest mb-0.5">Stake</span>
            <span className="text-[11px] font-black text-brand-primary">${(chosenWager / 100).toFixed(2)} USDT</span>
          </div>
          <div className="w-px h-6 bg-brand-border-opacity-10" />
          <div className="flex flex-col items-center">
            <span className="text-[7.5px] font-black text-emerald-400/60 uppercase tracking-widest mb-0.5">Win Up To</span>
            <span className="text-[11px] font-black text-emerald-400">${((chosenWager * 2 * 0.97) / 100).toFixed(2)} USDT</span>
          </div>
          <div className="w-px h-6 bg-brand-border-opacity-10" />
          <button
            onClick={() => setShowRakeInfo(true)}
            className="flex flex-col items-end cursor-pointer bg-transparent border-0"
          >
            <span className="text-[7.5px] font-black text-brand-primary/40 uppercase tracking-widest mb-0.5">Rake</span>
            <span className="text-[11px] font-black text-amber-400">3%</span>
          </button>
        </div>

        {/* Balance check strip */}
        <div className={`mt-1.5 py-1.5 px-3.5 rounded-xl border text-[8.5px] font-bold uppercase tracking-wider flex items-center justify-between transition-all duration-300 ${
          hasSufficient
            ? 'border-emerald-500/10 bg-emerald-500/5 text-emerald-400'
            : 'border-rose-500/10 bg-rose-500/5 text-rose-400'
        }`}>
          <span className="opacity-70">Balance: ${(walletBalance / 100).toFixed(2)}</span>
          {hasSufficient
            ? <span className="flex items-center gap-1">✓ {tg('balance_verified')}</span>
            : <span className="font-black animate-pulse">↑ ${((chosenWager - walletBalance) / 100).toFixed(2)} needed</span>
          }
        </div>
      </motion.div>
    )}
    </AnimatePresence>

    {/* ── LAUNCHER BUTTON ── */}
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
            {hasSufficient ? t('execute_matchmaking') : "TOP UP & PLAY"}
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

  {/* ─── SECONDARY ACTIONS ─── */}
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
        syncBalance={syncBalance}
        onDepositSuccess={(newBalance) => setWalletBalance(newBalance)}
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

function GameContent() {
  const searchParams = useSearchParams();
  const gameId = searchParams?.get("id") || "";

  return gameId ? (
    <ActiveGame key={gameId} gameId={gameId} />
  ) : (
    <PlayLobby />
  );
}

export default function GamePage() {
 const tg = useTranslations('Game');
 return (
 <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-brand-primary opacity-20 font-black uppercase tracking-[0.5em] animate-pulse">{tg('initializing_board')}</div>}>
 <GameContent />
 </Suspense>
 );
}