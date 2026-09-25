"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { PlayButton } from "./PlayButton";
import { home } from "@/content/home";

export function Nav() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="shell-wide flex items-center justify-between gap-4 py-6">
        <Link href="/" aria-label="Web3Chess home" className="flex items-center gap-2">
          <Logo />
        </Link>
        
        {/* Dayos Centered Floating Pill */}
        <nav aria-label="Main" className="hidden items-center gap-1.5 rounded-[48px] bg-white px-5 py-2 shadow-none lg:flex">
          {home.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-[15px] font-medium text-[#444444] transition-colors duration-150 hover:text-[#000000] hover:bg-[#f3f3f3]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <PlayButton size="sm" label="Play in Telegram" className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="grid size-11 place-items-center rounded-[8px] bg-white text-[#000000] lg:hidden"
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Sticky condensed pill */}
      <div
        className={`fixed inset-x-0 top-4 z-40 hidden justify-center transition-all duration-200 lg:flex ${
          stuck ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <nav
          aria-label="Sticky"
          className="flex items-center gap-3 rounded-[48px] bg-white/95 px-5 py-2 backdrop-blur-md"
        >
          <Link href="/" aria-label="Web3Chess home" className="pe-2">
            <Logo />
          </Link>
          {home.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-[14px] font-medium text-[#444444] transition-colors duration-150 hover:text-[#000000] hover:bg-[#f3f3f3]"
            >
              {item.label}
            </Link>
          ))}
          <PlayButton size="sm" />
        </nav>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-x-0 top-0 rounded-b-panel bg-canvas p-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid size-11 place-items-center rounded-control bg-surface text-icon shadow-control"
              >
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>
            <ul className="mt-6 grid gap-1">
              {home.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-14 items-center text-heading-md text-fg"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <PlayButton size="lg" className="mt-6 w-full" />
          </div>
        </div>
      )}
    </>
  );
}
