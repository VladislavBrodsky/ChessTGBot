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

interface ActiveGameProps {
 gameId: string;
}

function ActiveGame({ gameId }: ActiveGameProps) {
 const router = useRouter();
 // @ts-ignore
 const { fen, makeMove, isConnected, error, gameState } = useGameSocket(gameId);
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

  useEffect(() => {
    if (!gameState || gameState.is_game_over) return;

    const interval = setInterval(() => {
      const turn = gameState.turn; // 'w' or 'b'
      if (turn === 'w') {
        setWhiteTime((prev) => Math.max(0, prev - 1));
      } else {
        setBlackTime((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (!gameState) return;
    const socket = getSocket();
    
    const onDrawOffered = (data: { game_id: string; offered_by: number }) => {
      if (data.offered_by !== userId) {
        if (confirm("Your opponent has offered a draw. Do you accept?")) {
          socket.emit("accept_draw", { game_id: gameId });
        }
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
    if (confirm("Are you sure you want to resign this match?")) {
      const socket = getSocket();
      socket.emit("resign", { game_id: gameId });
    }
  };

  const handleOfferDraw = () => {
    if (confirm("Offer a draw to your opponent?")) {
      const socket = getSocket();
      socket.emit("offer_draw", { game_id: gameId });
    }
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

 <div className="flex items-center gap-2 bg-brand-surface px-4 py-1.5 rounded-full border border-brand-border-opacity-10 shadow-sm">
 <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
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
  onMove={makeMove}
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
 <div className="bottom-drawer-backdrop z-[100]">
 {/* Backdrop */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-[rgba(0,0,0,0.4)]"
 />

 {/* Modal Content as slide-up drawer */}
 <motion.div
 initial={{ y: "100%" }}
 animate={{ y: 0 }}
 exit={{ y: "100%" }}
 transition={{ type: "spring", damping: 30, stiffness: 350 }}
 className="bottom-drawer-sheet relative z-10"
 >
 <div className="bottom-drawer-handle" />
 
 <div className="flex flex-col items-center text-center mt-2">
 <h2 className={`text-2xl font-black uppercase tracking-widest mb-1 ${resultColor}`}>
 {matchResultLabel}
 </h2>
 <p className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-[0.3em] mb-6">
 {tg('verification_complete')}
 </p>
 </div>

 <div className="w-full bg-brand-surface rounded-2xl p-5 border border-brand-border-opacity-10 mb-2 space-y-4 shadow-sm">
 <div className="flex justify-between items-center">
 <span className="text-xs font-bold text-brand-primary opacity-60 uppercase tracking-widest">{tg('global_elo')}</span>
 <div className="flex items-baseline gap-2">
 <span className="text-sm font-black text-brand-primary tracking-widest">1000</span>
 <span className={`text-[10px] font-black tracking-widest text-brand-primary`}>
 {eloChange}
 </span>
 </div>
 </div>
 <div className="h-px w-full bg-brand-border-opacity-10" />
 <div className="flex justify-between items-center">
 <span className="text-xs font-bold text-brand-primary opacity-60 uppercase tracking-widest">{tg('net_payout')}</span>
 <div className="flex flex-col items-end">
 <span className="text-sm font-black tracking-widest text-brand-primary">
 {netPayout > 0 ? '+' : ''}{netPayout.toFixed(2)} USDT
 </span>
 {gameState?.wager_amount > 0 && matchResultLabel === tg('victory_secured') && (
  <span className="text-[8px] text-brand-primary opacity-40 uppercase tracking-widest mt-1">
  {tg('platform_rake')}
  </span>
 )}
 </div>
 </div>
 </div>

  <div className="w-full flex flex-col gap-3">
  {rematchStatus === 'waiting' ? (
    <div className="w-full bg-brand-surface py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] border border-brand-border-opacity-10 text-brand-primary animate-pulse select-none">
      <span>Pending Opponent...</span>
    </div>
  ) : (
    <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={() => setShowRematchChoice(true)}
    className="w-full bg-brand-primary text-brand-void py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] cursor-pointer shadow-sm"
    >
    <span>{tg('revenge_match')}</span>
    </motion.button>
  )}

 <div className="grid grid-cols-2 gap-3">
 <Link href={`/${locale}/home`} className="w-full">
 <motion.button
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 className="w-full action-button py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] cursor-pointer shadow-sm"
 >
 <FaRedo />
 <span>{tg('return_hub')}</span>
 </motion.button>
 </Link>
 
 <motion.button
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={shareGame}
 className="w-full glass-panel py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest cursor-pointer shadow-sm"
 >
 <FaShareAlt className="text-brand-primary opacity-60" />
 <span>{tg('share_ledger')}</span>
 </motion.button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

  {/* Rematch Choice Drawer */}
  <AnimatePresence>
  {showRematchChoice && (
  <div className="bottom-drawer-backdrop z-[110]">
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }} 
    onClick={() => setShowRematchChoice(false)}
    className="absolute inset-0 bg-[rgba(0,0,0,0.5)]" 
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
    {tg('revenge_match')}
  </h2>
  <p className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-[0.2em] mb-6">
    {tg('invite_revenge_desc')}
  </p>
  </div>
  
  <div className="w-full flex flex-col gap-3">
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => sendRematchOffer(false)}
      className="w-full bg-brand-primary text-brand-void py-4 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer shadow-sm"
    >
      <span className="text-xs uppercase font-black tracking-[0.2em]">{tg('same_stakes')}</span>
      <span className="text-[9px] font-bold opacity-80">${((gameState?.wager_amount || 0) / 100).toFixed(2)} USDT</span>
    </motion.button>
    
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => sendRematchOffer(true)}
      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-brand-void py-4 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer shadow-sm relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)] -translate-x-full animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
      <span className="text-xs uppercase font-black tracking-[0.2em] flex items-center gap-1">
        {tg('double_stakes_choice')}
      </span>
      <span className="text-[9px] font-bold opacity-90">${(((gameState?.wager_amount || 0) * 2) / 100).toFixed(2)} USDT</span>
    </motion.button>

    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => setShowRematchChoice(false)}
      className="w-full glass-panel py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest cursor-pointer shadow-sm"
    >
      <span>{tg('cancel')}</span>
    </motion.button>
  </div>
  </motion.div>
  </div>
  )}
  </AnimatePresence>

  {/* Incoming Rematch Challenge Drawer */}
  <AnimatePresence>
  {incomingRematch && (
  <div className="bottom-drawer-backdrop z-[110]">
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }} 
    onClick={declineRematch}
    className="absolute inset-0 bg-[rgba(0,0,0,0.5)]" 
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
  <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-orange-400 animate-pulse">
    {tg('rematch_dialog_title')}
  </h2>
  <p className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-[0.2em] mb-6">
    {tg('challenger_offered_rematch', { name: incomingRematch.challenger_name })}
  </p>
  </div>
  
  <div className="w-full bg-brand-surface rounded-2xl p-5 border border-brand-border-opacity-10 mb-4 text-center shadow-sm">
    <span className="text-[8px] font-black text-brand-primary opacity-40 uppercase tracking-widest block mb-1">{tg('proposed_wager')}</span>
    <span className="text-2xl font-black text-brand-primary">
      ${((incomingRematch.wager) / 100).toFixed(2)} USDT
    </span>
    {incomingRematch.double_stakes && (
      <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest block mt-1">{tg('double_stakes_active')}</span>
    )}
  </div>
  
  <div className="w-full flex flex-col gap-3">
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={acceptRematch}
      className="w-full bg-brand-primary text-brand-void py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] cursor-pointer shadow-sm"
    >
      <span>{tg('accept_play')}</span>
    </motion.button>
    
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={declineRematch}
      className="w-full bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 text-rose-400 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest cursor-pointer shadow-sm"
    >
      <span>{tg('decline')}</span>
    </motion.button>
  </div>
  </motion.div>
  </div>
  )}
  </AnimatePresence>
  </LayoutWrapper>
 );
}

