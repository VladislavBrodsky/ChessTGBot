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
 FaTrophy, FaStar 
} from "react-icons/fa";
import { useLocale, useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import WalletConnect from "@/components/WalletConnect";

interface ActiveGameProps {
 gameId: string;
}

function ActiveGame({ gameId }: ActiveGameProps) {
 // @ts-ignore
 const { fen, makeMove, isConnected, error, gameState } = useGameSocket(gameId);
 const [copied, setCopied] = useState(false);
 const [userId, setUserId] = useState<number | null>(null);
  const locale = useLocale();
  const tg = useTranslations('Game');

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

    socket.on("draw_offered", onDrawOffered);
    return () => {
      socket.off("draw_offered", onDrawOffered);
    };
  }, [gameId, userId, gameState]);

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
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
  setUserId(window.Telegram.WebApp.initDataUnsafe.user.id);
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
 if (window.Telegram?.WebApp) {
 window.Telegram.WebApp.switchInlineQuery(gameId, ["users", "groups", "channels"]);
 } else {
 const link = typeof window !== 'undefined' ? window.location.href : "";
 navigator.clipboard.writeText(link);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }
 };

 const isBotGame = gameState?.black_player_id === -1;
 const isGameOver = gameState?.status === 'completed' || gameState?.status === 'aborted';
 
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
      <span>{tg('back')}</span>
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
 {isConnected ? tg('neural_sync') : tg('isolated')}
 </span>
 </div>
 </div>

 {/* Error Toast */}
 {error && (
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="fixed top-20 left-1/2 -translate-x-1/2 bg-brand-primary text-brand-void px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest z-50 shadow-2xl"
 >
 {error}
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
  {isBotGame ? tg('neural_engine') : tg('opponent_rank')}
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
 <div className="bottom-drawer-backdrop z-50">
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
 <motion.button
 whileTap={{ scale: 0.98 }}
 className="w-full bg-brand-primary text-brand-void py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] cursor-pointer shadow-sm"
 >
 <span>{tg('revenge_match')}</span>
 </motion.button>

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
 const res = await apiFetch(`/api/v1/game/create?type=computer`, {
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

 const chosenWager = isCustomWager 
 ? Math.round(parseFloat(customWagerInput) * 100) 
 : selectedWager;
 
 const hasSufficient = walletBalance >= chosenWager;

 return (
 <LayoutWrapper className="justify-start pt-6 pb-32">
 <div className="w-full max-w-sm flex flex-col items-center px-4 mx-auto space-y-6">
 
 {/* Visual Header */}
 <div className="flex flex-col items-center w-full mb-2">
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex items-center gap-3 text-brand-primary text-3xl font-black tracking-tighter select-none"
 >
 <FaChessKnight className="text-2xl opacity-80" />
 {tg('battle_arena')}
 </motion.div>
 </div>

 {/* Holographic Stats Badge */}
 <div className="flex items-center justify-center gap-4.5 w-full text-[9px] font-black uppercase tracking-widest relative z-10">
 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border-opacity-10 bg-brand-bg-opacity-5 backdrop-blur-md shadow-sm">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
 <span className="text-emerald-400">{tg('players_online_count')}</span>
 </div>
 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border-opacity-10 bg-brand-bg-opacity-5 backdrop-blur-md shadow-sm">
 <span className="text-brand-primary opacity-45">{tg('active_users_label')}:</span>
 <span className="text-brand-primary">{tg('active_users_count')}</span>
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
 <div className="w-full space-y-5">
 
 {/* Connected TON Wallet status block */}
 <WalletConnect />

 {/* Balance Hud and Quick Wager preset picker */}
 <div className="glass-panel p-5 rounded-3xl border border-brand-border-opacity-10 bg-brand-surface shadow-sm space-y-4">
 
 <div className="flex justify-between items-center">
 <div className="flex items-center space-x-2">
 <FaWallet className="text-xs text-brand-primary opacity-60" />
 <span className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-wider">{tg('cyber_balance')}</span>
 </div>
 <Link href={`/${locale}/wallet`}>
 <span className="text-xs font-black text-brand-primary hover:underline cursor-pointer">
 ${(walletBalance / 100).toFixed(2)}
 </span>
 </Link>
 </div>

 <div className="h-px w-full bg-brand-border-opacity-10" />

 {/* Wagers configurationpresets */}
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-[9px] font-black uppercase text-brand-primary opacity-30 tracking-widest">{tg('select_wager')}</span>
 <span className="text-[8px] font-bold text-brand-primary opacity-40 uppercase">{tg('commission')}</span>
 </div>

 <div className="grid grid-cols-4 gap-1.5">
 {[
 { label: "$1", val: 100 },
 { label: "$5", val: 500 },
 { label: "$10", val: 1000 },
 { label: "$50", val: 5000 },
 { label: "$100", val: 10000 },
 { label: "$500", val: 50000 },
 { label: "$1000", val: 100000 }
 ].map((opt) => (
 <button
 key={opt.val}
 onClick={() => {
 setSelectedWager(opt.val);
 setIsCustomWager(false);
 }}
 className={`py-2 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
 (!isCustomWager && selectedWager === opt.val)
 ? 'border-brand-primary bg-brand-primary text-brand-void shadow-sm'
 : 'border-brand-border-opacity-10 bg-brand-void hover:bg-brand-bg-opacity-5 text-brand-primary opacity-60 hover:opacity-100'
 }`}
 >
 {opt.label}
 </button>
 ))}
 <button
 onClick={() => setIsCustomWager(true)}
 className={`py-2 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
 isCustomWager
 ? 'border-brand-primary bg-brand-primary text-brand-void shadow-sm'
 : 'border-brand-border-opacity-10 bg-brand-void hover:bg-brand-bg-opacity-5 text-brand-primary opacity-60 hover:opacity-100'
 }`}
 >
 {tg('other')}
 </button>
 </div>

 {isCustomWager && (
 <div className="flex flex-col space-y-1.5 pt-1.5">
 <label className="text-[8px] font-black text-brand-primary opacity-40 uppercase tracking-widest">{tg('custom_amount')}</label>
 <input
 type="number"
 value={customWagerInput}
 onChange={(e) => setCustomWagerInput(e.target.value)}
 className="cyber-input w-full p-2.5 rounded-lg border border-brand-border-opacity-20 bg-brand-void text-brand-primary text-xs font-bold focus:outline-none"
 placeholder={tg('enter_amount')}
 />
 </div>
 )}
 </div>

 {/* Fund Validation indicators */}
 {chosenWager > 0 && (
 <div className={`p-3 rounded-xl border flex flex-col space-y-1 text-[9px] font-bold uppercase tracking-wider ${
 hasSufficient ? 'border-brand-border-opacity-20 bg-brand-bg-opacity-5 text-brand-primary' : 'border-brand-rose-opacity-20 bg-brand-rose-opacity-10 text-rose-400'
 }`}>
 <div className="flex justify-between">
 <span>{tg('active_wager')}</span>
 <span>${(chosenWager / 100).toFixed(2)}</span>
 </div>
 <div className="flex justify-between border-t border-brand-border-opacity-10 pt-1 mt-1 font-black">
 {hasSufficient ? (
 <span className="text-brand-primary opacity-80">{tg('balance_verified')}</span>
 ) : (
 <span className="text-rose-400 animate-pulse">{tg('insufficient_funds')}</span>
 )}
 </div>
 </div>
 )}

 {matchmakingError && (
 <div className="p-2.5 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-lg text-rose-400 text-[9px] font-bold uppercase tracking-wider text-center">
 {matchmakingError}
 </div>
 )}
 </div>

 {/* Wagers Launch buttons */}
 <div className="w-full flex flex-col space-y-3">
 <motion.button
 whileHover={{ scale: 1.01, y: -2 }}
 whileTap={{ scale: 0.98 }}
 onClick={startMatchmaking}
 disabled={!hasSufficient || isCreating}
 className="w-full h-24 action-button relative overflow-hidden flex flex-col items-center justify-center group shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
 >
 <div className="absolute inset-0 bg-black opacity-[0.03] group-hover:opacity-[0.08] transition-opacity" />
 <div className="relative z-10 flex flex-col items-center gap-1.5">
 <div 
 style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
 className="w-8 h-8 rounded-lg flex items-center justify-center border group-hover:scale-110 transition-all duration-300"
 >
 <FaChessPawn size={14} className="text-current" />
 </div>
 <div className="flex flex-col items-center">
 <span className="text-sm font-black tracking-[0.2em] text-current">{t('execute_matchmaking')}</span>
 </div>
 </div>
 </motion.button>

 <motion.button
 whileHover={{ scale: 1.01 }}
 whileTap={{ scale: 0.99 }}
 onClick={playVsComputer}
 disabled={isCreating}
 className="w-full py-4.5 glass-button text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm"
 >
 <FaRobot className="text-base text-brand-primary opacity-40" />
 <span>{tg('train_ai')}</span>
 </motion.button>
 </div>
 </div>
 )}
 </div>
 </LayoutWrapper>
 );
}

function GameContent() {
 const searchParams = useSearchParams();
 const gameId = searchParams?.get("id") || "";

 return gameId ? (
 <ActiveGame gameId={gameId} />
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
