'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
const Chessboard = dynamic(() => import("react-chessboard").then((mod) => mod.Chessboard), { ssr: false });
import { Chess } from "chess.js";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Card } from "@/components/ui/Card";
import { useLocale, useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { 
  FaArrowLeft, FaChevronLeft, FaChevronRight, FaPlay, FaPause, 
  FaFastBackward, FaFastForward, FaRegClock, FaGamepad, FaRobot, FaUser 
} from "react-icons/fa";

function formatUci(uci: string): string {
  if (!uci || uci.length < 4) return uci;
  return `${uci.substring(0, 2)} → ${uci.substring(2, 4)}${uci.substring(4) ? ` (${uci.substring(4)})` : ""}`;
}

function getClassificationLabel(cat: string, lang: string): string {
  const labels: { [key: string]: { [lang: string]: string } } = {
    book: { en: "Book 📖", ru: "Книга 📖" },
    excellent: { en: "Excellent 🟢", ru: "Отлично 🟢" },
    good: { en: "Good 🔵", ru: "Хорошо 🔵" },
    inaccuracy: { en: "Inaccuracy 🟡", ru: "Неточность 🟡" },
    mistake: { en: "Mistake 🟠", ru: "Ошибка 🟠" },
    blunder: { en: "Blunder 🔴", ru: "Зевок 🔴" }
  };
  return labels[cat]?.[lang === 'ru' ? 'ru' : 'en'] || cat;
}

function getClassificationColorClass(cat: string): string {
  switch (cat) {
    case 'book': return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400';
    case 'excellent': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    case 'good': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    case 'inaccuracy': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    case 'mistake': return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
    case 'blunder': return 'bg-red-500/10 border-red-500/20 text-red-400';
    default: return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400';
  }
}

function formatEval(val: number): string {
  if (Math.abs(val) > 50) {
    const mateMoves = 100 - Math.abs(val);
    return val > 0 ? `M${mateMoves}` : `-M${mateMoves}`;
  }
  return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
}

interface GameHistoryDetails {
  game_id: string;
  white_player_id: number;
  black_player_id: number;
  winner: string | null;
  result_type: string;
  white_name: string;
  black_name: string;
  white_elo_before: number;
  white_elo_after: number;
  black_elo_before: number;
  black_elo_after: number;
  total_moves: number;
  final_fen: string | null;
  moves: string[];
  game_type: string;
  ended_at: string;
}

function getChangedSquares(fen1: string, fen2: string): string[] {
  try {
    const c1 = new Chess(fen1);
    const c2 = new Chess(fen2);
    const changed: string[] = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    for (const file of files) {
      for (const rank of ranks) {
        const square = `${file}${rank}`;
        const p1 = c1.get(square as any);
        const p2 = c2.get(square as any);
        if (JSON.stringify(p1) !== JSON.stringify(p2)) {
          changed.push(square);
        }
      }
    }
    return changed;
  } catch (e) {
    console.error("Error comparing FENs", e);
    return [];
  }
}

interface GameReviewClientProps {
  gameId: string;
}

export default function GameReviewClient({ gameId }: GameReviewClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const tg = useTranslations('Game');
  const t = useTranslations('Index');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameData, setGameData] = useState<GameHistoryDetails | null>(null);

  // Reconstructed move history states
  const [fens, setFens] = useState<string[]>(["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"]);
  const [sanMoves, setSanMoves] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // AI Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysis, setAnalysis] = useState<{
    evaluations: number[];
    bestMoves: string[];
    classifications: ('book' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder')[];
  } | null>(null);

  const runAnalysis = async () => {
    if (isAnalyzing || fens.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const workerCode = `importScripts("https://cdn.jsdelivr.net/npm/stockfish@10.0.2/src/stockfish.js");`;
      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      worker.postMessage("uci");
      worker.postMessage("isready");

      const newEvaluations: number[] = [];
      const newBestMoves: string[] = [];

      for (let i = 0; i < fens.length; i++) {
        const fen = fens[i];

        const { evaluation, bestMove } = await new Promise<{ evaluation: number; bestMove: string }>((resolve) => {
          let currentEval = 0;
          let solved = false;

          const onMessage = (e: MessageEvent) => {
            const line = e.data;
            if (typeof line === 'string') {
              if (line.includes("score cp")) {
                const parts = line.split(" ");
                const cpIdx = parts.indexOf("cp");
                if (cpIdx !== -1 && parts[cpIdx + 1]) {
                  const cp = parseInt(parts[cpIdx + 1]);
                  const side = fen.split(" ")[1];
                  currentEval = side === 'w' ? cp / 100 : -cp / 100;
                }
              } else if (line.includes("score mate")) {
                const parts = line.split(" ");
                const mateIdx = parts.indexOf("mate");
                if (mateIdx !== -1 && parts[mateIdx + 1]) {
                  const mate = parseInt(parts[mateIdx + 1]);
                  const side = fen.split(" ")[1];
                  const score = mate > 0 ? 100 - mate : -100 - mate;
                  currentEval = side === 'w' ? score : -score;
                }
              }

              if (line.startsWith("bestmove")) {
                solved = true;
                const best = line.split(" ")[1];
                worker.removeEventListener("message", onMessage);
                resolve({ evaluation: currentEval, bestMove: best });
              }
            }
          };

          worker.addEventListener("message", onMessage);
          worker.postMessage(`position fen ${fen}`);
          worker.postMessage("go depth 6");
        });

        newEvaluations.push(evaluation);
        newBestMoves.push(bestMove);
        setAnalysisProgress(Math.round(((i + 1) / fens.length) * 100));
      }

      worker.terminate();

      // Now compute classifications
      const classifications: ('book' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder')[] = [];
      for (let i = 0; i < fens.length; i++) {
        if (i === 0) {
          classifications.push('excellent');
          continue;
        }

        const evalBefore = newEvaluations[i - 1];
        const evalAfter = newEvaluations[i];
        const fenBefore = fens[i - 1];
        const sideToMove = fenBefore.split(" ")[1];

        const delta = sideToMove === 'w' ? (evalAfter - evalBefore) : (evalBefore - evalAfter);

        if (i <= 8 && delta >= -0.3) {
          classifications.push('book');
        } else if (delta >= -0.2) {
          classifications.push('excellent');
        } else if (delta >= -0.5) {
          classifications.push('good');
        } else if (delta >= -1.0) {
          classifications.push('inaccuracy');
        } else if (delta >= -2.0) {
          classifications.push('mistake');
        } else {
          classifications.push('blunder');
        }
      }

      setAnalysis({
        evaluations: newEvaluations,
        bestMoves: newBestMoves,
        classifications
      });
    } catch (err) {
      console.error("Analysis execution failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!gameId) return;

    const fetchGameHistory = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/v1/game/history/${gameId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch game details");
        }
        const data: GameHistoryDetails = await res.json();
        setGameData(data);

        // Reconstruct positions
        const chess = new Chess();
        const fensList = [chess.fen()];
        const sanList: string[] = [];

        for (const move of data.moves) {
          try {
            const from = move.substring(0, 2);
            const to = move.substring(2, 4);
            const promotion = move.substring(4) || undefined;
            const result = chess.move({ from, to, promotion });
            if (result) {
              fensList.push(chess.fen());
              sanList.push(result.san);
            }
          } catch (err) {
            console.error("Error applying move:", move, err);
          }
        }

        setFens(fensList);
        setSanMoves(sanList);
        setCurrentStep(fensList.length - 1); // Start at final position
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchGameHistory();
  }, [gameId]);

  // Handle autoplay
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= fens.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, fens]);

  if (loading) {
    return (
      <LayoutWrapper className="justify-center items-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-black text-brand-primary opacity-40 uppercase tracking-[0.2em]">
            Reconstructing Matrix...
          </span>
        </div>
      </LayoutWrapper>
    );
  }

  if (error || !gameData) {
    return (
      <LayoutWrapper className="justify-center items-center">
        <div className="glass-panel p-6 rounded-2xl border border-brand-rose-opacity-20 bg-brand-surface max-w-sm md:max-w-xl lg:max-w-3xl text-center">
          <span className="text-sm font-black text-rose-400 uppercase tracking-widest block mb-2">
            Link Failure
          </span>
          <p className="text-xs text-brand-primary opacity-60 mb-6 uppercase tracking-wider">
            {error || "Unable to locate match history."}
          </p>
          <button
            onClick={() => router.push(`/${locale}/profile`)}
            className="w-full py-3 rounded-xl border border-brand-border-opacity-15 bg-brand-void text-[10px] font-black uppercase tracking-widest text-brand-primary cursor-pointer hover:opacity-80"
          >
            Return to Profile
          </button>
        </div>
      </LayoutWrapper>
    );
  }

  // Helper values
  const totalSteps = fens.length;
  const isWhiteWinner = gameData.winner === 'w';
  const isBlackWinner = gameData.winner === 'b';

  // Format move pairs for review panel
  const movePairs: { index: number; white: string; black?: string }[] = [];
  for (let i = 0; i < sanMoves.length; i += 2) {
    movePairs.push({
      index: Math.floor(i / 2) + 1,
      white: sanMoves[i],
      black: sanMoves[i + 1]
    });
  }

  return (
    <LayoutWrapper className="pb-12 justify-start pt-6">
      {/* Header / Nav */}
      <div className="w-full max-w-sm md:max-w-xl lg:max-w-3xl flex justify-between items-center mb-4 relative z-10 px-2 mx-auto">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push(`/${locale}/profile`)}
          className="html-back-button text-brand-primary opacity-45 hover:opacity-100 transition-opacity flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer bg-transparent border-0"
        >
          <FaArrowLeft />
          <span>{tg('back')}</span>
        </motion.button>
        <div className="flex items-center gap-2 bg-brand-surface px-4 py-1 rounded-full border border-brand-border-opacity-10">
          <FaGamepad className="text-[10px] text-brand-primary opacity-45" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-brand-primary opacity-60 uppercase">
            {gameData.game_type === 'computer' ? "A.I. Training" : "Duel Ledger"}
          </span>
        </div>
      </div>

      {/* Main Review Body */}
      <div className="w-full max-w-sm md:max-w-xl lg:max-w-3xl flex flex-col items-center gap-4 mx-auto">
        
        {/* Opponent Widget (Black) */}
        <Card variant="glass" className={`w-full flex justify-between items-center px-4 py-3 transition-all ${
          isBlackWinner ? 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-brand-border-opacity-10 opacity-70'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-void border border-brand-border-opacity-10 flex items-center justify-center overflow-hidden">
              {gameData.black_player_id === -1 ? (
                <FaRobot className="text-base text-brand-primary opacity-40" />
              ) : (
                <FaUser className="text-sm text-brand-primary opacity-30" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-brand-primary uppercase tracking-tight">
                {gameData.black_name}
              </span>
              <span className="text-[10px] font-medium text-brand-primary opacity-30 uppercase tracking-[0.2em]">
                {gameData.black_elo_before} → {gameData.black_elo_after} ELO
              </span>
            </div>
          </div>
          {isBlackWinner && (
            <span className="px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              Winner
            </span>
          )}
        </Card>

        {/* Board Container */}
        <div className="w-full relative z-20 flex justify-center px-1">
          <div className="w-full p-2 rounded-3xl bg-brand-surface border border-brand-border-opacity-10 shadow-sm overflow-hidden aspect-square">
            <div className="rounded-xl overflow-hidden w-full h-full border border-brand-border-opacity-5 bg-black p-1">
              <Chessboard
                options={{
                  position: fens[currentStep],
                  allowDragging: false,
                  boardOrientation: "white",
                  boardStyle: {
                    borderRadius: "12px",
                    overflow: "hidden",
                  },
                  squareStyles: (() => {
                    if (currentStep > 0) {
                      const prevFen = fens[currentStep - 1];
                      const currentFen = fens[currentStep];
                      const changed = getChangedSquares(prevFen, currentFen);
                      if (changed.length >= 2 && changed.length <= 4) {
                        const styles: { [square: string]: any } = {};
                        for (const sq of changed) {
                          styles[sq] = {
                            backgroundColor: "rgba(255, 255, 51, 0.45)"
                          };
                        }
                        return styles;
                      }
                    }
                    return {};
                  })()
                }}
              />
            </div>
          </div>
        </div>

        {/* Player Widget (White) */}
        <Card variant="glass" className={`w-full flex justify-between items-center px-4 py-3 transition-all ${
          isWhiteWinner ? 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-brand-border-opacity-10 opacity-70'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-void border border-brand-border-opacity-10 flex items-center justify-center overflow-hidden">
              {gameData.white_player_id === -1 ? (
                <FaRobot className="text-base text-brand-primary opacity-40" />
              ) : (
                <FaUser className="text-sm text-brand-primary opacity-30" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-brand-primary uppercase tracking-tight">
                {gameData.white_name}
              </span>
              <span className="text-[10px] font-medium text-brand-primary opacity-30 uppercase tracking-[0.2em]">
                {gameData.white_elo_before} → {gameData.white_elo_after} ELO
              </span>
            </div>
          </div>
          {isWhiteWinner && (
            <span className="px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              Winner
            </span>
          )}
        </Card>

        {/* Control Interface */}
        <div className="w-full flex items-center justify-between px-3 py-2 bg-brand-surface border border-brand-border-opacity-10 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
              disabled={currentStep === 0}
              className="p-2.5 rounded-lg border border-brand-border-opacity-5 hover:bg-brand-void text-brand-primary opacity-60 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
            >
              <FaFastBackward size={10} />
            </button>
            <button
              onClick={() => { setCurrentStep(prev => Math.max(0, prev - 1)); setIsPlaying(false); }}
              disabled={currentStep === 0}
              className="p-2.5 rounded-lg border border-brand-border-opacity-5 hover:bg-brand-void text-brand-primary opacity-60 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
            >
              <FaChevronLeft size={10} />
            </button>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-6 py-2 rounded-xl bg-brand-primary text-brand-void flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:opacity-90 shadow-sm"
          >
            {isPlaying ? (
              <>
                <FaPause size={8} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <FaPlay size={8} />
                <span>Autoplay</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => { setCurrentStep(prev => Math.min(totalSteps - 1, prev + 1)); setIsPlaying(false); }}
              disabled={currentStep === totalSteps - 1}
              className="p-2.5 rounded-lg border border-brand-border-opacity-5 hover:bg-brand-void text-brand-primary opacity-60 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
            >
              <FaChevronRight size={10} />
            </button>
            <button
              onClick={() => { setCurrentStep(totalSteps - 1); setIsPlaying(false); }}
              disabled={currentStep === totalSteps - 1}
              className="p-2.5 rounded-lg border border-brand-border-opacity-5 hover:bg-brand-void text-brand-primary opacity-60 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
            >
              <FaFastForward size={10} />
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="text-[10px] font-black uppercase tracking-widest text-brand-primary opacity-40">
          Move {Math.floor((currentStep + 1) / 2)} / {Math.floor(sanMoves.length / 2)} ({currentStep} / {sanMoves.length} half-moves)
        </div>

        {/* A.I. Analysis Panel */}
        {!analysis && !isAnalyzing && (
          <div className="w-full p-4 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface text-center space-y-3">
            <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest block">
              A.I. Engine Review
            </span>
            <p className="text-[10px] text-brand-primary opacity-60 uppercase tracking-wide">
              Run engine analysis to evaluate move accuracy and discover blunders.
            </p>
            <button
              onClick={runAnalysis}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-premium hover:opacity-90 transition-all border-0"
            >
              ⚡ Run A.I. Game Analysis
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="w-full p-4 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface text-center space-y-3 animate-pulse">
            <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest block">
              Analyzing game moves...
            </span>
            <div className="w-full bg-brand-void rounded-full h-2 overflow-hidden border border-brand-border-opacity-5">
              <div 
                className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 h-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            <span className="text-[10px] font-black text-brand-primary opacity-60 uppercase tracking-widest">
              {analysisProgress}% Complete
            </span>
          </div>
        )}

        {analysis && (
          <Card variant="glass" className="w-full border-brand-border-opacity-10 p-4 rounded-2xl flex flex-col space-y-4">
            {/* Current Move Evaluation */}
            {currentStep > 0 && (
              <div className="flex flex-col gap-2 pb-3 border-b border-brand-border-opacity-10">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest">
                    Move Analysis
                  </span>
                  <span className="text-[10px] font-mono font-bold text-brand-primary">
                    Eval: {formatEval(analysis.evaluations[currentStep])}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getClassificationColorClass(analysis.classifications[currentStep])}`}>
                    {getClassificationLabel(analysis.classifications[currentStep], locale)}
                  </span>
                  {(analysis.classifications[currentStep] === 'blunder' || analysis.classifications[currentStep] === 'mistake') && analysis.bestMoves[currentStep - 1] && (
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      💡 Best was: {formatUci(analysis.bestMoves[currentStep - 1])}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Accuracy Standings Summary */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest block">
                Move Accuracy Summary
              </span>
              <div className="grid grid-cols-2 gap-4">
                {/* White stats */}
                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider block border-b border-brand-border-opacity-5 pb-1">
                    {gameData.white_name} (White)
                  </span>
                  {(() => {
                    const whiteStats = { book: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
                    for (let i = 1; i < analysis.classifications.length; i += 2) {
                      whiteStats[analysis.classifications[i]]++;
                    }
                    return (
                      <div className="grid grid-cols-2 gap-y-1 text-[10px] font-bold font-mono">
                        <span className="text-emerald-400">Excellent:</span>
                        <span className="text-right text-brand-primary">{whiteStats.excellent + whiteStats.book}</span>
                        <span className="text-blue-400">Good:</span>
                        <span className="text-right text-brand-primary">{whiteStats.good}</span>
                        <span className="text-yellow-400">Inaccuracy:</span>
                        <span className="text-right text-brand-primary">{whiteStats.inaccuracy}</span>
                        <span className="text-orange-400">Mistake:</span>
                        <span className="text-right text-brand-primary">{whiteStats.mistake}</span>
                        <span className="text-red-400">Blunder:</span>
                        <span className="text-right text-brand-primary">{whiteStats.blunder}</span>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Black stats */}
                <div className="space-y-1.5 text-left border-l border-brand-border-opacity-10 pl-4">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider block border-b border-brand-border-opacity-5 pb-1">
                    {gameData.black_name} (Black)
                  </span>
                  {(() => {
                    const blackStats = { book: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
                    for (let i = 2; i < analysis.classifications.length; i += 2) {
                      blackStats[analysis.classifications[i]]++;
                    }
                    return (
                      <div className="grid grid-cols-2 gap-y-1 text-[10px] font-bold font-mono">
                        <span className="text-emerald-400">Excellent:</span>
                        <span className="text-right text-brand-primary">{blackStats.excellent + blackStats.book}</span>
                        <span className="text-blue-400">Good:</span>
                        <span className="text-right text-brand-primary">{blackStats.good}</span>
                        <span className="text-yellow-400">Inaccuracy:</span>
                        <span className="text-right text-brand-primary">{blackStats.inaccuracy}</span>
                        <span className="text-orange-400">Mistake:</span>
                        <span className="text-right text-brand-primary">{blackStats.mistake}</span>
                        <span className="text-red-400">Blunder:</span>
                        <span className="text-right text-brand-primary">{blackStats.blunder}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Move History Log Panel */}
        <Card variant="glass" className="w-full border-brand-border-opacity-10 p-4 rounded-2xl flex flex-col space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-brand-border-opacity-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary opacity-40">
              Move Ledger
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-primary opacity-30">
              <FaRegClock />
              <span>{new Date(gameData.ended_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="max-h-[140px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
            {movePairs.length === 0 ? (
              <span className="text-[10px] text-brand-primary opacity-30 uppercase block text-center py-4">
                No moves played.
              </span>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {movePairs.map((pair) => {
                  const whiteStepIdx = (pair.index - 1) * 2 + 1;
                  const blackStepIdx = whiteStepIdx + 1;

                  const isWhiteActive = currentStep === whiteStepIdx;
                  const isBlackActive = currentStep === blackStepIdx;

                  return (
                    <div key={pair.index} className="flex items-center text-xs font-mono py-0.5 border-b border-brand-border-opacity-5">
                      <span className="text-brand-primary opacity-30 w-8">{pair.index}.</span>
                      
                      <span
                        onClick={() => { setCurrentStep(whiteStepIdx); setIsPlaying(false); }}
                        className={`cursor-pointer px-1.5 py-0.5 rounded font-bold transition-all hover:bg-brand-void/50 ${
                          isWhiteActive 
                            ? 'bg-brand-primary text-brand-void font-black' 
                            : 'text-brand-primary opacity-70 hover:opacity-100'
                        }`}
                      >
                        {pair.white}
                      </span>

                      {pair.black && (
                        <span
                          onClick={() => { setCurrentStep(blackStepIdx); setIsPlaying(false); }}
                          className={`cursor-pointer px-1.5 py-0.5 rounded font-bold transition-all ml-4 hover:bg-brand-void/50 ${
                            isBlackActive 
                              ? 'bg-brand-primary text-brand-void font-black' 
                              : 'text-brand-primary opacity-70 hover:opacity-100'
                          }`}
                        >
                          {pair.black}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Game termination banner */}
        <div className="w-full text-center px-4 py-3 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface/40">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary opacity-45 block mb-1">
            Termination Detail
          </span>
          <span className="text-xs font-bold text-brand-primary uppercase tracking-tight block">
            {gameData.result_type === 'timeout' 
              ? "Defeated by Clock Expired" 
              : gameData.result_type === 'resignation' 
                ? "Concluded by Resignation" 
                : gameData.result_type === 'draw' 
                  ? "Settled by Mutual Agreement (Draw)" 
                  : "Resolved by Checkmate"}
          </span>
        </div>
      </div>
    </LayoutWrapper>
  );
}
