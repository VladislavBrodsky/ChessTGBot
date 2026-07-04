import { apiFetch } from "./api";

interface LogItem {
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
  timestamp: string;
}

let logBuffer: LogItem[] = [];
let flushTimeout: any = null;

const FLUSH_INTERVAL_MS = 15000; // Flush every 15 seconds
const MAX_BUFFER_SIZE = 10;      // Max 10 items before force-flush

export const logClientMessage = (level: "INFO" | "WARNING" | "ERROR", message: string) => {
  const item: LogItem = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  logBuffer.push(item);
  
  if (level === "ERROR") {
    console.error(`[Client ERROR] ${message}`);
  } else if (level === "WARNING") {
    console.warn(`[Client WARNING] ${message}`);
  } else {
    console.log(`[Client INFO] ${message}`);
  }

  // Flush immediately if this is an ERROR
  if (level === "ERROR") {
    flushLogs();
    return;
  }

  // Force flush if buffer is getting full
  if (logBuffer.length >= MAX_BUFFER_SIZE) {
    flushLogs();
    return;
  }

  // Schedule periodic flush
  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushLogs();
    }, FLUSH_INTERVAL_MS);
  }
};

export const flushLogs = async () => {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  if (logBuffer.length === 0) {
    return;
  }

  const payload = [...logBuffer];
  logBuffer = []; // Clear buffer

  try {
    await apiFetch("/api/v1/client-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Fail silently in client to prevent infinite errors
    console.error("Failed to flush client logs to server:", err);
  }
};
