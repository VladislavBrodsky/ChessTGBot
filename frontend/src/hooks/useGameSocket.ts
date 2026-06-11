import { useEffect, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { Chess, Move } from "chess.js";

export const useGameSocket = (gameId: string) => {
    const [fen, setFen] = useState("start");
    const [chess] = useState(new Chess());
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gameState, setGameState] = useState<any>(null);

    useEffect(() => {
        const socket = getSocket();

        const onConnect = () => {
            setIsConnected(true);
            socket.emit("join_room", { room: gameId });
        };
        const onDisconnect = () => setIsConnected(false);

        const onGameState = (data: any) => {
            console.log("Game State Received:", data);
            
            // Post log to server for diagnostics
            try {
                fetch("/api/v1/client-log", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        level: "INFO",
                        message: `onGameState received: fen=${data.fen}, turn=${data.turn}, white_player_id=${data.white_player_id}, black_player_id=${data.black_player_id}`
                    })
                }).catch(() => {});
            } catch (err) {}

            setGameState(data);
            setFen(data.fen);
            try {
                chess.load(data.fen);
            } catch (e: any) {
                console.error("Invalid FEN:", data.fen);
                try {
                    fetch("/api/v1/client-log", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            level: "ERROR",
                            message: `chess.load failed for FEN: ${data.fen} | error: ${e?.message || e?.toString()}`
                        })
                    }).catch(() => {});
                } catch (err) {}
            }
        };

        const onError = (data: { message: string }) => {
            setError(data.message);
            setTimeout(() => setError(null), 3000);
            try {
                fetch("/api/v1/client-log", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        level: "ERROR",
                        message: `Game socket error event: ${data.message}`
                    })
                }).catch(() => {});
            } catch (err) {}
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
        };
    }, [gameId, chess]);

    const makeMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
        const socket = getSocket();

        // Diagnostic Log
        try {
            const currentTurn = chess.turn();
            const pieceAtSource = chess.get(move.from as any);
            console.log("makeMove attempt:", { move, currentTurn, pieceAtSource, currentFen: chess.fen() });
            fetch("/api/v1/client-log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    level: "INFO",
                    message: `makeMove attempt: move=${JSON.stringify(move)}, turn=${currentTurn}, piece=${JSON.stringify(pieceAtSource)}, fen=${chess.fen()}`
                })
            }).catch(() => {});
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
                try {
                    fetch("/api/v1/client-log", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            level: "WARNING",
                            message: `chess.move returned falsy for cleanMove: ${JSON.stringify(cleanMove)}`
                        })
                    }).catch(() => {});
                } catch (err) {}
            }
        } catch (e: any) {
            console.error("Client move error:", e);
            try {
                fetch("/api/v1/client-log", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        level: "ERROR",
                        message: `Client move exception for cleanMove on game ${gameId}: ${e?.message || e?.toString()} | move details: from=${move.from}, to=${move.to}`
                    })
                }).catch(() => {});
            } catch (err) {}
            return false;
        }
        return false;
    }, [chess, gameId]);

    return { fen, makeMove, isConnected, error, gameState };
};
