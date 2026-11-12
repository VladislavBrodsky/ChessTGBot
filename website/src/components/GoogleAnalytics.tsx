"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import {
  GA_MEASUREMENT_ID,
  trackScrollDepth,
  trackWebVitals,
  trackEvent,
} from "@/lib/analytics";

/**
 * Core Web Vitals (CWV) reporter streaming RUM metrics directly to GA4.
 */
function AnalyticsWebVitals() {
  useReportWebVitals((metric) => {
    trackWebVitals({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      rating: metric.rating,
    });
  });

  return null;
}

/**
 * Global listener capturing:
 * 1. Declarative data-analytics-label / data-track-cta clicks
 * 2. 25%, 50%, 75%, 90%, 100% scroll depth milestones
 *
 * Page views (including client-side navigations) and outbound link clicks
 * come from GA4 enhanced measurement; tracking them here too would double
 * count them.
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

  // Click delegation for declarative tracking
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
      {/* Global telemetry listeners: CTA attributes, scroll depth */}
      <AnalyticsGlobalListener />

      {/* Core Web Vitals telemetry */}
      <AnalyticsWebVitals />
    </>
  );
}
