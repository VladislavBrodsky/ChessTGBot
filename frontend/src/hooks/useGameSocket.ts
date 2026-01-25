import { useEffect, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { Chess, Move } from "chess.js";

export const useGameSocket = (gameId: string) => {
    const [fen, setFen] = useState("start");
    const [chess] = useState(new Chess());
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const socket = getSocket();

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        const onGameState = (data: { fen: string, last_move?: string }) => {
            console.log("Game State Received:", data);
            setFen(data.fen);
            try {
                chess.load(data.fen);
            } catch (e) {
                console.error("Invalid FEN:", data.fen);
            }
        };

        const onError = (data: { message: string }) => {
            setError(data.message);
            setTimeout(() => setError(null), 3000);
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("game_state", onGameState);
        socket.on("error", onError);

        // Join the room
        if (socket.connected) {
            socket.emit("join_room", { room: gameId });
        } else {
            socket.once("connect", () => {
                socket.emit("join_room", { room: gameId });
            });
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

        // Optimistic Update
        try {
            const result = chess.move(move);
            if (result) {
                setFen(chess.fen()); // Update UI immediately

                // Send to server
                socket.emit("make_move", {
                    game_id: gameId,
                    uci: result.from + result.to + (result.promotion || "")
                });
                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }, [chess, gameId]);

    return { fen, makeMove, isConnected, error };
};
