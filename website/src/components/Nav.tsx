"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { PlayButton } from "./PlayButton";
import { home } from "@/content/home";
import { Icon } from "@/icons";

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
      <header className="shell-wide flex h-24 sm:h-28 items-center justify-between gap-4">
        <Link href="/" aria-label="Web3Chess home" className="flex items-center gap-2 transition-transform hover:scale-[1.02]">
          <Logo />
        </Link>
        
        {/* Floating Glassmorphic Nav Pill */}
        <nav aria-label="Main" className="hidden items-center gap-7 rounded-full bg-white/85 backdrop-blur-md px-8 py-3.5 border border-[#c7cbdb]/40 shadow-[0_4px_18px_rgba(32,41,76,0.06)] lg:flex">
          {home.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[15px] font-semibold tracking-tight text-[#20294C]/70 transition-colors duration-150 hover:text-[#20294C]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <PlayButton size="md" label="Play in Telegram" className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="grid size-11 place-items-center rounded-full bg-white text-[#20294C] border border-[#c7cbdb]/50 shadow-[0_2px_8px_rgba(32,41,76,0.08)] lg:hidden"
          >
            <Icon name="list" size={20} />
          </button>
        </div>
      </header>

      {/* Sticky condensed pill */}
      <div
        className={`fixed inset-x-0 top-4 z-40 hidden justify-center transition-all duration-200 lg:flex ${
          stuck ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <nav
          aria-label="Sticky"
          className="flex items-center gap-6 rounded-full bg-white/95 backdrop-blur-md px-7 py-2.5 border border-[#c7cbdb]/60 shadow-[0_8px_25px_rgba(32,41,76,0.12)]"
        >
          <Link href="/" aria-label="Web3Chess home" className="pe-1">
            <Logo />
          </Link>
          {home.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[14px] font-semibold text-[#20294C]/70 transition-colors duration-150 hover:text-[#20294C]"
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
            className="absolute inset-0 bg-[#000000]/60"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-x-0 top-0 rounded-b-[32px] bg-[#e5e5e5] p-6 shadow-none border-b border-[#c6c6c6]"
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid size-11 place-items-center rounded-[8px] bg-white text-[#000000]"
              >
                <Icon name="x" size={20} />
              </button>
            </div>
            <ul className="mt-8 grid gap-2">
              {home.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-14 items-center rounded-[16px] bg-white px-5 font-condensed text-[24px] font-bold uppercase text-[#000000]"
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
