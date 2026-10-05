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
      <header className="shell-wide flex h-28 sm:h-32 items-center justify-between gap-4">
        <Link href="/" aria-label="Web3Chess home" className="flex items-center gap-2">
          <Logo />
        </Link>
        
        {/* Dayos Centered Floating Pill */}
        <nav aria-label="Main" className="hidden items-center gap-6 rounded-[48px] bg-white px-8 py-3.5 shadow-none lg:flex">
          {home.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[16px] font-medium text-[#444444] transition-colors duration-150 hover:text-[#000000]"
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
            className="grid size-11 place-items-center rounded-[8px] bg-white text-[#000000] lg:hidden"
          >
            <Icon name="list" size={20} />
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
          className="flex items-center gap-6 rounded-[48px] bg-white px-7 py-3 shadow-none border border-[#c6c6c6]/60"
        >
          <Link href="/" aria-label="Web3Chess home" className="pe-1">
            <Logo />
          </Link>
          {home.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[15px] font-medium text-[#444444] transition-colors duration-150 hover:text-[#000000]"
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
