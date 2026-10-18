import { useEffect, useState, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { Chess } from "chess.js";
import { logClientMessage } from "@/lib/logger";
import { computeStockfishMove } from "@/lib/stockfishEngine";

export const useGameSocket = (gameId: string) => {
    const [fen, setFen] = useState("start");
    const [chess] = useState(new Chess());
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gameState, setGameState] = useState<any>(null);
    const [wagerConsent, setWagerConsent] = useState<{ wager: number; time_control: number } | null>(null);
    const gameStateRef = useRef<any>(null);
    const acceptedWagerRef = useRef(false);
    const awaitingConsentRef = useRef(false);

    useEffect(() => {
        const socket = getSocket();
        setIsConnected(socket.connected);
        let botMoveTimeout: any = null;
        let joinAttempts = 0;
        const requestState = (force = false) => {
            if (!socket.connected || awaitingConsentRef.current || (!force && gameStateRef.current) || joinAttempts >= 8) return;
            joinAttempts += 1;
            socket.emit("join_room", { room: gameId, ...(acceptedWagerRef.current ? { accept_wager: true } : {}) });
        };

        const onConnect = () => {
            setIsConnected(true);
            joinAttempts = 0;
            requestState(true);
        };
        const onDisconnect = () => {
            setIsConnected(false);
            joinAttempts = 0;
        };

        const onGameState = (data: any) => {
            console.log("Game State Received:", data);
            
            logClientMessage(
                "INFO",
                `onGameState received: fen=${data.fen}, turn=${data.turn}, white_player_id=${data.white_player_id}, black_player_id=${data.black_player_id}`
            );

            gameStateRef.current = data;
            awaitingConsentRef.current = false;
            setWagerConsent(null);
            joinAttempts = 0;
            setGameState(data);
            setFen(data.fen);
            try {
                chess.load(data.fen, { skipValidation: true });
            } catch (e: any) {
                console.error("Invalid FEN:", data.fen);
                logClientMessage(
                    "WARNING",
                    `chess.load failed for FEN: ${data.fen} | error: ${e?.message || e?.toString()}`
                );
            }

            // Client-side Bot move calculation
            const isBotTurn = !data.is_game_over && (
                (data.black_player_id === -1 && data.turn === 'b') ||
                (data.white_player_id === -1 && data.turn === 'w')
            );
            if (isBotTurn) {
                if (botMoveTimeout) {
                    clearTimeout(botMoveTimeout);
                }
                
                // Natural human thinking delay (1.6s - 3.1s) so it feels like a real human ponder
                const humanThinkDelay = Math.floor(Math.random() * 1500) + 1600;
                botMoveTimeout = setTimeout(async () => {
                    try {
                        const botUci = await computeStockfishMove(data.fen, data.difficulty || "hard");
                        if (botUci) {
                            console.log("Opponent computed move:", botUci);
                            logClientMessage("INFO", `Opponent computed move: ${botUci} for game ${gameId}`);
                            
                            socket.emit("make_move", {
                                game_id: gameId,
                                uci: botUci
                            });
                        }
                    } catch {
                        console.error("Stockfish/Minimax execution failed entirely");
                        logClientMessage("WARNING", `Stockfish/Minimax failed entirely`);
                    }
                }, humanThinkDelay);
            }
        };

        const onError = (data: { message: string }) => {
            setError(data.message);
            setTimeout(() => setError(null), 3000);
            if (gameStateRef.current?.fen) {
                try {
                    chess.load(gameStateRef.current.fen, { skipValidation: true });
                    setFen(gameStateRef.current.fen);
                } catch (e) {
                    console.error("Failed to revert FEN on socket error:", e);
                }
            }
            logClientMessage(
                "WARNING",
                `Game socket error event: ${data.message} (board reverted to ${gameStateRef.current?.fen})`
            );
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("game_state", onGameState);
        const onWagerConsent = (data: { game_id: string; wager: number; time_control: number }) => {
            if (data.game_id === gameId && !acceptedWagerRef.current) {
                awaitingConsentRef.current = true;
                setWagerConsent(data);
            }
        };
        socket.on("wager_consent_required", onWagerConsent);
        socket.on("error", onError);

        // Join the room
        requestState();
        // A dropped or missed room reply must not strand a returning player on
        // the loading screen. Retry a bounded number of times while connected.
        const retry = window.setInterval(requestState, 2500);

        return () => {
            window.clearInterval(retry);
            socket.emit("leave_room", { room: gameId });
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("game_state", onGameState);
            socket.off("wager_consent_required", onWagerConsent);
            socket.off("error", onError);
            if (botMoveTimeout) {
                clearTimeout(botMoveTimeout);
            }
        };
    }, [gameId, chess]);

    const acceptWager = useCallback(() => {
        acceptedWagerRef.current = true;
        awaitingConsentRef.current = false;
        getSocket().emit("join_room", { room: gameId, accept_wager: true });
    }, [gameId]);

    const makeMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
        const socket = getSocket();

        try {
            const currentTurn = chess.turn();
            const pieceAtSource = chess.get(move.from as any);
            logClientMessage(
                "INFO",
                `makeMove attempt: move=${JSON.stringify(move)}, turn=${currentTurn}, piece=${JSON.stringify(pieceAtSource)}, fen=${chess.fen()}`
            );
        } catch {}

        // Optimistic Update
        try {
            // Check if it's a valid promotion move
            const piece = chess.get(move.from as any);
            const isPawn = piece && piece.type === "p";
            const isPromotionRank = move.to.endsWith("8") || move.to.endsWith("1");
            const isPromotion = isPawn && isPromotionRank;

            // Check if the move is in the list of legal moves
            const legalMoves = chess.moves({ verbose: true });
            const isLegal = legalMoves.some(
                (m) => m.from === move.from && m.to === move.to
            );
            if (!isLegal) {
                console.warn("Illegal move attempted:", move);
                return false;
            }

            // Construct clean move object
            const cleanMove: any = {
                from: move.from,
                to: move.to
            };
            if (isPromotion) {
                cleanMove.promotion = move.promotion || "q";
            }

            const result = chess.move(cleanMove);
            if (result) {
                setFen(chess.fen()); // Update UI immediately

                // Send to server
                socket.emit("make_move", {
                    game_id: gameId,
                    uci: result.from + result.to + (result.promotion || "")
                });
                return true;
            } else {
                logClientMessage(
                    "WARNING",
                    `chess.move returned falsy for cleanMove: ${JSON.stringify(cleanMove)}`
                );
            }
        } catch (e: any) {
            console.error("Client move error:", e);
            logClientMessage(
                "WARNING",
                `Client move exception for cleanMove on game ${gameId}: ${e?.message || e?.toString()} | move details: from=${move.from}, to=${move.to}`
            );
            return false;
        }
        return false;
    }, [chess, gameId]);

    return { fen, makeMove, isConnected, error, gameState, wagerConsent, acceptWager };
};
