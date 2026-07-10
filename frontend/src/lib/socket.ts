import io from "socket.io-client";

// Prevent multiple connections
let socket: ReturnType<typeof io>;

/**
 * Get the Socket.IO backend URL.
 * Socket.IO needs a direct connection to the backend because Next.js
 * rewrites only proxy HTTP requests, not WebSocket upgrades.
 */
const getSocketUrl = () => {
    if (typeof window !== "undefined") {
        const host = window.location.hostname;
        
        // 1. Hardcoded production fallback
        if (host === "chesstgbot-frontend-production.up.railway.app" || host === "web3chess.online" || host === "www.web3chess.online") {
            return "https://chesstgbot-backend-production.up.railway.app";
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

