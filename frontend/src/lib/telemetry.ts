import { apiFetch } from "./api";

interface TelemetryEvent {
  user_id?: number;
  event_type: string;
  event_data?: any;
}

let eventBuffer: TelemetryEvent[] = [];
let flushTimeout: any = null;

const FLUSH_INTERVAL_MS = 10000; // Flush every 10 seconds
const MAX_BUFFER_SIZE = 10;

const getTelegramUserId = (): number | undefined => {
  if (typeof window === 'undefined') return undefined;
  const webAuth = localStorage.getItem('telegram_web_auth');
  if (!webAuth) return undefined;
  try {
    const params = new URLSearchParams(webAuth);
    const userStr = params.get('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
  } catch (e) {
    // Fail silently
  }
  return undefined;
};

export const logTelemetryEvent = (eventType: string, eventData?: any) => {
  const event: TelemetryEvent = {
    user_id: getTelegramUserId(),
    event_type: eventType,
    event_data: eventData || {},
  };

  eventBuffer.push(event);

  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    flushTelemetry();
    return;
  }

  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushTelemetry();
    }, FLUSH_INTERVAL_MS);
  }
};

export const flushTelemetry = async () => {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  if (eventBuffer.length === 0) {
    return;
  }

  const payload = { events: [...eventBuffer] };
  eventBuffer = []; // Clear buffer

  try {
    await apiFetch("/api/v1/telemetry/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Fail silently in client to prevent infinite telemetry error loops
    console.error("Failed to flush telemetry logs to server:", err);
  }
};

// Auto flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    flushTelemetry();
  });
}
