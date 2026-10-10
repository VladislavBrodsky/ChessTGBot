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
      setShow(heroPassed && !nearFooter && !editing && !workspaceVisible);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    const observer = new ResizeObserver(schedule);
    if (heroActions) observer.observe(heroActions);
    workspaces.forEach((workspace) => observer.observe(workspace));
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
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas px-4 pt-3 transition-transform duration-200 lg:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <PlayButton size="md" className="w-full" />
    </div>
  );
}
