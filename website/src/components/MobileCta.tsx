"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PlayButton } from "./PlayButton";

/** Sticky bottom CTA on phones, after the hero scrolls away. Respects the iOS safe area. */
export function MobileCta() {
  const [show, setShow] = useState(false);
  const path = usePathname();

  useEffect(() => {
    let frame = 0;
    const heroActions = document.querySelector<HTMLElement>(
      ".hero-actions, .page-hero-details",
    );
    const footer = document.querySelector("footer");
    const workspaces = Array.from(document.querySelectorAll<HTMLElement>("[data-interactive-workspace]"));
    const inlineCtas = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-track-cta="play_in_telegram"]:not([data-mobile-cta] *)',
      ),
    );
    const mobile = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      if (!mobile.matches) {
        setShow(false);
        return;
      }
      const heroPassed = heroActions
        ? heroActions.getBoundingClientRect().bottom <= 0
        : window.scrollY > 560;
      const nearFooter = footer
        ? footer.getBoundingClientRect().top <= window.innerHeight
        : false;
      const editing = document.activeElement?.matches(
        'input, textarea, select, [contenteditable="true"]',
      );
      const workspaceVisible = workspaces.some((workspace) => {
        const bounds = workspace.getBoundingClientRect();
        return bounds.top < window.innerHeight && bounds.bottom > 0;
      });
      // Do not duplicate CTA when an inline play button is already visible in viewport
      const inlineCtaVisible = inlineCtas.some((btn) => {
        const bounds = btn.getBoundingClientRect();
        return bounds.top < window.innerHeight + 20 && bounds.bottom > -20;
      });
      setShow(heroPassed && !nearFooter && !editing && !workspaceVisible && !inlineCtaVisible);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    const observer = new ResizeObserver(schedule);
    if (heroActions) observer.observe(heroActions);
    workspaces.forEach((workspace) => observer.observe(workspace));
    inlineCtas.forEach((cta) => observer.observe(cta));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
    };
  }, [path]);

  return (
    <div
      data-mobile-cta
      inert={!show}
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/92 backdrop-blur-lg px-4 pt-2.5 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] transition-all duration-300 lg:hidden ${
        show ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <PlayButton trackingLocation="sticky_mobile_dock" size="md" className="w-full" />
    </div>
  );
}