function PlayLobby() {
 const t = useTranslations('Index');
 const tg = useTranslations('Game');
 const locale = useLocale();
 const router = useRouter();
 const [tgUser, setTgUser] = useState<any>(null);
 const [stats, setStats] = useState<any>(null);
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

 // Refs for scroll container alignment
 const wagerScrollRef = useRef<HTMLDivElement>(null);
 const timeScrollRef = useRef<HTMLDivElement>(null);

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

 useEffect(() => {
 syncBalance();
 // Init Telegram WebApp Data
 if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
 const tg = window.Telegram.WebApp;
 setTgUser(tg.initDataUnsafe?.user);
 if (tg.initDataUnsafe?.user?.id) {
 apiFetch(`/api/v1/users/sync`, { method: "POST" })
 .then(res => res.json())
 .then(data => setStats(data))
 .catch(err => console.error("Failed to fetch Stats", err));
 }
 } else {
 // Mock Dev
 setTgUser({ first_name: "Master", photo_url: null });
 setStats({ elo: 1250, win_rate: 68.2, wins: 15, losses: 5, draws: 2 });
 }
 }, []);

 const syncBalance = async () => {
 try {
 const res = await apiFetch("/api/v1/wallet/balance");
 if (res.ok) {
 const data = await res.json();
 setWalletBalance(data.balance);
 }
 } catch (err) {
 console.error("Failed to sync wallet balance", err);
 }
 };

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
 };

 socket.on('match_found', onMatchFound);
 socket.on('matchmaking_error', onMatchmakingError);

 return () => {
 socket.off('match_found', onMatchFound);
 socket.off('matchmaking_error', onMatchmakingError);
 };
 }, [locale, router]);

 const startMatchmaking = () => {
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

 setMatchmakingState('searching');
 socket.emit('join_matchmaking', { bid_amount: wagerInCents });
 };

 const cancelMatchmaking = () => {
 const socket = getSocket();
 socket.emit('leave_matchmaking', {});
 setMatchmakingState('idle');
 };

 const playVsComputer = async () => {
 if (isCreating) return;
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
 }
 };

 const playVsFriend = async () => {
 if (isCreating) return;
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
 }
 };

  const shareInviteLink = () => {
    const shareUrl = inviteLink;
    const shareText = `Join my chess match! ♟️\nTime control: ${timeControl / 60} minutes.`;
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.openTelegramLink(fullUrl);
        if (window.Telegram.WebApp.HapticFeedback) {
          try {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
          } catch (e) {}
        }
      } catch (err) {
        console.warn("Telegram openTelegramLink failed", err);
        window.open(fullUrl, '_blank');
      }
    } else {
      window.open(fullUrl, '_blank');
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
  <div className="w-full space-y-4">
  
  {/* Wallet & Balance Dashboard Row */}
  <div className="grid grid-cols-2 gap-3 w-full items-stretch">
    <WalletConnect />
    <Link href={`/${locale}/wallet`} className="block w-full">
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="glass-panel p-2 h-full rounded-2xl border-brand-border-opacity-10 bg-brand-surface flex flex-col justify-center px-4 shadow-sm"
      >
        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-brand-primary opacity-45">
          <FaWallet size={10} className="shrink-0" />
          <span>{tg('cyber_balance')}</span>
        </div>
        <span className="text-xs font-black text-brand-primary tracking-wider mt-0.5">
          ${(walletBalance / 100).toFixed(2)}
        </span>
      </motion.div>
    </Link>
  </div>

  {/* Unified Modern Battle Arena Panel */}
  <div className="glass-panel p-4 rounded-3xl border border-brand-border-opacity-10 bg-brand-surface shadow-premium space-y-5">
    
    {/* SECTION 1: WAGER DIAL */}
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black uppercase text-brand-primary opacity-45 tracking-widest">{tg('select_wager')}</span>
        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wide">{tg('commission')}</span>
      </div>

      {/* Scroll Roller Container */}
      <div className="relative flex items-center w-full">
        {/* Center selector frame overlay */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] rounded-full border border-brand-primary/20 pointer-events-none z-10 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-brand-primary/10 scale-105 animate-pulse" />
          <div className="absolute -top-1 w-1.5 h-1 bg-brand-primary/40 rounded-full" />
          <div className="absolute -bottom-1 w-1.5 h-1 bg-brand-primary/40 rounded-full" />
        </div>

        <div
          ref={wagerScrollRef}
          className="w-full flex gap-4 overflow-x-auto py-3 scrollbar-none snap-x snap-mandatory px-[calc(50%-28px)]"
        >
          {[
            { label: "$1", val: 100, color: "text-emerald-400" },
            { label: "$5", val: 500, color: "text-rose-400" },
            { label: "$10", val: 1000, color: "text-blue-400" },
            { label: "$25", val: 2500, color: "text-cyan-400" },
            { label: "$50", val: 5000, color: "text-slate-300" },
            { label: "$100", val: 10000, color: "text-purple-400" },
            { label: "$250", val: 25000, color: "text-amber-400" },
            { label: "$500", val: 50000, color: "text-orange-400" },
            { label: "$1000", val: 100000, color: "text-yellow-400" }
          ].map((opt) => {
            const isSelected = !isCustomWager && selectedWager === opt.val;
            return (
              <button
                key={opt.val}
                data-active={isSelected ? "true" : "false"}
                onClick={() => {
                  setSelectedWager(opt.val);
                  setIsCustomWager(false);
                }}
                className={`relative w-14 h-14 rounded-full shrink-0 flex flex-col items-center justify-center border transition-all duration-300 snap-center cursor-pointer ${
                  isSelected
                    ? 'border-brand-primary scale-110 shadow-neon bg-brand-elevated text-brand-primary ring-4 ring-brand-primary/15'
                    : 'bg-brand-void/60 border-brand-border-opacity-10 text-brand-primary opacity-60 hover:opacity-100 hover:scale-105'
                }`}
              >
                <div className={`absolute inset-1 rounded-full border border-dashed opacity-10 ${isSelected ? 'border-brand-primary' : 'border-current'}`} />
                <div className="absolute inset-2.5 rounded-full bg-black/20" />
                
                {opt.val === 100000 && <FaCrown className="text-[7px] text-yellow-400 absolute -top-1 animate-bounce" />}
                <span className={`text-[9px] font-black tracking-tight z-10 ${isSelected ? 'text-brand-primary' : opt.color}`}>{opt.label}</span>
              </button>
            );
          })}

          {/* Custom OTHER Chip */}
          <button
            data-active={isCustomWager ? "true" : "false"}
            onClick={() => setIsCustomWager(true)}
            className={`relative w-14 h-14 rounded-full shrink-0 flex flex-col items-center justify-center border transition-all duration-300 snap-center cursor-pointer ${
              isCustomWager
                ? 'border-brand-primary scale-110 shadow-neon bg-brand-elevated text-brand-primary ring-4 ring-brand-primary/15'
                : 'bg-brand-void/60 border-brand-border-opacity-10 text-brand-primary opacity-60 hover:opacity-100 hover:scale-105'
            }`}
          >
            <div className="absolute inset-1 rounded-full border border-dashed border-current opacity-10" />
            <div className="absolute inset-2.5 rounded-full bg-black/20" />
            <FaCoins className="text-[8px] z-10 opacity-70 mb-0.5" />
            <span className="text-[8px] font-black tracking-tight z-10 uppercase">{tg('other')}</span>
          </button>
        </div>
      </div>

      {isCustomWager && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col space-y-1 pt-1 max-w-[200px] mx-auto"
        >
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

    {/* SECTION 2: DURATION PICKER */}
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black uppercase text-brand-primary opacity-45 tracking-widest">{tg('time_control')}</span>
      </div>

      {/* Time Scroll Roller Container */}
      <div className="relative flex items-center w-full">
        {/* Center selector frame overlay */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[88px] h-[34px] rounded-full border border-brand-primary/20 pointer-events-none z-10">
          <div className="absolute inset-0 rounded-full border-2 border-brand-primary/10 scale-105 animate-pulse" />
        </div>

        <div
          ref={timeScrollRef}
          className="w-full flex gap-3 overflow-x-auto py-1 scrollbar-none snap-x snap-mandatory px-[calc(50%-40px)]"
        >
          {[
            { label: "1 min", val: 60 },
            { label: "3 min", val: 180 },
            { label: "5 min", val: 300 },
            { label: "10 min", val: 600 },
            { label: "15 min", val: 900 },
            { label: "30 min", val: 1800 },
            { label: "60 min", val: 3600 }
          ].map((opt) => {
            const isSelected = timeControl === opt.val;
            return (
              <button
                key={opt.val}
                data-active={isSelected ? "true" : "false"}
                onClick={() => setTimeControl(opt.val)}
                className={`w-20 h-8 rounded-full shrink-0 flex items-center justify-center border transition-all duration-300 snap-center cursor-pointer ${
                  isSelected
                    ? 'border-brand-primary bg-brand-primary text-brand-void shadow-neon font-black scale-105'
                    : 'bg-brand-void/60 border-brand-border-opacity-10 text-brand-primary opacity-60 hover:opacity-100'
                }`}
              >
                <span className="text-[9px] uppercase tracking-wider">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>

    {/* SECTION 3: LAUNCHER BUTTON */}
    <div className="pt-2">
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={startMatchmaking}
        disabled={!hasSufficient || isCreating}
        className={`w-full action-button py-4.5 rounded-2xl flex flex-col items-center justify-center gap-1 group shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative overflow-hidden ${
          chosenWager === 100000 ? 'shadow-[0_0_25px_rgba(234,179,8,0.4)] ring-2 ring-yellow-400/30' : ''
        }`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] -translate-x-full animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        
        <div className="flex items-center gap-2">
          <FaChessKnight size={14} className="text-current animate-bounce" />
          <span className="text-xs font-black tracking-[0.25em] text-current uppercase">{t('execute_matchmaking')}</span>
        </div>

        <div className="text-[8px] font-black tracking-[0.15em] opacity-80 text-current uppercase flex items-center gap-1.5 mt-0.5">
          <span>{timeControl >= 60 ? `${timeControl / 60} MINS` : `${timeControl} SECS`}</span>
          <span className="opacity-40">•</span>
          <span>STAKE: ${(chosenWager / 100).toFixed(2)} USDT</span>
        </div>
      </motion.button>
    </div>

    {/* NEON POT FORECAST BANNER */}
    {chosenWager > 0 && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 animate-pulse-slow shadow-[0_0_15px_rgba(16,185,129,0.25)]"
      >
        <div className="bg-brand-surface rounded-[15px] p-3.5 flex flex-col items-center justify-center text-center relative z-10">
          <span className="text-[8px] font-black tracking-[0.2em] text-emerald-400 uppercase mb-0.5">{tg('potential_pot_reward')}</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-brand-primary tracking-wide">
              ${((chosenWager * 2 * 0.97) / 100).toFixed(2)} USDT
            </span>
            <span className="text-[9px] font-bold text-brand-primary opacity-40">{tg('net_win')}</span>
          </div>
          <button 
            onClick={() => setShowRakeInfo(true)}
            className="mt-1.5 text-[8px] font-bold text-brand-primary opacity-35 hover:opacity-100 uppercase tracking-widest transition-opacity flex items-center gap-1 bg-transparent border-0 cursor-pointer"
          >
            <span>{tg('total_pot_info', { amount: ((chosenWager * 2) / 100).toFixed(2) })}</span>
            <span className="underline">{tg('learn_more')}</span>
          </button>
        </div>
      </motion.div>
    )}

  </div>

  {/* Fund Validation Bar & Matchmaking Errors */}
  <div className="flex flex-col space-y-2 w-full">
    {chosenWager > 0 && (
      <div className={`w-full py-2 px-4 rounded-2xl border text-[9px] font-black uppercase tracking-wider flex items-center justify-between transition-all duration-300 ${
        hasSufficient
          ? 'border-emerald-500/10 bg-emerald-950/10 text-emerald-400'
          : 'border-rose-500/10 bg-rose-950/10 text-rose-400'
      }`}>
        <span className="opacity-60">{tg('active_wager')} ${(chosenWager / 100).toFixed(2)} USDT</span>
        {hasSufficient ? (
          <span>✓ {tg('balance_verified')}</span>
        ) : (
          <span className="animate-pulse">🚨 {tg('insufficient_funds')}</span>
        )}
      </div>
    )}

    {matchmakingError && (
      <div className="p-3 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-2xl text-rose-400 text-[10px] font-black uppercase tracking-wider text-center shadow-sm">
        {matchmakingError}
      </div>
    )}
  </div>

  {/* Train AI & Invite Friend split row */}
  <div className="grid grid-cols-2 gap-3 w-full">
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={playVsComputer}
      disabled={isCreating}
      className="w-full py-3 glass-button text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm"
    >
      <FaRobot className="text-sm text-brand-primary opacity-40" />
      <span>{tg('train_ai')}</span>
    </motion.button>

    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={playVsFriend}
      disabled={isCreating}
      className="w-full py-3 glass-button text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm"
    >
      <FaShareAlt className="text-sm text-brand-primary opacity-40" />
      <span>{tg('play_friend')}</span>
    </motion.button>
  </div>

  </div>
  )}

  {/* Friend Duel Invite Bottom Drawer */}
  <AnimatePresence>
  {showInviteDrawer && (
  <div className="bottom-drawer-backdrop z-[100]">
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }} 
    onClick={() => setShowInviteDrawer(false)}
    className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" 
  />
  <motion.div 
    initial={{ y: "100%" }} 
    animate={{ y: 0 }} 
    exit={{ y: "100%" }} 
    transition={{ type: "spring", damping: 30, stiffness: 350 }}
    className="bottom-drawer-sheet relative z-10"
  >
  <div className="bottom-drawer-handle" />
  
  <div className="flex flex-col items-center text-center mt-2">
  <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-brand-primary">
  {tg('invite_link_title')}
  </h2>
  <p className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-[0.2em] mb-6">
  Send this link to a friend to start the duel
  </p>
  </div>
  
  <div className="w-full bg-brand-surface rounded-2xl p-5 border border-brand-border-opacity-10 mb-4 space-y-4 shadow-sm">
  <div className="w-full py-2 px-3 rounded-xl bg-brand-void border border-brand-border-opacity-10 text-[10px] font-mono text-brand-primary opacity-60 truncate">
  {inviteLink}
  </div>
  </div>
  
  <div className="w-full flex flex-col gap-3">
  <motion.button
  whileTap={{ scale: 0.98 }}
  onClick={shareInviteLink}
  className="w-full bg-brand-primary text-brand-void py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] cursor-pointer shadow-sm"
  >
  <FaShareAlt size={12} />
  <span>{tg('share_invite')}</span>
  </motion.button>
  
  <div className="grid grid-cols-2 gap-3 w-full">
  <motion.button
  whileTap={{ scale: 0.98 }}
  onClick={() => {
  navigator.clipboard.writeText(inviteLink);
  setCopiedLink(true);
  setTimeout(() => setCopiedLink(false), 2000);
  }}
  className="w-full action-button py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] cursor-pointer shadow-sm"
  >
  <span>{copiedLink ? "Copied! ✓" : tg('copy_code')}</span>
  </motion.button>
  
  <motion.button
  whileTap={{ scale: 0.98 }}
  onClick={() => setShowInviteDrawer(false)}
  className="w-full glass-panel py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest cursor-pointer shadow-sm"
  >
  <span>{t('back')}</span>
  </motion.button>
  </div>
  </div>
  </motion.div>
  </div>
  )}
  </AnimatePresence>

  {/* Rake Info Bottom Drawer */}
  <AnimatePresence>
  {showRakeInfo && (
  <div className="bottom-drawer-backdrop z-[100]">
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }} 
    onClick={() => setShowRakeInfo(false)}
    className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" 
  />
  <motion.div 
    initial={{ y: "100%" }} 
    animate={{ y: 0 }} 
    exit={{ y: "100%" }} 
    transition={{ type: "spring", damping: 30, stiffness: 350 }}
    className="bottom-drawer-sheet relative z-10"
  >
  <div className="bottom-drawer-handle" />
  
  <div className="flex flex-col items-center text-center mt-2">
  <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-brand-primary">
    {tg('platform_commission')}
  </h2>
  <p className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-[0.2em] mb-6">
    {tg('sustain_ecosystem')}
  </p>
  </div>
  
  <div className="w-full bg-brand-surface rounded-2xl p-5 border border-brand-border-opacity-10 mb-4 space-y-3.5 shadow-sm text-xs font-bold text-brand-primary/80 leading-relaxed">
    <p>
      {tg('rake_desc1')}
    </p>
    <p>
      {tg('rake_desc2')}
    </p>
    <div className="h-px w-full bg-brand-border-opacity-10 my-2" />
    <p className="text-[10px] text-brand-primary/50 uppercase tracking-wider">
      {tg('where_rake_goes')}
    </p>
    <ul className="list-disc pl-4 space-y-1 text-[11px] text-brand-primary/60">
      <li>{tg('rake_li1')}</li>
      <li>{tg('rake_li2')}</li>
      <li>{tg('rake_li3')}</li>
    </ul>
  </div>
  
  <div className="w-full flex flex-col gap-3">
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => setShowRakeInfo(false)}
      className="w-full bg-brand-primary text-brand-void py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] cursor-pointer shadow-sm"
    >
      <span>{tg('got_it')}</span>
    </motion.button>
  </div>
  </motion.div>
  </div>
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
