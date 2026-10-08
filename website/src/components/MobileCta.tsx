"use client";

import { useEffect, useState } from "react";
import { PlayButton } from "./PlayButton";

/** Sticky bottom CTA on phones, after the hero scrolls away. Respects the iOS safe area. */
export function MobileCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const nearFooter =
        window.innerHeight + window.scrollY > document.body.offsetHeight - 700;
      const editing = document.activeElement?.matches(
        'input, textarea, select, [contenteditable="true"]',
      );
      setShow(window.scrollY > 560 && !nearFooter && !editing);
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
  }, []);

  return (
    <div
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
