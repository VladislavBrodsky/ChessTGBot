import { io, Socket } from "socket.io-client";

// Prevent multiple connections
let socket: Socket;

export const getSocket = () => {
    if (!socket) {
        // In production (monolith), we connect to the same origin.
        // In dev, we might need localhost:8000 if running separately.
        const url = process.env.NEXT_PUBLIC_API_URL || "";

        socket = io(url, {
            transports: ["websocket"],
            autoConnect: true,
            path: "/socket.io/", // Standard Socket.IO path
            reconnectionAttempts: 5,
        });

        socket.on("connect", () => {
            console.log("Connected to Game Server", socket.id);
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from Game Server");
        });
    }
    return socket;
};
