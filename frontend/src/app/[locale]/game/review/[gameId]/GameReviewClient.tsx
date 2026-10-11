'use client';

import BoardA11y from '@/components/game/BoardA11y';
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
const Chessboard = dynamic(() => import("react-chessboard").then((mod) => mod.Chessboard), { ssr: false });
import { Chess } from "chess.js";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, BadgeRow, type BadgeVariant } from "@/components/ui/Badge";
import { useLocale, useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { 
  FaChevronLeft, FaChevronRight, FaPlay, FaPause,
  FaFastBackward, FaFastForward, FaRegClock, FaRobot, FaUser
} from "react-icons/fa";

function formatUci(uci: string): string {
  if (!uci || uci.length < 4) return uci;
  return `${uci.substring(0, 2)} → ${uci.substring(2, 4)}${uci.substring(4) ? ` (${uci.substring(4)})` : ""}`;
}

function getClassificationVariant(cat: string): BadgeVariant {
  switch (cat) {
    case 'excellent': return 'emerald';
    case 'good': return 'cyan';
    case 'inaccuracy':
    case 'mistake': return 'amber';
    case 'blunder': return 'rose';
    default: return 'secondary';
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
  const locale = useLocale();
  const tg = useTranslations('Game');
  const ti = useTranslations('Index');
  const classificationLabels = { book: tg('classification_book'), excellent: tg('classification_excellent'), good: tg('classification_good'), inaccuracy: tg('classification_inaccuracy'), mistake: tg('classification_mistake'), blunder: tg('classification_blunder') };

  const [loading, setLoading] = useState(true);
  const [retryAttempt, setRetryAttempt] = useState(0);
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
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    evaluations: number[];
    bestMoves: string[];
    classifications: ('book' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder')[];
  } | null>(null);

  const runAnalysis = async () => {
    if (isAnalyzing || fens.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisError(null);

    let worker: Worker | null = null;
    let workerUrl: string | null = null;
    try {
      const workerCode = `importScripts("https://cdn.jsdelivr.net/npm/stockfish@10.0.2/src/stockfish.js");`;
      const blob = new Blob([workerCode], { type: "application/javascript" });
      workerUrl = URL.createObjectURL(blob);
      const activeWorker = new Worker(workerUrl);
      worker = activeWorker;

      activeWorker.postMessage("uci");
      activeWorker.postMessage("isready");

      const newEvaluations: number[] = [];
      const newBestMoves: string[] = [];

      for (let i = 0; i < fens.length; i++) {
        const fen = fens[i];

        const { evaluation, bestMove } = await new Promise<{ evaluation: number; bestMove: string }>((resolve, reject) => {
          let currentEval = 0;
          const timeout = window.setTimeout(() => fail(), 12000);

          const cleanup = () => {
            window.clearTimeout(timeout);
            activeWorker.removeEventListener('message', onMessage);
            activeWorker.removeEventListener('error', onError);
          };
          const fail = () => {
            cleanup();
            reject(new Error('Engine worker unavailable'));
          };
          const onError = () => fail();

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
                const best = line.split(" ")[1];
                cleanup();
                resolve({ evaluation: currentEval, bestMove: best });
              }
            }
          };

          activeWorker.addEventListener("message", onMessage);
          activeWorker.addEventListener('error', onError);
          activeWorker.postMessage(`position fen ${fen}`);
          activeWorker.postMessage("go depth 6");
        });

        newEvaluations.push(evaluation);
        newBestMoves.push(bestMove);
        setAnalysisProgress(Math.round(((i + 1) / fens.length) * 100));
      }

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
      setAnalysisError(tg('analysis_unavailable'));
    } finally {
      worker?.terminate();
      if (workerUrl) URL.revokeObjectURL(workerUrl);
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!gameId) return;

    const fetchGameHistory = async () => {
      setLoading(true);
      setError(null);
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
  }, [gameId, retryAttempt]);

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

  if (loading || error || !gameData) {
    return <LayoutWrapper>
      <main className="app-page app-page--focused space-y-4">
        <PageHeader title={tg('review_title')} backHref={`/${locale}/profile`} />
        {loading ? <div aria-busy="true" className="space-y-4">
          <Skeleton variant="rectangular" height={64} className="rounded-card" />
          <Skeleton variant="rectangular" className="aspect-square w-full rounded-card" />
          <Skeleton variant="rectangular" height={48} className="rounded-control" />
        </div> : <ErrorState title={ti('load_failed')} message={ti('no_games_logged')} retryLabel={ti('retry')} onRetry={() => setRetryAttempt(value => value + 1)} />}
      </main>
    </LayoutWrapper>;
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
    <LayoutWrapper className="pb-12 justify-start ">
      <div className="app-page">
        <PageHeader title={tg('review_title')} backHref={`/${locale}/profile`} />
      </div>

      {/* Main Review Body */}
      <div className="w-full app-page flex flex-col items-center gap-4 mx-auto">
        
        {/* Opponent Widget (Black) */}
        <Card variant="glass" className={`w-full flex justify-between items-center px-4 py-3 transition-all ${
          isBlackWinner ? 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-brand-border-opacity-10 opacity-70'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-void border border-brand-border-opacity-10 flex items-center justify-center overflow-hidden">
              {gameData.black_player_id === -1 ? (
                <FaRobot className="text-base text-brand-muted" />
              ) : (
                <FaUser className="text-sm text-brand-muted" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-brand-primary normal-case tracking-tight">
                {gameData.black_name}
              </span>
              <span className="text-caption font-medium text-brand-muted normal-case tracking-normal">
                {gameData.black_elo_before} → {gameData.black_elo_after} ELO
              </span>
            </div>
          </div>
          {isBlackWinner && (
            <Badge variant="emerald">{tg('review_winner')}</Badge>
          )}
        </Card>

        {/* Board Container */}
        <div className="w-full relative z-20 flex justify-center px-1">
          <div className="w-full p-2 rounded-3xl bg-brand-surface border border-brand-border-opacity-10 shadow-sm overflow-hidden aspect-square">
            <div className="rounded-xl overflow-hidden w-full h-full border border-brand-border-opacity-5 bg-[var(--color-brand-elevated)] p-1">
              <BoardA11y><Chessboard
                options={{
                  position: fens[currentStep],
                  allowDragging: false,
                  boardOrientation: "white",
                  darkSquareStyle: { backgroundColor: '#2e3a4e' },
                  lightSquareStyle: { backgroundColor: '#cbd5e1' },
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
              /></BoardA11y>
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
                <FaRobot className="text-base text-brand-muted" />
              ) : (
                <FaUser className="text-sm text-brand-muted" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-brand-primary normal-case tracking-tight">
                {gameData.white_name}
              </span>
              <span className="text-caption font-medium text-brand-muted normal-case tracking-normal">
                {gameData.white_elo_before} → {gameData.white_elo_after} ELO
              </span>
            </div>
          </div>
          {isWhiteWinner && (
            <Badge variant="emerald">{tg('review_winner')}</Badge>
          )}
        </Card>

        {/* Control Interface */}
        <div className="w-full flex items-center justify-between gap-1 px-1 py-2 bg-brand-surface border border-brand-border-opacity-10 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1">
            <button aria-label={tg('review_first')} type="button"
              onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
              disabled={currentStep === 0}
              className="ui-tap-target p-2.5 rounded-lg border border-brand-border-opacity-5 hover:bg-brand-void text-brand-muted disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
            >
              <FaFastBackward size={10} />
            </button>
            <button aria-label={tg('review_previous')} type="button"
              onClick={() => { setCurrentStep(prev => Math.max(0, prev - 1)); setIsPlaying(false); }}
              disabled={currentStep === 0}
              className="ui-tap-target p-2.5 rounded-lg border border-brand-border-opacity-5 hover:bg-brand-void text-brand-muted disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
            >
              <FaChevronLeft size={10} />
            </button>
          </div>

          <button type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="ui-tap-target min-w-0 px-2 py-2 rounded-xl bg-brand-primary text-brand-void flex items-center justify-center gap-2 text-caption font-semibold normal-case tracking-normal cursor-pointer hover:opacity-90 shadow-sm break-words"
          >
            {isPlaying ? (
              <>
                <FaPause size={8} />
                <span>{tg('review_pause')}</span>
              </>
            ) : (
              <>
                <FaPlay size={8} />
                <span>{tg('review_autoplay')}</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1">
            <button aria-label={tg('review_next')} type="button"
              onClick={() => { setCurrentStep(prev => Math.min(totalSteps - 1, prev + 1)); setIsPlaying(false); }}
              disabled={currentStep === totalSteps - 1}
              className="ui-tap-target p-2.5 rounded-lg border border-brand-border-opacity-5 hover:bg-brand-void text-brand-muted disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
            >
              <FaChevronRight size={10} />
            </button>
            <button aria-label={tg('review_last')} type="button"
              onClick={() => { setCurrentStep(totalSteps - 1); setIsPlaying(false); }}
              disabled={currentStep === totalSteps - 1}
              className="ui-tap-target p-2.5 rounded-lg border border-brand-border-opacity-5 hover:bg-brand-void text-brand-muted disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
            >
              <FaFastForward size={10} />
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="text-caption font-semibold normal-case tracking-normal text-brand-muted">
          {tg('review_move_count', { current: Math.ceil(currentStep / 2), total: Math.ceil(sanMoves.length / 2) })}
        </div>

        {/* A.I. Analysis Panel */}
        {!analysis && !isAnalyzing && !analysisError && (
          <div className="w-full p-4 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface text-center space-y-3">
            <span className="text-caption font-semibold text-brand-muted normal-case tracking-normal block">
              {tg('review_engine')}
            </span>
            <p className="text-caption text-brand-muted normal-case tracking-normal">
              {tg('review_engine_description')}
            </p>
            <button type="button"
              onClick={runAnalysis}
              className="ui-tap-target w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-sm font-semibold cursor-pointer shadow-premium transition-colors border-0 flex items-center justify-center gap-2"
            >
              {tg('review_run')}
            </button>
          </div>
        )}

        {analysisError && !isAnalyzing && (
          <ErrorState title={tg('analysis_unavailable')} message={analysisError} onRetry={runAnalysis} retryLabel={ti('retry')} />
        )}

        {isAnalyzing && (
          <div className="w-full p-4 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface text-center space-y-3 animate-pulse">
            <span className="text-caption font-semibold text-brand-muted normal-case tracking-normal block">
              {tg('review_analyzing')}
            </span>
            <div className="w-full bg-brand-void rounded-full h-2 overflow-hidden border border-brand-border-opacity-5">
              <div 
                className="bg-purple-500 h-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            <span className="text-caption font-semibold text-brand-muted normal-case tracking-normal">
              {tg('review_progress', { percent: analysisProgress })}
            </span>
          </div>
        )}

        {analysis && (
          <Card variant="glass" className="w-full border-brand-border-opacity-10 p-4 rounded-2xl flex flex-col space-y-4">
            {/* Current Move Evaluation */}
            {currentStep > 0 && (
              <div className="flex flex-col gap-2 pb-3 border-b border-brand-border-opacity-10">
                <div className="flex justify-between items-center">
                  <span className="text-caption font-semibold text-brand-muted normal-case tracking-normal">
                    {tg('review_analysis')}
                  </span>
                  <span className="text-caption font-mono font-bold text-brand-primary">
                    {tg('review_evaluation')}: <bdi>{formatEval(analysis.evaluations[currentStep])}</bdi>
                  </span>
                </div>
                <BadgeRow>
                  <Badge variant={getClassificationVariant(analysis.classifications[currentStep])}>
                    {classificationLabels[analysis.classifications[currentStep]]}
                  </Badge>
                  {(analysis.classifications[currentStep] === 'blunder' || analysis.classifications[currentStep] === 'mistake') && analysis.bestMoves[currentStep - 1] && (
                    <span className="text-caption font-bold text-amber-400 normal-case tracking-normal">
                      💡 {tg('review_best', { move: formatUci(analysis.bestMoves[currentStep - 1]) })}
                    </span>
                  )}
                </BadgeRow>
              </div>
            )}

            {/* Accuracy Standings Summary */}
            <div className="space-y-3">
              <span className="text-caption font-semibold text-brand-muted normal-case tracking-normal block">
                {tg('review_accuracy')}
              </span>
              <div className="grid grid-cols-2 gap-4">
                {/* White stats */}
                <div className="space-y-1.5 text-start">
                  <span className="text-caption font-semibold text-brand-primary normal-case tracking-normal block border-b border-brand-border-opacity-5 pb-1">
                    {gameData.white_name} ({tg('review_white')})
                  </span>
                  {(() => {
                    const whiteStats = { book: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
                    for (let i = 1; i < analysis.classifications.length; i += 2) {
                      whiteStats[analysis.classifications[i]]++;
                    }
                    return (
                      <div className="grid grid-cols-2 gap-y-1 text-caption font-bold font-mono">
                        <span className="text-emerald-400">{tg('classification_excellent')}:</span>
                        <span className="text-end text-brand-primary">{whiteStats.excellent + whiteStats.book}</span>
                        <span className="text-blue-400">{tg('classification_good')}:</span>
                        <span className="text-end text-brand-primary">{whiteStats.good}</span>
                        <span className="text-yellow-400">{tg('classification_inaccuracy')}:</span>
                        <span className="text-end text-brand-primary">{whiteStats.inaccuracy}</span>
                        <span className="text-orange-400">{tg('classification_mistake')}:</span>
                        <span className="text-end text-brand-primary">{whiteStats.mistake}</span>
                        <span className="text-red-400">{tg('classification_blunder')}:</span>
                        <span className="text-end text-brand-primary">{whiteStats.blunder}</span>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Black stats */}
                <div className="space-y-1.5 text-start border-s border-brand-border-opacity-10 ps-4">
                  <span className="text-caption font-semibold text-brand-primary normal-case tracking-normal block border-b border-brand-border-opacity-5 pb-1">
                    {gameData.black_name} ({tg('review_black')})
                  </span>
                  {(() => {
                    const blackStats = { book: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
                    for (let i = 2; i < analysis.classifications.length; i += 2) {
                      blackStats[analysis.classifications[i]]++;
                    }
                    return (
                      <div className="grid grid-cols-2 gap-y-1 text-caption font-bold font-mono">
                        <span className="text-emerald-400">{tg('classification_excellent')}:</span>
                        <span className="text-end text-brand-primary">{blackStats.excellent + blackStats.book}</span>
                        <span className="text-blue-400">{tg('classification_good')}:</span>
                        <span className="text-end text-brand-primary">{blackStats.good}</span>
                        <span className="text-yellow-400">{tg('classification_inaccuracy')}:</span>
                        <span className="text-end text-brand-primary">{blackStats.inaccuracy}</span>
                        <span className="text-orange-400">{tg('classification_mistake')}:</span>
                        <span className="text-end text-brand-primary">{blackStats.mistake}</span>
                        <span className="text-red-400">{tg('classification_blunder')}:</span>
                        <span className="text-end text-brand-primary">{blackStats.blunder}</span>
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
            <span className="text-caption font-semibold normal-case tracking-normal text-brand-muted">
              {tg('move_history')}
            </span>
            <div className="flex items-center gap-1.5 text-caption font-bold text-brand-muted">
              <FaRegClock />
              <span>{new Date(gameData.ended_at).toLocaleDateString(locale)}</span>
            </div>
          </div>

          <div className="max-h-[140px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
            {movePairs.length === 0 ? (
              <span className="text-caption text-brand-muted normal-case block text-center py-4">
                {tg('review_no_moves')}
              </span>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {movePairs.map((pair) => {
                  const whiteStepIdx = (pair.index - 1) * 2 + 1;
                  const blackStepIdx = whiteStepIdx + 1;

                  const isWhiteActive = currentStep === whiteStepIdx;
                  const isBlackActive = currentStep === blackStepIdx;

                  return (
                    <div key={pair.index} className="flex items-center text-sm font-mono py-0.5 border-b border-brand-border-opacity-5">
                      <span className="text-brand-muted w-8">{pair.index}.</span>
                      
                      <span
                        onClick={() => { setCurrentStep(whiteStepIdx); setIsPlaying(false); }}
                        className={`cursor-pointer px-1.5 py-0.5 rounded font-bold transition-all hover:bg-brand-void/50 ${
                          isWhiteActive 
                            ? 'bg-brand-primary text-brand-void font-semibold'
                            : 'text-brand-muted hover:opacity-100'
                        }`}
                      >
                        {pair.white}
                      </span>

                      {pair.black && (
                        <span
                          onClick={() => { setCurrentStep(blackStepIdx); setIsPlaying(false); }}
                          className={`cursor-pointer px-1.5 py-0.5 rounded font-bold transition-all ml-4 hover:bg-brand-void/50 ${
                            isBlackActive 
                              ? 'bg-brand-primary text-brand-void font-semibold'
                              : 'text-brand-muted hover:opacity-100'
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
          <span className="text-caption font-semibold normal-case tracking-normal text-brand-muted block mb-1">
            {tg('review_result')}
          </span>
          <span className="text-sm font-bold text-brand-primary normal-case tracking-tight block">
            {gameData.result_type === 'timeout' 
              ? tg('review_timeout') 
              : gameData.result_type === 'resignation' 
                ? tg('review_resignation') 
                : gameData.result_type === 'draw' 
                  ? tg('review_draw') 
                  : tg('review_checkmate')}
          </span>
        </div>
      </div>
    </LayoutWrapper>
  );
}
