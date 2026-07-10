import { apiFetch } from "./api";
import * as Sentry from "@sentry/react";

// Initialize Sentry client-side if DSN is set
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (typeof window !== "undefined" && SENTRY_DSN) {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  } catch (err) {
    console.error("Failed to initialize Sentry:", err);
  }
}

interface LogItem {
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
  timestamp: string;
  url?: string;
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
    url: typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined,
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

/**
 * Report a caught client-side error (render crash, unhandled rejection, global
 * error) to the backend, which forwards ERROR-level client logs to admins.
 * Best-effort and never throws — reporting must not itself cause errors.
 */
export const reportClientError = (error: unknown, context?: string) => {
  try {
    // Report to Sentry
    if (typeof window !== "undefined" && SENTRY_DSN) {
      try {
        Sentry.captureException(error, {
          extra: { context }
        });
      } catch (sentryErr) {
        console.error("Failed to send error to Sentry:", sentryErr);
      }
    }

    const err = error as { message?: string; stack?: string } | undefined;
    const name = context ? `[${context}] ` : "";
    const message = err?.message || String(error);
    // Include a trimmed stack so the alert is actionable, not just "Error".
    const stack = err?.stack ? `\n${err.stack.split("\n").slice(0, 6).join("\n")}` : "";
    logClientMessage("ERROR", `${name}${message}${stack}`.slice(0, 1800));
  } catch {
    // Never let error reporting throw.
  }
};
