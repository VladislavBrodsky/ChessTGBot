"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import {
  GA_MEASUREMENT_ID,
  trackPageView,
  trackOutboundClick,
  trackScrollDepth,
  trackWebVitals,
  trackEvent,
} from "@/lib/analytics";

/**
 * Route tracker for Next.js App Router client-side SPA navigation.
 * Fires a page_view event on every URL transition.
 */
function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Avoid double firing on the initial full page load since gtag config fires it
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const search = searchParams?.toString();
    const url = search ? `${pathname}?${search}` : pathname;
    trackPageView(url, document.title);
  }, [pathname, searchParams]);

  return null;
}

/**
 * Core Web Vitals (CWV) reporter streaming RUM metrics directly to GA4.
 */
function AnalyticsWebVitals() {
  useReportWebVitals((metric) => {
    trackWebVitals({
      id: metric.id,
      name: metric.name,
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value,
      ),
      rating: metric.rating,
      delta: metric.delta,
    });
  });

  return null;
}

/**
 * Global listener capturing:
 * 1. Outbound link clicks (t.me, tonviewer, github, x)
 * 2. Declarative data-analytics-label attribute clicks
 * 3. 25%, 50%, 75%, 90% scroll depth milestones
 */
function AnalyticsGlobalListener() {
  const pathname = usePathname();
  const reportedMilestones = useRef<Set<number>>(new Set());

  // Reset scroll milestones on route navigation
  useEffect(() => {
    reportedMilestones.current.clear();
  }, [pathname]);

  // Scroll depth tracking
  useEffect(() => {
    let ticking = false;

    const checkScrollDepth = () => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;

      const currentScroll = window.scrollY;
      const percentage = Math.round((currentScroll / scrollHeight) * 100);

      const milestones = [25, 50, 75, 90, 100];
      for (const milestone of milestones) {
        if (
          percentage >= milestone &&
          !reportedMilestones.current.has(milestone)
        ) {
          reportedMilestones.current.add(milestone);
          trackScrollDepth(milestone, pathname);
        }
      }
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScrollDepth();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // Click delegation for outbound and declarative tracking
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Declarative tracking via data-analytics-label or data-track-cta
      const customEl = target.closest<HTMLElement>(
        "[data-analytics-label], [data-track-cta]",
      );
      if (customEl) {
        const label =
          customEl.getAttribute("data-analytics-label") ||
          customEl.getAttribute("data-track-cta") ||
          "unlabeled";
        const category =
          customEl.getAttribute("data-analytics-category") || "ui_interaction";
        trackEvent(category, {
          event_label: label,
          element_tag: customEl.tagName.toLowerCase(),
        });
      }

      // Outbound link tracking
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const href = anchor.href;
      if (!href || !href.startsWith("http")) return;

      try {
        const url = new URL(href);
        const isExternal =
          url.hostname !== window.location.hostname &&
          !url.hostname.endsWith("web3chess.online");

        if (isExternal) {
          let label = "External Link";
          if (url.hostname === "t.me" || url.hostname.endsWith(".t.me")) {
            label = "Telegram Outbound";
          } else if (url.hostname.includes("tonviewer")) {
            label = "Tonviewer Explorer";
          } else if (url.hostname.includes("github.com")) {
            label = "GitHub Repository";
          } else if (url.hostname.includes("x.com") || url.hostname.includes("twitter.com")) {
            label = "X / Twitter";
          }

          trackOutboundClick(href, label);
        }
      } catch {
        // Ignore invalid URLs
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      {/* SPA route transition tracking wrapped in Suspense boundary */}
      <Suspense fallback={null}>
        <AnalyticsRouteTracker />
      </Suspense>

      {/* Global telemetry listeners: Outbound links, CTA attributes, Scroll depth */}
      <AnalyticsGlobalListener />

      {/* Core Web Vitals telemetry */}
      <AnalyticsWebVitals />
    </>
  );
}
