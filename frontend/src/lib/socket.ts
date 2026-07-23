import io from "socket.io-client";
import { hasE2ETestIdentity } from "@/lib/e2eTestMode";

// Prevent multiple connections
let socket: ReturnType<typeof io>;

type SocketHandler = (...args: any[]) => void;

const E2E_GAME_ID = "e2e-ai-game";
const E2E_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const E2E_AFTER_AI_REPLY_FEN = "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";

function createE2ETestSocket(): ReturnType<typeof io> {
    const handlers = new Map<string, Set<SocketHandler>>();
    const emitToClient = (event: string, payload: unknown) => {
        handlers.get(event)?.forEach((handler) => handler(payload));
    };
    const gameState = (fen: string, turn: "w" | "b", isGameOver = false) => ({
        game_id: E2E_GAME_ID,
        fen,
        turn,
        // ActiveGame uses this development-only local identity when Telegram
        // is unavailable. Keeping it aligned makes the browser test a real
        // white-player interaction instead of a spectator view.
        white_player_id: 123_456_789,
        black_player_id: -1,
        white_time_left: 600,
        black_time_left: 600,
        time_control_seconds: 600,
        difficulty: "easy",
        move_history: fen === E2E_START_FEN ? [] : ["e2e4", "e7e5"],
        is_game_over: isGameOver,
        status: isGameOver ? "completed" : "active",
        result_type: isGameOver ? "resignation" : null,
        winner_id: isGameOver ? -1 : null,
    });

    const testSocket = {
        connected: true,
        id: "e2e-local-socket",
        auth: {},
        on(event: string, handler: SocketHandler) {
            const listeners = handlers.get(event) || new Set<SocketHandler>();
            listeners.add(handler);
            handlers.set(event, listeners);
            return testSocket;
        },
        off(event: string, handler?: SocketHandler) {
            if (!handler) handlers.delete(event);
            else handlers.get(event)?.delete(handler);
            return testSocket;
        },
        emit(event: string, payload?: { room?: string; game_id?: string; uci?: string }) {
            if (event === "join_room" && payload?.room === E2E_GAME_ID) {
                queueMicrotask(() => emitToClient("game_state", gameState(E2E_START_FEN, "w")));
            }
            if (event === "make_move" && payload?.uci === "e2e4") {
                setTimeout(() => emitToClient("game_state", gameState(E2E_AFTER_AI_REPLY_FEN, "w")), 30);
            }
            if (event === "resign") {
                queueMicrotask(() => emitToClient("game_state", gameState(E2E_AFTER_AI_REPLY_FEN, "w", true)));
            }
            return testSocket;
        },
    };

    return testSocket as unknown as ReturnType<typeof io>;
}

/**
 * Get the Socket.IO backend URL.
 * Socket.IO needs a direct connection to the backend because Next.js
 * rewrites only proxy HTTP requests, not WebSocket upgrades.
 */
const getSocketUrl = () => {
    if (typeof window !== "undefined") {
        const host = window.location.hostname;
        
        // 1. Hardcoded production fallback
        if (host === "chesstgbot-frontend-production.up.railway.app") {
            return "https://chesstgbot-backend-production.up.railway.app";
        }
        if (host === "web3chess.online" || host === "www.web3chess.online") {
            return "https://api.web3chess.online";
        }

        // 2. Dynamic Railway URL resolution (e.g. chesstgbot-frontend-xxx.up.railway.app -> chesstgbot-backend-xxx.up.railway.app)
        if (host.includes("-frontend")) {
            const protocol = window.location.protocol;
            const backendHost = host.replace("-frontend", "-backend");
            return `${protocol}//${backendHost}`;
        }
    }
    return process.env.NEXT_PUBLIC_API_URL || "";
};

export const getSocket = () => {
    if (!socket) {
        if (hasE2ETestIdentity()) {
            socket = createE2ETestSocket();
            return socket;
        }
        const url = getSocketUrl();

        // Retrieve initData from window.Telegram.WebApp (client-side only)
        let initData = "";
        if (typeof window !== "undefined") {
            if (window.Telegram?.WebApp && (window.Telegram.WebApp as any).initData) {
                initData = (window.Telegram.WebApp as any).initData;
            } else {
                initData = localStorage.getItem('telegram_web_auth') || "";
            }
        }

        socket = io(url, {
            transports: ["polling", "websocket"],
            autoConnect: true,
            path: "/socket.io/", // Standard Socket.IO path
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
            auth: {
                initData: initData
            },
            // @ts-ignore
            extraHeaders: {
                "bypass-tunnel-reminder": "true"
            }
        });

        socket.on("connect", () => {
            console.log("Connected to Game Server", socket.id);
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from Game Server");
        });
    }
    
    // Dynamically update initData right before returning the socket instance to ensure fresh auth handshake
    if (socket && typeof window !== "undefined") {
        let freshInitData = "";
        if (window.Telegram?.WebApp && (window.Telegram.WebApp as any).initData) {
            freshInitData = (window.Telegram.WebApp as any).initData;
        } else {
            freshInitData = localStorage.getItem('telegram_web_auth') || "";
        }
        
        if (freshInitData) {
            (socket as any).auth = {
                ...(socket as any).auth,
                initData: freshInitData
            };
        }
    }

    return socket;
};

