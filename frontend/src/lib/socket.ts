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
        if (host === "chesstgbot-frontend-production.up.railway.app") {
            return "https://chesstgbot-backend-production.up.railway.app";
        }
    }
    return process.env.NEXT_PUBLIC_API_URL || "";
};

export const getSocket = () => {
    if (!socket) {
        const url = getSocketUrl();

        // Retrieve initData from window.Telegram.WebApp (client-side only)
        let initData = "";
        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
            initData = (window.Telegram.WebApp as any).initData;
        }

        socket = io(url, {
            transports: ["polling", "websocket"],
            autoConnect: true,
            path: "/socket.io/", // Standard Socket.IO path
            reconnectionAttempts: 5,
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
    if (socket && typeof window !== "undefined" && window.Telegram?.WebApp) {
        const freshInitData = (window.Telegram.WebApp as any).initData || "";
        if (freshInitData) {
            (socket as any).auth = {
                ...(socket as any).auth,
                initData: freshInitData
            };
        }
    }

    return socket;
};

