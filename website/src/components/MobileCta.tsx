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
    const update = () => {
      const heroPassed = heroActions
        ? heroActions.getBoundingClientRect().bottom <= 0
        : window.scrollY > 560;
      const footer = document.querySelector("footer");
      const nearFooter = footer
        ? footer.getBoundingClientRect().top <= window.innerHeight
        : false;
      const editing = document.activeElement?.matches(
        'input, textarea, select, [contenteditable="true"]',
      );
      setShow(heroPassed && !nearFooter && !editing);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    return () => {
      cancelAnimationFrame(frame);
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
