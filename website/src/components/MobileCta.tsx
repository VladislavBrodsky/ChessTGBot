"use client";

import { useEffect, useState } from "react";
import { PlayButton } from "./PlayButton";

/** Sticky bottom CTA on phones, after the hero scrolls away. Respects the iOS safe area. */
export function MobileCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const nearFooter =
        window.innerHeight + window.scrollY > document.body.offsetHeight - 700;
      setShow(window.scrollY > 560 && !nearFooter);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 px-4 pt-3 transition-transform duration-200 lg:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <PlayButton size="md" className="w-full" />
    </div>
  );
}
