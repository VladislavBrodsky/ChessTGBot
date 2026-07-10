import { useEffect, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { apiFetch } from "@/lib/api";
import { Chess, Move } from "chess.js";
import { logClientMessage } from "@/lib/logger";
import { computeStockfishMove } from "@/lib/stockfishEngine";

export const useGameSocket = (gameId: string) => {
    const [fen, setFen] = useState("start");
    const [chess] = useState(new Chess());
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gameState, setGameState] = useState<any>(null);

    useEffect(() => {
        const socket = getSocket();
        setIsConnected(socket.connected);
        let botMoveTimeout: any = null;

        const onConnect = () => {
            setIsConnected(true);
            socket.emit("join_room", { room: gameId });
        };
        const onDisconnect = () => setIsConnected(false);

        const onGameState = (data: any) => {
            console.log("Game State Received:", data);
            
            logClientMessage(
                "INFO",
                `onGameState received: fen=${data.fen}, turn=${data.turn}, white_player_id=${data.white_player_id}, black_player_id=${data.black_player_id}`
            );

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
                
                botMoveTimeout = setTimeout(async () => {
                    try {
                        const botUci = await computeStockfishMove(data.fen, data.difficulty || "medium");
                        if (botUci) {
                            console.log("Client-side Bot computed move:", botUci);
                            logClientMessage("INFO", `Client-side Bot computed move: ${botUci} for game ${gameId}`);
                            
                            socket.emit("make_move", {
                                game_id: gameId,
                                uci: botUci
                            });
                        }
                    } catch (err: any) {
                        console.error("Stockfish/Minimax execution failed entirely:", err);
                        logClientMessage("WARNING", `Stockfish/Minimax failed entirely: ${err?.message || err}`);
                    }
                }, 800); // 800ms natural delay
            }
        };

        const onError = (data: { message: string }) => {
            setError(data.message);
            setTimeout(() => setError(null), 3000);
            logClientMessage(
                "WARNING",
                `Game socket error event: ${data.message}`
            );
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("game_state", onGameState);
        socket.on("error", onError);

        // Join the room
        if (socket.connected) {
            socket.emit("join_room", { room: gameId });
        }

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("game_state", onGameState);
            socket.off("error", onError);
            if (botMoveTimeout) {
                clearTimeout(botMoveTimeout);
            }
        };
    }, [gameId, chess]);

    const makeMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
        const socket = getSocket();

        try {
            const currentTurn = chess.turn();
            const pieceAtSource = chess.get(move.from as any);
            logClientMessage(
                "INFO",
                `makeMove attempt: move=${JSON.stringify(move)}, turn=${currentTurn}, piece=${JSON.stringify(pieceAtSource)}, fen=${chess.fen()}`
            );
        } catch (err) {}

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

    return { fen, makeMove, isConnected, error, gameState };
};
