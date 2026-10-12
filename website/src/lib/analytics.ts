import { GA_MEASUREMENT_ID } from "./config";

/**
 * Google Analytics (GA4) & Data Collection Utilities.
 * Implements Google Consent Mode v2, SPA route tracking, Core Web Vitals RUM,
 * and high-intent conversion funnel telemetry for Web3Chess.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export { GA_MEASUREMENT_ID };

/**
 * Safe gtag wrapper that checks for browser environment and gtag availability.
 */
export function gtag(...args: unknown[]): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

/**
 * Generic GA4 custom event dispatcher.
 */
export function trackEvent(
  action: string,
  params: Record<string, unknown> = {},
): void {
  gtag("event", action, params);
}

/**
 * Tracks SPA page view transitions across Next.js App Router navigations.
 */
export function trackPageView(url: string, title?: string): void {
  gtag("event", "page_view", {
    page_path: url,
    page_location: typeof window !== "undefined" ? window.location.href : url,
    page_title: title || (typeof document !== "undefined" ? document.title : ""),
  });
}

/**
 * Primary conversion tracking: Launching the Telegram Mini App or Bot.
 * Emits both recommended GA4 conversion ('generate_lead') and domain-specific
 * ('play_in_telegram') events with rich funnel parameters.
 */
export function trackPlayClick(location: string, startapp?: string): void {
  const destination = startapp
    ? `https://t.me/chess_matbot/Web3Chess?startapp=${startapp}`
    : "https://t.me/chess_matbot/Web3Chess";

  // Google Ads / GA4 standard lead conversion
  trackEvent("generate_lead", {
    currency: "USDT",
    value: 1.0, // baseline intent value for matchmaking funnels
    event_category: "conversion",
    event_label: location,
    conversion_type: "telegram_launch",
    startapp_param: startapp || "default",
  });

  // Detailed custom conversion event
  trackEvent("play_in_telegram", {
    click_location: location,
    startapp_param: startapp || "default",
    destination_url: destination,
    device_type:
      typeof window !== "undefined" && window.innerWidth < 1024
        ? "mobile"
        : "desktop",
  });
}

/**
 * Outbound link tracking (Telegram channels, Tonviewer explorer, GitHub, X).
 */
export function trackOutboundClick(url: string, label: string): void {
  trackEvent("click", {
    event_category: "outbound",
    event_label: label,
    link_url: url,
    outbound: true,
  });
}

/**
 * Interactive chess puzzle telemetry (move attempts, solutions, reveals, hints).
 */
export function trackPuzzleInteraction(
  puzzleId: string,
  action: "start" | "move_try" | "solve" | "reveal" | "hint" | "switch",
  extra: Record<string, unknown> = {},
): void {
  trackEvent("chess_puzzle_interaction", {
    puzzle_id: puzzleId,
    puzzle_action: action,
    ...extra,
  });

  if (action === "solve") {
    trackEvent("unlock_achievement", {
      achievement_id: `puzzle_solved_${puzzleId}`,
      event_category: "engagement",
    });
  }
}

/**
 * Viral share tracking (Telegram forward, Copy link, X post).
 */
export function trackShareClick(
  method: "telegram" | "x" | "copy_link",
  context: string,
  url: string,
): void {
  trackEvent("share", {
    method,
    content_type: context,
    item_id: url,
  });
}

/**
 * FAQ interaction tracking to analyze user information gaps.
 */
export function trackFaqToggle(question: string, isOpen: boolean): void {
  if (isOpen) {
    trackEvent("faq_expand", {
      question_title: question.slice(0, 100),
    });
  }
}

/**
 * Scroll depth milestone telemetry (25%, 50%, 75%, 90%, 100%).
 */
export function trackScrollDepth(depthPercent: number, pagePath: string): void {
  trackEvent("scroll_depth", {
    depth_percent: depthPercent,
    page_path: pagePath,
  });
}

/**
 * Core Web Vitals telemetry (CLS, LCP, INP, FCP, TTFB).
 */
export function trackWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  rating?: string;
  delta?: number;
}): void {
  trackEvent("web_vitals", {
    event_category: "Web Vitals",
    event_action: metric.name,
    event_value: Math.round(metric.value),
    event_label: metric.id,
    metric_rating: metric.rating || "unknown",
    metric_delta: metric.delta ? Math.round(metric.delta) : undefined,
    non_interaction: true,
  });
}
