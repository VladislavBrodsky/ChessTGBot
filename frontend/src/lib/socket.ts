import { io, Socket } from "socket.io-client";

// Prevent multiple connections
let socket: Socket;

export const getSocket = () => {
    if (!socket) {
        socket = io("http://localhost:8000", {
            transports: ["websocket"],
            autoConnect: true,
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
